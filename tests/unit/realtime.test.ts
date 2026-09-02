import { afterEach, describe, expect, it } from 'vitest';
import type { AddressInfo } from 'node:net';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import WebSocket from 'ws';
import { createGame } from '../../src/game';
// The production relay is plain ESM so the same file runs directly in Node and the container.
// @ts-expect-error JavaScript module intentionally has no generated declaration file.
import { createBridgeServer, PLAYER_STORAGE_COLUMNS, ROOM_STORAGE_COLUMNS, ROOM_TTL_MS } from '../../backend/server.mjs';

type RunningServer = ReturnType<typeof createBridgeServer>;
let running: RunningServer | null = null;
let temporaryDirectory: string | null = null;

afterEach(async () => {
  await running?.close();
  running = null;
  if (temporaryDirectory) rmSync(temporaryDirectory, { recursive: true, force: true });
  temporaryDirectory = null;
});

async function start(options: Record<string, unknown> = {}) {
  running = createBridgeServer({ port: 0, dbPath: ':memory:', ...options });
  const address = await running.listen() as AddressInfo;
  return `http://127.0.0.1:${address.port}`;
}

async function json(url: string, init?: RequestInit) {
  const response = await fetch(url, { ...init, headers: init?.body ? { 'Content-Type': 'application/json' } : undefined });
  return { response, body: await response.json() as Record<string, unknown> };
}

async function connectedSocket(url: string) {
  const messages: Array<Record<string, unknown>> = [];
  const socket = new WebSocket(url, { origin: 'http://127.0.0.1:4173' });
  socket.on('message', (data) => messages.push(JSON.parse(data.toString())));
  await new Promise<void>((resolve, reject) => {
    socket.once('open', resolve);
    socket.once('error', reject);
  });
  return { socket, messages };
}

async function waitFor(messages: Array<Record<string, unknown>>, kind: string) {
  for (let index = 0; index < 50; index += 1) {
    const found = messages.find((message) => message.kind === kind);
    if (found) return found;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error(`Timed out waiting for ${kind}`);
}

describe.sequential('product-owned realtime authority', () => {
  it('keeps the default rollback journal required by the single-writer mounted SQLite file', async () => {
    temporaryDirectory = mkdtempSync(join(tmpdir(), 'bridge-realtime-'));
    running = createBridgeServer({ port: 0, dbPath: join(temporaryDirectory, 'rooms.sqlite') });
    await running.listen();
    expect(running.db.prepare('PRAGMA journal_mode').get().journal_mode).toBe('delete');
  });

  it('uses a short code, synchronizes roles, and accepts actions from another client', async () => {
    const base = await start();
    const created = await json(`${base}/rooms`, { method: 'POST', body: JSON.stringify({ state: createGame(57231) }) });
    expect(created.response.status).toBe(201);
    expect(created.body.code).toMatch(/^[A-Z2-9]{5}$/);
    const roomCode = String(created.body.code);
    const joined = await json(`${base}/rooms/${roomCode}/join`, { method: 'POST', body: JSON.stringify({ role: 'signals' }) });

    const host = await connectedSocket(`${base.replace('http', 'ws')}/rooms/${roomCode}/socket?token=${created.body.token}`);
    await waitFor(host.messages, 'hello');
    host.messages.splice(0);
    const crew = await connectedSocket(`${base.replace('http', 'ws')}/rooms/${roomCode}/socket?token=${joined.body.token}`);
    expect((await waitFor(crew.messages, 'hello')).role).toBe('signals');
    expect(((await waitFor(host.messages, 'roles')).roles as Array<{ role: string }>).some((member) => member.role === 'signals')).toBe(true);

    crew.socket.send(JSON.stringify({ kind: 'action', action: { type: 'scan' } }));
    expect((await waitFor(host.messages, 'action')).action).toEqual({ type: 'scan' });
    host.socket.close();
    crew.socket.close();
  });

  it('restores the latest state with the same random reconnect token', async () => {
    const base = await start();
    const created = await json(`${base}/rooms`, { method: 'POST', body: JSON.stringify({ state: createGame(57231) }) });
    const roomCode = String(created.body.code);
    const joined = await json(`${base}/rooms/${roomCode}/join`, { method: 'POST', body: JSON.stringify({ role: 'helm' }) });
    const first = await connectedSocket(`${base.replace('http', 'ws')}/rooms/${roomCode}/socket?token=${joined.body.token}`);
    expect((await waitFor(first.messages, 'hello')).role).toBe('helm');
    first.socket.close();

    const reconnected = await connectedSocket(`${base.replace('http', 'ws')}/rooms/${roomCode}/socket?token=${joined.body.token}`);
    expect((await waitFor(reconnected.messages, 'hello')).state).toEqual(createGame(57231));
    reconnected.socket.close();
  });

  it('@claim:room-expiry sets the exact 20-minute expiry and removes rooms after a configured expiry', async () => {
    const base = await start();
    const before = Date.now();
    const created = await json(`${base}/rooms`, { method: 'POST', body: JSON.stringify({ state: createGame(91) }) });
    const after = Date.now();
    expect(ROOM_TTL_MS).toBe(20 * 60_000);
    expect(Number(created.body.expiresAt)).toBeGreaterThanOrEqual(before + ROOM_TTL_MS);
    expect(Number(created.body.expiresAt)).toBeLessThanOrEqual(after + ROOM_TTL_MS);
    await running?.close();
    running = null;

    const shortBase = await start({ roomTtlMs: 20 });
    const shortCreated = await json(`${shortBase}/rooms`, { method: 'POST', body: JSON.stringify({ state: createGame(92) }) });
    await new Promise((resolve) => setTimeout(resolve, 35));
    expect((await fetch(`${shortBase}/rooms/${shortCreated.body.code}`)).status).toBe(404);
  });

  it('returns 429 with retry guidance for a rapid request burst', async () => {
    const base = await start({ httpLimit: 3 });
    expect((await fetch(`${base}/health`)).status).toBe(200);
    expect((await fetch(`${base}/health`)).status).toBe(200);
    expect((await fetch(`${base}/health`)).status).toBe(200);
    const limited = await fetch(`${base}/health`);
    expect(limited.status).toBe(429);
    expect(limited.headers.get('retry-after')).toBe('60');
  });

  it('@claim:player-capacity permits eight station sessions, including shared stations, then visibly rejects a ninth', async () => {
    const base = await start();
    const created = await json(`${base}/rooms`, { method: 'POST', body: JSON.stringify({ state: createGame(71) }) });
    const roles = ['helm', 'power', 'signals', 'engineering', 'helm', 'power', 'signals', 'engineering'];
    const joinedPlayers: Array<{ role: string; token: string }> = [];
    for (const role of roles) {
      const joined = await json(`${base}/rooms/${created.body.code}/join`, { method: 'POST', body: JSON.stringify({ role }) });
      expect(joined.response.status).toBe(201);
      expect(joined.body.role).toBe(role);
      joinedPlayers.push({ role, token: String(joined.body.token) });
    }
    const ninth = await json(`${base}/rooms/${created.body.code}/join`, { method: 'POST', body: JSON.stringify({ role: 'helm' }) });
    expect(ninth.response.status).toBe(409);
    expect(ninth.body.error).toBe('This room already has eight players.');
    const roomCode = String(created.body.code);
    const host = await connectedSocket(`${base.replace('http', 'ws')}/rooms/${roomCode}/socket?token=${created.body.token}`);
    await waitFor(host.messages, 'hello');
    host.messages.splice(0);
    const actions = [
      { role: 'helm', action: { type: 'heading', value: 15 } },
      { role: 'power', action: { type: 'power', value: 'navigation' } },
      { role: 'signals', action: { type: 'scan' } },
      { role: 'engineering', action: { type: 'glyph', value: 'ring' } },
    ];
    for (const expected of actions) {
      const member = joinedPlayers.find((player) => player.role === expected.role)!;
      const client = await connectedSocket(`${base.replace('http', 'ws')}/rooms/${roomCode}/socket?token=${member.token}`);
      await waitFor(client.messages, 'hello');
      client.socket.send(JSON.stringify({ kind: 'action', action: expected.action }));
      expect((await waitFor(host.messages, 'action')).action).toEqual(expected.action);
      host.messages.splice(0);
      client.socket.close();
    }
    host.socket.close();
  });

  it('@claim:room-storage stores only game progress, station choices, and random reconnect codes', async () => {
    temporaryDirectory = mkdtempSync(join(tmpdir(), 'bridge-storage-'));
    const databasePath = join(temporaryDirectory, 'rooms.sqlite');
    const base = await start({ dbPath: databasePath });
    const created = await json(`${base}/rooms`, { method: 'POST', body: JSON.stringify({ state: createGame(73) }) });
    const joined = await json(`${base}/rooms/${created.body.code}/join`, { method: 'POST', body: JSON.stringify({ role: 'signals' }) });
    expect(created.response.status).toBe(201);
    expect(joined.response.status).toBe(201);
    expect(running?.db.prepare('PRAGMA table_info(rooms)').all().map((row: { name: string }) => row.name)).toEqual(ROOM_STORAGE_COLUMNS);
    expect(running?.db.prepare('PRAGMA table_info(players)').all().map((row: { name: string }) => row.name)).toEqual(PLAYER_STORAGE_COLUMNS);
    const room = running?.db.prepare('SELECT * FROM rooms').get() as Record<string, unknown>;
    const player = running?.db.prepare('SELECT * FROM players').get() as Record<string, unknown>;
    expect(Object.keys(room).sort()).toEqual([...ROOM_STORAGE_COLUMNS].sort());
    expect(Object.keys(player).sort()).toEqual([...PLAYER_STORAGE_COLUMNS].sort());
    expect(JSON.parse(String(room.state))).toEqual(createGame(73));
    expect(player.role).toBe('signals');
    expect(Object.keys({ ...room, ...player }).join(' ')).not.toMatch(/name|email|chat|record/i);
  });

  it('keeps a live room through a product-scoped SQLite authority restart', async () => {
    temporaryDirectory = mkdtempSync(join(tmpdir(), 'bridge-restart-'));
    const databasePath = join(temporaryDirectory, 'rooms.sqlite');
    const base = await start({ dbPath: databasePath });
    const created = await json(`${base}/rooms`, { method: 'POST', body: JSON.stringify({ state: createGame(740) }) });
    const roomCode = String(created.body.code);
    const joined = await json(`${base}/rooms/${roomCode}/join`, { method: 'POST', body: JSON.stringify({ role: 'helm' }) });
    await running?.close();
    running = createBridgeServer({ port: 0, dbPath: databasePath });
    const address = await running.listen() as AddressInfo;
    const restartedBase = `http://127.0.0.1:${address.port}`;
    const restored = await json(`${restartedBase}/rooms/${roomCode}`);
    expect(restored.response.status).toBe(200);
    expect(restored.body.state).toEqual(createGame(740));
    const reconnected = await connectedSocket(`${restartedBase.replace('http', 'ws')}/rooms/${roomCode}/socket?token=${joined.body.token}`);
    expect((await waitFor(reconnected.messages, 'hello')).role).toBe('helm');
    reconnected.socket.close();
  });
});

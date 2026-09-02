import { afterEach, describe, expect, it } from 'vitest';
import type { AddressInfo } from 'node:net';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import WebSocket from 'ws';
import { createGame } from '../../src/game';
// The production relay is plain ESM so the same file runs directly in Node and the container.
// @ts-expect-error JavaScript module intentionally has no generated declaration file.
import { createBridgeServer } from '../../backend/server.mjs';

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
  it('uses the rollback journal required by the single-writer mounted SQLite file', async () => {
    temporaryDirectory = mkdtempSync(join(tmpdir(), 'bridge-realtime-'));
    running = createBridgeServer({ port: 0, dbPath: join(temporaryDirectory, 'rooms.sqlite') });
    await running.listen();
    expect(running.db.prepare('PRAGMA journal_mode').get().journal_mode).toBe('delete');
  });

  it('@claim:cross-device-room uses a short code, synchronizes roles, and accepts actions from another client', async () => {
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

  it('@claim:room-reconnect restores the latest state with the same random token', async () => {
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

  it('@claim:room-expiry expires state server-side after the configured lifetime', async () => {
    const base = await start({ roomTtlMs: 20 });
    const created = await json(`${base}/rooms`, { method: 'POST', body: JSON.stringify({ state: createGame(91) }) });
    await new Promise((resolve) => setTimeout(resolve, 35));
    expect((await fetch(`${base}/rooms/${created.body.code}`)).status).toBe(404);
  });

  it('@claim:rate-limit returns 429 with retry guidance for a rapid request burst', async () => {
    const base = await start({ httpLimit: 3 });
    expect((await fetch(`${base}/health`)).status).toBe(200);
    expect((await fetch(`${base}/health`)).status).toBe(200);
    expect((await fetch(`${base}/health`)).status).toBe(200);
    const limited = await fetch(`${base}/health`);
    expect(limited.status).toBe(429);
    expect(limited.headers.get('retry-after')).toBe('60');
  });
});

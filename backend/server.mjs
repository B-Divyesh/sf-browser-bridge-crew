import { createServer } from 'node:http';
import { randomBytes, randomInt } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { WebSocket, WebSocketServer } from 'ws';

export const ROOM_TTL_MS = 20 * 60_000;
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const ROLES = new Set(['helm', 'power', 'signals', 'engineering']);
const ACTIONS = new Set(['scan', 'heading', 'power', 'glyph', 'clear', 'repair']);
const PROD_ORIGIN = 'https://browser-bridge-crew.sociobot.in';
const BUILD_SHA = process.env.BUILD_SHA || process.env.SOURCE_COMMIT || 'development';

function code() {
  return Array.from({ length: 5 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join('');
}

function token() {
  return randomBytes(24).toString('base64url');
}

function validState(state) {
  return state && typeof state === 'object' && Number.isInteger(state.seed) &&
    ['ready', 'running', 'won', 'lost'].includes(state.phase) &&
    Number.isFinite(state.remainingMs) && state.remainingMs >= 0 && state.remainingMs <= 720_000 &&
    Number.isFinite(state.integrity) && state.integrity >= 0 && state.integrity <= 100 &&
    state.fault && Number.isInteger(state.fault.id);
}

function validAction(action) {
  if (!action || typeof action !== 'object' || !ACTIONS.has(action.type)) return false;
  if (action.type === 'heading') return [-30, -15, 0, 15, 30].includes(action.value);
  if (action.type === 'power') return ['engines', 'life support', 'navigation'].includes(action.value);
  if (action.type === 'glyph') return ['ring', 'wave', 'kite'].includes(action.value);
  return Object.keys(action).length === 1;
}

function actionMatchesRole(action, role) {
  return (role === 'signals' && action.type === 'scan') ||
    (role === 'helm' && action.type === 'heading') ||
    (role === 'power' && action.type === 'power') ||
    (role === 'engineering' && ['glyph', 'clear', 'repair'].includes(action.type));
}

export function createBridgeServer(options = {}) {
  const port = Number(options.port ?? process.env.PORT ?? 8080);
  const dbPath = options.dbPath ?? process.env.DB_PATH ?? '/data/rooms.sqlite';
  const httpLimit = Number(options.httpLimit ?? process.env.HTTP_RATE_LIMIT ?? 90);
  const roomTtlMs = Number(options.roomTtlMs ?? process.env.ROOM_TTL_MS ?? ROOM_TTL_MS);
  if (dbPath !== ':memory:') mkdirSync(dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec(`
    PRAGMA busy_timeout = 10000;
    CREATE TABLE IF NOT EXISTS rooms (
      code TEXT PRIMARY KEY,
      host_token TEXT NOT NULL,
      state TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS players (
      token TEXT PRIMARY KEY,
      room_code TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY(room_code) REFERENCES rooms(code) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS players_room ON players(room_code);
  `);

  const sockets = new Map();
  const requestBuckets = new Map();
  const allowedOrigins = new Set([PROD_ORIGIN, 'http://127.0.0.1:4173', 'http://localhost:4173']);

  const removeExpired = (now = Date.now()) => {
    db.prepare('DELETE FROM players WHERE room_code IN (SELECT code FROM rooms WHERE expires_at <= ?)').run(now);
    db.prepare('DELETE FROM rooms WHERE expires_at <= ?').run(now);
  };

  const getRoom = (roomCode, now = Date.now()) => {
    removeExpired(now);
    const row = db.prepare('SELECT code, host_token, state, created_at, updated_at, expires_at FROM rooms WHERE code = ?').get(roomCode);
    if (!row) return null;
    return { ...row, state: JSON.parse(row.state) };
  };

  const roleList = (roomCode) => {
    const members = [];
    for (const client of sockets.get(roomCode) ?? []) {
      if (client.ws.readyState === WebSocket.OPEN && !members.some((item) => item.token === client.token)) {
        members.push({ token: client.token, role: client.role, connected: true });
      }
    }
    return members.map(({ role, connected }) => ({ role, connected }));
  };

  const broadcast = (roomCode, payload, filter = () => true) => {
    const encoded = JSON.stringify(payload);
    for (const client of sockets.get(roomCode) ?? []) {
      if (client.ws.readyState === WebSocket.OPEN && filter(client)) client.ws.send(encoded);
    }
  };

  const broadcastPresence = (roomCode) => broadcast(roomCode, { kind: 'roles', roles: roleList(roomCode) });

  const headers = (origin) => ({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
    ...(origin && allowedOrigins.has(origin) ? {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      Vary: 'Origin',
    } : {}),
  });

  const respond = (res, status, body, extra = {}) => {
    const encoded = JSON.stringify(body);
    res.writeHead(status, { ...headers(res.req.headers.origin), ...extra, 'Content-Length': Buffer.byteLength(encoded) });
    res.end(encoded);
  };

  const readJson = async (req) => {
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > 16_384) throw new Error('too-large');
      chunks.push(chunk);
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
  };

  const rateLimited = (req) => {
    const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    const address = forwarded || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const bucket = requestBuckets.get(address);
    if (!bucket || now - bucket.started >= 60_000) {
      requestBuckets.set(address, { started: now, count: 1 });
      return false;
    }
    bucket.count += 1;
    return bucket.count > httpLimit;
  };

  const server = createServer(async (req, res) => {
    const origin = req.headers.origin;
    if (origin && !allowedOrigins.has(origin)) return respond(res, 403, { error: 'Origin is not allowed.' });
    if (req.method === 'OPTIONS') {
      res.writeHead(204, headers(origin));
      return res.end();
    }
    if (rateLimited(req)) return respond(res, 429, { error: 'Too many requests. Try again in one minute.' }, { 'Retry-After': '60' });

    const url = new URL(req.url || '/', 'http://realtime.local');
    if (req.method === 'GET' && url.pathname === '/') {
      return respond(res, 200, { service: 'Bridge Crew realtime', status: 'ok', version: '1.1.0', sourceCommit: BUILD_SHA });
    }
    if (req.method === 'GET' && url.pathname === '/health') {
      return respond(res, 200, { service: 'Bridge Crew realtime', status: 'ok', version: '1.1.0', sourceCommit: BUILD_SHA });
    }

    try {
      if (req.method === 'POST' && url.pathname === '/rooms') {
        const body = await readJson(req);
        if (!validState(body.state)) return respond(res, 400, { error: 'A valid initial game state is required.' });
        removeExpired();
        let roomCode = code();
        while (getRoom(roomCode)) roomCode = code();
        const hostToken = token();
        const now = Date.now();
        db.prepare('INSERT INTO rooms VALUES (?, ?, ?, ?, ?, ?)').run(roomCode, hostToken, JSON.stringify(body.state), now, now, now + roomTtlMs);
        return respond(res, 201, { code: roomCode, token: hostToken, state: body.state, expiresAt: now + roomTtlMs });
      }

      const roomMatch = url.pathname.match(/^\/rooms\/([A-Z2-9]{5})$/);
      if (req.method === 'GET' && roomMatch) {
        const room = getRoom(roomMatch[1]);
        if (!room) return respond(res, 404, { error: 'This room is missing or expired.' });
        return respond(res, 200, { code: room.code, state: room.state, expiresAt: room.expires_at, roles: roleList(room.code) });
      }

      const joinMatch = url.pathname.match(/^\/rooms\/([A-Z2-9]{5})\/join$/);
      if (req.method === 'POST' && joinMatch) {
        const room = getRoom(joinMatch[1]);
        if (!room) return respond(res, 404, { error: 'This room is missing or expired.' });
        const body = await readJson(req);
        if (!ROLES.has(body.role)) return respond(res, 400, { error: 'Choose a valid station.' });
        const playerCount = db.prepare('SELECT COUNT(*) AS count FROM players WHERE room_code = ?').get(room.code).count;
        if (playerCount >= 8) return respond(res, 409, { error: 'This room already has eight players.' });
        const playerToken = token();
        db.prepare('INSERT INTO players VALUES (?, ?, ?, ?)').run(playerToken, room.code, body.role, Date.now());
        return respond(res, 201, { code: room.code, token: playerToken, role: body.role, state: room.state, expiresAt: room.expires_at });
      }
    } catch (error) {
      if (error?.message === 'too-large') return respond(res, 413, { error: 'Request body is too large.' });
      if (error instanceof SyntaxError) return respond(res, 400, { error: 'Request body must be valid JSON.' });
      console.error('request failed', error);
      return respond(res, 500, { error: 'The room service could not complete that request.' });
    }
    return respond(res, 404, { error: 'Route not found.' });
  });

  const wss = new WebSocketServer({ noServer: true, maxPayload: 4096, perMessageDeflate: false });
  server.on('upgrade', (req, socket, head) => {
    const origin = req.headers.origin;
    const url = new URL(req.url || '/', 'http://realtime.local');
    const match = url.pathname.match(/^\/rooms\/([A-Z2-9]{5})\/socket$/);
    if (!match || (origin && !allowedOrigins.has(origin))) return socket.destroy();
    const room = getRoom(match[1]);
    const authToken = url.searchParams.get('token') || '';
    if (!room) return socket.destroy();
    let role = 'host';
    if (authToken !== room.host_token) {
      const player = db.prepare('SELECT role FROM players WHERE token = ? AND room_code = ?').get(authToken, room.code);
      if (!player) return socket.destroy();
      role = player.role;
    }
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req, { room, token: authToken, role }));
  });

  wss.on('connection', (ws, _req, auth) => {
    const { room, token: authToken, role } = auth;
    const client = { ws, token: authToken, role, started: Date.now(), count: 0 };
    const roomSockets = sockets.get(room.code) ?? new Set();
    roomSockets.add(client);
    sockets.set(room.code, roomSockets);
    ws.send(JSON.stringify({ kind: 'hello', state: getRoom(room.code).state, role, roles: roleList(room.code), expiresAt: room.expires_at }));
    broadcastPresence(room.code);

    ws.on('message', (raw, isBinary) => {
      const now = Date.now();
      if (now - client.started >= 10_000) {
        client.started = now;
        client.count = 0;
      }
      client.count += 1;
      if (client.count > 80) return ws.close(1008, 'Message rate limit exceeded');
      if (isBinary) return ws.close(1003, 'Text messages only');
      let message;
      try { message = JSON.parse(raw.toString()); } catch { return ws.close(1007, 'Invalid JSON'); }
      if (message.kind === 'ping') return ws.send(JSON.stringify({ kind: 'pong' }));
      if (message.kind === 'action' && role !== 'host' && validAction(message.action) && actionMatchesRole(message.action, role)) {
        return broadcast(room.code, { kind: 'action', action: message.action, role }, (target) => target.role === 'host');
      }
      if (message.kind === 'state' && role === 'host' && validState(message.state)) {
        const expiresAt = Date.now() + roomTtlMs;
        db.prepare('UPDATE rooms SET state = ?, updated_at = ?, expires_at = ? WHERE code = ?').run(JSON.stringify(message.state), Date.now(), expiresAt, room.code);
        return broadcast(room.code, { kind: 'state', state: message.state, expiresAt }, (target) => target !== client);
      }
      ws.close(1008, 'Message is not allowed');
    });

    ws.on('close', () => {
      roomSockets.delete(client);
      if (roomSockets.size === 0) sockets.delete(room.code);
      else broadcastPresence(room.code);
    });
  });

  const cleanup = setInterval(removeExpired, 60_000);
  cleanup.unref();

  return {
    server,
    db,
    listen: () => new Promise((resolve) => server.listen(port, '0.0.0.0', () => resolve(server.address()))),
    close: () => new Promise((resolve, reject) => {
      for (const clients of sockets.values()) for (const client of clients) client.ws.terminate();
      wss.close();
      clearInterval(cleanup);
      server.close((error) => {
        db.close();
        if (error) reject(error); else resolve();
      });
    }),
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const app = createBridgeServer();
  app.listen().then((address) => console.log(JSON.stringify({ service: 'Bridge Crew realtime', address })));
}

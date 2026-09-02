import type { GameState } from './game';

export type RoomRole = 'host' | 'helm' | 'power' | 'signals' | 'engineering';

export interface RoomRecord {
  code: string;
  state: GameState;
  expiresAt: number;
  token?: string;
  role?: RoomRole;
  roles?: Array<{ role: RoomRole; connected: boolean }>;
}

interface RoomMessage {
  kind: 'hello' | 'state' | 'action' | 'roles' | 'pong';
  state?: GameState;
  action?: unknown;
  role?: RoomRole;
  roles?: Array<{ role: RoomRole; connected: boolean }>;
  expiresAt?: number;
}

const configuredEndpoint = import.meta.env.VITE_REALTIME_URL as string | undefined;
export const REALTIME_URL = configuredEndpoint ?? (location.hostname === '127.0.0.1' || location.hostname === 'localhost'
  ? 'ws://127.0.0.1:8787'
  : 'wss://browser-bridge-crew-realtime.sociobot.in');
const HTTP_URL = REALTIME_URL.replace(/^ws/, 'http');

function tokenKey(code: string): string {
  return `bridge:room-token:${code}`;
}

function saveIdentity(room: RoomRecord): void {
  if (!room.token || !room.role) return;
  sessionStorage.setItem(tokenKey(room.code), JSON.stringify({ token: room.token, role: room.role }));
}

export function roomIdentity(code: string): { token: string; role: RoomRole } | null {
  try {
    const identity = JSON.parse(sessionStorage.getItem(tokenKey(code)) ?? 'null');
    if (!identity?.token || !identity?.role) return null;
    return identity;
  } catch {
    return null;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${HTTP_URL}${path}`, {
    ...init,
    headers: init?.body ? { 'Content-Type': 'application/json', ...init.headers } : init?.headers,
  });
  const body = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) throw new Error(body.error ?? 'The room service is unavailable.');
  return body;
}

export async function createRoom(state: GameState): Promise<RoomRecord> {
  const response = await request<RoomRecord & { token: string }>('/rooms', { method: 'POST', body: JSON.stringify({ state }) });
  const room = { ...response, role: 'host' as const };
  saveIdentity(room);
  return room;
}

export async function loadRoom(code: string): Promise<RoomRecord | null> {
  try {
    const room = await request<RoomRecord>(`/rooms/${code.toUpperCase()}`);
    const identity = roomIdentity(room.code);
    return { ...room, ...identity };
  } catch {
    return null;
  }
}

export async function joinRoom(code: string, role: Exclude<RoomRole, 'host'>): Promise<RoomRecord> {
  const room = await request<RoomRecord & { token: string }>(`/rooms/${code.toUpperCase()}/join`, {
    method: 'POST',
    body: JSON.stringify({ role }),
  });
  const joined = { ...room, role };
  saveIdentity(joined);
  return joined;
}

export class RealtimeRoom {
  private socket: WebSocket | null = null;
  private reconnectTimer = 0;
  private attempts = 0;
  private stopped = false;
  private queue: string[] = [];

  constructor(
    private room: RoomRecord,
    private handlers: {
      message: (message: RoomMessage) => void;
      status: (status: 'connecting' | 'connected' | 'reconnecting' | 'closed') => void;
    },
  ) {}

  connect(): void {
    if (!this.room.token || !this.room.role || this.stopped) return;
    this.handlers.status(this.attempts ? 'reconnecting' : 'connecting');
    const url = new URL(`${REALTIME_URL}/rooms/${this.room.code}/socket`);
    url.searchParams.set('token', this.room.token);
    this.socket = new WebSocket(url);
    this.socket.addEventListener('open', () => {
      this.attempts = 0;
      this.handlers.status('connected');
      for (const message of this.queue.splice(0)) this.socket?.send(message);
    });
    this.socket.addEventListener('message', (event) => {
      try { this.handlers.message(JSON.parse(String(event.data)) as RoomMessage); } catch { /* Ignore malformed relay data. */ }
    });
    this.socket.addEventListener('close', (event) => {
      this.socket = null;
      if (this.stopped || event.code === 1008) {
        this.handlers.status('closed');
        return;
      }
      this.attempts += 1;
      this.handlers.status('reconnecting');
      const delay = Math.min(5_000, 300 * 2 ** Math.min(this.attempts, 4));
      this.reconnectTimer = window.setTimeout(() => this.connect(), delay);
    });
  }

  send(payload: unknown): void {
    const encoded = JSON.stringify(payload);
    if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(encoded);
    else this.queue = [...this.queue.slice(-9), encoded];
  }

  close(): void {
    this.stopped = true;
    window.clearTimeout(this.reconnectTimer);
    this.socket?.close(1000, 'Page changed');
    this.handlers.status('closed');
  }
}

import type { GameState } from './game';

const ROOM_TTL = 20 * 60_000;

export interface RoomRecord {
  code: string;
  createdAt: number;
  expiresAt: number;
  state: GameState;
}

export function makeRoomCode(random = Math.random): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 5 }, () => alphabet[Math.floor(random() * alphabet.length)]).join('');
}

export function roomKey(code: string): string {
  return `bridge:room:${code.toUpperCase()}`;
}

export function saveRoom(room: RoomRecord): void {
  localStorage.setItem(roomKey(room.code), JSON.stringify(room));
}

export function createRoom(state: GameState, now = Date.now()): RoomRecord {
  const room = { code: makeRoomCode(), createdAt: now, expiresAt: now + ROOM_TTL, state };
  saveRoom(room);
  return room;
}

export function loadRoom(code: string, now = Date.now()): RoomRecord | null {
  const raw = localStorage.getItem(roomKey(code));
  if (!raw) return null;
  try {
    const room = JSON.parse(raw) as RoomRecord;
    if (room.expiresAt <= now) {
      localStorage.removeItem(roomKey(code));
      return null;
    }
    return room;
  } catch {
    localStorage.removeItem(roomKey(code));
    return null;
  }
}

export function clearExpiredRooms(now = Date.now()): void {
  for (let index = localStorage.length - 1; index >= 0; index -= 1) {
    const key = localStorage.key(index);
    if (!key?.startsWith('bridge:room:')) continue;
    try {
      const room = JSON.parse(localStorage.getItem(key) ?? '') as RoomRecord;
      if (room.expiresAt <= now) localStorage.removeItem(key);
    } catch {
      localStorage.removeItem(key);
    }
  }
}

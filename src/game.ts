export type ModuleName = 'engines' | 'life support' | 'navigation';
export type Glyph = 'ring' | 'wave' | 'kite';
export type GamePhase = 'ready' | 'running' | 'won' | 'lost';

export interface Fault {
  id: number;
  module: ModuleName;
  bearing: number;
  code: Glyph[];
  revealed: boolean;
  limitMs: number;
  ageMs: number;
}

export interface GameState {
  seed: number;
  phase: GamePhase;
  remainingMs: number;
  durationMs: number;
  integrity: number;
  score: number;
  repairs: number;
  attempts: number;
  heading: number;
  routed: ModuleName | null;
  entered: Glyph[];
  fault: Fault;
  assist: boolean;
  muted: boolean;
}

const MODULES: ModuleName[] = ['engines', 'life support', 'navigation'];
const GLYPHS: Glyph[] = ['ring', 'wave', 'kite'];
const BEARINGS = [-30, -15, 0, 15, 30];

function mix(seed: number): number {
  let x = seed >>> 0;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  return x >>> 0;
}

export function createFault(seed: number, id: number, assist = false): Fault {
  let cursor = mix(seed + id * 7919);
  const take = (length: number) => {
    cursor = mix(cursor + 1013);
    return cursor % length;
  };
  const code: Glyph[] = [GLYPHS[take(3)], GLYPHS[take(3)], GLYPHS[take(3)]];
  return {
    id,
    module: MODULES[take(MODULES.length)],
    bearing: BEARINGS[take(BEARINGS.length)],
    code,
    revealed: false,
    limitMs: assist ? 60_000 : Math.max(22_000, 48_000 - id * 750),
    ageMs: 0,
  };
}

export function createGame(seed = 2409, assist = false, durationMs = 12 * 60_000): GameState {
  return {
    seed,
    phase: 'ready',
    remainingMs: durationMs,
    durationMs,
    integrity: 100,
    score: 0,
    repairs: 0,
    attempts: 0,
    heading: 0,
    routed: null,
    entered: [],
    fault: createFault(seed, 1, assist),
    assist,
    muted: false,
  };
}

export function scan(state: GameState): GameState {
  if (state.phase !== 'running') return state;
  return { ...state, fault: { ...state.fault, revealed: true } };
}

export function setHeading(state: GameState, heading: number): GameState {
  if (state.phase !== 'running') return state;
  const next = Math.max(-30, Math.min(30, Math.round(heading / 15) * 15));
  return { ...state, heading: next };
}

export function routePower(state: GameState, module: ModuleName): GameState {
  if (state.phase !== 'running') return state;
  return { ...state, routed: module };
}

export function enterGlyph(state: GameState, glyph: Glyph): GameState {
  if (state.phase !== 'running') return state;
  return { ...state, entered: [...state.entered, glyph].slice(-3) };
}

export function clearCode(state: GameState): GameState {
  return { ...state, entered: [] };
}

export function attemptRepair(state: GameState): GameState {
  if (state.phase !== 'running') return state;
  const codeCorrect = state.entered.join(',') === state.fault.code.join(',');
  const correct = state.fault.revealed && state.heading === state.fault.bearing && state.routed === state.fault.module && codeCorrect;
  const attempts = state.attempts + 1;
  if (!correct) {
    const integrity = state.assist ? state.integrity : Math.max(0, state.integrity - 12);
    return {
      ...state,
      attempts,
      integrity,
      entered: [],
      phase: integrity === 0 ? 'lost' : state.phase,
    };
  }
  const repairs = state.repairs + 1;
  return {
    ...state,
    attempts,
    repairs,
    score: state.score + 100 + Math.max(0, Math.round((state.fault.limitMs - state.fault.ageMs) / 1000)),
    integrity: Math.min(100, state.integrity + 4),
    entered: [],
    routed: null,
    fault: createFault(state.seed, state.fault.id + 1, state.assist),
  };
}

export function stepGame(state: GameState, dtMs: number): GameState {
  if (state.phase !== 'running') return state;
  const remainingMs = Math.max(0, state.remainingMs - dtMs);
  if (remainingMs === 0) return { ...state, remainingMs: 0, phase: 'won' };
  const faultAge = state.fault.ageMs + dtMs;
  if (faultAge < state.fault.limitMs) {
    return { ...state, remainingMs, fault: { ...state.fault, ageMs: faultAge } };
  }
  const integrity = state.assist ? state.integrity : Math.max(0, state.integrity - 18);
  return {
    ...state,
    remainingMs,
    integrity,
    entered: [],
    routed: null,
    phase: integrity === 0 ? 'lost' : state.phase,
    fault: integrity === 0 ? state.fault : createFault(state.seed, state.fault.id + 1, state.assist),
  };
}

export function startGame(state: GameState): GameState {
  return state.phase === 'ready' ? { ...state, phase: 'running' } : state;
}

export function formatTime(milliseconds: number): string {
  const total = Math.ceil(milliseconds / 1000);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export function accuracy(state: GameState): number {
  return state.attempts ? Math.round((state.repairs / state.attempts) * 100) : 100;
}

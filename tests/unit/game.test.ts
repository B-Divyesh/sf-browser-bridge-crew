import { describe, expect, it } from 'vitest';
import { attemptRepair, createFault, createGame, enterGlyph, routePower, scan, setHeading, startGame, stepGame } from '../../src/game';
import { makeRoomCode } from '../../src/room';

describe('deterministic game core', () => {
  it('@claim:deterministic-seed creates the same fault sequence from the same seed', () => {
    expect(createFault(57231, 4)).toEqual(createFault(57231, 4));
    expect(createFault(57231, 4)).not.toEqual(createFault(57232, 4));
  });

  it('repairs only when all four stations provide the right answer', () => {
    let state = startGame(createGame(8021));
    state = scan(state);
    state = setHeading(state, state.fault.bearing);
    state = routePower(state, state.fault.module);
    for (const glyph of state.fault.code) state = enterGlyph(state, glyph);
    state = attemptRepair(state);
    expect(state.repairs).toBe(1);
    expect(state.score).toBeGreaterThanOrEqual(100);
    expect(state.fault.id).toBe(2);
  });

  it('can lose through missed faults and win when time ends', () => {
    let lost = startGame(createGame(31, false));
    while (lost.phase === 'running') lost = stepGame(lost, 60_000);
    expect(lost.phase).toBe('lost');
    const won = stepGame(startGame(createGame(31, true, 1_000)), 1_001);
    expect(won.phase).toBe('won');
  });

  it('creates readable five-character room codes', () => {
    expect(makeRoomCode(() => 0.25)).toMatch(/^[A-Z2-9]{5}$/);
  });
});

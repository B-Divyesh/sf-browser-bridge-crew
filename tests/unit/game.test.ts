import { describe, expect, it } from 'vitest';
import { attemptRepair, createFault, createGame, enterGlyph, routePower, scan, setHeading, startGame, stepGame } from '../../src/game';

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

  it('can lose through missed faults', () => {
    let lost = startGame(createGame(31, false));
    while (lost.phase === 'running') lost = stepGame(lost, 60_000);
    expect(lost.phase).toBe('lost');
  });

  it('@claim:successful-run reaches the success summary when the exact twelve-minute clock ends above zero', () => {
    const won = stepGame(startGame(createGame(31, true)), 12 * 60_000);
    expect(won.phase).toBe('won');
    expect(won.remainingMs).toBe(0);
    expect(won.integrity).toBe(100);
  });

  it('@claim:assist-behavior gives each fault more response time and prevents incorrect-repair penalties', () => {
    let standard = startGame(createGame(91, false));
    let assisted = startGame(createGame(91, true));
    expect(assisted.fault.limitMs).toBe(60_000);
    expect(assisted.fault.limitMs).toBeGreaterThan(standard.fault.limitMs);
    standard = attemptRepair(standard);
    assisted = attemptRepair(assisted);
    expect(standard.integrity).toBe(88);
    expect(assisted.integrity).toBe(100);
  });
});

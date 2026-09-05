import { describe, expect, it } from 'vitest';
import { FIXED_STEP_MS, FixedStepLoop, TARGET_FRAME_RATE, type FrameRateSample } from '../../src/loop';

describe('fixed-step browser loop', () => {
  it('advances and reports the deterministic 60 Hz schedule', () => {
    let updates = 0;
    const samples: FrameRateSample[] = [];
    const loop = new FixedStepLoop(() => { updates += 1; }, (sample) => samples.push(sample));

    for (let frame = 0; frame <= 241; frame += 1) loop.advance(frame * FIXED_STEP_MS, true);

    expect(updates).toBeGreaterThanOrEqual(239);
    expect(samples).toHaveLength(1);
    expect(samples[0].targetFps).toBe(TARGET_FRAME_RATE);
    expect(samples[0].fps).toBeCloseTo(60, 5);
    expect(samples[0].updateHz).toBeCloseTo(60, 0);
  });

  it('does not catch up time spent inactive', () => {
    let updates = 0;
    const loop = new FixedStepLoop(() => { updates += 1; }, () => undefined);
    loop.advance(0, true);
    loop.advance(FIXED_STEP_MS, true);
    loop.advance(5_000, false);
    loop.advance(5_000 + FIXED_STEP_MS, true);

    expect(updates).toBeLessThanOrEqual(2);
  });
});

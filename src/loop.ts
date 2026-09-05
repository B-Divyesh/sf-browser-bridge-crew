export const TARGET_FRAME_RATE = 60;
export const FIXED_STEP_MS = 1000 / TARGET_FRAME_RATE;
export const FRAME_SAMPLE_MS = 3_000;
const FRAME_WARMUP_MS = 1_000;
const MAX_ELAPSED_MS = 250;

export interface FrameRateSample {
  targetFps: number;
  elapsedMs: number;
  frames: number;
  updates: number;
  fps: number;
  updateHz: number;
  longestFrameMs: number;
}

export class FixedStepLoop {
  private previous: number | null = null;
  private accumulator = 0;
  private warmupEndsAt: number | null = null;
  private sampleStartedAt: number | null = null;
  private sampleFrames = 0;
  private sampleUpdates = 0;
  private longestFrameMs = 0;

  constructor(
    private readonly update: (stepMs: number) => void,
    private readonly report: (sample: FrameRateSample) => void,
  ) {}

  advance(now: number, active: boolean): boolean {
    if (this.previous === null) {
      this.previous = now;
      return false;
    }

    const interval = Math.max(0, now - this.previous);
    this.previous = now;
    if (!active) {
      this.resetSample();
      this.accumulator = 0;
      return false;
    }

    this.accumulator += Math.min(MAX_ELAPSED_MS, interval);
    let updates = 0;
    while (this.accumulator >= FIXED_STEP_MS) {
      this.update(FIXED_STEP_MS);
      this.accumulator -= FIXED_STEP_MS;
      updates += 1;
    }

    this.measure(now, interval, updates);
    return updates > 0;
  }

  private measure(now: number, interval: number, updates: number): void {
    if (this.warmupEndsAt === null) this.warmupEndsAt = now + FRAME_WARMUP_MS;
    if (now < this.warmupEndsAt) return;
    if (this.sampleStartedAt === null) {
      this.sampleStartedAt = now;
      return;
    }

    this.sampleFrames += 1;
    this.sampleUpdates += updates;
    this.longestFrameMs = Math.max(this.longestFrameMs, interval);
    const elapsedMs = now - this.sampleStartedAt;
    if (elapsedMs < FRAME_SAMPLE_MS) return;

    this.report({
      targetFps: TARGET_FRAME_RATE,
      elapsedMs,
      frames: this.sampleFrames,
      updates: this.sampleUpdates,
      fps: this.sampleFrames * 1000 / elapsedMs,
      updateHz: this.sampleUpdates * 1000 / elapsedMs,
      longestFrameMs: this.longestFrameMs,
    });
    this.sampleStartedAt = now;
    this.sampleFrames = 0;
    this.sampleUpdates = 0;
    this.longestFrameMs = 0;
  }

  private resetSample(): void {
    this.warmupEndsAt = null;
    this.sampleStartedAt = null;
    this.sampleFrames = 0;
    this.sampleUpdates = 0;
    this.longestFrameMs = 0;
  }
}

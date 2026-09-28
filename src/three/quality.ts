/**
 * quality.ts — capability detection and runtime degradation.
 *
 * Rules honoured here (docs/DESIGN.md §8/§11, docs/AGENTS.md):
 *  - never sniff the user agent; only features, sizes and measured frame time.
 *  - degrade particles → resolution, never the narrative: the camera path, the
 *    five acts and every DOM message survive every downgrade.
 *  - no geometry rebuilds mid-flight: star and exhaust trimming is done with
 *    BufferGeometry.setDrawRange, so a downgrade costs nothing but a number.
 */

export type QualityTier = 'full' | 'reduced' | 'skybox' | 'none';

export interface QualitySettings {
  readonly tier: QualityTier;
  readonly maxPixelRatio: number;
  /** stars drawn per depth layer, in world.ts layer order */
  readonly starCounts: readonly [number, number, number];
  readonly earthSegments: readonly [number, number];
  readonly marsSegments: readonly [number, number];
  readonly atmosphereShells: number;
  readonly exhaustParticles: number;
  readonly pointerTilt: boolean;
  readonly cloudAmount: number;
}

/** Step 0 is the authored experience; each later step trades polish, not story. */
export const QUALITY_STEPS: ReadonlyArray<QualitySettings> = [
  {
    tier: 'full',
    maxPixelRatio: 2,
    starCounts: [16000, 10000, 7000],
    earthSegments: [96, 64],
    marsSegments: [128, 96],
    atmosphereShells: 2,
    exhaustParticles: 260,
    pointerTilt: true,
    cloudAmount: 0.9,
  },
  {
    tier: 'reduced',
    maxPixelRatio: 1.5,
    starCounts: [6000, 4000, 2800],
    earthSegments: [64, 44],
    marsSegments: [96, 72],
    atmosphereShells: 2,
    exhaustParticles: 140,
    pointerTilt: false,
    cloudAmount: 0.75,
  },
  {
    tier: 'reduced',
    maxPixelRatio: 1,
    starCounts: [2200, 1500, 1000],
    earthSegments: [48, 32],
    marsSegments: [64, 48],
    atmosphereShells: 1,
    exhaustParticles: 0,
    pointerTilt: false,
    cloudAmount: 0.5,
  },
];

const SKYBOX: QualitySettings = {
  tier: 'skybox',
  maxPixelRatio: 1,
  starCounts: [0, 0, 0],
  earthSegments: [32, 24],
  marsSegments: [32, 24],
  atmosphereShells: 0,
  exhaustParticles: 0,
  pointerTilt: false,
  cloudAmount: 0,
};

export function settingsFor(step: number): QualitySettings {
  return QUALITY_STEPS[Math.max(0, Math.min(QUALITY_STEPS.length - 1, step))];
}

/** Feature probe only — a throwaway context, immediately released. */
export function detectWebglSupport(): boolean {
  try {
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2') ?? probe.getContext('webgl');
    if (!gl) return false;
    const lose = gl.getExtension('WEBGL_lose_context');
    lose?.loseContext();
    return true;
  } catch {
    return false;
  }
}

interface NavigatorWithMemory extends Navigator {
  deviceMemory?: number;
}

/** Sentinel: this device gets the CSS composition instead of a WebGL scene. */
export const SKYBOX_STEP = -1;

/**
 * Initial tier from device class + capability, not from a user-agent string.
 * Viewport is a proxy for "small device", not for "which browser".
 */
export function detectInitialStep(): number {
  if (typeof window === 'undefined') return SKYBOX_STEP;
  if (!detectWebglSupport()) return SKYBOX_STEP;

  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const narrow = window.matchMedia('(max-width: 767px)').matches;
  const nav = navigator as NavigatorWithMemory;
  const memory = nav.deviceMemory ?? 4;
  const cores = navigator.hardwareConcurrency ?? 4;
  const saveData =
    'connection' in navigator &&
    Boolean((navigator as { connection?: { saveData?: boolean } }).connection?.saveData);

  // A phone gets the CSS composition regardless of how fast it claims to be:
  // a full-screen displaced planet plus pinned scroll is a bad trade there.
  if (narrow && coarse) return SKYBOX_STEP;
  if (saveData || memory <= 2 || cores <= 2) return SKYBOX_STEP;

  if (memory <= 4 || cores <= 4) return 1;
  return 0;
}

export function detectInitialSettings(): QualitySettings {
  const step = detectInitialStep();
  return step < 0 ? SKYBOX : settingsFor(step);
}

export interface GovernorCallbacks {
  /** called with the new step index whenever the frame budget forces a drop */
  onChange: (step: number, settings: QualitySettings) => void;
}

export const FRAME_PROBE = {
  /** seconds of warm-up ignored before measuring */
  warmup: 1.0,
  /** length of each measuring window, seconds */
  window: 2.5,
  /** average fps below which we spend a step */
  floorFps: 46,
  /** give up probing after this long — never throttle forever */
  maxWindowCount: 3,
} as const;

/**
 * Rolling frame-time governor. It measures, it does not guess, and it stops
 * measuring once it has enough evidence.
 */
export class QualityGovernor {
  private step: number;
  private elapsed = 0;
  private windowTime = 0;
  private windowFrames = 0;
  private windowsUsed = 0;
  private done = false;

  constructor(
    startStep: number,
    private readonly callbacks: GovernorCallbacks,
  ) {
    this.step = startStep;
  }

  get currentStep(): number {
    return this.step;
  }

  frame(delta: number): void {
    if (this.done) return;

    this.elapsed += delta;
    if (this.elapsed < FRAME_PROBE.warmup) return;

    this.windowTime += delta;
    this.windowFrames += 1;
    if (this.windowTime < FRAME_PROBE.window) return;

    const fps = this.windowFrames / this.windowTime;
    this.windowTime = 0;
    this.windowFrames = 0;
    this.windowsUsed += 1;

    if (fps < FRAME_PROBE.floorFps && this.step < QUALITY_STEPS.length - 1) {
      this.step += 1;
      this.callbacks.onChange(this.step, settingsFor(this.step));
    }

    if (this.windowsUsed >= FRAME_PROBE.maxWindowCount) this.done = true;
  }
}

import type { QualityTier } from './types';

/**
 * Adaptive quality. One profile is chosen at boot from the pre-paint probe;
 * the FPS governor may step it down at runtime. Downgrades are always
 * non-narrative (AGENTS.md): resolution, particle counts, shader layers —
 * never the camera path, never the stage order.
 */
export interface QualityProfile {
  readonly tier: QualityTier;
  /** Hard ceiling for renderer pixel ratio (DPR ≤ 2 budget). */
  readonly pixelRatio: number;
  readonly stars: number;
  readonly dust: number;
  readonly asteroids: number;
  readonly kuiper: number;
  /** Atmosphere shells — first visual to go on weak GPUs (fill rate). */
  readonly atmosphere: boolean;
  readonly rings: boolean;
  readonly orbitLines: boolean;
  readonly corona: boolean;
}

export const QUALITY_PROFILES: Record<QualityTier, QualityProfile> = {
  high: {
    tier: 'high',
    pixelRatio: 2,
    stars: 5200,
    dust: 1400,
    asteroids: 1500,
    kuiper: 900,
    atmosphere: true,
    rings: true,
    orbitLines: true,
    corona: true,
  },
  medium: {
    tier: 'medium',
    pixelRatio: 1.6,
    stars: 3200,
    dust: 800,
    asteroids: 850,
    kuiper: 420,
    atmosphere: true,
    rings: true,
    orbitLines: true,
    corona: true,
  },
  low: {
    tier: 'low',
    pixelRatio: 1,
    stars: 1800,
    dust: 320,
    asteroids: 380,
    kuiper: 0,
    atmosphere: false,
    rings: true,
    orbitLines: false,
    corona: true,
  },
};

export const TIER_ORDER: readonly QualityTier[] = ['low', 'medium', 'high'];

export function isQualityTier(value: unknown): value is QualityTier {
  return value === 'high' || value === 'medium' || value === 'low';
}

/** Reads the payload written by the Base.astro capability probe. */
export function detectTier(): QualityTier {
  if (typeof window === 'undefined') return 'medium';
  const tier = window.__ORBITAL__?.tier;
  return isQualityTier(tier) ? tier : 'medium';
}

export function stepTier(tier: QualityTier, direction: -1 | 1): QualityTier {
  const index = TIER_ORDER.indexOf(tier);
  const next = TIER_ORDER[Math.min(Math.max(index + direction, 0), TIER_ORDER.length - 1)];
  return next ?? tier;
}

export function profileFor(tier: QualityTier): QualityProfile {
  return QUALITY_PROFILES[tier];
}

/* ── FPS governor ─────────────────────────────────────────────────────────── */

/** Frames averaged before a judgement is made. */
const SAMPLE_FRAMES = 90;
/** Below this average FPS the experience steps down a tier. */
const DOWNGRADE_FPS = 46;
/** Above this average FPS it may step back up (hysteresis against flapping). */
const UPGRADE_FPS = 58;
/** Minimum time between two tier changes. */
const COOLDOWN_MS = 5000;

/**
 * Averages frame time over a window and reports at most one tier change per
 * cooldown. Locked on reduced-motion devices and on the lowest tier, and never
 * consulted while the tab is hidden (no frames are produced there anyway).
 */
export class QualityGovernor {
  #tier: QualityTier;
  #frames = 0;
  #accumulated = 0;
  #lastChange = 0;
  #locked: boolean;
  readonly #onChange: (tier: QualityTier) => void;

  constructor(tier: QualityTier, locked: boolean, onChange: (tier: QualityTier) => void) {
    this.#tier = tier;
    this.#locked = locked;
    this.#onChange = onChange;
  }

  get tier(): QualityTier {
    return this.#tier;
  }

  reset(): void {
    this.#frames = 0;
    this.#accumulated = 0;
  }

  sample(dt: number, now: number): void {
    if (this.#locked || this.#tier === 'low') return;
    this.#frames += 1;
    this.#accumulated += dt;
    if (this.#frames < SAMPLE_FRAMES) return;

    const averageFps = this.#frames / Math.max(this.#accumulated, 0.0001);
    this.#frames = 0;
    this.#accumulated = 0;
    if (now - this.#lastChange < COOLDOWN_MS) return;

    if (averageFps < DOWNGRADE_FPS) {
      this.#lastChange = now;
      this.#apply(stepTier(this.#tier, -1));
    } else if (averageFps > UPGRADE_FPS && this.#tier !== 'high') {
      this.#lastChange = now;
      this.#apply(stepTier(this.#tier, 1));
    }
  }

  #apply(tier: QualityTier): void {
    if (tier === this.#tier) return;
    this.#tier = tier;
    this.#onChange(tier);
  }
}

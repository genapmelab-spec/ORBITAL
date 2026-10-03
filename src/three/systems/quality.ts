/**
 * Quality tiers and the governor that moves between them.
 *
 * Three profiles, ordered. The scene starts on the best tier the device looks
 * like it can hold, then the governor watches real frame times: a sustained dip
 * below `DOWNGRADE_FPS` drops a tier, a sustained climb above `UPGRADE_FPS`
 * climbs back, with a cooldown so it can never oscillate.
 */

export type QualityTier = 'low' | 'medium' | 'high';

export interface QualityProfile {
  readonly tier: QualityTier;
  readonly pixelRatio: number;
  readonly antialias: boolean;
  readonly stars: number;
  readonly dust: number;
  readonly asteroids: number;
  readonly atmosphere: boolean;
  readonly orbitLines: boolean;
}

export const QUALITY_PROFILES: Record<QualityTier, QualityProfile> = {
  high: {
    tier: 'high',
    pixelRatio: 2,
    antialias: true,
    stars: 5200,
    dust: 1200,
    asteroids: 1500,
    atmosphere: true,
    orbitLines: true,
  },
  medium: {
    tier: 'medium',
    pixelRatio: 1.6,
    antialias: true,
    stars: 3200,
    dust: 700,
    asteroids: 850,
    atmosphere: true,
    orbitLines: true,
  },
  low: {
    tier: 'low',
    pixelRatio: 1,
    antialias: false,
    stars: 1800,
    dust: 320,
    asteroids: 380,
    atmosphere: false,
    orbitLines: true,
  },
};

export const TIER_ORDER: readonly QualityTier[] = ['low', 'medium', 'high'];

export const GOVERNOR_WINDOW = 90;
export const DOWNGRADE_FPS = 46;
export const UPGRADE_FPS = 58;
export const GOVERNOR_COOLDOWN_MS = 5000;
/**
 * A display that cannot show more than ~30 frames per second must not be judged
 * against desktop thresholds: a stable 30 fps there is the *goal*, not a
 * failure. The governor therefore learns the display rate from the fastest
 * frame it has seen — the compositor can never tick faster than the display —
 * and scales both thresholds to a share of it.
 */
export const DOWNGRADE_DISPLAY_SHARE = 0.72;
export const UPGRADE_DISPLAY_SHARE = 0.9;
/** Frames faster than this are clock artefacts, never display evidence. */
export const MIN_DISPLAY_PERIOD_MS = 4;

/** Best tier the device plausibly holds, judged without sniffing the UA. */
export function initialTier(): QualityTier {
  const cores = typeof navigator === 'undefined' ? 4 : navigator.hardwareConcurrency || 4;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  const coarse = typeof matchMedia === 'function' ? matchMedia('(pointer: coarse)').matches : false;
  const small = typeof innerWidth === 'number' ? innerWidth < 760 : false;

  if (cores <= 4 || memory <= 3 || (coarse && small)) {
    return 'medium';
  }
  return 'high';
}

export interface QualityGovernor {
  readonly tier: QualityTier;
  /** Feed one frame; returns the new tier when the governor changes it. */
  frame(frameMs: number, nowMs: number): QualityTier | null;
}

export function createGovernor(start: QualityTier): QualityGovernor {
  let tier = start;
  let frames = 0;
  let accumulated = 0;
  let fastest = Number.POSITIVE_INFINITY;
  let windowIndex = 0;
  let lastChange = Number.NEGATIVE_INFINITY;

  return {
    get tier(): QualityTier {
      return tier;
    },
    frame(frameMs: number, nowMs: number): QualityTier | null {
      frames += 1;
      accumulated += frameMs;
      // The first window is untrustworthy for display detection: the scene's
      // first frame uses a nominal dt before any real timestamp exists.
      if (windowIndex >= 1 && frameMs >= MIN_DISPLAY_PERIOD_MS) {
        fastest = Math.min(fastest, frameMs);
      }
      if (frames < GOVERNOR_WINDOW) {
        return null;
      }
      const fps = 1000 / (accumulated / frames);
      frames = 0;
      accumulated = 0;
      let downgradeAt = DOWNGRADE_FPS;
      let upgradeAt = UPGRADE_FPS;
      if (windowIndex >= 1 && Number.isFinite(fastest)) {
        const displayFps = 1000 / fastest;
        downgradeAt = Math.min(DOWNGRADE_FPS, displayFps * DOWNGRADE_DISPLAY_SHARE);
        upgradeAt = Math.min(UPGRADE_FPS, displayFps * UPGRADE_DISPLAY_SHARE);
      }
      fastest = Number.POSITIVE_INFINITY;
      windowIndex += 1;
      if (nowMs - lastChange < GOVERNOR_COOLDOWN_MS) {
        return null;
      }
      const index = TIER_ORDER.indexOf(tier);
      if (fps < downgradeAt && index > 0) {
        tier = TIER_ORDER[index - 1] as QualityTier;
        lastChange = nowMs;
        return tier;
      }
      if (fps > upgradeAt && index < TIER_ORDER.length - 1) {
        tier = TIER_ORDER[index + 1] as QualityTier;
        lastChange = nowMs;
        return tier;
      }
      return null;
    },
  };
}

import type { Tier } from '../state/store'

export interface TierSpec {
  dpr: number
  stars: number
  motes: number
  galaxy: number
  filaments: number
  cloud: number
  ribbon: boolean
}

/** One table, three devices. The scene reads counts; the governor moves tier. */
export const TIERS: Record<Tier, TierSpec> = {
  high: { dpr: 2, stars: 6000, motes: 900, galaxy: 14000, filaments: 5200, cloud: 9000, ribbon: true },
  mid: { dpr: 1.5, stars: 3000, motes: 420, galaxy: 7000, filaments: 2600, cloud: 4500, ribbon: true },
  low: { dpr: 1.25, stars: 1500, motes: 200, galaxy: 3200, filaments: 1200, cloud: 2000, ribbon: false },
}

const down = { high: 'mid', mid: 'low', low: 'low' } as const
const up = { high: 'high', mid: 'high', low: 'mid' } as const

export const stepDown = (t: Tier): Tier => down[t]
export const stepUp = (t: Tier): Tier => up[t]

/**
 * Capability probe only — no user-agent sniffing. Coarse pointer, core count and
 * width are enough to choose a starting tier; the governor corrects mistakes.
 */
export function detectTier(): Tier {
  if (typeof window === 'undefined') return 'mid'
  const coarse = window.matchMedia('(pointer: coarse)').matches
  const cores = navigator.hardwareConcurrency ?? 4
  const w = window.innerWidth
  if (coarse || w < 760) return 'low'
  if (w < 1180 || cores <= 4) return 'mid'
  return 'high'
}

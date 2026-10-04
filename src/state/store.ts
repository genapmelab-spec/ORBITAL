import { create } from 'zustand'
import { detectTier } from '../lib/quality'
import { FORCE, isReduced } from '../lib/motion'

export type Tier = 'high' | 'mid' | 'low'

export interface ExpState {
  rung: string | null
  /** 'idle' | option id | phase index for scrubs | 'running' | 'done' */
  phase: string
  progress: number
  running: boolean
  firedAt: number
  /** Outcome sentence, announced politely by the experiment shell. */
  announcement: string
}

interface OrbitalState {
  tier: Tier
  reduced: boolean
  noWebgl: boolean
  hud: boolean
  ready: boolean
  /** -1 = opening or instrument, otherwise the index of the current rung. */
  activeRung: number
  indexOpen: boolean
  exp: ExpState
  setTier: (t: Tier) => void
  setReady: () => void
  setActiveRung: (i: number) => void
  setIndexOpen: (open: boolean) => void
  setExp: (patch: Partial<ExpState>) => void
}

export const EMPTY_EXP: ExpState = {
  rung: null,
  phase: 'idle',
  progress: 0,
  running: false,
  firedAt: 0,
  announcement: '',
}

const webglAvailable = (): boolean => {
  if (FORCE.noWebgl) return false
  try {
    const canvas = document.createElement('canvas')
    return !!(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
  } catch {
    return false
  }
}

export const useOrbital = create<OrbitalState>((set) => ({
  tier: detectTier(),
  reduced: isReduced(),
  noWebgl: !webglAvailable(),
  hud: FORCE.hud,
  ready: false,
  activeRung: -1,
  indexOpen: false,
  exp: { ...EMPTY_EXP },
  setTier: (tier) => set({ tier }),
  setReady: () => set({ ready: true }),
  setActiveRung: (activeRung) => set({ activeRung }),
  setIndexOpen: (indexOpen) => set({ indexOpen }),
  setExp: (patch) => set((s) => ({ exp: { ...s.exp, ...patch } })),
}))

import { RUNGS } from '../content/ladder'

/**
 * Scroll to ladder. The page keeps native scrolling; this module only measures
 * the document and answers one question: where should the camera be? The answer
 * is a continuous rung position (0 = the Moon, 7 = First Light, -0.55 = the
 * opening frame). Holds sit on whole numbers; the gaps travel between them.
 */
export interface LiveState {
  target: number
  camera: number
  /** 0..1 across the opening frame: drives the aperture. */
  hero: number
  rung: number
  travelling: boolean
  /** Look-back time at the camera's position, in seconds. */
  lookback: number
}

export const live: LiveState = {
  target: -0.55,
  camera: -0.55,
  hero: 0,
  rung: -1,
  travelling: false,
  lookback: RUNGS[0].seconds,
}

interface Key {
  y: number
  t: number
  travelling: boolean
  hero: number
}

let keys: Key[] = []
let listeners: Array<() => void> = []

const vh = () => window.innerHeight

const push = (y: number, t: number, travelling = false, hero = 0) => {
  keys.push({ y: Math.max(0, y), t, travelling, hero })
}

export function measure(): void {
  const height = vh()
  keys = []
  const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-rung]'))
  const heroEl = document.querySelector<HTMLElement>('#hero')
  const instrumentEl = document.querySelector<HTMLElement>('#instrument')

  push(0, -0.55, false, 0)
  if (heroEl) {
    const top = heroEl.offsetTop
    const bottom = top + heroEl.offsetHeight
    push(top, -0.55, false, 0)
    push(top + height * 0.5, -0.55, false, 1)
    push(bottom - height * 0.3, -0.45, false, 1)
  }
  if (instrumentEl) {
    const top = instrumentEl.offsetTop
    const bottom = top + instrumentEl.offsetHeight
    push(top + height * 0.2, -0.3, false, 1)
    push(bottom - height * 0.45, -0.06, false, 1)
  }
  // Each rung: arrive, hold for 0.62 of a viewport, then fly to the next one.
  // The flight is longer than the hold on purpose — the travel is the lesson.
  sections.forEach((el, i) => {
    const top = el.offsetTop
    push(top - height * 0.1, i, false, 1)
    push(top + height * 0.62, i, false, 1)
    push(top + height * 0.62 + 0.5, i, true, 1)
  })
  push(document.documentElement.scrollHeight - height, RUNGS.length - 1, false, 1)

  // Safety: interpolation assumes ascending y, and nothing may break that.
  keys.sort((a, b) => a.y - b.y)
  for (let i = 1; i < keys.length; i += 1) if (keys[i].y <= keys[i - 1].y) keys[i].y = keys[i - 1].y + 0.5
  listeners.forEach((fn) => fn())
}

const smoothstep = (x: number) => x * x * (3 - 2 * x)

function sample(y: number, field: 't' | 'hero'): number {
  if (!keys.length) return field === 't' ? -0.55 : 0
  if (y <= keys[0].y) return keys[0][field]
  for (let i = 1; i < keys.length; i += 1) {
    const b = keys[i]
    const a = keys[i - 1]
    if (y <= b.y) {
      const span = b.y - a.y
      const k = span <= 0 ? 1 : smoothstep((y - a.y) / span)
      return a[field] + (b[field] - a[field]) * k
    }
  }
  return keys[keys.length - 1][field]
}

function travellingAt(y: number): boolean {
  for (let i = 1; i < keys.length; i += 1) {
    if (y <= keys[i].y) return keys[i].travelling || keys[i - 1].travelling
  }
  return false
}

export function update(): void {
  const y = window.scrollY
  live.target = sample(y, 't')
  live.hero = sample(y, 'hero')
  const clamped = Math.min(Math.max(live.target, 0), RUNGS.length - 1)
  live.rung = live.target < -0.02 ? -1 : Math.round(clamped)
  live.travelling = travellingAt(y)
}

/** Published by the scene each frame so every readout shows the same moment. */
export function publishCamera(camera: number): void {
  live.camera = camera
}

export function onMeasure(fn: () => void): () => void {
  listeners.push(fn)
  return () => {
    listeners = listeners.filter((l) => l !== fn)
  }
}

/** Look-back time at an arbitrary rung position, interpolated logarithmically. */
export function lookbackAt(pos: number): number {
  const clamped = Math.min(Math.max(pos, 0), RUNGS.length - 1)
  const i = Math.floor(clamped)
  const j = Math.min(i + 1, RUNGS.length - 1)
  const frac = clamped - i
  if (frac === 0) return RUNGS[i].seconds
  const a = Math.log10(RUNGS[i].seconds)
  const b = Math.log10(RUNGS[j].seconds)
  return 10 ** (a + (b - a) * frac)
}

export function startScrollTracking(): () => void {
  let frame = 0
  const request = () => {
    if (frame) return
    frame = requestAnimationFrame(() => {
      frame = 0
      update()
    })
  }
  window.addEventListener('scroll', request, { passive: true })
  window.addEventListener('resize', measure)
  const observer = new ResizeObserver(measure)
  observer.observe(document.documentElement)
  measure()
  update()
  return () => {
    window.removeEventListener('scroll', request)
    window.removeEventListener('resize', measure)
    observer.disconnect()
    if (frame) cancelAnimationFrame(frame)
  }
}

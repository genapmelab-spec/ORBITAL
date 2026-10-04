import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const params = new URLSearchParams(typeof location === 'undefined' ? '' : location.search)

/** QA hooks, documented in docs/ACCESSIBILITY.md and docs/PERFORMANCE.md. */
export const FORCE = {
  reduce: params.get('motion') === 'reduce',
  noWebgl: params.has('nowebgl'),
  hud: params.has('hud'),
}

export function isReduced(): boolean {
  if (FORCE.reduce) return true
  if (typeof matchMedia === 'undefined') return false
  return matchMedia('(prefers-reduced-motion: reduce)').matches
}

export const DUR = { quick: 0.16, base: 0.38, slow: 0.72 } as const

/** Reveal a set of elements once, or place them immediately when motion is off. */
export function revealBatch(targets: Element[] | NodeListOf<Element>, reduced: boolean): void {
  const els = Array.from(targets)
  if (!els.length) return
  if (reduced) {
    gsap.set(els, { opacity: 1, y: 0 })
    return
  }
  gsap.fromTo(
    els,
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, duration: DUR.slow, ease: 'power2.out', stagger: 0.07, overwrite: true },
  )
}

export { gsap, ScrollTrigger }

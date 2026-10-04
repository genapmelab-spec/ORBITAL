import { useEffect, useRef } from 'react'
import { formatLookback } from '../lib/format'
import { live, lookbackAt } from '../lib/scroll'
import { useOrbital } from '../state/store'

/** ?hud=1 — the measurement instrument used during QC. Never part of the product. */
export function Hud() {
  const hud = useOrbital((s) => s.hud)
  const tier = useOrbital((s) => s.tier)
  const ref = useRef<HTMLPreElement>(null)

  useEffect(() => {
    if (!hud) return
    let raf = 0
    let last = performance.now()
    let acc = 0
    let frames = 0
    let fps = 0
    let worst = 0
    const loop = () => {
      const now = performance.now()
      const dt = now - last
      last = now
      acc += dt
      frames += 1
      worst = Math.max(worst, dt)
      if (acc > 500) {
        fps = 1000 / (acc / frames)
        acc = 0
        frames = 0
        worst = 0
      }
      if (ref.current) {
        ref.current.textContent = `tier ${tier} · ${fps.toFixed(0)} fps · worst ${worst.toFixed(0)} ms · rung ${live.camera.toFixed(2)} · ${formatLookback(lookbackAt(live.camera))}`
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [hud, tier])

  if (!hud) return null
  return <pre className="hud mono" ref={ref} aria-hidden="true" />
}

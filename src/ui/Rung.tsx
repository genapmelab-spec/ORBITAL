import { useEffect, useRef, type CSSProperties } from 'react'
import { RUNGS, type Rung as RungData } from '../content/ladder'
import { gsap, revealBatch, ScrollTrigger } from '../lib/motion'
import { useOrbital } from '../state/store'
import { Experiment } from './Experiment'

/**
 * One rung. The plate holds still while the camera holds its shot; the copy
 * reveals once, when the rung arrives, and never moves again. Rungs alternate
 * sides so the subject is never behind the words.
 */
export function Rung({ rung }: { rung: RungData }) {
  const plate = useRef<HTMLDivElement>(null)
  const reduced = useOrbital((s) => s.reduced)
  const side = RUNGS.findIndex((r) => r.id === rung.id) % 2 === 0 ? 'rung-left' : 'rung-right'

  useEffect(() => {
    const el = plate.current
    if (!el) return
    const items = el.querySelectorAll('.reveal')
    if (reduced) {
      revealBatch(items, true)
      return
    }
    gsap.set(items, { opacity: 0, y: 20 })
    const trigger = ScrollTrigger.create({
      trigger: el,
      start: 'top 84%',
      once: true,
      onEnter: () => revealBatch(items, false),
    })
    return () => trigger.kill()
  }, [reduced])

  return (
    <section
      id={rung.id}
      data-rung={rung.id}
      className={`rung ${side}`}
      style={{ '--accent': `var(--color-accent-${rung.accent})` } as CSSProperties}
    >
      <div className="rung-sticky">
        <div className="plate" ref={plate}>
          <p className="plate-head mono reveal">
            <span className="plate-index">{rung.index}</span>
            <span className="plate-total" aria-hidden="true">
              /08
            </span>
            <span className="plate-label">{rung.label}</span>
          </p>
          <h2 className="plate-title reveal">
            <span className="numeral">{rung.value}</span> <em className="unit">{rung.unit}</em>
            <span className="sr-only">
              {' '}
              ago — {rung.name}
            </span>
          </h2>
          <p className="plate-name reveal">{rung.name}</p>
          <p className="plate-fact reveal">{rung.fact}</p>
          <p className="plate-body reveal">{rung.explanation}</p>
          <div className="plate-exp reveal">
            <Experiment rung={rung} />
          </div>
          <p className="plate-source mono reveal">{rung.source}</p>
        </div>
      </div>
    </section>
  )
}

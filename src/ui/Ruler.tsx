import { useEffect, useRef, type CSSProperties } from 'react'
import { RUNGS } from '../content/ladder'
import { formatLookback, spokenLookback } from '../lib/format'
import { live, lookbackAt, update } from '../lib/scroll'
import { useOrbital } from '../state/store'

/**
 * The ruler. Marks sit at their true logarithmic positions, so the crowding in
 * the middle is the point: most of the ladder's length is starlight. It is the
 * navigation and the lesson at once — click a mark, or tab to it and press.
 */
const LOG_MIN = Math.log10(RUNGS[0].seconds)
const LOG_MAX = Math.log10(RUNGS[RUNGS.length - 1].seconds)
const POSITIONS = RUNGS.map((r) => (Math.log10(r.seconds) - LOG_MIN) / (LOG_MAX - LOG_MIN))

export function Ruler() {
  const activeRung = useOrbital((s) => s.activeRung)
  const reduced = useOrbital((s) => s.reduced)
  const readout = useRef<HTMLSpanElement>(null)
  const spoken = useRef<HTMLSpanElement>(null)
  const fill = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    let raf = 0
    let lastText = ''
    let lastSaid = ''
    const loop = () => {
      const pos = Math.min(Math.max(live.camera, 0), RUNGS.length - 1)
      const progress = (pos - 0) / (RUNGS.length - 1)
      const seconds = lookbackAt(live.camera)
      const text = formatLookback(seconds)
      const said = spokenLookback(seconds)
      if (readout.current && text !== lastText) {
        readout.current.textContent = text
        lastText = text
      }
      if (spoken.current && said !== lastSaid) {
        spoken.current.textContent = said
        lastSaid = said
      }
      if (fill.current) fill.current.style.setProperty('--progress', progress.toFixed(4))
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <nav className="ruler" aria-label="The look-back ladder">
      <p className="ruler-read">
        <span className="mono ruler-key">look-back</span>
        <span className="ruler-value mono" ref={readout} aria-hidden="true">
          {formatLookback(RUNGS[0].seconds)}
        </span>
        <span className="sr-only" ref={spoken}>
          {spokenLookback(RUNGS[0].seconds)}
        </span>
      </p>
      <ol className="ruler-marks">
        {RUNGS.map((r, i) => (
          <li key={r.id} className="ruler-mark" style={{ '--p': `${POSITIONS[i] * 100}%` } as CSSProperties}>
            <button
              type="button"
              className="ruler-hit"
              aria-current={activeRung === i ? 'true' : undefined}
              onClick={() => {
                document.getElementById(r.id)?.scrollIntoView({
                  behavior: reduced ? 'auto' : 'smooth',
                  block: 'start',
                })
                update()
              }}
            >
              <span className="ruler-dot" aria-hidden="true" />
              <span className="ruler-tip mono" aria-hidden="true">
                <span className="ruler-tip-time">{r.arrow}</span>
                <span className="ruler-tip-name">{r.name}</span>
              </span>
              <span className="sr-only">
                {r.index} · {r.name} · {r.arrow} ago
              </span>
            </button>
          </li>
        ))}
        <li className="ruler-rail" aria-hidden="true">
          <span className="ruler-fill" ref={fill} />
        </li>
      </ol>
    </nav>
  )
}

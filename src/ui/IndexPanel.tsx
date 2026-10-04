import { useEffect, useRef, type CSSProperties } from 'react'
import { COPY } from '../content/copy'
import { RUNGS } from '../content/ladder'
import { useOrbital } from '../state/store'

/** The ladder as a list: the same order as the ruler, readable without 3D. */
export function IndexPanel() {
  const open = useOrbital((s) => s.indexOpen)
  const reduced = useOrbital((s) => s.reduced)
  const activeRung = useOrbital((s) => s.activeRung)
  const setIndexOpen = useOrbital((s) => s.setIndexOpen)
  const panel = useRef<HTMLDivElement>(null)
  const returnTo = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    // Opening a modal moves focus in; closing it must move focus back out to the
    // control that opened it, or the visitor is dropped on the document body.
    returnTo.current = document.activeElement as HTMLElement | null
    const first = panel.current?.querySelector<HTMLElement>('.index-item')
    first?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIndexOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      returnTo.current?.focus?.()
      returnTo.current = null
    }
  }, [open, setIndexOpen])

  return (
    <div className="index" id="ladder-index" role="dialog" aria-modal="true" aria-label="The ladder index" hidden={!open}>
      <div className="index-panel" ref={panel}>
        <p className="index-kicker mono">{COPY.chrome.index}</p>
        <ol className="index-list">
          {RUNGS.map((r, i) => (
            <li key={r.id}>
              {/* A real link, not a button: the href is the rung's own id, so
                  the browser performs the jump itself — smooth from the CSS on
                  `html`, instant under `prefers-reduced-motion` — and the row
                  can be copied, opened in a new tab, or followed with the
                  script layer gone. Its accent is the rung's, so the row lights
                  up in the colour of the scene it points at. */}
              <a
                className="index-item"
                href={`#${r.id}`}
                aria-current={activeRung === i ? 'true' : undefined}
                style={{ '--accent': `var(--color-accent-${r.accent})` } as CSSProperties}
                onClick={(event) => {
                  // ?motion=reduce is a query flag, so CSS cannot see it: only
                  // then is the jump taken out of the browser's hands.
                  if (reduced) {
                    event.preventDefault()
                    document.getElementById(r.id)?.scrollIntoView({ behavior: 'auto', block: 'start' })
                  }
                  setIndexOpen(false)
                }}
              >
                <span className="index-arrow mono">{r.arrow}</span>
                <span className="index-name">{r.name}</span>
                <span className="index-label mono">{r.label}</span>
              </a>
            </li>
          ))}
        </ol>
        <button type="button" className="index-close mono" onClick={() => setIndexOpen(false)}>
          {COPY.chrome.close}
        </button>
      </div>
      <button
        type="button"
        className="index-backdrop"
        aria-label={COPY.chrome.close}
        tabIndex={-1}
        onClick={() => setIndexOpen(false)}
      />
    </div>
  )
}

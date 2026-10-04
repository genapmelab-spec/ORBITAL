import { useEffect, useRef } from 'react'
import { COPY } from '../content/copy'
import { RUNGS } from '../content/ladder'
import { useOrbital } from '../state/store'

function jump(id: string, reduced: boolean): void {
  const el = document.getElementById(id)
  if (!el) return
  el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
}

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
    const first = panel.current?.querySelector<HTMLButtonElement>('button')
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
              <button
                type="button"
                className="index-item"
                aria-current={activeRung === i ? 'true' : undefined}
                onClick={() => {
                  setIndexOpen(false)
                  jump(r.id, reduced)
                }}
              >
                <span className="index-arrow mono">{r.arrow}</span>
                <span className="index-name">{r.name}</span>
                <span className="index-label mono">{r.label}</span>
              </button>
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

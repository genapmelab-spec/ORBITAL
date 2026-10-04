import { useEffect, useState } from 'react'
import { COPY } from '../content/copy'
import { RUNGS } from '../content/ladder'
import { useOrbital } from '../state/store'

/** Retracts after three seconds without intent; returns on any sign of use. */
function useRetract(hold: boolean): boolean {
  const [retracted, setRetracted] = useState(false)
  useEffect(() => {
    let timer = 0
    let lastY = window.scrollY
    const wake = () => {
      setRetracted(false)
      window.clearTimeout(timer)
      if (!hold) timer = window.setTimeout(() => setRetracted(true), 3000)
    }
    const onScroll = () => {
      const y = window.scrollY
      if (y < lastY - 6) wake()
      lastY = y
    }
    const onPointer = (e: PointerEvent) => {
      if (e.clientY < 110) wake()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') wake()
    }
    wake()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('pointermove', onPointer, { passive: true })
    window.addEventListener('keydown', onKey)
    document.addEventListener('focusin', wake)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('pointermove', onPointer)
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('focusin', wake)
    }
  }, [hold])
  return retracted && !hold
}

export function Chrome() {
  const activeRung = useOrbital((s) => s.activeRung)
  const indexOpen = useOrbital((s) => s.indexOpen)
  const setIndexOpen = useOrbital((s) => s.setIndexOpen)
  const retracted = useRetract(indexOpen)
  const rung = activeRung >= 0 ? RUNGS[activeRung] : null

  return (
    <header className="chrome" data-retracted={retracted}>
      <a className="chrome-mark" href="#top">
        <span className="chrome-word">{COPY.mark}</span>
        <span className="chrome-sub mono">{COPY.hero.strapline}</span>
      </a>
      <p className="chrome-now mono" aria-live="polite">
        {rung ? (
          <>
            <span className="chrome-arrow">{rung.arrow}</span> ago · {rung.name}
          </>
        ) : (
          COPY.chrome.hero
        )}
      </p>
      <button
        type="button"
        className="chrome-index mono"
        aria-expanded={indexOpen}
        aria-controls="ladder-index"
        onClick={() => setIndexOpen(!indexOpen)}
      >
        {indexOpen ? COPY.chrome.close : COPY.chrome.index}
        <span className="chrome-count" aria-hidden="true">
          {rung ? rung.index : '00'}/08
        </span>
      </button>
    </header>
  )
}

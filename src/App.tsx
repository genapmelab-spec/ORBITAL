import { Component, lazy, Suspense, useEffect, useState, type ReactNode } from 'react'
import { COPY } from './content/copy'
import { RUNGS } from './content/ladder'
import { startScrollTracking, update, live } from './lib/scroll'
import { useOrbital } from './state/store'
import { Boot } from './ui/Boot'
import { Chrome } from './ui/Chrome'
import { Hud } from './ui/Hud'
import { IndexPanel } from './ui/IndexPanel'
import { Ruler } from './ui/Ruler'
import { Rung } from './ui/Rung'
import { Close, Hero, Instrument } from './ui/Sections'
import { CssSky } from './ui/fallback/CssSky'

const LazyStage = lazy(() => import('./scene/Stage'))

/** A failed scene chunk must not take the lesson with it. */
class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? <CssSky /> : this.props.children
  }
}

export default function App() {
  const noWebgl = useOrbital((s) => s.noWebgl)
  const setActiveRung = useOrbital((s) => s.setActiveRung)
  const [mountScene, setMountScene] = useState(false)

  useEffect(() => {
    const stop = startScrollTracking()
    const root = document.documentElement
    let raf = 0
    let lastRung = -2
    const loop = () => {
      root.style.setProperty('--aperture', `${(30 + live.hero * 190).toFixed(2)}vmax`)
      root.dataset.hero = live.hero > 0.42 ? 'open' : 'closed'
      if (live.rung !== lastRung) {
        lastRung = live.rung
        setActiveRung(live.rung)
        if (live.rung >= 0) history.replaceState(null, '', `#${RUNGS[live.rung].id}`)
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    const hash = location.hash.replace('#', '')
    if (hash && RUNGS.some((r) => r.id === hash)) {
      requestAnimationFrame(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: 'auto', block: 'start' })
        update()
      })
    }
    return () => {
      cancelAnimationFrame(raf)
      stop()
    }
  }, [setActiveRung])

  useEffect(() => {
    if (noWebgl) return
    const start = () => setMountScene(true)
    const idle = window.requestIdleCallback?.bind(window)
    if (idle) {
      const handle = idle(start, { timeout: 1200 })
      return () => window.cancelIdleCallback?.(handle)
    }
    const timer = window.setTimeout(start, 500)
    return () => window.clearTimeout(timer)
  }, [noWebgl])

  return (
    <>
      <a className="skip" href="#moon">
        {COPY.chrome.skip}
      </a>
      <Chrome />
      <div className="stage" aria-hidden="true">
        {noWebgl ? (
          <CssSky />
        ) : mountScene ? (
          <SceneBoundary>
            <Suspense fallback={null}>
              <LazyStage />
            </Suspense>
          </SceneBoundary>
        ) : null}
      </div>
      <div className="aperture" aria-hidden="true">
        <span className="aperture-ring" />
      </div>
      <main id="top">
        <Hero />
        <Instrument />
        {RUNGS.map((rung) => (
          <Rung key={rung.id} rung={rung} />
        ))}
        <Close />
      </main>
      <Ruler />
      <IndexPanel />
      <Boot />
      <Hud />
    </>
  )
}

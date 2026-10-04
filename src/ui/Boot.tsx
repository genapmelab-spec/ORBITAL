import { useEffect, useState } from 'react'
import { COPY } from '../content/copy'
import { useOrbital } from '../state/store'

/**
 * The instrument switching on. Decoration only: aria-hidden, and it can never
 * trap the page — the veil clears when the scene reports a first frame, and on a
 * hard timer whatever happens.
 */
export function Boot() {
  const ready = useOrbital((s) => s.ready)
  const [gone, setGone] = useState(false)
  const [step, setStep] = useState(1)

  useEffect(() => {
    const id = window.setInterval(() => setStep((s) => Math.min(s + 1, COPY.boot.length)), 300)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    const hard = window.setTimeout(() => setGone(true), 1900)
    return () => window.clearTimeout(hard)
  }, [])

  useEffect(() => {
    if (!ready) return
    const id = window.setTimeout(() => setGone(true), 420)
    return () => window.clearTimeout(id)
  }, [ready])

  if (gone) return null
  return (
    <div className="boot" data-ready={ready} aria-hidden="true">
      <ul className="boot-lines">
        {COPY.boot.slice(0, step).map((line) => (
          <li key={line} className="mono">
            {line}
          </li>
        ))}
      </ul>
    </div>
  )
}

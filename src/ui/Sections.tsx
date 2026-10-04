import { useState } from 'react'
import { COPY } from '../content/copy'
import { RUNGS } from '../content/ladder'
import { useOrbital } from '../state/store'

/**
 * The opening frame: an eyepiece, one sentence, one number. The identity arrives
 * only when the visitor moves — and the aperture opens with them, so the first
 * scroll is the instrument's first look.
 */
export function Hero() {
  return (
    <section id="hero" className="hero" data-hero-section="true">
      <div className="hero-sticky">
        <p className="hero-plate mono">
          <span className="hero-plate-time">1.28 s</span>
          <span className="hero-plate-name">The Moon</span>
        </p>
        <p className="hero-whisper">
          {COPY.hero.whisper}
          <span className="hero-sub">{COPY.hero.sub}</span>
        </p>
        <div className="hero-identity">
          <p className="hero-mark mono">{COPY.mark}</p>
          <h1 className="hero-title">{COPY.tagline}</h1>
          <p className="hero-strapline">{COPY.hero.strapline}</p>
          <p className="hero-body">{COPY.hero.body}</p>
          <p className="hero-actions">
            <a className="btn btn-primary" href="#moon">
              {COPY.hero.primary}
            </a>
            <a className="btn btn-ghost" href="#instrument">
              {COPY.hero.secondary}
            </a>
          </p>
          <p className="hero-meta mono">{COPY.hero.meta}</p>
        </div>
        <p className="hero-cue mono">{COPY.hero.scrollCue}</p>
      </div>
    </section>
  )
}

export function Instrument() {
  const noWebgl = useOrbital((s) => s.noWebgl)
  return (
    <section id="instrument" className="instrument">
      <div className="instrument-inner">
        <p className="kicker mono">{COPY.instrument.kicker}</p>
        <h2 className="statement">{COPY.instrument.title}</h2>
        <p className="lede">{COPY.instrument.body}</p>
        <dl className="rules">
          {COPY.instrument.rules.map((r) => (
            <div className="rule" key={r.k}>
              <dt className="mono">{r.k}</dt>
              <dd>{r.v}</dd>
            </div>
          ))}
        </dl>
        <p className="note">
          <span className="note-mark mono" aria-hidden="true">
            note
          </span>
          {COPY.instrument.note}
        </p>
        {noWebgl ? (
          <p className="note note-fallback">
            <span className="note-mark mono" aria-hidden="true">
              no webgl
            </span>
            This display cannot draw the scenes, so the sky behind the words is a flat colour that
            changes as you climb, and the experiments are described instead of performed. Every
            number, explanation and source below is unchanged.
          </p>
        ) : null}
      </div>
    </section>
  )
}

export function Close() {
  const [copied, setCopied] = useState(false)
  const [clipped, setClipped] = useState(false)
  const activeRung = useOrbital((s) => s.activeRung)
  const rung = activeRung >= 0 ? RUNGS[activeRung] : RUNGS[RUNGS.length - 1]
  const canCopy = typeof navigator !== 'undefined' && Boolean(navigator.clipboard) && !clipped

  const copy = async () => {
    if (!canCopy) return
    try {
      await navigator.clipboard.writeText(`${location.origin}${location.pathname}#${rung.id}`)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2600)
    } catch {
      // Missing capability removes the control rather than faking success.
      setClipped(true)
    }
  }

  return (
    <section id="close" className="close">
      <div className="close-inner">
        <p className="kicker mono">{COPY.close.kicker}</p>
        <h2 className="statement">{COPY.close.title}</h2>
        <p className="lede">{COPY.close.body}</p>
        <p className="close-actions">
          <a className="btn btn-primary" href="#top">
            {COPY.close.again}
          </a>
          {canCopy ? (
            <button type="button" className="btn btn-ghost" onClick={copy}>
              {copied ? COPY.close.copied : COPY.close.copy}
              <span className="sr-only"> — links to {rung.name}</span>
            </button>
          ) : null}
        </p>
        <p className="colophon mono">{COPY.close.colophon}</p>
      </div>
    </section>
  )
}

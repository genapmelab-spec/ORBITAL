import { useEffect, useRef } from 'react'
import type { Rung } from '../content/ladder'
import type { ExpState } from '../state/store'
import { formatMoment, formatMomentTime } from '../lib/format'
import { useOrbital } from '../state/store'

/**
 * Four mechanisms, eight rungs. Every rung ships its conclusion as text in the
 * DOM, so the lesson survives without WebGL, without JavaScript and without
 * operating anything. The mechanism only adds the thing text cannot: the wait.
 */
export function Experiment({ rung }: { rung: Rung }) {
  const spec = rung.experiment
  const expRung = useOrbital((s) => s.exp.rung)
  const exp = useOrbital((s) => s.exp)
  const state = expRung === rung.id ? exp : null

  return (
    <div className="exp" data-mechanism={spec.mechanism}>
      <p className="exp-kicker mono">
        <span aria-hidden="true">Experiment</span>
        <span className="sr-only">Experiment for {rung.name}</span>
      </p>
      {spec.mechanism === 'pulse' ? (
        <Pulse rung={rung} state={state} />
      ) : spec.mechanism === 'scrub' ? (
        <Scrub rung={rung} state={state} />
      ) : (
        <Choice rung={rung} state={state} />
      )}
      <p className="exp-result">{spec.result}</p>
      <p className="exp-detail mono">{spec.detail}</p>
    </div>
  )
}

function Pulse({ rung, state }: { rung: Rung; state: ExpState | null }) {
  const setExp = useOrbital((s) => s.setExp)
  const noWebgl = useOrbital((s) => s.noWebgl)
  const clock = useRef<HTMLSpanElement>(null)
  const live = useRef<HTMLSpanElement>(null)
  const duration = rung.experiment.durationMs ?? 2600
  const running = Boolean(state?.running)
  const firedAt = state?.firedAt ?? 0
  const done = state?.phase === 'done'
  const oneWay = rung.id === 'voyager' ? 23.66 * 3600 : 1.28

  useEffect(() => {
    if (!running || !firedAt) return
    let raf = 0
    const loop = () => {
      const elapsed = performance.now() - firedAt
      const k = Math.min(elapsed / duration, 1)
      if (clock.current) {
        clock.current.textContent =
          rung.id === 'voyager'
            ? `${(k * 23.66).toFixed(1)} h of 23 h 40 m · ${Math.round(k * 100)}%`
            : `${((k * 2.56).toFixed(2))} s of 2.56 s · ${Math.round(k * 100)}%`
      }
      if (live.current && k < 1) {
        live.current.textContent = rung.id === 'voyager' ? 'Signal outbound.' : 'Pulse outbound.'
      }
      if (elapsed < duration) {
        raf = requestAnimationFrame(loop)
      } else {
        setExp({ running: false, phase: 'done', announcement: rung.experiment.result })
      }
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [running, firedAt, duration, rung.id, rung.experiment.result, setExp])

  const fired = done && firedAt ? new Date(firedAt) : null
  const arrival = fired ? new Date(fired.getTime() + oneWay * 1000) : null
  const reply = fired ? new Date(fired.getTime() + oneWay * 2000) : null

  return (
    <div className="exp-body">
      <button
        type="button"
        className="btn btn-primary exp-fire"
        disabled={noWebgl || running}
        onClick={() =>
          setExp({
            rung: rung.id,
            phase: 'running',
            running: true,
            progress: 0,
            firedAt: performance.now(),
            announcement: rung.id === 'voyager' ? 'Signal sent.' : 'Laser fired.',
          })
        }
      >
        {running ? (rung.id === 'voyager' ? 'In transit' : 'In flight') : rung.experiment.prompt}
      </button>
      <p className="exp-live mono">
        <span className="live-dot" data-on={running} aria-hidden="true" />
        <span className="exp-clock" ref={clock} aria-hidden="true">
          {done ? 'complete' : 'ready'}
        </span>
        <span className="sr-only" ref={live} aria-live="polite">
          {done ? rung.experiment.result : 'Ready.'}
        </span>
      </p>
      {rung.id === 'voyager' && arrival && reply ? (
        <ol className="exp-log mono">
          <li>sent {fired ? formatMoment(fired) : ''}</li>
          <li>arrives {formatMoment(arrival)}</li>
          <li>earliest reply {formatMoment(reply)} ({formatMomentTime(reply)})</li>
        </ol>
      ) : null}
    </div>
  )
}

function Scrub({ rung, state }: { rung: Rung; state: ExpState | null }) {
  const setExp = useOrbital((s) => s.setExp)
  const noWebgl = useOrbital((s) => s.noWebgl)
  const progress = state?.progress ?? 0
  const phases = rung.experiment.phases ?? []
  const active = [...phases].reverse().find((p) => progress >= p.at) ?? phases[0]

  return (
    <div className="exp-body">
      <label className="exp-label mono" htmlFor={`${rung.id}-scrub`}>
        {rung.experiment.prompt}
      </label>
      <input
        id={`${rung.id}-scrub`}
        className="exp-range"
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={progress}
        disabled={noWebgl}
        aria-valuetext={active?.text ?? ''}
        onChange={(e) => {
          const v = Number(e.target.value)
          setExp({ rung: rung.id, progress: v, phase: v > 0.98 ? 'done' : 'active' })
        }}
      />
      <p className="exp-caption">{active?.text ?? ''}</p>
    </div>
  )
}

function Choice({ rung, state }: { rung: Rung; state: ExpState | null }) {
  const setExp = useOrbital((s) => s.setExp)
  const noWebgl = useOrbital((s) => s.noWebgl)
  const options = rung.experiment.options ?? []
  const chosen = state?.phase && state.phase !== 'idle' ? state.phase : null
  const note = options.find((o) => o.id === chosen)?.note

  return (
    <div className="exp-body">
      <p className="exp-label mono">{rung.experiment.prompt}</p>
      <div className="exp-choice" role="group" aria-label={rung.experiment.prompt}>
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            className="btn btn-choice"
            aria-pressed={chosen === o.id}
            disabled={noWebgl}
            onClick={() => setExp({ rung: rung.id, phase: o.id, announcement: o.note })}
          >
            {o.label}
          </button>
        ))}
      </div>
      <p className="exp-caption">{note ?? 'Pick one and watch the scene answer.'}</p>
      <span className="sr-only" aria-live="polite">
        {note ?? ''}
      </span>
    </div>
  )
}

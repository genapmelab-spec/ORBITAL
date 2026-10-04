import { RUNGS } from '../../content/ladder'
import { useOrbital } from '../../state/store'

/**
 * No WebGL: the scene is replaced by a sky that changes colour with the rung.
 * Nothing is claimed here that the text does not already say; the sky carries
 * the mood, the plates carry the lesson.
 */
export function CssSky() {
  const activeRung = useOrbital((s) => s.activeRung)
  const rung = activeRung >= 0 ? RUNGS[activeRung] : null
  const accent = rung ? `var(--color-accent-${rung.accent})` : 'var(--color-faint)'
  return <div className="sky" aria-hidden="true" style={{ ['--accent' as string]: accent }} />
}

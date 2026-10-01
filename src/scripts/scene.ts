import type { OrbitaSceneHandle } from '../three/OrbitaScene';
import { OPENING_RISE_END } from '../content/journey';
import type { ScrollControllerHandle } from './scrollController';
import type { NavHandle } from './nav';

/**
 * Runtime entry — the only script on the critical path, and deliberately tiny.
 * It runs the DOM experience first (reveals, preloader, navigation) and only
 * then imports the heavy modules, so the LCP element is always DOM content and
 * a device without WebGL still gets the complete story.
 *
 * three.js is imported after first paint, never at module scope: that single
 * decision is what keeps the bundle out of the critical path (AGENTS.md).
 */

type Payload = NonNullable<Window['__ORBITAL__']>;

/** Last-resort timing: nothing may stay hidden if a module fails to load. */
export const SAFETY_REVEAL_MS = 3600;

function readPayload(): Payload {
  return window.__ORBITAL__ ?? { webgl: true, tier: 'medium', reducedMotion: false };
}

/** Two frames: layout and paint have both happened before WebGL starts. */
function afterFirstPaint(): Promise<void> {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve()));
  });
}

function openVeil(): void {
  document.querySelector<HTMLElement>('[data-scene-veil]')?.classList.add('is-open');
}

async function main(): Promise<void> {
  const payload = readPayload();
  const canvas = document.querySelector<HTMLCanvasElement>('[data-scene-canvas]');
  const prologue = document.querySelector<HTMLElement>('[data-prologue]');
  let phase: 'whisper' | 'hook' = 'whisper';
  let latestProgress = 0;
  let destroyed = false;
  /** The safety net must only fire when the real modules never arrived. */
  let modulesReady = false;

  /** The opening has two layers; exactly one may be visible and focusable. */
  const setPhase = (next: 'whisper' | 'hook'): void => {
    if (phase === next || prologue === null) return;
    phase = next;
    prologue.dataset.phase = next;
    const activeLayer = next === 'hook' ? 'hook' : 'whisper';
    const inactiveLayer = next === 'hook' ? 'whisper' : 'hook';
    prologue.querySelector(`[data-phase-layer="${activeLayer}"]`)?.removeAttribute('aria-hidden');
    prologue.querySelector(`[data-phase-layer="${inactiveLayer}"]`)?.setAttribute('aria-hidden', 'true');
    prologue
      .querySelectorAll<HTMLElement>(`[data-phase-layer="${inactiveLayer}"] a`)
      .forEach((link) => link.setAttribute('tabindex', '-1'));
    prologue
      .querySelectorAll<HTMLElement>(`[data-phase-layer="${activeLayer}"] a`)
      .forEach((link) => link.removeAttribute('tabindex'));
  };

  const safety = window.setTimeout(() => {
    void import('./motion')
      .then((motion) => motion.revealAll())
      .catch(() => undefined);
    openVeil();
    // Fallback shows the complete landing: the hook, not the whisper — but
    // only if the real choreography never came up, never over a healthy boot.
    if (!modulesReady) setPhase('hook');
  }, SAFETY_REVEAL_MS);

  const [motion, nav, scroll] = await Promise.all([
    import('./motion'),
    import('./nav'),
    import('./scrollController'),
  ]);
  modulesReady = true;

  const navHandle: NavHandle = nav.initNav();
  let scene: OrbitaSceneHandle | null = null;

  const scrollController: ScrollControllerHandle = scroll.initScrollController({
    onProgress: (progress) => {
      latestProgress = progress;
      scene?.setProgress(progress);
      // Opening choreography: the whisper holds the night side; the hook lands
      // once the camera has crossed the reveal threshold (OPENING_RISE_END).
      setPhase(progress >= OPENING_RISE_END ? 'hook' : 'whisper');
    },
    onStageChange: (id) => navHandle.setActiveStage(id),
  });

  motion.initSectionReveals({ reducedMotion: payload.reducedMotion });

  const startScene = async (): Promise<void> => {
    if (!payload.webgl || canvas === null) {
      document.documentElement.classList.add('no-webgl');
      return;
    }
    await afterFirstPaint();
    try {
      const { createOrbitaScene } = await import('../three/OrbitaScene');
      if (destroyed) return;
      scene = createOrbitaScene({
        canvas,
        tier: payload.tier,
        reducedMotion: payload.reducedMotion,
        onFirstFrame: openVeil,
      });
      scene.setProgress(latestProgress);
      window.addEventListener(
        'pagehide',
        () => {
          destroyed = true;
          scene?.destroy();
          scene = null;
          scrollController.destroy();
          navHandle.destroy();
        },
        { once: true },
      );
    } catch (error) {
      // Identical DOM, CSS starfield: the story never depends on the GPU.
      document.documentElement.classList.add('no-webgl', 'tier-skybox');
      openVeil();
      console.warn('[orbital] scene unavailable, using the static sky', error);
    }
  };

  await motion.runPreloader(startScene(), { reducedMotion: payload.reducedMotion });
  window.clearTimeout(safety);
  motion.markChromeReady();
  // The whisper staggers in on load; the hook pre-reveals behind it so the
  // later phase flip is one clean fade instead of a staggered scramble.
  motion.revealPrologue({ reducedMotion: payload.reducedMotion });
  scrollController.refresh();
}

void main();

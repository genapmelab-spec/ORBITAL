import type { OrbitaSceneHandle } from '../three/OrbitaScene';
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

  const safety = window.setTimeout(() => {
    void import('./motion')
      .then((motion) => motion.revealAll())
      .catch(() => undefined);
    openVeil();
  }, SAFETY_REVEAL_MS);

  const [motion, nav, scroll] = await Promise.all([
    import('./motion'),
    import('./nav'),
    import('./scrollController'),
  ]);

  const navHandle: NavHandle = nav.initNav();
  let scene: OrbitaSceneHandle | null = null;
  let latestProgress = 0;
  let destroyed = false;

  const scrollController: ScrollControllerHandle = scroll.initScrollController({
    onProgress: (progress) => {
      latestProgress = progress;
      scene?.setProgress(progress);
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
  motion.revealPrologue({ reducedMotion: payload.reducedMotion });
  scrollController.refresh();
}

void main();

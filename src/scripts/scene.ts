/**
 * scene.ts — the one bundled runtime entry (imported once by the Scene island).
 *
 * Order of operations matters for the LCP budget: the DOM content and all the
 * cheap behaviour boot immediately, and three.js is only fetched AFTER the
 * first paint, so the largest contentful paint is always a DOM element and
 * never the canvas (docs/DESIGN.md §11).
 */

import { detectInitialStep } from '../three/quality';
import type { ScrollController } from './scrollController';

const canvas = document.querySelector<HTMLCanvasElement>('[data-scene-canvas]');
const anchorStage = document.querySelector<HTMLElement>('[data-anchor-layer]');

function afterFirstPaint(task: () => void): void {
  const run = (): void => {
    requestAnimationFrame(() => requestAnimationFrame(task));
  };
  if (document.readyState === 'complete') {
    run();
    return;
  }
  window.addEventListener('load', run, { once: true });
}

function enterFallback(): void {
  document.documentElement.classList.add('tier-skybox');
}

function startScene(reducedMotion: boolean, controller: ScrollController): void {
  const step = detectInitialStep();
  if (step < 0 || !canvas) {
    enterFallback();
    return;
  }

  import('../three/OrbitaScene')
    .then(({ initOrbitaScene }) => {
      const scene = initOrbitaScene({
        canvas,
        anchorStage,
        reducedMotion,
        onQualityChange: (settings) => {
          document.documentElement.dataset.quality = settings.tier;
        },
      });

      if (!scene) {
        enterFallback();
        return;
      }

      document.documentElement.classList.remove('tier-skybox');
      document.documentElement.dataset.quality = 'full';
      controller.attachScene(scene);

      window.addEventListener(
        'pagehide',
        () => {
          scene.destroy();
        },
        { once: true },
      );
    })
    .catch((error: unknown) => {
      // A blocked or crashed GL context must never take the page with it.
      console.warn('[orbital] 3D unavailable, using the CSS composition.', error);
      enterFallback();
    });
}

async function bootstrap(): Promise<void> {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const [{ initMotion }, { initNav }, { initBookingForm }, { initScrollController }] =
    await Promise.all([
      import('./motion'),
      import('./nav'),
      import('./form'),
      import('./scrollController'),
    ]);

  initMotion({ reducedMotion });
  initNav();
  initBookingForm();

  const controller = initScrollController({ reducedMotion });

  afterFirstPaint(() => startScene(reducedMotion, controller));
}

void bootstrap();

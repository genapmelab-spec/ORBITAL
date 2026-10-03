import type { OrbitalSceneHandle } from '../three/scene/OrbitalScene.ts';
import { initChrome } from './chrome.ts';
import { hideVeil, initMotion } from './motion.ts';
import { initScroll } from './scroll.ts';
import { initShare } from './share.ts';
import { getScrollState, subscribeScroll } from './store.ts';
import { initTime } from './time.ts';

/**
 * Boot order matters.
 *
 * The page works without 3D: scroll mapping, navigation, reveals, the date
 * control and the share action are all plain DOM and start immediately. Only
 * then is the scene imported — after the first paint, so the hero's text and the
 * window frame are never waiting on a 150 KB bundle.
 */

export const SCENE_IDLE_TIMEOUT_MS = 1200;
export const SCENE_FALLBACK_DELAY_MS = 140;

/** `window.__ORBITAL_DEBUG__` — see docs/TECHNICAL.md §Verification. */
function debugHandle():
  | { scene: OrbitalSceneHandle | null; probe: { webgl: boolean; reducedMotion: boolean } }
  | undefined {
  const holder = window as Window & {
    __ORBITAL_DEBUG__?: {
      scene: OrbitalSceneHandle | null;
      probe: { webgl: boolean; reducedMotion: boolean };
    };
  };
  if (holder.__ORBITAL_DEBUG__ === undefined) {
    holder.__ORBITAL_DEBUG__ = { scene: null, probe: { webgl: false, reducedMotion: false } };
  }
  return holder.__ORBITAL_DEBUG__;
}

export function boot(): void {
  const probe = window.__ORBITAL__ ?? { webgl: false, reducedMotion: false };

  initMotion({ reducedMotion: probe.reducedMotion });
  initChrome();
  initScroll();
  initShare();

  let scene: OrbitalSceneHandle | null = null;
  // The scene is imported lazily, after initTime has already run — a deep link
  // (?date=…) must therefore be remembered and replayed onto the scene the
  // moment it exists, or the linked date would be lost.
  let pendingEpoch: Date | null = null;
  initTime({
    setEpoch: (date) => {
      pendingEpoch = date;
      scene?.setEpoch(date);
    },
  });

  if (!probe.webgl) {
    document.documentElement.classList.add('no-webgl');
    hideVeil();
    return;
  }

  subscribeScroll((state) => {
    scene?.setParam(state.param);
  });

  // A deliberately small handle for support and verification: read the scene's
  // state, drive it, or confirm it never loaded. Nothing else is exposed.
  const debug = debugHandle();
  if (debug !== undefined) {
    debug.probe = probe;
  }

  function start(): void {
    const canvas = document.querySelector<HTMLCanvasElement>('[data-canvas]');
    const stage = document.querySelector<HTMLElement>('[data-stage]');
    const annotationLayer = document.querySelector<HTMLElement>('[data-annotations]');
    if (canvas === null || stage === null || annotationLayer === null) {
      hideVeil();
      return;
    }

    void import('../three/scene/OrbitalScene.ts')
      .then(({ createOrbitalScene }) => {
        scene = createOrbitalScene({
          canvas,
          stage,
          annotationLayer,
          reducedMotion: probe.reducedMotion,
          onFirstFrame: hideVeil,
        });
        if (pendingEpoch !== null) {
          scene.setEpoch(pendingEpoch);
        }
        scene.setParam(getScrollState().param);
        if (debug !== undefined) {
          debug.scene = scene;
        }
      })
      .catch(() => {
        document.documentElement.classList.add('no-webgl');
        // initTime ran before this class existed, so its note needs unpicking here.
        const note = document.querySelector<HTMLElement>('[data-webgl-note]');
        if (note !== null) {
          note.hidden = false;
        }
        hideVeil();
      });
  }

  const idleWindow = window as Window & {
    requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
  };
  if (typeof idleWindow.requestIdleCallback === 'function') {
    idleWindow.requestIdleCallback(start, { timeout: SCENE_IDLE_TIMEOUT_MS });
  } else {
    window.setTimeout(start, SCENE_FALLBACK_DELAY_MS);
  }
}

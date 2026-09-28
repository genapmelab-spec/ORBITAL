/**
 * scrollController.ts — the only thing that scroll does.
 *
 * Scroll position is mapped per ACT, not globally: each act owns one quarter of
 * the camera path, so the ARRIVE composition is always on screen when the
 * camera is at the Mars keyframe no matter how tall the surrounding copy is.
 * The mapping is continuous — the end of an act equals the start of the next —
 * so the flight never jumps, it just accelerates and settles.
 */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { OrbitaSceneHandle } from '../three/OrbitaScene';

const ACT_COUNT = 5;
const ACT_SPAN = 1 / (ACT_COUNT - 1);
const DIAL_CIRCUMFERENCE = 2 * Math.PI * 35;

export interface ScrollControllerOptions {
  reducedMotion: boolean;
}

export interface ScrollController {
  attachScene(scene: OrbitaSceneHandle | null): void;
  /** the currently active act index, 0-based */
  readonly act: number;
  destroy(): void;
}

interface ActState {
  index: number;
  local: number;
}

function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

export function initScrollController(options: ScrollControllerOptions): ScrollController {
  gsap.registerPlugin(ScrollTrigger);

  const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-act]'));
  const stageLinks = Array.from(document.querySelectorAll<HTMLElement>('[data-stage-link]'));
  const dial = document.querySelector<SVGCircleElement>('[data-stage-dial]');
  const dialRead = document.querySelector<HTMLElement>('[data-stage-percent]');
  const rail = document.querySelector<HTMLElement>('[data-stage-rail]');
  const beatText = document.querySelector<HTMLElement>('[data-stage-beat]');

  let scene: OrbitaSceneHandle | null = null;
  // -1 so the very first setAct(0) actually publishes state to the stage log
  let activeAct = -1;
  let progress = 0;

  const states: ActState[] = sections.map((_, index) => ({ index, local: 0 }));

  const paintChrome = (value: number): void => {
    if (dial) {
      dial.style.strokeDashoffset = String(DIAL_CIRCUMFERENCE * (1 - value));
    }
    if (dialRead) {
      dialRead.textContent = String(Math.round(value * 100)).padStart(2, '0');
    }
    if (rail) {
      rail.style.transform = `scaleX(${value.toFixed(4)})`;
    }
  };

  const setAct = (index: number): void => {
    if (index === activeAct) return;
    activeAct = index;

    for (const link of stageLinks) {
      const linkIndex = Number(link.dataset.stageLink ?? '1') - 1;
      if (linkIndex === index) {
        link.setAttribute('aria-current', 'true');
      } else {
        link.removeAttribute('aria-current');
      }
    }

    scene?.setActiveAct(index);

    if (beatText) {
      const nextAct = Math.min(index + 1, ACT_COUNT - 1) + 1;
      beatText.textContent = `Act ${index + 1} of ${ACT_COUNT}. Next: mission 0${nextAct}.`;
    }
  };

  const applyProgress = (): void => {
    if (options.reducedMotion) {
      paintChrome(activeAct * ACT_SPAN);
      return;
    }
    const state = states[activeAct];
    const value = clamp01(activeAct * ACT_SPAN + (state?.local ?? 0) * ACT_SPAN);
    progress = value;
    scene?.setProgress(value);
    paintChrome(value);
  };

  // ---- per-act travel ------------------------------------------------------
  sections.forEach((section, index) => {
    ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: () => `+=${Math.max(section.offsetHeight - window.innerHeight, window.innerHeight)}`,
      onUpdate: (self) => {
        const state = states[index];
        if (state) state.local = self.progress;
        if (index === activeAct) applyProgress();
      },
    });
  });

  // ---- which act owns the viewport ----------------------------------------
  sections.forEach((section, index) => {
    ScrollTrigger.create({
      trigger: section,
      start: 'top 58%',
      end: 'bottom 58%',
      onToggle: (self) => {
        if (self.isActive) {
          setAct(index);
          applyProgress();
        }
      },
    });
  });

  // ---- velocity for the star stretch --------------------------------------
  if (!options.reducedMotion) {
    ScrollTrigger.create({
      trigger: document.documentElement,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        scene?.setVelocity(self.getVelocity());
      },
    });
  }

  // ---- pointer tilt --------------------------------------------------------
  let pointerBound = false;
  const bindPointer = (): void => {
    if (pointerBound || options.reducedMotion) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    pointerBound = true;
    window.addEventListener(
      'pointermove',
      (event) => {
        scene?.setPointer(event.clientX, event.clientY);
      },
      { passive: true },
    );
  };
  bindPointer();

  /**
   * Read the active act straight from the layout. Without this, a deep link
   * (or a restored scroll position, or a fast refresh mid-page) would leave the
   * camera parked on act 1 while the visitor looks at the booking form.
   */
  const syncFromLayout = (): void => {
    const line = window.innerHeight * 0.58;
    let found = 0;
    sections.forEach((section, index) => {
      const rect = section.getBoundingClientRect();
      if (rect.top <= line && rect.bottom > line) found = index;
    });
    setAct(found);
    applyProgress();
  };

  const refresh = (): void => {
    ScrollTrigger.refresh();
    syncFromLayout();
  };
  void document.fonts?.ready.then(refresh);
  window.addEventListener('load', refresh, { once: true });

  /**
   * ScrollTrigger caches start/end offsets, so anything that changes the
   * document height invalidates them. The booking panel swaps to a shorter
   * success panel — without this, every trigger below it (the whole footer)
   * would sit past its start point and never play.
   */
  let refreshQueued = false;
  const queueRefresh = (): void => {
    if (refreshQueued || options.reducedMotion) return;
    refreshQueued = true;
    requestAnimationFrame(() => {
      refreshQueued = false;
      refresh();
    });
  };
  const layoutObserver = new ResizeObserver(queueRefresh);
  layoutObserver.observe(document.body);

  setAct(0);
  syncFromLayout();

  return {
    attachScene(next: OrbitaSceneHandle | null): void {
      scene = next;
      if (!scene) return;
      scene.setActiveAct(activeAct);
      if (options.reducedMotion) {
        paintChrome(activeAct * ACT_SPAN);
      } else {
        scene.setProgress(progress);
      }
    },

    get act(): number {
      return activeAct;
    },

    destroy(): void {
      layoutObserver.disconnect();
      ScrollTrigger.killAll();
    },
  };
}

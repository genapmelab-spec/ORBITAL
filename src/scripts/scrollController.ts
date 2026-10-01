import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { EXPERIENCE, JOURNEY } from '../content/journey';

/**
 * Scroll → journey parameter.
 *
 * Every section on the page declares the camera parameter it sits on, so an
 * interstitial can live *between* two stages without ever pulling the camera
 * sideways: the parameters are non-decreasing by construction and the mapping
 * interpolates between neighbours. The journey order stays exactly JOURNEY's.
 */

export const STAGE_COUNT = JOURNEY.length;
export const LAST_STAGE_PARAM = STAGE_COUNT - 1;

export interface ScrollControllerOptions {
  readonly onProgress: (progress: number) => void;
  readonly onStageChange: (id: string, index: number) => void;
}

export interface ScrollControllerHandle {
  refresh(): void;
  progress(): number;
  destroy(): void;
}

interface SectionWindow {
  readonly id: string;
  readonly kind: string;
  readonly stageId: string | null;
  readonly element: HTMLElement;
  /** Camera parameter this section sits on. */
  readonly param: number;
  /** Scroll position at which this section is centred on screen. */
  key: number;
}

function readSections(): SectionWindow[] {
  const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-section]'));
  let previousParam = 0;
  return elements.map((element, index) => {
    const raw = Number.parseFloat(element.dataset.param ?? '');
    const fallback = EXPERIENCE[index]?.param;
    // Never let a section walk the camera backwards: the journey is linear.
    const param = Math.max(Number.isFinite(raw) ? raw : (fallback ?? index), previousParam);
    previousParam = param;
    return {
      id: element.id,
      kind: element.dataset.kind ?? 'stage',
      stageId: element.dataset.stage ?? null,
      element,
      param,
      key: 0,
    };
  });
}

export function initScrollController(options: ScrollControllerOptions): ScrollControllerHandle {
  const viewportHeight = (): number => Math.max(window.innerHeight, 1);
  let sections = readSections();
  let currentProgress = 0;
  let currentStage = -1;
  let refreshFrame = 0;

  function measure(): void {
    const half = viewportHeight() / 2;
    let previousKey = 0;
    sections = sections.map((entry) => {
      const key = Math.max(entry.element.offsetTop + entry.element.offsetHeight / 2 - half, previousKey);
      previousKey = key;
      return { ...entry, key };
    });
  }

  function progressAt(scrollY: number): number {
    if (sections.length === 0) return 0;
    const first = sections[0] as SectionWindow;
    const last = sections[sections.length - 1] as SectionWindow;
    if (scrollY <= first.key) return first.param;
    if (scrollY >= last.key) return last.param;

    for (let index = 0; index < sections.length - 1; index += 1) {
      const from = sections[index] as SectionWindow;
      const to = sections[index + 1] as SectionWindow;
      if (scrollY >= from.key && scrollY <= to.key) {
        const span = Math.max(to.key - from.key, 1);
        const local = (scrollY - from.key) / span;
        return from.param + (to.param - from.param) * local;
      }
    }
    return last.param;
  }

  /** The stage the camera is closest to — the rail always shows a real stage. */
  function nearestStage(progress: number): { id: string; index: number } {
    let best: { id: string; index: number; distance: number } = {
      id: JOURNEY[0]?.id ?? 'earth',
      index: 0,
      distance: Number.POSITIVE_INFINITY,
    };
    sections.forEach((entry, index) => {
      if (entry.kind !== 'stage' || entry.stageId === null) return;
      const distance = Math.abs(entry.param - progress);
      if (distance < best.distance) {
        best = { id: entry.stageId, index, distance };
      }
    });
    return { id: best.id, index: best.index };
  }

  function publish(progress: number): void {
    currentProgress = progress;
    options.onProgress(progress);
    document.documentElement.style.setProperty(
      '--journey-progress',
      (progress / LAST_STAGE_PARAM).toFixed(4),
    );
    const stage = nearestStage(progress);
    if (stage.id !== '' && stage.index !== currentStage) {
      currentStage = stage.index;
      document.documentElement.dataset.activeStage = stage.id;
      options.onStageChange(stage.id, stage.index);
    }
  }

  function sync(): void {
    publish(progressAt(window.scrollY));
  }

  function queueRefresh(): void {
    if (refreshFrame !== 0) return;
    refreshFrame = window.requestAnimationFrame(() => {
      refreshFrame = 0;
      measure();
      sync();
    });
  }

  // A reload must start at the opening unless the URL asks for a stage.
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  const hasDeepLink = sections.some((entry) => `#${entry.id}` === window.location.hash);

  measure();
  if (hasDeepLink) {
    const target = document.getElementById(window.location.hash.slice(1));
    target?.scrollIntoView({ block: 'center', behavior: 'auto' });
  } else if (window.location.hash.length === 0 && window.scrollY > 0) {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }
  sync();

  const trigger = ScrollTrigger.create({
    trigger: document.documentElement,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: sync,
    onRefresh: queueRefresh,
  });

  const resizeObserver = new ResizeObserver(queueRefresh);
  resizeObserver.observe(document.body);

  return {
    refresh(): void {
      measure();
      ScrollTrigger.refresh();
      sync();
    },

    progress(): number {
      return currentProgress;
    },

    destroy(): void {
      trigger.kill();
      resizeObserver.disconnect();
      if (refreshFrame !== 0) window.cancelAnimationFrame(refreshFrame);
    },
  };
}

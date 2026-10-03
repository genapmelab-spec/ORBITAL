import { setScrollState } from './store.ts';

/**
 * Scroll → camera parameter.
 *
 * Each section contributes two stops: one where its camera key has been reached
 * (the moment it settles under the chrome) and one where the camera is allowed
 * to leave again. Between stops the parameter interpolates linearly; between a
 * section's two stops it does not move at all. That is what gives the flight its
 * rhythm — arrive, hold while the copy is read, depart — without measuring
 * anything by hand.
 */

export const SETTLE_FRACTION = 0.18;
export const RELEASE_FRACTION = 0.3;

interface SectionMetric {
  readonly id: string;
  readonly param: number;
  readonly top: number;
  readonly height: number;
  /** Optional hold length in viewport units, from `data-hold`. */
  readonly hold: number;
}

interface Stop {
  readonly top: number;
  readonly param: number;
}

export function initScroll(): void {
  const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-section]'));
  let metrics: SectionMetric[] = [];
  let stops: Stop[] = [];
  let firstStop = 0;
  let lastStop = 1;
  let scheduled = false;

  function measure(): void {
    const viewport = window.innerHeight;
    const scrollY = window.scrollY;
    metrics = elements.map((element) => {
      const rect = element.getBoundingClientRect();
      return {
        id: element.dataset.id ?? '',
        param: Number(element.dataset.param ?? '0'),
        top: rect.top + scrollY,
        height: element.offsetHeight,
        hold: Number(element.dataset.hold ?? '0'),
      };
    });

    const next: Stop[] = [];
    for (const metric of metrics) {
      const settle = metric.top + Math.min(viewport * SETTLE_FRACTION, metric.height * 0.25);
      // A section may cap its hold in viewport units (`data-hold`): the hero
      // holds the window still for one screen, not for the whole 190svh it
      // occupies, so the flight starts while its copy is still on screen.
      const cap = metric.hold > 0 ? metric.top + viewport * metric.hold : Number.POSITIVE_INFINITY;
      const release = Math.max(
        Math.min(metric.top + metric.height - viewport * RELEASE_FRACTION, cap),
        settle,
      );
      next.push({ top: settle, param: metric.param });
      next.push({ top: release, param: metric.param });
    }
    next.sort((a, b) => a.top - b.top);
    stops = next;
    firstStop = stops[0]?.top ?? 0;
    lastStop = stops[stops.length - 1]?.top ?? 1;
  }

  function paramAt(scrollY: number): number {
    if (stops.length === 0) {
      return 0;
    }
    const first = stops[0] as Stop;
    if (scrollY <= first.top) {
      return first.param;
    }
    const last = stops[stops.length - 1] as Stop;
    if (scrollY >= last.top) {
      return last.param;
    }
    for (let index = 1; index < stops.length; index += 1) {
      const previous = stops[index - 1] as Stop;
      const current = stops[index] as Stop;
      if (scrollY <= current.top) {
        const span = current.top - previous.top;
        const t = span <= 0 ? 0 : (scrollY - previous.top) / span;
        return previous.param + (current.param - previous.param) * t;
      }
    }
    return last.param;
  }

  function activeAt(scrollY: number): string {
    const viewport = window.innerHeight;
    let id = metrics[0]?.id ?? 'entry';
    for (const metric of metrics) {
      if (scrollY >= metric.top - viewport * SETTLE_FRACTION) {
        id = metric.id;
      }
    }
    return id;
  }

  function update(): void {
    scheduled = false;
    const scrollY = window.scrollY;
    const param = paramAt(scrollY);
    const progress = Math.min(
      Math.max((scrollY - firstStop) / Math.max(lastStop - firstStop, 1), 0),
      1,
    );
    document.documentElement.style.setProperty('--journey-progress', progress.toFixed(4));
    setScrollState({ param, activeId: activeAt(scrollY), progress });
  }

  function schedule(): void {
    if (scheduled) {
      return;
    }
    scheduled = true;
    requestAnimationFrame(update);
  }

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', () => {
    measure();
    schedule();
  });

  measure();
  update();
  // Late layout shifts (webfonts, wrapped headlines) move every stop at once.
  if ('fonts' in document) {
    void document.fonts.ready.then(() => {
      measure();
      schedule();
    });
  }
  window.addEventListener('load', () => {
    measure();
    schedule();
  });
  window.setTimeout(() => {
    measure();
    schedule();
  }, 1200);
}

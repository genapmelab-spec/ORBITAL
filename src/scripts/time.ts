import {
  MILLISECONDS_PER_DAY,
  addDays,
  earthMarsDistanceAu,
  formatIsoDate,
} from '../three/systems/epoch.ts';

/**
 * The time control.
 *
 * One slider, one date, and the model recomputes: the scene re-places every
 * body, and the numbers under the slider are computed here from the same
 * orbital elements — so the section still tells the truth on a machine without
 * WebGL, it just tells it in figures instead of in light.
 *
 * `?date=YYYY-MM-DD` is the page's single deep link: it sets the slider (a
 * signed day offset from today, clamped to the control's own range), and the
 * address bar keeps tracking the chosen date afterwards — so "copy link"
 * always shares the exact moment on screen. The date format is UTC ISO, the
 * only format the page prints.
 */

export interface TimeHandlers {
  setEpoch(date: Date): void;
}

export function initTime(handlers: TimeHandlers): void {
  const found = document.querySelector<HTMLInputElement>('[data-time-slider]');
  const daysLabel = document.querySelector<HTMLElement>('[data-time-days]');
  const dateLabel = document.querySelector<HTMLTimeElement>('[data-time-date]');
  const metricLabel = document.querySelector<HTMLElement>('[data-time-metric]');
  const reset = document.querySelector<HTMLButtonElement>('[data-time-reset]');
  const note = document.querySelector<HTMLElement>('[data-webgl-note]');

  const today = new Date();
  const iso = formatIsoDate(today);
  for (const element of document.querySelectorAll<HTMLElement>('[data-epoch-label]')) {
    element.textContent = iso;
  }
  if (dateLabel !== null) {
    dateLabel.dateTime = iso;
    dateLabel.textContent = iso;
  }
  if (metricLabel !== null) {
    metricLabel.textContent = `${earthMarsDistanceAu(today).toFixed(2)} AU`;
  }

  if (document.documentElement.classList.contains('no-webgl') && note !== null) {
    note.hidden = false;
  }

  if (found === null) {
    return;
  }
  const slider: HTMLInputElement = found;
  const minimumDays = Number.parseInt(slider.min, 10);
  const maximumDays = Number.parseInt(slider.max, 10);

  function requestedDays(): number {
    const raw = new URLSearchParams(window.location.search).get('date');
    if (raw === null) {
      return 0;
    }
    const requested = Date.parse(`${raw}T00:00:00Z`);
    if (Number.isNaN(requested)) {
      return 0;
    }
    const todayUtc = Date.parse(`${iso}T00:00:00Z`);
    const days = Math.round((requested - todayUtc) / MILLISECONDS_PER_DAY);
    const low = Number.isNaN(minimumDays) ? Number.NEGATIVE_INFINITY : minimumDays;
    const high = Number.isNaN(maximumDays) ? Number.POSITIVE_INFINITY : maximumDays;
    return Math.min(Math.max(days, low), high);
  }

  function syncAddressBar(days: number, date: Date): void {
    const url = new URL(window.location.href);
    if (days === 0) {
      url.searchParams.delete('date');
    } else {
      url.searchParams.set('date', formatIsoDate(date));
    }
    const next = url.toString();
    if (next === window.location.href) {
      return;
    }
    try {
      history.replaceState(null, '', next);
    } catch {
      // A sandboxed document may refuse history writes; the shared link is
      // then just the plain page, which is still a truthful share.
    }
  }

  let frame = 0;
  function apply(): void {
    frame = 0;
    const days = Number.parseInt(slider.value, 10);
    const date = addDays(today, days);
    const label = days === 0 ? 'today' : `${days > 0 ? '+' : ''}${days} d`;
    if (daysLabel !== null) {
      daysLabel.textContent = label;
    }
    if (dateLabel !== null) {
      dateLabel.dateTime = formatIsoDate(date);
      dateLabel.textContent = formatIsoDate(date);
    }
    if (metricLabel !== null) {
      metricLabel.textContent = `${earthMarsDistanceAu(date).toFixed(2)} AU`;
    }
    // The hero's "positions computed for …" claim must follow the model, not
    // the clock — a deep-linked date is a claim the whole page makes.
    for (const element of document.querySelectorAll<HTMLElement>('[data-epoch-label]')) {
      element.textContent = formatIsoDate(date);
    }
    syncAddressBar(days, date);
    handlers.setEpoch(date);
  }

  slider.addEventListener('input', () => {
    if (frame !== 0) {
      return;
    }
    frame = requestAnimationFrame(apply);
  });

  reset?.addEventListener('click', () => {
    slider.value = '0';
    apply();
    slider.focus();
  });

  slider.value = String(requestedDays());
  apply();
}

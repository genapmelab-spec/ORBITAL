/**
 * Navigation — one system for the whole journey: the floating journey rail on
 * wide screens, the same list as a full-screen sheet below 48rem. No second
 * navigation, no dashboard chrome: the rail is numbers, nothing else.
 *
 * The chrome is a spacecraft instrument, not a website navbar: it presents
 * itself once at boot, then retires. After a few seconds without attention it
 * slides out of the way so nothing competes with the flight, and it re-appears
 * when the visitor reaches for it — pointer proximity or hover over the rail,
 * scrolling, keyboard focus, or the mobile menu. Transitions are long and
 * gentle (journey.css owns the actual motion), so it never pops.
 */

/** Delay before focus follows an in-page anchor, so the smooth scroll wins. */
export const ANCHOR_FOCUS_DELAY_MS = 420;

/** Idle time before the chrome retires, in milliseconds. */
export const NAV_IDLE_HIDE_MS = 4000;
/** The reveal halo: reaching toward the rail already shows it (px). */
export const NAV_PROXIMITY_PX = 120;
/** Preloader → first idle-hide delay: the instrument presents itself calmly. */
export const NAV_INITIAL_DELAY_MS = 3200;

export interface NavHandle {
  /** Highlights the stage the camera is currently inside. */
  setActiveStage(id: string): void;
  destroy(): void;
}

function openSheet(sheet: HTMLElement, button: HTMLElement): void {
  sheet.classList.add('is-open');
  sheet.removeAttribute('hidden');
  button.setAttribute('aria-expanded', 'true');
  sheet.querySelector<HTMLElement>('[data-stage-link]')?.focus();
}

function closeSheet(sheet: HTMLElement, button: HTMLElement, restoreFocus: boolean): void {
  sheet.classList.remove('is-open');
  button.setAttribute('aria-expanded', 'false');
  if (restoreFocus) button.focus();
}

export function initNav(): NavHandle {
  const chrome = document.querySelector<HTMLElement>('[data-chrome]');
  const sheet = document.querySelector<HTMLElement>('[data-journey-sheet]');
  const button = document.querySelector<HTMLElement>('[data-journey-menu]');
  const close = document.querySelector<HTMLElement>('[data-journey-close]');
  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-stage-link]'));

  /* ── Auto-hide ────────────────────────────────────────────────────────────
     States live on the chrome element itself: `is-dormant` when retired. The
     sheet holds the chrome awake (`is-held`) for as long as it is open, and
     keyboard focus inside the chrome does the same — a hidden control must
     never be the thing a keyboard user is about to reach. */
  let hideTimer = 0;
  let dormant = false;
  let armed = false;
  let lastScrollY = window.scrollY;

  const wake = (): void => {
    if (chrome !== null) chrome.classList.remove('is-dormant');
    dormant = false;
    window.clearTimeout(hideTimer);
    if (armed) hideTimer = window.setTimeout(retire, NAV_IDLE_HIDE_MS);
  };

  const retire = (): void => {
    // The sheet needs its parent control visible; focus means "in use".
    const sheetOpen = sheet?.classList.contains('is-open') ?? false;
    const focusInside = chrome?.matches(':focus-within') ?? false;
    if (sheetOpen || focusInside) {
      hideTimer = window.setTimeout(retire, NAV_IDLE_HIDE_MS);
      return;
    }
    if (chrome !== null) chrome.classList.add('is-dormant');
    dormant = true;
  };

  const scheduleHide = (): void => {
    window.clearTimeout(hideTimer);
    hideTimer = window.setTimeout(retire, NAV_IDLE_HIDE_MS);
  };

  const arm = (): void => {
    if (armed) return;
    armed = true;
    scheduleHide();
  };

  const onPointerMove = (event: PointerEvent): void => {
    const clientY = event.clientY;
    if (clientY <= NAV_PROXIMITY_PX) {
      if (dormant) wake();
      else scheduleHide();
    }
  };

  const onScroll = (): void => {
    const y = window.scrollY;
    if (Math.abs(y - lastScrollY) < 1) return;
    lastScrollY = y;
    if (dormant) wake();
    else scheduleHide();
  };

  /* Boot: present the instrument, let the visitor read it once, then retire. */
  window.setTimeout(() => {
    arm();
  }, NAV_INITIAL_DELAY_MS);

  document.addEventListener('pointermove', onPointerMove, { passive: true });
  document.addEventListener('scroll', onScroll, { passive: true });

  /* ── Sheet ──────────────────────────────────────────────────────────────── */
  const onButtonClick = (): void => {
    if (sheet === null || button === null) return;
    if (sheet.classList.contains('is-open')) {
      closeSheet(sheet, button, false);
    } else {
      openSheet(sheet, button);
    }
    wake();
  };

  const onCloseClick = (): void => {
    if (sheet === null || button === null) return;
    closeSheet(sheet, button, true);
    wake();
  };

  const onKeydown = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape' || sheet === null || button === null) return;
    if (sheet.classList.contains('is-open')) closeSheet(sheet, button, true);
  };

  const onDocumentClick = (event: MouseEvent): void => {
    const anchor = (event.target as HTMLElement | null)?.closest<HTMLAnchorElement>('a[href^=\"#\"]');
    if (anchor === null || anchor === undefined) return;
    const targetId = anchor.getAttribute('href')?.slice(1);
    if (targetId === undefined || targetId.length === 0) return;
    const target = document.getElementById(targetId);
    if (target === null) return;

    if (sheet !== null && button !== null && sheet.classList.contains('is-open')) {
      closeSheet(sheet, button, false);
    }

    // Keep keyboard users with the camera: focus the stage they jumped to.
    window.setTimeout(() => {
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }, ANCHOR_FOCUS_DELAY_MS);
  };

  button?.addEventListener('click', onButtonClick);
  close?.addEventListener('click', onCloseClick);
  document.addEventListener('keydown', onKeydown);
  document.addEventListener('click', onDocumentClick);

  /* Focus entering the chrome (or the sheet it controls) keeps it awake. */
  chrome?.addEventListener('focusin', wake);
  chrome?.addEventListener('focusout', () => scheduleHide());

  return {
    setActiveStage(id: string): void {
      const current = `#${id}`;
      for (const link of links) {
        const isCurrent = link.getAttribute('href') === current;
        if (isCurrent) {
          link.setAttribute('aria-current', 'true');
        } else {
          link.removeAttribute('aria-current');
        }
      }
    },

    destroy(): void {
      window.clearTimeout(hideTimer);
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('scroll', onScroll);
      button?.removeEventListener('click', onButtonClick);
      close?.removeEventListener('click', onCloseClick);
      document.removeEventListener('keydown', onKeydown);
      document.removeEventListener('click', onDocumentClick);
      chrome?.removeEventListener('focusin', wake);
    },
  };
}

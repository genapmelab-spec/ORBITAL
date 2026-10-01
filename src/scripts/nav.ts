/**
 * Navigation — one system for the whole journey: the floating journey rail on
 * wide screens, the same list as a full-screen sheet below 48rem. No second
 * navigation, no dashboard chrome: the rail is numbers, nothing else.
 */

/** Delay before focus follows an in-page anchor, so the smooth scroll wins. */
export const ANCHOR_FOCUS_DELAY_MS = 420;

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
  const sheet = document.querySelector<HTMLElement>('[data-journey-sheet]');
  const button = document.querySelector<HTMLElement>('[data-journey-menu]');
  const close = document.querySelector<HTMLElement>('[data-journey-close]');
  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-stage-link]'));

  const onButtonClick = (): void => {
    if (sheet === null || button === null) return;
    if (sheet.classList.contains('is-open')) {
      closeSheet(sheet, button, false);
    } else {
      openSheet(sheet, button);
    }
  };

  const onCloseClick = (): void => {
    if (sheet === null || button === null) return;
    closeSheet(sheet, button, true);
  };

  const onKeydown = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape' || sheet === null || button === null) return;
    if (sheet.classList.contains('is-open')) closeSheet(sheet, button, true);
  };

  const onDocumentClick = (event: MouseEvent): void => {
    const anchor = (event.target as HTMLElement | null)?.closest<HTMLAnchorElement>('a[href^="#"]');
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
      button?.removeEventListener('click', onButtonClick);
      close?.removeEventListener('click', onCloseClick);
      document.removeEventListener('keydown', onKeydown);
      document.removeEventListener('click', onDocumentClick);
    },
  };
}

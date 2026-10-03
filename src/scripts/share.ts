/**
 * Share. The page has no backend by design (docs/PRD.md), so the only honest
 * action is to hand over the link: copy it, confirm it, put the label back. On
 * browsers without the clipboard API the control removes itself rather than
 * pretending to work.
 */

export const SHARE_CONFIRM_MS = 2600;

export function initShare(): void {
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-share]'));
  if (buttons.length === 0) {
    return;
  }

  const clipboard = navigator.clipboard;
  if (clipboard === undefined || typeof clipboard.writeText !== 'function') {
    for (const button of buttons) {
      button.hidden = true;
    }
    return;
  }

  for (const button of buttons) {
    const label = button.querySelector<HTMLElement>('[data-share-label]');
    if (label === null) {
      continue;
    }
    const original = label.textContent ?? '';
    let timer = 0;

    button.addEventListener('click', () => {
      void clipboard
        .writeText(window.location.href)
        .then(() => {
          label.textContent = 'Link copied';
        })
        .catch(() => {
          label.textContent = 'Copy failed';
        })
        .finally(() => {
          window.clearTimeout(timer);
          timer = window.setTimeout(() => {
            label.textContent = original;
          }, SHARE_CONFIRM_MS);
        });
    });
  }
}

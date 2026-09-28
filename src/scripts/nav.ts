/**
 * nav.ts — chrome behaviour only.
 * The mobile/tablet menu is a full-screen overlay, never a drawer: there is no
 * sidebar anywhere in this design.
 */

const OVERLAY_FADE_MS = 320;
const SCROLLED_AT = 42;

export function initNav(): void {
  const nav = document.querySelector<HTMLElement>('[data-nav]');
  const toggle = document.querySelector<HTMLButtonElement>('[data-nav-toggle]');
  const overlay = document.querySelector<HTMLElement>('[data-nav-overlay]');
  const scrim = document.querySelector<HTMLElement>('[data-nav-scrim]');

  let ticking = false;
  const onScroll = (): void => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      nav?.classList.toggle('is-scrolled', window.scrollY > SCROLLED_AT);
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (!toggle || !overlay) return;

  let open = false;
  let closeTimer = 0;

  const setOpen = (next: boolean): void => {
    if (next === open) return;
    open = next;

    toggle.setAttribute('aria-expanded', String(open));
    const label = toggle.querySelector('.sr-only');
    if (label) label.textContent = open ? 'Close mission menu' : 'Open mission menu';

    window.clearTimeout(closeTimer);

    if (open) {
      overlay.hidden = false;
      if (scrim) scrim.hidden = false;
      requestAnimationFrame(() => {
        overlay.classList.add('is-open');
        scrim?.classList.add('is-open');
      });
      overlay.querySelector<HTMLElement>('a')?.focus();
      return;
    }

    overlay.classList.remove('is-open');
    scrim?.classList.remove('is-open');
    closeTimer = window.setTimeout(() => {
      overlay.hidden = true;
      if (scrim) scrim.hidden = true;
      toggle.focus();
    }, OVERLAY_FADE_MS);
  };

  toggle.addEventListener('click', () => setOpen(!open));
  scrim?.addEventListener('click', () => setOpen(false));

  for (const link of document.querySelectorAll<HTMLAnchorElement>('[data-overlay-link]')) {
    link.addEventListener('click', () => setOpen(false));
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && open) setOpen(false);
  });

  // The overlay is fixed, so close it the moment the page moves underneath.
  window.addEventListener(
    'scroll',
    () => {
      if (open) setOpen(false);
    },
    { passive: true },
  );

  window.matchMedia('(min-width: 1024px)').addEventListener('change', (event) => {
    if (event.matches) setOpen(false);
  });
}

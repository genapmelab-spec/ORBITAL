import { ACTS, DESTINATION_BY_ID } from '../content/experience.ts';
import { subscribeScroll } from './store.ts';

/**
 * The chrome.
 *
 * One navigation system, and it behaves like part of the environment rather than
 * a permanent bar: after three seconds without navigation intent it retracts;
 * scrolling up, moving the pointer toward the top edge, focusing into it or
 * pressing the trigger brings it back. Nothing here can hide it while it holds
 * keyboard focus or while the section list is open — that would be a trap.
 */

export const NAV_IDLE_MS = 3000;
export const NAV_INITIAL_MS = 2600;
export const NAV_PROXIMITY_PX = 110;
export const NAV_SCROLL_DELTA = 6;
export const NAV_WAKE_DELAY_MS = 120;

interface Label {
  readonly index: string;
  readonly name: string;
  readonly live: string;
}

function labelFor(id: string): Label {
  if (id === 'entry') {
    return { index: '00', name: 'Pre-flight', live: 'Start of the flight' };
  }
  if (id === 'premise') {
    return { index: '--', name: 'Why ORBITAL', live: 'Why ORBITAL exists' };
  }
  const act = ACTS.find((candidate) => candidate.id === id);
  if (act !== undefined) {
    return { index: act.number, name: act.name, live: `Act ${act.number}: ${act.name}` };
  }
  if (id === 'control') {
    return { index: '--', name: 'Controls', live: 'Controls: set the date' };
  }
  if (id === 'close') {
    return { index: '--', name: 'The model', live: 'End of the flight' };
  }
  const destination = Object.values(DESTINATION_BY_ID).find((candidate) => candidate.id === id);
  if (destination !== undefined) {
    return {
      index: String(destination.index).padStart(2, '0'),
      name: destination.name,
      live: `Destination ${destination.index} of 6: ${destination.name}`,
    };
  }
  return { index: '00', name: 'ORBITAL', live: '' };
}

export function initChrome(): void {
  const found = document.querySelector<HTMLElement>('[data-chrome]');
  if (found === null) {
    return;
  }
  // Narrowed once, then captured by the closures below — avoids re-checking
  // the same null in every handler.
  const chrome: HTMLElement = found;
  const nav = chrome.querySelector<HTMLElement>('[data-nav]');
  const trigger = chrome.querySelector<HTMLButtonElement>('[data-nav-trigger]');
  const links = Array.from(chrome.querySelectorAll<HTMLAnchorElement>('[data-nav-link]'));
  const indexLabel = chrome.querySelector<HTMLElement>('[data-chrome-index]');
  const nameLabel = chrome.querySelector<HTMLElement>('[data-chrome-name]');
  const liveLabel = chrome.querySelector<HTMLElement>('[data-chrome-live]');

  let idleTimer = 0;
  let wakeTimer = 0;
  let lastScroll = window.scrollY;
  let dormant = false;

  function isOpen(): boolean {
    return nav?.classList.contains('is-open') ?? false;
  }

  function holdsFocus(): boolean {
    const active = document.activeElement;
    return active instanceof Element && chrome.contains(active);
  }

  function wake(): void {
    window.clearTimeout(idleTimer);
    window.clearTimeout(wakeTimer);
    if (dormant) {
      dormant = false;
      chrome.classList.remove('is-dormant');
    }
    idleTimer = window.setTimeout(retire, NAV_IDLE_MS);
  }

  function retire(): void {
    if (isOpen() || holdsFocus()) {
      return;
    }
    dormant = true;
    chrome.classList.add('is-dormant');
  }

  function wakeSoon(): void {
    if (dormant) {
      window.clearTimeout(wakeTimer);
      wakeTimer = window.setTimeout(wake, NAV_WAKE_DELAY_MS);
    } else {
      wake();
    }
  }

  window.addEventListener(
    'scroll',
    () => {
      const current = window.scrollY;
      const delta = current - lastScroll;
      lastScroll = current;
      if (delta < -NAV_SCROLL_DELTA) {
        // Upward is navigation intent: the bar comes back immediately.
        wake();
        return;
      }
      // Downward is not: the timer keeps running, so the bar retracts about
      // three seconds after the last time the visitor actually asked for it.
      wakeSoon();
    },
    { passive: true },
  );

  window.addEventListener(
    'pointermove',
    (event) => {
      if (event.clientY <= NAV_PROXIMITY_PX) {
        wake();
      } else if (!dormant) {
        wakeSoon();
      }
    },
    { passive: true },
  );

  chrome.addEventListener('focusin', wake);
  chrome.addEventListener('focusout', () => {
    if (!holdsFocus()) {
      wake();
    }
  });

  trigger?.addEventListener('click', () => {
    const open = !isOpen();
    nav?.classList.toggle('is-open', open);
    trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    wake();
  });

  for (const link of links) {
    link.addEventListener('click', () => {
      if (isOpen()) {
        nav?.classList.remove('is-open');
        trigger?.setAttribute('aria-expanded', 'false');
      }
      wake();
    });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !isOpen()) {
      return;
    }
    nav?.classList.remove('is-open');
    trigger?.setAttribute('aria-expanded', 'false');
    trigger?.focus();
  });

  document.addEventListener('pointerdown', (event) => {
    if (!isOpen()) {
      return;
    }
    const target = event.target;
    if (target instanceof Node && !chrome.contains(target)) {
      nav?.classList.remove('is-open');
      trigger?.setAttribute('aria-expanded', 'false');
    }
  });

  subscribeScroll((state) => {
    const label = labelFor(state.activeId);
    if (indexLabel !== null) {
      indexLabel.textContent = label.index;
    }
    if (nameLabel !== null) {
      nameLabel.textContent = label.name;
    }
    if (liveLabel !== null && liveLabel.textContent !== label.live) {
      liveLabel.textContent = label.live;
    }
    for (const link of links) {
      const isActive = link.dataset.navLink === state.activeId;
      if (isActive) {
        link.setAttribute('aria-current', 'true');
      } else {
        link.removeAttribute('aria-current');
      }
    }
  });

  idleTimer = window.setTimeout(retire, NAV_INITIAL_MS);
}

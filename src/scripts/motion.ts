import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { subscribeScroll } from './store.ts';

/**
 * Motion.
 *
 * Two jobs only: the opening choreography (driven by the camera parameter, never
 * by a timer — the hero reveals because the visitor moved, not because time
 * passed) and falling in reveals for everything below it. Reduced motion turns
 * both off; the CSS already leaves the content visible.
 */

export const VEIL_SAFETY_MS = 3200;
/** Scroll, in viewport heights, at which the identity arrives. */
export const REVEAL_AT_VIEWPORTS = 0.15;
/** Scroll at which the whisper and the scroll cue leave. */
export const DEPART_AT_VIEWPORTS = 0.6;
export const REVEAL_DURATION = 0.9;

export interface MotionOptions {
  readonly reducedMotion: boolean;
}

export function initMotion(options: MotionOptions): void {
  const entry = document.querySelector<HTMLElement>('[data-id="entry"]');
  const opening =
    entry === null ? [] : Array.from(entry.querySelectorAll<HTMLElement>('[data-opening="reveal"]'));

  if (options.reducedMotion) {
    entry?.classList.add('is-revealed');
  } else {
    gsap.registerPlugin(ScrollTrigger);
    gsap.set(opening, { opacity: 0, y: 22 });
    ScrollTrigger.batch('[data-reveal]', {
      start: 'top 82%',
      once: true,
      onEnter: (batch: Element[]) => {
        gsap.fromTo(
          batch,
          { opacity: 0, y: 22 },
          {
            opacity: 1,
            y: 0,
            duration: 0.75,
            ease: 'power2.out',
            stagger: 0.08,
            overwrite: true,
            clearProps: 'transform',
          },
        );
      },
    });
    ScrollTrigger.refresh();
    // Late layout shifts (webfonts, wrapped headlines) move every trigger.
    if ('fonts' in document) {
      void document.fonts.ready.then(() => ScrollTrigger.refresh());
    }
    window.addEventListener('load', () => ScrollTrigger.refresh());
  }

  // The opening is measured in scrolled pixels, not in camera parameter: the
  // camera holds still for a whole screen while the identity arrives, so a
  // parameter threshold would keep the headline hidden for that entire screen.
  let revealed = false;
  let departed = false;

  function reveal(): void {
    if (entry === null || revealed) {
      return;
    }
    revealed = true;
    entry.classList.add('is-revealed');
    if (!options.reducedMotion) {
      gsap.to(opening, {
        opacity: 1,
        y: 0,
        duration: REVEAL_DURATION,
        ease: 'power3.out',
        stagger: 0.09,
        overwrite: true,
      });
    }
  }

  function checkOpening(): void {
    if (entry === null || departed) {
      return;
    }
    const scrolled = window.scrollY;
    if (scrolled >= window.innerHeight * REVEAL_AT_VIEWPORTS) {
      reveal();
    }
    if (revealed && scrolled >= window.innerHeight * DEPART_AT_VIEWPORTS) {
      departed = true;
      entry.classList.add('is-departed');
    }
  }

  let scheduled = false;
  window.addEventListener(
    'scroll',
    () => {
      if (scheduled) {
        return;
      }
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        checkOpening();
      });
    },
    { passive: true },
  );
  checkOpening();

  // A deep link into the middle of the flight must not land on a hidden hero.
  subscribeScroll((state) => {
    if (state.progress > 0.02) {
      reveal();
      if (entry !== null && !departed) {
        departed = true;
        entry.classList.add('is-departed');
      }
    }
  });

  // The veil must never be able to trap the page, whatever the GPU decides.
  window.setTimeout(hideVeil, VEIL_SAFETY_MS);
}

export function hideVeil(): void {
  const veil = document.querySelector<HTMLElement>('[data-veil]');
  if (veil === null || veil.classList.contains('is-gone')) {
    return;
  }
  veil.classList.add('is-gone');
  window.setTimeout(() => veil.remove(), 900);
}

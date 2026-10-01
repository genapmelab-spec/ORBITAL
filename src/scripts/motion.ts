import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { JOURNEY } from '../content/journey';

gsap.registerPlugin(ScrollTrigger);

/**
 * Motion — the whole DOM choreography: boot sequence, hero load-in and the
 * once-per-pass scroll reveals. Reveals are CSS transitions toggled by a class,
 * so scrolling never runs a tween per element; GSAP is reserved for the boot
 * sequence and for ScrollTrigger's scroll bookkeeping.
 */

/** The bar must never flash: a minimum visible time keeps the boot sequence legible. */
export const PRELOADER_MIN_MS = 900;
/** Longest a visitor waits for the scene before entering without it. */
export const PRELOADER_MAX_MS = 2400;
export const PRELOADER_EXIT_MS = 700;
/** Must match the CSS escape hatch (base/journey styles) — last line of defence. */
export const PRELOADER_ESCAPE_MS = 3400;
/** Stagger between hero lines, milliseconds. */
export const HERO_STAGGER_MS = 130;

export interface MotionOptions {
  readonly reducedMotion: boolean;
}

function stageNameAt(fraction: number): string {
  const index = Math.min(Math.max(Math.floor(fraction * JOURNEY.length), 0), JOURNEY.length - 1);
  return JOURNEY[index]?.name ?? JOURNEY[0]?.name ?? 'EARTH';
}

function reveal(scope: ParentNode, selector: string, staggerMs: number): void {
  const elements = Array.from(scope.querySelectorAll<HTMLElement>(selector));
  elements.forEach((element, index) => {
    element.style.setProperty('--reveal-delay', `${index * staggerMs}ms`);
    element.classList.add('is-revealed');
  });
}

/** Shows everything regardless of the reveal state — the JS-failure safety net. */
export function revealAll(): void {
  reveal(document, '[data-reveal], [data-reveal-line]', 0);
}

/**
 * Boot sequence. Runs the bar toward 90% while the scene boots, then completes
 * when the scene's first frame lands (or when the ceiling is hit).
 */
export function runPreloader(ready: Promise<void>, options: MotionOptions): Promise<void> {
  const preloader = document.querySelector<HTMLElement>('[data-preloader]');
  const bar = document.querySelector<HTMLElement>('[data-preloader-bar]');
  const status = document.querySelector<HTMLElement>('[data-preloader-status]');
  if (preloader === null) return Promise.resolve();

  const finish = (): void => {
    preloader.classList.add('is-done');
    window.setTimeout(() => preloader.setAttribute('hidden', ''), PRELOADER_EXIT_MS);
  };

  if (options.reducedMotion) {
    finish();
    return Promise.resolve();
  }

  const started = performance.now();
  const state = { value: 0 };
  const paint = (): void => {
    if (bar !== null) bar.style.transform = `scaleX(${state.value.toFixed(4)})`;
    if (status !== null) status.textContent = `ENTERING ${stageNameAt(state.value)}`;
  };

  gsap.to(state, {
    value: 0.9,
    duration: PRELOADER_MAX_MS / 1000,
    ease: 'power2.out',
    onUpdate: paint,
  });

  return new Promise<void>((resolve) => {
    let settled = false;
    const complete = (): void => {
      if (settled) return;
      settled = true;
      gsap.killTweensOf(state);
      const elapsed = performance.now() - started;
      const wait = Math.max(PRELOADER_MIN_MS - elapsed, 0);
      gsap.to(state, {
        value: 1,
        duration: Math.max(wait, 220) / 1000,
        ease: 'power2.inOut',
        onUpdate: paint,
        onComplete: () => {
          finish();
          resolve();
        },
      });
    };

    void ready.then(complete);
    window.setTimeout(complete, PRELOADER_MAX_MS);
    window.setTimeout(() => {
      finish();
      complete();
    }, PRELOADER_ESCAPE_MS);
  });
}

/** The opening reveals on load, never on scroll. */
export function revealPrologue(options: MotionOptions): void {
  const prologue = document.querySelector<HTMLElement>('[data-prologue]');
  if (prologue === null) return;
  reveal(
    prologue,
    '[data-reveal], [data-reveal-line]',
    options.reducedMotion ? 0 : HERO_STAGGER_MS,
  );
}

/** One reveal per section (stage, moment or ending), on approach, fire-once. */
export function initSectionReveals(options: MotionOptions): void {
  const sections = document.querySelectorAll<HTMLElement>('[data-section]');
  for (const section of sections) {
    if (section.hasAttribute('data-prologue')) continue;
    ScrollTrigger.create({
      trigger: section,
      start: 'top 78%',
      once: true,
      onEnter: () =>
        reveal(section, '[data-reveal], [data-reveal-line]', options.reducedMotion ? 0 : 90),
    });
  }
}

/** Reveals the chrome once the scene is live, so it never floats over a loader. */
export function markChromeReady(): void {
  document.querySelector<HTMLElement>('[data-chrome]')?.classList.add('is-ready');
}

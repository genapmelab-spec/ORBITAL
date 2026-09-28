/**
 * motion.ts — every DOM animation in one place.
 *
 * Rules: transform and opacity only, never a layout property. Reveals run once.
 * With prefers-reduced-motion nothing is hidden and nothing moves — the loader
 * is skipped and all content is simply present.
 */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export interface MotionOptions {
  reducedMotion: boolean;
}

declare global {
  interface Window {
    __orbitalMotionReady?: boolean;
  }
}

const PRELOADER_TICK = [
  { at: 0.06, line: 0 },
  { at: 0.3, line: 1 },
  { at: 0.56, line: 2 },
  { at: 0.78, line: 3 },
];

const PRELOADER_MAX_MS = 2400;

interface RevealGroup {
  container: HTMLElement;
  targets: HTMLElement[];
  isLines: boolean;
}

function collectGroups(selector: string): RevealGroup[] {
  return Array.from(document.querySelectorAll<HTMLElement>(selector)).map((container) => {
    const lines = Array.from(container.querySelectorAll<HTMLElement>('[data-reveal-line]'));
    return { container, targets: lines.length > 0 ? lines : [container], isLines: lines.length > 0 };
  });
}

function initPreloader(onDone: () => void): void {
  const preloader = document.querySelector<HTMLElement>('[data-preloader]');
  if (!preloader) {
    onDone();
    return;
  }

  const lines = Array.from(preloader.querySelectorAll<HTMLElement>('[data-preloader-line]'));
  const bar = preloader.querySelector<HTMLElement>('[data-preloader-bar]');
  const percent = preloader.querySelector<HTMLElement>('[data-preloader-percent]');

  let loaded = false;
  let displayed = 0;
  let lastTime = performance.now();
  let finished = false;
  const started = lastTime;

  window.addEventListener('load', () => {
    loaded = true;
  });

  const finish = (): void => {
    if (finished) return;
    finished = true;
    preloader.classList.add('is-done');
    window.setTimeout(() => preloader.setAttribute('hidden', ''), 900);
    onDone();
  };

  const tick = (now: number): void => {
    const delta = Math.min((now - lastTime) / 1000, 1 / 20);
    lastTime = now;

    if (now - started > PRELOADER_MAX_MS) loaded = true;

    // Chase the real load event, but never stall the visitor on it.
    const target = loaded ? 1 : 0.86;
    displayed += (target - displayed) * (1 - Math.exp(-2.1 * delta));

    if (bar) bar.style.transform = `scaleX(${Math.min(displayed, 1).toFixed(3)})`;
    if (percent) percent.textContent = `${String(Math.floor(Math.min(displayed, 1) * 100)).padStart(2, '0')}%`;

    for (const entry of PRELOADER_TICK) {
      const line = lines[entry.line];
      if (line && displayed >= entry.at) line.classList.add('is-on');
    }

    if (displayed > 0.995) {
      window.setTimeout(finish, 260);
      return;
    }

    requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
}

/**
 * Hero choreography: the mission brief arrives line by line once the boot
 * sequence clears, so the first impression is authored rather than default.
 */
function playHero(animate: boolean): void {
  const groups = collectGroups('[data-reveal-onload]');
  if (groups.length === 0) return;

  const timeline = gsap.timeline({ defaults: { ease: 'power3.out' } });

  if (!animate) {
    timeline.set(
      groups.flatMap((group) => group.targets),
      { opacity: 1, y: 0 },
    );
    return;
  }

  for (const group of groups) {
    timeline.fromTo(
      group.targets,
      { opacity: 0, y: group.isLines ? '0.42em' : 22 },
      {
        opacity: 1,
        y: 0,
        duration: group.isLines ? 1.25 : 1.0,
        stagger: group.isLines ? 0.11 : 0.07,
      },
      group.isLines ? 0 : 0.12,
    );
  }
}

function initReveals(): void {
  const groups = collectGroups('[data-reveal]');
  for (const group of groups) {
    gsap.fromTo(
      group.targets,
      { opacity: 0, y: group.isLines ? '0.42em' : 26 },
      {
        opacity: 1,
        y: 0,
        duration: 1.05,
        ease: 'power3.out',
        stagger: 0.08,
        scrollTrigger: { trigger: group.container, start: 'top 88%', once: true },
      },
    );
  }
}

/**
 * The origin → destination bar fills as the trajectory section passes. The
 * marker is moved with `x` (a transform), never with `left`.
 */
function initTimelineBar(): void {
  const bar = document.querySelector<HTMLElement>('[data-timeline]');
  const marker = bar?.querySelector<HTMLElement>('[data-timeline-marker]');
  const rail = bar?.querySelector<HTMLElement>('.timeline__rail');
  if (!bar || !marker || !rail) return;

  gsap.fromTo(
    marker,
    { x: 0, xPercent: -50 },
    {
      x: () => rail.offsetWidth,
      xPercent: -50,
      ease: 'none',
      scrollTrigger: {
        trigger: bar,
        start: 'top 78%',
        end: 'bottom 42%',
        scrub: 0.6,
      },
    },
  );
}

export function initMotion(options: MotionOptions): void {
  gsap.registerPlugin(ScrollTrigger);

  if (options.reducedMotion) {
    // Nothing to hide, nothing to move: content is already in its final state.
    document.querySelector('[data-preloader]')?.setAttribute('hidden', '');
    playHero(false);
    window.__orbitalMotionReady = true;
    return;
  }

  initPreloader(() => playHero(true));
  initReveals();
  initTimelineBar();

  void document.fonts?.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });

  window.__orbitalMotionReady = true;
}

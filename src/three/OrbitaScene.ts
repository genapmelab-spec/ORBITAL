import {
  ACESFilmicToneMapping,
  Color,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  WebGLRenderer,
} from 'three';
import { CAMERA_FAR, CAMERA_NEAR } from './anchors';
import { LAST_STAGE_PARAM } from '../content/journey';
import { CameraPath } from './cameraPath';
import { QualityGovernor, profileFor } from './quality';
import type { FrameContext, QualityTier } from './types';
import { createWorld } from './world';

/**
 * OrbitaScene — the only renderer, the only RAF loop, the only place that
 * touches the GPU. Camera, world and quality all converge here; the DOM layer
 * talks to it through setProgress() and nothing else.
 */

/** Mirrors the --orb-void token: the canvas clear colour. */
export const SCENE_VOID = '#030510';
/** Frame-time clamp: a tab switch must never teleport the camera. */
export const MAX_FRAME_DT = 0.05;
/** Progress damping — the camera eases toward scroll instead of snapping to it. */
export const PROGRESS_DAMPING = 7;
/**
 * Portrait re-choreography triggers. These must agree with the CSS breakpoint
 * that moves captions to the bottom of the frame (63.99rem in journey.css):
 * the camera and the type have to change sides together, or the subject ends up
 * underneath the caption. Near-square viewports count as portrait too.
 */
export const PORTRAIT_WIDTH_LIMIT = 1024;
export const PORTRAIT_ASPECT_THRESHOLD = 1.15;
export const RESIZE_DEBOUNCE_MS = 140;
/** Speed smoothing for the starfield stretch uniform. */
export const SPEED_SMOOTHING = 4;

export interface OrbitaSceneOptions {
  readonly canvas: HTMLCanvasElement;
  readonly tier: QualityTier;
  readonly reducedMotion: boolean;
  /** Fired once after the first rendered frame: the veil can open. */
  readonly onFirstFrame?: () => void;
  readonly onTierChange?: (tier: QualityTier) => void;
}

export interface OrbitaSceneHandle {
  /** Journey parameter in stage units (0..13), driven by scrollController. */
  setProgress(progress: number): void;
  resize(): void;
  destroy(): void;
  readonly tier: QualityTier;
}

export function createOrbitaScene(options: OrbitaSceneOptions): OrbitaSceneHandle {
  const { canvas, reducedMotion } = options;

  let tier: QualityTier = options.tier;
  let profile = profileFor(tier);

  const renderer = new WebGLRenderer({
    canvas,
    antialias: tier === 'high',
    alpha: false,
    stencil: false,
    powerPreference: 'high-performance',
  });
  renderer.setClearColor(new Color(SCENE_VOID), 1);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;

  const pixelRatio = Math.min(window.devicePixelRatio || 1, profile.pixelRatio);
  renderer.setPixelRatio(pixelRatio);

  const scene = new Scene();
  const camera = new PerspectiveCamera(45, 1, CAMERA_NEAR, CAMERA_FAR);
  const world = createWorld(pixelRatio, profile);

  scene.add(world.root);

  const viewport = measure();
  camera.aspect = viewport.aspect;
  camera.updateProjectionMatrix();
  renderer.setSize(viewport.width, viewport.height, false);

  const cameraPath = new CameraPath(viewport.aspect, viewport.portrait);
  cameraPath.apply(0, camera);

  let progress = 0;
  let targetProgress = 0;
  let elapsed = 0;
  let lastFrame = 0;
  let speed = 0;
  let rafId = 0;
  let resizeTimer = 0;
  let firstFrameDone = false;
  let destroyed = false;
  const previousPosition = camera.position.clone();

  const governor = new QualityGovernor(tier, reducedMotion, (next) => {
    tier = next;
    profile = profileFor(next);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, profile.pixelRatio));
    renderer.setSize(viewport.width, viewport.height, false);
    world.applyProfile(profile);
    options.onTierChange?.(next);
  });

  function measure(): { width: number; height: number; aspect: number; portrait: boolean } {
    const width = Math.max(window.innerWidth, 1);
    const height = Math.max(window.innerHeight, 1);
    const aspect = width / height;
    const portrait = width <= PORTRAIT_WIDTH_LIMIT || aspect < PORTRAIT_ASPECT_THRESHOLD;
    return { width, height, aspect, portrait };
  }

  function render(now: number): void {
    rafId = window.requestAnimationFrame(render);
    if (destroyed) return;

    const rawDt = lastFrame === 0 ? 0.016 : (now - lastFrame) / 1000;
    const dt = Math.min(Math.max(rawDt, 0), MAX_FRAME_DT);
    lastFrame = now;
    elapsed += dt;

    // Damped progress: anchor jumps become flights, not cuts.
    const damping = reducedMotion ? 1 : Math.min(dt * PROGRESS_DAMPING, 1);
    progress += (targetProgress - progress) * damping;
    if (Math.abs(targetProgress - progress) < 0.0005) progress = targetProgress;

    const resolved = cameraPath.resolveProgress(progress, reducedMotion);
    cameraPath.apply(resolved, camera);

    const moved = camera.position.distanceTo(previousPosition);
    const instantSpeed = dt > 0 ? moved / dt : 0;
    speed += (instantSpeed - speed) * Math.min(dt * SPEED_SMOOTHING, 1);
    previousPosition.copy(camera.position);

    const context: FrameContext = {
      elapsed,
      dt,
      progress: resolved,
      normalized: resolved / LAST_STAGE_PARAM,
      speed,
      camera,
      tier,
      reducedMotion,
    };
    world.update(context);
    renderer.render(scene, camera);

    governor.sample(dt, now);

    if (!firstFrameDone) {
      firstFrameDone = true;
      options.onFirstFrame?.();
    }
  }

  function start(): void {
    if (destroyed || rafId !== 0) return;
    lastFrame = 0;
    rafId = window.requestAnimationFrame(render);
  }

  function stop(): void {
    if (rafId !== 0) {
      window.cancelAnimationFrame(rafId);
      rafId = 0;
    }
    governor.reset();
  }

  function handleResize(): void {
    const next = measure();
    camera.aspect = next.aspect;
    camera.updateProjectionMatrix();
    renderer.setSize(next.width, next.height, false);
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      // Layout keys depend on aspect: recompute, then re-frame instantly.
      cameraPath.layout(next.aspect, next.portrait);
      cameraPath.apply(cameraPath.resolveProgress(progress, reducedMotion), camera);
    }, RESIZE_DEBOUNCE_MS);
  }

  function handleVisibility(): void {
    if (document.hidden) {
      document.documentElement.dataset.scenePaused = 'true';
      stop();
    } else {
      delete document.documentElement.dataset.scenePaused;
      start();
    }
  }

  window.addEventListener('resize', handleResize);
  document.addEventListener('visibilitychange', handleVisibility);

  start();

  return {
    setProgress(next: number): void {
      targetProgress = Math.min(Math.max(next, 0), LAST_STAGE_PARAM);
    },

    resize(): void {
      handleResize();
    },

    destroy(): void {
      if (destroyed) return;
      destroyed = true;
      stop();
      window.clearTimeout(resizeTimer);
      delete document.documentElement.dataset.scenePaused;
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibility);
      world.dispose();
      scene.clear();
      renderer.dispose();
    },

    get tier(): QualityTier {
      return tier;
    },
  };
}

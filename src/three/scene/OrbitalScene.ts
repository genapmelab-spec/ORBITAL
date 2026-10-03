import {
  ACESFilmicToneMapping,
  Color,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from 'three';
import {
  CAMERA_FAR,
  CAMERA_NEAR,
  viewportFor,
  type Viewport,
} from '../camera/anchors.ts';
import { sampleCamera } from '../camera/path.ts';
import { createAnnotations, type AnnotationsHandle } from '../effects/annotations.ts';
import { PALETTE } from '../systems/palette.ts';
import {
  QUALITY_PROFILES,
  createGovernor,
  initialTier,
  type QualityProfile,
  type QualityTier,
} from '../systems/quality.ts';
import { createWorld, type WorldHandle } from './world.ts';
import type { FrameContext } from '../types.ts';

/**
 * The scene: one renderer, one camera, one loop.
 *
 * The loop owns three things nobody else may own — the clock, the damped
 * journey parameter, and the frame in which the camera is composed. Everything
 * else subscribes to it. Reduced motion turns the loop into a still camera that
 * re-renders only when the page actually changes something.
 */

export const PROGRESS_DAMPING = 7;
export const MAX_FRAME_DT = 0.05;
export const PARAM_EPSILON = 1e-4;
export const SPEED_DAMPING = 3;
export const TOP_INSET = 72;

export interface OrbitalSceneOptions {
  readonly canvas: HTMLCanvasElement;
  readonly stage: HTMLElement;
  readonly annotationLayer: HTMLElement;
  readonly reducedMotion: boolean;
  readonly onFirstFrame?: () => void;
}

export interface OrbitalSceneHandle {
  setParam(param: number): void;
  setEpoch(date: Date): void;
  readonly param: number;
  /** Current quality tier — observable for support via `__ORBITAL_DEBUG__`. */
  readonly tier: QualityTier;
  dispose(): void;
}

export function createOrbitalScene(options: OrbitalSceneOptions): OrbitalSceneHandle {
  const { canvas, stage, reducedMotion } = options;

  let width = Math.max(stage.clientWidth, 1);
  let height = Math.max(stage.clientHeight, 1);
  let viewport: Viewport = viewportFor(width, height);

  let profile: QualityProfile = QUALITY_PROFILES[initialTier()];
  const governor = createGovernor(profile.tier);

  const renderer = new WebGLRenderer({
    canvas,
    antialias: profile.antialias,
    powerPreference: 'high-performance',
    stencil: false,
  });
  renderer.setClearColor(new Color(PALETTE.void), 1);
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new Scene();
  const camera = new PerspectiveCamera(42, viewport.aspect, CAMERA_NEAR, CAMERA_FAR);
  scene.add(camera);

  const world: WorldHandle = createWorld(profile, renderer.getPixelRatio());
  camera.add(world.interior);
  scene.add(world.root);

  // Always created when motion is allowed: the handle decides per frame whether
  // the viewport is wide enough, which also survives the first layout pass
  // reporting a zero-width stage.
  let annotations: AnnotationsHandle | null = null;
  if (!reducedMotion) {
    annotations = createAnnotations(options.annotationLayer);
  }

  let target = 0;
  let param = 0;
  let elapsed = 0;
  let speed = 0;
  let last = 0;
  let raf = 0;
  let dirty = true;
  let firstFrame = false;

  const lookTarget = new Vector3();
  const previousPosition = new Vector3();

  function applyViewport(): void {
    camera.aspect = viewport.aspect;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, profile.pixelRatio));
    renderer.setSize(width, height, false);
    world.setAspect(viewport.aspect);
    dirty = true;
  }

  function applyProfile(next: QualityProfile): void {
    profile = next;
    world.setProfile(profile);
    applyViewport();
  }

  function resize(): void {
    const nextWidth = Math.max(stage.clientWidth, 1);
    const nextHeight = Math.max(stage.clientHeight, 1);
    if (nextWidth === width && nextHeight === height) {
      return;
    }
    width = nextWidth;
    height = nextHeight;
    viewport = viewportFor(width, height);
    applyViewport();
    schedule();
  }

  function renderFrame(nowMs: number): void {
    const dt = last === 0 ? 1 / 60 : Math.min((nowMs - last) / 1000, MAX_FRAME_DT);
    last = nowMs;
    elapsed += dt;

    previousPosition.copy(camera.position);

    if (reducedMotion) {
      param = target;
    } else {
      param += (target - param) * Math.min(1, dt * PROGRESS_DAMPING);
      if (Math.abs(target - param) < PARAM_EPSILON) {
        param = target;
      }
    }

    const frame = sampleCamera(param, world.positions, viewport, reducedMotion);
    camera.position.set(frame.position[0], frame.position[1], frame.position[2]);
    camera.up.set(frame.up[0], frame.up[1], frame.up[2]);
    if (camera.fov !== frame.fov) {
      camera.fov = frame.fov;
    }
    lookTarget.set(
      frame.position[0] + frame.forward[0],
      frame.position[1] + frame.forward[1],
      frame.position[2] + frame.forward[2],
    );
    camera.lookAt(lookTarget);
    camera.updateProjectionMatrix();

    const travelled = dt > 0 ? previousPosition.distanceTo(camera.position) / dt : 0;
    speed += (Math.min(travelled, 400) - speed) * Math.min(1, dt * SPEED_DAMPING);

    const ctx: FrameContext = {
      dt,
      elapsed,
      param,
      speed,
      camera,
      pixelRatio: renderer.getPixelRatio(),
    };
    world.update(ctx);

    if (annotations !== null) {
      annotations.update({
        param,
        frame,
        positions: world.positions,
        width,
        height,
        topInset: TOP_INSET,
      });
    }

    renderer.render(scene, camera);

    if (!firstFrame) {
      firstFrame = true;
      options.onFirstFrame?.();
    }

    const verdict = governor.frame(dt * 1000, nowMs);
    if (verdict !== null) {
      applyProfile(QUALITY_PROFILES[verdict]);
    }
  }

  function schedule(): void {
    if (raf !== 0) {
      return;
    }
    if (reducedMotion && !dirty) {
      return;
    }
    raf = requestAnimationFrame(tick);
  }

  function tick(nowMs: number): void {
    raf = 0;
    dirty = false;
    renderFrame(nowMs);
    if (document.hidden) {
      return;
    }
    schedule();
  }

  function onVisibility(): void {
    if (document.hidden) {
      if (raf !== 0) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
      return;
    }
    last = 0;
    dirty = true;
    schedule();
  }

  const observer = new ResizeObserver(resize);
  observer.observe(stage);
  document.addEventListener('visibilitychange', onVisibility);

  // The module's aperture is authored per aspect; keep it in step from the start.
  applyProfile(profile);
  schedule();

  return {
    get param(): number {
      return param;
    },
    get tier(): QualityTier {
      return profile.tier;
    },
    setParam(next: number): void {
      target = Math.min(Math.max(next, 0), Number.MAX_SAFE_INTEGER);
      dirty = true;
      schedule();
    },
    setEpoch(date: Date): void {
      world.setEpoch(date);
      dirty = true;
      schedule();
    },
    dispose(): void {
      if (raf !== 0) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      annotations?.dispose();
      world.dispose();
      renderer.dispose();
    },
  };
}

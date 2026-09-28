/**
 * OrbitaScene.ts — the ONE renderer, the ONE RAF loop, the ONE world.
 *
 * Everything the page needs from WebGL lives behind `initOrbitaScene`. The DOM
 * never touches three directly; it only pushes scroll progress, pointer and the
 * active act across this boundary.
 *
 * Colour pipeline decision (see shaders/surface.glsl.ts): colour management is
 * disabled and the output colour space is linear, which makes every authored
 * colour number the number that reaches the framebuffer. One convention, no
 * double conversions, custom shaders and standard materials agree.
 */

import * as THREE from 'three';
import { beatAt, clamp01, sampleActFraming, sampleCameraPath } from './cameraPath';
import { QUALITY_STEPS, QualityGovernor, detectInitialStep, settingsFor, type QualitySettings } from './quality';
import { createStarfield } from './objects/starfield';
import { createEarth } from './objects/earth';
import { createMars } from './objects/mars';
import { createCraft } from './objects/craft';
import { createExhaust, burnAt } from './objects/exhaust';
import { disposeHaloTexture } from './objects/halo';
import { AnchorBinder } from './anchors';
import { MARS, SUN_DIRECTION } from './world';
import type { PlanetObject } from './objects/planet';

const VOID_COLOR = 0x030510;
const AMBIENT_COLOR = 0x2b3853;
/**
 * Light budget note: three divides the Lambert term by PI, so a physically
 * plausible-looking intensity of 2 lands the hull at ~0.13 and reads as a
 * black cut-out. These values are tuned against the pass-through colour
 * pipeline described at the top of this file.
 */
const AMBIENT_INTENSITY = 2.4;
const SUN_INTENSITY = 6;
/** cool counter-light so the hull keeps an edge on its shadow side */
const RIM_INTENSITY = 1.6;
const ENV_SIZE = 256;

/** how quickly the camera catches up to the scroll position, 1/s */
const PROGRESS_SMOOTHING = 3.4;
/** how quickly star streak velocity bleeds off, 1/s */
const VELOCITY_RELEASE = 5.5;
/** scroll px/s → streak units, and the ceiling that keeps it watchable */
const VELOCITY_SCALE = 0.0016;
const VELOCITY_CEILING = 1;
/** act index → camera progress anchor */
const ACT_STEP = 0.25;

const MAX_DELTA = 1 / 15;

/**
 * A one-off equirectangular "sky": near-black with a single warm sun blob. Fed
 * through PMREM it gives the cruiser's metal something to reflect, which is the
 * difference between a lit spacecraft and a black cut-out.
 */
function createEnvironment(renderer: THREE.WebGLRenderer): THREE.WebGLRenderTarget | null {
  const canvas = document.createElement('canvas');
  canvas.width = ENV_SIZE;
  canvas.height = ENV_SIZE / 2;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const half = canvas.height;
  const sky = ctx.createLinearGradient(0, 0, 0, half);
  sky.addColorStop(0, '#20304d');
  sky.addColorStop(0.55, '#0d1626');
  sky.addColorStop(1, '#05070f');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, half);

  // Equirectangular placement of the key light.
  const u = Math.atan2(SUN_DIRECTION.x, SUN_DIRECTION.z) / (Math.PI * 2) + 0.5;
  const v = Math.acos(THREE.MathUtils.clamp(SUN_DIRECTION.y, -1, 1)) / Math.PI;
  const sunX = u * canvas.width;
  const sunY = v * half;
  const radius = canvas.width * 0.13;

  const glow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, radius);
  glow.addColorStop(0, 'rgba(255, 240, 214, 1)');
  glow.addColorStop(0.28, 'rgba(255, 198, 138, 0.62)');
  glow.addColorStop(1, 'rgba(255, 150, 80, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(sunX - radius, sunY - radius, radius * 2, radius * 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.LinearSRGBColorSpace;

  const pmrem = new THREE.PMREMGenerator(renderer);
  const target = pmrem.fromEquirectangular(texture);
  pmrem.dispose();
  texture.dispose();

  return target;
}

export interface OrbitaSceneOptions {
  canvas: HTMLCanvasElement;
  anchorStage: HTMLElement | null;
  reducedMotion: boolean;
  onQualityChange?: (settings: QualitySettings) => void;
}

export interface OrbitaSceneHandle {
  setProgress(progress: number): void;
  setVelocity(pixelsPerSecond: number): void;
  setActiveAct(index: number): void;
  setPointer(clientX: number, clientY: number): void;
  /** current camera beat label, for the stage dial readout */
  beat(): string;
  destroy(): void;
}

export function initOrbitaScene(options: OrbitaSceneOptions): OrbitaSceneHandle | null {
  const { canvas, anchorStage, reducedMotion } = options;

  let step = detectInitialStep();
  if (step < 0) return null; // skybox / no WebGL — the CSS composition takes over

  let settings = settingsFor(step);

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: settings.tier === 'full',
      alpha: false,
      stencil: false,
      powerPreference: 'high-performance',
    });
  } catch {
    return null;
  }

  THREE.ColorManagement.enabled = false;
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.setClearColor(VOID_COLOR, 1);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, settings.maxPixelRatio));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(48, 1, 1, 9000);

  // One key light. Everything else in the scene is emissive or additive.
  const sun = new THREE.DirectionalLight(0xfff4e6, SUN_INTENSITY);
  sun.position.copy(SUN_DIRECTION).multiplyScalar(400);
  scene.add(sun);
  scene.add(sun.target);

  const ambient = new THREE.AmbientLight(AMBIENT_COLOR, AMBIENT_INTENSITY);
  scene.add(ambient);

  const rim = new THREE.DirectionalLight(0x8fd8ff, RIM_INTENSITY);
  rim.position.copy(SUN_DIRECTION).multiplyScalar(-280);
  rim.position.y = 150;
  scene.add(rim);
  scene.add(rim.target);

  // Procedural environment: without one, metal reads as black. This costs one
  // 256px canvas and one PMREM pass at start-up, and no network bytes.
  const environment = createEnvironment(renderer);
  if (environment) scene.environment = environment.texture;

  // ---- objects -------------------------------------------------------------
  const starfield = createStarfield(settings.starCounts);
  const earth = createEarth(settings.earthSegments);
  const mars = createMars(settings.marsSegments);
  const craft = createCraft();
  const exhaust = createExhaust(renderer.getPixelRatio());
  const planets: PlanetObject[] = [earth, mars];

  scene.add(starfield.root, earth.root, mars.root, craft.root);
  craft.engineAnchor.add(exhaust.root);

  // ---- anchors: DOM labels bound to real subjects --------------------------
  let binder: AnchorBinder | null = null;
  if (anchorStage && getComputedStyle(anchorStage).display !== 'none') {
    binder = new AnchorBinder(anchorStage);

    const earthChip = anchorStage.querySelector<HTMLElement>('[data-anchor="earth"]');
    if (earthChip) binder.register({ act: 0, object: earth.limbAnchor, element: earthChip });

    const porthole = anchorStage.querySelector<HTMLElement>('[data-anchor="porthole"]');
    if (porthole) {
      const ring = porthole.querySelector<HTMLElement>('.porthole') ?? porthole;
      binder.register({
        act: 2,
        object: mars.root,
        element: ring,
        centered: true,
        worldRadius: MARS.radius * 1.42,
      });
    }

    const craftChip = anchorStage.querySelector<HTMLElement>('[data-anchor="craft"]');
    if (craftChip) binder.register({ act: 3, object: craft.noseAnchor, element: craftChip });
  }

  // ---- state ---------------------------------------------------------------
  const sample = {
    position: new THREE.Vector3(),
    look: new THREE.Vector3(),
    fov: 48,
  };

  let progress = 0;
  let smoothedProgress = 0;
  let targetAct = 0;
  let starVelocity = 0;
  let elapsed = 0;
  let lastTime = 0;
  let running = true;
  let dirty = true;
  let disposed = false;
  let scheduled = false;

  function applyCamera(dt: number): void {
    if (reducedMotion) {
      // The five acts, held still: same story, no flight.
      sampleActFraming(targetAct, sample);
      smoothedProgress = clamp01(targetAct * ACT_STEP);
    } else {
      const blend = 1 - Math.exp(-PROGRESS_SMOOTHING * dt);
      smoothedProgress += (progress - smoothedProgress) * blend;
      if (Math.abs(progress - smoothedProgress) < 0.0002) smoothedProgress = progress;
      sampleCameraPath(smoothedProgress, sample);
    }

    camera.position.copy(sample.position);
    camera.lookAt(sample.look);
    if (Math.abs(camera.fov - sample.fov) > 0.01) {
      camera.fov = sample.fov;
      camera.updateProjectionMatrix();
    }
  }

  function resize(): void {
    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / Math.max(height, 1);
    camera.updateProjectionMatrix();
    dirty = true;
  }

  function applySettings(next: QualitySettings): void {
    starfield.setCounts(next.starCounts);
    earth.setShellLevel(next.atmosphereShells);
    mars.setShellLevel(next.atmosphereShells);
    exhaust.setCount(next.exhaustParticles);
    craft.setTiltEnabled(next.pointerTilt);

    const ratio = Math.min(window.devicePixelRatio || 1, next.maxPixelRatio);
    renderer.setPixelRatio(ratio);
    exhaust.setPixelRatio(ratio);
    resize();
  }

  function paint(): void {
    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;
    binder?.update(camera, width, height, camera.fov);
    renderer.render(scene, camera);
    if (!canvas.classList.contains('is-live')) canvas.classList.add('is-live');
  }

  /**
   * Single RAF authority. Frames stop whenever work stops — either because the
   * tab is hidden or because reduced motion has nothing left to animate.
   */
  function requestFrame(): void {
    if (disposed || scheduled || !running) return;
    scheduled = true;
    requestAnimationFrame(frame);
  }

  function frame(now: number): void {
    scheduled = false;
    if (disposed || !running) return;

    const previous = lastTime || now;
    lastTime = now;
    const dt = Math.min(Math.max((now - previous) / 1000, 0), MAX_DELTA);
    elapsed += dt;

    if (reducedMotion) {
      if (!dirty) return; // loop parks until something changes
      applyCamera(0);
      planets.forEach((planet) => planet.setViewerPosition(camera.position));
      paint();
      dirty = false;
      requestFrame();
      return;
    }

    applyCamera(dt);

    starVelocity *= Math.exp(-VELOCITY_RELEASE * dt);
    starfield.setVelocity(starVelocity);
    starfield.update(dt, elapsed);

    for (const planet of planets) {
      planet.setViewerPosition(camera.position);
      planet.update(dt, elapsed);
    }

    craft.setProgress(smoothedProgress);
    craft.update(dt, elapsed);

    exhaust.setBurn(burnAt(smoothedProgress));
    exhaust.update(dt, elapsed);

    governor.frame(dt);
    paint();
    requestFrame();
  }

  const governor = new QualityGovernor(step, {
    onChange: (nextStep, nextSettings) => {
      step = nextStep;
      settings = nextSettings;
      applySettings(nextSettings);
      options.onQualityChange?.(nextSettings);
    },
  });

  const onVisibility = (): void => {
    running = document.visibilityState === 'visible';
    if (running) {
      lastTime = 0;
      requestFrame();
    }
  };

  const resizeObserver = new ResizeObserver(() => resize());
  resizeObserver.observe(canvas);
  document.addEventListener('visibilitychange', onVisibility);

  applySettings(settings);
  resize();
  requestFrame();

  return {
    setProgress(next: number): void {
      progress = clamp01(next);
      requestFrame();
    },

    setVelocity(pixelsPerSecond: number): void {
      const scaled = (pixelsPerSecond * VELOCITY_SCALE) / 1000;
      starVelocity = Math.max(-VELOCITY_CEILING, Math.min(VELOCITY_CEILING, scaled));
      dirty = true;
    },

    setActiveAct(index: number): void {
      targetAct = Math.max(0, Math.min(4, index));
      binder?.setActiveAct(targetAct);
      dirty = true;
      requestFrame();
    },

    setPointer(clientX: number, clientY: number): void {
      const x = (clientX / window.innerWidth) * 2 - 1;
      const y = (clientY / window.innerHeight) * 2 - 1;
      craft.setPointer(x, y);
    },

    beat(): string {
      return beatAt(reducedMotion ? clamp01(targetAct * ACT_STEP) : smoothedProgress);
    },

    destroy(): void {
      disposed = true;
      running = false;
      resizeObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      binder?.hideAll();

      craft.engineAnchor.remove(exhaust.root);
      scene.remove(starfield.root, earth.root, mars.root, craft.root);

      starfield.dispose();
      earth.dispose();
      mars.dispose();
      craft.dispose();
      exhaust.dispose();
      disposeHaloTexture();

      sun.dispose();
      ambient.dispose();
      rim.dispose();
      environment?.dispose();
      scene.environment = null;
      scene.clear();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}

export const QUALITY_STEP_COUNT = QUALITY_STEPS.length;

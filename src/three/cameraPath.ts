/**
 * cameraPath.ts — the spine of the whole page.
 *
 * Nine control points, uniformly spaced in normalised progress, sampled with
 * Catmull-Rom so the camera is C1-continuous — it never stutters at a key and
 * it never cuts. Key index i sits at exactly p = i / 8, which lines the five
 * act anchors up with the five odd indices (0, 2, 4, 6, 8).
 */

import * as THREE from 'three';

export interface CameraKey {
  readonly t: number;
  readonly position: readonly [number, number, number];
  readonly look: readonly [number, number, number];
  readonly fov: number;
  /** human label, used by the dial readout and debugging */
  readonly beat: string;
}

export const CAMERA_KEYS: ReadonlyArray<CameraKey> = [
  // LEAVE is a horizon, not a planet portrait: the camera sits below the limb
  // with Earth's curve crossing the lower frame, so the headline reads against
  // open space instead of against the planet.
  { t: 0.0, position: [-2.2, 1.8, 15.5], look: [-1.6, 4.6, 0], fov: 42, beat: 'LEAVE · earth horizon' },
  { t: 0.125, position: [-3.2, 4.6, 20.5], look: [-2, 5.4, 0], fov: 46, beat: 'ascend' },
  { t: 0.25, position: [6, 4, 34], look: [30, 6, -30], fov: 52, beat: 'CROSS · wide drift' },
  { t: 0.375, position: [26, 6, 30], look: [70, 12, -60], fov: 55, beat: 'intercept' },
  { t: 0.5, position: [108, 22, -50], look: [124, 23, -112], fov: 48, beat: 'ARRIVE · mars orbit' },
  { t: 0.625, position: [116, 26, -74], look: [122, 20, -130], fov: 44, beat: 'aerobrake' },
  // FLY holds a three-quarter view off the cruiser's port bow, framed so it
  // settles left-of-centre between the right-aligned headline and the grid.
  { t: 0.75, position: [59.8, 14, -154], look: [43.2, 9, -161], fov: 44, beat: 'FLY · alongside' },
  { t: 0.875, position: [78, 34, -150], look: [56, 8, -196], fov: 46, beat: 'withdraw' },
  { t: 1.0, position: [96, 58, -172], look: [56, 4, -206], fov: 52, beat: 'SECURE · rest' },
];

/** Act index → the progress value its composition is authored at. */
export const ACT_ANCHOR = [0, 0.25, 0.5, 0.75, 1] as const;

const positionCurve = new THREE.CatmullRomCurve3(
  CAMERA_KEYS.map((k) => new THREE.Vector3(...k.position)),
  false,
  'catmullrom',
  0.5,
);

const lookCurve = new THREE.CatmullRomCurve3(
  CAMERA_KEYS.map((k) => new THREE.Vector3(...k.look)),
  false,
  'catmullrom',
  0.5,
);

export function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

function fovAt(p: number): number {
  const segments = CAMERA_KEYS.length - 1;
  const scaled = clamp01(p) * segments;
  const index = Math.min(Math.floor(scaled), segments - 1);
  const u = scaled - index;
  const a = CAMERA_KEYS[index];
  const b = CAMERA_KEYS[index + 1];
  // smooth the fov ramp so zoom reads as intentional, not stepped
  const eased = u * u * (3 - 2 * u);
  return a.fov + (b.fov - a.fov) * eased;
}

export interface CameraSample {
  position: THREE.Vector3;
  look: THREE.Vector3;
  fov: number;
}

const scratch = {
  position: new THREE.Vector3(),
  look: new THREE.Vector3(),
  fov: 48,
};

/** Sample the flight at normalised progress p ∈ [0,1]. Returns a shared object. */
export function sampleCameraPath(p: number, out: CameraSample = scratch): CameraSample {
  const t = clamp01(p);
  positionCurve.getPoint(t, out.position);
  lookCurve.getPoint(t, out.look);
  out.fov = fovAt(t);
  return out;
}

/** Nearest key beat label, for the stage dial readout. */
export function beatAt(p: number): string {
  const segments = CAMERA_KEYS.length - 1;
  const index = Math.round(clamp01(p) * segments);
  return CAMERA_KEYS[index].beat;
}

/**
 * Reduced-motion framing: the same five acts, but the camera *sits* at each act
 * anchor and only the DOM cross-fades. No flight, no star stretch, no particles.
 */
export function sampleActFraming(actIndex: number, out: CameraSample = scratch): CameraSample {
  const anchor = ACT_ANCHOR[Math.max(0, Math.min(ACT_ANCHOR.length - 1, actIndex))];
  return sampleCameraPath(anchor, out);
}

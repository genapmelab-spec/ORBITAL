/**
 * world.ts — the layout contract.
 * Every scene module reads its numbers from here so the camera path, the
 * planets and the star shells can never drift out of agreement.
 * Units: 1 world unit ≈ a few hundred km (irrelevant — the grade sells scale).
 */

import * as THREE from 'three';

export const SUN_DIRECTION = new THREE.Vector3(0.78, 0.28, 0.55).normalize();

export const EARTH = {
  center: new THREE.Vector3(0, 0, 0),
  radius: 3,
  /** Extra shells drawn on top of the surface for the limb glow. */
  atmosphereScale: 1.075,
  innerAtmosphereScale: 1.012,
  spin: 0.017, // rad / s
} as const;

export const MARS = {
  center: new THREE.Vector3(140, 26, -120),
  radius: 22,
  atmosphereScale: 1.035,
  spin: 0.0055,
} as const;

/**
 * Star shells. Radii start far above the camera path's maximum displacement
 * (≈220 u) from the lattice centre so no star is ever close enough to rasterise
 * as a fat dash. Base dash width is baked proportional to radius, which keeps
 * the apparent star size identical across all three depths — the parallax then
 * comes from real translation, not from cheating with size.
 */
export const STAR_LATTICE = {
  center: new THREE.Vector3(100, 20, -140),
  layers: [
    { radius: 900, spread: 260, counts: [16000, 6000, 2200], depth: 1.0, twinkle: 0.9 },
    { radius: 1800, spread: 520, counts: [10000, 4000, 1500], depth: 0.55, twinkle: 1.35 },
    { radius: 4200, spread: 1100, counts: [7000, 2800, 1000], depth: 0.25, twinkle: 1.9 },
  ],
  /** dash width as a fraction of shell radius, so every depth lands at ~4px */
  dashRatio: 0.0042,
} as const;

/** Craft flight path control points — uniformly spaced in normalised time. */
export const CRAFT_PATH: ReadonlyArray<THREE.Vector3> = [
  new THREE.Vector3(44, 14, 22),
  new THREE.Vector3(66, 12, -46),
  new THREE.Vector3(58, 12, -96),
  new THREE.Vector3(40, 10, -160),
  new THREE.Vector3(10, 2, -250),
];

export const CRAFT = {
  /** overall hull length in world units (≈84 m in fiction) */
  length: 9,
  maxBank: THREE.MathUtils.degToRad(18),
  /** instantaneous banking responsiveness, 0..1 blend per second */
  bankBlend: 2.4,
} as const;

/** Act boundaries in normalised page progress. */
export const ACT_PROGRESS = [0, 0.25, 0.5, 0.75, 1] as const;

export const EXHAUST = {
  particles: 260,
  /** burn intensity per normalised progress window [start, end] */
  burns: [
    { start: 0.16, end: 0.3, peak: 1.0 },
    { start: 0.42, end: 0.58, peak: 0.65 },
    { start: 0.78, end: 0.86, peak: 0.35 },
  ],
} as const;

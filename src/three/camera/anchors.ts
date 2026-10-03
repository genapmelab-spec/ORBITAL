/**
 * LAYOUT CONTRACT.
 *
 * The only place where Solar System geometry and camera compositions live. The
 * scene, the camera path and the browser checks all read from here, so the
 * world and the camera can never disagree about where anything is.
 *
 * Two ideas hold the whole flight together:
 *
 * 1. Every body has a scene position (`src/three/systems/epoch.ts`) that moves
 *    with the date. Camera keys are composed *relative to their subject*, so a
 *    shot stays composed no matter where the subject happens to be in its orbit.
 * 2. A key states where on screen its subject must land (`frameX`, `frameY`, in
 *    normalised device coordinates) and `composeCamera` solves the camera
 *    position analytically from that. Nothing is hand-tuned by eye, so the
 *    composition can be asserted in Node across many dates.
 *
 * The page is built from pure numbers on purpose: no Three.js import, so
 * `tools/check-layout.mjs` can run the same maths without a renderer.
 */

import { CAMERA_PARAMS, type CameraKeyId } from '../../content/experience.ts';

export type Vec3 = readonly [number, number, number];

export type BodyId = 'sun' | 'earth' | 'moon' | 'mars' | 'jupiter';
export type SubjectId = BodyId | 'belt';

export const WORLD_UP: Vec3 = [0, 1, 0];

/* ------------------------------------------------------------------ scale ---
 * Distances are compressed once, radially, and never touched again: direction
 * from the Sun is exact, radius is eased so the outer system stays flyable.
 * Radii are compressed separately — a true-scale Sun would swallow Mercury.
 */
export const AU_UNIT = 30;
export const RADIAL_EXPONENT = 0.66;
export const EARTH_RADIUS = 0.9;
export const RADIUS_EXPONENT = 0.42;

export const CAMERA_NEAR = 0.2;
export const CAMERA_FAR = 4000;
export const DEFAULT_FOV = 42;

/** Sunlight: physical falloff, floored. Documented in docs/TECHNICAL.md. */
export const SUN_COLOR = '#fff3d6';
export const SUN_LIMB_COLOR = '#ffb545';
export const SUN_FALLOFF_FLOOR = 0.34;

export function toSceneRadius(au: number): number {
  return AU_UNIT * Math.pow(au, RADIAL_EXPONENT);
}

export function bodyRadius(radiusKm: number): number {
  return EARTH_RADIUS * Math.pow(radiusKm / 6371, RADIUS_EXPONENT);
}

export function sunIntensityAt(au: number): number {
  return Math.min((1 - SUN_FALLOFF_FLOOR) / (au * au) + SUN_FALLOFF_FLOOR, 1);
}

/* ----------------------------------------------------------------- bodies --- */

export interface AtmosphereSpec {
  readonly scale: number;
  readonly intensity: number;
  readonly power: number;
  readonly tint: string;
}

export interface BodySpec {
  readonly id: BodyId;
  readonly label: string;
  readonly radiusKm: number;
  readonly radius: number;
  readonly baseColor: string;
  readonly accentColor: string;
  readonly bandFrequency: number;
  readonly bandStrength: number;
  readonly tilt: number;
  /** Radians of spin per day — real rotation periods, so the model stays live. */
  readonly spinPerDay: number;
  readonly atmosphere: AtmosphereSpec | null;
}

export const BODIES: Record<BodyId, BodySpec> = {
  sun: {
    id: 'sun',
    label: 'Sun',
    radiusKm: 696000,
    radius: bodyRadius(696000),
    baseColor: SUN_COLOR,
    accentColor: SUN_LIMB_COLOR,
    bandFrequency: 0,
    bandStrength: 0,
    tilt: 0.126,
    spinPerDay: (Math.PI * 2) / 25.38,
    atmosphere: null,
  },
  earth: {
    id: 'earth',
    label: 'Earth',
    radiusKm: 6371,
    radius: EARTH_RADIUS,
    baseColor: '#2a63a8',
    accentColor: '#d9e7f2',
    bandFrequency: 3.4,
    bandStrength: 0.5,
    tilt: 0.409,
    spinPerDay: (Math.PI * 2) / 0.99727,
    atmosphere: { scale: 1.045, intensity: 1.2, power: 2.6, tint: '#7fd1ff' },
  },
  moon: {
    id: 'moon',
    label: 'Moon',
    radiusKm: 1737,
    radius: bodyRadius(1737),
    baseColor: '#8c8b86',
    accentColor: '#494843',
    bandFrequency: 0,
    bandStrength: 0,
    tilt: 0.03,
    spinPerDay: (Math.PI * 2) / 27.32,
    atmosphere: null,
  },
  mars: {
    id: 'mars',
    label: 'Mars',
    radiusKm: 3390,
    radius: bodyRadius(3390),
    baseColor: '#a8492a',
    accentColor: '#d9a071',
    bandFrequency: 2.1,
    bandStrength: 0.7,
    tilt: 0.44,
    spinPerDay: (Math.PI * 2) / 1.026,
    atmosphere: { scale: 1.035, intensity: 0.5, power: 3.2, tint: '#ffb08a' },
  },
  jupiter: {
    id: 'jupiter',
    label: 'Jupiter',
    radiusKm: 69911,
    radius: bodyRadius(69911),
    baseColor: '#c8a678',
    accentColor: '#7b5b40',
    bandFrequency: 5.5,
    bandStrength: 0.85,
    tilt: 0.055,
    spinPerDay: (Math.PI * 2) / 0.4135,
    atmosphere: { scale: 1.02, intensity: 0.35, power: 3.6, tint: '#ffd9a8' },
  },
};

export const SUN_VISUAL = {
  coreColor: SUN_COLOR,
  limbColor: SUN_LIMB_COLOR,
  intensity: 1.15,
  coronaInnerScale: 5.5,
  coronaOuterScale: 15,
  coronaInnerIntensity: 1.15,
  coronaOuterIntensity: 0.45,
} as const;

/* -------------------------------------------------------------- the flight --- */

export type LookRule = 'outward' | 'inward' | 'tangent' | 'twilight' | 'fixed';

export interface ReferenceRule {
  /** Body the rule is measured against instead of the Sun. */
  readonly body: SubjectId;
  /** `away` looks outward from it, `tangent` looks across it. */
  readonly axis: 'away' | 'tangent';
}

export interface CameraKeySpec {
  readonly id: CameraKeyId;
  readonly param: number;
  readonly subject: SubjectId;
  readonly look: LookRule;
  /** Radians; positive tilts the view above the ecliptic. */
  readonly pitch: number;
  /** Scene units from the subject's centre. */
  readonly distance: number;
  /** Where the subject must land, in NDC (-1..1). Signed frameX is never 0. */
  readonly frameX: number;
  readonly frameY: number;
  readonly fov: number;
  /** Look direction for `look: 'fixed'` keys, in scene space. */
  readonly forward?: Vec3;
  /** Overrides `look` when a shot must be measured against another body. */
  readonly reference?: ReferenceRule;
  /** Absolute camera position (heliocentric) — used by the final overview. */
  readonly absolute?: { readonly position: Vec3 };
  readonly portrait?: {
    readonly distance: number;
    readonly frameX: number;
    readonly frameY: number;
  };
}

/**
 * Ten keys, eight of them shared with a section. The two extras exist for real
 * reasons: `transit-moon` lifts the camera above the Earth–Moon plane so the
 * path never cuts through Earth, and `ascent` climbs out of the ecliptic after
 * Jupiter so the dive to the Sun starts with the system below you.
 */
export const CAMERA_KEYS: readonly CameraKeySpec[] = [
  {
    id: 'entry',
    param: CAMERA_PARAMS.entry,
    subject: 'earth',
    look: 'twilight',
    pitch: 0.06,
    distance: 6.4,
    frameX: 0,
    frameY: -0.56,
    fov: DEFAULT_FOV,
  },
  {
    id: 'earth',
    param: CAMERA_PARAMS.earth,
    subject: 'earth',
    look: 'outward',
    pitch: 0.04,
    distance: 5,
    frameX: 0.32,
    frameY: 0.04,
    fov: DEFAULT_FOV,
  },
  {
    id: 'transit-moon',
    param: CAMERA_PARAMS['transit-moon'],
    subject: 'earth',
    look: 'inward',
    pitch: -0.85,
    distance: 15,
    frameX: -0.18,
    frameY: 0.3,
    fov: 46,
  },
  {
    id: 'moon',
    param: CAMERA_PARAMS.moon,
    subject: 'moon',
    look: 'outward',
    // Lateral and slightly above the Earth–Moon line: the departure towards
    // Mars then leaves over the Moon instead of through it.
    pitch: -0.45,
    distance: 3.4,
    frameX: -0.3,
    frameY: 0.02,
    fov: DEFAULT_FOV,
    reference: { body: 'earth', axis: 'tangent' },
  },
  {
    id: 'mars',
    param: CAMERA_PARAMS.mars,
    subject: 'mars',
    // Viewed across its orbit rather than from the Sun's side, so the flight to
    // the belt sweeps past Mars instead of straight through it.
    look: 'tangent',
    pitch: -0.35,
    distance: 4.2,
    frameX: 0.32,
    frameY: 0.02,
    fov: DEFAULT_FOV,
  },
  {
    id: 'belt',
    param: CAMERA_PARAMS.belt,
    subject: 'belt',
    look: 'tangent',
    pitch: 0.03,
    distance: 1.4,
    frameX: -0.28,
    frameY: 0,
    fov: 46,
  },
  {
    id: 'jupiter',
    param: CAMERA_PARAMS.jupiter,
    subject: 'jupiter',
    look: 'outward',
    pitch: 0.04,
    distance: 11,
    frameX: 0.32,
    frameY: 0.02,
    fov: DEFAULT_FOV,
    portrait: { distance: 13.5, frameX: 0.24, frameY: -0.12 },
  },
  {
    id: 'ascent',
    param: CAMERA_PARAMS.ascent,
    subject: 'sun',
    look: 'fixed',
    pitch: 0,
    distance: 62,
    frameX: 0,
    frameY: 0.05,
    fov: 46,
    forward: [0.2, -0.5, -0.84],
  },
  {
    id: 'sun',
    param: CAMERA_PARAMS.sun,
    subject: 'sun',
    look: 'fixed',
    pitch: 0,
    distance: 30,
    frameX: 0,
    frameY: -0.12,
    fov: DEFAULT_FOV,
    forward: [0, -0.16, -0.99],
  },
  {
    id: 'overview',
    param: CAMERA_PARAMS.overview,
    subject: 'sun',
    look: 'fixed',
    pitch: 0,
    distance: 0,
    frameX: 0,
    frameY: 0,
    fov: DEFAULT_FOV,
    forward: [0, -190, -300],
    absolute: { position: [0, 190, 300] },
  },
];

export const KEY_BY_ID: Record<CameraKeyId, CameraKeySpec> = CAMERA_KEYS.reduce(
  (accumulator, key) => {
    accumulator[key.id] = key;
    return accumulator;
  },
  {} as Record<CameraKeyId, CameraKeySpec>,
);

/* ------------------------------------------------------------- composition --- */

export interface Viewport {
  readonly aspect: number;
  readonly portrait: boolean;
}

export interface SubjectPositions {
  readonly sun: Vec3;
  readonly earth: Vec3;
  readonly moon: Vec3;
  readonly mars: Vec3;
  readonly jupiter: Vec3;
  readonly belt: Vec3;
}

export interface CameraFrame {
  readonly position: Vec3;
  readonly forward: Vec3;
  readonly up: Vec3;
  readonly fov: number;
  readonly aspect: number;
}

export const PORTRAIT_DISTANCE_BOOST = 1.14;
export const PORTRAIT_FRAME_X_SCALE = 0.72;
export const PORTRAIT_ASPECT_THRESHOLD = 1.05;

/** One place decides what counts as a portrait viewport. */
export function viewportFor(width: number, height: number): Viewport {
  const aspect = width / Math.max(height, 1);
  return { aspect, portrait: aspect < PORTRAIT_ASPECT_THRESHOLD };
}

export function subjectPosition(subject: SubjectId, positions: SubjectPositions): Vec3 {
  return positions[subject];
}

export function effectiveDistance(key: CameraKeySpec, viewport: Viewport): number {
  if (viewport.portrait) {
    return key.portrait?.distance ?? key.distance * PORTRAIT_DISTANCE_BOOST;
  }
  return key.distance;
}

export function effectiveFrame(key: CameraKeySpec, viewport: Viewport): { x: number; y: number } {
  if (viewport.portrait) {
    return {
      x: key.portrait?.frameX ?? key.frameX * PORTRAIT_FRAME_X_SCALE,
      y: key.portrait?.frameY ?? key.frameY,
    };
  }
  return { x: key.frameX, y: key.frameY };
}

function subtract(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export function normalise(v: Vec3): Vec3 {
  const length = Math.sqrt(dot(v, v));
  if (length < 1e-9) {
    return [0, 0, 1];
  }
  return [v[0] / length, v[1] / length, v[2] / length];
}

/** Camera basis for a view direction, matching Three.js' handedness. */
export function basis(forward: Vec3, worldUp: Vec3 = WORLD_UP): { right: Vec3; up: Vec3 } {
  let right = cross(forward, worldUp);
  if (Math.sqrt(dot(right, right)) < 1e-6) {
    right = cross(forward, [0, 0, 1]);
  }
  const normalisedRight = normalise(right);
  const up = normalise(cross(normalisedRight, forward));
  return { right: normalisedRight, up };
}

function pitchForward(forward: Vec3, pitch: number): Vec3 {
  if (pitch === 0) {
    return forward;
  }
  const { right, up } = basis(forward);
  void right;
  return normalise([
    forward[0] * Math.cos(pitch) + up[0] * Math.sin(pitch),
    forward[1] * Math.cos(pitch) + up[1] * Math.sin(pitch),
    forward[2] * Math.cos(pitch) + up[2] * Math.sin(pitch),
  ]);
}

export function lookDirection(key: CameraKeySpec, positions: SubjectPositions): Vec3 {
  const subject = subjectPosition(key.subject, positions);

  if (key.look === 'fixed') {
    return pitchForward(normalise(key.forward ?? [0, 0, -1]), key.pitch);
  }

  if (key.reference !== undefined) {
    const reference = subjectPosition(key.reference.body, positions);
    const line = subtract(subject, reference);
    const forward =
      key.reference.axis === 'away' ? normalise(line) : normalise(cross(WORLD_UP, normalise(line)));
    return pitchForward(forward, key.pitch);
  }

  const outward = normalise(subject);
  if (key.look === 'outward') {
    return pitchForward(outward, key.pitch);
  }
  if (key.look === 'inward') {
    return pitchForward([-outward[0], -outward[1], -outward[2]], key.pitch);
  }
  const tangent = normalise(cross(WORLD_UP, outward));
  if (key.look === 'tangent') {
    return pitchForward(tangent, key.pitch);
  }
  // Twilight: just past the terminator, so the subject is mostly night with the
  // rim catching the Sun — and the Sun itself stays well outside the frame.
  return pitchForward(
    normalise([
      tangent[0] * TWILIGHT_TANGENT - outward[0] * TWILIGHT_OUTWARD,
      tangent[1] * TWILIGHT_TANGENT - outward[1] * TWILIGHT_OUTWARD,
      tangent[2] * TWILIGHT_TANGENT - outward[2] * TWILIGHT_OUTWARD,
    ]),
    key.pitch,
  );
}

export const TWILIGHT_TANGENT = 0.94;
export const TWILIGHT_OUTWARD = 0.34;

/**
 * Solve the camera for a key: the subject lands exactly on (frameX, frameY).
 *
 * With `forward`, `right` and `up` fixed, half the frame at the subject's depth
 * spans `distance * tan(fov / 2)`. Moving the camera by minus the subject's
 * offset from the view axis puts the subject exactly on its mark.
 */
export function composeCamera(
  key: CameraKeySpec,
  positions: SubjectPositions,
  viewport: Viewport,
): CameraFrame {
  const subject = subjectPosition(key.subject, positions);
  const forward = lookDirection(key, positions);
  const { right, up } = basis(forward);
  const distance = effectiveDistance(key, viewport);
  const frame = effectiveFrame(key, viewport);
  const halfHeight = distance * Math.tan((key.fov * Math.PI) / 360);
  const halfWidth = halfHeight * viewport.aspect;

  if (key.absolute !== undefined) {
    const position = key.absolute.position;
    return {
      position: [
        position[0] - right[0] * frame.x * halfWidth - up[0] * frame.y * halfHeight,
        position[1] - right[1] * frame.x * halfWidth - up[1] * frame.y * halfHeight,
        position[2] - right[2] * frame.x * halfWidth - up[2] * frame.y * halfHeight,
      ],
      forward,
      up,
      fov: key.fov,
      aspect: viewport.aspect,
    };
  }

  return {
    position: [
      subject[0] - forward[0] * distance - right[0] * frame.x * halfWidth - up[0] * frame.y * halfHeight,
      subject[1] - forward[1] * distance - right[1] * frame.x * halfWidth - up[1] * frame.y * halfHeight,
      subject[2] - forward[2] * distance - right[2] * frame.x * halfWidth - up[2] * frame.y * halfHeight,
    ],
    forward,
    up,
    fov: key.fov,
    aspect: viewport.aspect,
  };
}

export interface Projection {
  readonly x: number;
  readonly y: number;
  /** Distance along the view axis; negative means behind the camera. */
  readonly depth: number;
}

export function projectPoint(point: Vec3, frame: CameraFrame): Projection {
  const relative = subtract(point, frame.position);
  const depth = dot(relative, frame.forward);
  const { right, up } = basis(frame.forward);
  const halfHeight = Math.max(depth, 1e-6) * Math.tan((frame.fov * Math.PI) / 360);
  return {
    x: dot(relative, right) / (halfHeight * frame.aspect),
    y: dot(relative, up) / halfHeight,
    depth,
  };
}

/** Screen-space radius (NDC, vertical) of a sphere of `radius` at `frame`. */
export function projectedRadius(radius: number, subjectDistance: number, frame: CameraFrame): number {
  const halfHeight = subjectDistance * Math.tan((frame.fov * Math.PI) / 360);
  return radius / halfHeight;
}

export function distanceTo(point: Vec3, frame: CameraFrame): number {
  return Math.sqrt(dot(subtract(point, frame.position), subtract(point, frame.position)));
}

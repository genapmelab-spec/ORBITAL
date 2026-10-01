import { Vector3 } from 'three';
import { JOURNEY } from '../content/journey';
import type { StageId } from '../content/journey';

/**
 * LAYOUT CONTRACT — the only place where Solar System geometry and camera
 * compositions live. Objects, the camera path and the scroll choreography all
 * read from here, so the world and the camera can never drift apart.
 * Stage order comes from JOURNEY and nowhere else.
 */

export type { StageId };

export type Vec3Tuple = readonly [number, number, number];

export const STAGE_ORDER: readonly StageId[] = JOURNEY.map((stage) => stage.id);
export const STAGE_COUNT = STAGE_ORDER.length;
/** Camera parameter runs 0 → LAST_STAGE_PARAM across the journey. */
export const LAST_STAGE_PARAM = STAGE_COUNT - 1;

/* ── Scale contract ─────────────────────────────────────────────────────────
   True scale cannot be walked: at real ratios the Sun swallows Mercury and the
   outer system leaves the solar neighbourhood. So distances are log-compressed
   (order and ratios stay legible, every AU count is documented) and radii are
   power-compressed (Jupiter stays massive, just not eleven Earths wide on a
   phone screen). The compression itself is the storytelling device: the inner
   system stays intimate, the giants sit far apart, and the overview has room. */

/** Scene units per natural log of one AU. */
export const DISTANCE_SCALE = 40;
/** Scene radius of Earth. */
export const EARTH_RADIUS = 0.9;
/** Physical radius of Earth in km — reference for every body radius. */
export const EARTH_RADIUS_KM = 6371;
/** radius = EARTH_RADIUS × (km / EARTH_RADIUS_KM) ^ RADIUS_EXPONENT */
export const RADIUS_EXPONENT = 0.42;
/** Deliberately compressed Sun: it must dominate every frame, not eat Mercury. */
export const SUN_RADIUS = 4.6;
/** Sunlight colour — warm, and the only light source in the scene. */
export const SUN_LIGHT_COLOR = '#fff2d2';
/** Sun light falloff compression, so Neptune is dim but never invisible. */
export const LIGHT_FALLOFF_EXPONENT = 0.38;
export const LIGHT_GAIN = 1.35;
export const LIGHT_MIN = 0.22;
export const LIGHT_MAX = 1.5;
/** Staging distance from Earth to Moon (the real 60 Earth radii reads as void). */
export const MOON_STAGE_DISTANCE = 2.6;
/** Camera clipping: wide enough for the overview, tight enough for a fly-by. */
export const CAMERA_NEAR = 0.25;
export const CAMERA_FAR = 6000;
/** Reference up axis for every camera frame. */
export const WORLD_UP: Vec3Tuple = [0, 1, 0];
/** Alternate reference when the view direction is nearly vertical. */
export const SIDE_REFERENCE: Vec3Tuple = [1, 0, 0];
/** Portrait re-choreography: subject above the caption, a little more room. */
export const PORTRAIT_FRAME_Y = 0.32;
/** Never let portrait bias push a subject below the bottom caption. */
export const PORTRAIT_FRAME_Y_MIN = 0.05;
export const PORTRAIT_FRAME_X_SCALE = 0.6;
export const PORTRAIT_DISTANCE_FACTOR = 1.15;
/** Overview camera — also the axis the final Sun dive descends along. */
export const OVERVIEW_POSITION: Vec3Tuple = [90, 420, 150];
/** Final Sun approach, in Sun radii — close enough to fill the lower frame. */
export const SUN_DIVE_DISTANCE = 3.4;

export const toSceneRadius = (au: number): number => DISTANCE_SCALE * Math.log1p(au);

export const toSceneBodyRadius = (km: number): number =>
  EARTH_RADIUS * Math.pow(km / EARTH_RADIUS_KM, RADIUS_EXPONENT);

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

/** Compressed inverse-square light: the same Sun, visibly weaker far out. */
export const sunIntensityAt = (au: number): number =>
  clamp(Math.pow(1 / Math.max(au, 0.39), LIGHT_FALLOFF_EXPONENT) * LIGHT_GAIN, LIGHT_MIN, LIGHT_MAX);

/* ── Body table ───────────────────────────────────────────────────────────── */

export type BodyId =
  | 'sun'
  | 'moon'
  | 'mercury'
  | 'venus'
  | 'earth'
  | 'mars'
  | 'ceres'
  | 'jupiter'
  | 'saturn'
  | 'uranus'
  | 'neptune'
  | 'pluto';

export interface BodySpec {
  readonly id: BodyId;
  readonly label: string;
  /** Semi-major axis in AU. The Sun sits at 0. */
  readonly au: number;
  /** Physical radius in km. The Sun's scene radius is SUN_RADIUS instead. */
  readonly km: number;
  /** Orbital phase, radians — positions the body on the journey spiral. */
  readonly phase: number;
  /** Vertical offset as a fraction of orbit radius: depth, not a flat disc. */
  readonly elevation: number;
  /** Axial tilt, radians. Uranus is the 98° one. */
  readonly tilt: number;
  /** Latitude banding: frequency and how much the accent colour shows. */
  readonly bandFreq: number;
  readonly bandStrength: number;
  /** Rotation speed, radians per second. Negative = retrograde. */
  readonly spin: number;
  readonly baseColor: string;
  readonly accentColor: string;
  /** Atmosphere shell: scale in body radii, intensity, fresnel power, tint. */
  readonly atmosphere: {
    readonly scale: number;
    readonly intensity: number;
    readonly power: number;
    readonly tint: string;
  } | null;
  /** Ring system, in body radii. */
  readonly ring: {
    readonly inner: number;
    readonly outer: number;
    readonly opacity: number;
    readonly tint: string;
  } | null;
  /** Bodies that orbit another body (the Moon). */
  readonly parent?: BodyId;
}

export const BODIES: Record<BodyId, BodySpec> = {
  sun: {
    id: 'sun',
    label: 'Sun',
    au: 0,
    km: 696340,
    phase: 0,
    elevation: 0,
    tilt: 0.126,
    bandFreq: 0,
    bandStrength: 0,
    spin: 0.004,
    baseColor: '#fff6d8',
    accentColor: '#ff8a2b',
    atmosphere: null,
    ring: null,
  },
  moon: {
    id: 'moon',
    label: 'Moon',
    au: 1,
    km: 3474,
    phase: 0,
    elevation: 0,
    tilt: 0.02,
    bandFreq: 2.2,
    bandStrength: 0.2,
    spin: 0.02,
    baseColor: '#9a9488',
    accentColor: '#57524b',
    atmosphere: null,
    ring: null,
    parent: 'earth',
  },
  mercury: {
    id: 'mercury',
    label: 'Mercury',
    au: 0.39,
    km: 4879,
    phase: 0.9,
    elevation: 0.03,
    tilt: 0.0006,
    bandFreq: 3,
    bandStrength: 0.35,
    spin: 0.012,
    baseColor: '#6f665c',
    accentColor: '#332f2a',
    // A thin hot shell: the Sun's glare boiling off the surface.
    atmosphere: { scale: 1.035, intensity: 0.32, power: 4, tint: '#ffb066' },
    ring: null,
  },
  venus: {
    id: 'venus',
    label: 'Venus',
    au: 0.72,
    km: 12104,
    phase: 1.5,
    elevation: -0.02,
    tilt: 3.096,
    bandFreq: 3.4,
    bandStrength: 0.5,
    spin: 0.004,
    baseColor: '#d9a24e',
    accentColor: '#f6e2b0',
    atmosphere: { scale: 1.09, intensity: 1.15, power: 2.6, tint: '#ffe0a8' },
    ring: null,
  },
  earth: {
    id: 'earth',
    label: 'Earth',
    au: 1,
    km: 6371,
    phase: 2.1,
    elevation: 0.01,
    tilt: 0.409,
    bandFreq: 6,
    bandStrength: 0.32,
    spin: 0.02,
    baseColor: '#12417a',
    accentColor: '#2f7a4e',
    atmosphere: { scale: 1.05, intensity: 1, power: 3, tint: '#7dd3fc' },
    ring: null,
  },
  mars: {
    id: 'mars',
    label: 'Mars',
    au: 1.52,
    km: 6779,
    phase: 2.75,
    elevation: 0.05,
    tilt: 0.44,
    bandFreq: 3.6,
    bandStrength: 0.45,
    spin: 0.018,
    baseColor: '#a4402a',
    accentColor: '#d98a5a',
    atmosphere: { scale: 1.045, intensity: 0.55, power: 3.4, tint: '#ff8a5c' },
    ring: null,
  },
  ceres: {
    id: 'ceres',
    label: 'Ceres',
    au: 2.77,
    km: 473,
    phase: 3.4,
    elevation: 0,
    tilt: 0.07,
    bandFreq: 2.6,
    bandStrength: 0.3,
    spin: 0.01,
    baseColor: '#8f8880',
    accentColor: '#4f4a44',
    atmosphere: null,
    ring: null,
  },
  jupiter: {
    id: 'jupiter',
    label: 'Jupiter',
    au: 5.2,
    km: 69911,
    phase: 4.1,
    elevation: -0.03,
    tilt: 0.055,
    bandFreq: 9,
    bandStrength: 0.85,
    spin: 0.05,
    baseColor: '#cbb6a0',
    accentColor: '#8f5a38',
    atmosphere: { scale: 1.05, intensity: 0.9, power: 3, tint: '#e8cfa8' },
    ring: null,
  },
  saturn: {
    id: 'saturn',
    label: 'Saturn',
    au: 9.54,
    km: 58232,
    phase: 4.9,
    elevation: 0.02,
    tilt: 0.466,
    bandFreq: 7,
    bandStrength: 0.6,
    spin: 0.045,
    baseColor: '#d8c08a',
    accentColor: '#a8874f',
    atmosphere: { scale: 1.045, intensity: 0.7, power: 3.2, tint: '#f0dcb4' },
    ring: { inner: 1.28, outer: 2.4, opacity: 0.92, tint: '#e6d6ad' },
  },
  uranus: {
    id: 'uranus',
    label: 'Uranus',
    au: 19.2,
    km: 25362,
    phase: 5.6,
    elevation: -0.04,
    tilt: 1.71,
    bandFreq: 3,
    bandStrength: 0.16,
    spin: -0.03,
    baseColor: '#8fd3dd',
    accentColor: '#5fb4c4',
    atmosphere: { scale: 1.05, intensity: 0.6, power: 3.2, tint: '#bff0f6' },
    ring: { inner: 1.55, outer: 2, opacity: 0.34, tint: '#9fd8e2' },
  },
  neptune: {
    id: 'neptune',
    label: 'Neptune',
    au: 30.05,
    km: 24622,
    phase: 6.3,
    elevation: 0.03,
    tilt: 0.494,
    bandFreq: 4,
    bandStrength: 0.3,
    spin: 0.03,
    baseColor: '#2a5bd7',
    accentColor: '#16307a',
    atmosphere: { scale: 1.055, intensity: 0.8, power: 2.8, tint: '#7fa8ff' },
    ring: null,
  },
  pluto: {
    id: 'pluto',
    label: 'Pluto',
    au: 39.5,
    km: 1188,
    phase: 7.1,
    elevation: 0.17,
    tilt: 2.1,
    bandFreq: 2.4,
    bandStrength: 0.4,
    spin: 0.008,
    baseColor: '#b9a79a',
    accentColor: '#7a6b60',
    atmosphere: null,
    ring: null,
  },
};

/** Bodies that own an orbit line and appear in the overview as a system. */
export const ORBIT_BODY_IDS: readonly BodyId[] = [
  'mercury',
  'venus',
  'earth',
  'mars',
  'ceres',
  'jupiter',
  'saturn',
  'uranus',
  'neptune',
  'pluto',
];

/** Every body that is rendered as a mesh, in creation order. */
export const RENDER_BODY_IDS: readonly BodyId[] = [
  'sun',
  'earth',
  'moon',
  'mercury',
  'venus',
  'mars',
  'ceres',
  'jupiter',
  'saturn',
  'uranus',
  'neptune',
  'pluto',
];

/* ── Body geometry helpers ────────────────────────────────────────────────── */

export function bodyRadius(id: BodyId): number {
  return id === 'sun' ? SUN_RADIUS : toSceneBodyRadius(BODIES[id].km);
}

/** Scene-space position of a body. Bodies never move: no per-frame layout. */
export function bodyPosition(id: BodyId): Vector3 {
  const spec = BODIES[id];
  if (spec.parent !== undefined) {
    const parent = bodyPosition(spec.parent);
    // Placed on the parent's orbital tangent: beside it, never hidden behind it.
    const tangent = new Vector3(parent.z, 0, -parent.x).normalize();
    return parent.addScaledVector(tangent, MOON_STAGE_DISTANCE);
  }
  const radius = toSceneRadius(spec.au);
  return new Vector3(
    Math.cos(spec.phase) * radius,
    spec.elevation * radius,
    Math.sin(spec.phase) * radius,
  );
}

/** Direction from a body toward the Sun — the single light direction. */
export function sunDirectionFor(position: Vector3): Vector3 {
  return position.clone().negate().normalize();
}

/* ── Stage camera compositions ────────────────────────────────────────────── */

export interface StageFrameSpec {
  /** Body the shot is composed around; null = absolute camera placement. */
  readonly body: BodyId | null;
  /** Orbit mode: camera bias in the body's local frame. */
  readonly radial?: number;
  readonly tangent?: number;
  readonly height?: number;
  /** Camera distance in body radii. */
  readonly dist?: number;
  /** Absolute mode: camera position in scene units. */
  readonly position?: Vec3Tuple;
  /** Absolute mode: subject position in scene units. */
  readonly target?: Vec3Tuple;
  /** 0 = look at the subject, 1 = look at the Sun (scale storytelling). */
  readonly sunBlend?: number;
  /** Screen placement of the subject, −1..1; sign follows the caption side. */
  readonly frameX: number;
  readonly frameY: number;
  /**
   * Portrait override for the vertical placement. Below 64rem the caption moves
   * to the bottom of the frame, so the subject has to sit above it — a bias is
   * not enough for compositions already tuned well below centre.
   */
  readonly portraitFrameY?: number;
  /**
   * Portrait override for the horizontal placement, for compositions whose
   * second subject (a glare, a glow) must stay in a much narrower frame.
   */
  readonly portraitFrameX?: number;
  readonly fov: number;
  /** Camera roll, radians — a deliberate horizon tilt, never idle wobble. */
  readonly roll?: number;
}

/**
 * One frame per stage, in journey order. `radial` is outward from the Sun, so
 * a slightly negative value parks the camera between the Sun and the subject:
 * the subject is lit, the Sun sits off-frame, and captions stay readable.
 */
export const STAGE_FRAMES: Record<StageId, StageFrameSpec> = {
  // 01 — close and personal, the limb sweeping the right of frame. The opening
  // shares this composition, so Earth leaves the left half dark for the title:
  // a filled frame is dramatic, an unreadable one is just a wall.
  earth: {
    body: 'earth',
    radial: -0.25,
    tangent: 0.95,
    height: 0.22,
    dist: 5,
    frameX: 0.42,
    frameY: 0.02,
    fov: 40,
  },
  // 02 — low over the Moon, looking back: Earth hangs in the same frame.
  moon: {
    body: 'moon',
    radial: -0.9,
    tangent: 0.35,
    height: 0.18,
    dist: 3.4,
    frameX: -0.3,
    frameY: 0.05,
    fov: 46,
  },
  // 03 — tight, sun-side, hard light: extreme proximity and heat.
  mercury: {
    body: 'mercury',
    radial: -0.55,
    tangent: 0.72,
    height: 0.42,
    dist: 2.05,
    frameX: 0.32,
    frameY: 0,
    fov: 34,
    roll: 0.02,
  },
  // 04 — high above, looking down through unbroken cloud.
  venus: {
    body: 'venus',
    radial: -0.12,
    tangent: 0.55,
    height: 0.82,
    dist: 3.2,
    frameX: -0.32,
    frameY: -0.04,
    fov: 38,
  },
  // 05 — the scale checkpoint: Earth is a pale dot, negative space everywhere.
  'earth-orbit': {
    body: 'earth',
    radial: -0.35,
    tangent: 0.9,
    height: 0.18,
    dist: 26,
    sunBlend: 0.12,
    frameX: 0.22,
    frameY: 0.06,
    fov: 46,
  },
  // 06 — red dust, thin air, last rock before the belt.
  mars: {
    body: 'mars',
    radial: -0.3,
    tangent: 0.9,
    height: 0.35,
    dist: 2.6,
    frameX: 0.33,
    frameY: -0.04,
    fov: 38,
  },
  // 07 — inside the field: wide lens, rubble passing the camera, the Sun's glare
  // burning off the rubble on one side. Portrait has a much narrower frame, so
  // the glare needs its own offset to stay in shot.
  'asteroid-belt': {
    body: 'ceres',
    radial: -0.4,
    tangent: 0.85,
    height: 0.15,
    dist: 30,
    sunBlend: 0.45,
    frameX: -0.26,
    portraitFrameX: 0.35,
    frameY: 0.04,
    fov: 58,
  },
  // 08 — mass: the giant overflows the frame.
  jupiter: {
    body: 'jupiter',
    radial: -0.35,
    tangent: 0.9,
    height: 0.3,
    dist: 2.9,
    frameX: 0.3,
    frameY: -0.05,
    fov: 34,
  },
  // 09 — the crown: high above the ring plane, rings opened, caption clear of
  // them. The ring plane sits below centre so the type overlaps only empty sky.
  saturn: {
    body: 'saturn',
    radial: -0.2,
    tangent: 0.95,
    height: 0.8,
    dist: 8,
    frameX: 0,
    frameY: -0.75,
    portraitFrameY: 0.4,
    fov: 40,
    roll: 0.05,
  },
  // 10 — pale, tilted, isolated.
  uranus: {
    body: 'uranus',
    radial: -0.3,
    tangent: 0.8,
    height: 0.5,
    dist: 5,
    frameX: 0.35,
    frameY: 0,
    fov: 42,
  },
  // 11 — the last giant, deep blue, the Sun only a bright star.
  neptune: {
    body: 'neptune',
    radial: -0.35,
    tangent: 0.85,
    height: 0.25,
    dist: 3.4,
    frameX: -0.33,
    frameY: 0.03,
    fov: 44,
  },
  // 12 — past Pluto: everything that mattered is now a point of light. The Sun
  // is held right of centre so the quiet caption keeps the empty left half.
  outer: {
    body: 'pluto',
    radial: -0.5,
    tangent: 0.7,
    height: 0.5,
    dist: 40,
    sunBlend: 0.55,
    frameX: 0.45,
    frameY: 0.05,
    fov: 60,
  },
  // 13 — the pull-back: the entire system in one composition.
  overview: {
    body: null,
    position: OVERVIEW_POSITION,
    target: [0, 0, 0],
    frameX: 0,
    frameY: -0.22,
    fov: 45,
  },
  // 14 — the dive, straight down the overview axis into the light. The Sun's
  // disc is held clear of the centred caption: only its upper limb and glow
  // reach into frame, and the light does the rest.
  sun: {
    body: 'sun',
    radial: 0,
    tangent: 0,
    height: 1,
    dist: SUN_DIVE_DISTANCE,
    frameX: 0,
    frameY: -1,
    // Portrait: the disc is ~62% of the frame height, so 0.38 is the highest it
    // can sit without clipping while still leaving the caption dark sky below.
    portraitFrameY: 0.38,
    fov: 46,
  },
};

export interface StageLayout {
  readonly id: StageId;
  readonly body: BodyId | null;
  readonly position: Vector3;
  readonly target: Vector3;
  readonly fov: number;
  readonly roll: number;
}

const SUN_POSITION = new Vector3(0, 0, 0);

function directionFor(id: BodyId, frame: StageFrameSpec): Vector3 {
  // The Sun has no outward radial to stand on: the finale descends along the
  // same axis the overview was taken from, so the dive reads as one move.
  if (id === 'sun') {
    return new Vector3(...OVERVIEW_POSITION).normalize();
  }
  const position = bodyPosition(id);
  const radial = new Vector3(position.x, 0, position.z).normalize();
  const tangent = new Vector3(-radial.z, 0, radial.x);
  return radial
    .multiplyScalar(frame.radial ?? 0)
    .addScaledVector(tangent, frame.tangent ?? 0)
    .addScaledVector(new Vector3(...WORLD_UP), frame.height ?? 0)
    .normalize();
}

/**
 * Resolves every stage frame into scene-space camera keys for a given viewport
 * aspect. Called at boot and on resize: responsive = re-choreography, so the
 * subject moves above the caption and gains breathing room in portrait.
 */
export function layoutStages(aspect: number, portrait: boolean): StageLayout[] {
  const distanceFactor = portrait ? PORTRAIT_DISTANCE_FACTOR : 1;

  return STAGE_ORDER.map((id) => {
    const frame = STAGE_FRAMES[id];
    let position: Vector3;
    let subject: Vector3;

    if (frame.body !== null) {
      const body = bodyPosition(frame.body);
      const distance = bodyRadius(frame.body) * (frame.dist ?? 3) * distanceFactor;
      position = body.clone().addScaledVector(directionFor(frame.body, frame), distance);
      subject = body;
    } else {
      position = new Vector3(...(frame.position ?? [0, 0, 0]));
      subject = new Vector3(...(frame.target ?? [0, 0, 0]));
    }

    const aim = subject.clone();
    if (frame.sunBlend !== undefined) aim.lerp(SUN_POSITION, frame.sunBlend);

    const distance = Math.max(aim.distanceTo(position), 0.001);
    const forward = aim.clone().sub(position).normalize();
    const reference = Math.abs(forward.y) > 0.97 ? new Vector3(...SIDE_REFERENCE) : new Vector3(0, 1, 0);
    const right = new Vector3().crossVectors(forward, reference).normalize();
    const up = new Vector3().crossVectors(right, forward).normalize();

    const halfHeight = distance * Math.tan((frame.fov * Math.PI) / 360);
    const halfWidth = halfHeight * aspect;
    const offsetX = portrait
      ? (frame.portraitFrameX ?? frame.frameX * PORTRAIT_FRAME_X_SCALE)
      : frame.frameX;
    const offsetY = portrait
      ? Math.max(frame.portraitFrameY ?? frame.frameY + PORTRAIT_FRAME_Y, PORTRAIT_FRAME_Y_MIN)
      : frame.frameY;

    const target = aim
      .addScaledVector(right, -offsetX * halfWidth)
      .addScaledVector(up, -offsetY * halfHeight);

    return { id, body: frame.body, position, target, fov: frame.fov, roll: frame.roll ?? 0 };
  });
}

/**
 * The model's clock.
 *
 * Heliocentric positions are computed in the browser from Keplerian elements
 * referred to J2000.0 (the standard JPL approximate-elements table), so the
 * planets really are where the copy claims they are: change the date at the
 * end of the page and every body moves along its own orbit at its own speed.
 *
 * This module is deliberately free of Three.js and of any layout constant it
 * does not need: the DOM (readouts, the time control) and the 3D scene both
 * import it, and `tools/check-layout.mjs` runs it in Node.
 */

import { AU_UNIT, RADIAL_EXPONENT, toSceneRadius } from '../camera/anchors.ts';

export type Vec3 = readonly [number, number, number];

export type OrbitBodyId = 'earth' | 'mars' | 'jupiter';

export interface OrbitalElements {
  /** Semi-major axis, AU (J2000). */
  readonly au: number;
  /** Eccentricity (J2000). */
  readonly e: number;
  /** Inclination, degrees (J2000). */
  readonly inclinationDeg: number;
  /** Longitude of the ascending node, degrees (J2000). */
  readonly nodeDeg: number;
  /** Longitude of perihelion, degrees (J2000). */
  readonly perihelionDeg: number;
  /** Mean longitude, degrees (J2000). */
  readonly meanLongitudeDeg: number;
  readonly auPerCentury: number;
  readonly ePerCentury: number;
  readonly inclinationPerCentury: number;
  readonly nodePerCentury: number;
  readonly perihelionPerCentury: number;
  readonly meanLongitudePerCentury: number;
}

/**
 * JPL approximate elements, 1800 AD – 2050 AD. Accuracy is far better than
 * this page needs, and it is honest: no fudge factors, no invented motion.
 */
export const ORBITAL_ELEMENTS: Record<OrbitBodyId, OrbitalElements> = {
  earth: {
    au: 1.00000261,
    e: 0.01671123,
    inclinationDeg: -0.00001531,
    nodeDeg: 0,
    perihelionDeg: 102.93768193,
    meanLongitudeDeg: 100.46457166,
    auPerCentury: 0.00000562,
    ePerCentury: -0.00004392,
    inclinationPerCentury: -0.01294668,
    nodePerCentury: 0,
    perihelionPerCentury: 0.32327364,
    meanLongitudePerCentury: 35999.37244981,
  },
  mars: {
    au: 1.52371034,
    e: 0.0933941,
    inclinationDeg: 1.84969142,
    nodeDeg: 49.55953891,
    perihelionDeg: -23.94362959,
    meanLongitudeDeg: -4.55343205,
    auPerCentury: 0.00001847,
    ePerCentury: 0.00007882,
    inclinationPerCentury: -0.00813131,
    nodePerCentury: -0.29257343,
    perihelionPerCentury: 0.44441088,
    meanLongitudePerCentury: 19140.30268499,
  },
  jupiter: {
    au: 5.202887,
    e: 0.04838624,
    inclinationDeg: 1.30439695,
    nodeDeg: 100.47390909,
    perihelionDeg: 14.72847983,
    meanLongitudeDeg: 34.39644051,
    auPerCentury: -0.00011607,
    ePerCentury: -0.00013253,
    inclinationPerCentury: -0.00183714,
    nodePerCentury: 0.20469106,
    perihelionPerCentury: 0.21252668,
    meanLongitudePerCentury: 3034.74612775,
  },
};

export const J2000_JULIAN_DATE = 2451545.0;
const DAYS_PER_CENTURY = 36525;
const UNIX_EPOCH_JULIAN_DATE = 2440587.5;
export const MILLISECONDS_PER_DAY = 86400000;
const DEGREES_TO_RADIANS = Math.PI / 180;

/** The Moon is drawn at a documented compressed distance (docs/TECHNICAL.md). */
export const MOON_DISTANCE_SCENE = 2.6;
export const MOON_SIDEREAL_DAYS = 27.321661;
export const MOON_PHASE_AT_J2000 = 2.34;
/** Fraction of the orbit radius drawn as vertical offset — gives depth. */
export const MOON_INCLINATION = 0.09;

// The main belt's real extent: 2.2 – 3.2 AU.
export const BELT_INNER_AU = 2.2;
export const BELT_OUTER_AU = 3.2;
export const BELT_MEAN_AU = 2.7;
export const BELT_MEAN_PHASE_AT_J2000 = 2.05;
export const BELT_THICKNESS_RATIO = 0.03;

export const SECONDS_PER_DAY = 86400;

export function julianDate(date: Date): number {
  return date.getTime() / MILLISECONDS_PER_DAY + UNIX_EPOCH_JULIAN_DATE;
}

export function daysSinceJ2000(date: Date): number {
  return julianDate(date) - J2000_JULIAN_DATE;
}

export function centuriesSinceJ2000(date: Date): number {
  return daysSinceJ2000(date) / DAYS_PER_CENTURY;
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MILLISECONDS_PER_DAY);
}

/** ISO calendar date in UTC — the only date format the page prints. */
export function formatIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Mean angular rate of a body at `au`, radians per day (Kepler's third law). */
export function orbitalRatePerDay(au: number): number {
  const periodDays = Math.pow(au, 1.5) * 365.256363004;
  return (Math.PI * 2) / periodDays;
}

function solveEccentricAnomaly(meanAnomalyRad: number, eccentricity: number): number {
  let eccentricAnomaly = meanAnomalyRad + eccentricity * Math.sin(meanAnomalyRad);
  for (let iteration = 0; iteration < 8; iteration += 1) {
    const residual =
      eccentricAnomaly - eccentricity * Math.sin(eccentricAnomaly) - meanAnomalyRad;
    const slope = 1 - eccentricity * Math.cos(eccentricAnomaly);
    const step = residual / slope;
    eccentricAnomaly -= step;
    if (Math.abs(step) < 1e-9) {
      break;
    }
  }
  return eccentricAnomaly;
}

interface ElementsAtDate {
  readonly au: number;
  readonly e: number;
  readonly inclination: number;
  readonly node: number;
  readonly argumentOfPerihelion: number;
  readonly meanAnomaly: number;
}

function elementsAt(id: OrbitBodyId, date: Date): ElementsAtDate {
  const elements = ORBITAL_ELEMENTS[id];
  const centuries = centuriesSinceJ2000(date);
  const au = elements.au + elements.auPerCentury * centuries;
  const e = elements.e + elements.ePerCentury * centuries;
  const inclination =
    (elements.inclinationDeg + elements.inclinationPerCentury * centuries) * DEGREES_TO_RADIANS;
  const node = (elements.nodeDeg + elements.nodePerCentury * centuries) * DEGREES_TO_RADIANS;
  const perihelion =
    (elements.perihelionDeg + elements.perihelionPerCentury * centuries) * DEGREES_TO_RADIANS;
  const meanLongitude =
    (elements.meanLongitudeDeg + elements.meanLongitudePerCentury * centuries) * DEGREES_TO_RADIANS;

  return {
    au,
    e,
    inclination,
    node,
    argumentOfPerihelion: perihelion - node,
    meanAnomaly: meanLongitude - perihelion,
  };
}

/** Orbital-plane coordinates for one eccentric anomaly, rotated to the ecliptic. */
function positionAtEccentricAnomaly(state: ElementsAtDate, eccentricAnomaly: number): Vec3 {
  const xOrbital = state.au * (Math.cos(eccentricAnomaly) - state.e);
  const yOrbital = state.au * Math.sqrt(1 - state.e * state.e) * Math.sin(eccentricAnomaly);

  const cosArgument = Math.cos(state.argumentOfPerihelion);
  const sinArgument = Math.sin(state.argumentOfPerihelion);
  const xRotated = xOrbital * cosArgument - yOrbital * sinArgument;
  const yRotated = xOrbital * sinArgument + yOrbital * cosArgument;

  const cosNode = Math.cos(state.node);
  const sinNode = Math.sin(state.node);
  const cosInclination = Math.cos(state.inclination);
  const sinInclination = Math.sin(state.inclination);

  return [
    xRotated * cosNode - yRotated * cosInclination * sinNode,
    xRotated * sinNode + yRotated * cosInclination * cosNode,
    yRotated * sinInclination,
  ];
}

/** Heliocentric ecliptic position in AU, referred to the Sun's centre. */
export function heliocentricPositionAu(id: OrbitBodyId, date: Date): Vec3 {
  const state = elementsAt(id, date);
  return positionAtEccentricAnomaly(state, solveEccentricAnomaly(state.meanAnomaly, state.e));
}

/**
 * The body's real ellipse for the given date, as scene positions. Orbit guides
 * are drawn from this rather than from circles, so a planet always sits on its
 * own line wherever the date puts it.
 */
export function orbitPathScene(id: OrbitBodyId, date: Date, samples: number): Vec3[] {
  const state = elementsAt(id, date);
  const points: Vec3[] = [];
  for (let index = 0; index <= samples; index += 1) {
    const eccentricAnomaly = (index / samples) * Math.PI * 2;
    points.push(toSceneVector(positionAtEccentricAnomaly(state, eccentricAnomaly)));
  }
  return points;
}

/** Inverse of the radial compression — used to light a body by its real AU. */
export function auFromSceneRadius(sceneRadius: number): number {
  return Math.pow(sceneRadius / AU_UNIT, 1 / RADIAL_EXPONENT);
}

/**
 * Map an AU vector into scene units. Direction is preserved exactly — only the
 * radius is compressed, once, in `toSceneRadius` — so every body sits on the
 * true bearing from the Sun while the distances stay flyable.
 */
export function toSceneVector(auVector: Vec3): Vec3 {
  const [x, y, z] = auVector;
  const radius = Math.sqrt(x * x + y * y + z * z);
  if (radius < 1e-9) {
    return [0, 0, 0];
  }
  const scale = toSceneRadius(radius) / radius;
  // Scene space is Y-up: the ecliptic's z (north) becomes scene y.
  return [x * scale, z * scale, y * scale];
}

export interface BodyPositions {
  readonly sun: Vec3;
  readonly earth: Vec3;
  readonly moon: Vec3;
  readonly mars: Vec3;
  readonly jupiter: Vec3;
  readonly belt: Vec3;
}

/** The Moon's own orbit, compressed to `MOON_DISTANCE_SCENE` and fully live. */
export function moonPositionScene(earth: Vec3, date: Date): Vec3 {
  const angle = MOON_PHASE_AT_J2000 + ((Math.PI * 2) / MOON_SIDEREAL_DAYS) * daysSinceJ2000(date);
  const radial = MOON_DISTANCE_SCENE;
  return [
    earth[0] + Math.cos(angle) * radial,
    earth[1] + Math.sin(angle) * radial * MOON_INCLINATION,
    earth[2] + Math.sin(angle) * radial,
  ];
}

/** A real point on the belt's mean circle, rotating with the belt itself. */
export function beltAnchorScene(date: Date): Vec3 {
  const angle = BELT_MEAN_PHASE_AT_J2000 + orbitalRatePerDay(BELT_MEAN_AU) * daysSinceJ2000(date);
  const radius = toSceneRadius(BELT_MEAN_AU);
  return [Math.cos(angle) * radius, 0, Math.sin(angle) * radius];
}

export function bodyPositions(date: Date): BodyPositions {
  const earth = toSceneVector(heliocentricPositionAu('earth', date));
  return {
    sun: [0, 0, 0],
    earth,
    moon: moonPositionScene(earth, date),
    mars: toSceneVector(heliocentricPositionAu('mars', date)),
    jupiter: toSceneVector(heliocentricPositionAu('jupiter', date)),
    belt: beltAnchorScene(date),
  };
}

export function distanceBetween(a: Vec3, b: Vec3): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function earthMarsDistanceAu(date: Date): number {
  const earth = heliocentricPositionAu('earth', date);
  const mars = heliocentricPositionAu('mars', date);
  return distanceBetween(earth, mars);
}

export function earthSunDistanceAu(date: Date): number {
  const earth = heliocentricPositionAu('earth', date);
  return Math.sqrt(earth[0] * earth[0] + earth[1] * earth[1] + earth[2] * earth[2]);
}

/** Sun-facing direction of a body, in scene units — one light for every body. */
export function sunwardDirection(position: Vec3): Vec3 {
  const length = Math.sqrt(position[0] ** 2 + position[1] ** 2 + position[2] ** 2);
  if (length < 1e-9) {
    return [0, 1, 0];
  }
  return [position[0] / length, position[1] / length, position[2] / length];
}

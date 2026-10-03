/**
 * The camera path.
 *
 * A key per destination, joined by eased straight segments: the camera arrives
 * calmly, holds while its section is on screen, then leaves for the next one.
 * Because every key is composed relative to a body (`anchors.ts`), the flight
 * re-plots itself the moment the model's date changes.
 *
 * `cut` turns the whole path into whole keys — that is what reduced motion
 * gets: no travel, one composed still per section.
 */

import { OPENING } from '../../content/experience.ts';
import {
  BODIES,
  CAMERA_KEYS,
  basis,
  composeCamera,
  type CameraFrame,
  type CameraKeySpec,
  type SubjectPositions,
  type Vec3,
  type Viewport,
} from './anchors.ts';

/* ------------------------------------------------------------ avoiding ----
 * Chords between two points of a circular system cut across it, and a body's
 * own departure can skim its surface: at some dates the straight line from
 * Mars to the belt passes within a Sun radius of the Sun, and the opening move
 * can brush the Moon. Rather than special-casing shots, every segment is
 * routed: if the straight line violates a body's clearance the segment bends
 * around it, away from the obstacle, until it clears. The bend is derived from
 * the same numbers `tools/check-layout.mjs` verifies, so it cannot silently
 * drift.
 */
export const ROUTE_CLEARANCE = 1.6;
export const ROUTE_MARGIN = 0.35;
const ROUTE_SAMPLES = 64;
const ROUTE_ATTEMPTS = 6;

interface SegmentRoute {
  readonly from: Vec3;
  readonly to: Vec3;
  readonly control: Vec3 | null;
}

function addVec(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function subVec(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function scaleVec(v: Vec3, factor: number): Vec3 {
  return [v[0] * factor, v[1] * factor, v[2] * factor];
}

function normalise(v: Vec3): Vec3 {
  const length = Math.sqrt(v[0] ** 2 + v[1] ** 2 + v[2] ** 2);
  if (length < 1e-9) {
    return [0, 1, 0];
  }
  return [v[0] / length, v[1] / length, v[2] / length];
}

function evaluateRoute(route: SegmentRoute, t: number): Vec3 {
  if (route.control === null) {
    return lerpVec(route.from, route.to, t);
  }
  const u = 1 - t;
  return [
    u * u * route.from[0] + 2 * u * t * route.control[0] + t * t * route.to[0],
    u * u * route.from[1] + 2 * u * t * route.control[1] + t * t * route.to[1],
    u * u * route.from[2] + 2 * u * t * route.control[2] + t * t * route.to[2],
  ];
}

interface Clearance {
  readonly deficit: number;
  readonly bodyId: keyof SubjectPositions | null;
  readonly at: number;
}

function worstClearance(route: SegmentRoute, positions: SubjectPositions): Clearance {
  const bodyIds = Object.keys(BODIES) as Array<keyof typeof BODIES>;
  let deficit = 0;
  let bodyId: keyof SubjectPositions | null = null;
  let at = 0;
  for (let index = 0; index <= ROUTE_SAMPLES; index += 1) {
    const t = index / ROUTE_SAMPLES;
    const point = evaluateRoute(route, t);
    for (const id of bodyIds) {
      const body = BODIES[id];
      const centre = positions[id];
      const distance = Math.sqrt(
        (point[0] - centre[0]) ** 2 + (point[1] - centre[1]) ** 2 + (point[2] - centre[2]) ** 2,
      );
      const shortfall = body.radius * ROUTE_CLEARANCE + ROUTE_MARGIN - distance;
      if (shortfall > deficit) {
        deficit = shortfall;
        bodyId = id;
        at = t;
      }
    }
  }
  return { deficit, bodyId, at };
}

const routeCache = new WeakMap<SubjectPositions, Map<string, SegmentRoute>>();

function routeSegment(from: Vec3, to: Vec3, positions: SubjectPositions, cacheKey: string): SegmentRoute {
  let cache = routeCache.get(positions);
  if (cache === undefined) {
    cache = new Map<string, SegmentRoute>();
    routeCache.set(positions, cache);
  }
  const cached = cache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  let route: SegmentRoute = { from, to, control: null };
  for (let attempt = 0; attempt < ROUTE_ATTEMPTS; attempt += 1) {
    const clearance = worstClearance(route, positions);
    if (clearance.deficit <= 0 || clearance.bodyId === null) {
      break;
    }
    const contact = evaluateRoute(route, clearance.at);
    const away = normalise(subVec(contact, positions[clearance.bodyId]));
    const anchor = route.control ?? lerpVec(from, to, 0.5);
    route = {
      from,
      to,
      control: addVec(anchor, scaleVec(away, clearance.deficit * 1.7 + 0.2)),
    };
  }

  cache.set(cacheKey, route);
  return route;
}

function clamp01(value: number): number {
  return Math.min(Math.max(value, 0), 1);
}

/** Quintic ease: zero velocity and zero acceleration at both ends. */
function smootherstep(t: number): number {
  const x = clamp01(t);
  return x * x * x * (x * (x * 6 - 15) + 10);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpVec(a: Vec3, b: Vec3, t: number): Vec3 {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

function normaliseLerp(a: Vec3, b: Vec3, t: number): Vec3 {
  const blended: Vec3 = [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  const length = Math.sqrt(blended[0] ** 2 + blended[1] ** 2 + blended[2] ** 2);
  if (length < 1e-6) {
    return b;
  }
  return [blended[0] / length, blended[1] / length, blended[2] / length];
}

/** The key a reduced-motion camera should be standing on. */
export function nearestKey(param: number): CameraKeySpec {
  let best = CAMERA_KEYS[0] as CameraKeySpec;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const key of CAMERA_KEYS) {
    const distance = Math.abs(key.param - param);
    if (distance < bestDistance - 1e-9) {
      best = key;
      bestDistance = distance;
    }
  }
  return best;
}

function segmentFor(param: number): { from: CameraKeySpec; to: CameraKeySpec; t: number } {
  const first = CAMERA_KEYS[0] as CameraKeySpec;
  const last = CAMERA_KEYS[CAMERA_KEYS.length - 1] as CameraKeySpec;
  if (param <= first.param) {
    return { from: first, to: first, t: 0 };
  }
  if (param >= last.param) {
    return { from: last, to: last, t: 0 };
  }
  for (let index = 0; index < CAMERA_KEYS.length - 1; index += 1) {
    const from = CAMERA_KEYS[index] as CameraKeySpec;
    const to = CAMERA_KEYS[index + 1] as CameraKeySpec;
    if (param >= from.param && param <= to.param) {
      const span = to.param - from.param;
      return { from, to, t: span <= 1e-9 ? 0 : (param - from.param) / span };
    }
  }
  return { from: last, to: last, t: 0 };
}

export function sampleCamera(
  param: number,
  positions: SubjectPositions,
  viewport: Viewport,
  cut: boolean,
): CameraFrame {
  if (cut) {
    return composeCamera(nearestKey(param), positions, viewport);
  }

  const { from, to, t } = segmentFor(param);
  const fromFrame = composeCamera(from, positions, viewport);
  if (from === to) {
    return fromFrame;
  }
  const toFrame = composeCamera(to, positions, viewport);

  // The hero holds still while the visitor works out where they are.
  const local = from.id === 'entry' ? clamp01((t - OPENING.holdEnd) / (1 - OPENING.holdEnd)) : t;
  const eased = smootherstep(local);

  const route = routeSegment(fromFrame.position, toFrame.position, positions, `${from.id}>${to.id}`);
  const forward = normaliseLerp(fromFrame.forward, toFrame.forward, eased);
  return {
    position: evaluateRoute(route, eased),
    forward,
    up: basis(forward).up,
    fov: lerp(fromFrame.fov, toFrame.fov, eased),
    aspect: viewport.aspect,
  };
}

/** Where the window module is, relative to the camera, during the opening. */
export function windowExit(param: number): number {
  const t = clamp01((param - OPENING.exitFrom) / (OPENING.exitTo - OPENING.exitFrom));
  return smootherstep(t);
}

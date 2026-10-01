import {
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  LineBasicMaterial,
  LineLoop,
} from 'three';
import { BODIES, ORBIT_BODY_IDS, toSceneRadius } from '../anchors';
import { BELT_INNER_AU, BELT_OUTER_AU, KUIPER_INNER_AU, KUIPER_OUTER_AU } from './belt';
import type { FrameContext, SceneObject } from '../types';

/**
 * Orbit lines. Almost invisible close to a planet — where the journey is
 * intimate — and slowly revealed as the camera pulls out, until the overview
 * shows the system as a system. The lines are the scale argument, drawn.
 */

export const ORBIT_SEGMENTS = 320;
/** Opacity curve keyframes across the journey parameter (0..13). */
export const ORBIT_OPACITY_DIM = 0.04;
export const ORBIT_OPACITY_RAMP = 0.2;
export const ORBIT_OPACITY_OVERVIEW = 0.44;
export const ORBIT_OPACITY_SUN = 0.1;
/** Belt annuli sit at a fraction of the planet-orbit opacity. */
export const ANNULUS_SCALE = 0.55;
export const ORBIT_LINE_COLOR = '#7dd3fc';

const RAMP_FROM = 3;
const RAMP_TO = 5.5;
const PEAK_FROM = 9.5;
const PEAK_TO = 12;
const SUN_FADE_FROM = 12.5;
const SUN_FADE_TO = 13;

function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = Math.min(Math.max((value - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
}

/** Journey-driven opacity: the reveal of scale is scripted, never random. */
export function orbitOpacityAt(progress: number): number {
  const rampIn = smoothstep(RAMP_FROM, RAMP_TO, progress);
  const towardPeak = smoothstep(PEAK_FROM, PEAK_TO, progress);
  const towardSun = smoothstep(SUN_FADE_FROM, SUN_FADE_TO, progress);

  let value = ORBIT_OPACITY_DIM + (ORBIT_OPACITY_RAMP - ORBIT_OPACITY_DIM) * rampIn;
  value += (ORBIT_OPACITY_OVERVIEW - value) * towardPeak;
  value += (ORBIT_OPACITY_SUN - value) * towardSun;
  return value;
}

function circleGeometry(radius: number, height: number): BufferGeometry {
  const positions = new Float32Array((ORBIT_SEGMENTS + 1) * 3);
  for (let index = 0; index <= ORBIT_SEGMENTS; index += 1) {
    const angle = (index / ORBIT_SEGMENTS) * Math.PI * 2;
    positions[index * 3] = Math.cos(angle) * radius;
    positions[index * 3 + 1] = height;
    positions[index * 3 + 2] = Math.sin(angle) * radius;
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  return geometry;
}

interface Line {
  readonly loop: LineLoop;
  readonly material: LineBasicMaterial;
  readonly geometry: BufferGeometry;
  readonly scale: number;
}

export function createOrbitLines(enabled: boolean): SceneObject {
  const group = new Group();
  if (!enabled) {
    return {
      root: group,
      update(): void {},
      dispose(): void {
        group.removeFromParent();
      },
    };
  }

  const lines: Line[] = [];

  const addCircle = (radius: number, height: number, scale: number): void => {
    const geometry = circleGeometry(radius, height);
    const material = new LineBasicMaterial({
      color: new Color(ORBIT_LINE_COLOR),
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const loop = new LineLoop(geometry, material);
    loop.frustumCulled = false;
    loop.renderOrder = -3;
    group.add(loop);
    lines.push({ loop, material, geometry, scale });
  };

  for (const id of ORBIT_BODY_IDS) {
    const body = BODIES[id];
    const radius = toSceneRadius(body.au);
    addCircle(radius, body.elevation * radius, 1);
  }

  const annuli: readonly [number, number][] = [
    [BELT_INNER_AU, BELT_OUTER_AU],
    [KUIPER_INNER_AU, KUIPER_OUTER_AU],
  ];
  for (const [innerAu, outerAu] of annuli) {
    addCircle(toSceneRadius(innerAu), 0, ANNULUS_SCALE);
    addCircle(toSceneRadius(outerAu), 0, ANNULUS_SCALE);
  }

  return {
    root: group,

    update(ctx: FrameContext): void {
      const opacity = orbitOpacityAt(ctx.progress);
      for (const line of lines) {
        line.material.opacity = opacity * line.scale;
      }
    },

    dispose(): void {
      for (const line of lines) {
        line.geometry.dispose();
        line.material.dispose();
        line.loop.removeFromParent();
      }
      lines.length = 0;
      group.removeFromParent();
    },
  };
}

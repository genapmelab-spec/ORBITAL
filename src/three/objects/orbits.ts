import {
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  LineBasicMaterial,
  LineLoop,
} from 'three';
import { toSceneRadius } from '../camera/anchors.ts';
import {
  BELT_INNER_AU,
  BELT_OUTER_AU,
  orbitPathScene,
  type OrbitBodyId,
} from '../systems/epoch.ts';
import { PALETTE } from '../systems/palette.ts';
import type { FrameContext, SceneObject } from '../types.ts';

/**
 * Orbit guides. Almost invisible close to a world — where the flight is
 * intimate — and slowly revealed as the camera climbs out, until the overview
 * shows the system as a system. Each line is the body's real ellipse for the
 * current date, so a planet always sits on its own line.
 */

export const ORBIT_SEGMENTS = 220;
export const ORBIT_LINE_COLOR = PALETTE.ion;

/** Opacity keyframes across the camera parameter. */
export const ORBIT_OPACITY_FLIGHT = 0.03;
export const ORBIT_OPACITY_CLIMB = 0.18;
export const ORBIT_OPACITY_OVERVIEW = 0.42;
const RAMP_FROM = 4.6;
const RAMP_TO = 5.6;
const CLIMB_FROM = 6;
const CLIMB_TO = 6.9;

function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = Math.min(Math.max((value - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
}

/** The reveal of scale is scripted by the journey, never random. */
export function orbitOpacityAt(param: number): number {
  const climb = smoothstep(RAMP_FROM, RAMP_TO, param);
  const overview = smoothstep(CLIMB_FROM, CLIMB_TO, param);
  let value = ORBIT_OPACITY_FLIGHT + (ORBIT_OPACITY_CLIMB - ORBIT_OPACITY_FLIGHT) * climb;
  value += (ORBIT_OPACITY_OVERVIEW - value) * overview;
  return value;
}

const ORBIT_BODIES: readonly OrbitBodyId[] = ['earth', 'mars', 'jupiter'];

interface Line {
  readonly loop: LineLoop;
  readonly material: LineBasicMaterial;
  readonly geometry: BufferGeometry;
}

function circleGeometry(radius: number): BufferGeometry {
  const positions = new Float32Array((ORBIT_SEGMENTS + 1) * 3);
  for (let index = 0; index <= ORBIT_SEGMENTS; index += 1) {
    const angle = (index / ORBIT_SEGMENTS) * Math.PI * 2;
    positions[index * 3] = Math.cos(angle) * radius;
    positions[index * 3 + 1] = 0;
    positions[index * 3 + 2] = Math.sin(angle) * radius;
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  return geometry;
}

function pathGeometry(points: ReadonlyArray<readonly [number, number, number]>): BufferGeometry {
  const positions = new Float32Array(points.length * 3);
  for (let index = 0; index < points.length; index += 1) {
    const point = points[index] as readonly [number, number, number];
    positions[index * 3] = point[0];
    positions[index * 3 + 1] = point[1];
    positions[index * 3 + 2] = point[2];
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  return geometry;
}

export interface OrbitLinesHandle extends SceneObject {
  setEpoch(date: Date): void;
  setEnabled(enabled: boolean): void;
}

export function createOrbitLines(enabled: boolean): OrbitLinesHandle {
  const group = new Group();
  group.visible = enabled;
  const lines: Line[] = [];

  function addLine(geometry: BufferGeometry, weight: number): void {
    const material = new LineBasicMaterial({
      color: new Color(ORBIT_LINE_COLOR),
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const loop = new LineLoop(geometry, material);
    loop.frustumCulled = false;
    loop.renderOrder = -3;
    loop.userData.weight = weight;
    group.add(loop);
    lines.push({ loop, material, geometry });
  }

  function rebuild(date: Date): void {
    for (const line of lines) {
      line.geometry.dispose();
      line.material.dispose();
      line.loop.removeFromParent();
    }
    lines.length = 0;
    for (const id of ORBIT_BODIES) {
      addLine(pathGeometry(orbitPathScene(id, date, ORBIT_SEGMENTS)), 1);
    }
    addLine(circleGeometry(toSceneRadius(BELT_INNER_AU)), 0.5);
    addLine(circleGeometry(toSceneRadius(BELT_OUTER_AU)), 0.5);
  }

  rebuild(new Date());

  return {
    root: group,
    update(ctx: FrameContext): void {
      if (!group.visible) {
        return;
      }
      const opacity = orbitOpacityAt(ctx.param);
      for (const line of lines) {
        line.material.opacity = opacity * (line.loop.userData.weight as number);
      }
    },
    setEpoch(date: Date): void {
      rebuild(date);
    },
    setEnabled(next: boolean): void {
      group.visible = next;
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

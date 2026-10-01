import {
  Color,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  Matrix4,
  Quaternion,
  ShaderMaterial,
  Vector3,
} from 'three';
import { toSceneRadius } from '../anchors';
import { createRandom, randomDirection } from '../random';
import { ROCK_FRAGMENT, ROCK_VERTEX } from '../shaders/rock';
import type { FrameContext, SceneObject } from '../types';

/**
 * The asteroid belt and the Kuiper belt — the two places where the Solar System
 * stops being about planets. Both are single instanced draws: thousands of
 * rocks, one material, no per-frame geometry work. The camera flies through
 * them, so they are staged as environment, never as scenery behind glass.
 */

/** Capacity is allocated once at the high-tier count so a tier upgrade works. */
export const ASTEROID_CAPACITY = 1500;
export const KUIPER_CAPACITY = 900;

/** Belt extent in AU — matches the journey metadata (2.2–3.2 AU). */
export const BELT_INNER_AU = 2.2;
export const BELT_OUTER_AU = 3.2;
/** Kuiper extent in AU — matches the outer-system metadata (30–50 AU). */
export const KUIPER_INNER_AU = 30;
export const KUIPER_OUTER_AU = 50;

/** Vertical scatter as a fraction of orbit radius: thin belt, fat Kuiper cloud. */
export const BELT_THICKNESS = 0.035;
export const KUIPER_THICKNESS = 0.075;

export const BELT_ROCK_MIN = 0.015;
export const BELT_ROCK_MAX = 0.09;
export const KUIPER_ROCK_MIN = 0.03;
export const KUIPER_ROCK_MAX = 0.14;

/** Slow field rotation, radians per second — orbital drift, not a turntable. */
export const BELT_DRIFT = 0.006;
export const BELT_SEED = 0x7a3c11;
export const KUIPER_SEED = 0x1f5b2e;

export interface BeltHandle extends SceneObject {
  /** Fraction of the allocated rocks to draw (0..1) — the tier lever. */
  setDensity(fraction: number): void;
}

interface FieldOptions {
  readonly capacity: number;
  readonly inner: number;
  readonly outer: number;
  readonly thickness: number;
  readonly rockMin: number;
  readonly rockMax: number;
  readonly seed: number;
  readonly baseColor: string;
  readonly accentColor: string;
  readonly lightColor: Color;
}

function createField(options: FieldOptions): { mesh: InstancedMesh; material: ShaderMaterial; geometry: IcosahedronGeometry } {
  const random = createRandom(options.seed);
  const geometry = new IcosahedronGeometry(1, 0);
  const material = new ShaderMaterial({
    vertexShader: ROCK_VERTEX,
    fragmentShader: ROCK_FRAGMENT,
    uniforms: {
      uBaseColor: { value: new Color(options.baseColor) },
      uAccentColor: { value: new Color(options.accentColor) },
      uLightColor: { value: options.lightColor.clone() },
    },
  });

  const mesh = new InstancedMesh(geometry, material, options.capacity);
  mesh.frustumCulled = false;

  const matrix = new Matrix4();
  const position = new Vector3();
  const rotation = new Quaternion();
  const scale = new Vector3();

  for (let index = 0; index < options.capacity; index += 1) {
    const radial = options.inner + (options.outer - options.inner) * Math.pow(random(), 0.85);
    const angle = random() * Math.PI * 2;
    const vertical = (random() * 2 - 1) * options.thickness * radial;
    position.set(Math.cos(angle) * radial, vertical, Math.sin(angle) * radial);

    const [rx, ry, rz] = randomDirection(random);
    rotation.setFromAxisAngle(new Vector3(rx, ry, rz).normalize(), random() * Math.PI);

    const size = options.rockMin + random() * (options.rockMax - options.rockMin);
    scale.set(size * (0.6 + random() * 0.8), size * (0.6 + random() * 0.8), size * (0.6 + random() * 0.8));

    matrix.compose(position, rotation, scale);
    mesh.setMatrixAt(index, matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;

  return { mesh, material, geometry };
}

export function createBelts(
  asteroidCount: number,
  kuiperCount: number,
  asteroidLightColor: Color,
  kuiperLightColor: Color,
): BeltHandle {
  const group = new Group();

  const belt = createField({
    capacity: ASTEROID_CAPACITY,
    inner: toSceneRadius(BELT_INNER_AU),
    outer: toSceneRadius(BELT_OUTER_AU),
    thickness: BELT_THICKNESS,
    rockMin: BELT_ROCK_MIN,
    rockMax: BELT_ROCK_MAX,
    seed: BELT_SEED,
    baseColor: '#7d7469',
    accentColor: '#3b3630',
    lightColor: asteroidLightColor,
  });

  const kuiper = createField({
    capacity: KUIPER_CAPACITY,
    inner: toSceneRadius(KUIPER_INNER_AU),
    outer: toSceneRadius(KUIPER_OUTER_AU),
    thickness: KUIPER_THICKNESS,
    rockMin: KUIPER_ROCK_MIN,
    rockMax: KUIPER_ROCK_MAX,
    seed: KUIPER_SEED,
    baseColor: '#6f7c8c',
    accentColor: '#2b3442',
    lightColor: kuiperLightColor,
  });

  group.add(belt.mesh, kuiper.mesh);

  const beltMesh = belt.mesh;
  const kuiperMesh = kuiper.mesh;
  beltMesh.count = Math.min(asteroidCount, ASTEROID_CAPACITY);
  kuiperMesh.count = Math.min(kuiperCount, KUIPER_CAPACITY);

  return {
    root: group,

    update(ctx: FrameContext): void {
      group.rotation.y += ctx.dt * BELT_DRIFT;
    },

    setDensity(fraction: number): void {
      const safe = Math.min(Math.max(fraction, 0), 1);
      beltMesh.count = Math.round(ASTEROID_CAPACITY * safe);
      kuiperMesh.count = Math.round(KUIPER_CAPACITY * safe);
    },

    dispose(): void {
      belt.geometry.dispose();
      belt.material.dispose();
      kuiper.geometry.dispose();
      kuiper.material.dispose();
      beltMesh.removeFromParent();
      kuiperMesh.removeFromParent();
      group.removeFromParent();
    },
  };
}

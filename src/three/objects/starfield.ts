import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Points,
  ShaderMaterial,
} from 'three';
import { STAR_FRAGMENT, STAR_VERTEX } from '../shaders/points.ts';
import { createRandom, randomDirection } from '../systems/random.ts';
import type { FrameContext, SceneObject } from '../types.ts';

/**
 * Starfield. Three concentric shells give depth; each star owns a size, a
 * twinkle phase and a temperature, so the field reads as sky rather than noise.
 * Travel speed leans every star toward the viewer through one uniform.
 */

export const STAR_SHELL_RADII: readonly number[] = [1500, 2000, 2400];
export const STAR_SIZE_MIN = 1;
export const STAR_SIZE_MAX = 3.2;
export const STARFIELD_SEED = 0x51a1f3;
/** Scene units per second that saturates the stretch uniform. */
export const STRETCH_REFERENCE_SPEED = 70;

export interface StarfieldHandle extends SceneObject {
  setCount(count: number): void;
}

export function createStarfield(count: number, pixelRatio: number): StarfieldHandle {
  const random = createRandom(STARFIELD_SEED);
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);
  const temperatures = new Float32Array(count);

  for (let index = 0; index < count; index += 1) {
    const shell = STAR_SHELL_RADII[index % STAR_SHELL_RADII.length] as number;
    const [x, y, z] = randomDirection(random);
    const radius = shell * (0.88 + random() * 0.12);
    positions[index * 3] = x * radius;
    positions[index * 3 + 1] = y * radius;
    positions[index * 3 + 2] = z * radius;

    sizes[index] = STAR_SIZE_MIN + random() * (STAR_SIZE_MAX - STAR_SIZE_MIN);
    phases[index] = random();
    // Most stars cool, a minority burn warm — matches the grade in DESIGN.md.
    temperatures[index] = random() < 0.72 ? random() * 0.35 : 0.55 + random() * 0.45;
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setAttribute('aSize', new BufferAttribute(sizes, 1));
  geometry.setAttribute('aPhase', new BufferAttribute(phases, 1));
  geometry.setAttribute('aTemperature', new BufferAttribute(temperatures, 1));
  geometry.boundingSphere = null;

  const uniforms = {
    uTime: { value: 0 },
    uPixelRatio: { value: pixelRatio },
    uStretch: { value: 0 },
  };

  const material = new ShaderMaterial({
    vertexShader: STAR_VERTEX,
    fragmentShader: STAR_FRAGMENT,
    uniforms,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: AdditiveBlending,
  });

  const points = new Points(geometry, material);
  points.frustumCulled = false;
  points.renderOrder = -2;

  return {
    root: points,
    update(ctx: FrameContext): void {
      uniforms.uTime.value = ctx.elapsed;
      uniforms.uPixelRatio.value = ctx.pixelRatio;
      const target = Math.min(ctx.speed / STRETCH_REFERENCE_SPEED, 1);
      uniforms.uStretch.value += (target - uniforms.uStretch.value) * Math.min(ctx.dt * 2.4, 1);
    },
    setCount(next: number): void {
      geometry.setDrawRange(0, Math.min(Math.max(Math.round(next), 0), count));
    },
    dispose(): void {
      geometry.dispose();
      material.dispose();
      points.removeFromParent();
    },
  };
}

import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Points,
  ShaderMaterial,
  Vector3,
} from 'three';
import { DUST_FRAGMENT, DUST_VERTEX } from '../shaders/points';
import { createRandom } from '../random';
import type { FrameContext, SceneObject } from '../types';

/**
 * Interplanetary dust. A box of motes that wraps around the camera, so the
 * field stays infinitely long while each mote keeps a fixed world position:
 * travel is read from parallax, not from moving particles.
 */

export const DUST_BOX: readonly [number, number, number] = [90, 60, 90];
/** Distance at which a mote fades out, in scene units. */
export const DUST_FADE_RADIUS = 40;
export const DUST_SIZE_MIN = 0.7;
export const DUST_SIZE_MAX = 1.9;
export const DUST_SEED = 0x2c1d77;
/** Brightness floor so slow stages are not dead, ceiling so dives feel fast. */
export const DUST_OPACITY_MIN = 0.12;
export const DUST_OPACITY_MAX = 0.4;
export const DUST_SPEED_REFERENCE = 55;

export interface DustHandle extends SceneObject {
  setCount(count: number): void;
}

export function createDust(count: number, pixelRatio: number): DustHandle {
  const random = createRandom(DUST_SEED);
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);

  for (let index = 0; index < count; index += 1) {
    positions[index * 3] = random() * DUST_BOX[0];
    positions[index * 3 + 1] = random() * DUST_BOX[1];
    positions[index * 3 + 2] = random() * DUST_BOX[2];
    sizes[index] = DUST_SIZE_MIN + random() * (DUST_SIZE_MAX - DUST_SIZE_MIN);
    phases[index] = random();
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setAttribute('aSize', new BufferAttribute(sizes, 1));
  geometry.setAttribute('aPhase', new BufferAttribute(phases, 1));

  const uniforms = {
    uTime: { value: 0 },
    uPixelRatio: { value: pixelRatio },
    uCamera: { value: new Vector3() },
    uBox: { value: new Vector3(...DUST_BOX) },
    uHalfBox: { value: new Vector3(DUST_BOX[0] / 2, DUST_BOX[1] / 2, DUST_BOX[2] / 2) },
    uOpacity: { value: DUST_OPACITY_MIN },
    uFade: { value: DUST_FADE_RADIUS },
  };

  const material = new ShaderMaterial({
    vertexShader: DUST_VERTEX,
    fragmentShader: DUST_FRAGMENT,
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });

  const points = new Points(geometry, material);
  points.frustumCulled = false;
  points.renderOrder = -1;

  return {
    root: points,
    update(ctx: FrameContext): void {
      uniforms.uTime.value = ctx.elapsed;
      uniforms.uPixelRatio.value = pixelRatio;
      uniforms.uCamera.value.copy(ctx.camera.position);
      const intensity = Math.min(ctx.speed / DUST_SPEED_REFERENCE, 1);
      const target = DUST_OPACITY_MIN + (DUST_OPACITY_MAX - DUST_OPACITY_MIN) * intensity;
      uniforms.uOpacity.value += (target - uniforms.uOpacity.value) * Math.min(ctx.dt * 2, 1);
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

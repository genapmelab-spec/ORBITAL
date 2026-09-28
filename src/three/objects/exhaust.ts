/**
 * exhaust.ts — additive plume behind the cruiser.
 * Only alive during the three burns defined in world.ts. Zero particles when
 * burn is 0, so it costs nothing for most of the journey.
 *
 * It is parented to the engine anchor, so it is genuinely attached to the ship
 * rather than being a screen-space effect that pretends to be one.
 */

import * as THREE from 'three';
import { EXHAUST } from '../world';
import { createHalo } from './halo';
import type { SceneObject } from '../types';

const EXHAUST_VERTEX = /* glsl */ `
uniform float uTime;
uniform float uBurn;
uniform float uPixelRatio;

attribute float aSeed;
attribute float aRadius;
attribute float aAngle;
attribute float aSize;

varying float vAlpha;
varying float vLife;

void main() {
  // Each particle loops independently, so the plume never pulses as a block.
  float life = fract(aSeed + uTime * (0.55 + aSeed * 0.55));

  float spread = 0.14 + life * (1.0 + aRadius * 1.5);
  vec3 plume = vec3(
    cos(aAngle) * spread,
    sin(aAngle) * spread,
    -life * (7.0 * uBurn + 1.0)
  );

  vec4 mv = modelViewMatrix * vec4(plume, 1.0);
  gl_Position = projectionMatrix * mv;

  gl_PointSize = aSize * (1.0 - life * 0.6) * uPixelRatio * (70.0 / max(-mv.z, 1.0));

  vAlpha = (1.0 - life) * uBurn;
  vLife = life;
}
`;

const EXHAUST_FRAGMENT = /* glsl */ `
varying float vAlpha;
varying float vLife;

void main() {
  vec2 centered = gl_PointCoord - 0.5;
  float radial = length(centered) * 2.0;
  float falloff = smoothstep(1.0, 0.05, radial);

  // Hot core (solar) cooling to the ember accent, then to nothing.
  vec3 hot = vec3(1.0, 0.757, 0.369);
  vec3 cool = vec3(1.0, 0.42, 0.208);
  vec3 color = mix(hot, cool, smoothstep(0.0, 0.75, vLife));

  float alpha = falloff * vAlpha * 0.85;
  gl_FragColor = vec4(color * alpha, alpha);
}
`;

export interface ExhaustObject extends SceneObject {
  setBurn(value: number): void;
  setCount(count: number): void;
  setPixelRatio(ratio: number): void;
}

/** Burn intensity for a given flight progress, from the windows in world.ts. */
export function burnAt(progress: number): number {
  let burn = 0;
  for (const window of EXHAUST.burns) {
    if (progress < window.start || progress > window.end) continue;
    const span = window.end - window.start;
    const local = span <= 0 ? 0 : (progress - window.start) / span;
    // sin envelope: lit at the start of the window, out by the end
    burn = Math.max(burn, Math.sin(local * Math.PI) * window.peak);
  }
  // Under way between the departure and arrival burns: the engine never goes
  // fully cold while the ship is coasting, or the cruiser reads as a prop.
  if (progress >= 0.3 && progress <= 0.95) burn = Math.max(burn, 0.35);
  return burn;
}

export function createExhaust(pixelRatio: number): ExhaustObject {
  const root = new THREE.Group();
  root.name = 'exhaust';

  const capacity = EXHAUST.particles;
  const positions = new Float32Array(capacity * 3); // unused, but required
  const seeds = new Float32Array(capacity);
  const radii = new Float32Array(capacity);
  const angles = new Float32Array(capacity);
  const sizes = new Float32Array(capacity);

  for (let i = 0; i < capacity; i += 1) {
    seeds[i] = Math.random();
    radii[i] = Math.random();
    angles[i] = Math.random() * Math.PI * 2;
    sizes[i] = 5 + Math.random() * 13;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  geometry.setAttribute('aRadius', new THREE.BufferAttribute(radii, 1));
  geometry.setAttribute('aAngle', new THREE.BufferAttribute(angles, 1));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 20);

  const material = new THREE.ShaderMaterial({
    vertexShader: EXHAUST_VERTEX,
    fragmentShader: EXHAUST_FRAGMENT,
    uniforms: {
      uTime: { value: 0 },
      uBurn: { value: 0 },
      uPixelRatio: { value: pixelRatio },
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: true,
  });

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  points.name = 'exhaust-plume';
  root.add(points);

  const glow = createHalo(0xff8a4a, 1.1, 0.0);
  glow.sprite.name = 'engine-glow';
  root.add(glow.sprite);

  let burn = 0;
  let count: number = capacity;

  return {
    root,

    setBurn(value: number): void {
      burn = Math.max(0, Math.min(1, value));
      material.uniforms.uBurn.value = burn;
      glow.setOpacity(burn * 0.75);
      const visible = burn > 0.01;
      points.visible = visible && count > 0;
      glow.sprite.visible = visible;
    },

    setCount(next: number): void {
      count = Math.max(0, Math.min(capacity, Math.floor(next)));
      geometry.setDrawRange(0, count);
      points.visible = burn > 0.01 && count > 0;
    },

    setPixelRatio(ratio: number): void {
      material.uniforms.uPixelRatio.value = ratio;
    },

    update(_dt: number, elapsed: number): void {
      if (!points.visible) return;
      material.uniforms.uTime.value = elapsed;
    },

    dispose(): void {
      geometry.dispose();
      material.dispose();
      glow.dispose();
    },
  };
}

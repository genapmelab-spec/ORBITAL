/**
 * starfield.ts — three parallax shells of GPU stars.
 *
 * Signature interaction: every star is a two-vertex LINE SEGMENT whose length
 * is grown *in view space, radially outward from the screen centre*. That is
 * the vanishing point of the camera's forward axis, so a fast scroll stretches
 * every star into a warp streak that radiates from where the ship is heading —
 * real geometry, one draw call per shell, no post-processing pass.
 *
 * Idle, the same segment is sub-pixel and reads as a point star.
 */

import * as THREE from 'three';
import { STAR_LATTICE } from '../world';
import type { SceneObject } from '../types';

const STAR_VERTEX = /* glsl */ `
uniform float uStretch;
uniform float uTime;
uniform float uTwinkle;

attribute float aSide;
attribute float aDash;
attribute float aPhase;
attribute float aBright;
attribute vec3 aColor;

varying vec3 vColor;
varying float vAlpha;

void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  float dist = max(-mv.z, 1.0);

  vec2 offset = length(mv.xy) > 1e-4 ? normalize(mv.xy) : vec2(0.0);
  mv.xy += offset * aDash * uStretch * aSide;

  gl_Position = projectionMatrix * mv;

  float twinkle = 0.84 + 0.16 * sin(uTime * uTwinkle + aPhase);
  // Safety fade: nothing is ever close enough to rasterise as a fat dash.
  float proximity = smoothstep(140.0, 620.0, dist);

  vColor = aColor;
  vAlpha = aBright * twinkle * proximity;
}
`;

const STAR_FRAGMENT = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;

void main() {
  float alpha = vAlpha;
  gl_FragColor = vec4(vColor * alpha, alpha);
}
`;

/** Idle dash multiplier and the ceiling reached at full scroll velocity. */
const STRETCH_IDLE = 1;
const STRETCH_MAX = 8.5;
/** how quickly the streak grows / relaxes, 1/s */
const STRETCH_ATTACK = 7;
const STRETCH_RELEASE = 2.6;

interface Shell {
  readonly geometry: THREE.BufferGeometry;
  readonly material: THREE.ShaderMaterial;
  readonly line: THREE.LineSegments;
  readonly capacity: number;
}

export interface Starfield extends SceneObject {
  /** normalised scroll velocity, roughly -1..1 */
  setVelocity(velocity: number): void;
  /** trim visible stars per shell — a downgrade costs one integer, no rebuild */
  setCounts(counts: readonly [number, number, number]): void;
}

/**
 * Uniform direction sampling on a shell of thickness `spread` around `radius`.
 */
function sampleShellPosition(
  radius: number,
  spread: number,
  target: THREE.Vector3,
): void {
  const u = Math.random() * 2 - 1;
  const theta = Math.random() * Math.PI * 2;
  const planar = Math.sqrt(Math.max(0, 1 - u * u));
  const r = radius + (Math.random() * 2 - 1) * spread;
  target.set(planar * Math.cos(theta) * r, u * r, planar * Math.sin(theta) * r);
}

export function createStarfield(counts: readonly [number, number, number]): Starfield {
  const root = new THREE.Group();
  root.name = 'starfield';
  root.position.copy(STAR_LATTICE.center);

  const shells: Shell[] = [];
  const tints = [
    new THREE.Color(0xf2f5fa),
    new THREE.Color(0xf2f5fa),
    new THREE.Color(0xf2f5fa),
    new THREE.Color(0xe8f4fb),
    new THREE.Color(0x7dd3fc),
    new THREE.Color(0xffc15e),
  ];
  // Weighting: ~68% white, ~12% cool white, ~14% ion (atmosphere), ~6% solar.
  const scratch = new THREE.Vector3();

  STAR_LATTICE.layers.forEach((layer, layerIndex) => {
    const capacity = layer.counts[0];
    const requested = Math.max(0, Math.min(capacity, counts[layerIndex] ?? 0));
    if (requested === 0) return;

    const positions = new Float32Array(capacity * 2 * 3);
    const sides = new Float32Array(capacity * 2);
    const dashes = new Float32Array(capacity * 2);
    const phases = new Float32Array(capacity * 2);
    const brights = new Float32Array(capacity * 2);
    const colors = new Float32Array(capacity * 2 * 3);

    for (let i = 0; i < capacity; i += 1) {
      sampleShellPosition(layer.radius, layer.spread, scratch);
      const radiusAtStar = scratch.length();
      const dash =
        radiusAtStar * STAR_LATTICE.dashRatio * (0.6 + Math.random() * 0.8);
      // Most stars are faint; a few carry the eye. Squared distribution, not flat.
      const bright = 0.22 + Math.random() ** 2.1 * 0.78;
      const phase = Math.random() * Math.PI * 2;

      const roll = Math.random();
      const tintIndex = roll > 0.94 ? 5 : roll > 0.8 ? 4 : roll > 0.68 ? 3 : Math.floor(Math.random() * 3);
      const tint = tints[tintIndex] ?? tints[0];

      for (let v = 0; v < 2; v += 1) {
        const index = i * 2 + v;
        positions[index * 3] = scratch.x;
        positions[index * 3 + 1] = scratch.y;
        positions[index * 3 + 2] = scratch.z;
        sides[index] = v === 0 ? -1 : 1;
        dashes[index] = dash;
        phases[index] = phase;
        brights[index] = bright;
        colors[index * 3] = tint.r;
        colors[index * 3 + 1] = tint.g;
        colors[index * 3 + 2] = tint.b;
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aSide', new THREE.BufferAttribute(sides, 1));
    geometry.setAttribute('aDash', new THREE.BufferAttribute(dashes, 1));
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    geometry.setAttribute('aBright', new THREE.BufferAttribute(brights, 1));
    geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    // Trim to the requested count; the remaining vertices stay allocated so a
    // later downgrade is a single integer write.
    geometry.setDrawRange(0, requested * 2);
    geometry.boundingSphere = new THREE.Sphere(
      new THREE.Vector3(0, 0, 0),
      layer.radius + layer.spread + 1,
    );

    const material = new THREE.ShaderMaterial({
      vertexShader: STAR_VERTEX,
      fragmentShader: STAR_FRAGMENT,
      uniforms: {
        uStretch: { value: STRETCH_IDLE },
        uTime: { value: 0 },
        uTwinkle: { value: layer.twinkle },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true,
    });

    const line = new THREE.LineSegments(geometry, material);
    line.frustumCulled = false;
    line.name = `star-shell-${layerIndex}`;
    root.add(line);

    shells.push({ geometry, material, line, capacity });
  });

  let velocity = 0;
  let stretch = STRETCH_IDLE;

  return {
    root,

    setVelocity(next: number): void {
      velocity = next;
    },

    setCounts(next: readonly [number, number, number]): void {
      shells.forEach((shell, index) => {
        const want = Math.max(0, Math.min(shell.capacity, next[index] ?? 0));
        shell.geometry.setDrawRange(0, want * 2);
        shell.line.visible = want > 0;
      });
    },

    update(dt: number, elapsed: number): void {
      const target = STRETCH_IDLE + Math.abs(velocity) * (STRETCH_MAX - STRETCH_IDLE);
      const rate = target > stretch ? STRETCH_ATTACK : STRETCH_RELEASE;
      const blend = 1 - Math.exp(-rate * dt);
      stretch += (target - stretch) * blend;

      for (const shell of shells) {
        shell.material.uniforms.uStretch.value = stretch;
        shell.material.uniforms.uTime.value = elapsed;
      }
    },

    dispose(): void {
      for (const shell of shells) {
        shell.geometry.dispose();
        shell.material.dispose();
        root.remove(shell.line);
      }
      shells.length = 0;
    },
  };
}

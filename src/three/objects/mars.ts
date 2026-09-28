/**
 * mars.ts — act 3's subject.
 * A displaced sphere: the terrain is real geometry (perturbed normals), not a
 * normal map, so the silhouette itself is irregular at the limb.
 */

import * as THREE from 'three';
import { MARS, SUN_DIRECTION } from '../world';
import { createMarsMaterial } from '../shaders/surface.glsl';
import { ATMOSPHERE_FRAGMENT, ATMOSPHERE_VERTEX } from '../shaders/atmosphere.glsl';
import { createHalo } from './halo';
import type { PlanetObject } from './planet';

/** Dust haze is ember-leaning; the ion token is reserved for Earth. */
const LIMB_COLOR = 0xff8a4a;
const LIMB_INNER_COLOR = 0xffc15e;
const HALO_COLOR = 0xffa06a;

/** Terrain amplitude in world units. Mars radius is 22, so ≈5% of radius. */
const DISPLACEMENT = 1.4;
/** landforms per hemisphere — the height field is scale invariant */
const NOISE_SCALE = 3;
const DETAIL_SCALE = 6;
/** how hard the height field bends the normals (the relief you actually see) */
const RELIEF = 6;

export function createMars(segments: readonly [number, number]): PlanetObject {
  const root = new THREE.Group();
  root.name = 'mars';
  root.position.copy(MARS.center);

  const geometry = new THREE.SphereGeometry(MARS.radius, segments[0], segments[1]);
  const material = createMarsMaterial(SUN_DIRECTION, {
    displacement: DISPLACEMENT,
    noiseScale: NOISE_SCALE,
    detailScale: DETAIL_SCALE,
    relief: RELIEF,
  });
  const surface = new THREE.Mesh(geometry, material);
  surface.name = 'mars-surface';
  root.add(surface);

  const limbMaterial = new THREE.ShaderMaterial({
    vertexShader: ATMOSPHERE_VERTEX,
    fragmentShader: ATMOSPHERE_FRAGMENT,
    uniforms: {
      uColor: { value: new THREE.Color(LIMB_COLOR) },
      uInnerColor: { value: new THREE.Color(LIMB_INNER_COLOR) },
      uSunDirection: { value: SUN_DIRECTION.clone() },
      uIntensity: { value: 0.45 },
      uPower: { value: 2.8 },
      uInnerFactor: { value: 1.35 },
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.FrontSide,
  });
  const limb = new THREE.Mesh(geometry, limbMaterial);
  limb.scale.setScalar(MARS.atmosphereScale);
  limb.name = 'mars-limb';
  root.add(limb);

  const halo = createHalo(HALO_COLOR, MARS.radius, 0.14);
  halo.sprite.name = 'mars-halo';
  root.add(halo.sprite);

  const toViewer = new THREE.Vector3();

  return {
    root,

    setShellLevel(level: number): void {
      limb.visible = level >= 1;
      halo.sprite.visible = level >= 2;
    },

    setViewerPosition(viewer: THREE.Vector3): void {
      if (!halo.sprite.visible) return;
      toViewer.subVectors(root.position, viewer);
      const facing = Math.abs(toViewer.normalize().dot(SUN_DIRECTION));
      halo.setOpacity(0.06 + facing * 0.18);
    },

    update(dt: number, elapsed: number): void {
      material.uniforms.uTime.value = elapsed;
      surface.rotation.y += MARS.spin * dt;
      limb.rotation.y = surface.rotation.y;
    },

    dispose(): void {
      geometry.dispose();
      material.dispose();
      limbMaterial.dispose();
      halo.dispose();
    },
  };
}

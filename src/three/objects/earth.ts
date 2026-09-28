/**
 * earth.ts — act 1's subject.
 * Surface from the shader module, one additive limb shell, one halo billboard.
 * Three draw calls, one of which is droppable per quality tier.
 */

import * as THREE from 'three';
import { EARTH, SUN_DIRECTION } from '../world';
import { createEarthMaterial } from '../shaders/surface.glsl';
import { ATMOSPHERE_FRAGMENT, ATMOSPHERE_VERTEX } from '../shaders/atmosphere.glsl';
import { createHalo } from './halo';
import type { PlanetObject } from './planet';

/** Earth's atmosphere reads cool — the ion token is for atmosphere and data. */
const LIMB_COLOR = 0x7dd3fc;
const LIMB_INNER_COLOR = 0xdff2ff;
const HALO_COLOR = 0x7dd3fc;

export interface EarthObject extends PlanetObject {
  /** point on the limb, for the hero's in-scene holo label */
  readonly limbAnchor: THREE.Object3D;
}

export function createEarth(segments: readonly [number, number]): EarthObject {
  const root = new THREE.Group();
  root.name = 'earth';
  root.position.copy(EARTH.center);

  const geometry = new THREE.SphereGeometry(EARTH.radius, segments[0], segments[1]);
  const material = createEarthMaterial(SUN_DIRECTION);
  const surface = new THREE.Mesh(geometry, material);
  surface.name = 'earth-surface';
  root.add(surface);

  // Tight bright rim hugging the limb.
  const limbMaterial = new THREE.ShaderMaterial({
    vertexShader: ATMOSPHERE_VERTEX,
    fragmentShader: ATMOSPHERE_FRAGMENT,
    uniforms: {
      uColor: { value: new THREE.Color(LIMB_COLOR) },
      uInnerColor: { value: new THREE.Color(LIMB_INNER_COLOR) },
      uSunDirection: { value: SUN_DIRECTION.clone() },
      uIntensity: { value: 1.15 },
      uPower: { value: 2.4 },
      uInnerFactor: { value: 1.7 },
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.FrontSide,
  });
  const limb = new THREE.Mesh(geometry, limbMaterial);
  limb.scale.setScalar(EARTH.innerAtmosphereScale);
  limb.name = 'earth-limb';
  root.add(limb);

  // Wide, soft falloff outside the silhouette.
  const halo = createHalo(HALO_COLOR, EARTH.radius, 0.42);
  halo.sprite.name = 'earth-halo';
  root.add(halo.sprite);

  // Sits just above the planet's own "pole", which lands on the horizon line in
  // the act 1 framing. Deliberately a child of root, not of the spinning surface.
  const limbAnchor = new THREE.Object3D();
  limbAnchor.position.set(0, EARTH.radius * 1.05, 0);
  root.add(limbAnchor);

  const toViewer = new THREE.Vector3();

  return {
    root,
    limbAnchor,

    setShellLevel(level: number): void {
      limb.visible = level >= 1;
      halo.sprite.visible = level >= 2;
    },

    setViewerPosition(viewer: THREE.Vector3): void {
      if (!halo.sprite.visible) return;
      // Halo brightens as more of the lit hemisphere turns toward us.
      toViewer.subVectors(root.position, viewer);
      const facing = Math.abs(toViewer.normalize().dot(SUN_DIRECTION));
      halo.setOpacity(0.16 + facing * 0.52);
    },

    update(dt: number, elapsed: number): void {
      material.uniforms.uTime.value = elapsed;
      surface.rotation.y += EARTH.spin * dt;
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

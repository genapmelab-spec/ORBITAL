/**
 * halo.ts — procedural atmospheric halo.
 *
 * A billboard with a radial gradient, sized so the planet's silhouette sits at
 * the gradient's brightest ring. Cheaper and better looking than trying to get
 * a soft outward falloff out of a fresnel shell, and it costs one draw call
 * and zero downloaded bytes (the texture is drawn at runtime).
 */

import * as THREE from 'three';

export const HALO_TEXTURE_SIZE = 128;
/** where the planet's limb sits inside the sprite, 0..1 of its radius */
export const HALO_LIMB_RATIO = 0.82;

let shared: THREE.CanvasTexture | null = null;

export function getHaloTexture(): THREE.CanvasTexture {
  if (shared) return shared;

  const canvas = document.createElement('canvas');
  canvas.width = HALO_TEXTURE_SIZE;
  canvas.height = HALO_TEXTURE_SIZE;

  const ctx = canvas.getContext('2d');
  if (ctx) {
    const center = HALO_TEXTURE_SIZE / 2;
    const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);
    gradient.addColorStop(0, 'rgba(255,255,255,0)');
    gradient.addColorStop(0.45, 'rgba(255,255,255,0.06)');
    gradient.addColorStop(0.68, 'rgba(255,255,255,0.18)');
    gradient.addColorStop(HALO_LIMB_RATIO, 'rgba(255,255,255,0.5)');
    gradient.addColorStop(0.9, 'rgba(255,255,255,0.2)');
    gradient.addColorStop(0.97, 'rgba(255,255,255,0.04)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, HALO_TEXTURE_SIZE, HALO_TEXTURE_SIZE);
  }

  shared = new THREE.CanvasTexture(canvas);
  shared.colorSpace = THREE.SRGBColorSpace;
  shared.needsUpdate = true;
  return shared;
}

export function disposeHaloTexture(): void {
  shared?.dispose();
  shared = null;
}

export interface Halo {
  readonly sprite: THREE.Sprite;
  setOpacity(value: number): void;
  dispose(): void;
}

/** Sprite sized so `planetRadius` matches the gradient's limb ring. */
export function createHalo(
  color: number,
  planetRadius: number,
  baseOpacity: number,
): Halo {
  const material = new THREE.SpriteMaterial({
    map: getHaloTexture(),
    color,
    transparent: true,
    opacity: baseOpacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: true,
    // Keep the halo behind the planet's own pixels.
    toneMapped: false,
  });

  const sprite = new THREE.Sprite(material);
  const size = (planetRadius / HALO_LIMB_RATIO) * 2;
  sprite.scale.set(size, size, 1);
  sprite.renderOrder = -1;

  return {
    sprite,
    setOpacity(value: number): void {
      material.opacity = Math.max(0, Math.min(1, value));
    },
    dispose(): void {
      material.dispose();
    },
  };
}

/**
 * planet.ts — the contract Earth and Mars share.
 * Shell levels are what the quality governor turns down: losing the halo costs
 * one draw call and no narrative.
 */

import type * as THREE from 'three';
import type { SceneObject } from '../types';

export interface PlanetObject extends SceneObject {
  /** 0 = surface only, 1 = + limb shell, 2 = + halo (full) */
  setShellLevel(level: number): void;
  /** the scene reports the camera position so the halo can react to the light */
  setViewerPosition(viewer: THREE.Vector3): void;
}

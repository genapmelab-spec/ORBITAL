import type * as THREE from 'three';

/**
 * Every scene object implements exactly this. If it cannot be disposed it does
 * not belong in the scene (docs/AGENTS.md).
 */
export interface SceneObject {
  readonly root: THREE.Object3D;
  /** dt = seconds since last frame, elapsed = seconds since scene start */
  update(dt: number, elapsed: number): void;
  dispose(): void;
}

export function disposeMaterial(material: THREE.Material | THREE.Material[]): void {
  if (Array.isArray(material)) {
    material.forEach((entry) => entry.dispose());
    return;
  }
  material.dispose();
}

export function disposeMesh(mesh: THREE.Mesh | THREE.Points | THREE.LineSegments | THREE.Sprite): void {
  mesh.geometry.dispose();
  disposeMaterial(mesh.material as THREE.Material | THREE.Material[]);
}

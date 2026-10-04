import * as THREE from 'three'

/**
 * One time, one camera position, one travel intensity, shared by every material
 * in the scene. Uniform objects are shared by reference, so a single write in the
 * frame loop reaches every shader — no per-material bookkeeping.
 */
export const shared = {
  uTime: { value: 0 },
  uCamera: { value: new THREE.Vector3() },
  /** 0 = holding a rung, 1 = mid-flight. Drives the thread and the motes. */
  uTravel: { value: 0 },
}

export const FRAME = { near: 0.5, far: 7000, fov: 43 }

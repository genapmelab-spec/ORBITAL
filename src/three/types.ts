import type { Object3D, PerspectiveCamera } from 'three';

/**
 * What every scene object receives once per frame. Deliberately small: an
 * object may read the clock, the camera, the damped journey parameter and the
 * travel speed, and may not reach for anything else.
 */
export interface FrameContext {
  readonly dt: number;
  readonly elapsed: number;
  /** Damped camera parameter, 0 … LAST_PARAM. */
  readonly param: number;
  /** Scene units per second the camera is travelling — drives the stretch. */
  readonly speed: number;
  readonly camera: PerspectiveCamera;
  readonly pixelRatio: number;
}

/** Every object in `src/three/objects` implements this, no exceptions. */
export interface SceneObject {
  readonly root: Object3D;
  update(ctx: FrameContext): void;
  dispose(): void;
}

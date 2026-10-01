import type { Object3D, PerspectiveCamera } from 'three';

/** Device capability tier — resolved by the pre-paint probe in Base.astro. */
export type QualityTier = 'high' | 'medium' | 'low';

/** Everything a scene object may need on a frame. Passed by OrbitaScene. */
export interface FrameContext {
  /** Seconds since the scene started. */
  elapsed: number;
  /** Seconds since the previous frame, clamped to avoid tab-switch spikes. */
  dt: number;
  /** Journey parameter in stage units: 0 at stage 01, 13 at stage 14. */
  progress: number;
  /** Overall journey progress, 0..1 (drives the DOM progress rail too). */
  normalized: number;
  /** Smoothed camera speed in scene units per second — drives star stretch. */
  speed: number;
  camera: PerspectiveCamera;
  tier: QualityTier;
  reducedMotion: boolean;
}

/**
 * Every scene object implements the same three-step contract
 * (Orbital Docs/AGENTS.md): create, update(dt), dispose().
 */
export interface SceneObject {
  /** Scene-graph root. OrbitaScene adds it once and removes it on dispose. */
  readonly root: Object3D;
  update(ctx: FrameContext): void;
  dispose(): void;
}

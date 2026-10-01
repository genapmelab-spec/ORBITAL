import { Vector3 } from 'three';
import type { PerspectiveCamera } from 'three';
import { LAST_STAGE_PARAM, layoutStages, WORLD_UP } from './anchors';
import type { StageLayout, Vec3Tuple } from './anchors';

/**
 * Camera path — eased interpolation between the resolved stage frames.
 *
 * Interpolation is deliberately eased-linear rather than spline-based: the
 * journey moves from a 1.5-unit fly-by to a 440-unit dive, and a Catmull-Rom
 * spline through points that unevenly spaced overshoots — the camera would
 * swing wide of the Solar System between Saturn and the overview. Easing every
 * segment to zero velocity at both ends removes overshoot by construction and
 * gives the intended rhythm: arrive, settle, depart.
 */

/** Local segment easing: zero velocity at every stage key (cinematic settle). */
function easeSegment(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export class CameraPath {
  #keys: StageLayout[] = [];
  #positions: Vector3[] = [];
  #targets: Vector3[] = [];
  #fovs: number[] = [];
  #rolls: number[] = [];
  #aspect = 1;
  #portrait = false;
  readonly #upReference = new Vector3(...WORLD_UP);
  #sampledPosition = new Vector3();
  #sampledTarget = new Vector3();

  constructor(aspect: number, portrait: boolean) {
    this.layout(aspect, portrait);
  }

  get stageCount(): number {
    return this.#keys.length;
  }

  /** Rebuilds the key list for a new viewport. Responsive = re-choreography. */
  layout(aspect: number, portrait: boolean): void {
    this.#aspect = aspect;
    this.#portrait = portrait;
    this.#keys = layoutStages(aspect, portrait);
    this.#positions = this.#keys.map((key) => key.position.clone());
    this.#targets = this.#keys.map((key) => key.target.clone());
    this.#fovs = this.#keys.map((key) => key.fov);
    this.#rolls = this.#keys.map((key) => key.roll);
  }

  /** Layout key for a stage index — used for deep-link framing. */
  keyAt(index: number): StageLayout {
    const safe = Math.min(Math.max(index, 0), this.#keys.length - 1);
    const key = this.#keys[safe];
    if (key === undefined) throw new Error('CameraPath has no layout keys');
    return key;
  }

  /**
   * Reduced motion collapses the flight: the camera rests on whole stage keys
   * and cuts between compositions instead of travelling between them.
   */
  resolveProgress(progress: number, reducedMotion: boolean): number {
    const clamped = Math.min(Math.max(progress, 0), LAST_STAGE_PARAM);
    return reducedMotion ? Math.round(clamped) : clamped;
  }

  /** Writes the interpolated camera transform for the given journey parameter. */
  apply(progress: number, camera: PerspectiveCamera): void {
    const count = this.#positions.length;
    if (count === 0) return;

    const clamped = Math.min(Math.max(progress, 0), LAST_STAGE_PARAM);
    const segment = Math.min(Math.floor(clamped), count - 2);
    const local = clamped - segment;
    const eased = easeSegment(local);

    const from = this.#positions[segment] as Vector3;
    const to = this.#positions[segment + 1] as Vector3;
    const targetFrom = this.#targets[segment] as Vector3;
    const targetTo = this.#targets[segment + 1] as Vector3;

    const position = this.#sampledPosition.copy(from).lerp(to, eased);
    const target = this.#sampledTarget.copy(targetFrom).lerp(targetTo, eased);

    const fovFrom = this.#fovs[segment] as number;
    const fovTo = this.#fovs[segment + 1] as number;
    const rollFrom = this.#rolls[segment] as number;
    const rollTo = this.#rolls[segment + 1] as number;

    camera.position.copy(position);
    camera.up.copy(this.#upReference);
    camera.lookAt(target);
    const fov = fovFrom + (fovTo - fovFrom) * eased;
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
    camera.rotateZ(rollFrom + (rollTo - rollFrom) * eased);
  }

  /** Position of a stage key — used by the scene to bias per-stage lighting. */
  positionOf(index: number): Vec3Tuple {
    const key = this.keyAt(index);
    return [key.position.x, key.position.y, key.position.z];
  }

  get aspect(): number {
    return this.#aspect;
  }

  get portrait(): boolean {
    return this.#portrait;
  }
}

/**
 * anchors.ts — DOM labels bound to real world-space subjects.
 *
 * This is the bridge that stops the 3D reading as wallpaper: the Mars porthole
 * ring and the holo labels are not absolutely-positioned decoration, they are
 * projections of actual objects in the scene. If the camera moves, they move.
 */

import * as THREE from 'three';

export interface AnchorRegistration {
  /** which act (0-based) may show this anchor */
  readonly act: number;
  readonly object: THREE.Object3D;
  readonly element: HTMLElement;
  /** centre the element on the projected point instead of anchoring top-left */
  readonly centered?: boolean;
  /** world radius; publishes --anchor-size so a ring can match the subject */
  readonly worldRadius?: number;
}

interface BoundAnchor extends AnchorRegistration {
  shown: boolean;
  size: number;
}

const worldPosition = new THREE.Vector3();
const projected = new THREE.Vector3();

export class AnchorBinder {
  private readonly anchors: BoundAnchor[] = [];
  private activeAct = 0;

  constructor(stage: HTMLElement) {
    stage.classList.add('is-ready');
  }

  register(registration: AnchorRegistration): void {
    this.anchors.push({ ...registration, shown: false, size: 0 });
  }

  setActiveAct(act: number): void {
    this.activeAct = act;
  }

  update(camera: THREE.PerspectiveCamera, width: number, height: number, fov: number): void {
    const halfHeight = Math.tan(THREE.MathUtils.degToRad(fov) / 2);
    const pixelsPerUnitAtOne = height / 2 / halfHeight;

    for (const anchor of this.anchors) {
      const allowed = anchor.act === this.activeAct;

      if (!allowed) {
        this.hide(anchor);
        continue;
      }

      anchor.object.getWorldPosition(worldPosition);
      const depth = Math.max(worldPosition.distanceTo(camera.position), 1);
      projected.copy(worldPosition).project(camera);

      const offscreen =
        projected.z > 1 ||
        projected.x < -1.25 ||
        projected.x > 1.25 ||
        projected.y < -1.25 ||
        projected.y > 1.25;

      if (offscreen) {
        this.hide(anchor);
        continue;
      }

      const x = (projected.x * 0.5 + 0.5) * width;
      const y = (-projected.y * 0.5 + 0.5) * height;

      if (anchor.worldRadius) {
        anchor.size = (anchor.worldRadius * pixelsPerUnitAtOne) / depth;
        anchor.element.style.setProperty('--anchor-size', `${anchor.size.toFixed(2)}px`);
      }

      const offsetX = anchor.centered ? x - anchor.size / 2 : x;
      const offsetY = anchor.centered ? y - anchor.size / 2 : y;
      anchor.element.style.transform = `translate3d(${offsetX.toFixed(2)}px, ${offsetY.toFixed(2)}px, 0)`;

      if (!anchor.shown) {
        anchor.element.classList.add('is-shown');
        anchor.shown = true;
      }
    }
  }

  hideAll(): void {
    for (const anchor of this.anchors) this.hide(anchor);
  }

  private hide(anchor: BoundAnchor): void {
    if (!anchor.shown) return;
    anchor.element.classList.remove('is-shown');
    anchor.shown = false;
  }
}

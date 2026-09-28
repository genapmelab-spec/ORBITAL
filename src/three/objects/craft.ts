/**
 * craft.ts — the hero spacecraft.
 * Procedural low-poly assembly of primitives (no downloaded model, no licence
 * question, ~2.5k triangles, 4 shared materials). It flies its own Catmull-Rom
 * path and banks into its own turns, so the camera can simply meet it in act 4
 * instead of teleporting a prop between sections.
 */

import * as THREE from 'three';
import { CRAFT, CRAFT_PATH } from '../world';
import type { SceneObject } from '../types';

const HULL_COLOR = 0x555e69;
const DARK_COLOR = 0x2e343c;
const QUARTZ_COLOR = 0x0a1c2b;
const EMBER_COLOR = 0xff6b35;

export interface CraftObject extends SceneObject {
  /** anchor for the in-scene holo label, in world space */
  readonly noseAnchor: THREE.Object3D;
  /** anchor the exhaust plume is parented to */
  readonly engineAnchor: THREE.Object3D;
  /** normalised flight progress, same domain as the camera path */
  setProgress(progress: number): void;
  setPointer(x: number, y: number): void;
  setTiltEnabled(enabled: boolean): void;
}

export function createCraft(): CraftObject {
  const root = new THREE.Group();
  root.name = 'craft';

  // Banking is applied to this inner group so the path orientation and the roll
  // never fight each other.
  const body = new THREE.Group();
  body.name = 'craft-body';
  root.add(body);

  // Metalness stays moderate on purpose: a high-metalness hull with no strong
  // environment reads as a black silhouette. The scene supplies a procedural
  // env map (see OrbitaScene.createEnvironment) and this is tuned against it.
  const hullMaterial = new THREE.MeshStandardMaterial({
    color: HULL_COLOR,
    metalness: 0.58,
    roughness: 0.44,
    envMapIntensity: 2,
  });
  const darkMaterial = new THREE.MeshStandardMaterial({
    color: DARK_COLOR,
    metalness: 0.48,
    roughness: 0.62,
    envMapIntensity: 1.6,
  });
  const quartzMaterial = new THREE.MeshStandardMaterial({
    color: QUARTZ_COLOR,
    metalness: 0.35,
    roughness: 0.08,
    transparent: true,
    opacity: 0.62,
    emissive: new THREE.Color(0x0d2b3d),
  });
  const emberMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a0a04,
    emissive: new THREE.Color(EMBER_COLOR),
  });

  const geometries: THREE.BufferGeometry[] = [];
  const track = <T extends THREE.BufferGeometry>(geometry: T): T => {
    geometries.push(geometry);
    return geometry;
  };

  // ---- fuselage ------------------------------------------------------------
  const fuselage = track(new THREE.CylinderGeometry(1.05, 0.62, 6.2, 18, 1, false));
  fuselage.rotateX(Math.PI / 2);
  const fuselageMesh = new THREE.Mesh(fuselage, hullMaterial);
  fuselageMesh.position.set(0, 0, 0.4);
  body.add(fuselageMesh);

  const nose = track(new THREE.ConeGeometry(0.62, 2.0, 18));
  nose.rotateX(Math.PI / 2);
  const noseMesh = new THREE.Mesh(nose, hullMaterial);
  noseMesh.position.set(0, 0, 4.5);
  body.add(noseMesh);

  // ---- dorsal spine and pylons --------------------------------------------
  const spine = track(new THREE.BoxGeometry(1.05, 0.42, 3.6));
  const spineMesh = new THREE.Mesh(spine, hullMaterial);
  spineMesh.position.set(0, 0.86, 1.0);
  body.add(spineMesh);

  for (const side of [-1, 1]) {
    const pylon = track(new THREE.BoxGeometry(0.3, 0.3, 3.6));
    const pylonMesh = new THREE.Mesh(pylon, darkMaterial);
    pylonMesh.position.set(side * 1.15, -0.05, 0.9);
    body.add(pylonMesh);
  }

  // ---- engine block and nozzles -------------------------------------------
  const block = track(new THREE.CylinderGeometry(1.0, 0.92, 1.6, 18));
  block.rotateX(Math.PI / 2);
  const blockMesh = new THREE.Mesh(block, darkMaterial);
  blockMesh.position.set(0, 0, -3.4);
  body.add(blockMesh);

  for (const x of [-0.48, 0.48]) {
    for (const y of [-0.48, 0.48]) {
      const nozzle = track(new THREE.CylinderGeometry(0.34, 0.4, 0.9, 12));
      nozzle.rotateX(Math.PI / 2);
      const nozzleMesh = new THREE.Mesh(nozzle, darkMaterial);
      nozzleMesh.position.set(x, y, -4.45);
      body.add(nozzleMesh);
    }
  }

  // ---- radiator fins -------------------------------------------------------
  for (const side of [-1, 1]) {
    const fin = track(new THREE.BoxGeometry(2.6, 0.08, 1.5));
    const finMesh = new THREE.Mesh(fin, darkMaterial);
    finMesh.position.set(side * 1.9, 0.15, 1.9);
    finMesh.rotation.z = side * -0.21;
    body.add(finMesh);
  }

  // ---- quartz panoramic domes ---------------------------------------------
  for (const z of [-0.7, 0.5, 1.7]) {
    const dome = track(new THREE.SphereGeometry(0.42, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2));
    const domeMesh = new THREE.Mesh(dome, quartzMaterial);
    domeMesh.position.set(0, 0.7, z);
    body.add(domeMesh);
  }

  // ---- ember running lights (the only warm accent on the hull) ------------
  for (const side of [-1, 1]) {
    const strip = track(new THREE.BoxGeometry(0.06, 0.06, 2.6));
    const stripMesh = new THREE.Mesh(strip, emberMaterial);
    stripMesh.position.set(side * 0.62, 0.5, 0.6);
    body.add(stripMesh);
  }
  const beacon = track(new THREE.SphereGeometry(0.1, 8, 6));
  const beaconMesh = new THREE.Mesh(beacon, emberMaterial);
  beaconMesh.position.set(0, 0.34, 3.6);
  body.add(beaconMesh);

  // ---- anchors -------------------------------------------------------------
  // Deliberately on the lower port flank rather than at the bow: the bow points
  // into the right half of the frame, where the act-4 headline lives.
  const noseAnchor = new THREE.Object3D();
  noseAnchor.position.set(-1.5, -1.9, -1.2);
  body.add(noseAnchor);

  const engineAnchor = new THREE.Object3D();
  engineAnchor.position.set(0, 0, -4.6);
  body.add(engineAnchor);

  // ---- flight --------------------------------------------------------------
  const path = new THREE.CatmullRomCurve3(
    CRAFT_PATH.map((point) => point.clone()),
    false,
    'catmullrom',
    0.5,
  );

  const position = new THREE.Vector3();
  const tangent = new THREE.Vector3();
  const aheadTangent = new THREE.Vector3();
  const rightAxis = new THREE.Vector3();
  const upAxis = new THREE.Vector3();

  let progress = 0;
  let roll = 0;
  let tiltEnabled = true;
  let pointerX = 0;
  let pointerY = 0;
  let tiltX = 0;
  let tiltY = 0;

  const applyProgress = (p: number): void => {
    const t = Math.max(0, Math.min(1, p));
    path.getPoint(t, position);
    path.getTangent(t, tangent).normalize();

    root.position.copy(position);
    root.lookAt(position.x + tangent.x, position.y + tangent.y, position.z + tangent.z);

    // Bank into the turn: compare the tangent just ahead with the current one.
    const ahead = Math.min(1, t + 0.02);
    path.getTangent(ahead, aheadTangent).normalize();
    rightAxis.crossVectors(tangent, upAxis.set(0, 1, 0)).normalize();
    const lateral = aheadTangent.dot(rightAxis);
    const targetRoll = THREE.MathUtils.clamp(
      -lateral * CRAFT.bankBlend * 4,
      -CRAFT.maxBank,
      CRAFT.maxBank,
    );
    roll += (targetRoll - roll) * 0.08;
    body.rotation.z = roll;
  };

  applyProgress(0);

  return {
    root,
    noseAnchor,
    engineAnchor,

    setProgress(next: number): void {
      progress = next;
    },

    setPointer(x: number, y: number): void {
      pointerX = x;
      pointerY = y;
    },

    setTiltEnabled(enabled: boolean): void {
      tiltEnabled = enabled;
    },

    update(): void {
      applyProgress(progress);

      if (tiltEnabled) {
        // Pointer parallax: the ship answers the cursor, the camera does not.
        tiltX += (pointerX * 0.16 - tiltX) * 0.06;
        tiltY += (pointerY * 0.1 - tiltY) * 0.06;
      } else {
        tiltX += (0 - tiltX) * 0.06;
        tiltY += (0 - tiltY) * 0.06;
      }
      body.rotation.x = tiltY;
      body.rotation.y = tiltX;
    },

    dispose(): void {
      geometries.forEach((geometry) => geometry.dispose());
      geometries.length = 0;
      hullMaterial.dispose();
      darkMaterial.dispose();
      quartzMaterial.dispose();
      emberMaterial.dispose();
    },
  };
}

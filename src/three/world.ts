import { Color, Group } from 'three';
import type { Object3D } from 'three';
import {
  BODIES,
  RENDER_BODY_IDS,
  SUN_LIGHT_COLOR,
  bodyPosition,
  bodyRadius,
  sunDirectionFor,
} from './anchors';
import type { BodyId } from './anchors';
import { createBelts } from './objects/belt';
import type { BeltHandle } from './objects/belt';
import { createDust } from './objects/dust';
import type { DustHandle } from './objects/dust';
import { createOrbitLines } from './objects/orbitLines';
import { createPlanet, lightColorFor } from './objects/planet';
import type { PlanetHandle } from './objects/planet';
import { createStarfield } from './objects/starfield';
import type { StarfieldHandle } from './objects/starfield';
import { createSun } from './objects/sunBody';
import { QUALITY_PROFILES } from './quality';
import type { QualityProfile } from './quality';
import type { FrameContext, SceneObject } from './types';

/**
 * World assembly. The scene graph is built once from the anchors table — every
 * body's position, radius, tilt and light are decided there, so the camera path
 * and the geometry can never disagree about where anything is.
 */

/** Sun emission ceiling: the finale needs headroom above every lit surface. */
export const SUN_INTENSITY = 1.15;
/** Buffers are allocated at the high-tier counts so a runtime upgrade can fill. */
const CAPACITY_PROFILE = QUALITY_PROFILES.high;

export interface WorldHandle {
  readonly root: Group;
  readonly bodies: ReadonlyMap<BodyId, Object3D>;
  /** Applies a tier to counts, shells and rings without rebuilding buffers. */
  applyProfile(profile: QualityProfile): void;
  update(ctx: FrameContext): void;
  dispose(): void;
}

export function createWorld(pixelRatio: number, bootProfile: QualityProfile): WorldHandle {
  const root = new Group();
  const bodies = new Map<BodyId, Object3D>();
  const objects: SceneObject[] = [];
  const planets: PlanetHandle[] = [];

  const sunColor = new Color(SUN_LIGHT_COLOR);

  const starfield: StarfieldHandle = createStarfield(CAPACITY_PROFILE.stars, pixelRatio);
  const dust: DustHandle = createDust(CAPACITY_PROFILE.dust, pixelRatio);
  objects.push(starfield, dust);
  root.add(starfield.root, dust.root);

  const sun = createSun({
    coreColor: BODIES.sun.baseColor,
    limbColor: BODIES.sun.accentColor,
    intensity: SUN_INTENSITY,
  });
  objects.push(sun);
  root.add(sun.root);
  bodies.set('sun', sun.root);

  for (const id of RENDER_BODY_IDS) {
    if (id === 'sun') continue;
    const spec = BODIES[id];
    const position = bodyPosition(id);
    const planet = createPlanet({
      spec,
      radius: bodyRadius(id),
      position,
      sunDirection: sunDirectionFor(position),
      lightColor: lightColorFor(spec.au, sunColor),
      profile: bootProfile,
    });
    objects.push(planet);
    planets.push(planet);
    root.add(planet.root);
    bodies.set(id, planet.root);
  }

  const belts: BeltHandle = createBelts(
    CAPACITY_PROFILE.asteroids,
    CAPACITY_PROFILE.kuiper,
    lightColorFor(2.7, sunColor),
    lightColorFor(40, sunColor),
  );
  objects.push(belts);
  root.add(belts.root);

  const orbitLines = createOrbitLines(bootProfile.orbitLines);
  objects.push(orbitLines);
  root.add(orbitLines.root);

  const applyProfile = (profile: QualityProfile): void => {
    starfield.setCount(profile.stars);
    dust.setCount(profile.dust);
    belts.setDensity(profile.asteroids / CAPACITY_PROFILE.asteroids);
    for (const planet of planets) planet.setAtmosphereVisible(profile.atmosphere);
  };

  applyProfile(bootProfile);

  return {
    root,
    bodies,

    applyProfile,

    update(ctx: FrameContext): void {
      for (const object of objects) object.update(ctx);
    },

    dispose(): void {
      for (const object of objects) object.dispose();
      objects.length = 0;
      planets.length = 0;
      bodies.clear();
      root.removeFromParent();
      root.clear();
    },
  };
}

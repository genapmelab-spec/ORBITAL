import { Color, Group, Vector3, type Object3D } from 'three';
import { BODIES, sunIntensityAt, type BodyId } from '../camera/anchors.ts';
import { auFromSceneRadius, bodyPositions, type BodyPositions } from '../systems/epoch.ts';
import { createBelt } from '../objects/belt.ts';
import { createDust } from '../objects/dust.ts';
import { createOrbitLines } from '../objects/orbits.ts';
import { createPlanet, type PlanetHandle } from '../objects/planet.ts';
import { createStarfield } from '../objects/starfield.ts';
import { createSun } from '../objects/sun.ts';
import { createWindowModule, type WindowModuleHandle } from '../objects/window.ts';
import { PALETTE } from '../systems/palette.ts';
import type { QualityProfile } from '../systems/quality.ts';
import type { FrameContext } from '../types.ts';

/**
 * Scene graph assembly.
 *
 * Bodies in flight order, environment around them, and the opening module — the
 * only thing parented to the camera rather than to the world. `setEpoch` is the
 * single entry point for time: it re-places every body, re-lights it for its
 * real distance and re-phases the belt.
 */

const PLANET_IDS: readonly BodyId[] = ['earth', 'moon', 'mars', 'jupiter'];

export interface WorldHandle {
  readonly root: Group;
  /** Camera-parented interior: the observation module. */
  readonly interior: Object3D;
  readonly positions: BodyPositions;
  setEpoch(date: Date): void;
  setProfile(profile: QualityProfile): void;
  /** Rebuild viewport-dependent geometry — the module's aperture. */
  setAspect(aspect: number): void;
  update(ctx: FrameContext): void;
  dispose(): void;
}

export function createWorld(profile: QualityProfile, pixelRatio: number): WorldHandle {
  const root = new Group();

  const starfield = createStarfield(profile.stars, pixelRatio);
  const dust = createDust(profile.dust, pixelRatio);
  const sun = createSun();
  const orbitLines = createOrbitLines(profile.orbitLines);

  const beltSun = new Vector3(0, 1, 0);
  const belt = createBelt(new Color(PALETTE.ink), beltSun);

  const planets: Record<string, PlanetHandle> = {};
  for (const id of PLANET_IDS) {
    planets[id] = createPlanet({ spec: BODIES[id], profile });
  }

  const windowModule: WindowModuleHandle = createWindowModule();

  root.add(starfield.root, dust.root, orbitLines.root, sun.root, belt.root);
  for (const id of PLANET_IDS) {
    root.add(planets[id]!.root);
  }
  orbitLines.setEnabled(profile.orbitLines);
  belt.setDensity(profile.asteroids / 1500);
  starfield.setCount(profile.stars);
  dust.setCount(profile.dust);

  let positions: BodyPositions = bodyPositions(new Date());
  const scratch = new Vector3();

  function applyEpoch(date: Date): void {
    positions = bodyPositions(date);

    for (const id of PLANET_IDS) {
      const planet = planets[id]!;
      const position = positions[id];
      const sceneRadius = Math.sqrt(position[0] ** 2 + position[1] ** 2 + position[2] ** 2);
      planet.setState(position, auFromSceneRadius(sceneRadius), date);
    }

    const beltPosition = positions.belt;
    scratch.set(beltPosition[0], beltPosition[1], beltPosition[2]);
    beltSun.copy(scratch).negate().normalize();

    belt.setEpoch(date);
    orbitLines.setEpoch(date);
  }

  applyEpoch(new Date());

  return {
    root,
    interior: windowModule.root,
    get positions(): BodyPositions {
      return positions;
    },
    setEpoch(date: Date): void {
      applyEpoch(date);
    },
    setAspect(aspect: number): void {
      windowModule.setAspect(aspect);
    },
    setProfile(next: QualityProfile): void {
      starfield.setCount(next.stars);
      dust.setCount(next.dust);
      belt.setDensity(next.asteroids / 1500);
      orbitLines.setEnabled(next.orbitLines);
      for (const id of PLANET_IDS) {
        planets[id]!.setAtmosphereVisible(next.atmosphere);
      }
    },
    update(ctx: FrameContext): void {
      starfield.update(ctx);
      dust.update(ctx);
      sun.update(ctx);
      belt.update(ctx);
      orbitLines.update(ctx);
      for (const id of PLANET_IDS) {
        planets[id]!.update(ctx);
      }
      windowModule.update(ctx);
    },
    dispose(): void {
      starfield.dispose();
      dust.dispose();
      sun.dispose();
      belt.dispose();
      orbitLines.dispose();
      for (const id of PLANET_IDS) {
        planets[id]!.dispose();
      }
      windowModule.dispose();
      root.clear();
      root.removeFromParent();
    },
  };
}

/** Exposed for the boot probe: the AU a body sits at, for light and copy. */
export function bodyAuAt(position: readonly [number, number, number]): number {
  return auFromSceneRadius(Math.sqrt(position[0] ** 2 + position[1] ** 2 + position[2] ** 2));
}

export { sunIntensityAt };

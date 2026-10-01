import {
  AdditiveBlending,
  Color,
  DoubleSide,
  FrontSide,
  Group,
  Mesh,
  RingGeometry,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
} from 'three';
import { sunIntensityAt } from '../anchors';
import type { BodyId, BodySpec } from '../anchors';
import type { QualityProfile } from '../quality';
import { ATMOSPHERE_FRAGMENT, ATMOSPHERE_VERTEX } from '../shaders/atmosphere';
import { RING_FRAGMENT, RING_VERTEX } from '../shaders/ring';
import { PLANET_FRAGMENT, PLANET_VERTEX } from '../shaders/surface';
import type { FrameContext, SceneObject } from '../types';

/**
 * A planet. One sphere, one shader, optional atmosphere shell and ring system.
 * Tilt lives on a parent group so the spin axis — and the ring plane — stay
 * correct, which is what makes Uranus read as "the one on its side".
 */

/** Surface detail per scene unit of radius: small bodies stop at a coarse mesh. */
export const SURFACE_SEGMENT_PER_RADIUS = 26;
export const SURFACE_SEGMENTS_MIN = 18;
export const SURFACE_SEGMENTS_MAX = 72;
/** Ring tessellation: high enough that the banding has no visible facets. */
export const RING_THETA_SEGMENTS = 180;

export interface PlanetOptions {
  readonly spec: BodySpec;
  readonly radius: number;
  readonly position: Vector3;
  readonly sunDirection: Vector3;
  /** Sun colour premultiplied by the compressed distance falloff. */
  readonly lightColor: Color;
  readonly profile: QualityProfile;
}

export interface PlanetHandle extends SceneObject {
  readonly id: BodyId;
  readonly radius: number;
  setAtmosphereVisible(visible: boolean): void;
}

function surfaceSegments(radius: number): number {
  return Math.min(
    Math.max(Math.round(radius * SURFACE_SEGMENT_PER_RADIUS), SURFACE_SEGMENTS_MIN),
    SURFACE_SEGMENTS_MAX,
  );
}

export function createPlanet(options: PlanetOptions): PlanetHandle {
  const { spec, radius, position, sunDirection, lightColor, profile } = options;

  const group = new Group();
  group.position.copy(position);

  const axis = new Group();
  axis.rotation.z = spec.tilt;
  group.add(axis);

  const segments = surfaceSegments(radius);
  const surfaceGeometry = new SphereGeometry(radius, segments, Math.round(segments / 2));
  const surfaceUniforms = {
    uTime: { value: 0 },
    uBaseColor: { value: new Color(spec.baseColor) },
    uAccentColor: { value: new Color(spec.accentColor) },
    uLightColor: { value: lightColor.clone() },
    uSunDirection: { value: sunDirection.clone() },
    uBandFrequency: { value: spec.bandFreq },
    uBandStrength: { value: spec.bandStrength },
    uNoiseScale: { value: 3.2 / Math.max(radius, 0.2) },
  };
  const surfaceMaterial = new ShaderMaterial({
    vertexShader: PLANET_VERTEX,
    fragmentShader: PLANET_FRAGMENT,
    uniforms: surfaceUniforms,
  });
  const surface = new Mesh(surfaceGeometry, surfaceMaterial);
  axis.add(surface);

  let atmosphereMesh: Mesh | null = null;
  let atmosphereMaterial: ShaderMaterial | null = null;
  if (spec.atmosphere !== null) {
    const { scale, intensity, power, tint } = spec.atmosphere;
    const atmosphereGeometry = new SphereGeometry(radius * scale, 48, 24);
    atmosphereMaterial = new ShaderMaterial({
      vertexShader: ATMOSPHERE_VERTEX,
      fragmentShader: ATMOSPHERE_FRAGMENT,
      uniforms: {
        uTint: { value: new Color(tint) },
        uSunDirection: { value: sunDirection.clone() },
        uPower: { value: power },
        uIntensity: { value: intensity },
      },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      side: FrontSide,
    });
    atmosphereMesh = new Mesh(atmosphereGeometry, atmosphereMaterial);
    atmosphereMesh.visible = profile.atmosphere;
    atmosphereMesh.renderOrder = 2;
    group.add(atmosphereMesh);
  }

  let ringMesh: Mesh | null = null;
  let ringMaterial: ShaderMaterial | null = null;
  if (spec.ring !== null && profile.rings) {
    const inner = radius * spec.ring.inner;
    const outer = radius * spec.ring.outer;
    const ringGeometry = new RingGeometry(inner, outer, RING_THETA_SEGMENTS, 1);
    ringMaterial = new ShaderMaterial({
      vertexShader: RING_VERTEX,
      fragmentShader: RING_FRAGMENT,
      uniforms: {
        uTint: { value: new Color(spec.ring.tint) },
        uLightColor: { value: lightColor.clone().multiplyScalar(0.9) },
        uSunDirection: { value: sunDirection.clone() },
        uPlanetCenter: { value: position.clone() },
        uPlanetRadius: { value: radius },
        uInnerRadius: { value: inner },
        uOuterRadius: { value: outer },
        uOpacity: { value: spec.ring.opacity },
      },
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
    });
    ringMesh = new Mesh(ringGeometry, ringMaterial);
    // RingGeometry is authored in XY: lay it into the body's equatorial plane.
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.renderOrder = 1;
    axis.add(ringMesh);
  }

  return {
    id: spec.id,
    radius,
    root: group,

    update(ctx: FrameContext): void {
      surfaceUniforms.uTime.value = ctx.elapsed;
      surface.rotation.y += spec.spin * ctx.dt;
      if (ringMesh !== null) ringMesh.rotation.z += spec.spin * ctx.dt * 0.15;
    },

    setAtmosphereVisible(visible: boolean): void {
      if (atmosphereMesh !== null) atmosphereMesh.visible = visible && profile.atmosphere;
    },

    dispose(): void {
      surfaceGeometry.dispose();
      surfaceMaterial.dispose();
      if (atmosphereMesh !== null) {
        atmosphereMesh.geometry.dispose();
        atmosphereMaterial?.dispose();
        atmosphereMesh.removeFromParent();
      }
      if (ringMesh !== null) {
        ringMesh.geometry.dispose();
        ringMaterial?.dispose();
        ringMesh.removeFromParent();
      }
      surface.removeFromParent();
      axis.removeFromParent();
      group.removeFromParent();
    },
  };
}

/** Distance falloff in one place: every body and its rings share this light. */
export function lightColorFor(au: number, sunColor: Color): Color {
  return sunColor.clone().multiplyScalar(sunIntensityAt(au));
}

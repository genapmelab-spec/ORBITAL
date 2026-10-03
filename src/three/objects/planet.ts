import {
  AdditiveBlending,
  Color,
  FrontSide,
  Group,
  Mesh,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
} from 'three';
import { sunIntensityAt, type BodySpec } from '../camera/anchors.ts';
import { SUN_COLOR } from '../camera/anchors.ts';
import { daysSinceJ2000 } from '../systems/epoch.ts';
import { ATMOSPHERE_FRAGMENT, ATMOSPHERE_VERTEX } from '../shaders/atmosphere.ts';
import { PLANET_FRAGMENT, PLANET_VERTEX } from '../shaders/surface.ts';
import type { QualityProfile } from '../systems/quality.ts';
import type { FrameContext, SceneObject } from '../types.ts';

/**
 * A planet: one sphere, one shader, an optional atmosphere shell. Tilt lives on
 * a parent group so the spin axis is correct; rotation and light both come from
 * the model's date, so nothing here is decorative.
 */

export const SURFACE_SEGMENT_PER_RADIUS = 26;
export const SURFACE_SEGMENTS_MIN = 18;
export const SURFACE_SEGMENTS_MAX = 72;
/** Spin continues between date changes, slowly, so a still world still lives. */
export const SPIN_DRIFT_PER_SECOND = 0.01;

export interface PlanetOptions {
  readonly spec: BodySpec;
  readonly profile: QualityProfile;
}

export interface PlanetHandle extends SceneObject {
  readonly spec: BodySpec;
  /** Re-place the body, re-light it for its real distance, and set its spin. */
  setState(position: readonly [number, number, number], au: number, date: Date): void;
  setAtmosphereVisible(visible: boolean): void;
}

function surfaceSegments(radius: number): number {
  return Math.min(
    Math.max(Math.round(radius * SURFACE_SEGMENT_PER_RADIUS), SURFACE_SEGMENTS_MIN),
    SURFACE_SEGMENTS_MAX,
  );
}

export function createPlanet(options: PlanetOptions): PlanetHandle {
  const { spec, profile } = options;
  const group = new Group();

  const axis = new Group();
  axis.rotation.z = spec.tilt;
  group.add(axis);

  const segments = surfaceSegments(spec.radius);
  const surfaceGeometry = new SphereGeometry(spec.radius, segments, Math.round(segments / 2));
  const surfaceUniforms = {
    uTime: { value: 0 },
    uBaseColor: { value: new Color(spec.baseColor) },
    uAccentColor: { value: new Color(spec.accentColor) },
    uLightColor: { value: new Color(SUN_COLOR) },
    uSunDirection: { value: new Vector3(0, 1, 0) },
    uBandFrequency: { value: spec.bandFrequency },
    uBandStrength: { value: spec.bandStrength },
    uNoiseScale: { value: 3.2 / Math.max(spec.radius, 0.2) },
    // Airless bodies keep a hard day/night line; worlds with air soften it.
    uTerminator: { value: spec.atmosphere === null ? 0.035 : 0.14 },
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
    const atmosphereGeometry = new SphereGeometry(spec.radius * scale, 48, 24);
    atmosphereMaterial = new ShaderMaterial({
      vertexShader: ATMOSPHERE_VERTEX,
      fragmentShader: ATMOSPHERE_FRAGMENT,
      uniforms: {
        uTint: { value: new Color(tint) },
        uSunDirection: { value: new Vector3(0, 1, 0) },
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

  const sunDirection = new Vector3();
  const lightColor = new Color();
  let spinBase = 0;

  return {
    spec,
    root: group,

    update(ctx: FrameContext): void {
      surfaceUniforms.uTime.value = ctx.elapsed;
      surface.rotation.y = spinBase + ctx.elapsed * SPIN_DRIFT_PER_SECOND;
    },

    setState(position, au, date): void {
      group.position.set(position[0], position[1], position[2]);
      // The Sun sits at the scene origin, so the light direction is the body's
      // own bearing, reversed — and its strength is its real distance.
      sunDirection.set(-position[0], -position[1], -position[2]).normalize();
      lightColor.set(SUN_COLOR).multiplyScalar(sunIntensityAt(au));
      surfaceUniforms.uSunDirection.value.copy(sunDirection);
      surfaceUniforms.uLightColor.value.copy(lightColor);
      if (atmosphereMaterial !== null) {
        const uniform = atmosphereMaterial.uniforms.uSunDirection;
        if (uniform !== undefined) {
          uniform.value.copy(sunDirection);
        }
      }
      spinBase = spec.spinPerDay * daysSinceJ2000(date);
      surface.rotation.y = spinBase;
    },

    setAtmosphereVisible(visible: boolean): void {
      if (atmosphereMesh !== null) {
        atmosphereMesh.visible = visible && profile.atmosphere;
      }
    },

    dispose(): void {
      surfaceGeometry.dispose();
      surfaceMaterial.dispose();
      if (atmosphereMesh !== null) {
        atmosphereMesh.geometry.dispose();
        atmosphereMaterial?.dispose();
        atmosphereMesh.removeFromParent();
      }
      surface.removeFromParent();
      axis.removeFromParent();
      group.removeFromParent();
    },
  };
}

import {
  AdditiveBlending,
  Color,
  DoubleSide,
  Group,
  Mesh,
  PlaneGeometry,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
} from 'three';
import { BODIES, SUN_VISUAL } from '../camera/anchors.ts';
import { CORONA_FRAGMENT, CORONA_VERTEX, SUN_FRAGMENT, SUN_VERTEX } from '../shaders/sun.ts';
import type { FrameContext, SceneObject } from '../types.ts';

/**
 * The Sun — the flight's climax, so it gets the most light the renderer can
 * produce: a granulated photosphere, a tight hot corona and a wide soft halo.
 * Both coronas billboard toward the camera and thin out on close approach, so
 * the arrival ends in the star's own light rather than in a flat white screen.
 */

export const SUN_RADIUS = BODIES.sun.radius;
export const SUN_SEGMENTS = 96;
export const SUN_SPIN_PER_SECOND = 0.004;
/** Camera distance (in Sun radii) where proximity starts thinning the halo. */
export const CORONA_PROXIMITY_NEAR = 6;
export const CORONA_PROXIMITY_FAR = 26;
/** View alignment (dot of forward and the direction to the Sun) gating the halo. */
export const CORONA_VIEW_INNER = 0.4;
export const CORONA_VIEW_OUTER = 0.94;

interface Corona {
  readonly mesh: Mesh;
  readonly material: ShaderMaterial;
  readonly uTime: { value: number };
  readonly uProximity: { value: number };
  readonly uViewFactor: { value: number };
}

function clamp01(value: number): number {
  return Math.min(Math.max(value, 0), 1);
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = clamp01((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function createCorona(scale: number, intensity: number): Corona {
  const uniforms = {
    uTime: { value: 0 },
    uCoreColor: { value: new Color(SUN_VISUAL.coreColor) },
    uLimbColor: { value: new Color(SUN_VISUAL.limbColor) },
    uIntensity: { value: intensity },
    uProximity: { value: 0 },
    uViewFactor: { value: 0 },
  };
  const geometry = new PlaneGeometry(SUN_RADIUS * scale, SUN_RADIUS * scale);
  const material = new ShaderMaterial({
    vertexShader: CORONA_VERTEX,
    fragmentShader: CORONA_FRAGMENT,
    uniforms,
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    blending: AdditiveBlending,
  });
  const mesh = new Mesh(geometry, material);
  mesh.renderOrder = 3;
  return { mesh, material, uTime: uniforms.uTime, uProximity: uniforms.uProximity, uViewFactor: uniforms.uViewFactor };
}

export function createSun(): SceneObject {
  const group = new Group();

  const photosphereGeometry = new SphereGeometry(SUN_RADIUS, SUN_SEGMENTS, SUN_SEGMENTS / 2);
  const photosphereUniforms = {
    uTime: { value: 0 },
    uCoreColor: { value: new Color(SUN_VISUAL.coreColor) },
    uLimbColor: { value: new Color(SUN_VISUAL.limbColor) },
    uIntensity: { value: SUN_VISUAL.intensity },
  };
  const photosphereMaterial = new ShaderMaterial({
    vertexShader: SUN_VERTEX,
    fragmentShader: SUN_FRAGMENT,
    uniforms: photosphereUniforms,
  });
  const photosphere = new Mesh(photosphereGeometry, photosphereMaterial);
  group.add(photosphere);

  const toSun = new Vector3();
  const forward = new Vector3();
  const coronas: Corona[] = [
    createCorona(SUN_VISUAL.coronaInnerScale, SUN_VISUAL.coronaInnerIntensity),
    createCorona(SUN_VISUAL.coronaOuterScale, SUN_VISUAL.coronaOuterIntensity),
  ];
  for (const corona of coronas) {
    group.add(corona.mesh);
  }

  return {
    root: group,
    update(ctx: FrameContext): void {
      photosphere.rotation.y += ctx.dt * SUN_SPIN_PER_SECOND;
      photosphereUniforms.uTime.value = ctx.elapsed;

      const distanceInRadii = ctx.camera.position.length() / SUN_RADIUS;
      const proximity =
        1 -
        clamp01(
          (distanceInRadii - CORONA_PROXIMITY_NEAR) / (CORONA_PROXIMITY_FAR - CORONA_PROXIMITY_NEAR),
        );

      toSun.copy(ctx.camera.position).negate().normalize();
      ctx.camera.getWorldDirection(forward);
      const viewFactor = smoothstep(
        CORONA_VIEW_INNER,
        CORONA_VIEW_OUTER,
        Math.max(toSun.dot(forward), 0),
      );

      for (const corona of coronas) {
        corona.mesh.quaternion.copy(ctx.camera.quaternion);
        corona.uTime.value = ctx.elapsed;
        corona.uProximity.value = proximity;
        corona.uViewFactor.value = viewFactor;
      }
    },
    dispose(): void {
      photosphereGeometry.dispose();
      photosphereMaterial.dispose();
      for (const corona of coronas) {
        corona.mesh.geometry.dispose();
        corona.material.dispose();
        corona.mesh.removeFromParent();
      }
      photosphere.removeFromParent();
      group.removeFromParent();
    },
  };
}

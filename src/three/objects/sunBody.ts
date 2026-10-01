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
import { SUN_RADIUS } from '../anchors';
import { CORONA_FRAGMENT, CORONA_VERTEX, SUN_FRAGMENT, SUN_VERTEX } from '../shaders/sun';
import type { FrameContext, SceneObject } from '../types';

/**
 * The Sun — the final destination, so it gets the most light the renderer can
 * produce: a granulated photosphere, a tight hot corona, and a wide soft halo.
 * Both coronas billboard toward the camera and thin out on close approach, so
 * the dive ends in the star's own light rather than in a flat white screen.
 */

export const SUN_SEGMENTS = 96;
/** Slow photosphere rotation, radians per second. */
export const SUN_SPIN = 0.004;
export const CORONA_INNER_SCALE = 5.5;
export const CORONA_OUTER_SCALE = 15;
export const CORONA_INNER_INTENSITY = 1.15;
export const CORONA_OUTER_INTENSITY = 0.45;
/** Camera distance (in Sun radii) where proximity starts thinning the halo. */
export const CORONA_PROXIMITY_NEAR = 6;
export const CORONA_PROXIMITY_FAR = 26;
/** View alignment (dot of forward and the direction to the Sun) gating the halo. */
export const CORONA_VIEW_INNER = 0.5;
export const CORONA_VIEW_OUTER = 0.98;

export interface SunOptions {
  readonly coreColor: string;
  readonly limbColor: string;
  readonly intensity: number;
}

interface Corona {
  readonly mesh: Mesh;
  readonly material: ShaderMaterial;
  readonly uTime: { value: number };
  readonly uProximity: { value: number };
  readonly uViewFactor: { value: number };
}

function createCorona(
  scale: number,
  intensity: number,
  coreColor: string,
  limbColor: string,
): Corona {
  const uniforms = {
    uTime: { value: 0 },
    uCoreColor: { value: new Color(coreColor) },
    uLimbColor: { value: new Color(limbColor) },
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
  return {
    mesh,
    material,
    uTime: uniforms.uTime,
    uProximity: uniforms.uProximity,
    uViewFactor: uniforms.uViewFactor,
  };
}

export function createSun(options: SunOptions): SceneObject {
  const group = new Group();

  const photosphereGeometry = new SphereGeometry(SUN_RADIUS, SUN_SEGMENTS, SUN_SEGMENTS / 2);
  const photosphereUniforms = {
    uTime: { value: 0 },
    uCoreColor: { value: new Color(options.coreColor) },
    uLimbColor: { value: new Color(options.limbColor) },
    uIntensity: { value: options.intensity },
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
    createCorona(CORONA_INNER_SCALE, CORONA_INNER_INTENSITY, options.coreColor, options.limbColor),
    createCorona(CORONA_OUTER_SCALE, CORONA_OUTER_INTENSITY, options.coreColor, options.limbColor),
  ];
  for (const corona of coronas) group.add(corona.mesh);

  return {
    root: group,

    update(ctx: FrameContext): void {
      photosphere.rotation.y += ctx.dt * SUN_SPIN;
      photosphereUniforms.uTime.value = ctx.elapsed;

      // Proximity is measured to the Sun itself: the halo must yield to the disc.
      const distanceInRadii = ctx.camera.position.length() / SUN_RADIUS;
      const proximity = 1 - clamp01(
        (distanceInRadii - CORONA_PROXIMITY_NEAR) / (CORONA_PROXIMITY_FAR - CORONA_PROXIMITY_NEAR),
      );

      // The Sun sits at the origin, so the direction to it needs no body lookup.
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

function clamp01(value: number): number {
  return Math.min(Math.max(value, 0), 1);
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = clamp01((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

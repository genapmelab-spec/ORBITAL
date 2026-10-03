import {
  BoxGeometry,
  CircleGeometry,
  Color,
  Group,
  Mesh,
  MeshBasicMaterial,
  Shape,
  ShapeGeometry,
  ShaderMaterial,
  Vector2,
  Vector3,
} from 'three';
import { windowExit } from '../camera/path.ts';
import { PALETTE } from '../systems/palette.ts';
import type { FrameContext, SceneObject } from '../types.ts';

/**
 * The window the page opens inside.
 *
 * A structural frame parented to the camera: hull around the edges of the view,
 * a rounded aperture in the middle, a sill with instrument lights, and a rim
 * that catches the Sun. It is the answer to "where am I?" — a place, not a
 * planet portrait — and it leaves by opening outward as the flight begins.
 *
 * Geometry is rebuilt per viewport aspect, so the aperture is always the same
 * fraction of the frame no matter how wide the window is.
 */

export const MODULE_DISTANCE = 1.1;
export const MODULE_FOV = 42;
/** Aperture as a fraction of the visible half-extent at MODULE_DISTANCE. */
export const APERTURE_WIDTH_FILL = 0.84;
export const APERTURE_HEIGHT_FILL = 0.86;
export const APERTURE_CORNER_RATIO = 0.24;
export const HULL_MARGIN = 0.35;
export const RIM_WIDTH = 0.028;
export const EDGE_BAND = 0.06;
export const EXIT_GROWTH = 2.1;
export const EXIT_DRIFT_Y = -0.24;
export const EXIT_PUSH = 0.55;
/** Past this camera parameter the module can no longer be on screen. */
export const WINDOW_HIDE_PARAM = 1.5;
export const MODULE_RENDER_ORDER = 6;

const HULL_VERTEX = /* glsl */ `
  varying vec2 vLocal;
  varying vec3 vWorld;

  void main() {
    vLocal = position.xy;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorld = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const HULL_FRAGMENT = /* glsl */ `
  uniform vec2 uAperture;
  uniform float uRadius;
  uniform float uEdgeBand;
  uniform vec3 uBase;
  uniform vec3 uEdge;
  uniform vec3 uLight;
  uniform vec3 uSun;
  uniform float uAlpha;

  varying vec2 vLocal;
  varying vec3 vWorld;

  float sdRoundBox(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + vec2(r);
    return min(max(q.x, q.y), 0.0) + length(max(q, vec2(0.0))) - r;
  }

  void main() {
    float d = sdRoundBox(vLocal, uAperture, uRadius);
    // Rim highlight: the one place the structure catches the star's light.
    float edge = smoothstep(uEdgeBand, 0.0, d);
    float seam = step(0.5, fract(vLocal.y * 2.0));

    vec3 toCamera = normalize(cameraPosition - vWorld);
    float lit = clamp(dot(toCamera, uSun), 0.0, 1.0);

    vec3 color = uBase * (0.24 + 0.76 * lit);
    color = mix(color, uEdge * (0.45 + 0.55 * lit), edge);
    color += uLight * edge * 0.3;
    color += uBase * seam * 0.4;

    gl_FragColor = vec4(color, uAlpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

function roundedRect(halfWidth: number, halfHeight: number, radius: number): Shape {
  const shape = new Shape();
  const r = Math.min(radius, Math.min(halfWidth, halfHeight));
  shape.moveTo(-halfWidth + r, -halfHeight);
  shape.lineTo(halfWidth - r, -halfHeight);
  shape.absarc(halfWidth - r, -halfHeight + r, r, -Math.PI / 2, 0, false);
  shape.lineTo(halfWidth, halfHeight - r);
  shape.absarc(halfWidth - r, halfHeight - r, r, 0, Math.PI / 2, false);
  shape.lineTo(-halfWidth + r, halfHeight);
  shape.absarc(-halfWidth + r, halfHeight - r, r, Math.PI / 2, Math.PI, false);
  shape.lineTo(-halfWidth, -halfHeight + r);
  shape.absarc(-halfWidth + r, -halfHeight + r, r, Math.PI, Math.PI * 1.5, false);
  return shape;
}

function clamp01(value: number): number {
  return Math.min(Math.max(value, 0), 1);
}

function smootherstep(t: number): number {
  const x = clamp01(t);
  return x * x * x * (x * (x * 6 - 15) + 10);
}

export interface WindowModuleHandle extends SceneObject {
  /** Rebuild the frame for a new viewport aspect. */
  setAspect(aspect: number): void;
}

export function createWindowModule(): WindowModuleHandle {
  const root = new Group();

  const uniforms = {
    uAperture: { value: new Vector2(0.5, 0.4) },
    uRadius: { value: 0.1 },
    uEdgeBand: { value: EDGE_BAND },
    uBase: { value: new Color(PALETTE.deep) },
    uEdge: { value: new Color('#2b3345') },
    uLight: { value: new Color(PALETTE.solar) },
    uSun: { value: new Vector3(0, 1, 0) },
    uAlpha: { value: 1 },
  };

  const hullMaterial = new ShaderMaterial({
    vertexShader: HULL_VERTEX,
    fragmentShader: HULL_FRAGMENT,
    uniforms,
    transparent: true,
  });

  const rimMaterial = new MeshBasicMaterial({
    color: new Color('#1c2230'),
    transparent: true,
    opacity: 1,
  });
  const sillMaterial = new MeshBasicMaterial({
    color: new Color('#12161f'),
    transparent: true,
    opacity: 1,
  });
  const lightMaterial = new MeshBasicMaterial({
    color: new Color(PALETTE.solar),
    transparent: true,
    opacity: 0.9,
  });

  const hull = new Mesh(new ShapeGeometry(), hullMaterial);
  const rim = new Mesh(new ShapeGeometry(), rimMaterial);
  const sill = new Mesh(new BoxGeometry(1, 1, 1), sillMaterial);
  const lights: Mesh[] = [0, 1, 2].map(() => new Mesh(new CircleGeometry(1, 16), lightMaterial));

  for (const mesh of [hull, rim, sill, ...lights]) {
    mesh.renderOrder = MODULE_RENDER_ORDER;
    root.add(mesh);
  }

  function setAspect(aspect: number): void {
    const halfHeight = MODULE_DISTANCE * Math.tan((MODULE_FOV * Math.PI) / 360);
    const halfWidth = halfHeight * aspect;
    const apertureWidth = halfWidth * APERTURE_WIDTH_FILL;
    const apertureHeight = halfHeight * APERTURE_HEIGHT_FILL;
    const corner = Math.min(apertureWidth, apertureHeight) * APERTURE_CORNER_RATIO;

    hull.geometry.dispose();
    rim.geometry.dispose();

    const hullShape = roundedRect(halfWidth + HULL_MARGIN, halfHeight + HULL_MARGIN, corner * 1.4);
    hullShape.holes.push(roundedRect(apertureWidth, apertureHeight, corner));
    hull.geometry = new ShapeGeometry(hullShape);

    const rimShape = roundedRect(apertureWidth + RIM_WIDTH, apertureHeight + RIM_WIDTH, corner);
    rimShape.holes.push(roundedRect(apertureWidth, apertureHeight, corner));
    rim.geometry = new ShapeGeometry(rimShape);
    rim.position.z = 0.035;

    uniforms.uAperture.value.set(apertureWidth, apertureHeight);
    uniforms.uRadius.value = corner;

    sill.geometry.dispose();
    sill.geometry = new BoxGeometry(apertureWidth * 1.55, apertureHeight * 0.16, 0.07);
    sill.position.set(0, -apertureHeight - apertureHeight * 0.05, 0.05);

    const lightRadius = Math.max(apertureHeight * 0.022, 0.006);
    lights.forEach((light, index) => {
      light.geometry.dispose();
      light.geometry = new CircleGeometry(lightRadius, 16);
      light.position.set(
        apertureWidth * 0.52 + index * lightRadius * 3.4,
        -apertureHeight - apertureHeight * 0.05,
        0.086,
      );
    });
  }

  setAspect(16 / 9);

  const sunProbe = new Vector3();

  return {
    root,
    setAspect,
    update(ctx: FrameContext): void {
      const exit = windowExit(ctx.param);
      const visible = ctx.param < WINDOW_HIDE_PARAM && exit < 0.995;
      root.visible = visible;
      if (!visible) {
        return;
      }

      const scale = 1 + EXIT_GROWTH * exit;
      root.scale.set(scale, scale, 1);
      root.position.set(0, EXIT_DRIFT_Y * exit, -MODULE_DISTANCE - EXIT_PUSH * exit);

      const alpha = 1 - smootherstep((exit - 0.7) / 0.295);
      uniforms.uAlpha.value = alpha;
      rimMaterial.opacity = alpha * 0.9;
      sillMaterial.opacity = alpha;
      lightMaterial.opacity = alpha * 0.9;

      // The Sun sits at the scene origin, so the light direction on the module
      // is simply the camera's own position, reversed.
      ctx.camera.getWorldPosition(sunProbe);
      uniforms.uSun.value.copy(sunProbe).negate().normalize();
    },
    dispose(): void {
      hull.geometry.dispose();
      rim.geometry.dispose();
      sill.geometry.dispose();
      for (const light of lights) {
        light.geometry.dispose();
      }
      hullMaterial.dispose();
      rimMaterial.dispose();
      sillMaterial.dispose();
      lightMaterial.dispose();
      root.clear();
      root.removeFromParent();
    },
  };
}

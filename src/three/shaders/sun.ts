import { GLSL_NOISE, GLSL_TONEMAP } from './common.ts';

/**
 * The Sun is the climax of the flight, so it gets the heaviest shaders in the
 * project: a boiling photosphere with limb brightening, and two additive corona
 * billboards whose outer glow thins as the camera dives in.
 */

export const SUN_VERTEX = /* glsl */ `
  varying vec3 vNormalWorld;
  varying vec3 vLocalPosition;
  varying vec3 vWorldPosition;

  void main() {
    vLocalPosition = position;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    vNormalWorld = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

export const SUN_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform vec3 uCoreColor;
  uniform vec3 uLimbColor;
  uniform float uIntensity;

  varying vec3 vNormalWorld;
  varying vec3 vLocalPosition;
  varying vec3 vWorldPosition;

  ${GLSL_NOISE}

  void main() {
    vec3 normal = normalize(vNormalWorld);
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);

    vec3 p = vLocalPosition * 1.9;
    float cells = fbm5(p + vec3(0.0, uTime * 0.05, uTime * 0.03));
    float granules = fbm2(p * 3.4 - vec3(uTime * 0.09));
    float hot = smoothstep(0.32, 0.86, cells * 0.72 + granules * 0.46);

    // Limb brightening: the chromosphere outshines the disc at the edge.
    float limb = pow(1.0 - clamp(dot(normal, viewDirection), 0.0, 1.0), 2.0);
    vec3 color = mix(uCoreColor, uLimbColor, hot);
    color += uLimbColor * limb * 1.35;
    color *= (1.55 + hot * 1.3) * uIntensity;

    gl_FragColor = vec4(color, 1.0);
    ${GLSL_TONEMAP}
  }
`;

export const CORONA_VERTEX = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
  }
`;

export const CORONA_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform vec3 uCoreColor;
  uniform vec3 uLimbColor;
  uniform float uIntensity;
  /** 0 far from the Sun, 1 at the closest approach — thins the outer halo. */
  uniform float uProximity;
  /**
   * How centred the Sun is in the view, 0..1. Without it a halo this wide
   * floods the frame with light while the camera is busy at a planet: the
   * corona must only exist for a camera that is actually looking at the Sun.
   */
  uniform float uViewFactor;

  varying vec2 vUv;

  ${GLSL_NOISE}

  void main() {
    float distanceFromCenter = length(vUv - 0.5) * 2.0;
    float falloff = pow(clamp(1.0 - distanceFromCenter, 0.0, 1.0), 3.0);
    float streamers = 0.72 + 0.28 * fbm2(vec3(vUv * 7.0, uTime * 0.05));
    float alpha = falloff * falloff * streamers * uIntensity
      * (1.0 - uProximity * 0.62)
      * uViewFactor;

    vec3 color = mix(uLimbColor, uCoreColor, falloff);
    gl_FragColor = vec4(color * (0.45 + falloff * 1.2), alpha);
    ${GLSL_TONEMAP}
  }
`;

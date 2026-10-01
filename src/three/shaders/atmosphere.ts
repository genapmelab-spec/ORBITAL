import { GLSL_TONEMAP } from './common';

/**
 * Atmosphere shell — a slightly larger sphere rendered additively. The rim
 * brightens toward the limb and is masked to the Sun-facing hemisphere, so the
 * glow behaves like scattered light rather than an outline sticker.
 */

export const ATMOSPHERE_VERTEX = /* glsl */ `
  varying vec3 vNormalWorld;
  varying vec3 vWorldPosition;

  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    vNormalWorld = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

export const ATMOSPHERE_FRAGMENT = /* glsl */ `
  uniform vec3 uTint;
  uniform vec3 uSunDirection;
  uniform float uPower;
  uniform float uIntensity;

  varying vec3 vNormalWorld;
  varying vec3 vWorldPosition;

  void main() {
    vec3 normal = normalize(vNormalWorld);
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float rim = pow(1.0 - abs(dot(normal, viewDirection)), uPower);
    float sunFacing = smoothstep(-0.55, 0.65, dot(normal, uSunDirection));
    float glow = rim * mix(0.22, 1.0, sunFacing);

    gl_FragColor = vec4(uTint * glow * uIntensity, 1.0);
    ${GLSL_TONEMAP}
  }
`;

import { GLSL_TONEMAP } from './common.ts';

/**
 * Belt rock. Thousands of them, one instanced draw, no per-rock state: the
 * lighting is the same analytic key light the planets use, so a rock passing
 * close to the camera is lit exactly like the world it came from.
 */

export const ROCK_VERTEX = /* glsl */ `
  varying vec3 vNormalWorld;
  varying vec3 vWorldPosition;

  void main() {
    vec4 worldPosition = modelMatrix * instanceMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    vNormalWorld = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

export const ROCK_FRAGMENT = /* glsl */ `
  uniform vec3 uBaseColor;
  uniform vec3 uAccentColor;
  uniform vec3 uLightColor;
  uniform vec3 uSunDirection;

  varying vec3 vNormalWorld;
  varying vec3 vWorldPosition;

  void main() {
    vec3 normal = normalize(vNormalWorld);
    float lambert = clamp(dot(normal, uSunDirection), 0.0, 1.0);
    vec3 albedo = mix(uBaseColor, uAccentColor, 0.35 + 0.65 * abs(normal.y));
    vec3 color = albedo * uLightColor * (0.03 + 0.97 * lambert);

    gl_FragColor = vec4(color, 1.0);
    ${GLSL_TONEMAP}
  }
`;

import { GLSL_NOISE, GLSL_TONEMAP } from './common';

/**
 * Belt rock. Instanced, so the instance matrix is applied by hand — three.js
 * injects `instanceMatrix` into the vertex prefix whenever USE_INSTANCING is
 * defined, which is exactly what an InstancedMesh needs and what a hand-written
 * shader must not forget.
 */

export const ROCK_VERTEX = /* glsl */ `
  varying vec3 vNormalWorld;
  varying vec3 vWorldPosition;

  void main() {
    vec4 localPosition = vec4(position, 1.0);
    vec3 localNormal = normal;
    #ifdef USE_INSTANCING
      localPosition = instanceMatrix * localPosition;
      localNormal = mat3(instanceMatrix) * localNormal;
    #endif

    vec4 worldPosition = modelMatrix * localPosition;
    vWorldPosition = worldPosition.xyz;
    vNormalWorld = normalize(mat3(modelMatrix) * localNormal);
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

export const ROCK_FRAGMENT = /* glsl */ `
  uniform vec3 uBaseColor;
  uniform vec3 uAccentColor;
  uniform vec3 uLightColor;

  varying vec3 vNormalWorld;
  varying vec3 vWorldPosition;

  ${GLSL_NOISE}

  void main() {
    vec3 normal = normalize(vNormalWorld);
    // The belts ring the Sun at the origin, so the light direction is exact
    // from the world position: no uniform can express it across a whole ring.
    vec3 sunDirection = normalize(-vWorldPosition);
    float daylight = smoothstep(-0.2, 0.5, dot(normal, sunDirection));
    float grain = fbm2(vWorldPosition * 0.7);
    vec3 albedo = mix(uBaseColor, uAccentColor, grain);
    vec3 color = albedo * uLightColor * (0.06 + 0.94 * daylight);

    gl_FragColor = vec4(color, 1.0);
    ${GLSL_TONEMAP}
  }
`;

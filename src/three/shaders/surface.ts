import { GLSL_NOISE, GLSL_TONEMAP } from './common';

/**
 * Planet surface. Matte, single key light, procedural bands and grain — no
 * textures, no maps, one draw call per body. Lighting is analytic: the Sun's
 * direction and colour arrive as uniforms, so no Three.js light objects are
 * needed and every body costs the same.
 */

export const PLANET_VERTEX = /* glsl */ `
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

export const PLANET_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform vec3 uBaseColor;
  uniform vec3 uAccentColor;
  uniform vec3 uLightColor;
  uniform vec3 uSunDirection;
  uniform float uBandFrequency;
  uniform float uBandStrength;
  uniform float uNoiseScale;

  varying vec3 vNormalWorld;
  varying vec3 vLocalPosition;
  varying vec3 vWorldPosition;

  ${GLSL_NOISE}

  void main() {
    vec3 normal = normalize(vNormalWorld);
    float lambert = dot(normal, uSunDirection);
    // Terminator: geological detail survives a little past the day/night line.
    float daylight = smoothstep(-0.14, 0.42, lambert);
    float diffuse = clamp(lambert, 0.0, 1.0);

    vec3 samplePosition = vLocalPosition * uNoiseScale;
    float flow = fbm5(samplePosition * vec3(1.0, 0.42, 1.0) + vec3(0.0, uTime * 0.01, 0.0));
    float grain = fbm2(samplePosition * 5.0);

    float latitude = vLocalPosition.y * uBandFrequency + flow * 4.0;
    float bands = sin(latitude) * 0.5 + 0.5;

    vec3 albedo = mix(
      uBaseColor,
      uAccentColor,
      clamp(bands * uBandStrength + (flow - 0.5) * 0.75, 0.0, 1.0)
    );
    albedo *= 0.86 + grain * 0.28;

    // Sun-side light plus the faintest ambient so night sides never go pure black.
    vec3 color = albedo * uLightColor * (0.045 + 0.955 * daylight);
    color += albedo * uLightColor * diffuse * 0.06;

    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float limb = pow(1.0 - clamp(dot(normal, viewDirection), 0.0, 1.0), 3.0);
    color += uLightColor * limb * 0.05 * daylight;

    gl_FragColor = vec4(color, 1.0);
    ${GLSL_TONEMAP}
  }
`;

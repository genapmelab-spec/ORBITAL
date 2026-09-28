/**
 * surface.glsl.ts — planet surfaces.
 *
 * Colour policy (documented so the grade stays consistent with the DOM):
 * palette numbers here are the SAME values as the CSS tokens, authored in sRGB
 * and lifted to linear with `srgb()` before any lighting math. The final
 * fragment is pushed back to sRGB with `toSrgb()` so DOM type and CGI read as
 * one visual system. The renderer therefore stays on NoToneMapping.
 */

import * as THREE from 'three';
import { GLSL_NOISE, GLSL_LIGHTING } from './common.glsl';

const COLOR_HELPERS = /* glsl */ `
vec3 srgb(vec3 c) { return pow(max(c, 0.0), vec3(2.2)); }
vec3 toSrgb(vec3 c) { return pow(clamp(c, 0.0, 1.0), vec3(1.0 / 2.2)); }
`;

const PLANET_VERTEX = /* glsl */ `
varying vec3 vNormalW;
varying vec3 vWorldPos;

void main() {
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPos = worldPos.xyz;
  vNormalW = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

const EARTH_FRAGMENT = /* glsl */ `
uniform float uTime;
uniform vec3 uSunDirection;
uniform float uCloudAmount;

varying vec3 vNormalW;
varying vec3 vWorldPos;

${GLSL_NOISE}
${GLSL_LIGHTING}
${COLOR_HELPERS}

void main() {
  vec3 n = normalize(vNormalW);
  vec3 v = normalize(cameraPosition - vWorldPos);
  vec3 l = normalize(uSunDirection);

  float lat = n.y;

  // Continents from domain-warped fbm — organic coastlines, no blobs.
  float landMask = warped(n * 1.25, 0.55, 5);
  float land = smoothstep(0.485, 0.545, landMask);

  float relief = warped(n * 5.0, 0.30, 4);
  float aridity = smoothstep(0.5, 0.68, warped(n * 3.2 + 7.0, 0.3, 3)) * smoothstep(0.15, 0.75, abs(lat));

  vec3 deepOcean = srgb(vec3(0.010, 0.033, 0.070));
  vec3 shelfOcean = srgb(vec3(0.040, 0.130, 0.220));
  vec3 ocean = mix(deepOcean, shelfOcean, smoothstep(0.28, 0.54, relief));

  vec3 vegetation = srgb(vec3(0.098, 0.196, 0.110));
  vec3 rock = srgb(vec3(0.300, 0.258, 0.196));
  vec3 sand = srgb(vec3(0.520, 0.404, 0.243));
  vec3 tundra = srgb(vec3(0.545, 0.580, 0.610));

  vec3 landColor = mix(vegetation, rock, smoothstep(0.44, 0.72, relief));
  landColor = mix(landColor, sand, aridity);
  landColor = mix(landColor, tundra, smoothstep(0.46, 0.74, abs(lat)));

  vec3 albedo = mix(ocean, landColor, land);

  float ice = smoothstep(0.80, 0.93, abs(lat) + relief * 0.07);
  albedo = mix(albedo, srgb(vec3(0.870, 0.915, 0.960)), ice);

  // Sharper falloff than the shared wrapped diffuse: Earth needs a genuinely
  // black night side so the hero headline has something to sit on.
  float diffuse = pow(clamp(dot(n, l) * 0.5 + 0.5, 0.0, 1.0), 2.4);
  vec3 color = albedo * diffuse * 1.16;

  // Sun glint on open water only.
  if (land < 0.02) {
    vec3 halfVec = normalize(l + v);
    float spec = pow(max(dot(n, halfVec), 0.0), 200.0);
    color += srgb(vec3(1.0, 0.96, 0.90)) * spec * 0.85;
  }

  // Cloud deck, drifting slowly.
  float cloud = fbm(n * 3.1 + vec3(uTime * 0.0055, 0.0, uTime * 0.0035), 5);
  cloud = smoothstep(0.52, 0.80, cloud) * uCloudAmount;
  color = mix(color, srgb(vec3(0.949, 0.961, 0.980)) * max(diffuse, 0.10), cloud * 0.78);

  // City lights on the night side — warm, sparse, never chromatic noise.
  float night = smoothstep(0.20, 0.02, diffuse);
  float lights = smoothstep(0.72, 0.97, fbm(n * 26.0, 3)) * land * (1.0 - ice) * night;
  color += srgb(vec3(1.0, 0.42, 0.208)) * lights * 0.7;

  // Cool atmospheric limb on the planet itself.
  float rim = rimLight(n, v, 3.4);
  color += srgb(vec3(0.490, 0.827, 0.988)) * rim * (0.22 + diffuse * 0.9) * 0.55;

  gl_FragColor = vec4(toSrgb(color), 1.0);
}
`;

const MARS_VERTEX = /* glsl */ `
uniform float uDisplacement;
uniform float uNoiseScale;
uniform float uDetailScale;
uniform float uRelief;
uniform float uTime;

varying vec3 vNormalW;
varying vec3 vWorldPos;
varying float vHeight;

${GLSL_NOISE}

// Height field in UNIT-DIRECTION space, so the terrain detail is scale
// invariant: uNoiseScale reads as "how many landforms per hemisphere".
// Octave counts are kept low on purpose: the full 5-octave cascade puts energy
// at ~0.4 world units, which the relief amplification turns into coral.
float terrain(vec3 dir) {
  float landforms = warped(dir * uNoiseScale, 0.42, 3) - 0.5;
  float detail = (fbm(dir * uDetailScale, 3) - 0.5) * 0.35;
  return landforms + detail;
}

void main() {
  vec3 dir = normalize(position);
  float height = terrain(dir);

  vec3 displaced = position + normal * height * uDisplacement;

  // Rebuild the normal from finite differences of the same height field. The
  // step must stay well under the feature size or the relief aliases.
  vec3 tangent = normalize(cross(normal, vec3(0.0, 1.0, 0.0)) + vec3(1e-4));
  vec3 bitangent = normalize(cross(normal, tangent));
  float step = 0.01;
  float hT = terrain(normalize(dir + tangent * step));
  float hB = terrain(normalize(dir + bitangent * step));
  float hT2 = terrain(normalize(dir - tangent * step));
  float hB2 = terrain(normalize(dir - bitangent * step));

  vec3 perturbed = normalize(
    normal
    + tangent * (hT2 - hT) * uRelief
    + bitangent * (hB2 - hB) * uRelief
  );

  vec4 worldPos = modelMatrix * vec4(displaced, 1.0);
  vWorldPos = worldPos.xyz;
  vNormalW = normalize(mat3(modelMatrix) * perturbed);
  vHeight = height;

  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

const MARS_FRAGMENT = /* glsl */ `
uniform float uTime;
uniform vec3 uSunDirection;

varying vec3 vNormalW;
varying vec3 vWorldPos;
varying float vHeight;

${GLSL_NOISE}
${GLSL_LIGHTING}
${COLOR_HELPERS}

void main() {
  vec3 n = normalize(vNormalW);
  vec3 v = normalize(cameraPosition - vWorldPos);
  vec3 l = normalize(uSunDirection);

  // Iron-oxide base with darker maria and bright wind-blown dust. The ranges
  // are deliberately wide: a flat disc reads as a lamp, not as a planet.
  float maria = smoothstep(0.36, 0.58, warped(n * 2.6 + 21.0, 0.35, 3));
  float dust = smoothstep(0.44, 0.78, fbm(n * 5.0, 3));

  vec3 rust = srgb(vec3(0.620, 0.310, 0.170));
  vec3 ochre = srgb(vec3(0.820, 0.520, 0.290));
  vec3 shadowRock = srgb(vec3(0.230, 0.130, 0.098));

  vec3 albedo = mix(rust, ochre, dust);
  albedo = mix(albedo, shadowRock, maria * 0.85);
  albedo *= 0.78 + vHeight * 0.55;

  // Residual polar caps, faint and noisy.
  float cap = smoothstep(0.90, 0.985, abs(n.y) + vHeight * 0.05);
  albedo = mix(albedo, srgb(vec3(0.878, 0.902, 0.925)), cap);

  float diffuse = keyDiffuse(n, l);
  vec3 color = albedo * diffuse * 1.05;

  // Dusty rim — the abrading haze on the limb only, never across the disc.
  float rim = rimLight(n, v, 3.6);
  color += srgb(vec3(1.0, 0.757, 0.369)) * rim * (0.30 + diffuse * 0.95) * 0.5;

  gl_FragColor = vec4(toSrgb(color), 1.0);
}
`;

export interface PlanetMaterials {
  earth: THREE.ShaderMaterial;
  mars: THREE.ShaderMaterial;
}

/** Earth surface material. One key light, one atmosphere, no spotlights. */
export function createEarthMaterial(sunDirection: THREE.Vector3): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: PLANET_VERTEX,
    fragmentShader: EARTH_FRAGMENT,
    uniforms: {
      uTime: { value: 0 },
      uSunDirection: { value: sunDirection.clone() },
      uCloudAmount: { value: 0.9 },
    },
  });
}

/** Mars surface material. Displacement amplitude is in world units. */
export function createMarsMaterial(
  sunDirection: THREE.Vector3,
  options: {
    displacement?: number;
    noiseScale?: number;
    detailScale?: number;
    relief?: number;
  } = {},
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: MARS_VERTEX,
    fragmentShader: MARS_FRAGMENT,
    uniforms: {
      uTime: { value: 0 },
      uSunDirection: { value: sunDirection.clone() },
      uDisplacement: { value: options.displacement ?? 1.15 },
      uNoiseScale: { value: options.noiseScale ?? 3.2 },
      uDetailScale: { value: options.detailScale ?? 11.0 },
      uRelief: { value: options.relief ?? 10.0 },
    },
  });
}

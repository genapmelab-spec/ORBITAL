/**
 * Shared GLSL. Every surface in this project is procedural: no textures, no
 * image bytes, nothing to license (docs/AGENTS.md).
 */

export const GLSL_TONEMAP = /* glsl */ `
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
`;

/** 3D value noise plus two fbm variants. Integer literals keep GLSL ES 1.0 happy. */
export const GLSL_NOISE = /* glsl */ `
float hash31(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float vnoise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(
      mix(hash31(i + vec3(0.0, 0.0, 0.0)), hash31(i + vec3(1.0, 0.0, 0.0)), f.x),
      mix(hash31(i + vec3(0.0, 1.0, 0.0)), hash31(i + vec3(1.0, 1.0, 0.0)), f.x),
      f.y),
    mix(
      mix(hash31(i + vec3(0.0, 0.0, 1.0)), hash31(i + vec3(1.0, 0.0, 1.0)), f.x),
      mix(hash31(i + vec3(0.0, 1.0, 1.0)), hash31(i + vec3(1.0, 1.0, 1.0)), f.x),
      f.y),
    f.z);
}

float fbm5(vec3 p) {
  float amplitude = 0.5;
  float sum = 0.0;
  for (int i = 0; i < 5; i++) {
    sum += amplitude * vnoise(p);
    p *= 2.03;
    amplitude *= 0.5;
  }
  return sum;
}

float fbm2(vec3 p) {
  return 0.667 * vnoise(p) + 0.333 * vnoise(p * 2.03);
}
`;

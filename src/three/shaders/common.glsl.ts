/**
 * common.glsl.ts — shared GLSL chunks.
 * Value noise + fbm. Kept deliberately cheap: these run per-vertex on Mars and
 * per-fragment on Earth, so no loop unrolling beyond the octave cap.
 */

export const GLSL_NOISE = /* glsl */ `
// Hash without sine (IQ) — the axis-aligned lattice structure of the naive
// fract-product hash was reading as visible squares on the ocean at this scale.
float hash31(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.zyx + 31.32);
  return fract((p.x + p.y) * p.z);
}

float noise3(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  // quintic fade: continuous second derivative, so no lattice creasing
  f = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  return mix(
    mix(mix(hash31(i + vec3(0.0, 0.0, 0.0)), hash31(i + vec3(1.0, 0.0, 0.0)), f.x),
        mix(hash31(i + vec3(0.0, 1.0, 0.0)), hash31(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
    mix(mix(hash31(i + vec3(0.0, 0.0, 1.0)), hash31(i + vec3(1.0, 0.0, 1.0)), f.x),
        mix(hash31(i + vec3(0.0, 1.0, 1.0)), hash31(i + vec3(1.0, 1.0, 1.0)), f.x), f.y),
    f.z);
}

float fbm(vec3 p, int octaves) {
  float amp = 0.5;
  float sum = 0.0;
  for (int i = 0; i < 6; i++) {
    if (i >= octaves) break;
    sum += amp * noise3(p);
    p *= 2.03;
    amp *= 0.5;
  }
  return sum;
}

// Domain-warped fbm — organic continent / maria shapes instead of blobs.
float warped(vec3 p, float warpAmount, int octaves) {
  vec3 q = p + vec3(fbm(p * 1.7 + 11.3, 3)) * warpAmount;
  return fbm(q, octaves);
}
`;

export const GLSL_LIGHTING = /* glsl */ `
// Single key light. Wrapped diffuse keeps the night side readable (never pure
// black) which is what stops CGI planets looking like clay balls.
float keyDiffuse(vec3 n, vec3 l) {
  return pow(clamp(dot(n, l) * 0.5 + 0.5, 0.0, 1.0), 1.35);
}

float rimLight(vec3 n, vec3 viewDir, float power) {
  return pow(1.0 - clamp(dot(n, viewDir), 0.0, 1.0), power);
}
`;

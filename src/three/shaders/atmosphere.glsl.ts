/**
 * atmosphere.glsl.ts — limb glow shells.
 * Rendered on a slightly larger sphere so the glow reads as an atmosphere
 * halo around the silhouette rather than a texture on the surface.
 */

export const ATMOSPHERE_VERTEX = /* glsl */ `
varying vec3 vNormalW;
varying vec3 vViewDirW;

void main() {
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vNormalW = normalize(mat3(modelMatrix) * normal);
  vViewDirW = normalize(cameraPosition - worldPos.xyz);
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

export const ATMOSPHERE_FRAGMENT = /* glsl */ `
uniform vec3 uColor;
uniform vec3 uInnerColor;
uniform vec3 uSunDirection;
uniform float uIntensity;
uniform float uPower;
uniform float uInnerFactor;

varying vec3 vNormalW;
varying vec3 vViewDirW;

void main() {
  vec3 n = normalize(vNormalW);
  vec3 v = normalize(vViewDirW);

  // For a back-facing shell the rim is where surface and view are perpendicular.
  float limb = pow(clamp(1.0 - abs(dot(n, v)), 0.0, 1.0), uPower);

  float lit = clamp(dot(n, normalize(uSunDirection)) * 0.5 + 0.5, 0.0, 1.0);
  lit = pow(lit, 1.6);

  vec3 tint = mix(uInnerColor, uColor, limb);
  float alpha = limb * lit * uIntensity;

  gl_FragColor = vec4(tint * alpha * uInnerFactor, alpha);
}
`;

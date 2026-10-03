import { GLSL_TONEMAP } from './common.ts';

/**
 * Points shaders. Stars carry their own size, twinkle phase and temperature;
 * dust is a camera-relative field that wraps around the viewer, so the sense of
 * travel comes from real parallax rather than from moving the particles.
 */

export const STAR_VERTEX = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  attribute float aTemperature;

  uniform float uTime;
  uniform float uPixelRatio;
  /** Travel-velocity stretch: stars lean toward the viewer on fast moves. */
  uniform float uStretch;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float twinkle = 0.74 + 0.26 * sin(uTime * 1.6 + aPhase * 6.2831853);
    vec3 cool = vec3(0.62, 0.74, 1.0);
    vec3 warm = vec3(1.0, 0.84, 0.64);
    vColor = mix(cool, warm, aTemperature);
    vAlpha = twinkle;

    vec3 transformed = position * (1.0 - uStretch * 0.035);
    vec4 viewPosition = modelViewMatrix * vec4(transformed, 1.0);
    gl_PointSize = max(aSize * uPixelRatio * (1.0 + uStretch * 0.7), 1.0);
    gl_Position = projectionMatrix * viewPosition;
  }
`;

export const STAR_FRAGMENT = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec2 offset = gl_PointCoord - vec2(0.5);
    float mask = 1.0 - smoothstep(0.08, 0.5, length(offset));
    if (mask <= 0.002) discard;
    gl_FragColor = vec4(vColor * mask * vAlpha, 1.0);
    ${GLSL_TONEMAP}
  }
`;

export const DUST_VERTEX = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;

  uniform float uTime;
  uniform float uPixelRatio;
  uniform vec3 uCamera;
  uniform vec3 uBox;
  uniform vec3 uHalfBox;
  uniform float uOpacity;
  uniform float uFade;

  varying float vAlpha;

  void main() {
    // Wrap the field around the viewer: world positions stay put, so dust
    // streams past the camera instead of travelling with it.
    vec3 relative = position - uCamera;
    relative = mod(relative + uHalfBox, uBox) - uHalfBox;
    vec3 world = uCamera + relative;

    float fade = 1.0 - smoothstep(uFade * 0.3, uFade, length(relative));
    vAlpha = uOpacity * fade * (0.6 + 0.4 * sin(uTime * 2.1 + aPhase * 6.2831853));

    vec4 viewPosition = modelViewMatrix * vec4(world, 1.0);
    gl_PointSize = max(aSize * uPixelRatio * (24.0 / max(-viewPosition.z, 0.35)), 1.0);
    gl_Position = projectionMatrix * viewPosition;
  }
`;

export const DUST_FRAGMENT = /* glsl */ `
  varying float vAlpha;

  void main() {
    vec2 offset = gl_PointCoord - vec2(0.5);
    float mask = 1.0 - smoothstep(0.05, 0.5, length(offset));
    if (mask <= 0.002) discard;
    gl_FragColor = vec4(vec3(0.78, 0.85, 1.0) * mask * vAlpha, 1.0);
    ${GLSL_TONEMAP}
  }
`;

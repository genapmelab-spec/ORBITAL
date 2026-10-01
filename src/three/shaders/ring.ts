import { GLSL_NOISE } from './common';

/**
 * Ring system. Radial banding from noise, a Cassini-style division, and the
 * planet's own shadow cast across the rings — computed analytically from the
 * Sun direction, so it costs a few instructions and no shadow map.
 */

export const RING_VERTEX = /* glsl */ `
  varying vec2 vPlanePosition;
  varying vec3 vWorldPosition;

  void main() {
    vPlanePosition = position.xy;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

export const RING_FRAGMENT = /* glsl */ `
  uniform vec3 uTint;
  uniform vec3 uLightColor;
  uniform vec3 uSunDirection;
  uniform vec3 uPlanetCenter;
  uniform float uPlanetRadius;
  uniform float uInnerRadius;
  uniform float uOuterRadius;
  uniform float uOpacity;

  varying vec2 vPlanePosition;
  varying vec3 vWorldPosition;

  ${GLSL_NOISE}

  void main() {
    float radius = length(vPlanePosition);
    float span = max(uOuterRadius - uInnerRadius, 0.0001);
    float t = clamp((radius - uInnerRadius) / span, 0.0, 1.0);

    float bands = fbm5(vec3(radius * 0.42, 0.0, 0.0));
    float density = smoothstep(0.18, 0.82, bands);
    float alpha = (0.3 + 0.7 * density)
      * smoothstep(0.0, 0.07, t)
      * (1.0 - smoothstep(0.82, 1.0, t));

    // Cassini division: one clean gap reads as a ring system, not a smear.
    alpha *= 1.0 - smoothstep(0.015, 0.055, abs(t - 0.61)) * 0.92;

    // Planet shadow: points behind the planet along the Sun direction darken.
    vec3 toSun = normalize(uSunDirection);
    vec3 relative = vWorldPosition - uPlanetCenter;
    float along = dot(relative, toSun);
    float perpendicular = length(relative - toSun * along);
    float umbra = 1.0 - smoothstep(uPlanetRadius * 0.92, uPlanetRadius * 1.08, perpendicular);
    float shadow = 1.0 - umbra * step(along, 0.0) * 0.9;

    vec3 color = uTint * uLightColor * (0.32 + 0.68 * density) * shadow;
    gl_FragColor = vec4(color, alpha * uOpacity);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

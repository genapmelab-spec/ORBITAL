import * as THREE from 'three'
import { NOISE } from './glsl'
import { shared } from '../shared'

const VERT_SPHERE = /* glsl */ `
varying vec3 vPos;
varying vec3 vNormalW;
// World position, kept so the fragment stage can build a view vector: modelMatrix
// exists only in the vertex prefix, so the value has to travel as a varying.
varying vec3 vWorld;
void main() {
  vPos = position;
  vNormalW = normalize(mat3(modelMatrix) * normal);
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`

const FRAG_SURFACE = /* glsl */ `
uniform float uTime;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uHot;
uniform float uScale;
uniform float uCrater;
uniform float uDrift;
uniform float uOpacity;
uniform vec3 uLightDir;
varying vec3 vPos;
varying vec3 vNormalW;
varying vec3 vWorld;
${NOISE}
void main() {
  vec3 p = vPos * uScale;
  float n = fbm(p + vec3(0.0, uTime * uDrift, uTime * uDrift * 0.4));
  float r = ridged(p * 1.9 + 11.3);
  vec3 base = mix(uColorA, uColorB, clamp(n * 1.2, 0.0, 1.0));
  base = mix(base, base * 0.5, clamp(r * uCrater, 0.0, 1.0));
  vec3 lightDir = normalize(uLightDir);
  float lambert = clamp(dot(normalize(vNormalW), lightDir), 0.0, 1.0);
  vec3 lit = base * mix(0.045, 1.0, smoothstep(0.0, 0.26, lambert));
  vec3 viewDir = normalize(cameraPosition - vWorld);
  float mu = clamp(dot(normalize(vNormalW), viewDir), 0.0, 1.0);
  float limb = 0.35 + 0.9 * pow(mu, 0.5);
  vec3 emis = base * (0.7 + 1.6 * n) * limb;
  gl_FragColor = vec4(mix(lit, emis, uHot), uOpacity);
}
`

export interface SurfaceOptions {
  colorA: THREE.Color
  colorB: THREE.Color
  hot?: number
  scale?: number
  crater?: number
  drift?: number
  opacity?: number
  lightDir?: THREE.Vector3
}

export function createSurfaceMaterial(opts: SurfaceOptions): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: shared.uTime,
      uColorA: { value: opts.colorA },
      uColorB: { value: opts.colorB },
      uHot: { value: opts.hot ?? 0 },
      uScale: { value: opts.scale ?? 0.02 },
      uCrater: { value: opts.crater ?? 0 },
      uDrift: { value: opts.drift ?? 0.02 },
      uOpacity: { value: opts.opacity ?? 1 },
      uLightDir: { value: opts.lightDir ?? new THREE.Vector3(0.7, 0.5, 0.6) },
    },
    vertexShader: VERT_SPHERE,
    fragmentShader: FRAG_SURFACE,
  })
}

const VERT_POINTS = /* glsl */ `
attribute float aSeed;
uniform float uTime;
uniform float uSize;
uniform float uTwinkle;
uniform float uPixelRatio;
varying float vSeed;
void main() {
  vSeed = aSeed;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  float tw = 1.0 + uTwinkle * sin(uTime * (0.5 + aSeed * 1.7) + aSeed * 30.0);
  gl_PointSize = uSize * (0.6 + aSeed * 0.8) * tw * uPixelRatio * (260.0 / max(-mv.z, 1.0));
  gl_Position = projectionMatrix * mv;
}
`

const FRAG_POINTS = /* glsl */ `
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uOpacity;
varying float vSeed;
void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float a = 1.0 - smoothstep(0.25, 1.0, d);
  vec3 color = mix(uColorA, uColorB, vSeed);
  gl_FragColor = vec4(color, a * uOpacity);
}
`

/** One point kit: starfields, motes, nebulae, galaxy arms, star clouds. */
export function createPointsMaterial(opts: {
  colorA: THREE.Color
  colorB: THREE.Color
  size?: number
  twinkle?: number
  opacity?: number
}): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: shared.uTime,
      uColorA: { value: opts.colorA },
      uColorB: { value: opts.colorB },
      uSize: { value: opts.size ?? 2.2 },
      uTwinkle: { value: opts.twinkle ?? 0 },
      uOpacity: { value: opts.opacity ?? 1 },
      uPixelRatio: { value: Math.min(typeof devicePixelRatio === 'number' ? devicePixelRatio : 1, 2) },
    },
    vertexShader: VERT_POINTS,
    fragmentShader: FRAG_POINTS,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
}

/** Positions plus per-point seeds, the only attribute the point kit needs. */
export function seededPositions(count: number, fill: (i: number) => THREE.Vector3): THREE.BufferGeometry {
  const positions = new Float32Array(count * 3)
  const seeds = new Float32Array(count)
  for (let i = 0; i < count; i += 1) {
    fill(i).toArray(positions, i * 3)
    seeds[i] = Math.random()
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
  return geometry
}

const VERT_FLAT = /* glsl */ `
varying vec2 vUv;
varying vec3 vWorld;
void main() {
  vUv = uv;
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`

/**
 * The thread: a luminous strip that runs the whole spine. It is the one object
 * present at every rung, and it is what makes the staged scale honest — you are
 * travelling backwards along a single photon's route, not teleporting.
 */
export function createRibbonMaterial(color: THREE.Color): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: shared.uTime,
      uCamera: shared.uCamera,
      uTravel: shared.uTravel,
      uColor: { value: color },
    },
    vertexShader: VERT_FLAT,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uCamera;
      uniform float uTravel;
      uniform vec3 uColor;
      varying vec2 vUv;
      varying vec3 vWorld;
      void main() {
        float across = 1.0 - abs(vUv.x - 0.5) * 2.0;
        float core = pow(across, 3.0);
        float glow = pow(across, 0.7) * 0.3;
        float dz = abs(vWorld.z - uCamera.z);
        float fade = smoothstep(2.0, 120.0, dz) * (1.0 - smoothstep(1500.0, 3000.0, dz));
        float wave = 0.55 + 0.45 * sin(vWorld.z * 0.012 + uTime * 1.1);
        float intensity = (core + glow) * fade * (0.3 + 0.85 * uTravel) * wave;
        gl_FragColor = vec4(uColor * intensity * 1.4, intensity);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
}

/** The first light: a shell of mottled plasma around the last rung. */
export function createShellMaterial(colorA: THREE.Color, colorB: THREE.Color): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: shared.uTime,
      uColorA: { value: colorA },
      uColorB: { value: colorB },
      uTemp: { value: 0 },
      uOpacity: { value: 0.9 },
    },
    vertexShader: VERT_FLAT,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      uniform float uTemp;
      uniform float uOpacity;
      varying vec2 vUv;
      varying vec3 vWorld;
      ${NOISE}
      void main() {
        vec3 p = normalize(vWorld) * 2.6;
        float m = fbm(p + vec3(0.0, uTime * 0.01, 0.0));
        float t = clamp(uTemp + (m - 0.5) * 0.45, 0.0, 1.0);
        vec3 color = mix(uColorA, uColorB, t);
        float fog = smoothstep(0.82, 1.0, uTemp);
        float mottle = mix(0.55 + 0.6 * m, 0.95, fog);
        float alpha = uOpacity * mottle;
        gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
      }
    `,
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
  })
}

/** Radial glow: coronas, halos, the shockwave of a star that is not there yet. */
export function createGlowMaterial(color: THREE.Color): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: shared.uTime,
      uColor: { value: color },
      uIntensity: { value: 1 },
      uCore: { value: 0.06 },
    },
    vertexShader: VERT_FLAT,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uColor;
      uniform float uIntensity;
      uniform float uCore;
      varying vec2 vUv;
      void main() {
        float d = length(vUv - 0.5) * 2.0;
        float halo = pow(max(0.0, 1.0 - d), 3.0);
        float core = pow(max(0.0, 1.0 - d / max(uCore, 0.001)), 1.6);
        float flicker = 1.0 + 0.05 * sin(uTime * 1.7 + d * 12.0);
        float a = (halo + core) * uIntensity * flicker;
        gl_FragColor = vec4(uColor * a, a);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
}

/** Pulsar beams: two cones of light sweeping the Crab. */
export function createBeamMaterial(color: THREE.Color): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: shared.uTime, uColor: { value: color } },
    vertexShader: VERT_FLAT,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uColor;
      varying vec2 vUv;
      void main() {
        float along = 1.0 - vUv.y;
        float edge = 1.0 - abs(vUv.x - 0.5) * 2.0;
        float a = pow(edge, 1.5) * pow(along, 2.0) * (0.55 + 0.45 * sin(uTime * 3.0 - along * 6.0));
        gl_FragColor = vec4(uColor * a, a);
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  })
}

/** A dust band: the reason the centre of our own galaxy is invisible to eyes. */
export function createDustMaterial(color: THREE.Color): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: shared.uTime,
      uColor: { value: color },
      uOpacity: { value: 0.9 },
    },
    vertexShader: VERT_FLAT,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uColor;
      uniform float uOpacity;
      varying vec2 vUv;
      varying vec3 vWorld;
      ${NOISE}
      void main() {
        vec3 p = vWorld * 0.012 + vec3(uTime * 0.004, 0.0, 0.0);
        float n = fbm(p);
        float edge = 1.0 - abs(vUv.x - 0.5) * 2.0;
        float band = pow(edge, 0.6);
        float alpha = uOpacity * band * (0.35 + 0.9 * n);
        gl_FragColor = vec4(uColor, clamp(alpha, 0.0, 1.0));
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  })
}

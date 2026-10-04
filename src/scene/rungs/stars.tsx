import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { SPINE_GAP } from '../../content/ladder'
import { useOrbital } from '../../state/store'
import { ACCENTS, LIGHT, SURFACE } from '../palette'
import { TIERS } from '../../lib/quality'
import {
  createBeamMaterial,
  createGlowMaterial,
  createPointsMaterial,
  createSurfaceMaterial,
  seededPositions,
} from '../shaders/materials'
import { Billboard, useRung } from './parts'

const redA = new THREE.Color(SURFACE.redA)
const redB = new THREE.Color(SURFACE.redB)
const nebA = new THREE.Color(SURFACE.nebulaA)
const nebB = new THREE.Color(SURFACE.nebulaB)

/** 04 — Betelgeuse, and the fuse you can light. Nothing here is new light. */
export function Betelgeuse() {
  const { group } = useRung(3)
  const star = useRef<THREE.Mesh>(null)
  const wave = useRef<THREE.Mesh>(null)
  const waveStart = useRef(0)
  const mode = useRef(0)

  const surface = useMemo(
    () => createSurfaceMaterial({ colorA: redA, colorB: redB, hot: 1, scale: 0.0042, drift: 0.02 }),
    [],
  )
  const halo = useMemo(() => createGlowMaterial(new THREE.Color(ACCENTS.betelgeuse)), [])
  const shock = useMemo(() => createGlowMaterial(new THREE.Color(ACCENTS.sun)), [])

  useFrame((state) => {
    const exp = useOrbital.getState().exp
    const want = exp.rung === 'betelgeuse' && exp.phase === 'fuse' ? 1 : 0
    if (want !== mode.current) {
      mode.current = want
      waveStart.current = state.clock.elapsedTime
    }
    const t = state.clock.elapsedTime
    if (star.current) {
      const beat = 1 + Math.sin(t * 0.42) * 0.018
      star.current.scale.setScalar(beat)
    }
    if (wave.current) {
      const running = mode.current === 1
      wave.current.visible = running
      if (running) {
        const k = Math.min((t - waveStart.current) / 4.2, 1)
        wave.current.scale.setScalar(0.6 + k * 3.4)
        shock.uniforms.uIntensity.value = (1 - k) * 1.6
      }
    }
    halo.uniforms.uIntensity.value = 0.7 + (star.current ? (star.current.scale.x - 1) * 8 : 0)
  })

  return (
    <group ref={group} position={[0, 0, -SPINE_GAP * 3]}>
      <mesh ref={star} material={surface} frustumCulled={false}>
        <sphereGeometry args={[120, 80, 40]} />
      </mesh>
      <Billboard size={620} material={halo} position={[0, 0, 0]} />
      <mesh ref={wave} visible={false} frustumCulled={false}>
        <ringGeometry args={[36, 46, 96]} />
        <primitive object={shock} attach="material" />
      </mesh>
    </group>
  )
}

/** 05 — the Crab: the wreck, the pulsar, and the record written in 1054. */
export function Crab({ tier }: { tier: keyof typeof TIERS }) {
  const { group } = useRung(4)
  const beamGroup = useRef<THREE.Group>(null)
  const beams = useRef<THREE.Group>(null)
  const mix = useRef(1)

  const filaments = useMemo(
    () => createPointsMaterial({ colorA: nebA, colorB: nebB, size: 3.6, twinkle: 0.1, opacity: 1 }),
    [],
  )
  const geometry = useMemo(
    () =>
      seededPositions(TIERS[tier].filaments, () => {
        const u = Math.random() * Math.PI * 2
        const v = Math.acos(2 * Math.random() - 1)
        const r = 42 + Math.pow(Math.random(), 0.7) * 108
        const squash = 0.62
        return new THREE.Vector3(
          Math.sin(v) * Math.cos(u) * r,
          Math.cos(v) * r * squash,
          Math.sin(v) * Math.sin(u) * r,
        )
      }),
    [tier],
  )
  const guest = useMemo(() => createGlowMaterial(new THREE.Color(ACCENTS.sun)), [])
  const beam = useMemo(() => createBeamMaterial(new THREE.Color(ACCENTS.crab)), [])
  const core = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color(LIGHT.white) }), [])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const exp = useOrbital.getState().exp
    const want = exp.rung === 'crab' && exp.phase === 'record' ? 0 : 1
    mix.current = THREE.MathUtils.damp(mix.current, want, 2.6, dt)
    filaments.uniforms.uOpacity.value = 0.22 + 0.78 * mix.current
    guest.uniforms.uIntensity.value = 0.15 + 1.5 * (1 - mix.current)
    if (beams.current) beams.current.visible = mix.current > 0.4
    if (beamGroup.current) beamGroup.current.rotation.y += dt * (0.5 + mix.current * 1.1)
  })

  return (
    <group ref={group} position={[0, 0, -SPINE_GAP * 4]}>
      <points geometry={geometry} material={filaments} frustumCulled={false} />
      <Billboard size={420} material={guest} position={[0, 0, 0]} />
      <mesh material={core} frustumCulled={false}>
        <sphereGeometry args={[3.2, 20, 14]} />
      </mesh>
      <group ref={beams} visible={false}>
        <group ref={beamGroup}>
          <mesh material={beam} position={[0, 120, 0]} frustumCulled={false}>
            <coneGeometry args={[22, 240, 24, 1, true]} />
          </mesh>
          <mesh material={beam} position={[0, -120, 0]} rotation={[Math.PI, 0, 0]} frustumCulled={false}>
            <coneGeometry args={[22, 240, 24, 1, true]} />
          </mesh>
        </group>
      </group>
    </group>
  )
}

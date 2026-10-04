import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { SPINE_GAP } from '../../content/ladder'
import { TIERS } from '../../lib/quality'
import { useOrbital } from '../../state/store'
import { ACCENTS, C, SURFACE, TOKENS } from '../palette'
import {
  createDustMaterial,
  createGlowMaterial,
  createPointsMaterial,
  seededPositions,
} from '../shaders/materials'
import { useRung } from './parts'

const dustA = new THREE.Color(SURFACE.dustA)
const dustB = new THREE.Color(SURFACE.dustB)
const armA = new THREE.Color(SURFACE.armA)
const armB = new THREE.Color(SURFACE.armB)

/** 06 — the Galactic Centre: the same object in three kinds of light. */
export function Core({ tier }: { tier: keyof typeof TIERS }) {
  const { group } = useRung(5)
  const lanes = useMemo(() => createDustMaterial(C.void), [])
  const ring = useMemo(() => createGlowMaterial(new THREE.Color(ACCENTS.core)), [])
  const shadow = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color(TOKENS.void) }), [])
  const ringMesh = useRef<THREE.Mesh>(null)
  const mode = useRef(0)

  const cloud = useMemo(
    () => createPointsMaterial({ colorA: dustA, colorB: dustB, size: 2.6, twinkle: 0.18, opacity: 0.95 }),
    [],
  )
  const geometry = useMemo(
    () =>
      seededPositions(TIERS[tier].cloud, () => {
        const u = Math.random() * Math.PI * 2
        const v = Math.acos(2 * Math.random() - 1)
        const r = Math.pow(Math.random(), 1.7) * 300 + Math.pow(Math.random(), 6) * 120
        return new THREE.Vector3(Math.sin(v) * Math.cos(u) * r, Math.cos(v) * r * 0.55, Math.sin(v) * Math.sin(u) * r)
      }),
    [tier],
  )

  useFrame((state, delta) => {
    const exp = useOrbital.getState().exp
    const phase = exp.rung === 'core' ? exp.phase : 'visible'
    const want = phase === 'radio' ? 2 : phase === 'infrared' ? 1 : 0
    mode.current = THREE.MathUtils.damp(mode.current, want, 3, Math.min(delta, 0.05))
    lanes.uniforms.uOpacity.value = 0.94 - Math.min(mode.current, 2) * 0.41
    const radio = Math.max(0, mode.current - 1.05)
    ring.uniforms.uIntensity.value = radio * 1.4
    if (ringMesh.current) {
      ringMesh.current.visible = radio > 0.02
      ringMesh.current.quaternion.copy(state.camera.quaternion)
      ringMesh.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 0.6) * 0.02)
    }
  })

  return (
    <group ref={group} position={[0, 0, -SPINE_GAP * 5]}>
      <points geometry={geometry} material={cloud} frustumCulled={false} />
      <mesh material={lanes} rotation={[0.22, 0, 0.18]} frustumCulled={false}>
        <planeGeometry args={[1100, 320, 1, 1]} />
      </mesh>
      <mesh ref={ringMesh} visible={false} frustumCulled={false}>
        <ringGeometry args={[34, 46, 96]} />
        <primitive object={ring} attach="material" />
      </mesh>
      <mesh position={[0, 0, -30]} material={shadow} frustumCulled={false}>
        <circleGeometry args={[33, 64]} />
      </mesh>
    </group>
  )
}

/** 07 — Andromeda: the farthest thing an eye can reach, and how late it arrives. */
export function Andromeda({ tier }: { tier: keyof typeof TIERS }) {
  const { group } = useRung(6)
  const spin = useRef<THREE.Group>(null)
  const front = useRef<THREE.Mesh>(null)
  const travel = useRef(0)

  const galaxy = useMemo(
    () => createPointsMaterial({ colorA: armA, colorB: armB, size: 3, twinkle: 0.1, opacity: 0.95 }),
    [],
  )
  const geometry = useMemo(
    () =>
      seededPositions(TIERS[tier].galaxy, () => {
        if (Math.random() < 0.2) {
          const u = Math.random() * Math.PI * 2
          const v = Math.acos(2 * Math.random() - 1)
          const r = Math.pow(Math.random(), 1.6) * 120
          return new THREE.Vector3(Math.sin(v) * Math.cos(u) * r, Math.cos(v) * r * 0.6, Math.sin(v) * Math.sin(u) * r)
        }
        const r = Math.pow(Math.random(), 0.55) * 430
        const arm = Math.random() < 0.5 ? 0 : Math.PI
        const theta = r * 0.0115 + arm + (Math.random() - 0.5) * 0.6
        const spread = 24 + r * 0.05
        return new THREE.Vector3(
          Math.cos(theta) * r + (Math.random() - 0.5) * spread,
          (Math.random() - 0.5) * (26 + r * 0.04),
          Math.sin(theta) * r + (Math.random() - 0.5) * spread,
        )
      }),
    [tier],
  )
  const frontGlow = useMemo(() => createGlowMaterial(new THREE.Color(ACCENTS.andromeda)), [])

  useFrame((state, delta) => {
    const exp = useOrbital.getState().exp
    const arriving = exp.rung === 'andromeda' && exp.phase === 'now'
    travel.current = THREE.MathUtils.damp(travel.current, arriving ? 1 : 0, 1.6, Math.min(delta, 0.05))
    if (spin.current) spin.current.rotation.y += Math.min(delta, 0.05) * 0.02
    const mesh = front.current
    if (!mesh) return
    mesh.visible = travel.current > 0.01
    mesh.position.set(0, 0, travel.current * 700)
    mesh.scale.setScalar(180 + travel.current * 900)
    frontGlow.uniforms.uIntensity.value = 0.5 * (1 - travel.current) + 0.12
    mesh.quaternion.copy(state.camera.quaternion)
  })

  return (
    <group ref={group} position={[0, 0, -SPINE_GAP * 6]}>
      <group ref={spin} rotation={[-0.42, 0.3, 0.12]}>
        <points geometry={geometry} material={galaxy} frustumCulled={false} />
      </group>
      <mesh ref={front} visible={false} frustumCulled={false}>
        <ringGeometry args={[40, 52, 96]} />
        <primitive object={frontGlow} attach="material" />
      </mesh>
    </group>
  )
}

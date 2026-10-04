import { useFrame } from '@react-three/fiber'
import { useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { live } from '../../lib/scroll'
import { useOrbital } from '../../state/store'

/**
 * Sleep bands. Only the rung the camera is inside of (plus the one it is heading
 * to) updates or draws; everything else is skipped whole. This is the single
 * biggest reason eight environments fit in one frame budget.
 */
export function useRung(index: number): {
  group: RefObject<THREE.Group | null>
  active: RefObject<boolean>
} {
  const group = useRef<THREE.Group>(null)
  const active = useRef(false)
  useFrame(() => {
    const on = Math.abs(live.camera - index) < 1.15
    active.current = on
    if (group.current) group.current.visible = on
  })
  return { group, active }
}

export interface PulseSpec {
  rungId: string
  durationMs: number
  from: [number, number, number]
  to: [number, number, number]
  /** Optional: the marker stays at the far end instead of coming back. */
  oneWay?: boolean
}

/** The travelling marker: a laser pulse, a radio signal, a photon. */
export function usePulse({ rungId, durationMs, from, to, oneWay }: PulseSpec) {
  const ref = useRef<THREE.Mesh>(null)
  const a = useRef(new THREE.Vector3(...from))
  const b = useRef(new THREE.Vector3(...to))
  useFrame(() => {
    const mesh = ref.current
    if (!mesh) return
    const exp = useOrbital.getState().exp
    const mine = exp.rung === rungId && exp.firedAt > 0
    mesh.visible = mine
    if (!mine) return
    const k = Math.min((performance.now() - exp.firedAt) / durationMs, 1)
    const leg = oneWay ? k : k < 0.5 ? k / 0.5 : (1 - k) / 0.5
    mesh.position.lerpVectors(a.current, b.current, Math.max(0, Math.min(1, leg)))
    const scale = oneWay ? 1 - k * 0.4 : 1 + Math.sin(k * Math.PI) * 0.6
    mesh.scale.setScalar(scale)
  })
  return ref
}

/** A glow plane that always faces the camera: coronas, halos, shockwaves. */
export function Billboard({
  size,
  material,
  position,
  visible = true,
}: {
  size: number
  material: THREE.Material
  position: [number, number, number]
  visible?: boolean
}) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ camera }) => {
    ref.current?.quaternion.copy(camera.quaternion)
  })
  return (
    <mesh ref={ref} position={position} material={material} visible={visible} frustumCulled={false}>
      <planeGeometry args={[size, size]} />
    </mesh>
  )
}

/** One reusable spherical body with a procedural surface. */
export function Body({
  radius,
  material,
  position = [0, 0, 0],
  segments = 64,
}: {
  radius: number
  material: THREE.Material
  position?: [number, number, number]
  segments?: number
}) {
  return (
    <mesh position={position} material={material} frustumCulled={false}>
      <sphereGeometry args={[radius, segments, Math.round(segments / 2)]} />
    </mesh>
  )
}

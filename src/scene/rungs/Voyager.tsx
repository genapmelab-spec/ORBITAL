import { useMemo } from 'react'
import * as THREE from 'three'
import { SPINE_GAP } from '../../content/ladder'
import { createSurfaceMaterial } from '../shaders/materials'
import { CRAFT } from '../palette'
import { C, ACCENTS } from '../palette'
import { createGlowMaterial } from '../shaders/materials'
import { usePulse, useRung } from './parts'

const bodyA = new THREE.Color(CRAFT.a)
const bodyB = new THREE.Color(CRAFT.b)

/**
 * 03 — Voyager 1. Schematic, not a photograph: dish, bus, boom, generator —
 * enough to read in silhouette, honest about being a diagram.
 */
export function Voyager() {
  const { group } = useRung(2)
  const pulse = usePulse({ rungId: 'voyager', durationMs: 5200, from: [0, 8, 104], to: [0, 1, 12], oneWay: true })

  const metal = useMemo(
    () =>
      createSurfaceMaterial({
        colorA: bodyA,
        colorB: bodyB,
        scale: 0.9,
        crater: 0,
        drift: 0,
        lightDir: new THREE.Vector3(-0.1, 0.15, 1),
      }),
    [],
  )
  const dishMat = useMemo(
    () =>
      createSurfaceMaterial({
        colorA: bodyA,
        colorB: bodyB,
        scale: 1.6,
        crater: 0,
        drift: 0,
        lightDir: new THREE.Vector3(0, 0.1, 1),
      }),
    [],
  )
  const signal = useMemo(() => createGlowMaterial(new THREE.Color(ACCENTS.voyager)), [])

  return (
    <group ref={group} position={[0, 0, -SPINE_GAP * 2]} rotation={[0.08, 0.5, 0]}>
      <mesh material={dishMat} rotation={[Math.PI / 2, 0, 0]} position={[0, 4, 8]} frustumCulled={false}>
        <sphereGeometry args={[21, 44, 22, 0, Math.PI * 2, 0, 0.8]} />
      </mesh>
      <mesh material={metal} position={[0, 0, -7]} frustumCulled={false}>
        <boxGeometry args={[12, 9, 9]} />
      </mesh>
      <mesh material={metal} position={[-24, -2, -6]} rotation={[0, 0, Math.PI / 2]} frustumCulled={false}>
        <cylinderGeometry args={[0.6, 0.6, 34, 8]} />
      </mesh>
      <mesh material={metal} position={[-44, -2, -6]} rotation={[0, 0, Math.PI / 2]} frustumCulled={false}>
        <cylinderGeometry args={[4.4, 4.4, 11, 12]} />
      </mesh>
      <mesh material={metal} position={[20, 6, -4]} rotation={[0, 0, Math.PI / 2]} frustumCulled={false}>
        <cylinderGeometry args={[0.4, 0.4, 26, 6]} />
      </mesh>
      <mesh material={signal} position={[0, 8, 74]} frustumCulled={false}>
        <ringGeometry args={[10, 14, 48]} />
      </mesh>
      <mesh ref={pulse} material={new THREE.MeshBasicMaterial({ color: C.signal })} frustumCulled={false}>
        <sphereGeometry args={[1.5, 14, 10]} />
      </mesh>
    </group>
  )
}

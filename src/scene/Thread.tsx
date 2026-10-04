import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { RUNGS, SPINE_GAP } from '../content/ladder'
import { C } from './palette'
import { shared } from './shared'
import { createPointsMaterial, createRibbonMaterial, seededPositions } from './shaders/materials'

const SPAN = RUNGS.length * SPINE_GAP + 800
const START_Z = 400

/**
 * The thread: one photon's route, drawn from the opening frame to the last rung.
 * It is the only object present everywhere, and it is what tells the visitor they
 * are travelling rather than cutting.
 */
export function Thread({ motes, ribbon }: { motes: number; ribbon: boolean }) {
  const points = useRef<THREE.Points>(null)

  const ribbonGeometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(54, SPAN, 1, 1)
    g.rotateX(-Math.PI / 2)
    return g
  }, [])

  const ribbonMaterial = useMemo(() => createRibbonMaterial(C.flare), [])

  const moteGeometry = useMemo(
    () =>
      seededPositions(motes, () => {
        const angle = Math.random() * Math.PI * 2
        const radius = Math.pow(Math.random(), 1.7) * 30
        return new THREE.Vector3(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius * 0.65,
          (Math.random() - 0.5) * SPAN,
        )
      }),
    [motes],
  )

  const moteMaterial = useMemo(
    () => createPointsMaterial({ colorA: C.flare, colorB: C.ink, size: 2.6, twinkle: 0.25, opacity: 0.55 }),
    [],
  )

  useEffect(
    () => () => {
      ribbonGeometry.dispose()
      ribbonMaterial.dispose()
      moteGeometry.dispose()
      moteMaterial.dispose()
    },
    [ribbonGeometry, ribbonMaterial, moteGeometry, moteMaterial],
  )

  useFrame((_, delta) => {
    const attribute = moteGeometry.getAttribute('position') as THREE.BufferAttribute
    const array = attribute.array as Float32Array
    const speed = (50 + shared.uTravel.value * 900) * Math.min(delta, 0.05)
    for (let i = 2; i < array.length; i += 3) {
      array[i] += speed
      if (array[i] > SPAN / 2) array[i] -= SPAN
    }
    attribute.needsUpdate = true
    if (points.current) points.current.visible = ribbon
  })

  return (
    <group position={[0, 0, START_Z - SPAN / 2]}>
      {ribbon ? <mesh geometry={ribbonGeometry} material={ribbonMaterial} frustumCulled={false} /> : null}
      <points ref={points} geometry={moteGeometry} material={moteMaterial} frustumCulled={false} />
    </group>
  )
}

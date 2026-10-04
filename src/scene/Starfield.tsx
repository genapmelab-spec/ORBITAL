import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ACCENTS, C } from './palette'
import { createPointsMaterial, seededPositions } from './shaders/materials'

/**
 * The sky, carried with the camera so it never runs out. Most of the stars sit in
 * a band: the galaxy we are inside of, seen from within.
 */
export function Starfield({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null)

  const material = useMemo(
    () =>
      createPointsMaterial({
        colorA: C.ink,
        colorB: new THREE.Color(ACCENTS.sun),
        size: 3.1,
        twinkle: 0.3,
        opacity: 0.9,
      }),
    [],
  )

  const geometry = useMemo(
    () =>
      seededPositions(count, () => {
        const band = Math.random() < 0.45
        const u = Math.random() * Math.PI * 2
        const v = band ? Math.PI / 2 + (Math.random() - 0.5) * 0.42 : Math.acos(2 * Math.random() - 1)
        const r = 2400 + Math.random() * 520
        const s = Math.sin(v) * r
        return new THREE.Vector3(Math.cos(u) * s, Math.cos(v) * r, Math.sin(u) * s)
      }),
    [count],
  )

  useEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    },
    [geometry, material],
  )

  useFrame(({ camera }) => {
    ref.current?.position.copy(camera.position)
  })

  return <points ref={ref} geometry={geometry} material={material} frustumCulled={false} />
}

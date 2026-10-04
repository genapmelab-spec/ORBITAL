import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { SPINE_GAP } from '../../content/ladder'
import { TIERS } from '../../lib/quality'
import { useOrbital } from '../../state/store'
import { SURFACE } from '../palette'
import { createPointsMaterial, createShellMaterial, seededPositions } from '../shaders/materials'
import { useRung } from './parts'

/**
 * 08 — First Light: a shell of plasma with the camera inside it. The dial runs
 * from today's 2.725 K to the fog that light could not cross, and the fog wins.
 */
export function FirstLight({ tier }: { tier: keyof typeof TIERS }) {
  const { group } = useRung(7)
  const temp = useRef(0)

  const shell = useMemo(
    () => createShellMaterial(new THREE.Color(SURFACE.cmbCool), new THREE.Color(SURFACE.cmbHot)),
    [],
  )
  const motes = useMemo(
    () =>
      createPointsMaterial({
        colorA: new THREE.Color(SURFACE.cmbHot),
        colorB: new THREE.Color(SURFACE.cmbCool),
        size: 2.4,
        twinkle: 0.1,
        opacity: 0.5,
      }),
    [],
  )
  const geometry = useMemo(
    () =>
      seededPositions(Math.round(TIERS[tier].cloud * 0.5), () => {
        const u = Math.random() * Math.PI * 2
        const v = Math.acos(2 * Math.random() - 1)
        const r = 520 + Math.random() * 300
        return new THREE.Vector3(
          Math.sin(v) * Math.cos(u) * r,
          Math.cos(v) * r,
          Math.sin(v) * Math.sin(u) * r,
        )
      }),
    [tier],
  )

  useFrame((_, delta) => {
    const exp = useOrbital.getState().exp
    const want = exp.rung === 'firstlight' ? exp.progress : 0
    temp.current = THREE.MathUtils.damp(temp.current, want, 4, Math.min(delta, 0.05))
    shell.uniforms.uTemp.value = temp.current
    motes.uniforms.uOpacity.value = 0.5 * (1 - temp.current)
  })

  return (
    <group ref={group} position={[0, 0, -SPINE_GAP * 7]}>
      <mesh material={shell} frustumCulled={false}>
        <sphereGeometry args={[900, 48, 24]} />
      </mesh>
      <points geometry={geometry} material={motes} frustumCulled={false} />
    </group>
  )
}

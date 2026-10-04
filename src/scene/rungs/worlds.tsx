import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { SPINE_GAP } from '../../content/ladder'
import { useOrbital } from '../../state/store'
import { ACCENTS, C, LIGHT, SURFACE } from '../palette'
import { createGlowMaterial, createSurfaceMaterial } from '../shaders/materials'
import { Billboard, Body, usePulse, useRung } from './parts'

const rockA = new THREE.Color(SURFACE.rockA)
const rockB = new THREE.Color(SURFACE.rockB)
const earthA = new THREE.Color(SURFACE.earthA)
const earthB = new THREE.Color(SURFACE.earthB)
const sunA = new THREE.Color(SURFACE.sunA)
const sunB = new THREE.Color(SURFACE.sunB)

/** 01 — the Moon: one cratered sphere, one Earth in its sky, and a laser you can fire. */
export function Moon() {
  const { group } = useRung(0)
  const rock = useRef<THREE.Mesh>(null)
  const pulse = usePulse({ rungId: 'moon', durationMs: 2560, from: [6, 16, 138], to: [0, 3, 61] })
  const pulseMat = useMemo(() => new THREE.MeshBasicMaterial({ color: C.flare }), [])

  const surface = useMemo(
    () =>
      createSurfaceMaterial({
        colorA: rockA,
        colorB: rockB,
        scale: 0.013,
        crater: 0.8,
        drift: 0.004,
        lightDir: new THREE.Vector3(0.55, 0.4, 0.75),
      }),
    [],
  )
  const earthSurface = useMemo(
    () =>
      createSurfaceMaterial({
        colorA: earthA,
        colorB: earthB,
        scale: 0.06,
        crater: 0.2,
        drift: 0.01,
        lightDir: new THREE.Vector3(0.5, 0.3, 0.8),
      }),
    [],
  )
  const earthGlow = useMemo(() => createGlowMaterial(new THREE.Color(ACCENTS.andromeda)), [])

  useFrame((_, delta) => {
    if (rock.current) rock.current.rotation.y += Math.min(delta, 0.05) * 0.014
  })

  return (
    <group ref={group} position={[0, 0, 0]}>
      <mesh ref={rock} material={surface} frustumCulled={false}>
        <sphereGeometry args={[60, 72, 36]} />
      </mesh>
      <Body radius={11} material={earthSurface} position={[-96, 46, -40]} segments={40} />
      <Billboard size={92} material={earthGlow} position={[-96, 46, -40]} />
      <mesh ref={pulse} material={pulseMat} frustumCulled={false}>
        <sphereGeometry args={[1.7, 16, 12]} />
      </mesh>
    </group>
  )
}

/** 02 — the Sun: granulation, a corona, and one photon that has to climb out. */
export function Sun() {
  const { group } = useRung(1)
  const photon = useRef<THREE.Mesh>(null)
  const coronaNear = useMemo(() => createGlowMaterial(new THREE.Color(ACCENTS.sun)), [])
  const coronaFar = useMemo(() => createGlowMaterial(new THREE.Color(ACCENTS.sun)), [])
  const photonMat = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color(LIGHT.white) }), [])

  const surface = useMemo(
    () =>
      createSurfaceMaterial({
        colorA: sunA,
        colorB: sunB,
        hot: 1,
        scale: 0.0055,
        drift: 0.05,
      }),
    [],
  )

  useFrame((state) => {
    const exp = useOrbital.getState().exp
    const scrub = exp.rung === 'sun' ? exp.progress : 0
    coronaNear.uniforms.uIntensity.value = 0.75 + scrub * 0.8
    coronaFar.uniforms.uIntensity.value = 0.4 + scrub * 0.35
    const mesh = photon.current
    if (!mesh) return
    const on = scrub > 0.7
    mesh.visible = on
    if (!on) return
    const k = Math.min((scrub - 0.7) / 0.3, 1)
    mesh.position.lerpVectors(new THREE.Vector3(0, 0, 152), state.camera.position, k)
    mesh.scale.setScalar(1 + k * 0.6)
  })

  return (
    <group ref={group} position={[0, 0, -SPINE_GAP]}>
      <mesh material={surface} frustumCulled={false}>
        <sphereGeometry args={[150, 96, 48]} />
      </mesh>
      <Billboard size={720} material={coronaNear} position={[0, 0, 0]} />
      <Billboard size={1500} material={coronaFar} position={[0, 0, 0]} />
      <mesh ref={photon} material={photonMat} frustumCulled={false}>
        <sphereGeometry args={[2.4, 16, 12]} />
      </mesh>
    </group>
  )
}

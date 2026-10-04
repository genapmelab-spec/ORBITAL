import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { RUNGS, SPINE_GAP } from '../content/ladder'
import { live, publishCamera } from '../lib/scroll'
import { useOrbital } from '../state/store'
import { shared } from './shared'

/**
 * Where the camera is, given a continuous rung position. Keys are authored per
 * rung (docs/3D.md); the rig only interpolates and damps, so a rung's shot is
 * reproducible instead of hand-tuned until it looks right.
 */
const HERO = { pos: [0, 18, 330], look: [0, 0, 0] } as const

const lerp = (a: number, b: number, k: number) => a + (b - a) * k

function frameAt(pos: number, portrait: boolean) {
  if (pos < 0) {
    const k = Math.min(Math.max((pos + 0.55) / 0.55, 0), 1)
    const rung = RUNGS[0].frame
    const out: number[] = []
    for (let i = 0; i < 3; i += 1) out.push(lerp(HERO.pos[i], rung.pos[i], k))
    const look: number[] = []
    for (let i = 0; i < 3; i += 1) look.push(lerp(HERO.look[i], rung.look[i], k))
    return { pos: out, look, z: pos * SPINE_GAP }
  }
  const clamped = Math.min(Math.max(pos, 0), RUNGS.length - 1)
  const i = Math.floor(clamped)
  const j = Math.min(i + 1, RUNGS.length - 1)
  const k = clamped - i
  const a = RUNGS[i].frame
  const b = RUNGS[j].frame
  const pos3 = [0, 1, 2].map((n) => lerp(a.pos[n], b.pos[n], k))
  const look3 = [0, 1, 2].map((n) => lerp(a.look[n], b.look[n], k))
  if (portrait) {
    pos3[0] *= 0.45
    pos3[1] = pos3[1] * 1.05 + 6
    pos3[2] *= 1.38
  }
  return { pos: pos3, look: look3, z: -clamped * SPINE_GAP }
}

export function CameraRig() {
  const { camera, size } = useThree()
  const reduced = useOrbital((s) => s.reduced)
  const pointer = useRef({ x: 0, y: 0 })
  const smoothed = useRef({ x: 0, y: 0 })
  const target = useRef(new THREE.Vector3())
  const look = useRef(new THREE.Vector3())

  useEffect(() => {
    if (reduced) return
    if (window.matchMedia('(pointer: coarse)').matches) return
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [reduced])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    if (reduced) {
      live.camera = Math.round(live.target)
    } else {
      live.camera = THREE.MathUtils.damp(live.camera, live.target, 5.5, dt)
    }
    publishCamera(live.camera)

    const portrait = size.height > size.width
    const frame = frameAt(live.camera, portrait)
    const distance = Math.max(8, Math.hypot(frame.pos[0], frame.pos[1], frame.pos[2]))
    const reach = Math.min(16, distance * 0.06)

    const k = reduced ? 0 : 1 - Math.exp(-dt * 3.2)
    smoothed.current.x += (pointer.current.x - smoothed.current.x) * k
    smoothed.current.y += (pointer.current.y - smoothed.current.y) * k

    target.current.set(
      frame.pos[0] - smoothed.current.x * reach,
      frame.pos[1] + smoothed.current.y * reach * 0.6,
      frame.pos[2] + frame.z,
    )
    look.current.set(frame.look[0], frame.look[1], frame.look[2] + frame.z)

    camera.position.copy(target.current)
    camera.lookAt(look.current)

    shared.uTime.value += dt
    shared.uCamera.value.copy(camera.position)
    const flight = Math.min(1, Math.abs(live.target - live.camera) * 1.5)
    shared.uTravel.value += (flight - shared.uTravel.value) * (reduced ? 1 : 1 - Math.exp(-dt * 4))
  })

  return null
}

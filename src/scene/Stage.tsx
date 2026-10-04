import { Canvas, useFrame } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { FRAME, shared } from './shared'
import { TOKENS } from './palette'
import { live, lookbackAt, measure, update } from '../lib/scroll'
import { TIERS, stepDown, stepUp } from '../lib/quality'
import { useOrbital, type Tier } from '../state/store'
import { CameraRig } from './CameraRig'
import { Starfield } from './Starfield'
import { Thread } from './Thread'
import { Moon, Sun } from './rungs/worlds'
import { Betelgeuse, Crab } from './rungs/stars'
import { Andromeda, Core } from './rungs/deep'
import { Voyager } from './rungs/Voyager'
import { FirstLight } from './rungs/FirstLight'

/**
 * The frame governor. It samples real frame times, not hopes: two seconds of
 * evidence, a five-second cooldown, one step at a time. Tiers change particle
 * counts and pixel ratio — never the story.
 *
 * Two rules keep it honest. The first 2.5 seconds are ignored: first paint and
 * shader compilation are not evidence about the device. And the step-up
 * threshold is 17 ms, not the frame time of some hypothetical fast display — on
 * a 60 Hz screen a page that is keeping up must be allowed to climb back.
 */
function Governor() {
  const tier = useOrbital((s) => s.tier)
  const setTier = useOrbital((s) => s.setTier)
  const frames = useRef<number[]>([])
  const cooldown = useRef(0)
  const warmup = useRef(0)

  useFrame((_, delta) => {
    const now = performance.now()
    if (!warmup.current) warmup.current = now + 2500
    if (now < warmup.current) return
    frames.current.push(delta)
    if (frames.current.length < 120) return
    const sorted = [...frames.current].sort((a, b) => a - b)
    const median = sorted[Math.floor(sorted.length / 2)] * 1000
    frames.current = []
    if (now - cooldown.current < 5000) return
    if (median > 18 && tier !== 'low') {
      setTier(stepDown(tier))
      cooldown.current = now
    } else if (median < 17 && tier !== 'high') {
      setTier(stepUp(tier))
      cooldown.current = now
    }
  })

  return null
}

function Scene({ tier }: { tier: Tier }) {
  const setReady = useOrbital((s) => s.setReady)
  const announced = useRef(false)

  useFrame(() => {
    if (announced.current) return
    announced.current = true
    setReady()
  })

  useEffect(() => {
    shared.uTime.value = 0
  }, [])

  return (
    <>
      <CameraRig />
      <Starfield count={TIERS[tier].stars} />
      <Thread motes={TIERS[tier].motes} ribbon={TIERS[tier].ribbon} />
      <Moon />
      <Sun />
      <Voyager />
      <Betelgeuse />
      <Crab tier={tier} />
      <Core tier={tier} />
      <Andromeda tier={tier} />
      <FirstLight tier={tier} />
    </>
  )
}

/** The only canvas in the project. Everything else is DOM. */
export default function Stage() {
  const tier = useOrbital((s) => s.tier)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const onVisibility = () => setVisible(!document.hidden)
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  return (
    <Canvas
      flat
      dpr={Math.min(TIERS[tier].dpr, window.devicePixelRatio || 1)}
      frameloop={visible ? 'always' : 'never'}
      gl={{ antialias: tier !== 'low', powerPreference: 'high-performance', alpha: false }}
      camera={{ fov: FRAME.fov, near: FRAME.near, far: FRAME.far, position: [0, 18, 330] }}
      onCreated={({ gl, scene, camera }) => {
        // QC hook: with ?hud=1 the renderer is reachable from the console so
        // frame times, draw calls and pixels can be measured, not guessed.
        if (useOrbital.getState().hud) {
          ;(window as unknown as Record<string, unknown>).__orbital = {
            renderer: gl,
            scene,
            camera,
            ladder: { live, update, measure, lookbackAt },
          }
        }
        const voidColor = new THREE.Color(TOKENS.void)
        gl.setClearColor(voidColor, 1)
        scene.background = voidColor
      }}
      style={{ position: 'absolute', inset: '0' }}
    >
      <Scene tier={tier} />
      <Governor />
    </Canvas>
  )
}

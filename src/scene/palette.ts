import * as THREE from 'three'

/**
 * The mirror of src/styles/tokens.css. Colours are read from the tokens at
 * runtime so the stylesheet stays the only place a colour is written down; the
 * fallbacks exist for the (never shipped) case of loading before CSS.
 */
const read = (name: string, fallback: string): string => {
  if (typeof document === 'undefined') return fallback
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || fallback
}

export const TOKENS = {
  void: read('--color-void', '#05070b'),
  deep: read('--color-deep', '#0b0e14'),
  ink: read('--color-ink', '#e9e5dc'),
  dust: read('--color-dust', '#8a8f99'),
  signal: read('--color-signal', '#6fe0c8'),
  flare: read('--color-flare', '#ffb265'),
}

export const ACCENTS = {
  moon: read('--color-accent-moon', '#d9d6ce'),
  sun: read('--color-accent-sun', '#ffd9a0'),
  voyager: read('--color-accent-voyager', '#9fd8e8'),
  betelgeuse: read('--color-accent-betelgeuse', '#e8823f'),
  crab: read('--color-accent-crab', '#7fd9c0'),
  core: read('--color-accent-core', '#c97b4a'),
  andromeda: read('--color-accent-andromeda', '#a8c4e8'),
  firstlight: read('--color-accent-firstlight', '#ff7a2f'),
}

export const C = {
  void: new THREE.Color(TOKENS.void),
  ink: new THREE.Color(TOKENS.ink),
  dust: new THREE.Color(TOKENS.dust),
  signal: new THREE.Color(TOKENS.signal),
  flare: new THREE.Color(TOKENS.flare),
}

export const accentColor = (name: string): THREE.Color =>
  new THREE.Color(ACCENTS[name as keyof typeof ACCENTS] ?? TOKENS.dust)

/**
 * Surface colours. These are not UI tokens: they belong to the objects, and they
 * still live here so no scene file carries a colour literal of its own.
 */
export const SURFACE = {
  rockA: '#5c574f',
  rockB: '#d9d6ce',
  earthA: '#1c4a70',
  earthB: '#8ab37c',
  sunA: '#ff7a2a',
  sunB: '#ffe9c4',
  redA: '#a83c14',
  redB: '#ff9d5c',
  dustA: '#8a4a22',
  dustB: '#ffd9a0',
  nebulaA: '#2f7f6c',
  nebulaB: '#ffd0a0',
  armA: '#cfe0ff',
  armB: '#ffd9a0',
  cmbCool: '#5e1a06',
  cmbHot: '#fff1d8',
}

export const CRAFT = { a: '#6b7280', b: '#d7dbe2' }

/** Unlit cores: the photon in flight, the Crab pulsar. */
export const LIGHT = { white: '#ffffff' }

/**
 * The ladder: one source of truth for the script, the camera and the experiments.
 * docs/CONTENT.md mirrors this file; tools/check-content.mjs fails when the two
 * drift apart, when the rungs stop being ordered by look-back time, or when a
 * number arrives without a source.
 *
 * Every look-back figure is seconds, computed from the distance in its source
 * string. Julian year = 3.15576e7 s. c = 299,792.458 km/s.
 */
export type RungId =
  | 'moon'
  | 'sun'
  | 'voyager'
  | 'betelgeuse'
  | 'crab'
  | 'core'
  | 'andromeda'
  | 'firstlight'

export type Mechanism = 'pulse' | 'scrub' | 'compare' | 'toggle'

export type Vec3 = readonly [number, number, number]

export interface Frame {
  pos: Vec3
  look: Vec3
}

export interface Option {
  id: string
  label: string
  note: string
}

export interface Phase {
  at: number
  text: string
}

export interface ExperimentSpec {
  mechanism: Mechanism
  prompt: string
  /** Pulse: compressed duration of the on-screen flight, in ms. */
  durationMs?: number
  /** Scrub: caption breakpoints in 0..1. */
  phases?: Phase[]
  /** Compare / toggle: the states the visitor chooses between. */
  options?: Option[]
  result: string
  detail: string
}

export interface Rung {
  id: RungId
  index: string
  label: string
  name: string
  /** The numeral is the headline; the unit is set beside it in italic serif. */
  value: string
  unit: string
  /** Compact form for the ruler and the index. */
  arrow: string
  seconds: number
  fact: string
  explanation: string
  source: string
  accent: string
  frame: Frame
  experiment: ExperimentSpec
}

/** Distance between rung origins along the spine, in scene units. */
export const SPINE_GAP = 640

export const RUNGS: Rung[] = [
  {
    id: 'moon',
    index: '01',
    label: 'Nearest delay',
    name: 'The Moon',
    value: '1.28',
    unit: 'seconds',
    arrow: '1.28 s',
    seconds: 1.282,
    fact: 'The Moon is one and a quarter seconds away.',
    explanation:
      'Apollo 11, 14 and 15 each left a mirror on the surface. Observatories still fire lasers at them and time the reflection: 384,400 kilometres each way, 2.56 seconds for the round trip.',
    source: '384,400 km mean distance · Apollo 11/14/15 retroreflectors · NASA-GSFC lunar laser ranging',
    accent: 'moon',
    frame: { pos: [2, 15, 190], look: [0, 0, 0] },
    experiment: {
      mechanism: 'pulse',
      prompt: 'Fire the laser',
      durationMs: 2560,
      result: 'Round trip: 2.56 seconds.',
      detail: '384,400 km each way. Light is fast. It is not instant.',
    },
  },
  {
    id: 'sun',
    index: '02',
    label: 'The long way out',
    name: 'The Sun',
    value: '8',
    unit: 'minutes 20 seconds',
    arrow: '8 m 20 s',
    seconds: 499,
    fact: 'The light on your face left the surface eight minutes ago.',
    explanation:
      'The energy inside it has been trying to get out for far longer. A photon born in the core staggers through roughly a hundred thousand years of collisions, then crosses to Earth in 499 seconds.',
    source: '1 AU = 149,597,870.7 km · 499 s at c · core-to-surface photon diffusion 10⁴–10⁵ yr (NASA)',
    accent: 'sun',
    frame: { pos: [40, 46, 470], look: [0, 0, 0] },
    experiment: {
      mechanism: 'scrub',
      prompt: 'Run the photon',
      phases: [
        { at: 0, text: 'Inside the core. Charged particles everywhere: a photon cannot take a step without being thrown off course.' },
        { at: 0.62, text: 'Ten thousand to a hundred thousand years later, it reaches the surface.' },
        { at: 0.78, text: 'Now the last leg — and this one is nearly instant.' },
        { at: 1, text: '499 seconds to Earth. Your eye is where a hundred thousand years of wandering ends.' },
      ],
      result: 'Core to surface: ~100,000 years. Surface to you: 8 minutes 20 seconds.',
      detail: 'Same photon, two journeys, and only one of them fits in a coffee break.',
    },
  },
  {
    id: 'voyager',
    index: '03',
    label: 'The farthest machine',
    name: 'Voyager 1',
    value: '23',
    unit: 'hours 40 minutes',
    arrow: '23 h 40 m',
    seconds: 85180,
    fact: 'The farthest thing we have ever sent is most of a day away at the speed of light.',
    explanation:
      'Launched in 1977 and now about 170 astronomical units out. A command sent now takes 23 hours 40 minutes to reach it; the earliest possible answer comes back a day after that.',
    source: '≈170 AU (2026) · NASA/JPL Voyager mission status · light time = distance ÷ c',
    accent: 'voyager',
    frame: { pos: [30, 9, 58], look: [0, 0, 0] },
    experiment: {
      mechanism: 'pulse',
      prompt: 'Transmit',
      durationMs: 5200,
      result: 'Signal sent. It arrives tomorrow; the reply can only come the day after.',
      detail: '23 h 40 m out, 23 h 40 m back. Nothing can answer sooner.',
    },
  },
  {
    id: 'betelgeuse',
    index: '04',
    label: 'Five hundred years late',
    name: 'Betelgeuse',
    value: '550',
    unit: 'years',
    arrow: '550 y',
    seconds: 1.7357e10,
    fact: 'Betelgeuse may already be gone. The news is 550 years late.',
    explanation:
      'A red supergiant wide enough to swallow the orbit of Mars, expected to collapse within the next hundred thousand years. The light arriving tonight left it around 1476.',
    source: 'Gaia DR3 ≈168 pc (~548 ly, ±25%) · radius ≈764 R☉ · collapse expected within ~10⁵ yr',
    accent: 'betelgeuse',
    frame: { pos: [-26, 34, 430], look: [0, 0, 0] },
    experiment: {
      mechanism: 'toggle',
      prompt: 'Light the fuse',
      options: [
        { id: 'tonight', label: 'Tonight', note: 'Nothing. The star you are watching left 550 years ago.' },
        { id: 'fuse', label: 'If it detonated tonight', note: 'The shockwave leaves now. The light follows at the same speed — and we find out in about 2576.' },
      ],
      result: 'A supernova this close would shine for weeks, as bright as a half Moon.',
      detail: 'You would not need the instrument. You would only need to look up.',
    },
  },
  {
    id: 'crab',
    index: '05',
    label: 'A supernova with a record',
    name: 'The Crab Nebula',
    value: '6,500',
    unit: 'years',
    arrow: '6,500 y',
    seconds: 2.0512e11,
    fact: 'In 1054, Chinese astronomers logged a guest star you could see in daylight for twenty-three days.',
    explanation:
      'The explosion itself happened about 6,500 years earlier; the light spent that long in transit. What we photograph now is the wreck roughly 970 years on, with a pulsar spinning thirty times a second at its heart.',
    source: 'SN 1054 records · distance ≈6,500 ly · PSR B0531+21 at 30.2 Hz · expansion ≈1,500 km/s',
    accent: 'crab',
    frame: { pos: [0, 18, 330], look: [0, -4, 0] },
    experiment: {
      mechanism: 'compare',
      prompt: 'Two dates',
      options: [
        { id: 'record', label: '1054', note: 'A guest star in Taurus, in daylight for 23 days. Recorded by Chinese and Japanese observers.' },
        { id: 'tonight', label: 'Tonight', note: 'The wreck, ~970 years after the blast, lit from inside by a pulsar.' },
      ],
      result: 'The same object, two moments: the arrival, and the aftermath.',
      detail: 'We see the nebula as it was 6,500 years ago — and it is already 970 years older in its own time.',
    },
  },
  {
    id: 'core',
    index: '06',
    label: 'Our own centre',
    name: 'The Galactic Centre',
    value: '26,000',
    unit: 'years',
    arrow: '26,000 y',
    seconds: 8.205e11,
    fact: 'The middle of our own galaxy is invisible to your eyes.',
    explanation:
      'Around thirty magnitudes of dust stand between you and it, so visible light never gets through. Infrared shows the dust glowing; radio, at 1.3 millimetres, shows the four-million-solar-mass black hole it hides.',
    source: '8.15 kpc (≈26,600 ly) · A_V ≈ 30 mag toward Sgr A* · EHT 2022: 4.297×10⁶ M☉, ring ≈52 μas',
    accent: 'core',
    frame: { pos: [0, 14, 400], look: [0, -24, 0] },
    experiment: {
      mechanism: 'toggle',
      prompt: 'Change the light',
      options: [
        { id: 'visible', label: 'Visible', note: 'Nothing. The dust wins.' },
        { id: 'infrared', label: 'Infrared', note: 'The dust itself, glowing — and the star clouds behind it.' },
        { id: 'radio', label: 'Radio, 1.3 mm', note: 'The shadow: 4.3 million suns, ringed by light that bent around them.' },
      ],
      result: 'The centre is there in all three. Only one of them is something an eye could do.',
      detail: 'The first image of it was published in 2022 — and it was made of radio, not light.',
    },
  },
  {
    id: 'andromeda',
    index: '07',
    label: 'The farthest eye',
    name: 'Andromeda',
    value: '2.5',
    unit: 'million years',
    arrow: '2.5 M y',
    seconds: 8.0156e13,
    fact: 'The farthest thing your unaided eye can reach left before our species existed.',
    explanation:
      'That light has been travelling for about 2.5 million years, roughly as long as humans have been making stone tools. A trillion stars, arriving one old photon at a time.',
    source: 'M31: 2.54 ± 0.06 Mly · ~10¹² stars · approaching the Milky Way at ≈110 km/s',
    accent: 'andromeda',
    frame: { pos: [0, 170, 720], look: [0, 0, 0] },
    experiment: {
      mechanism: 'compare',
      prompt: 'Then and now',
      options: [
        { id: 'then', label: 'Then', note: 'The light leaves. Oldowan stone tools; Homo sapiens is 2.2 million years away.' },
        { id: 'now', label: 'Now', note: 'It lands in your eye. The galaxy that sent it has turned a quarter of a turn since.' },
      ],
      result: 'Nothing you have ever seen with your own eyes is younger than this.',
      detail: 'Stand outside tonight and you are doing astronomy with the naked eye. That is the whole trick.',
    },
  },
  {
    id: 'firstlight',
    index: '08',
    label: 'The edge of seeing',
    name: 'First Light',
    value: '13.8',
    unit: 'billion years',
    arrow: '13.8 G y',
    seconds: 4.354e17,
    fact: 'You cannot see further back than this.',
    explanation:
      'For its first 380,000 years the universe was a fog of charged particles that light could not cross. When it cleared, the glow that escaped has been travelling ever since: now 2.725 kelvin, the coldest and oldest light there is.',
    source: 'Planck 2018: 13.797 Gyr · T = 2.7255 K · recombination z ≈ 1100 (~3,000 K) · fluctuations ~1 part in 10⁵',
    accent: 'firstlight',
    frame: { pos: [0, 6, 190], look: [0, 40, -420] },
    experiment: {
      mechanism: 'scrub',
      prompt: 'Turn up the heat',
      phases: [
        { at: 0, text: '2.725 K. The whole sky, all of it, a whisper of microwaves — and the blueprint of every galaxy inside it.' },
        { at: 0.42, text: 'Warmer. The fog thins, and the glow climbs out of the microwave and into the visible.' },
        { at: 0.72, text: 'About 3,000 K: the universe glows like the surface of a star.' },
        { at: 1, text: 'Any further back is opacity. No light gets through at all.' },
      ],
      result: 'This is the oldest light there is. Beyond it, there is nothing to see but fog.',
      detail: 'Eight rungs down. The first look and the first light turn out to be the same thing.',
    },
  },
]

export const byId = (id: RungId): Rung => {
  const rung = RUNGS.find((r) => r.id === id)
  if (!rung) throw new Error(`unknown rung: ${id}`)
  return rung
}

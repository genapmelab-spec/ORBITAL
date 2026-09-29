/**
 * Journey content — the single source of truth for stage order.
 * Camera path, scroll, nav, storytelling and DOM sections all derive
 * from this array. The order must never be reshuffled (Solar System Journey).
 */

export type StageKind = 'planet' | 'moon' | 'belt' | 'transition' | 'sun' | 'overview';

export interface Stage {
  /** 1-based journey index (01–14) */
  index: number;
  /** Stable id — anchors, nav, camera keys, deep links */
  id: string;
  /** Display name (cinematic caption) */
  name: string;
  /** Short scientific statement — one line, never a paragraph */
  statement: string;
  /** Mono metadata pairs, e.g. distance / diameter */
  meta: string[];
  /** Scene role — drives camera choreography and object emphasis */
  kind: StageKind;
  /** Where the caption sits for this composition */
  captionPos: 'left' | 'right' | 'center';
  /** Quiet stages (transitions) use a whisper type treatment, not a headline */
  quiet?: boolean;
  /** sr-only summary (a11y contract: identical info per stage) */
  summary: string;
}

export const JOURNEY: readonly Stage[] = [
  {
    index: 1,
    id: 'earth',
    name: 'EARTH',
    statement: 'Every journey begins at home.',
    meta: ['THIRD PLANET', '12,742 KM', '1 ATM'],
    kind: 'planet',
    captionPos: 'left',
    summary:
      'Stage 1, Earth. The journey begins close to home, looking at Earth from low orbit, blue and luminous against the dark.',
  },
  {
    index: 2,
    id: 'moon',
    name: 'MOON',
    statement: 'The first step outward.',
    meta: ['384,400 KM', '3,474 KM', 'NO ATMOSPHERE'],
    kind: 'moon',
    captionPos: 'right',
    summary:
      'Stage 2, the Moon. The camera pulls away from Earth and drifts past the grey, cratered Moon before turning inward toward the Sun.',
  },
  {
    index: 3,
    id: 'mercury',
    name: 'MERCURY',
    statement: 'Scorched on one side, frozen on the other.',
    meta: ['57.9M KM', '4,879 KM', '0.39 AU'],
    kind: 'planet',
    captionPos: 'left',
    summary:
      'Stage 3, Mercury. Inside the inner system, an extreme close pass over a scorched, cratered world skimming the Sun.',
  },
  {
    index: 4,
    id: 'venus',
    name: 'VENUS',
    statement: 'A runaway greenhouse behind eternal clouds.',
    meta: ['108.2M KM', '12,104 KM', '92 BAR'],
    kind: 'planet',
    captionPos: 'right',
    summary:
      'Stage 4, Venus. Sinking through thick sulphuric haze, a glowing amber world wrapped in unbroken cloud.',
  },
  {
    index: 5,
    id: 'earth-orbit',
    name: 'EARTH ORBIT',
    statement: 'Look back. Home is already small.',
    meta: ['CHECKPOINT', '1 AU', 'SCALE'],
    kind: 'transition',
    captionPos: 'center',
    quiet: true,
    summary:
      'Stage 5, Earth orbit. A distant look back at Earth — now a small pale dot — as the journey widens toward the outer system.',
  },
  {
    index: 6,
    id: 'mars',
    name: 'MARS',
    statement: 'The red frontier.',
    meta: ['227.9M KM', '6,779 KM', '1.52 AU'],
    kind: 'planet',
    captionPos: 'left',
    summary:
      'Stage 6, Mars. A dusty rust-red world, thin atmosphere, the last rocky stop before the belt.',
  },
  {
    index: 7,
    id: 'asteroid-belt',
    name: 'ASTEROID BELT',
    statement: 'A million worlds that never formed.',
    meta: ['2.2–3.2 AU', 'CERES', 'TRANSITION'],
    kind: 'belt',
    captionPos: 'right',
    summary:
      'Stage 7, the asteroid belt. The camera threads a drifting field of rubble between Mars and Jupiter.',
  },
  {
    index: 8,
    id: 'jupiter',
    name: 'JUPITER',
    statement: 'The largest planet in the Solar System.',
    meta: ['778.5M KM', '139,820 KM', '95 MOONS'],
    kind: 'planet',
    captionPos: 'left',
    summary:
      'Stage 8, Jupiter. A colossal striped giant rises — larger than every other planet combined — with the Great Red Spot drifting past.',
  },
  {
    index: 9,
    id: 'saturn',
    name: 'SATURN',
    statement: 'The crown of the system.',
    meta: ['1.43B KM', '116,460 KM', 'RINGS 282,000 KM'],
    kind: 'planet',
    captionPos: 'center',
    summary:
      'Stage 9, Saturn. The signature moment — the camera glides above the ring plane, then through it, and settles beneath the golden rings.',
  },
  {
    index: 10,
    id: 'uranus',
    name: 'URANUS',
    statement: 'A pale mirror, tilted on its side.',
    meta: ['2.87B KM', '50,724 KM', '98° TILT'],
    kind: 'planet',
    captionPos: 'left',
    summary:
      'Stage 10, Uranus. Far out in cold silence, a pale cyan world rolling around the Sun on its side.',
  },
  {
    index: 11,
    id: 'neptune',
    name: 'NEPTUNE',
    statement: 'The last giant. The edge of the bright.',
    meta: ['4.5B KM', '49,244 KM', '2,100 KM/H WINDS'],
    kind: 'planet',
    captionPos: 'right',
    summary:
      'Stage 11, Neptune. The final giant, deep blue and remote, under a Sun that is now just the brightest star.',
  },
  {
    index: 12,
    id: 'outer',
    name: 'OUTER SOLAR SYSTEM',
    statement: 'The giants recede into darkness.',
    meta: ['30–50 AU', 'PLUTO', 'KUIPER BELT'],
    kind: 'transition',
    captionPos: 'left',
    quiet: true,
    summary:
      'Stage 12, the outer solar system. The planets shrink to points among the stars as the camera passes the edge of the Kuiper Belt.',
  },
  {
    index: 13,
    id: 'overview',
    name: 'SOLAR SYSTEM OVERVIEW',
    statement: 'Everything you passed, in one view.',
    meta: ['FULL SYSTEM', '4.6B YEARS', '8 PLANETS'],
    kind: 'overview',
    captionPos: 'center',
    summary:
      'Stage 13, solar system overview. The camera pulls back until the entire system fits in one view — orbits, planets and the Sun together.',
  },
  {
    index: 14,
    id: 'sun',
    name: 'THE SUN',
    statement: '99.86% of everything.',
    meta: ['1.39M KM', '5,505°C', 'FINAL DESTINATION'],
    kind: 'sun',
    captionPos: 'center',
    summary:
      'Stage 14, the Sun. The journey ends where everything began — diving toward the Sun as its light fills the frame.',
  },
] as const;

/** Stage ids in journey order — used by nav, anchors and deep links. */
export const STAGE_IDS: readonly string[] = JOURNEY.map((stage) => stage.id);

/** Index used by the preloader and the progress rail. */
export const LAST_STAGE_INDEX: number = JOURNEY.length;

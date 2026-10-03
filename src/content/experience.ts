/**
 * The page spine.
 *
 * One file owns what the page says and when it says it: section order, camera
 * parameters, navigation, and every line of copy. Components read it at build
 * time, the runtime scripts read it in the browser, and `tools/check-layout.mjs`
 * reads it in Node — so the DOM, the camera choreography and the checks can
 * never drift apart. It imports nothing.
 *
 * Rules for editing (docs/AGENTS.md):
 * - `param` values are the camera timeline. They never decrease, and a station
 *   section must sit exactly on its camera key's parameter.
 * - Copy is final-grade: one fact, one explanation, no filler.
 */

export type StationId = 'earth' | 'moon' | 'mars' | 'belt' | 'jupiter' | 'sun';

export type CameraKeyId =
  | 'entry'
  | 'earth'
  | 'transit-moon'
  | 'moon'
  | 'mars'
  | 'belt'
  | 'jupiter'
  | 'ascent'
  | 'sun'
  | 'overview';

export type SectionId =
  | 'entry'
  | 'premise'
  | 'act-1'
  | 'earth'
  | 'moon'
  | 'act-2'
  | 'mars'
  | 'belt'
  | 'act-3'
  | 'jupiter'
  | 'sun'
  | 'control'
  | 'close';

/** Which side of the viewport carries a section's copy. */
export type CaptionSide = 'left' | 'right' | 'centre';

export type SectionKind = 'entry' | 'premise' | 'act' | 'station' | 'control' | 'close';

/** Camera parameter at each key. Sections between keys interpolate the flight. */
export const CAMERA_PARAMS: Record<CameraKeyId, number> = {
  entry: 0,
  earth: 1,
  'transit-moon': 1.5,
  moon: 2,
  mars: 3,
  belt: 4,
  jupiter: 5,
  ascent: 5.5,
  sun: 6,
  overview: 7,
};

export const LAST_PARAM: number = CAMERA_PARAMS.overview;

/**
 * Opening choreography, measured in the first camera segment (param 0 → 1).
 * The hero holds still while the visitor works out where they are, then the
 * identity arrives, then the window leaves the view and the flight starts.
 */
export const OPENING = {
  /** Nothing moves at all until this much of the first segment is scrolled. */
  holdEnd: 0.12,
  /** The ORBITAL block finishes arriving here. */
  revealEnd: 0.32,
  /** The observation window slides out of view between these two values. */
  exitFrom: 0.38,
  exitTo: 0.7,
} as const;

export const CONTACT = {
  /** Days the time control can travel either side of today. */
  rangeDays: 1095,
} as const;

export interface Destination {
  readonly id: StationId;
  readonly index: number;
  readonly name: string;
  readonly fact: string;
  readonly context: string;
  /** Small label anchored to the body in the 3D scene. */
  readonly annotation: string;
  readonly metric: string;
}

export interface Act {
  readonly id: SectionId;
  readonly number: string;
  readonly name: string;
  readonly line: string;
}

export interface Section {
  readonly id: SectionId;
  readonly kind: SectionKind;
  readonly param: number;
  readonly captionSide: CaptionSide;
  /** Camera key this section settles on, when it settles on one. */
  readonly cameraKey: CameraKeyId | null;
  readonly station: StationId | null;
  readonly act: SectionId | null;
}

export const ENTRY = {
  whisper: 'Somewhere above the night side.',
  eyebrow: 'ORBITAL',
  strapline: 'A live model of the Solar System',
  titleLead: 'The Solar System, running',
  titleEm: 'for real.',
  support:
    'No photographs. No textures. Every world sits where it actually is today, drawn live as you fly past — one unbroken camera move from a window above Earth to the surface of the Sun.',
  primaryCta: { label: 'Begin the flight', href: '#earth' },
  secondaryCta: { label: 'What am I looking at?', href: '#premise' },
  meta: { destinations: '6 destinations', photographs: '0 photographs', datePrefix: 'positions computed for' },
} as const;

export const PREMISE = {
  kicker: 'Why ORBITAL exists',
  title: 'Scale is not something you can read.',
  body: 'Every diagram of the Solar System is compressed to fit a page: distances rescaled, orbits flattened into one tidy frame. ORBITAL keeps the model running instead — real positions, real orbital periods, one continuous crossing — so distance and mass arrive as experience rather than as figures.',
  claims: [
    {
      title: 'Positions, not pictures',
      line: 'Every body is placed from its own orbital elements, computed for the date you are reading this.',
    },
    {
      title: 'Surfaces drawn, not photographed',
      line: 'Nothing here is an image file. Detail is generated in the shader, so it holds up wherever you fly.',
    },
    {
      title: 'One continuous camera',
      line: 'No cuts, no dissolves, no reset between sections. The flight never stops moving.',
    },
  ],
  cta: { label: 'Begin the flight', href: '#earth' },
} as const;

export const ACTS: readonly Act[] = [
  {
    id: 'act-1',
    number: 'I',
    name: 'Departure',
    line: 'Two worlds we have actually stood on, and the line where that stops being true.',
  },
  {
    id: 'act-2',
    number: 'II',
    name: 'Crossing',
    line: 'Past the last measured thing, where the belt stops looking like a wall and starts looking like distance.',
  },
  {
    id: 'act-3',
    number: 'III',
    name: 'Mass and light',
    line: 'Two objects that own almost everything else in the system.',
  },
];

export const DESTINATIONS: readonly Destination[] = [
  {
    id: 'earth',
    index: 1,
    name: 'Earth',
    fact: 'You are riding a planet that covers 940 million kilometres a year.',
    context:
      'Around 107,000 km/h around the Sun, and entirely unfelt from the surface. This is the only world on the flight with a horizon you recognise.',
    annotation: 'EARTH',
    metric: '1 AU · 107,000 KM/H',
  },
  {
    id: 'moon',
    index: 2,
    name: 'Moon',
    fact: 'Three days from home, and still the farthest a human has stood.',
    context:
      'Apollo 8 crossed that gap in 1968. Every crewed flight since has been a longer version of the same trip.',
    annotation: 'MOON',
    metric: '384,400 KM · 3 DAYS',
  },
  {
    id: 'mars',
    index: 3,
    name: 'Mars',
    fact: 'Everything humans have ever driven on Mars adds up to under 100 km.',
    context: 'You will cover that distance in this flight before the next station arrives.',
    annotation: 'MARS',
    metric: '1.52 AU · 687-DAY YEAR',
  },
  {
    id: 'belt',
    index: 4,
    name: 'Asteroid Belt',
    fact: 'It looks crowded and is almost empty — the entire belt holds about 4% of the Moon\u2019s mass.',
    context:
      'It is not a wall. It is the place where familiar measurements stop working, and rock starts behaving like weather.',
    annotation: 'ASTEROID BELT',
    metric: '2.2 – 3.2 AU',
  },
  {
    id: 'jupiter',
    index: 5,
    name: 'Jupiter',
    fact: 'About 1,300 Earths would fit inside it.',
    context:
      'Every other planet in the system could fit inside Jupiter at once. Its gravity has been shaping the inner system since before Earth existed.',
    annotation: 'JUPITER',
    metric: '5.2 AU · 318 EARTH MASSES',
  },
  {
    id: 'sun',
    index: 6,
    name: 'Sun',
    fact: '99.86% of the mass you just crossed is behind that light.',
    context:
      'A photon leaving the surface reaches the window you started in eight minutes and twenty seconds later.',
    annotation: 'SUN',
    metric: '99.86% OF THE MASS',
  },
];

export const CONTROL = {
  kicker: 'The model, unscripted',
  title: 'Take the controls.',
  body: 'The flight you just moved through was written in advance. The model was not. Move the date and every world travels to where it actually will be — each one at its own orbital speed.',
  label: 'Set the date',
  readout: 'days from today',
  liveMetricLabel: 'Earth \u2192 Mars',
  reset: 'Back to today',
  restart: { label: 'Restart from the window', href: '#entry' },
  share: 'Copy the flight link',
  fallbackNote: 'The scene needs WebGL. The model is still running in the numbers above.',
} as const;

export const CLOSE = {
  voice: 'The model is still running.',
  meta: '149.6 million kilometres · one scroll · zero photographs',
  primaryCta: { label: 'Fly it again', href: '#entry' },
  share: 'Copy the flight link',
  colophon:
    'ORBITAL — a live model of the Solar System. Positions computed in your browser from J2000 orbital elements. No photographs, no textures, no tracking.',
} as const;

export const NAV = {
  brand: 'ORBITAL',
  brandHref: '#entry',
  why: { label: 'Why ORBITAL', href: '#premise' },
  controls: { label: 'Controls', href: '#control' },
} as const;

/** Every station in flight order — the navigation list and the checks share it. */
export const STATION_ORDER: readonly StationId[] = DESTINATIONS.map((destination) => destination.id);

export const DESTINATION_BY_ID: Record<StationId, Destination> = {
  earth: DESTINATIONS[0] as Destination,
  moon: DESTINATIONS[1] as Destination,
  mars: DESTINATIONS[2] as Destination,
  belt: DESTINATIONS[3] as Destination,
  jupiter: DESTINATIONS[4] as Destination,
  sun: DESTINATIONS[5] as Destination,
};

function stationSection(destination: Destination, captionSide: CaptionSide): Section {
  return {
    id: destination.id,
    kind: 'station',
    param: CAMERA_PARAMS[destination.id === 'sun' ? 'sun' : destination.id],
    captionSide,
    cameraKey: destination.id === 'sun' ? 'sun' : destination.id,
    station: destination.id,
    act: null,
  };
}

/**
 * The page, in order. Caption sides alternate on purpose: the 3D subject sits
 * opposite the copy so no station is composed the same way twice, while the
 * page's own voice (premise, climax, controls) stays centred.
 */
export const SECTIONS: readonly Section[] = [
  { id: 'entry', kind: 'entry', param: CAMERA_PARAMS.entry, captionSide: 'centre', cameraKey: 'entry', station: null, act: null },
  { id: 'premise', kind: 'premise', param: 0.7, captionSide: 'left', cameraKey: null, station: null, act: null },
  { id: 'act-1', kind: 'act', param: 0.9, captionSide: 'left', cameraKey: null, station: null, act: 'act-1' },
  stationSection(DESTINATION_BY_ID.earth, 'left'),
  stationSection(DESTINATION_BY_ID.moon, 'right'),
  { id: 'act-2', kind: 'act', param: 2.9, captionSide: 'right', cameraKey: null, station: null, act: 'act-2' },
  stationSection(DESTINATION_BY_ID.mars, 'left'),
  stationSection(DESTINATION_BY_ID.belt, 'right'),
  { id: 'act-3', kind: 'act', param: 4.9, captionSide: 'left', cameraKey: null, station: null, act: 'act-3' },
  stationSection(DESTINATION_BY_ID.jupiter, 'left'),
  stationSection(DESTINATION_BY_ID.sun, 'centre'),
  { id: 'control', kind: 'control', param: CAMERA_PARAMS.overview, captionSide: 'centre', cameraKey: 'overview', station: null, act: null },
  { id: 'close', kind: 'close', param: LAST_PARAM + 0.2, captionSide: 'centre', cameraKey: 'overview', station: null, act: null },
];

export const SECTION_BY_ID: Record<SectionId, Section> = SECTIONS.reduce(
  (accumulator, section) => {
    accumulator[section.id] = section;
    return accumulator;
  },
  {} as Record<SectionId, Section>,
);

export function sectionParam(id: SectionId): number {
  return SECTION_BY_ID[id].param;
}

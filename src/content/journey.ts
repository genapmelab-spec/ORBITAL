/**
 * Journey content — the single source of truth for the whole experience.
 *
 * Two layers, one order: * JOURNEY    the 14 stage spine. Camera keys, nav links and stage sections
 *              derive from this array and its order is never reshuffled.
 *   EXPERIENCE the page as a landing page: a prologue that starts in darkness
 *              on the night side of the world (no planet in your face), the
 *              journey with planets as landmarks, interstitial moments between
 *              them — including one that states why the experience is worth
 *              taking — and a real ending that converts interest into action.
 *              Every entry carries the camera parameter it sits on, so moments
 *              can live *between* two stages without ever pulling the camera
 *              sideways.
 *
 * CAMERA PARAM CONTRACT (shared with the three layer, but three-free):
 *   param 0        the opening — night side of Earth, before the reveal
 *   param i        stage i of JOURNEY (1..14)
 *   LAST_STAGE_PARAM = JOURNEY.length = 14
 * The scroll controller maps scroll to this space; the camera path has one key
 * per integer plus the opening, so the page and the flight cannot disagree.
 */

export type StageKind = 'planet' | 'moon' | 'belt' | 'transition' | 'sun' | 'overview';

/**
 * How much of a stage is spoken. Most planets are landmarks inside the
 * journey — a name and one line at most — and two of them are deliberately
 * silent: they are passed through, not introduced.
 */
export type StageWeight = 'landmark' | 'minimal' | 'silent';

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
  meta: readonly string[];
  /** Scene role — drives camera choreography and object emphasis */
  kind: StageKind;
  /** How much this stage speaks on the page */
  weight: StageWeight;
  /** Where the caption sits for this composition */
  captionPos: 'left' | 'right' | 'center';
  /** Quiet stages (transitions) use a whisper type treatment, not a headline */
  quiet?: boolean;
  /** sr-only summary (a11y contract: identical info per stage) */
  summary: string;
}

export const JOURNEY = [
  {
    index: 1,
    id: 'earth',
    name: 'EARTH',
    statement: 'Every journey begins at home.',
    meta: ['THIRD PLANET', '12,742 KM', '1 ATM'],
    kind: 'planet',
    weight: 'landmark',
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
    weight: 'minimal',
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
    weight: 'landmark',
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
    weight: 'silent',
    captionPos: 'right',
    summary:
      'Stage 4, Venus. Sinking through thick sulphuric haze, a glowing amber world wrapped in unbroken cloud. Passed without a caption: the atmosphere says enough.',
  },
  {
    index: 5,
    id: 'earth-orbit',
    name: 'EARTH ORBIT',
    statement: 'Look back. Home is already small.',
    meta: ['CHECKPOINT', '1 AU', 'SCALE'],
    kind: 'transition',
    weight: 'minimal',
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
    weight: 'minimal',
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
    weight: 'landmark',
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
    weight: 'landmark',
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
    weight: 'landmark',
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
    weight: 'silent',
    captionPos: 'left',
    summary:
      'Stage 10, Uranus. Far out in cold silence, a pale cyan world rolling around the Sun on its side. Passed without a caption: distance is the story here.',
  },
  {
    index: 11,
    id: 'neptune',
    name: 'NEPTUNE',
    statement: 'The last giant. The edge of the bright.',
    meta: ['4.5B KM', '49,244 KM', '2,100 KM/H WINDS'],
    kind: 'planet',
    weight: 'minimal',
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
    weight: 'minimal',
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
    weight: 'landmark',
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
    weight: 'landmark',
    captionPos: 'center',
    summary:
      'Stage 14, the Sun. The journey ends where everything began — diving toward the Sun as its light fills the frame.',
  },
] as const satisfies readonly Stage[];

/** Literal union of every stage id, derived from the journey itself. */
export type StageId = (typeof JOURNEY)[number]['id'];

/** Stage ids in journey order — used by nav, anchors and deep links. */
export const STAGE_IDS: readonly StageId[] = JOURNEY.map((stage) => stage.id);

/** Index used by the preloader and the progress rail. */
export const LAST_STAGE_INDEX: number = JOURNEY.length;

/** Stage lookup by id — used by the page to render sections from EXPERIENCE. */
export const STAGE_BY_ID: Record<StageId, Stage> = JOURNEY.reduce<Record<StageId, Stage>>(
  (accumulator, stage) => {
    accumulator[stage.id] = stage;
    return accumulator;
  },
  {} as Record<StageId, Stage>,
);

/* ── The page as an experience ─────────────────────────────────────────────── */

export interface SectionAction {
  readonly label: string;
  readonly href: string;
  readonly solid?: boolean;
}

/** One numbered line of the why-this-journey manifesto. */
export interface SectionPoint {
  readonly title: string;
  readonly text: string;
}

interface InterstitialBase {
  readonly id: string;
  /** Camera parameter this section sits on: 0 = the opening, i = stage i. */
  readonly param: number;
  readonly kicker: string;
  readonly statement: string;
  readonly captionPos: 'left' | 'right' | 'center';
  readonly quiet?: boolean;
  readonly note?: string;
  /** Opening phase one: the whisper line shown before the Earth reveal. */
  readonly whisper?: string;
  /** Opening phase one: the scroll invitation under the whisper. */
  readonly whisperHint?: string;
  readonly actions?: readonly SectionAction[];
  readonly summary: string;
  readonly name?: string;
  readonly meta?: readonly string[];
}

export type ExperienceEntry =
  | { readonly kind: 'stage'; readonly param: number; readonly stageId: StageId }
  | ({ readonly kind: 'prologue' } & InterstitialBase)
  | ({ readonly kind: 'moment' } & InterstitialBase)
  | ({ readonly kind: 'manifest'; readonly points: readonly SectionPoint[] } & InterstitialBase)
  | ({ readonly kind: 'epilogue' } & InterstitialBase);

/**
 * The opening sits at param 0, one key before stage 01: the camera rests on the
 * night side of Earth with the Sun's glare rimming the limb. Scrolling to the
 * first stage sweeps around into the light — the reveal is the flight itself.
 */
export const OPENING_PARAM = 0;

/** Camera parameter of the final stage — the path runs 0..14. */
export const LAST_STAGE_PARAM = JOURNEY.length;

/** Where the whisper text gives way to the hook, in camera parameters. */
export const OPENING_WHISPER_END = 0.35;
/** Where the Earth reveal is complete and the hook is fully in, in camera params. */
export const OPENING_RISE_END = 0.6;

/**
 * The landing page, in reading order. Stage entries inherit every word from
 * JOURNEY; the interstitials carry their own — they are the beats that stop the
 * page from being a planet-by-planet catalogue: departure, scale, silence,
 * orbital time, and the pull-back.
 */
export const EXPERIENCE: readonly ExperienceEntry[] = [
  {
    // OPENING — the hook: what this is, the promise, and the way in. The one
    // place the page makes its pitch outright, before the journey proves it.
    kind: 'prologue',
    id: 'prologue',
    param: 0,
    // Phase one — the whisper: the visitor is somewhere dark, close to
    // something enormous. No planet is named; the night side is on screen.
    whisper: 'You are on the night side of a world.',
    whisperHint: 'Scroll, and cross into the light',
    kicker: 'Orbital · A Solar System Journey',
    name: 'Cross the Solar System in <em>one take.</em>',
    statement:
      'One unbroken camera flight from low Earth orbit to the Sun itself — every world to scale, every frame drawn live in code.',
    meta: ['14 STAGES', '1 SUN', '8 PLANETS', '0 CUTS'],
    captionPos: 'left',
    note: 'Scroll to fly · or pick a stage from the rail',
    actions: [
      { label: 'Begin the journey', href: '#earth', solid: true },
      { label: 'Why this journey', href: '#manifest' },
    ],
    summary:
      'Opening. A cinematic scroll through the entire Solar System, from Earth to the Sun, in one continuous camera move.',
  },
  // 01 — the departure: Earth, close, personal, the start of everything.
  { kind: 'stage', param: 1, stageId: 'earth' },
  {
    kind: 'moment',
    id: 'departure',
    param: 1.5,
    kicker: 'Moment · Departure',
    statement: 'Earth falls away one kilometre at a time.',
    meta: ['29.8 KM/S', 'ESCAPE VELOCITY 11.2 KM/S'],
    captionPos: 'right',
    quiet: true,
    summary:
      'Moment. Leaving Earth: the planet recedes as the camera gathers speed and the first silence of space opens up.',
  },
  // 02 — a landmark already behind us before it is named.
  { kind: 'stage', param: 2, stageId: 'moon' },
  {
    kind: 'moment',
    id: 'inner-system',
    param: 2.5,
    kicker: 'Moment · The Inner System',
    statement: 'Four rocky worlds, inside one beam of sunlight.',
    meta: ['0.39–1.52 AU', 'MERCURY · VENUS · EARTH · MARS'],
    captionPos: 'left',
    summary:
      'Moment. The inner system: four small rocky worlds huddled close to the Sun, shown for scale against the void beyond.',
  },
  // 03 — heat, proximity, hard light.
  { kind: 'stage', param: 3, stageId: 'mercury' },
  // 04 — silent on purpose: the clouds are the content.
  { kind: 'stage', param: 4, stageId: 'venus' },
  // 05 — the scale checkpoint: the same Earth, now a dot.
  { kind: 'stage', param: 5, stageId: 'earth-orbit' },
  {
    // THE SCALE OF IT ALL — the moment the journey stops being about planets.
    kind: 'moment',
    id: 'scale',
    param: 5.4,
    kicker: 'Moment · The Scale Of It All',
    statement:
      'Every place you have ever been, and every place anyone has ever been, fits inside this frame.',
    meta: ['EARTH 12,742 KM', 'SOLAR SYSTEM 9.09 BILLION KM'],
    captionPos: 'center',
    // The mid-journey conversion beat: the only CTA between the opening and
    // the manifesto. Framed as forward motion, never as a sales interrupt.
    actions: [{ label: 'Continue to Mars', href: '#mars', solid: true }],
    summary:
      'Moment. The scale of it all: the whole of human reach, contained in a single view of the system behind the camera.',
  },
  // 06 — last rock before the debris.
  { kind: 'stage', param: 6, stageId: 'mars' },
  // 07 — through the rubble: the transition between two halves of the system.
  { kind: 'stage', param: 7, stageId: 'asteroid-belt' },
  // 08 — mass.
  { kind: 'stage', param: 8, stageId: 'jupiter' },
  // 09 — the signature moment.
  { kind: 'stage', param: 9, stageId: 'saturn' },
  {
    // Silence: no headline, no planet name. Only the emptiness between giants.
    kind: 'moment',
    id: 'silence',
    param: 9.6,
    kicker: 'Moment · Silence',
    statement: 'No signals. No landmarks. Only distance.',
    captionPos: 'center',
    quiet: true,
    summary:
      'Moment. Silence: the emptiness between the giants, with nothing to look at but space itself.',
  },
  // 10 — silent: the tilt is the sentence.
  { kind: 'stage', param: 10, stageId: 'uranus' },
  // 11 — the edge of the bright.
  { kind: 'stage', param: 11, stageId: 'neptune' },
  {
    kind: 'moment',
    id: 'orbits',
    param: 11.6,
    kicker: 'Moment · Orbital Motion',
    statement: 'Every line you can see is a year.',
    meta: ['SATURN 29.5 YEARS', 'NEPTUNE 165 YEARS'],
    captionPos: 'left',
    quiet: true,
    summary:
      'Moment. Orbital motion: the rings the camera has been flying along resolve into years — one lap of each world around the Sun.',
  },
  // 12 — out past the Kuiper Belt.
  { kind: 'stage', param: 12, stageId: 'outer' },
  {
    kind: 'moment',
    id: 'comparison',
    param: 12.6,
    kicker: 'Moment · A Sense Of Scale',
    statement: 'If the Sun were a doorway, Neptune would be a kilometre away.',
    meta: ['SUN Ø 1.39M KM', 'NEPTUNE 4.5B KM'],
    captionPos: 'right',
    summary:
      'Moment. A scale comparison: the Sun shrunk to a doorway, and how far away the last giant would still be.',
  },
  {
    // WHY THIS JOURNEY — the page's value proposition, stated once, in three
    // numbered lines instead of a feature grid. It sits after the last scale
    // beat, in the deepest dark of the flight, where the point about distance
    // lands hardest — the bridge between 'what you just felt' and 'why it was
    // worth feeling', right before the pull-back shows everything at once.
    kind: 'manifest',
    id: 'manifest',
    param: 12.8,
    kicker: 'Why this journey',
    statement: 'Not a page about planets. A flight past them.',
    captionPos: 'center',
    points: [
      {
        title: 'One journey',
        text: 'From your street to the last light, without a single cut.',
      },
      {
        title: 'True scale',
        text: 'Sizes stay relative and distances are documented — the void is the point.',
      },
      {
        title: 'Drawn live',
        text: 'No photographs, no textures. Every frame is computed as you watch.',
      },
    ],
    actions: [{ label: 'See it all at once', href: '#overview', solid: true }],
    summary:
      'Why this journey: three reasons the experience is worth taking — one continuous flight, true scale, and every frame drawn live in code.',
  },
  // 13 — the pull-back: everything, at once.
  { kind: 'stage', param: 13, stageId: 'overview' },
  // 14 — the climax.
  { kind: 'stage', param: 14, stageId: 'sun' },
  {
    // FINAL LANDING PAGE MOMENT — journey completed, value understood, action
    // available. The headline names what just happened, and the primary action
    // offers the one thing left to do with it.
    kind: 'epilogue',
    id: 'end',
    param: 14,
    kicker: 'Journey Complete',
    name: 'You\u2019ve seen the system. <em>Now feel the scale again.</em>',
    statement:
      'You are 4.5 billion kilometres from where you started, and the fastest way back is one scroll that never cuts.',
    meta: ['14 STAGES COMPLETE', 'ONE STAR', 'ONE HOME'],
    captionPos: 'center',
    note: 'Orbital — a procedurally drawn journey. No photographs, no textures.',
    actions: [
      { label: 'Begin again at Earth', href: '#earth', solid: true },
      { label: 'Linger at the overview', href: '#overview' },
    ],
    summary:
      'Ending. The journey completes at the Sun; a final statement, the expedition log of every stage, and the ways back into the experience.',
  },
];

/** Moment/interstitial ids in page order — used by the progress rail and tests. */
export const INTERSTITIAL_IDS: readonly string[] = EXPERIENCE.filter(
  (entry) => entry.kind !== 'stage',
).map((entry) => entry.id);

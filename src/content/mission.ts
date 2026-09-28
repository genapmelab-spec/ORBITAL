/**
 * mission.ts — all page copy in one place.
 * Components stay presentational; nothing here is placeholder text.
 */

export interface NavStage {
  index: string;
  label: string;
  href: string;
}

export const NAV_STAGES: ReadonlyArray<NavStage> = [
  { index: '01', label: 'Leave', href: '#leave' },
  { index: '02', label: 'Cross', href: '#cross' },
  { index: '03', label: 'Arrive', href: '#arrive' },
  { index: '04', label: 'Fly', href: '#fly' },
  { index: '05', label: 'Secure', href: '#secure' },
];

export const HERO = {
  log: 'Log 001 · Leave',
  eyebrow: 'Earth alt 408 km · Inclination 51.6°',
  titleLines: ['Beyond', 'the stars', 'Awaits you.'],
  lede: 'A new perspective on Earth begins beyond its atmosphere. Five acts of silent, weightless human flight into the uncharted cosmos.',
  primary: { label: 'Book your trip', href: '#secure' },
  secondary: { label: 'Explore mission architecture', href: '#cross' },
  readiness: 'Launch readiness: go for flight',
  readinessNote: 'Next window October 2026',
  cue: 'Initiate descent',
  telemetry: [
    { label: 'Orbital velocity', value: '7.66 km/s' },
    { label: 'Earth radius', value: '6,371 km' },
    { label: 'Inclination', value: '51.6°' },
  ],
} as const;

export const CROSS = {
  log: 'Log 002 · Cross',
  titleLines: [
    { text: 'Leave Earth.', muted: false },
    { text: 'Cross the void.', muted: false },
    { text: 'See what humans were never meant to see from the ground.', muted: true },
  ],
  body: [
    'Weightlessness transforms from an experience into a state of existence. Outside the hull, silence is absolute.',
    'Earth recedes to an electric blue pinpoint behind the quartz crystal, while three billion kilometres of vacuum unfold ahead.',
  ],
  corridor: {
    title: 'Relativistic corridor',
    value: 'Sec / 7.0',
    legend: ['Suborbital corpus — moonbase', 'Ship velocity: launch orbit — heliacal line'],
    footnote: 'Velocity sec // 0.01% corridor 7.0 sec — trajectory 9.12 km/s',
  },
  vectors: [
    {
      code: 'Vector 01',
      name: 'Trans-lunar transit',
      value: 'Δv 3.2 km/s',
      body: 'A single departure burn placed at the terminator line, where the planet’s own shadow gives the cleanest thermal window.',
    },
    {
      code: 'Vector 02',
      name: 'Heliocentric cruise',
      value: 'Burn 2.4 sec',
      body: 'Nine months of unpowered coasting on a computed arc. The only sound aboard is the ship breathing.',
    },
    {
      code: 'Vector 03',
      name: 'Orbital insertion',
      value: 'Phase 4.8°',
      body: 'One aerobrake pass converts interplanetary velocity into Mars orbit without a second engine burn.',
    },
  ],
  timeline: {
    log: 'Trajectory · 213 days',
    titleLines: [{ text: 'Between two', accent: false }, { text: 'worlds.', accent: true }],
    origin: {
      label: 'Origin / 28.5729° N 80.6490° W',
      name: 'Earth',
      meta: 'Departure complex 12 · Merritt Island',
    },
    cruise: { label: 'Cruise / unpowered', name: '213 days', meta: 'Crew 3 + guests 12' },
    destination: {
      label: 'Destination / 18.44° N 77.45° E',
      name: 'Mars',
      meta: 'Jezero Gate · berth assigned',
    },
  },
} as const;

export const ARRIVE = {
  log: 'Arrival protocol // 03',
  title: { lead: 'Mars', accent: 'Orbit' },
  live: 'Live telemetry · Jan 12 2029 · Jezero landing',
  telemetry: [
    'Estimated flight duration: 213 days ± 40 hrs',
    'Entry inclination: 18.44° equatorial',
  ],
  watermark: 'Mars',
  stats: [
    {
      index: '01',
      label: 'Distance from Earth',
      value: '225,000,000 km',
      body: 'Heliocentric arc separation maintained with zero inclination drift across the outbound leg.',
    },
    {
      index: '02',
      label: 'Surface temp (peak)',
      value: '-63° Celsius',
      body: 'Seasonal variation compensated at the habitat ring by residual heat recovery.',
    },
    {
      index: '03',
      label: 'Primary landing zone',
      value: 'Jezero Valley',
      body: 'Ancient river delta basin offering flat subsurface horizons at four integrated transit points.',
    },
    {
      index: '04',
      label: 'Atmospheric descent',
      value: 'Aerobrake PH-1',
      body: 'Hypersonic carbon decelerator decouples before the retro-propulsive touchdown burn.',
    },
  ],
  protocol: {
    eyebrow: 'Expedition protocol · Mars 4',
    body: 'Arrival windows open for private suites and planetary research residencies.',
    actions: [
      { label: 'Explore Mars habitat', href: '#fly' },
      { label: 'Plan passenger manifest', href: '#secure' },
    ],
  },
  anchor: {
    label: 'Mars / Jezero Gate',
    value: 'Alt 402 km',
  },
} as const;

export const FLY = {
  log: 'Flagship fleet / 04',
  title: { lead: 'Orbital X1', accent: 'Cruiser' },
  lede: 'Flagship twin-pillar configuration. Aerospace titanium classic glass set in high-temperature aerogel, offering an uninterrupted view of the stars from private panoramic staterooms.',
  features: [
    {
      title: 'Quad ion pulse thrusters',
      body: '28,000 km sustained manoeuvrability across four independent firings, sequenced by dual control algorithms.',
    },
    {
      title: 'Quartz panoramic domes',
      body: 'Synthetic crystalline viewing bays with 180-degree low-UV and debris-shielded panes.',
    },
    {
      title: 'Aerogel & ceramic titanium',
      body: 'Multi-layer Whipple meteoroid shielding coupled with ablative high-grade thermal race.',
    },
    {
      title: 'Tandem capacity',
      body: '12 guests and 3 flight crew. Ultra-quiet interiors, dedicated cargo hold, science-class comfort.',
    },
  ],
  telemetry: [
    { label: 'Cabin pressure', value: '101.3 kPa' },
    { label: 'Artificial gravity', value: '0.38 g cycler spin' },
    { label: 'Radiation attenuation', value: '99.9% neutral' },
    { label: 'Status', value: 'Flight certified · class A' },
  ],
  anchor: { label: 'Orbital X1 Cruiser', value: '84 m' },
} as const;

export interface Destination {
  id: string;
  name: string;
  code: string;
  window: string;
}

export const DESTINATIONS: ReadonlyArray<Destination> = [
  {
    id: 'jezero',
    name: 'Mars / Jezero Gate',
    code: 'MRS-JZ',
    window: '28-day surface residency',
  },
  {
    id: 'phobos',
    name: 'Phobos Orbital',
    code: 'PHB-OR',
    window: 'Low-gravity station berth',
  },
  {
    id: 'lunar',
    name: 'Lunar South Pole',
    code: 'LNR-SP',
    window: 'Shackleton rim transit',
  },
];

export const DEPARTURE_WINDOWS: ReadonlyArray<{ value: string; label: string }> = [
  { value: '2028-10', label: 'October 2028 · window 01' },
  { value: '2029-01', label: 'January 2029 · window 02' },
  { value: '2029-04', label: 'April 2029 · window 03' },
  { value: '2029-08', label: 'August 2029 · window 04' },
];

export const PASSENGER_COUNTS: ReadonlyArray<{ value: string; label: string }> = [
  { value: '1', label: '1 passenger (single suite)' },
  { value: '2', label: '2 passengers (twin suite)' },
  { value: '3', label: '3 passengers (family pod)' },
  { value: '4', label: '4 passengers (full pod)' },
];

export const SECURE = {
  log: 'Reservation manifest // Expedition 2028-2029',
  title: { lead: 'Claim your seat at the', accent: 'Horizon.' },
  lede: 'Orbital transit berths are strictly curated to 12 travellers per window. Complete the clearance telemetry below to initiate flight evaluation.',
  fields: {
    destination: { index: '01', label: 'Destination target' },
    window: { index: '02', label: 'Departure window' },
    passengers: { index: '03', label: 'Traveller count' },
    name: { index: '04', label: 'Primary passenger legal identity' },
    email: { index: '05', label: 'Encrypted comms frequency (email)' },
  },
  notices: [
    { tone: 'ember', text: '3-axis centrifuge flight training included in every mission tier.' },
    { tone: 'dim', text: 'Private orbital suite allotted upon clearance confirmation.' },
  ],
  submit: 'Reserve your seat // Initiate clearance',
  footnote: 'Encrypted TLS 1.3 · quantum-safe manifest',
  success: {
    title: 'Clearance lodged.',
    body: 'Your manifest has been transmitted to mission control. A flight surgeon will open your comms channel within two windows.',
    log: [
      { key: 'Manifest', value: '#' },
      { key: 'Destination', value: '#' },
      { key: 'Window', value: '#' },
      { key: 'Travellers', value: '#' },
    ],
    reset: 'File another manifest',
  },
} as const;

export interface FooterColumn {
  title: string;
  body?: string;
  items: ReadonlyArray<string>;
}

const FOOTER_COLUMNS: ReadonlyArray<FooterColumn> = [
  {
    title: 'Orbital transit systems',
    body: 'Position: Apex Station, low Earth orbit. Departure complex 12, Merritt Island. Flight ops: Orbital Mission Control, Houston.',
    items: [],
  },
  {
    title: 'Mission status',
    items: ['Safety protocols', 'Crew manifests', 'Habitation', 'Fleet certification'],
  },
  {
    title: 'Windows',
    items: ['October 2028', 'January 2029', 'April 2029', 'August 2029'],
  },
  {
    title: 'Transmission',
    items: ['ops@orbital.example', '+1 281 000 4080', 'Channel 09 · 24h', 'Lunar relay 4'],
  },
];

export const FOOTER = {
  wordmark: [
    { text: 'Earth /', tone: 'plain' },
    { text: 'Departure /', tone: 'ember' },
    { text: 'Elsewhere', tone: 'ghost' },
  ],
  columns: FOOTER_COLUMNS,
  status: 'Sys online · Earth sys',
  legal: '© 2026 Orbital Space Transit Systems Inc. All rights reserved.',
  links: [
    { label: 'Privacy', href: '#secure' },
    { label: 'Terms of transit', href: '#secure' },
    { label: 'Heritage', href: '#leave' },
  ],
} as const;

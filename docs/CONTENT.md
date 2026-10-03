# CONTENT — ORBITAL

The page's script, in order. `src/content/experience.ts` is the single source;
this document explains it and records where the numbers come from.

## Writing rules

1. One fact and one explanation per destination. Never two facts, never a
   paragraph.
2. Numbers must be real, checkable, and attributed below. No invented figures, no
   rounded-to-impressive numbers.
3. No "explore the universe like never before" language. If a line could appear
   on any space website, it is rewritten.
4. Second person only where the sentence is about the visitor's own position
   ("You are riding a planet…"). Otherwise the model speaks for itself.
5. Mono type is for data and labels; sentences are never set in it.

## The script

### Entry — the window

- Whisper: **Somewhere above the night side.**
- Eyebrow: `ORBITAL`
- Strapline: `A live model of the Solar System`
- Headline: **The Solar System, running _for real._**
- Support: *No photographs. No textures. Every world sits where it actually is
  today, drawn live as you fly past — one unbroken camera move from a window
  above Earth to the surface of the Sun.*
- Primary CTA: *Begin the flight* → `#earth`
- Secondary CTA: *What am I looking at?* → `#premise`
- Meta: `6 destinations · 0 photographs · positions computed for {today}` — the
  date is filled in from the visitor's own clock.

### Premise — why it exists

- Kicker: `WHY ORBITAL EXISTS`
- Title: **Scale is not something you can read.**
- Body: *Every diagram of the Solar System is compressed to fit a page:
  distances rescaled, orbits flattened into one tidy frame. ORBITAL keeps the
  model running instead — real positions, real orbital periods, one continuous
  crossing — so distance and mass arrive as experience rather than as figures.*
- Claims:
  1. **Positions, not pictures** — *Every body is placed from its own orbital
     elements, computed for the date you are reading this.*
  2. **Surfaces drawn, not photographed** — *Nothing here is an image file.
     Detail is generated in the shader, so it holds up wherever you fly.*
  3. **One continuous camera** — *No cuts, no dissolves, no reset between
     sections. The flight never stops moving.*
- CTA: *Begin the flight*

### Acts

- **I — Departure**: *Two worlds we have actually stood on, and the line where
  that stops being true.*
- **II — Crossing**: *Past the last measured thing, where the belt stops looking
  like a wall and starts looking like distance.*
- **III — Mass and light**: *Two objects that own almost everything else in the
  system.*

### Destinations

| # | Name | Fact | Explanation | Annotation |
| --- | --- | --- | --- | --- |
| 01 | **Earth** | You are riding a planet that covers 940 million kilometres a year. | Around 107,000 km/h around the Sun, and entirely unfelt from the surface. This is the only world on the flight with a horizon you recognise. | `EARTH · 1 AU · 107,000 KM/H` |
| 02 | **Moon** | Three days from home, and still the farthest a human has stood. | Apollo 8 crossed that gap in 1968. Every crewed flight since has been a longer version of the same trip. | `MOON · 384,400 KM · 3 DAYS` |
| 03 | **Mars** | Everything humans have ever driven on Mars adds up to under 100 km. | You will cover that distance in this flight before the next station arrives. | `MARS · 1.52 AU · 687-DAY YEAR` |
| 04 | **Asteroid Belt** | It looks crowded and is almost empty — the entire belt holds about 4% of the Moon's mass. | It is not a wall. It is the place where familiar measurements stop working, and rock starts behaving like weather. | `ASTEROID BELT · 2.2 – 3.2 AU` |
| 05 | **Jupiter** | About 1,300 Earths would fit inside it. | Every other planet in the system could fit inside Jupiter at once. Its gravity has been shaping the inner system since before Earth existed. | `JUPITER · 5.2 AU · 318 EARTH MASSES` |
| 06 | **Sun** | 99.86% of the mass you just crossed is behind that light. | A photon leaving the surface reaches the window you started in eight minutes and twenty seconds later. | `SUN · 99.86% OF THE MASS` |

### Control — the model, unscripted

- Kicker: `THE MODEL, UNSCRIPTED`
- Title: **Take the controls.**
- Body: *The flight you just moved through was written in advance. The model was
  not. Move the date and every world travels to where it actually will be — each
  one at its own orbital speed.*
- Label: `Set the date` · readout: day offset + ISO date · live metric:
  `Earth → Mars · {n} AU`
- Actions: *Back to today*, *Restart from the window*, *Copy the flight link*
- Without WebGL: *The scene needs WebGL. The model is still running in the
  numbers above.*

### Close

- Statement: **The model is still running.**
- Meta: `149.6 million kilometres · one scroll · zero photographs`
- Actions: *Fly it again*, *Copy the flight link*
- Colophon: *ORBITAL — a live model of the Solar System. Positions computed in
  your browser from J2000 orbital elements. No photographs, no textures, no
  tracking.*

### Navigation

`ORBITAL` · `Why ORBITAL` · `01 EARTH` · `02 MOON` · `03 MARS` · `04 BELT` ·
`05 JUPITER` · `06 SUN` · `Controls`

## Sources for every number

| Claim | Source |
| --- | --- |
| 940 million km per year; ~107,000 km/h | Earth's orbital circumference (2π × 1 AU = 9.4 × 10⁸ km) over 365.25 days; mean orbital speed 29.78 km/s |
| 1 AU = 149.6 million km | IAU definition of the astronomical unit |
| Moon: 384,400 km; three days | Mean Earth–Moon distance; Apollo 8, December 1968 |
| Mars: under 100 km driven | Cumulative distance of every Mars rover to date (~85 km: Opportunity 45.2, Curiosity ~32, Spirit 7.7, Sojourner 0.1) |
| Mars: 1.52 AU, 687-day year | JPL approximate orbital elements |
| Belt: 2.2 – 3.2 AU | Extent of the main asteroid belt |
| Belt mass ≈ 4% of the Moon | Belt total mass ~2.4 × 10²¹ kg vs the Moon's 7.35 × 10²² kg |
| Jupiter: 1,300 Earths; 318 Earth masses; 5.2 AU | Jupiter's volume and mass relative to Earth; JPL elements |
| Sun: 99.86% of the system's mass | Standard solar-system mass fraction |
| Sun: light takes 8 min 20 s | 1 AU / c = 499 s |
| Positions are real for the date | JPL approximate Keplerian elements referred to J2000.0, solved at run time (`src/three/systems/epoch.ts`) |

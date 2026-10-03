# TECHNICAL — ORBITAL

Astro 7 (static) · Tailwind v4 · TypeScript (strict) · Three.js · GSAP +
ScrollTrigger. No backend, no runtime network calls, no framework on the client.

## 1. Architecture

```
docs/                     this documentation set
tools/check-layout.mjs    the contract check — runs the real camera maths in Node
src/
├── content/experience.ts       the spine: sections, copy, camera parameters
├── three/
│   ├── camera/anchors.ts       layout contract: scale, bodies, keys, composition
│   ├── camera/path.ts          eased segments, clearance routing, reduced-motion cuts
│   ├── scene/OrbitalScene.ts   one renderer, one loop, quality governor
│   ├── scene/world.ts          scene graph assembly and epoch wiring
│   ├── objects/                window, planet, sun, belt, orbits, starfield, dust
│   ├── effects/annotations.ts  projected spatial labels
│   ├── systems/                epoch, quality, random, palette
│   ├── shaders/                surface, atmosphere, sun, points, rock, common
│   └── types.ts                FrameContext and the SceneObject contract
├── scripts/
│   ├── boot.ts     entry: page scripts immediately, scene lazily
│   ├── scroll.ts   scroll → camera parameter, with per-section holds
│   ├── store.ts    the shared scroll state
│   ├── chrome.ts   navigation behaviour (3 s idle retract, wake on intent)
│   ├── motion.ts   opening reveal, scroll reveals, veil
│   ├── time.ts     date control and live readouts
│   └── share.ts    clipboard-only share
├── components/     Canvas, Chrome, Entry, Premise, Act, Station, Control, Close
├── layouts/Base.astro   shell, fonts, pre-paint probe
├── pages/index.astro    renders the spine in order
└── styles/         tokens, base, sections, global
```

Data flows one way: `content/experience.ts` → components (build time) and
scripts/scene (run time). The camera contract in `three/camera/anchors.ts` reads
the same parameters, so the page and the flight cannot drift apart.

## 2. The epoch model

`src/three/systems/epoch.ts` is free of Three.js and runs in the browser, in
Node (the checker), and nowhere else.

- **Elements.** JPL approximate Keplerian elements for Earth, Mars and Jupiter,
  referred to J2000.0, with per-century rates (valid 1800–2050).
- **Solving.** Mean anomaly → eccentric anomaly (Newton, 8 iterations, 1e-9) →
  orbital plane → ecliptic frame. Honest Kepler, not a decorative circle.
- **Compression.** Distances are compressed once, radially:
  `scene = 30 × AU^0.66`. Direction from the Sun is exact; only the radius is
  eased, so a planet is always on its true bearing. Radii are compressed
  separately: `scene = 0.9 × (km / 6371)^0.42`, which is why the Sun is 6.46
  scene units rather than 98.
- **Documented departures.** The Moon is drawn 2.6 scene units from Earth (its
  real distance is 0.0026 AU) with a live 27.32-day phase; the belt is a live
  field of 1,500 rocks whose angular rates come from Kepler's third law, so the
  inner edge visibly outruns the outer edge.
- **Orbit guides** are each body's real ellipse for the date, sampled from the
  same elements — a planet can never sit off its own line.
- **Light** falls off physically, floored at 34% so the outer system stays
  readable: `intensity = 0.66 / r² + 0.34`, applied per body from its real AU.

## 3. The camera contract

Ten keys, one per destination mode, defined in `anchors.ts`:

`entry 0` · `earth 1` · `transit-moon 1.5` · `moon 2` · `mars 3` · `belt 4` ·
`jupiter 5` · `ascent 5.5` · `sun 6` · `overview 7`

A key states **where its subject must land on screen** (`frameX`, `frameY`,
normalised device coordinates) and how far away the camera sits.
`composeCamera()` solves the camera position analytically from that:

```
C = S − forward·d − right·(frameX·halfW) − up·(frameY·halfH)
```

so the subject is *guaranteed* to be on its mark; nothing is hand-tuned by eye,
and the composition can be asserted in Node across many dates.

- **Relative keys** are composed from the subject's live position (entry, earth,
  transit-moon, moon, mars, belt, jupiter), so a shot stays composed while the
  system moves. `overview` is absolute; `ascent` and `sun` are fixed-direction.
- **Look rules** decide the camera's bearing: `outward` (lit portrait, stars
  behind), `inward`, `tangent` (across the orbit — used for Mars so the
  departure cannot cut through it), `twilight` (just past the terminator — the
  hero), `fixed`. A key may override the rule with a reference body: the Moon is
  viewed along the tangent of the Earth–Moon line, which keeps Earth out of frame.
- **Portrait bias** multiplies distance by 1.14 and lateral framing by 0.72 (with
  per-key overrides), so a phone gets a wider, calmer shot rather than a crop.
- **Clearance routing.** Chords between two points of a circular system cut
  across it: at some dates the straight line from Mars to the belt passes within
  a solar radius of the Sun, and the opening move can brush the Moon. Every
  segment is therefore routed — a quadratic bend away from the offending body,
  verified numerically while routing, cached per epoch and viewport, and checked
  again from the outside by `tools/check-layout.mjs`.
- **Hold and release** live in `scroll.ts`, not in the camera: each section
  contributes a stop where its key is reached and a stop where the camera may
  leave.
- **Reduced motion** replaces the path with the nearest whole key: `sampleCamera`
  returns a composed still, and the scene only re-renders when something changes.

## 4. The scene

- **One renderer, one loop.** `OrbitalScene.ts` owns the `WebGLRenderer`, the
  `PerspectiveCamera`, the clock and the damped parameter (7 Hz), and nothing
  else renders. The loop is `requestAnimationFrame`; the tab being hidden stops
  it, a context loss stops it, `dispose()` tears it down.
- **One draw per thing.** Bodies are single spheres; the atmosphere is one more
  sphere; the belt is one instanced draw of 1,500 rocks; stars and dust are point
  clouds; the orbit guides are five line loops.
- **Analytic lighting.** No `Light` objects anywhere: the Sun's direction and
  colour arrive as uniforms, so every body costs the same and nothing has to be
  re-lit when the date changes.
- **The opening module** is parented to the camera: hull with a rounded aperture
  cut out of it (rebuilt per aspect ratio), a rim that catches the Sun through a
  signed-distance shader, a sill with three instrument lights. It leaves by
  opening outward and fading — no cut.
- **Quality tiers.** `high / medium / low` control pixel ratio (2 / 1.6 / 1),
  star count, dust, asteroid density, atmosphere shells and antialiasing. The
  starting tier comes from coarse capability signals (cores, memory, pointer
  type, width) — never a user-agent string. The governor watches a 90-frame
  window: below 46 fps it drops a tier, above 58 fps it climbs back, with a 5 s
  cooldown. Both thresholds are capped by the display's own rate, learned from
  the fastest frame in each window (the compositor can never tick faster than
  the display): a stable 30 fps on a 30 Hz panel is the goal, not a failure, so
  such a display is judged against ~27 fps instead of being pinned to the
  lowest tier forever. The first window is calibration and uses the fixed
  thresholds; the current tier is readable at `scene.tier`.
- **Disposal.** Every object exposes `dispose()`; the scene disposes the world,
  the annotations, the renderer and its listeners.

## 5. Interface and world as one system

`three/effects/annotations.ts` positions each destination's label every frame by
projecting the body's real position, offsetting it clear of the body's projected
radius, and drawing a hairline back toward it. Labels fade with the camera
parameter (±0.34 around their key), never render below 768 px, and are
`aria-hidden` — the section copy is the accessible source of the same
information.

## 6. Accessibility

- Canvas `aria-hidden`; the stage is `pointer-events: none`.
- An `sr-only` scene summary describes the model for screen readers.
- One `h1` (the hero), `h2` per section, `h3` inside the premise.
- Navigation is a landmark; the current section is `aria-current="true"` and the
  position is also printed as text plus an `sr-only` sentence.
- The date control is a native range input with a `<label>`, an `<output>` and
  `aria-describedby`; the readouts update in place.
- Focus is always visible (`--focus-ring`, a solar ring on the void).
- Retraction never happens while focus is inside the chrome.
- Reduced motion and no-WebGL paths are described in `docs/UX.md`.

## 7. Performance budget

| Budget | Target | Built |
| --- | --- | --- |
| Initial JS (gzip) | ≤ 60 KB | ~51 KB |
| Lazy scene chunk (gzip) | ≤ 210 KB | ~144 KB |
| CSS (gzip) | ≤ 22 KB | ~6 KB |
| HTML | — | ~15 KB |
| Draw calls | < 60 | ~15 |
| Device pixel ratio | ≤ 2 | per tier |

Techniques: the scene is `import()`-ed after first paint (idle callback with a
fallback timer); geometry is seeded and deterministic; buffers are allocated once
at the highest tier and revealed by draw range; there is no post-processing pass;
no textures are loaded, because there are none.

## 8. Verification

```bash
npm install
npm run check        # astro check + layout/content contract
npm run check:layout # camera, composition and content only
npm run build        # production build into dist/
npm run preview      # serve dist/
```

`tools/check-layout.mjs` imports the project's own TypeScript modules (Node's
type stripping — no bundling step) and asserts, across **5 dates spanning three
years × 3 viewports (1440×900, 834×1112, 390×844)**:

- the spine: 13 unique sections, non-decreasing parameters, every station on its
  key's parameter, caption side opposite the subject's framing side, the act and
  destination counts, opening pacing monotonic;
- the keys: ascending parameters, sane fields of view, `frameX` matching each
  station's caption side, parameters agreeing with the spine;
- the compositions: every subject lands exactly on its declared `frameX/frameY`
  (±1e-6), in front of the camera, at its expected on-screen size band (`SIZE_BANDS`
  — the hero is a limb, Jupiter fills more than half the frame, the transits are
  wide), and the camera holds its axial distance;
- the Sun never appears in a planet portrait or in the hero;
- the hero is a limb, not a portrait: Earth's projected radius ≤ 0.46 and its top
  edge ≤ −0.12;
- the Moon shot keeps Earth out of frame;
- the flight never clips a body: 400 samples per viewport keep ≥ 1.15 × radius +
  0.05 away from every body at every sampled date;
- reduced motion is a still key, not a half-travelled camera: `sampleCamera(…, true)`
  equals `composeCamera(nearestKey(…))` exactly at nine sample points.

Current state: **1143/1143 checks pass.**

`window.__ORBITAL_DEBUG__` exposes `{ scene, probe }` after boot — enough to confirm
whether the scene loaded, drive its parameter or epoch, read the current quality
tier (`scene.tier`), or read the pre-paint probe. Nothing else about the page is
reachable from the console.

The page accepts one query parameter: `?date=YYYY-MM-DD` (UTC ISO, the only date
format the page prints) sets the time control to that day, clamped to the
slider's own ±1095-day range, and the address bar keeps tracking the chosen
date afterwards — `history.replaceState`, no navigation, no scroll jump. Because
the scene is imported lazily *after* the time control has run, boot remembers the
requested epoch and replays it onto the scene the moment it exists; the hero's
"positions computed for …" line follows the model, not the clock. Copying the
flight link therefore always shares the exact moment on screen.

## 9. Local notes and limitations

- The Moon's distance and the radial compression are approximations, documented
  above; they are the only places the model knowingly departs from the sky.
- Rotation is decorative-plus-date-driven; the copy never claims otherwise.
- Fonts load from Google Fonts (preconnected). Self-hosting is the next
  performance step (`docs/ROADMAP.md`).
- The share action copies the URL only — there is no server to shorten it.

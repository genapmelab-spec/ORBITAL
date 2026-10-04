# COMPONENTS — ORBITAL

Every component in the project, what it owns, and what it may not do. Names are the
exported symbols; paths are from the repository root.

## 1. The shell

| Component | File | Owns | Must not |
|-----------|------|------|----------|
| `App` | `src/App.tsx` | The document order: skip link, `Chrome`, the scene slot, the aperture, `main` (Hero → Instrument → 8 × `Rung` → Close), `Ruler`, `IndexPanel`, `Boot`, `Hud`. Runs the rAF loop that writes `--aperture`, `data-hero` and `activeRung`; delays the scene import; honours a deep link | Render any rung copy itself; assume WebGL |
| `SceneBoundary` | `src/App.tsx` | A class error boundary around the lazy scene | Show an error to a visitor — its only fallback is `CssSky` |
| `Boot` | `src/ui/Boot.tsx` | A three-line instrument log (`optics ·· aligning`, `photon path ·· traced`, `ladder ·· 8 rungs`), one line every 300ms | Trap the page: `aria-hidden="true"`, clears on `ready` + 420ms *and* on a 1900ms hard timer |
| `Hud` | `src/ui/Hud.tsx` | The `?hud=1` readout: tier, fps, worst frame, rung position, current look-back | Exist in a normal visit; it returns `null` unless `hud` is set, and is `aria-hidden` |

## 2. Chrome and navigation

| Component | File | Owns | Contract |
|-----------|------|------|----------|
| `Chrome` | `src/ui/Chrome.tsx` | The header: wordmark → `#top`, a live `aria-live="polite"` line (`1.28 s ago · The Moon`, or *Opening*), and the Index button with `aria-expanded` / `aria-controls` | Retracts after 3s without intent (`useRetract`), wakes on scroll-back (≥6px up), pointer in the top 110px, Tab, focusin. Never retracts while the index is open |
| `Ruler` | `src/ui/Ruler.tsx` | The look-back scale: `look-back` label, a live `textContent` readout, eight `<button>` marks at true log positions, a progress rail | Marks are real buttons in an `<ol>` inside `<nav aria-label="The look-back ladder">`; active mark gets `aria-current="true"`; each carries an `sr-only` full sentence. Clicking scrolls (`smooth`, or `auto` when reduced) then calls `update()` |
| `IndexPanel` | `src/ui/IndexPanel.tsx` | The dialog: `role="dialog" aria-modal="true"` labelled *The ladder index*, `hidden` when closed, all eight rungs as links (`arrow`, `name`, `label`) each carrying its rung's `--accent`, and a close button | Every row is a real `<a href="#{id}">`, so the browser performs the jump itself — smooth from `html { scroll-behavior }`, instant under reduced motion — and the row can be copied or opened in a new tab; hover and `:focus-visible` wash the row in its rung's accent. On open, focus the first link; `Escape` closes; the backdrop is a button with `tabIndex={-1}` and the sheet paints above it (`z-index`), so every row is reachable by pointer as well as by keyboard; following a link closes the sheet |

## 3. Content

| Component | File | Owns | Contract |
|-----------|------|------|----------|
| `Hero` | `src/ui/Sections.tsx` | The opening frame: the Moon plate (`1.28 s` / *The Moon*), the whisper sentence, the identity block (mark, tagline, strapline, body, two anchors, meta line), the scroll cue | Identity is revealed by CSS through `[data-hero='open']`, so it exists in the DOM from first paint. Two anchors only: `#moon` and `#instrument` |
| `Instrument` | `src/ui/Sections.tsx` | The reading-rules `<dl>` (number / scenes / experiments), the honesty note, and — when `noWebgl` — the fallback note | Copy comes from `COPY.instrument`; this is the only place the scale compression is admitted, and it is admitted plainly |
| `Rung` | `src/ui/Rung.tsx` | One `<section id data-rung class="rung rung-left|right">` with a sticky plate: `NN /08` + label, numeral + unit, name, fact, explanation, `<Experiment>`, source | Sets `--accent` from `rung.accent` and `--color-accent-*` from the token file. Reveals once at 84%. Alternates side by array index, so the DOM order is the ladder order |
| `Close` | `src/ui/Sections.tsx` | The last screen: kicker, statement, lede, *Look again* → `#top`, *Copy this rung* (clipboard + "link copied" state), colophon | The copy control links to the *active* rung (or First Light), and removes itself if `navigator.clipboard` is missing or the write rejects — no fake success |
| `Experiment` | `src/ui/Experiment.tsx` | The mechanism shell: kicker, one of `Pulse` / `Scrub` / `Choice`, the `result` sentence and the `detail` line | Splits *pulse* and *scrub* from *compare* and *toggle* by `experiment.mechanism`. Every branch writes its conclusion to the DOM whether or not the scene exists |

## 4. The four mechanisms in the DOM

| Piece | Mechanism | DOM contract |
|-------|-----------|--------------|
| `Pulse` | Moon, Voyager 1 | A `<button>` (disabled while running or without WebGL) whose label becomes *In flight* / *In transit*; a `data-on` live dot; a clock span the rAF loop writes (`2.56 s of 2.56 s · 100%`); an `sr-only aria-live="polite"` span that announces *Ready.* → the result; Voyager additionally prints the sent / arrives / earliest-reply timestamps |
| `Scrub` | Sun, First Light | A `<label>` + `<input type="range" min=0 max=1 step=0.01>`; `aria-valuetext` carries the current phase caption so a screen reader hears the physics, not "0.62"; a visible caption does the same for everyone else |
| `Choice` | Betelgeuse, Galactic Centre, Crab, Andromeda | A `role="group"` of `<button aria-pressed>`; the chosen option's note appears as a caption; an `sr-only` live region repeats it |

State contract (`ExpState`): one experiment is active at a time; `running` and
`firedAt` exist only for pulses; `progress` only for scrubs; `phase` is `'idle'`, an
option id, or `'done'`. The scene reads it imperatively.

## 5. The scene

| Component | File | Owns | Contract |
|-----------|------|------|----------|
| `Stage` (default) | `src/scene/Stage.tsx` | The only `<Canvas>`: `dpr = min(tier.dpr, devicePixelRatio)`, `frameloop` `always`/`never` by `document.hidden`, `antialias` off at tier low, the clear colour from `--color-void`, the QC hook under `?hud=1`, and the render loop for `Scene` + `Governor` | `aria-hidden` is set by its parent `div.stage`. It must not be the source of any text |
| `Scene` | `src/scene/Stage.tsx` | The object list: `CameraRig`, `Starfield`, `Thread`, and the eight rung components | Reports `ready` on its first frame |
| `Governor` | `src/scene/Stage.tsx` | Frame-time sampling and the one-step-at-a-time tier changes | Never touches copy, order, or the active mechanism |
| `CameraRig` | `src/scene/CameraRig.tsx` | The camera: damping, frame interpolation, portrait bias, pointer parallax, `publishCamera`, and the `shared` uniforms (`uTime`, `uCamera`, `uTravel`) | Reads `live` and the store; writes only the camera and uniforms |
| `Starfield` | `src/scene/Starfield.tsx` | The carried sky: one point cloud, 45% banded, positions copied from the camera each frame | Disposes its geometry and material on unmount |
| `Thread` | `src/scene/Thread.tsx` | The ribbon + motes: `SPAN = 5920`, motes drifted forward in the position buffer each frame, ribbon hidden at tier low | The same `useFrame` owns both, so the ribbon and the motes can never desynchronise |
| `Moon`, `Sun` | `src/scene/rungs/worlds.tsx` | Rungs 0–1 objects, surfaces, coronae, the laser and the photon | `useRung(i)` sleep band; experiment state read via `getState()` |
| `Betelgeuse`, `Crab` | `src/scene/rungs/stars.tsx` | Rung 3 (breathing star, shockwave), rung 4 (filaments, guest star, pulsar, beams) | Same |
| `Core`, `Andromeda` | `src/scene/rungs/deep.tsx` | Rung 5 (dust cloud, band, photon ring, shadow), rung 6 (spiral, bulge, arriving wavefront) | Same |
| `Voyager` | `src/scene/rungs/Voyager.tsx` | Rung 2: dish, bus, boom, RTG, mast, signal ring, one-way pulse | Schematic by design |
| `FirstLight` | `src/scene/rungs/FirstLight.tsx` | Rung 7: the `BackSide` shell the camera is inside, plus the mote cloud; `uTemp` from the scrub | Same |
| `parts.tsx` | `src/scene/rungs/parts.tsx` | `useRung` (±1.15 sleep band), `usePulse`, `Billboard`, `Body` | Shared primitives only; no story logic |

## 6. Shared modules

| Module | File | Owns |
|--------|------|------|
| `RUNGS`, `SPINE_GAP`, `byId` | `src/content/ladder.ts` | The script, the frames, the experiment specs |
| `COPY` | `src/content/copy.ts` | Every string that is not a rung: hero, instrument, close, chrome, boot lines, the *why a ladder* note |
| `live`, `measure`, `update`, `lookbackAt`, `publishCamera`, `startScrollTracking` | `src/lib/scroll.ts` | The scroll → rung mapping |
| `TIERS`, `detectTier`, `stepDown`, `stepUp` | `src/lib/quality.ts` | The tier table and the capability probe (coarse pointer, core count, width — no user-agent sniffing) |
| `FORCE`, `isReduced`, `DUR`, `revealBatch`, `gsap`, `ScrollTrigger` | `src/lib/motion.ts` | The reduced-motion decision and the one reveal helper |
| `formatLookback`, `spokenLookback`, `formatMoment`, `formatMomentTime` | `src/lib/format.ts` | Seconds → printed units, and the spoken equivalents |
| `shared`, `FRAME` | `src/scene/shared.ts` | The shared uniform objects and the camera frustum constants |
| `TOKENS`, `ACCENTS`, `C`, `accentColor`, `SURFACE`, `CRAFT`, `LIGHT` | `src/scene/palette.ts` | The runtime mirror of `tokens.css` (read with `getComputedStyle`), plus the surface/craft/light colours that belong to objects |
| `create*Material`, `seededPositions` | `src/scene/shaders/materials.ts` | Every shader in the project |
| `NOISE`, `CIRCLE` | `src/scene/shaders/glsl.ts` | The shared GLSL kit |

## 7. Rules a new component must follow

1. **Text is DOM, never canvas.** If a component needs to say something, it renders
   an element; the scene is `aria-hidden` and decorative by construction.
2. **Colour comes from tokens.** A hex literal in a component fails
   `check:content`. If a value is missing, it goes in `tokens.css` and
   `palette.ts`.
3. **No new dependency without a reason that survives review.** The current list is
   react, react-dom, three, @react-three/fiber, zustand, gsap and three fontsource
   packages — nothing else.
4. **Animation state lives in the store; animation itself lives in `useFrame`.**
   A component must not call `setState` per frame.
5. **Every component must render something readable with the scene absent.**
   `?nowebgl=1` is the test.
6. **A new rung is data plus a scene component** — not a new page, not a route.

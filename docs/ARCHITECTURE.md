# ARCHITECTURE — ORBITAL

> Note: this document describes the current build (Vite + React + three). An
> earlier Astro/vanilla-three prototype used to live in this repository; it was
> replaced, and its files are only in git history.

## 1. Shape

```
content/      ladder.ts — the eight rungs (one source of truth)
              copy.ts   — every string that is not a rung
lib/          scroll.ts — document measurement → continuous rung position
              quality.ts — the tier table and the capability probe
              motion.ts — reduced-motion decision, gsap setup, reveal helper
              format.ts — seconds → human units, spoken + printed
state/        store.ts  — one zustand store: tier, reduced, noWebgl, hud,
                          activeRung, indexOpen, exp
ui/           Chrome, Boot, Hud, IndexPanel, Ruler, Rung, Sections, Experiment,
              fallback/CssSky
scene/        Stage (the only canvas), CameraRig, Starfield, Thread, shared,
              palette, shaders/{glsl,materials}, rungs/*
styles/       tokens.css (all colour + type), fonts.css (@font-face), global.css
```

Dependencies point one way: `content → lib → state → ui|scene`. Nothing in
`content/` imports React, three or the DOM; nothing in `scene/` imports `ui/`. The
two halves of the page meet in exactly two places: the store, and the CSS custom
properties that `scene/palette.ts` reads at runtime.

## 2. One source of truth for the script

`src/content/ladder.ts` holds the `RUNGS` array. Each rung carries its copy
(`value`, `unit`, `arrow`, `fact`, `explanation`, `source`), its camera frame
(`frame.pos`, `frame.look`), its accent name, its scene placement (array index →
`z = -index * SPINE_GAP`), and its `experiment` spec.

Everything downstream is derived:

| Consumer | Uses |
|----------|------|
| `ui/Rung.tsx` | copy, index, label, accent, experiment |
| `ui/Ruler.tsx` | `seconds` (log positions), `arrow`, `name` |
| `ui/Chrome.tsx`, `ui/IndexPanel.tsx` | `arrow`, `name`, `label`, `index` |
| `scene/CameraRig.tsx` | `frame`, `SPINE_GAP` |
| `scene/rungs/*.tsx` | positions (`-SPINE_GAP * i`), active rung test |
| `vite.config.ts` | builds the `<noscript>` ladder into `index.html` |
| `tools/check-budget.mjs` | asserts every rung name survives the build |
| `tools/check-content.mjs` | asserts docs/CONTENT.md agrees, verbatim |

Adding a rung means: one entry in `RUNGS`, one section table row in
`docs/CONTENT.md`, one scene component, and a mechanism spec. The camera, the
ruler, the index, the noscript copy and the gates all follow automatically.

## 3. The scroll → camera pipeline

```
window.scrollY
   │  (scroll / resize / ResizeObserver → requestAnimationFrame, passive)
   ▼
lib/scroll.ts  measure()  → keys: [{y, t, travelling, hero}]
               update()   → live.target, live.hero, live.rung, live.travelling
   ▼
scene/CameraRig.tsx (useFrame)
   live.camera = damp(live.camera, live.target, 5.5, dt)      // or snap if reduced
   frameAt(live.camera, portrait) → pos, look, z
   camera.position / camera.lookAt
   shared.uTime, shared.uCamera, shared.uTravel updated
   ▼
shaders/materials.ts — the same uniform objects are shared by every material
```

Three properties are worth keeping:

1. **The measurement is a list of keys, not a formula.** `measure()` reads the real
   offsets of the real sections (viewport height included), sorts the keys, and
   forces strict ascent (a duplicate `y` is nudged by 0.5px). Sections can be
   re-ordered or resized without touching the camera code. `ResizeObserver` on the
   document means a phone rotating or a font finishing its load re-measures.
2. **Rung position is continuous.** `live.target` is a float; whole numbers are the
   holds, fractions are the flights. The scene never knows about pixels, and the
   DOM never knows about the camera.
3. **Uniforms are shared by reference.** `shared.uTime` is one object; every
   `ShaderMaterial` that needs the time points at that object. The frame loop
   writes it once. No per-material bookkeeping, no React re-renders per frame.

## 4. Why there is only one canvas

React owns the document; three owns the canvas. The canvas is created by
`@react-three/fiber` inside `scene/Stage.tsx`, mounted into a `div.stage` that is
`position:absolute; inset:0;` and `aria-hidden="true"`. Everything else in the page
is ordinary DOM: no R3F text, no HTML-in-canvas tricks, no second renderer. That
keeps the accessible tree, the layout, the fonts and the fallbacks all in one
place, and it means the scene can fail without the page failing.

`Stage` is loaded with `React.lazy(() => import('./scene/Stage'))`, and the import
is triggered from `requestIdleCallback` (timeout 1200ms) so the first paint is
never blocked by three. A `SceneBoundary` around it renders `CssSky` if the chunk
throws.

## 5. State

`src/state/store.ts` is a single zustand store:

| Field | Set by | Read by |
|-------|--------|---------|
| `tier` | `detectTier()` at boot; `Governor` | Stage (`dpr`, scene counts), `Hud` |
| `reduced` | `isReduced()` (`prefers-reduced-motion` or `?motion=reduce`) | CameraRig, Rung reveals, Ruler/IndexPanel scroll behaviour |
| `noWebgl` | a capability probe at boot, or `?nowebgl` | App (Stage vs CssSky), Experiment controls |
| `hud` | `?hud=1` | `Hud`, the QC hook in `Stage` |
| `ready` | the scene's first frame | `Boot` |
| `activeRung` | the rAF loop in `App.tsx` | Chrome, Ruler, IndexPanel, CssSky, Close |
| `indexOpen` | the Index button / Escape / backdrop | Chrome, IndexPanel |
| `exp` | the experiment controls | the scene's frame loops, the HUD's announcements |

Two deliberate choices:

* **`exp` is read imperatively inside `useFrame`** (`useOrbital.getState().exp`).
  Dragging a slider or firing a pulse must not re-render the canvas tree; the scene
  samples the current state 60 times a second instead of subscribing to it.
* **`activeRung` is integer-only**, and it is the *only* thing the DOM chrome
  subscribes to for the current position. Continuous motion stays in `live`, which
  is a plain mutable object (not React state) written every frame. The ruler
  readout is a `textContent` write from its own rAF loop, not a React render.

## 6. The fallbacks, in order of severity

| Failure | Path |
|---------|------|
| No JavaScript | `vite.config.ts` `noscriptLadder()` injects all eight rungs (time, name, fact, explanation, source) into `index.html` at build; `check-budget.mjs` fails if any is missing |
| No WebGL | `checkWebgl()` at boot → `CssSky`, controls disabled, a note in the instrument card |
| Scene chunk fails to load or throws | `SceneBoundary` → `CssSky` |
| Reduced motion | Camera snaps to whole rungs; reveals are placed instantly; parallax off |
| Slow GPU | The Governor steps `tier` down (counts, DPR, antialias) — never content |

## 7. Build pipeline

```
vite build
 ├─ @vitejs/plugin-react      — JSX
 ├─ @tailwindcss/vite         — tokens.css @theme → utilities, one CSS file
 └─ noscriptLadder()          — transformIndexHtml, order 'pre'
dist/
 ├─ index.html                — includes the noscript ladder
 ├─ assets/index-*.js         — app shell (initial)
 ├─ assets/Stage-*.js         — three + scene (lazy)
 ├─ assets/style-*.css        — one stylesheet
 └─ assets/*.woff2            — 4 latin-subset font files
```

Then `tools/check-budget.mjs` reads the real `dist/`, gzips each asset, and applies
the budgets. Nothing in the pipeline fetches anything at runtime: no CDN, no font
host, no API.

## 8. Decisions and their consequences

| Decision | Why | Consequence |
|----------|-----|-------------|
| No `@react-three/drei` | Every helper it offers was either unnecessary or 3 lines of code | Smaller lazy chunk; one fewer dependency to audit (974 KB raw / 248 KB gz for the whole scene) |
| Hand-written GLSL over `MeshStandardMaterial` | No textures, no light rigs, no environment maps — and full control of the fake-sun shading | ~200 lines of shader code in `scene/shaders/`, 7 material factories, one shared noise kit |
| Keys for the camera instead of a spline | A rung's shot must be reproducible and reviewable | Frames are data, and can be read in a table (docs/3D.md) |
| zustand over context | Non-React readers (`useFrame`, rAF loops) need the state without re-rendering | One store, two read patterns (hook + `getState`) |
| gsap only for reveals | The camera must not be tweened by a timeline that scroll can fight | ScrollTrigger used for arrival only, `once: true` |
| Tailwind v4 for tokens, custom CSS for layout | Tokens want a single declaration point; the layout is bespoke | 5.7 KB gz of CSS for the whole page |
| All colour in one file | The 3D layer and the CSS cannot drift | A checker rule (no hex literals elsewhere) instead of a convention |

## 9. Extension points

* **A new rung.** Add to `RUNGS`, add the section to `docs/CONTENT.md`, add a scene
  component positioned at `-SPINE_GAP * n`, pick one of the four mechanisms. The
  checker will hold you to the source line and the ordering.
* **A new mechanism.** Add the discriminant to `Mechanism`, the branch in
  `ui/Experiment.tsx`, the scene response reading `getState().exp`, and the copy
  spec in `ladder.ts`. `check-content.mjs` requires `prompt`, `result`, `detail`
  and the mechanism-appropriate fields.
* **A new object in a scene.** `Body`, `Billboard`, `usePulse` and `useRung`
  (`scene/rungs/parts.tsx`) cover sphere, facing-plane, travelling marker and sleep
  band. A new surface is a call to `createSurfaceMaterial` with two colours, a
  scale, an optional crater term and a light direction.
* **A new gate.** `tools/*.mjs` are plain Node scripts that import
  `src/content/ladder.ts` directly (Node 24 runs TypeScript natively). Add the
  script to `package.json` and to the `check` chain.

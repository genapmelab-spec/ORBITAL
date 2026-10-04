# AGENTS — working on ORBITAL

Short version: this repository has one content source, one colour source, one
scene, and a gate that checks all three. Read this page before editing, run
`npm run check` before calling anything done, and change documentation in the
same pass as the behaviour it describes.

## 1. The map

| Path | What lives there |
|---|---|
| `src/content/ladder.ts` | **The single source of truth.** Eight rungs: id, index, label, name, value, unit, arrow, seconds, fact, explanation, source, accent, camera frame, experiment. |
| `src/content/copy.ts` | All interface prose: mark, hero, instrument, chrome, boot, close. |
| `src/lib/` | `scroll.ts` (scroll → rung position), `quality.ts` (tiers), `motion.ts` (reduced motion, GSAP), `format.ts` (duration formatting, visible + spoken). |
| `src/state/store.ts` | zustand: tier, reduced, noWebgl, hud, ready, activeRung, indexOpen, experiment state. |
| `src/ui/` | DOM layer: Chrome, Boot, Hud, IndexPanel, Ruler, Rung, Sections, Experiment; fallback/CssSky. |
| `src/scene/` | three.js layer: Stage (the only canvas), CameraRig, Starfield, Thread, rungs/*, shaders/{glsl,materials}.ts, palette.ts. |
| `src/styles/` | `tokens.css` (every colour, once), `fonts.css`, `global.css`. |
| `tools/` | `check-content.mjs`, `check-budget.mjs` — the two gates. |
| `docs/` | The written record: PRD, DESIGN, UX, ARCHITECTURE, 3D, ANIMATION, COMPONENTS, RESPONSIVE, PERFORMANCE, ACCESSIBILITY, CONTENT, this page. |

## 2. Invariants (breaking one is a bug, not a style choice)

1. **No images, textures, models or binary assets.** The page is type, CSS and
   computed geometry. `check:budget` fails if any image file reaches `dist/`.
2. **No colour literals outside two files.** Every colour lives in
   `src/styles/tokens.css`; `src/scene/palette.ts` is the runtime mirror that reads
   those custom properties. `check:content` scans `.ts`, `.tsx`, `.css` and fails
   on a hex literal anywhere else. If a new colour is genuinely needed, it enters
   `tokens.css` and the palette, plus `docs/DESIGN.md`.
3. **Content is in the DOM.** The canvas and its wrapper are `aria-hidden="true"`.
   Nothing may exist only as a 3D object; every fact, number and source is text.
4. **The rungs keep their order and their numbers.** `check:content` asserts the
   eight rungs, their index order, and that the arrow / fact / source strings match
   `docs/CONTENT.md` verbatim. If you change a fact, you change it in
   `src/content/ladder.ts` **and** `docs/CONTENT.md`, with a source.
5. **Reduced motion, no WebGL and no JavaScript all work.** `?motion=reduce`,
   `?nowebgl=1`, and the `<noscript>` ladder are contractual. The plugin in
   `vite.config.ts` injects the ladder at build time; `check:budget` asserts it
   survived into `dist/index.html`.
6. **One canvas.** No second WebGL context, no offscreen work that outlives the
   page.

## 3. Commands

```
npm run dev          # Vite dev server
npm run build        # production build into dist/
npm run preview      # serve the built page
npm run typecheck    # tsc --noEmit, strict
npm run check:content
npm run check:budget # reads dist/, so build first
npm run check        # typecheck && content && build && budget
```

`npm run check` is the definition of done. It exits non-zero on a stray colour, a
changed fact, a missing source, a missing noscript rung, or a bundle over budget.
Never relax a budget or weaken an assertion to make it pass; fix the cause or say
plainly in the final report that it failed.

## 4. Changing a rung

1. Edit `src/content/ladder.ts` — the object is typed (`Rung`), so a missing field
   is a compile error.
2. Keep `arrow`, `fact` and `source` identical to `docs/CONTENT.md` (that file is
   the human-readable record; the checker compares against it).
3. If the change affects the shot, adjust `frame: { pos, look }` in the same
   object; the camera keys are read from it, there is nowhere else to edit.
4. If an experiment changes, remember the visible `result` and `detail` are the
   real output; the mechanism is the demonstration, not the source of truth.
5. Run `npm run check`.

## 5. Working rules that are easy to get wrong

* **Numbers: `seconds` is the canonical value.** Arrows, spoken forms and every
  readout derive from it through `src/lib/format.ts`. Do not store "13.8 G y" as a
  string anywhere except the visible `value`/`unit` pair on the plate.
* **The log scale is deliberate.** `lookbackAt()` interpolates logarithmically
  between rungs; the ruler positions marks logarithmically too. Both are part of
  the lesson — changing either to linear makes the diagram lie.
* **Sleep band.** Rung work is skipped beyond ±1.15 rung positions from the camera
  (`src/scene/rungs/parts.tsx`). If you add per-frame work to a rung, route it
  through that gate or the frame cost of the whole page changes.
* **Tiers change counts, never content.** The governor may step a device down at
  runtime; nothing a visitor reads may depend on the tier.
* **`?hud=1` exposes `window.__orbital`** (renderer, scene, camera, ladder) for
  measurement. It is a QC tool, not a feature: keep it out of the product UI.
* **The scripts import TypeScript directly** (Node 24 type-stripping). A tool can
  `import { RUNGS } from '../src/content/ladder.ts'`; keep those files free of
  imports that Node cannot resolve (no `.tsx`, no Vite aliases, no browser globals
  at module top level).
* **Paths in tools are URL-decoded** because the workspace path contains a space;
  copy the existing `decodeURIComponent(new URL(...).pathname)` pattern rather than
  inventing a new one.
* **Do not commit build output.** `dist/` is regenerated; the gate rebuilds it.

## 6. Documentation

Behaviour changes land with the document that describes them. The mapping is
one-to-one: performance → `PERFORMANCE.md`, accessibility → `ACCESSIBILITY.md`,
the scene → `3D.md`, camera and reveals → `ANIMATION.md`, components → `COMPONENTS.md`,
breakpoints → `RESPONSIVE.md`, content and sources → `CONTENT.md`. Numbers quoted
in docs must be reproducible from the repository; if a measurement cannot be made
in the working environment, say so there and in the root `README.md` instead of
quoting a plausible figure.

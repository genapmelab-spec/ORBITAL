# ORBITAL

**Nothing you see is happening now.**

A single scrolling page that teaches one idea with eight examples: everything you
look at is old. A laser bounces off the Moon in 1.28 seconds; the light on your
face left the Sun eight minutes ago; the glow of the first stars took 13.8 billion
years to arrive. Each rung is a delay between something happening and you finding
out — and the page makes you wait for a few of them.

The staging is compressed so it can be seen. The numbers are not. Every rung
carries its source line in the page, at reading size, not behind a disclosure.

## The ladder

| # | Rung | Look-back | The wait you can perform |
|---|---|---|---|
| 01 | The Moon | 1.28 s | **pulse** — fire the laser at Apollo's mirror; the round trip takes 2.56 s |
| 02 | The Sun | 8 m 20 s | **scrub** — run a photon from the core out: 10⁴–10⁵ years of collisions, then 499 s to Earth |
| 03 | Voyager 1 | 23 h 40 m | **pulse** — send a signal; watch the one-way delay and the earliest possible reply |
| 04 | Betelgeuse | 550 y | **toggle** — switch between what we see and what is happening there now |
| 05 | The Crab Nebula | 6,500 y | **compare** — the light that reaches us against the light that left when |
| 06 | The Galactic Centre | 26,000 y | **toggle** — the sky in `sagittarius A*`'s position today |
| 07 | Andromeda | 2.5 M y | **compare** — the galaxy as photographed against the one that exists now |
| 08 | First Light | 13.8 G y | **scrub** — the whole ladder at once, from the Moon to the cosmic microwave background |

Four mechanisms, eight rungs: every rung is interactive, none of them is a gimmick.
The scroll drives a real camera through a composed scene — a laser, a photon, a
schematic spacecraft, a red supergiant, a supernova remnant, a galactic core, a
spiral galaxy, and the oldest light there is.

## Run it

```
npm install
npm run dev      # http://localhost:5173
npm run build    # static output in dist/
npm run preview  # serve the build
npm run check    # typecheck + content gate + build + budget gate
```

No backend, no database, no analytics, no cookies, no third-party requests. The
build is a folder of HTML, CSS, JS, four woff2 files and one SVG favicon; host it
anywhere that serves files.

**Query switches** (QA only, documented in the docs, absent from the UI):

| Switch | Effect |
|---|---|
| `?hud=1` | measurement readout (fps, tier, rung) and `window.__orbital` for the scene |
| `?motion=reduce` | forces the reduced-motion path without changing OS settings |
| `?nowebgl=1` | forces the no-WebGL fallback (flat CSS sky, described experiments) |

## What the page promises

* **No photographs, textures, models or binary assets.** Zero image bytes ship.
  The scene is geometry and shaders; the page's confidence comes from type.
* **Every number has a source**, printed on the plate and mirrored in
  [`docs/CONTENT.md`](docs/CONTENT.md).
* **No tracking.** There is no script on this page that reports anything anywhere.
* **Works without 3D, without JavaScript and without motion.** The eight rungs are
  present in the HTML itself, inside `<noscript>`; the canvas is `aria-hidden`;
  reduced motion is honoured from the first frame.
* **Self-hosted fonts** — Archivo Variable, Newsreader, IBM Plex Mono — all SIL OFL
  1.1, subset woff2, licences in [`docs/licenses/`](docs/licenses/README.md).

## Verification record

The project ships with two gates, both wired into `npm run check`:

* `tools/check-content.mjs` — asserts the eight rungs, their order, their sources,
  that every rung's arrow / fact / source matches [`docs/CONTENT.md`](docs/CONTENT.md)
  verbatim, and that no colour literal escapes `src/styles/tokens.css` and
  `src/scene/palette.ts`.
* `tools/check-budget.mjs` — measures the real build and asserts: initial JS
  ≤ 150 KB gz (actual **123.8 KB**), lazy JS ≤ 350 KB gz (actual **248.3 KB**),
  CSS ≤ 30 KB (actual **5.9 KB**), fonts ≤ 140 KB over 4 files (actual **94.2 KB**),
  images **0 KB**, total first visit **472.2 KB**. It also asserts that the built
  HTML still contains the no-JavaScript ladder.

Measured through `?hud=1` and `renderer.info` at 1440 × 900, tier `high`: the
scene draws **6–16 calls per rung** (hero 6, Moon 9, Sun 15, Voyager 14,
Betelgeuse 16, Crab 13, Core 12, Andromeda 9, First Light 6), compiles four
shader programs on a fresh load (eight once every rung has drawn), and held **60
fps** at the Moon frame. The full recipe and table are in
[`docs/PERFORMANCE.md`](docs/PERFORMANCE.md).

The ten facts, the camera frames, the tiers, the draw calls and the budgets are
checked or measured; the rest is stated as design. Two things could **not** be
verified in the environment this was built in, and are recorded rather than
glossed:

* **Screenshots could not be captured.** The verification browser reported that
  the webview was not being composited, so visual review was limited to the DOM
  (accessibility tree, computed styles, geometry) rather than pixels. Layout and
  styling were exercised through the DOM, not the eye.
* **No device or audit pass.** There is no field data (no analytics by design), no
  screen-reader session and no formal accessibility audit; contrast ratios are
  computed from the token values, and the keyboard path was walked by hand. See
  [`docs/ACCESSIBILITY.md`](docs/ACCESSIBILITY.md#known-limits).
* **One console warning comes from a dependency.** The latest
  `@react-three/fiber` (9.8.1) still builds a `THREE.Clock`, which three 0.186 has
  deprecated in favour of `THREE.Timer`, so the browser logs one
  `THREE.Clock: This module has been deprecated` message per page load. Nothing in
  this repository can silence it without pinning older versions; the page's own
  code logs no errors or warnings.

## Where things are

```
src/content/    ladder.ts (the single source of truth), copy.ts
src/lib/        scroll mapping, quality tiers, motion, formatting
src/state/      zustand store
src/ui/         the DOM layer: chrome, ruler, index, plates, experiments, fallback
src/scene/      the three.js layer: one canvas, camera rig, shaders, eight rungs
src/styles/     tokens.css (all colour), fonts.css, global.css
tools/          check-content.mjs, check-budget.mjs
docs/           the written record — start at docs/README.md
```

Stack: React 19, Vite 7, TypeScript in strict mode, Tailwind v4 (used for the
token layer), three.js, `@react-three/fiber`, GSAP + ScrollTrigger for arrivals,
zustand for state. drei is deliberately absent: the scene is small enough to build
by hand, and a dependency that is not needed is weight without a reason.

The design decisions, the scroll mathematics, the shader work and the
accessibility model are all documented in [`docs/`](docs/README.md).

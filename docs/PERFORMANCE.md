# PERFORMANCE — ORBITAL

Performance here is not a tuning pass, it is the constraint the design was built
against: a page that carries a 3D scene, tells the truth about the universe, and
still opens on a phone over a bad connection. That means a budget, a gate that
enforces it, and a scene that can get smaller without getting less true.

## 1. Where the weight actually is

One build, measured on this machine (`npm run build`, Vite 7.3.6, gzip sizes from
`tools/check-budget.mjs`):

| Artifact | Raw | Gzip | Loaded |
|---|---|---|---|
| `dist/index.html` | 6.09 KB | — | first paint (contains the noscript ladder) |
| `dist/assets/style-*.css` | 23.45 KB | 5.9 KB | first paint |
| `dist/assets/index-*.js` | 370.92 KB | 123.8 KB | first paint |
| `dist/assets/Stage-*.js` | 947.08 KB | 248.3 KB | after idle, never if the platform cannot draw |
| 4 × woff2 (three families, latin subset) | 94.2 KB | — | on first use |
| images | **0 bytes** | — | — |
| **first visit, before the scene mounts** | | **~123.8 KB** | |
| **total after the scene arrives** | | **472.2 KB** | |

The 947 KB chunk is three.js and `@react-three/fiber`, and it is the whole reason
for the lazy boundary: the story, the numbers and every source are in the first
123.8 KB, and the scene is an enhancement that arrives later. Nothing in the essay
waits for WebGL.

There are no photographs, textures, models or icon fonts to pay for — the entire
page is type, CSS and computed geometry. `check:budget` fails if that ever stops
being true (`images` budget: 0.0 KB).

## 2. The gate

`npm run check` runs `typecheck → check:content → build → check:budget`. The last
step reads `dist/`, measures it, and compares against the numbers written in
`tools/check-budget.mjs`:

| Budget | Limit | Actual | Why the limit |
|---|---|---|---|
| initial JS | 150 KB gz | **123.8 KB** | the essay must open quickly |
| lazy JS | 350 KB gz (2 chunks) | **248.3 KB** | three.js, once, after idle |
| CSS | 30 KB | **5.9 KB** | one stylesheet, no framework runtime |
| fonts | 140 KB (4 files) | **94.2 KB** | self-hosted, latin-subset woff2 only |
| images | 0 KB | **0 KB** | there is nothing to load |
| total first visit | — | **472.2 KB** | reported, not asserted |

The same script asserts that `dist/index.html` still contains all eight rungs in
its `<noscript>` block. A budget that could be met by deleting the content is not
a budget.

The build prints a stock Vite warning about a chunk over 500 KB. It is the lazy
Stage chunk and it is inside its gzip budget; the warning is noise, not a finding.

## 3. The lazy boundary, in order

1. `App` renders the DOM: hero, instrument, eight rungs, close, ruler, index.
2. `startScrollTracking()` measures the document and drives the rung position.
3. When the browser is idle (`requestIdleCallback`, timeout 1200 ms) the scene is
   requested with `lazy(() => import('./scene/Stage'))`.
4. If that import fails, `SceneBoundary` catches it and renders `CssSky` — a flat
   DOM sky that changes colour with the rung. The page loses its 3D, not its text.
5. If the platform has no WebGL context, `noWebgl` is true from the start and the
   canvas is never mounted at all.

Inside the canvas:

* `dpr = min(tier dpr, devicePixelRatio)`, so a retina phone at tier `low` renders
  at 1.25×, not 3×.
* `frameloop` becomes `never` when the document is hidden (`visibilitychange`) and
  `always` again when it is not.
* `antialias` is off at tier `low`. The scene is mostly additive points and thin
  lines; MSAA buys little and costs a full-resolution buffer.
* The renderer clears to `--color-void`, matching the CSS background, so the
  handoff from the flat page to the canvas has nothing to hide.

## 4. Three tiers, one table

`src/lib/quality.ts` holds every quality decision in one object, and the starting
tier is a capability probe, not a user-agent sniff:

| Tier | dpr | stars | motes | galaxy | filaments | cloud | thread ribbon |
|---|---|---|---|---|---|---|---|
| `high` | 2 | 6000 | 900 | 14000 | 5200 | 9000 | yes |
| `mid` | 1.5 | 3000 | 420 | 7000 | 2600 | 4500 | yes |
| `low` | 1.25 | 1500 | 200 | 3200 | 1200 | 2000 | no |

Start rules (`detectTier`): coarse pointer or width < 760 px → `low`; width < 1180
px or ≤ 4 logical cores → `mid`; otherwise `high`.

Then the **governor** corrects it from real evidence. A component inside the
canvas samples 120 consecutive frame times, takes the median, and acts at most
once every 5 seconds: median > 18 ms steps one tier down (below roughly 55 fps),
median < 17 ms steps one tier up (a device that is holding its refresh rate
climbs back), and `low` never steps down further. The first 2.5 seconds after the
scene mounts are discarded: first paint and shader compilation are not evidence
about the device, and a slow opening must not permanently cost a visitor the
scene. Tiers change particle counts and pixel ratio — never the story, the rungs
or the numbers.

## 5. Draw calls: the scene is smaller than it looks

Every rung is in the scene graph at all times. What keeps the frame small is a
sleep band in `src/scene/rungs/parts.tsx`: anything more than ±1.15 rung positions
from the camera skips its per-frame work and stops submitting draws.

Measured at 1440 × 900, tier `high`, with the QC hook. The recipe matters — the
number changes if the camera is still damping — so it is stated in full: with
`?hud=1`, set `__orbital.ladder.live.camera = i` and `live.target = i`, wait four
rendered frames, then read `renderer.info.render`:

| Rung | Draw calls | Triangles |
|---|---|---|
| opening frame (hero) | 6 | 6,564 |
| 0 · The Moon | 9 | 15,592 |
| 1 · The Sun | 15 | 17,696 |
| 2 · Voyager 1 | 14 | 17,376 |
| 3 · Betelgeuse | 16 | 8,918 |
| 4 · The Crab | 13 | 6,880 |
| 5 · The Core | 12 | 638 |
| 6 · Andromeda | 9 | 2,276 |
| 7 · First Light | 6 | 2,210 |

Each figure includes the neighbouring rung that is still inside the ±1.15 wake
band, which is the true cost of the hold. Six to sixteen draw calls for a page
containing a star field, a thread running the length of the ladder, a schematic
spacecraft, a pulsar with rotating beams, a supernova remnant, a galactic core, a
whole galaxy and the first light. The production renderer compiles four shader
programs on a fresh load and eight once every rung has drawn at least once; all
link, with no program warnings in the console.

## 6. Frame time

At the Moon, tier `high`, 1440 × 900, the scene held 60 fps in the verification
run. The number the governor reacts to is the same thing, measured in production:
the median frame time over the last 120 frames, after the 2.5-second warm-up.

To repeat any of this yourself:

```
npm run dev
# open http://localhost:5173/?hud=1
# __orbital.ladder.live.camera = 3; __orbital.ladder.live.target = 3
# ... wait four rendered frames, then:
# __orbital.renderer.info.render.calls
```

`?hud=1` is a QC switch. It adds a small readout and exposes the renderer, scene,
camera and ladder on `window.__orbital`. It is not part of the product, it is not
reachable from the nav, and it costs nothing when it is off.

## 7. What was measured, and what was not

Measured, on this machine, from the built output or the live scene:

* bundle sizes and gzip sizes, by the budget gate;
* draw calls and triangle counts per rung, through `renderer.info` at each of the
  eight positions plus the hero;
* shader program count (4 on a fresh production load, 8 once every rung has
  drawn) and that all programs link without console warnings;
* 60 fps at the Moon frame, tier `high`, 1440 × 900.

Not measured, and not claimed:

* field data from real visitors. There is no analytics on this page, by design, so
  no Core Web Vitals numbers are quoted here — only lab measurements;
* screenshots or visual review. The verification environment used for this build
  cannot composite the webview, so visual checks are recorded as a limitation in
  the repository README;
* thermal or battery behaviour on low-end phones. Tier `low` exists for those
  devices, and the governor reacts to them, but no such device was on the bench.

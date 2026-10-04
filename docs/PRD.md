# PRD — ORBITAL

**Status:** shipped (v1.0.0) · **Owner:** the site itself · **Gate:** `npm run check`

## 1. The problem

Almost every astronomy page on the web answers *what is out there*. Almost none
answer the question that makes astronomy strange: **the light you are looking at
left before you did.** Planets get tours, distances get animations, and the fact
that looking out is looking back is left as a caption.

ORBITAL is built on one idea and refuses to leave it:

> Nothing you see is happening now.

The visitor climbs a ladder of delays: 1.28 seconds for a laser off the Moon,
8 minutes 20 seconds for the Sun, 23 hours 40 minutes for Voyager 1, 550 years
for Betelgeuse, 6,500 years for the Crab, 26,000 years for the centre of our own
galaxy, 2.5 million years for Andromeda, and 13.8 billion years for the first
light that was ever free to travel.

## 2. Audience

* Curious adults who read a science page to the end and hate being condescended to.
* Teachers and planetarium explainers who need an artefact they can point at.
* Developers who care what a page can do with zero photographs.

No account, no signup, no personalisation. One page, one idea.

## 3. Goals

| # | Goal | How it is proved |
|---|------|------------------|
| G1 | Every number is real and sourced | `tools/check-content.mjs`: each rung carries a source line with a figure; `docs/CONTENT.md` mirrors the copy verbatim |
| G2 | The delay is *felt*, not just stated | Four mechanisms, one per pair of rungs; every rung has a non-text conclusion in the DOM |
| G3 | The lesson survives every failure | No-JS, no-WebGL, reduced-motion and failed-chunk paths all keep the full script (see docs/ACCESSIBILITY.md) |
| G4 | It ships without a single pixel of photography | Banned image bytes enforced by `tools/check-budget.mjs` (`images: 0`) |
| G5 | It is fast on the first visit | Budgets measured from the real build (docs/PERFORMANCE.md) |
| G6 | It is honest about being a diagram | The compressed staging is admitted on the page itself, in the instrument card |

## 4. Non-goals

* No backend, API, database, CMS or runtime third-party fetch. Static files only.
* No analytics, tracking, cookies, accounts or advertising. The page cannot see you.
* No photographs, textures, image or video assets. Everything visible is geometry,
  shader output, type or CSS.
* No audio. It would fight the reading, and it would need a file.
* No planet-by-planet tour, no quiz, no newsletter. The ladder is the whole product.
* No claim that the staging is to scale. It is not, and it says so.

## 5. The ladder (scope)

Eight rungs, in strictly increasing look-back time. One shared mechanism per pair:

| # | Rung | Arrow | Look-back | Mechanism |
|---|------|-------|-----------|-----------|
| 01 | The Moon | 1.28 s | 1.282 s | pulse — fire the laser |
| 02 | The Sun | 8 m 20 s | 499 s | scrub — run the photon |
| 03 | Voyager 1 | 23 h 40 m | 85,180 s | pulse — transmit, and wait |
| 04 | Betelgeuse | 550 y | 1.7357e10 s | toggle — light the fuse |
| 05 | The Crab Nebula | 6,500 y | 2.0512e11 s | compare — 1054 or tonight |
| 06 | The Galactic Centre | 26,000 y | 8.205e11 s | toggle — visible, infrared, radio |
| 07 | Andromeda | 2.5 M y | 8.0156e13 s | compare — then and now |
| 08 | First Light | 13.8 G y | 4.354e17 s | scrub — turn up the heat |

The conversion rules behind every figure (c, the Julian year, the distance used)
are written out in `docs/CONTENT.md`, and the checker verifies that the table and
the code agree.

## 6. Deliverables

1. A static site in `dist/` that runs from any file server or CDN.
2. The rung data in one place (`src/content/ladder.ts`) with `docs/CONTENT.md` as
   its human-readable mirror.
3. Four mechanisms that can be operated by pointer, touch or keyboard.
4. A no-JavaScript copy of all eight rungs, injected into `index.html` at build.
5. Gates: `typecheck`, `check:content`, `build`, `check:budget` — one command.
6. This documentation set.

## 7. How the visitor moves through it

1. **Opening frame.** An eyepiece, one sentence, one number (1.28 s). The identity
   is withheld until the visitor scrolls; the aperture opens with them.
2. **The instrument card.** Why light has a date on it, the three reading rules,
   and the admission: *Distances here are compressed so they can be seen. The
   numbers are not.*
3. **Eight rungs.** Each arrives, holds while the camera holds its shot, then flies
   to the next. The plate carries: index, label, the numeral, the unit, the name,
   the fact, the explanation, the experiment and the source line.
4. **The close.** The ladder's end and what it means: same eye, same instrument,
   only the delay changed. One action — climb again — and a link copier that
   removes itself when the clipboard API is unavailable.

Navigation is not a menu bolted on: the ruler at the foot of the page *is* the
navigation, and its marks sit at true logarithmic positions, so the crowding in
the middle is itself the lesson (most of the ladder's length is starlight). An
index sheet gives the same eight items as a list.

## 8. Success criteria (machine-checked)

| Gate | Command | Passing means |
|------|---------|---------------|
| Types | `npm run typecheck` | `tsc --noEmit`, strict, no unused locals |
| Content | `npm run check:content` | 8 ordered rungs, every string present, every source line carries a figure, docs agree with code, zero colour literals outside the token file |
| Build | `npm run build` | A static `dist/` with four woff2 files, one CSS file, three JS chunks |
| Budget | `npm run check:budget` | initial JS ≤ 150 KB gz, lazy ≤ 350 KB, CSS ≤ 30 KB, fonts ≤ 140 KB, images = 0, and every rung's `<noscript>` copy present |

All four run as `npm run check`. In the browser, the acceptance pass is: the
rungs map to their sections, the experiments operate, the tier governor holds
frame time, and the four fallback paths render the full script.

## 9. Risks and how they are handled

| Risk | Handling |
|------|----------|
| Staged scale reads as a claim | The instrument card says otherwise, in the page, in the visitor's path — not in a footnote |
| Numbers drift from sources | One source of truth plus a checker that fails the build |
| A shader or chunk fails on one device | `SceneBoundary` and the CSS sky path; the plates never depend on WebGL |
| Frame time collapses on a weak GPU | The governor steps counts and DPR down; the story is untouched by any tier |
| Motion sickness | `prefers-reduced-motion` and `?motion=reduce` both snap the camera and disable reveals |
| The idea gets lost in decoration | Every rung must ship its fact, explanation and source as DOM text; the checker enforces presence |

## 10. Out of scope for v1

* Additional rungs (Mars, Proxima, the LMC) — the eight are enough, and each new
  rung costs a scene, a frame and a mechanism.
* Localisation. The copy is English and the numbers are en-GB formatted.
* WebGPU, XR, audio, video export, saved progress.
* Any measurement of visitors. There are no beacons of any kind.

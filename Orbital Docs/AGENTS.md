# AGENTS.md — Implementation Instructions for AI Coding Agents

## Project Summary
Cinematic landing page "ORBITAL — A Solar System Journey": one persistent
Three.js scene, one camera driven by scroll, one fixed journey order of fourteen
stages (EARTH → MOON → MERCURY → VENUS → EARTH ORBIT → MARS → ASTEROID BELT →
JUPITER → SATURN → URANUS → NEPTUNE → OUTER SOLAR SYSTEM → SOLAR SYSTEM OVERVIEW
→ THE SUN), with planets as landmarks, interstitial moments between them, an
opening and a real ending. `src/content/journey.ts` is the single source of truth
for that order: camera keys, navigation, sections, copy weight and the scroll
parameter all derive from it, and it is never reshuffled.
Sources of truth: DESIGN.md (visual/experience), PRD.md (scope/acceptance).
If code conflicts with DESIGN.md, DESIGN.md wins.

## Tech Stack (chosen — do not add without updating this file + PRD)
- Astro (static output) + Tailwind CSS (tokens via CSS custom properties)
- Three.js (vanilla, TypeScript), lazy-loaded with dynamic `import()` after first
  paint — React/R3F deliberately NOT used: no framework runtime needed for one
  scene (see the deviations note below on why there is no island)
- GSAP + ScrollTrigger (scroll choreography + DOM reveals)
- No UI kits, no jQuery, no animation libs beyond GSAP, no CMS

## Recommended Folder Structure
src/
  pages/index.astro
  layouts/Base.astro
  components/        (Nav.astro, ActSection.astro, BookingForm.astro, Footer.astro,
                      StageIndicator.astro, Preloader.astro)
  three/
    OrbitaScene.ts   (entry: init, resize, dispose, quality tiers)
    cameraPath.ts    (act keyframes + easing along path)
    objects/         (earth.ts, mars.ts, craft.ts, starfield.ts, exhaust.ts)
    shaders/         (atmosphere.glsl.ts, surface.glsl.ts)
    quality.ts       (device tier + FPS probe + adaptive settings)
  scripts/           (scrollController.ts, form.ts, motion.ts reduced-motion)
  styles/            (tokens.css, base.css, cosmic.css)
  assets/            (textures ktx2/, models/, fonts/)
public/              (favicon, og image, fallback hero frame)

## Coding Rules
- Tokens only: no raw hex/sizes/spacing in components — use CSS custom props.
- TypeScript strict; no `any`; exported scene API typed.
- Components presentational; state isolated in three/ + scripts/ modules.
- All scene objects expose create()/update(dt)/dispose(); dispose EVERYTHING
  (geometry/material/texture/listener) — single page must never leak.
- No magic numbers in scene code without a named constant + comment.

## 3D & Animation Implementation Guide
- ONE WebGLRenderer, ONE RAF loop total; render only when visible/tab active.
- Layout contract: `three/anchors.ts` owns every position, radius, light and
  camera composition; `three/cameraPath.ts` only interpolates between the keys it
  resolves. Objects and camera can therefore never disagree about the world.
- Scroll: each section declares the journey parameter it sits on (`data-param`,
  0 at stage 01 → 13 at stage 14). The controller interpolates between
  neighbouring sections, so an interstitial moment can live between two stages
  while the parameter stays non-decreasing. DOM reveals are separate, cheap,
  once-per-pass.
- Starfield velocity stretch: uniform driven by scroll velocity, clamped.
- Adaptive quality: start tier by capability probe (cores, viewport, DPR,
  software renderer); FPS probe may downgrade (particles → DPR → atmosphere
  shells); NEVER downgrade narrative (camera path stays).
- prefers-reduced-motion: the camera rests on whole stage keys and cuts between
  compositions instead of flying; no preloader animation; all content visible.
- No-3D fallback: if WebGL is unavailable or the scene fails → `no-webgl` class;
  a pure CSS starfield renders instead; DOM content identical.
- Shaders are GLSL strings in `three/shaders/*.ts` (no .glsl loader, no
textures). Analytic sun lighting in-shader: no Three.js light objects, no maps.

## Responsive Rules
Breakpoints 640/768/1024/1440 (Tailwind defaults ok). Mobile: skybox tier or
fallback; overlay menu; acts stacked with full narrative; ≥44px targets;
safe-area padding. Never user-agent sniffing — feature + perf probes only.

## Performance Guidelines
Budgets (PRD AC9): JS ≤ ~350KB gz total; LCP = DOM hero element; canvas
lazy-inits after first paint; textures KTX2; draw calls <60/<30; tris <150k;
DPR ≤2. Test on mid-range Android; measure, don't assume.

## Accessibility Guidelines
Scene canvas aria-hidden + visually-hidden per-stage summary (every stage and
moment, including the silent ones); all content DOM; AA contrast with scrims over
bright frames, and compositions authored so centred captions never sit on the
subject; visible focus (solar token); reduced-motion hard requirement
(DESIGN.md §9); 
no content exists only inside the canvas.

## Development & Build Commands (as built)
npm run dev          # astro dev
npm run check        # astro check (types + diagnostics)
npm run build        # astro build (static)
npm run preview      # astro preview
npm run check:layout # bundles the layout contract and asserts framing,
                     # collisions, path continuity and corona reach
Do not invent other scripts. `check:layout` reads the real `anchors.ts`, so it
cannot drift from the scene the way a hand-copied table would.

## Testing & Validation Procedure
1. npm run build → zero errors/warnings; `npx astro check` clean.
2. Console clean on preview (all breakpoints); no WebGL shader errors.
3. Functional: rail + sheet anchors, deep links to any stage, no-3D fallback,
   journey order intact in the DOM.
4. Layout: verify camera keys against the layout contract — subject in frame,
   caption clear of the subject, no key inside a body, no interpolation grazing
   a body between keys.
5. Responsive sweep 320→1920: no overflow, no CLS spikes, caption placement and
   camera framing switch together at the 1024px re-choreography threshold.
6. A11y: axe scan; keyboard pass; reduced-motion pass (one composition per stage).
7. Perf: Lighthouse mobile ≥ PRD targets; FPS probe on mid-range Android.
8. Fail any budget → apply adaptive-quality fixes before code polish.

## Delivered Structure (as built — keep in sync)
```
src/
  pages/index.astro          one page: opening + stages + moments + ending
  layouts/Base.astro         document shell + pre-paint capability probe
  content/journey.ts         JOURNEY (14-stage spine) + EXPERIENCE (page order)
  components/                Scene, TopBar (rail), JourneySheet, Preloader,
                             Prologue, Stage, Moment, Manifest (why-this-journey),
                             Endcap (epilogue + log)
  three/
    OrbitaScene.ts           ONE renderer / ONE RAF loop / dispose()
    cameraPath.ts            eased-linear keys, reduced framing, re-layout
    anchors.ts               LAYOUT CONTRACT: scale compression, body table,
                             per-stage camera compositions, portrait bias
    quality.ts               profiles + FPS governor (counts/DPR, never story)
    world.ts                 assembles the graph from anchors, applies tiers
    types.ts                 SceneObject create/update/dispose contract
    random.ts                seeded RNG (reproducible starfield and rubble)
    objects/                 starfield, dust, planet, sunBody, belt, orbitLines
    shaders/                 common, surface, atmosphere, sun, ring, points, rock
  scripts/
    scene.ts                 runtime entry: boot behaviour, then lazy three
    scrollController.ts      section params → journey parameter → camera
    motion.ts                preloader, opening load-in, per-section reveals
    nav.ts                   rail active state, mobile sheet, anchor focus
  styles/                    tokens / base / journey (+ global.css entry)
```

Deviations from the earlier sketch, all deliberate:
1. **No `client:load` island.** Astro only hydrates framework components with
   `client:*`; for vanilla TypeScript the documented pattern is a single
   `<script>` in an `.astro` component, which Astro bundles once, hoisting it
   out of the critical path. `Scene.astro` is that one entry, and it
   `import()`s three.js **after first paint** so the LCP element is always DOM.
2. **`src/content/journey.ts` added** so components stay presentational and no
   copy is duplicated. It holds two layers: `JOURNEY` (the fixed 14-stage spine
   the camera and the rail both read) and   `EXPERIENCE` (the page order, with the
   opening, the interstitial moments, the why-this-journey manifesto and the
   ending).
3. **Extra scene modules** — `anchors.ts` (the layout contract: geometry, light
   and camera compositions in one place), `world.ts` (assembly + tier
   application), `random.ts` (seeded layouts so the scene is identical on every
   reload).
4. **Custom cursor and pointer tilt cut** — no narrative gain without a form,
   and pointer parallax fights a camera that is already moving.
5. **Texture-free.** Every visual is shader or primitive: no NASA/Solar System
   Scope licensing dependency and no asset bytes (DESIGN.md §10).
6. **No booking form.** The old concept's conversion funnel is gone (PRD v2.0);
   the page's actions are navigation inside the experience, and the ending
   carries a final statement plus an expedition log instead of a form.

## Prohibitions (AI agents MUST NOT)
- Add libraries/features not in Tech Stack (no React, no R3F, no postprocessing
  libs unless a PRD requirement demands it — update docs first if ever).
- Reorder the journey, or add a stage that is not in `JOURNEY`. New beats belong
  as interstitials in `EXPERIENCE`, between two stages, never in the spine.
- Add texture, model or photo assets. The scene is procedural by contract.
- Put critical content only inside the canvas.
- Animate layout properties in DOM; rebuild geometry per frame in WebGL.
- Create multiple renderers/loops; leave undisposed GPU resources.
- Use user-agent sniffing for capability decisions.
- Ship lorem ipsum, placeholder art, or unlicensed imagery.
- Introduce backend calls of any kind (form is client-side only).

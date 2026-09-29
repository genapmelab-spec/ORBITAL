# AGENTS.md — Implementation Instructions for AI Coding Agents

## Project Summary
Premium 3D space landing page "ORBITAL": one persistent Three.js scene, camera
flight driven by scroll, five acts (LEAVE/CROSS/ARRIVE/FLY/SECURE), DOM content
inside a cinematic world. Sources of truth: DESIGN.md (visual/experience),
PRD.md (scope/acceptance). If code conflicts with DESIGN.md, DESIGN.md wins.

## Tech Stack (chosen — do not add without updating this file + PRD)
- Astro (static output) + Tailwind CSS (tokens via CSS custom properties)
- Three.js (vanilla, TypeScript) in ONE Astro island (`client:load`) — React/R3F
  deliberately NOT used: no framework runtime needed for one scene
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
- Scroll: ScrollTrigger tracks page progress 0..1 → cameraPath.getPointAt(p)
  + per-act state; DOM reveals are separate, cheap, once-per-pass.
- Starfield velocity stretch: uniform driven by scroll velocity, clamped.
- Adaptive quality: start tier by (deviceMemory, cores, DPR); FPS probe first
  3s may downgrade (particles → DPR → shadows); NEVER downgrade narrative
  (camera path stays).
- prefers-reduced-motion: skip path animation; cross-act = opacity fades;
  static starfield; skip preloader animation.
- No-3D fallback: if WebGL unavailable/failed → add `no-webgl` class; CSS
  starfield + static hero frame render instead; DOM content identical.

## Responsive Rules
Breakpoints 640/768/1024/1440 (Tailwind defaults ok). Mobile: skybox tier or
fallback; overlay menu; acts stacked with full narrative; ≥44px targets;
safe-area padding. Never user-agent sniffing — feature + perf probes only.

## Performance Guidelines
Budgets (PRD AC9): JS ≤ ~350KB gz total; LCP = DOM hero element; canvas
lazy-inits after first paint; textures KTX2; draw calls <60/<30; tris <150k;
DPR ≤2. Test on mid-range Android; measure, don't assume.

## Accessibility Guidelines
Scene canvas aria-hidden + visually-hidden per-act summary; all content DOM;
AA contrast with scrims over bright frames; visible focus (solar token);
reduced-motion hard requirement (DESIGN.md §9); form errors aria-describedby.

## Development & Build Commands (proposed scaffold)
npm run dev        # astro dev
npm run build      # astro build (static)
npm run preview    # astro preview
npx astro check    # type/diagnostics
(Exact scripts confirmed after scaffold — do not invent others.)

## Testing & Validation Procedure
1. npm run build → zero errors/warnings.
2. Console clean on preview (all breakpoints).
3. Functional: anchors, nav CTA, form validation/success, no-3D fallback.
4. Visual: acts vs DESIGN.md §5; no repeated layout patterns; type overlap OK.
5. Responsive sweep 320→1920: no overflow, no CLS spikes.
6. A11y: axe scan; keyboard pass; reduced-motion pass.
7. Perf: Lighthouse mobile ≥ PRD targets; FPS probe on mid-range Android.
8. Fail any budget → apply adaptive-quality fixes before code polish.

## Delivered Structure (as built — keep in sync)
```
src/
  pages/index.astro          5 acts, one page
  layouts/Base.astro         document shell + pre-paint capability probe
  content/mission.ts         all page copy (typed, no placeholder text)
  components/               Scene, Nav, StageIndicator, Preloader,
                            ActSection, BookingForm, Footer
  three/
    OrbitaScene.ts           ONE renderer / ONE RAF loop / dispose()
    cameraPath.ts            9 Catmull-Rom keys, act anchors, reduced framing
    quality.ts               capability probe + FPS governor (drawRange only)
    world.ts                 layout contract (planet + star + craft constants)
    anchors.ts               DOM labels projected from real 3D subjects
    types.ts                 SceneObject create/update/dispose contract
    objects/                 starfield, earth, mars, craft, exhaust,
                             planet (interface), halo (procedural env glow)
    shaders/                 common.glsl, atmosphere.glsl, surface.glsl
  scripts/
    scene.ts                 runtime entry: boot behaviour, then lazy three
    scrollController.ts      per-act scroll → camera + stage log + rail
    motion.ts                preloader, hero load-in, reveals, timeline rail
    nav.ts, form.ts          chrome + client-side validation
  styles/                    tokens / base / cosmic (+ global.css entry)
```

Deviations from the earlier sketch, all deliberate:
1. **No `client:load` island.** Astro only hydrates framework components with
   `client:*`; for vanilla TypeScript the documented pattern is a single
   `<script>` in an `.astro` component, which Astro bundles once, hoisting it
   out of the critical path. `Scene.astro` is that one entry, and it
   `import()`s three.js **after first paint** so the LCP element is always DOM.
2. **`src/content/mission.ts` added** so components stay presentational and no
   copy is duplicated across acts.
3. **Extra scene modules** — `world.ts` (single layout contract, so objects and
   the camera path cannot drift apart), `anchors.ts` (the 3D→DOM projection
   bridge), `halo.ts` (procedural limb glow + engine glow), `planet.ts`
   (shared interface).
4. **Custom cursor cut** (DESIGN.md §6 🔶) — no narrative gain, fights form
   input. Pointer tilt ships on desktop only, per capability probe.
5. **Texture-free.** Every visual is shader, primitive or runtime canvas: no
   NASA/Solar System Scope licensing dependency and no asset bytes.

## Prohibitions (AI agents MUST NOT)
- Add libraries/features not in Tech Stack (no React, no R3F, no postprocessing
  libs unless a PRD requirement demands it — update docs first if ever).
- Put critical content only inside the canvas.
- Animate layout properties in DOM; rebuild geometry per frame in WebGL.
- Create multiple renderers/loops; leave undisposed GPU resources.
- Use user-agent sniffing for capability decisions.
- Ship lorem ipsum, placeholder art, or unlicensed imagery.
- Introduce backend calls of any kind (form is client-side only).

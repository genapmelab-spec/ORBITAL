# DESIGN.md — SPACE: Premium 3D Landing Page
Status: Draft v1.0 · Legend: ✅ confirmed · 🔶 recommendation (final at design review)

## 1. Creative Concept — "ORBITAL"
The page IS a spaceflight, not a page about space. One persistent WebGL scene,
one camera, one scroll. Five acts along a camera path:
LEAVE (Earth) → CROSS (the void) → ARRIVE (Mars) → FLY (spacecraft) → SECURE (booking).
Content is DOM floating inside the world at different depths; nothing is a bolted-on
section stack.

Why: camera-driven composition cannot read as a template; one scene is cheaper than
five effects; every act gets a distinct spatial composition for free; storytelling
ends naturally at the CTA.

## 2. Art Direction & Mood
- Feeling: cinematic, vast, quiet, confident. "A film you can scroll."
- Lighting: single key light (sun), deep black shadows, thin atmosphere rim light,
  subtle bloom; very subtle film grain to unify CGI + type.
- Motion character: weightless — long ease-outs, slow drift, nothing bounces.
- Density: LOW. One idea per viewport. Negative space is the luxury signal.
- Avoid: neon/synthwave grids, cartoon rockets, HUD-clone dashboards, purple
  gradients, glass over critical text, purposeless floating decor.

## 3. Visual Identity
Color 🔶 (relationships ✅):
  --void #030510 (base) · --space #0A0F1E (panels) · --text #F2F5FA ·
  --muted #8B95A9 · --ember #FF6B35 (action accent, owns ALL interaction) ·
  --solar #FFC15E (focus, telemetry) · --ion #7DD3FC (atmosphere/data only, never buttons)
Rules: AA contrast over worst-case frames (local scrims where scene is bright);
one warm accent; exact hexes proposed.

Typography 🔶: Display Space Grotesk (alt: Sora) · Body Inter · Data JetBrains Mono.
Fluid clamp() scale: display ~64→36, H2 ~40→26, body 18→16, mono 12–14.
Signature: display headlines may overlap/intersect the 3D subject.
Eyebrows: uppercase, 0.16em tracking, mission-log style ("LOG 003 · ARRIVAL").

## 4. 3D Direction
One persistent scene: Earth (shader atmosphere, slow rotation) · GPU starfield in 3
parallax depths (starfield subtly STRETCHES with scroll velocity — signature
interaction ✅) · Mars (displaced sphere + noise surface, dusty rim) · one stylized
hero spacecraft (~15–30k tris, KTX2) · additive exhaust/dust particles only at
burn/dock moments · thin holo ring/line elements presenting REAL content (stage
numbers, stats) in-scene or as DOM overlays anchored to 3D.
3D is NOT for: decoration, random particles behind text, wallpaper replacement.

Camera path (the spine):
  LEAVE: close on Earth horizon, pull back+up · CROSS: wide drift, craft appears
  distant · ARRIVE: Mars grows to fill frame · FLY: alongside the craft ·
  SECURE: camera rests behind the booking panel; world recedes calm.

## 5. Page Structure & Storytelling
1 LEAVE  Hero: awe+concept in 5s, first CTA. Full-viewport, headline low-left
         overlapping horizon. Nav transparent.
2 CROSS  Story/credibility: deep starfield, distant craft. Experimental editorial:
         asymmetric type, large numerals 01/02/03, varied alignment — NOT a card row.
3 ARRIVE Destinations/Mars: planet fills frame; big stats (distance, travel time)
         as holo labels; right-aligned text.
4 FLY    Technology: hero craft side profile, exhaust; overlapping type; specs as
         mono telemetry table; pointer-tilt parallax on craft.
5 SECURE Booking + footer: calm receding world; single focused form panel; quiet footer.
Nav: fixed, minimal, current act highlighted; logo left, anchors + CTA right.
Pinned "stage indicator" (01 — LEAVE …) = mission log ✅ signature element.
No hard section boundaries: in-scene haze blends acts.

## 6. Animation & Interaction
- Scroll = master driver: progress → camera path + scene state (GSAP ScrollTrigger).
- Camera: slow, eased, always forward; never hard cuts.
- Text: line rise+fade, staggered, once per pass. In-scene: rotation, twinkle,
  drift, exhaust — alive but subtle.
- Hover: ember fill sweep + lift (buttons); craft tilt with pointer (FLY).
- Cursor 🔶: dot+ring reticle over interactive elements — cut if it hurts usability.
- Load-in: boot-sequence preloader (progress + stage text) → camera eases into LEAVE ✅.
- Rule: DOM anim = transform/opacity only; WebGL anim = camera + uniforms only.

## 7. Layout Principles
1. One idea per viewport. 2. No repeated layout pattern across acts.
3. Depth = hierarchy: foreground UI / midground subject / background environment.
4. Asymmetry default; centered reserved for SECURE (focus).
5. Type as spatial object — huge, overlapping, frame-clipped allowed.
6. Responsive = re-choreography, not shrinking.

## 8. Responsive
Mobile <768: same narrative order, vertical composition; 3D in "skybox mode"
(lighter render or static hero frame + CSS starfield), stage indicator kept.
Tablet: full scene, reduced particles, no pointer-tilt. Desktop: full experience.
Tap targets ≥44px; overlay menu; safe-area padding. Decide 3D tier by device class
+ runtime FPS probe — never user-agent sniffing. 🔶

## 9. Accessibility (visual)
AA contrast everywhere; prefers-reduced-motion → camera path collapses to gentle
fades, no starfield stretch/particles, simplified preloader ✅ hard requirement.
Scene aria-hidden + per-act text summary; full keyboard traversal, visible solar
focus outline; ALL critical content lives in DOM, never only inside the scene.

## 10. Assets
Planets: shader-based + licensed/CC0 textures (NASA-derived, Solar System Scope 🔶;
licensing confirmed before build). Spacecraft: one low-poly hero mesh, KTX2;
fallback if budget tight: 2.5D layered plates with baked light. Starfield:
procedural GPU points (zero texture cost). Unified grade (cool shadows / warm
highlights) across WebGL + DOM imagery. No stock space wallpaper pasted as background.

## 11. Performance Principles
ONE WebGL context + ONE RAF loop for scene and scroll-sync. Draw calls <60 desktop /
<30 mobile; <150k visible tris. DPR ≤2 (1.5 low-tier); adaptive quality drops
particles/resolution first — never the narrative. KTX2 textures, merged geometry,
frustum culling, pause when tab hidden. Bundle: three+GSAP+site ≤ ~350KB gz.
Scene lazy-inits AFTER first paint; DOM content visible first, scene fades in —
never a black-screen wait. LCP is a DOM element, never the canvas.

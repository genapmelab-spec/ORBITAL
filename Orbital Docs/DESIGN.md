# DESIGN.md — ORBITAL: A Solar System Journey
Status: v2.0 · Legend: ✅ confirmed · 🔶 recommendation (final at design review)
Supersedes v1.0 (five acts, spacecraft, booking). Tokens, motion character,
a11y and performance principles are unchanged.

## 1. Creative Concept — "ORBITAL"
The page IS the journey, not a page about the Solar System. One persistent WebGL
scene, one camera, one scroll, fourteen stages, no cuts:
EARTH → MOON → MERCURY → VENUS → EARTH ORBIT → MARS → ASTEROID BELT → JUPITER →
SATURN → URANUS → NEPTUNE → OUTER SOLAR SYSTEM → SOLAR SYSTEM OVERVIEW → THE SUN.

That order is the spine of the whole project: it drives the camera path, the
scroll parameter, the navigation rail, the copy, the reveals and the progress
bar. It is defined once (`src/content/journey.ts`) and nothing reshuffles it.

Around the spine the page is a landing page, not a catalogue: an **opening**
that starts in darkness on Earth's night side — a whisper of mono type, then a
dawn crossing around the limb, the Earth reveal earned by the flight, and only
then the hook that sells the trip — **planets as landmarks** inside the journey
(they are places the camera passes, not pages), **moments between them** —
departure, scale, silence, orbital time — a **manifesto** (why this journey:
three numbered editorial lines, the page's one value-proposition section, never
a feature grid), and a **real ending** that pays the journey off with a final
statement, an expedition log and the ways back in.

Why: camera-driven composition cannot read as a template; planets stop being
cards and become environment; the moments give the page rhythm and meaning
beyond "and then we saw another planet"; the ending means the experience closes
instead of stopping.

## 2. Art Direction & Mood
- Feeling: cinematic, vast, quiet, confident. "A film you can scroll."
- Emphasis: SCALE IS THE STORY. Distance, depth, negative space, and the moment
  a planet you have been standing next to becomes a dot. Text serves atmosphere;
  it never competes with the frame.
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
One persistent scene, entirely procedural — no textures, no photographs, no
external assets:
- Twelve bodies (Sun, Moon, Ceres, Pluto and the eight planets), each a shader:
  latitude-banded surface noise, a single analytic Sun light, and a compressed
  inverse-square falloff so Neptune is visibly dimmer than Mercury.
- Atmosphere shells: additive fresnel rims, sun-facing, on Earth, Venus, Mars,
  Mercury (thin and hot), the giants.
- Ring systems for Saturn and Uranus (radial banding, one Cassini-style gap, and
  the planet's own analytic shadow across the rings — no shadow maps).
- Asteroid belt and Kuiper belt as two instanced draws; Ceres and Pluto are the
  named dwarf planets inside them.
- Orbit lines whose opacity is scripted by the journey: invisible at close range,
  revealed as the camera pulls out until the overview shows a system.
- GPU starfield in three shells with per-star twinkle, and a camera-relative dust
  field that wraps around the viewer so travel reads from parallax.
- The Sun: granulated photosphere with limb brightening, plus a two-layer corona
  that only blooms while the Sun is actually in frame.
3D is NOT for: decoration, random particles behind text, wallpaper replacement.

Camera path (the spine), one key per stage, eased-linear between keys:
  EARTH close and personal → MOON with Earth behind → MERCURY in extreme
  proximity → VENUS from above the clouds → EARTH ORBIT (pale dot, orbit lines
  appear) → MARS → INSIDE the belt with a wide lens → JUPITER overflowing the
  frame → SATURN above the ring plane → URANUS tilted and isolated → NEPTUNE
  dim and deep → OUTER (looking back across the system) → OVERVIEW (the whole
  disc in one frame) → THE SUN (a dive straight down the overview axis).
Easing is deliberately eased-linear rather than splined: the journey moves from a
1.5-unit fly-by to a 440-unit dive, and a spline through keys that unevenly
spaced overshoots the Solar System. Zero velocity at every key gives the rhythm:
arrive, settle, depart.

## 5. Page Structure & Storytelling
Every section declares the camera parameter it sits on, so the page can have
interstitials without the camera ever moving backwards.

1 PROLOGUE   The idea, one line of promise, and the way in. Sits on the Earth
             composition, so the concept arrives as a place, not a banner.
2 THE JOURNEY  Fourteen stages. Each stage is a landmark, and each declares how
             much it speaks:
               landmark — number, name, one line, telemetry (Earth, Mercury,
                          Jupiter, Saturn, the belt, the overview, the Sun)
               minimal  — name and one line (Moon, Earth Orbit, Mars, Neptune,
                          the outer system)
               silent   — no caption at all; the visual is the content
                          (Venus, Uranus)
3 MOMENTS    Six beats between stages, shorter than a stage (78svh): departure,
             the inner system, THE SCALE OF IT ALL, silence, orbital motion, a
             scale comparison. These carry the landing-page meaning — scale,
             emptiness, time — instead of another planet introduction.
4 EPILOGUE   Final statement, the expedition log (all fourteen stages with their
             distances, each one a deep link), the ways back in, and an honest
             colophon. The experience ends; it does not just stop.
Nav: ONE system — a floating rail of fourteen numbers, split at the asteroid belt
between the inner system and the giants, with a hairline journey-progress line
across the top. Below 48rem the same list becomes a full-screen sheet. No navbar
plus sidebar, no dashboard.
No hard section boundaries: the scene runs continuously behind transparent,
full-height stage windows.

## 6. Animation & Interaction
- Scroll = master driver: progress is one number (0 → 13) derived from where each
  section sits on screen; it feeds the camera, the progress rail and the active
  stage (GSAP ScrollTrigger for the scroll bookkeeping only).
- Camera: slow, eased, always forward; never hard cuts. Velocity is zero at every
  stage key, so each stop is a settle rather than a pass-through.
- Moments are paced differently from stages: shorter sections, quieter type, less
  to read — the rhythm of a film, not a metronome.
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
(lighter render or static frame + CSS starfield), the rail becomes a sheet.
Tablet: full scene, reduced particles. Desktop: full experience.
Re-choreography, not shrinking: at ≤1024px — or any near-square viewport — the
camera pulls back slightly, lifts the subject above centre and the caption drops
to the bottom of the frame, clear of it. The camera layout and the caption
placement use the same threshold, so they can never disagree.
Tap targets ≥44px; safe-area padding. Decide tier by capability + runtime FPS
probe — never user-agent sniffing. 🔶

## 9. Accessibility (visual)
AA contrast everywhere; prefers-reduced-motion → camera path collapses to gentle
fades, no starfield stretch/particles, simplified preloader ✅ hard requirement.
Scene aria-hidden + per-act text summary; full keyboard traversal, visible solar
focus outline; ALL critical content lives in DOM, never only inside the scene.

## 10. Assets
**Texture-free, and it stays that way.** Every visual is a shader, a primitive or
runtime geometry: planet surfaces, atmospheres, rings, belts, stars, dust and the
Sun's corona are all procedural. No textures, no models, no photographs, no
licensing surface, no asset bytes. Distances and radii are compressed on purpose
(log scale for distance, power scale for radius) and the compression is documented
in `src/three/anchors.ts`, which is the layout contract for the whole scene.
Unified grade (cool shadows / warm highlights) with ACES tone mapping. No stock
space wallpaper pasted as background.

## 11. Performance Principles
ONE WebGL context + ONE RAF loop for scene and scroll-sync. Draw calls <60 desktop /
<30 mobile; <150k visible tris. DPR ≤2 (1.5 low-tier); adaptive quality drops
particles/resolution first — never the narrative. KTX2 textures, merged geometry,
frustum culling, pause when tab hidden. Bundle: three+GSAP+site ≤ ~350KB gz.
Scene lazy-inits AFTER first paint; DOM content visible first, scene fades in —
never a black-screen wait. LCP is a DOM element, never the canvas.

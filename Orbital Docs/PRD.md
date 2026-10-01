# PRD.md — ORBITAL: A Solar System Journey
Status: v2.0 · Related: DESIGN.md, AGENTS.md
Supersedes v1.0 (the five-act "book a seat" concept). Technical requirements,
accessibility and performance budgets are carried over unchanged.

## 1. Purpose
Show what a cinematic, scroll-driven WebGL experience can feel like when the
subject is the Solar System itself: one continuous camera from Earth to the Sun,
with planets as landmarks inside a journey rather than sections in a catalogue.
The page is the destination — a showcase experience, not a funnel to a form.

## 2. Target Audience
Primary: design/engineering audiences evaluating craft, motion and 3D on the web.
Secondary: space enthusiasts who want scale and atmosphere, not an article.
Tertiary: press/partners who need a single link that explains the idea in 10s.

## 3. Concept & Value Proposition
"ORBITAL — the Solar System, end to end." One page, one camera, fourteen stages,
zero cuts. Value: real scale (distances compressed and documented, planet sizes
kept relative), real-time procedural visuals (no photographs, no textures), and
a landing page that still has an opening, a middle, moments and an ending.

## 4. User Journey
Opening (concept + one promise + the way in) → departure from Earth → the inner
system → the scale checkpoint → the belt → the giants (Jupiter, Saturn) →
silence → the far system → the pull-back → the Sun → ending (final statement,
expedition log, ways back in). Any stage reachable in one tap from the rail.

## 5. Section Structure & Goals (see DESIGN.md §5)
Prologue · 14 journey stages · 7 interstitials (6 moments + 1 manifesto) ·
Epilogue. Copy weight is explicit per stage: `landmark` (full caption),
`minimal` (name + one line), `silent` (no caption at all — visual only,
screen-reader summary still present). Moments are the beats that stop the page
reading as a planet list: departure, inner system, the scale of it all, silence,
orbital motion, a scale comparison. The **manifesto** (`#manifest`, between the
outer system and the overview) is the page's one value-proposition section:
three numbered editorial lines — one journey, true scale, drawn live — never a
feature grid. Each section declares the camera parameter it sits on, so an
interstitial can live between two stages without the camera ever moving
backwards.

## 6. Primary CTA
Four beats, one chain (BEGIN → CONTINUE → DISCOVER → BEGIN AGAIN), all of them
navigation inside the experience — no form, no backend:
1. "Begin the journey" (prologue, → #earth, solid) + "Why this journey" (→
   #manifest).
2. "Continue to Mars" (scale moment, → #mars, solid) — the only mid-journey
   conversion beat.
3. "See it all at once" (manifesto, → #overview, solid).
4. "Begin again at Earth" (epilogue, → #earth, solid) + "Linger at the
   overview" (→ #overview).

## 7. Required Interactions
Scroll-driven camera flight (one scene, one RAF loop) ✅ · journey parameter
drives camera + progress rail + active stage ✅ · boot-sequence preloader with a
stage readout ✅ · per-section reveals (stages and moments) ✅ · Kuiper belt and
asteroid fields as environment ✅ · orbit lines revealed as the camera pulls out
✅ · starfield stretch with travel speed ✅ · Sun corona that only blooms when it
is actually in frame ✅ · single navigation rail + mobile sheet ✅ · deep links to
any stage ✅.

## 8. Responsive Requirements
Mobile-first; the journey stays one continuous narrative without 3D (CSS sky);
3D tiers: full / reduced / skybox+CSS fallback; targets ≥44px; no horizontal
overflow 320–1920px; CLS ≤ 0.1. Responsive is re-choreography: below 1024px (or
near-square viewports) the camera subject moves above centre and the caption
drops to the bottom of the frame — the camera layout and the caption placement
switch together.

## 9. Scope Boundaries
IN: single static page; one WebGL scene; procedural visuals only; deep links;
static deploy. OUT: backend, forms, payments, CMS, blog, multi-language,
separate pages, autoplaying video/audio, account systems, texture/photo assets.

## 10. Acceptance Criteria
1. The 14 stages render in the fixed journey order, and the rail navigates to
   each one; no stage can be reached out of order by scrolling.
2. One persistent scene across the whole page (no per-section canvas swaps);
   visible, continuous camera progression; the rail marks the current stage.
3. Interstitial moments never move the camera backwards and never collide with
   the camera path (verified against the layout contract).
4. Reduced-motion: the camera collapses to one resting composition per stage
   (no continuous flight), no preloader animation, content 100% usable.
5. No-3D fallback (unsupported/blocked/failed): the full story with the CSS
   starfield; zero broken layout, identical DOM content.
6. Zero console errors/warnings on the built page.
7. Lighthouse mobile: Performance ≥ 85, Accessibility ≥ 95, others ≥ 95;
   LCP ≤ 2.5s; CLS ≤ 0.1; INP ≤ 200ms.
8. Keyboard: rail → sheet → every anchor operable, visible focus.
9. WCAG 2.1 AA contrast incl. over the brightest frames (centred captions carry
   a local scrim; compositions keep the subject clear of centred copy).
10. Bundle ≤ ~350KB gz (three+GSAP+site) with three.js and GSAP lazy-loaded
    after first paint; draw calls and triangles inside DESIGN.md §11 budgets.
11. All copy final (no lorem ipsum); every visual procedurally generated —
    no licensing surface, no asset bytes.

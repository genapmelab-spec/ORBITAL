# PRD.md — SPACE: Premium 3D Landing Page
Status: Draft v1.0 · Related: DESIGN.md, AGENTS.md

## 1. Purpose
Convert fascination with space into booking intent for a premium space-travel
brand through a cinematic, trust-building flight experience — delivered as a
fast, accessible, static single page.

## 2. Target Audience
Primary: aspirational premium travelers 25–55 (need: "is this real, safe, for me?").
Secondary: space/tech enthusiasts (need: depth, craft, credibility).
Tertiary: press/partners (need: polish, clear story).

## 3. Concept & Value Proposition
"ORBITAL — a spaceflight you can scroll." Value: a studio-grade cinematic journey
(5 acts, one camera flight) that makes interplanetary travel feel tangible and
bookable — distinct from generic space-background landing pages.

## 4. User Journey
Land (5s: awe + concept + CTA visible) → CROSS (emotional promise, credibility
signals) → ARRIVE (tangible destination, stats) → FLY (engineering trust) →
SECURE (book a seat / contact). Any point: nav CTA reachable in one tap.

## 5. Section Structure & Goals (see DESIGN.md §5 for composition)
Nav · Act 1 LEAVE (Hero) · Act 2 CROSS (Story/Why us) · Act 3 ARRIVE
(Destination: Mars) · Act 4 FLY (Technology/Spacecraft) · Act 5 SECURE
(Booking form + Footer). Each act: one message, one CTA path.

## 6. Primary CTA
"Book Your Trip" in nav (persistent) + act-level CTAs → #booking anchor.
Form: destination, date, passengers, name, email; "Reserve Your Seat" submit;
client-side validation + success state ONLY. 🔶 fields final at content review.

## 7. Required Interactions
Scroll-driven camera flight (one scene) ✅ · velocity-reactive starfield ✅ ·
stage/mission-log indicator ✅ · boot-sequence preloader ✅ · in-scene holo
stats 🔶 · pointer-tilt on craft (desktop) 🔶 · custom cursor 🔶 (cut if it
hurts usability) · overlay mobile menu · form validation UX.

## 8. Responsive Requirements
Mobile-first; acts remain a coherent vertical narrative without 3D; 3D tiers:
full / reduced / skybox+CSS fallback; targets ≥44px; no horizontal overflow
320–1920px; CLS ≤ 0.1.

## 9. Scope Boundaries
IN: single static page; one WebGL scene; client-side form validation; static
deploy. OUT: backend/payments/auth, CMS, blog, multi-language, separate pages,
autoplaying video/audio, account systems. No features added beyond this list.

## 10. Acceptance Criteria
1. Five acts render in order; anchors navigate; nav CTA always reachable.
2. One persistent scene across acts (no per-section canvas swaps); visible
   camera progression; stage indicator updates.
3. Reduced-motion: camera flight replaced by fades; content 100% usable.
4. No-3D fallback (unsupported/blocked): full narrative with static hero frame
   + CSS starfield; zero broken layout.
5. Form validates + success state; no console errors/warnings.
6. Lighthouse mobile: Performance ≥ 85 (3D page), Accessibility ≥ 95, others ≥ 95;
   LCP ≤ 2.5s; CLS ≤ 0.1; INP ≤ 200ms.
7. Keyboard: nav → CTAs → form fully operable, visible focus.
8. WCAG 2.1 AA contrast incl. over brightest scene frames.
9. Bundle ≤ ~350KB gz (three+GSAP+site); draw calls within DESIGN.md §11 budgets
   on mid-range Android (measured, not assumed).
10. All copy final (no lorem ipsum); imagery licensing confirmed (open decision).

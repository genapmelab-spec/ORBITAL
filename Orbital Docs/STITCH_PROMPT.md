# STITCH_PROMPT.md — Stitch AI Design Prompt for ORBITAL

**Source of truth:** `docs/DESIGN.md` (art direction + five-act structure). Nothing here overrides it.
**Purpose:** Ready-to-paste prompts for Stitch AI to explore the visual design of the ORBITAL landing page.
**Legend:** 🔶 sample copy invented for design exploration only — final copy is a content decision (PRD).

---

## How to use

1. **Set the theme first** (Stitch project theme): paste **Prompt 0 — Global Style** so every generated screen inherits one visual system.
2. **Generate screens one at a time, in order** (Prompts 1–5). Stitch works per screen; each prompt below is self-contained.
3. **Mobile:** for each act, follow up with the Mobile Variant note (§ Mobile).
4. **Review** every output against § Review Checklist before accepting. Iterate per screen; do not regenerate the theme.

---

## Prompt 0 — Global Style (paste as Stitch theme)

```
Design system for a premium cinematic space-exploration landing page called ORBITAL.
Mood: a film you can scroll — vast, quiet, confident, elegant. Cinematic sci-fi realism
(NASA photography feel), NOT synthwave, NOT cartoon, NOT SaaS dashboard.

COLOR (dark theme only):
- Background base: near-black deep space #030510
- Elevated surfaces/panels: #0A0F1E
- Primary text: #F2F5FA; secondary text: #8B95A9
- Action accent (ALL buttons/CTAs): ember orange #FF6B35
- Secondary accent (focus states, telemetry numbers): #FFC15E
- Atmospheric/data accent (thin lines, holo elements, never buttons): #7DD3FC
- One warm accent owns interaction; cool blue is atmosphere only.

TYPOGRAPHY:
- Display: Space Grotesk (geometric, wide counters) — huge headlines, tight leading
- Body: Inter — 16–18px, relaxed 1.6 line height, max 65ch measure
- Data/telemetry: JetBrains Mono — small uppercase labels, coordinates, stats
- Eyebrow labels: uppercase, 0.16em letter-spacing, mission-log style ("LOG 003 · ARRIVAL")

VISUAL LANGUAGE:
- Full-bleed cinematic space imagery: planets with thin atmosphere rim light,
  starfields with depth, one sun key light, deep black shadows, subtle bloom,
  very subtle film grain over everything
- Thin holographic ring/line/tick elements that carry REAL content (stage numbers,
  stats), drawn in the cool blue accent
- Depth hierarchy in every screen: foreground UI / midground subject / background cosmos
- Low density: one idea per viewport, generous negative space
- Asymmetric editorial layouts; huge display type may overlap and be clipped by
  the 3D subject (planet horizon slicing through a headline is a signature move)

BUTTONS: ember orange fill, dark text, generous padding, slight rounding,
hover = brighter fill sweep + small lift.
AVOID: purple gradients, neon grids, glass panels over critical text, glassmorphism
cards, repeated identical card rows, clip-art rockets, decorative meaningless 3D.
```

---

## Prompt 1 — Act LEAVE (Hero)

```
Design a full-viewport hero screen for ORBITAL, a premium space-travel landing page.

SCENE: Extreme close-up of Earth's curved horizon at the bottom of the frame, thin
glowing atmosphere rim (pale blue) separating planet from pure black space. Fine
multi-depth starfield above. One subtle sun key light from the right.

CONTENT (top to bottom):
- Transparent top nav: wordmark "ORBITAL" left; center links: Destinations, Spacecraft,
  Technology; right: ember orange button "Book Your Trip"
- Pinned stage indicator top-right corner: "01 — LEAVE" in mono uppercase
- Headline (display font, very large, positioned low-left, OVERLAPPING the planet
  horizon so the planet cuts across the letterforms): "The journey off Earth
  begins here" 🔶
- Sub-line (muted, max 3 lines): "Private orbital flights for those who intend
  to go. Not someday — this decade." 🔶
- Primary CTA: ember button "Reserve your seat"

FEEL: awe in five seconds; negative space is the luxury; text sits on the darkest
zone with a soft scrim for contrast.
```

## Prompt 2 — Act CROSS (Story / credibility)

```
Design the second screen of ORBITAL: a deep-space drift moment between Earth and Mars.

SCENE: Wide open starfield filling the frame, subtle nebula haze; a distant small
spacecraft silhouette far off-center. Almost empty — vastness is the point.

CONTENT:
- Stage indicator: "02 — CROSS"
- Eyebrow: "LOG 002 · THE CROSSING"
- Experimental editorial layout — NOT a card row: three oversized index numerals
  (01 / 02 / 03) in display font, scattered asymmetrically at different sizes and
  vertical offsets, each with a short claim beside it:
  01 "Engineered by aerospace veterans" 🔶
  02 "Tested beyond every requirement" 🔶
  03 "Crewed by people, not passengers" 🔶
- One muted supporting paragraph, max 65ch, placed off-center.
- No CTA button on this screen (optional text link "Why we fly →").

FEEL: quiet confidence; typography as a spatial object; huge negative space;
nothing repeated or grid-aligned.
```

## Prompt 3 — Act ARRIVE (Destination: Mars)

```
Design the third screen of ORBITAL: arrival at Mars.

SCENE: Mars fills the right two-thirds of the frame — photoreal rust-red surface,
dust-hazed terminator line, thin dusty atmosphere rim. Dark space on the left third.

CONTENT:
- Stage indicator: "03 — ARRIVE"
- Eyebrow: "LOG 003 · ARRIVAL"
- Right-aligned headline overlapping the planet's edge: "Mars is not a metaphor." 🔶
- Big stats rendered as thin holographic telemetry labels (mono font, cool blue
  lines and ticks) floating over the scene:
  "225M KM — average distance" · "7 MONTHS — transit" · "45 DAYS — surface stay" 🔶
- Ember CTA: "Explore the Mars program"

FEEL: tangible destination, documentary realism; stats feel like instruments,
not marketing badges.
```

## Prompt 4 — Act FLY (Spacecraft / technology)

```
Design the fourth screen of ORBITAL: the spacecraft.

SCENE: Hero spacecraft in clean side profile crossing the frame diagonally, precise
engineered hull lit by one sun key light, faint engine exhaust particles trailing.
Deep starfield background.

CONTENT:
- Stage indicator: "04 — FLY"
- Eyebrow: "LOG 004 · THE VESSEL"
- Display headline overlapping the hull: "A vessel built for the void" 🔶
- Specs as a mono telemetry table (thin hairline rows, cool blue accents):
  CREW 8 · PRESSURIZED VOL 340 m³ · THRUST 1.2 MN · LIFE SUPPORT 24 MONTHS 🔶
- Three compact capability notes (propulsion / navigation / life support) as short
  labeled paragraphs — stacked or offset, NOT three identical cards.
- Ember CTA: "See the engineering"

FEEL: trust through engineering calm; every element precise, aligned to an invisible grid.
```

## Prompt 5 — Act SECURE (Booking + footer)

```
Design the final screen of ORBITAL: booking.

SCENE: The journey ends — calm receding view of Mars small in the distance, soft
starfield, everything quiet and still. The world steps back; focus moves to UI.

CONTENT:
- Stage indicator: "05 — SECURE"
- Centered headline (this act may break the asymmetry rule for focus):
  "Secure your place in orbit" 🔶
- One elevated dark panel (#0A0F1E, hairline border) containing the booking form:
  fields Destination (select), Departure window (date), Passengers (stepper),
  Full name, Email; ember submit button "Reserve Your Seat"; microcopy under the
  button: "No payment today — our crew contacts you within 48 hours." 🔶
- Quiet footer below: wordmark, anchor links (Destinations, Spacecraft, Technology,
  Contact), legal line, coordinates as mono decoration.

FEEL: stillness and certainty; the form is the hero; zero competing visual noise.
```

---

## Mobile variant note (append to any act prompt)

```
MOBILE VARIANT: same act, single column. Scene becomes a vertical cinematic backdrop
(crop to the subject's strongest region); headline first, then copy, then CTA within
thumb reach; stage indicator stays pinned; nav collapses to overlay menu with the
ember CTA visible in the bar. Tap targets ≥44px. Re-choreograph the composition —
do not shrink the desktop layout.
```

---

## Review Checklist (accept/reject each Stitch output)

1. **System adherence** — one warm accent (ember) owns all interaction; blue never on buttons; dark theme only.
2. **Act distinctness** — no two screens share a layout skeleton; no identical card rows anywhere.
3. **Signature moves present** — headline overlapping the 3D subject; stage indicator; holo telemetry labels carrying real content.
4. **Density discipline** — one idea per viewport; negative space preserved; nothing decorative without narrative purpose.
5. **Contrast** — text over the brightest scene zones has scrims; AA contrast holds.
6. **Cinematic realism** — reads as NASA-photography class; no synthwave, no cartoon, no glassmorphism over critical text.
7. **Feasibility** — every screen is achievable as DOM content over one persistent WebGL scene (per DESIGN.md §11); no effects that require per-section canvases.
8. **Mobile re-choreography** — each act has a composed vertical variant, not a shrunken desktop.

Outputs failing checklist items 1, 2, or 5 must be regenerated; the others may be fixed in iteration.

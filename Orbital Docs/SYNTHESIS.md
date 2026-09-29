# SYNTHESIS.md — How five references became one ORBITAL system

Status: built. Every decision below is implemented; each row names the artifact
that carries it. Reference images are inspiration only — no brand, layout,
artwork or logo was reproduced.

---

## 1. What each reference actually does well

Read on axes, not on looks. The question is never "what does it look like" but
"what is the mechanism that makes it work".

| # | Reference | Mechanism that works | What it is good at |
|---|-----------|----------------------|--------------------|
| 1 | `Design ke 4` | Promise-first hero: one line of enormous type, one planet, one amber CTA | Emotional clarity. It tells you what the product is in four words. Weak elsewhere: its body is a generic stacked section list. |
| 2 | `Design ke 5` | Editorial restraint. Multi-line display type where one word drops to *italic accent*, and vast negative space around it | Type scale, generous silence, and one structural idea: the horizontal origin → destination rail |
| 3 | `ORBITAL …Mars Inspection` | The most ORBITAL-native system: mission-log chrome, numbered acts, a stage list, ghost numerals, numbered mono form labels, telemetry everything | Density of *information design* without a dashboard. It is the only reference that treats the page as a **flight** |
| 4 | `Design ke 2` | Circular/porthole framing + layered ghost type (a visible line, an orange line, a ghost third line) | Spatial motifs: the porthole gives a planet consequence; ghost layering gives type depth |
| 5 | `Design ke 3` | Giant ghost watermark behind real content, destination-card selection, oversized editorial footer wordmark | Section-level composition variety and a genuine selection interaction |

**Direct conflict found and resolved:** reference 5 also carries a persistent
left index rail (`[03 THRESHOLD]`) with brackets. That is the single strongest
element in that image and it is a **sidebar**. It is excluded outright — the
brief forbids it, and it would also fight the one-scene camera flight, because a
fixed left rail implies discrete pages while the camera implies one continuous
journey. Its job (orientation) is taken over by reference 3's right-edge
mission log, which is an *indicator* with five dots, no panel, no links to other
documents — and it disappears below 1024px.

---

## 2. Synthesis: one system, not five sections

The organising principle is **act, not section**. Reference 3 supplied the act
model; DESIGN.md §5 supplied the five act names; the other four references each
contributed *how an act is composed*. That is why no two acts share a layout
skeleton — the variety is structural (each act is a different reference's
strength, rebuilt in ORBITAL's own type and colour), not decorative.

### 2.1 Visual system

Five rules that make the references cohere into one language:

1. **Hairline telemetry, never cards.** Every box on the page is a 1px
   `--color-line` rule over transparency (`--color-panel` at 72–90% opacity).
   No border radius except pills and the radio dots. (ref 3)
2. **One interaction colour.** `--ember` owns every CTA, every active state,
   every accent word. Nothing else is warm. (refs 1 + 3)
3. **Layered type is a depth cue.** A headline can be white / ember / muted in
   three consecutive lines; ghost numerals and watermarks sit at 5.5% opacity
   behind real content. (refs 2 + 4 + 5)
4. **Mono is the voice of the machine, display is the voice of the brand.**
   Anything measured, numbered, logged or validated is JetBrains Mono, uppercase,
   0.16em tracking. Anything asserted is Space Grotesk. (refs 3 + 5)
5. **Negative space is the luxury signal.** One idea per viewport, low density,
   asymmetry by default. Centred composition is reserved for act 5. (ref 2)

### 2.2 Hero

Composed from three references and none of them as a template:

- **Which visual:** not a floating planet portrait (that is a stock-photo
  cliché) but Earth's **limb**. The camera sits below the horizon so the curve
  crosses the lower-right corner and the atmosphere rims it in `--ion`. This is
  the reference-2 "HOME." mechanism — a planet seen as an *edge* rather than an
  object.
- **Typography:** reference 5's mechanism — three stacked lines, final line
  ember. `BEYOND / THE STARS / AWAITS YOU.` left-aligned, low, overlapping the
  horizon (DESIGN.md §7.5: type as a spatial object).
- **CTA:** reference 3's dual CTA — solid ember primary with a `→`, ghost
  secondary. Reference 1's single amber button is the reason the ember token
  exists.
- **Navigation:** reference 3's mission log (brand + `SYS` + five numbered acts +
  `BOOKING: STANDBY` + ember pill).
- **3D composition:** reference 2's porthole logic applied to act 1 — as the
  camera pulls back the horizon recedes, and a DOM holo label is projected from a
  real point on the planet's limb (`earth.limbAnchor`), not placed by hand.
- **First impression:** awe + concept + CTA inside one viewport, with the
  boot-sequence preloader (DESIGN.md §6) as the transition into it.

### 2.3 Section flow

Deliberately not a standard landing-page order. It is a flight:

```
LEAVE   awe + promise                    (ref 1 content, ref 2 framing)
CROSS   the promise, argued              (ref 3 headline discipline + ref 5 rail)
ARRIVE  the place, quantified            (ref 3 stat row + ref 4 porthole)
FLY     the machine, specified           (ref 3 spec cards + ref 5 restraint)
SECURE  the decision                     (ref 3 numbered form + ref 5 selection)
FOOTER  the recede                       (ref 5 oversized wordmark)
```

Two structural imports that are *not* a section each, because they work better
as punctuation than as chapters:

- **The origin → destination rail** (ref 2, "BETWEEN TWO WORLDS.") closes act 2.
  It is the only place the reader is shown the whole journey at once, and it
  arrives exactly after the three trajectory vectors have explained the legs.
- **The ghost watermark `MARS`** (ref 5's ghost schedule) sits *behind* act 3's
  stat grid rather than beside it, so the four cards read as annotations on a
  place rather than as a dashboard.

### 2.4 Transitions

The references treat sections as separate images. ORBITAL cannot: the brief asks
for one continuous experience, so the boundary between acts is a **camera move**,
not a hard edge.

- Scroll maps per act onto one quarter of the camera path, and the mapping is
  continuous (the end of an act equals the start of the next), so the flight
  accelerates through an act and settles on its framing. Implemented in
  `src/scripts/scrollController.ts`.
- Camera progress is exponentially damped (`PROGRESS_SMOOTHING`), which gives
  the weightless ease-out the art direction asks for and hides any scroll jitter.
- No section has a border, background change or spacer that reads as a seam;
  in-scene haze and the star shells blend them.
- The starfield stretches radially from the vanishing point with scroll velocity
  (`src/three/objects/starfield.ts`) — the warp is a transition *between* acts.

### 2.5 3D

Reference 3 uses 3D as the subject of the page; DESIGN.md demands that it never
be decoration. Three rules kept the two compatible:

1. **3D is the world, DOM is the content.** One persistent
   `WebGLRenderer` / one RAF loop / one scene (`src/three/OrbitaScene.ts`); the
   canvas is fixed and never remounts, so the camera progression is the page
   transition.
2. **The 3D is anchored to the layout, not behind it.** Act 3's porthole ring is
   the *projected screen footprint of Mars*, computed per frame
   (`src/three/anchors.ts`) — if the camera moves, the ring moves. Act 4's
   holo label is bound to the cruiser's hull. This is reference 4's porthole and
   reference 3's holo callouts, made real instead of drawn on.
3. **Everything is procedural.** Earth, Mars, the starfield, the cruiser and its
   plume are generated in code (shaders + primitives + a runtime canvas env map).
   No downloaded textures or models, so there is no licensing question and no
   asset weight.

### 2.6 Typography

Reference 5's hierarchy, rebuilt for ORBITAL with reference 2's ghost layering:

| Role | Face | Setting | Source of the idea |
|------|------|---------|--------------------|
| Display | Space Grotesk | `clamp(2.6rem, 8.4vw, 7.25rem)`, `-0.038em`, `0.86` leading, uppercase | ref 5 scale + ref 3 uppercase mass |
| Act headline | Space Grotesk | `clamp(2.25rem, 6.4vw, 5.25rem)` | ref 5 |
| Statement line | Space Grotesk, muted at `0.4em` | deliberately drops out of the display scale | ref 3 (its third line is visibly smaller) |
| Body | Inter | `clamp(0.975rem … 1.125rem)`, measure `46ch` | ref 2 |
| Log / data | JetBrains Mono | uppercase, `0.16em` tracking, `11–13px` | refs 3 + 5 |
| Ember accent | italic on *one word only* | `BETWEEN TWO *WORLDS.*`, `CLAIM YOUR SEAT AT THE *HORIZON.*` | ref 5 |

Depth comes from layering, not from more sizes: a ghost `02`/`MARS` watermark
behind, a display line mid, a mono eyebrow in front.

### 2.7 Mobile

DESIGN.md §8 and the brief both forbid shrinking the desktop. The
recomposition that shipped:

- The pinned right-edge mission log is replaced by a 2px ember progress rail at
  the very top (below 1024px) — same information, no rail to collide with.
- Act 4's right-aligned headline and the act's two-column grids reflow to a
  single column; the CTA pair becomes full-width rows so the primary action owns
  the thumb zone.
- The porthole ring and the holo labels are removed entirely below 1024px rather
  than scaled down: they are a desktop reading aid, and at phone size the same
  facts are already in the DOM (the "LIVE TELEMETRY" pill, the stat cards).
- 3D tier is decided at runtime from features and measured frame time
  (`src/three/quality.ts`), never from a user-agent string. A phone gets the CSS
  composition: `.css-stars` + a static CSS hero horizon, with identical DOM
  content. Verified: canvas `display:none`, stars `block`, zero overflow at
  320–390px.
- Nav collapses to brand + ember CTA + overlay menu; the `SYS` chip is dropped
  so the 44px menu target never clips at 320px.

---

## 3. What was rejected, and why

| Element | Reference | Why not |
|---------|-----------|---------|
| Persistent left index rail with brackets | 5 | It is a sidebar. Also implies discrete pages, which contradicts one continuous flight. |
| Serif-leaning headline | 1 | Fights the technical register of the mission-log chrome (ref 3). Space Grotesk keeps one voice. |
| Card row in every act | 1, 3 | Repeating the same skeleton five times is what makes a page read as a template. Only act 3 uses a numbered card row; act 4 uses a hairline lattice, act 2 a stacked definition list. |
| Centred composition throughout | 5 | Reserved for act 5 so the booking panel is the only centred thing on the page and therefore clearly the destination. |
| Purple/neon gradients | 1 | Explicitly excluded by DESIGN.md §2. |
| HUD-clone telemetry | 3 | Kept, but reduced to real data only: no fake graphs, no decorative readouts. Every number on the page is either true of the fiction or absent. |
| Custom cursor reticle | — | Open decision 🔶 in DESIGN.md §6. Cut: it fights text selection and form input for no narrative gain. |

---

## 4. Where each reference is visible in the shipped page

- **ref 1** — the promise-first hero sentence, the single ember CTA, the
  destination/booking content baseline.
- **ref 2** — the multi-line display headline with a muted third line, the
  `BETWEEN TWO WORLDS.` origin → destination rail, the italic ember accent word,
  the body measure and silence.
- **ref 3** — the whole chrome: mission-log nav, five-act stage log, dial,
  `LAUNCH READINESS` row, `ARRIVAL PROTOCOL // 03`, the four numbered stat cards,
  the `ORBITAL X1 CRUISER` spec lattice, the numbered mono form labels, the
  ember-bordered success state, the telemetry footer.
- **ref 4** — the porthole ring around Mars (drawn from the planet's real screen
  footprint), and the white / ember / ghost three-line layering.
- **ref 5** — the type scale and restraint, the `MARS` ghost watermark behind
  act 3, the destination-card radiogroup in act 5, the oversized
  `EARTH / DEPARTURE / ELSEWHERE` footer.

## 5. Verification of the synthesis

- No `sidebar` element, class or fixed left rail exists in the codebase.
- No two of the five acts share a layout skeleton: hero (bottom-packed, overlap),
  act 2 (asymmetric 1.35/0.9 split + stacked definition list + rail), act 3
  (split head + numbered card row + protocol row), act 4 (right-aligned head +
  hairline lattice + telemetry strip), act 5 (centred, single panel).
- Five acts in narrative order; one persistent scene (acceptance criterion 2).
- `npm run build` and `npx astro check`: 0 errors, 0 warnings, 0 hints.
- Runtime console: no errors, no warnings.
- Budget: 191 KB gz JS total (limit 350 KB), of which three.js (141 KB gz) is
  fetched only after first paint; 9 KB gz CSS; 8 KB gz HTML.

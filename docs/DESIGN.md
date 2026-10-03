# DESIGN — ORBITAL

The page is a dark room with real light in it. Everything visual descends from
that sentence: a cold, near-black ground; bone text; one hot colour that only
ever means "you can interact with this"; one solar highlight; one ion blue
reserved for data.

## 1. Visual identity

- **Professional, cinematic, precise.** The reference is an instrument panel in a
  documentary opening shot, not a sci-fi interface.
- **Controlled asymmetry.** Nothing is centred unless the page itself is
  speaking. Stations alternate sides; the 3D subject always takes the side the
  copy does not.
- **Type over chrome.** There are no panels, no cards, no borders except
  hairlines. Hierarchy comes from scale, weight and space.
- **Loud and quiet.** A station is quiet; the belt, Jupiter and the Sun are loud.
  The rhythm is scripted in the camera keys, not discovered by scrolling.
- **Restraint as identity.** Two gradients exist in the whole page, both
  documented below. Glow is used in exactly three places: the ember CTA, the
  focus ring, and light that is actually emitted by a star.

## 2. Colour system

Defined once in `src/styles/tokens.css`; the 3D layer mirrors it in
`src/three/systems/palette.ts`. No component writes a hex value.

| Token | Value | Role |
| --- | --- | --- |
| `--void` | `#05060B` | Page background, the unlit room |
| `--deep` | `#0A0D15` | Raised surface: navigation panel, skip link |
| `--ink` | `#EDEFF5` | Primary text, planet light |
| `--muted` | `#8B93A7` | Secondary text |
| `--faint` | `#5A6172` | Tertiary text, indices |
| `--ember` | `#FF5C2E` | **Interaction only**: primary buttons, active navigation mark, the date slider thumb |
| `--solar` | `#FFC46B` | Focus ring, act numbering, the emphasised words in the hero headline, star light in the scene |
| `--ion` | `#86D3FF` | Data: station indices, the live metric, orbit guides, progress |
| `--hairline` | `rgb(139 147 167 / 0.2)` | Every dividing line on the page |
| `--scrim` | `rgb(5 6 11 / 0.66)` | Text protection where copy overlaps the scene |

Two gradients, no more:

- `--grad-ember` — reserved for the primary CTA's hover/active treatment.
- `--grad-deep` — the navigation's fade-to-nothing, so the bar never has a hard
  edge over the scene.

Paired with the scene's own light, `--solar` is the true Sun colour
(`#FFF3D6` core, `#FFB545` limb); the CSS token is the dimmed print version of
the same light.

## 3. Typography

Three voices, each with a job:

| Voice | Face | Used for | Never used for |
| --- | --- | --- | --- |
| **Statement** | Instrument Serif (400, italic) | The page speaking: hero headline, premise title, act names, "Take the controls.", the close | Body copy, labels, buttons |
| **Structure** | Space Grotesk (400–600) | Headings that name the model (station names), body text, buttons, navigation | Long-form text — nothing runs longer than four lines |
| **Data** | JetBrains Mono (400–500) | Indices, kickers, metrics, readouts, navigation labels, colophon | Sentences |

Scale (all fluid, all in tokens): hero `clamp(2.5rem, 6.6vw, 5.2rem)`; statement
`clamp(1.95rem, 5vw, 3.9rem)`; station name `clamp(2.1rem, 5.4vw, 4.2rem)`,
uppercase, tracking `0.01em`; body `1.0625rem/1.6`; mono `0.72rem`, tracking
`0.16em`, uppercase.

Rules: headings never exceed ~24 characters per line; `text-wrap: balance` on
headings and `pretty` on paragraphs; italic serif is never used below 1.05rem.

## 4. Layout

- **Gutter** `clamp(1.25rem, 4.2vw, 4.5rem)`; **measure** `min(36rem, 86vw)` for
  prose, `min(30rem, 82vw)` for station copy.
- **Rhythm** `clamp(5.5rem, 14vh, 11rem)` between sections, then broken on
  purpose: the premise runs at 1.15×, stations at 0.8×, the hero at 190svh with
  a sticky inner viewport.
- **Vertical variety** is authored, not generated: station copy sits at the
  bottom on left-sided stations and at the top on right-sided ones; the three
  claims step down at 0/1.5/3rem; the acts move left, right, and indented by
  `--tilt-c`.
- **Crossings.** Exactly three elements are allowed to cross a section boundary,
  each by a fixed negative margin: the station index over its hairline, the act
  names over the space before their stations, and the close statement over the
  control section. No other element may overlap a section edge.
- **Z-layers**: canvas `0` → content `1` → chrome `20` → veil `30`.
- **Breakpoints**: `68rem` (premise and claims collapse to one column, act
  alignment resets, navigation folds behind the *Destinations* trigger — ten
  inline links need more width than a tablet has) and `47.99rem` (mobile:
  stations stack bottom-left, the section indicator hides, annotations are
  hidden, portrait camera bias).

## 5. Motion

Motion is weightless and intentional: nothing bounces, nothing spins for
decoration, nothing moves without a reason in the script.

| Moment | Treatment |
| --- | --- |
| Opening | The camera holds; the identity arrives in a 0.9 s stagger, ease `power3.out`. The window leaves by opening outward — it grows past the frame and fades, it does not cut |
| Camera travel | Eased straight segments with a quintic ease (zero velocity and acceleration at both ends), damped twice: 7 Hz in the scene, per-section holds in the scroll mapping |
| Arrival | The camera settles before the copy does; section reveals are `opacity 0→1` and `y 22→0` over 0.75 s, staggered 0.08 s, `power2.out`, once |
| Spatial annotations | Fade in over 0.38 s, ±0.34 of the camera parameter around their station, projected every frame |
| Navigation | Retracts after 3 s without intent, returns in 0.42 s on `--ease-soft` |
| Hover | 1 px lift, 180 ms; the ember glow appears on the CTA only |
| Progress | A 1 px ion line under the navigation, scaled by `--journey-progress` |

Tokens: `--dur-quick 180ms`, `--dur-base 380ms`, `--dur-slow 640ms`,
`--dur-chrome 420ms`, `--ease-out cubic-bezier(.16,.84,.28,1)`,
`--ease-soft cubic-bezier(.33,0,.2,1)`.

**Reduced motion** (`prefers-reduced-motion: reduce`): the camera jumps between
whole keys, reveals are instant, all transitions collapse to 1 ms, smooth
scrolling is off. The model still works — the date control still moves the
planets — because the motion is removed, not the meaning.

## 6. What the design refuses

No neon outlines. No glass morphism panels. No card grids. No drop shadows on
text. No gradient text. No parallax on the copy (only the camera moves). No
animation that plays without the visitor causing it. No colour that does not
come from the table above.

# RESPONSIVE — ORBITAL

There is no "desktop version" that phones get a cut-down copy of. The same eight
rungs, the same four mechanisms and the same camera work on every class of device;
only density and framing change. This document lists exactly what changes, where,
and why.

## 1. Breakpoints

Three authored layouts, shipped in one stylesheet:

| Range | Layout | Notes |
|-------|--------|-------|
| ≥ 1024px | Wide: plates to one side, sticky for the whole hold | Full label set, ruler tips on hover/focus |
| 768–1023px | Tablet: same layout, less bottom padding on the sticky plate, header sub-line hidden | `@media (max-width: 1023px)` |
| ≤ 767px | Portrait phone: plate is a card in flow, camera biased upward, bigger touch targets | `@media (max-width: 767px)` |

Nothing is width-tested in JavaScript for layout. The only width read in script is
the tier probe (section 4).

## 2. What changes on a phone

| Element | Change | Why |
|---------|--------|-----|
| Hero | `min-height` 210svh → 186svh, title `clamp(2.1rem, 10.5vw, 3rem)`, cue hidden | The identity must fit one glance; the cue is redundant when the aperture has obviously opened |
| Instrument | Padding tightened, rule rows go from two columns to one | Values need the full line |
| Rung | `152svh` (was 162svh); **the sticky plate becomes static** and the section's own padding carries the hold | A pinned panel taller than the viewport is where nested-scroll bugs are born; the camera still holds the shot for the section |
| Plate | Full width, tighter padding; the label (*Nearest delay*) is hidden; index and source stay | The label is context, not information; the source line is information and is never dropped |
| Numeral | `clamp(1.85rem, 11vw, 2.7rem)` | Keeps the numeral the loudest thing on the card without wrapping |
| Buttons | `min-height: 44px`, wider padding | Touch target floor |
| Ruler | Marks become 30×44px hit areas, tips hidden | The readout, not the tooltips, is what a phone needs; marks stay tappable |
| Index | Full-width sheet, no left border | It is a sheet, not a drawer |
| HUD | Moves from the bottom to the top | It would sit under the thumb otherwise — and it is only ever present under `?hud=1` |

`svh` (small viewport height) is used for every meaningful vertical measure so
mobile browser chrome appearing/disappearing cannot hide a line of copy. The page
also sets `viewport-fit=cover`, and body text drops to a 16px floor on phones
(no iOS zoom-on-focus surprises).

## 3. The camera on portrait

`frameAt(pos, portrait)` applies a fixed bias when `height > width`:

```
x *= 0.45        // recentre the subject
y  = y * 1.05 + 6  // lift it above the card
z *= 1.38        // back off, so the object fits the narrower field
```

This is why the shots are authored as data rather than as a spline with per-device
overrides: one function, applied to every frame, keeps the subject above the plate
on a 390×844 screen without touching a single rung's authored frame.

## 4. Device tiers

`detectTier()` (`src/lib/quality.ts`) is a capability probe, not a user-agent sniff:

| Condition | Tier |
|-----------|------|
| Coarse pointer **or** width < 760px | `low` |
| Width < 1180px **or** `hardwareConcurrency ≤ 4` | `mid` |
| Otherwise | `high` |

`low` means fewer stars/motes/filaments/cloud points, DPR capped at 1.25, no
ribbon and no antialiasing (docs/3D.md §8) — and *nothing else*. The governor can
demote or promote at runtime from measured frame times, so a misjudged device
corrects itself within a couple of seconds.

## 5. The measured passes

The browser acceptance list for this project includes:

* **1440×900, tier high** — the ladder mapping, the frame the camera holds on each
  rung, draw calls per rung, and the experiment paths.
* **390×844 (portrait phone)** — the card layout, the ruler hit areas, the index
  sheet, and the camera bias.
* **Landscape / short viewport** — the sticky plate must not exceed the viewport;
  the ruler must stay reachable.
* **`?motion=reduce`** — jump-only camera, immediate reveals, no CSS transitions.
* **`?nowebgl=1`** — CSS sky, disabled controls, all copy present.

Where a pass could not be completed in the environment used for development (a
headless screenshot limitation, for example), it is reported as a limitation rather
than claimed — see the repository README's verification notes.

## 6. Type scale behaviour

The two display sizes (`hero-title`, `plate-title`) use `clamp()` with a `vw`
preferred value, so they scale continuously instead of stepping at breakpoints.
Body copy uses one base size (16px on phones, 17px above) and never goes below it.
The ruler's readout, the source lines and the arrows use the mono family at a fixed
size, because an instrument's readout that changes size is harder to compare across
rungs.

## 7. Touch and pointer

* Every control is at least 44px in its smallest dimension on phones.
* Pointer parallax is disabled on coarse pointers (`matchMedia('(pointer: coarse)')`)
  — a phone should not have the camera chasing a finger that is trying to scroll.
* Hover-only affordances are avoided; the ruler's tips appear on `:focus-visible`
  as well as `:hover`, and the same information is in each mark's `sr-only` label.
* No gesture is required anywhere: no swipe, pinch, drag-to-rotate or long-press.
  The only drag is the two sliders, which are native range inputs.

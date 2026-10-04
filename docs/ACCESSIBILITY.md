# ACCESSIBILITY — ORBITAL

The rule this page was built around is blunt: **the lesson may not depend on the
3D, on JavaScript, or on motion.** Everything else in this document follows from
it. Where a mechanism makes the page heavier to read, the text is the product and
the mechanism is the demonstration.

## 1. The floor

* **Content is in the DOM.** All eight rungs — arrow, name, numeral, fact,
  explanation, source — are server-rendered into `index.html` before any script
  runs. The React app re-renders the same content from the same source file
  (`src/content/ladder.ts`); it does not own it.
* **The canvas is `aria-hidden="true"`** and wrapped in a `.stage` div that is also
  hidden from the accessibility tree. There is no information in the scene that the
  text does not already state; the sky never needs to be described.
* **No WebGL** (`?nowebgl=1`, or a browser that cannot give a context): the canvas
  is never mounted. `CssSky` paints a flat colour that follows the rung, and the
  instrument section says so in a visible note instead of pretending.
* **No JavaScript**: the `<noscript>` block contains the whole ladder as a list,
  injected at build time by the `noscriptLadder()` plugin, and `check:budget`
  fails the build if the eight rungs are missing from it. Without JS the page is a
  readable essay with its sources; it is not an empty shell.
* **A failed scene must not take the lesson with it.** If the lazy Stage chunk
  never arrives, `SceneBoundary` swaps in `CssSky` and the page continues.

## 2. Structure and landmarks

| Region | Element | Name |
|---|---|---|
| Skip | `<a class="skip" href="#moon">` | first focusable item on the page |
| Banner | `<header class="chrome">` | — |
| Main | `<main id="top">` | hero, instrument, 8 rung sections, close |
| Rungs | `<section id="moon"> … <section id="firstlight">` | each with its own `<h2>` |
| Navigation | `<nav class="ruler" aria-label="The look-back ladder">` | ordered list of marks |
| Index | `<div role="dialog" aria-modal="true" aria-label="The ladder index">` | `hidden` when closed |

The skip link is the first tab stop, jumps past the fixed chrome to the first
rung, and is invisible until it is focused (`.skip:focus-visible`).

## 3. The ruler

The ruler is both the navigation and the lesson, so it carries the most state:

* Each mark is a real `<button>` inside an `<ol>`, reachable by <kbd>Tab</kbd>,
  activated by <kbd>Enter</kbd> or <kbd>Space</kbd>. Activating one scrolls to that
  section (smooth, or instant under reduced motion).
* The accessible name of a mark is spelled out, e.g. *"01 · The Moon · 1.28 s
  ago"*, from an `.sr-only` span. The hover tooltip is `aria-hidden` so the same
  text is not announced twice.
* The rung you are at carries `aria-current="true"`.
* The running readout — *"look-back 1.28 s"* — updates every frame in the visual
  layer, so the visible number is `aria-hidden`. Beside it, an `.sr-only` span
  carries the spoken form (*"1.28 seconds"*, *"13.8 billion years"*) and updates
  only when that sentence actually changes. It is deliberately **not** a live
  region: a number changing sixty times a second must never be announced.

## 4. The chrome and the index

* The status line in the header — *"1.28 s ago · The Moon"* — is `aria-live="polite"`
  and changes only when the rung changes, not while travelling.
* The index button is a real button with `aria-expanded` and `aria-controls`
  pointing at the dialog.
* The index panel is a modal dialog: closing is <kbd>Escape</kbd> or the close
  button, focus moves to the first entry when it opens, and the page behind it is
  covered by a backdrop button that is removed from the tab order
  (`tabindex="-1"`). The panel is `hidden` when closed, so it is not in the
  accessibility tree at all.
* The chrome retracts after three seconds without intent, and returns on any sign
  of use — including focus, so a keyboard visitor never loses the header.

## 5. The experiments

Four mechanisms, eight rungs, and in every case the conclusion is text that is in
the DOM whether or not anything is operated. `spec.result` and `spec.detail` are
always visible.

| Mechanism | Control | Accessibility |
|---|---|---|
| pulse (Moon, Voyager) | `<button>` | disabled while running and under no-WebGL; a polite `aria-live` reports the outcome sentence; the ticking clock is visual only |
| scrub (Sun, First Light) | `<input type="range">` | visible `<label for>`; `aria-valuetext` carries the current phase sentence (*"Light leaves the surface"*), not just `0.42` |
| choice (Betelgeuse, Crab, Core, Andromeda) | `role="group"` of `<button aria-pressed>` | the group is labelled with the prompt; the note for the chosen option is also announced politely |

Under `?nowebgl=1` the controls are `disabled` rather than pretending to work; the
result text and the sources remain, and the instrument section explains why.

## 6. Numeral semantics

A value like `13.8` + *billion years* is a fragment to a screen reader. Each rung
heading therefore appends `.sr-only` text: *"ago — First Light"*, so it reads as
"13.8 billion years ago — First Light". The `/08` counter in the plate head is
`aria-hidden`, because the spoken "03" already carries the index.

## 7. Colour and contrast

Every colour is defined once in `src/styles/tokens.css`. Measured WCAG contrast
ratios (relative luminance, normal-text threshold 4.5:1) against the two field
colours:

| Token | Value | on void `#05070b` | on deep `#0b0e14` |
|---|---|---|---|
| `--color-ink` (body) | `#e9e5dc` | 16.04 | 15.37 |
| `--color-dust` (secondary) | `#8a8f99` | 6.21 | 5.95 |
| `--color-faint` (labels, marks) | `#747b88` | 4.73 | 4.54 |
| `--color-signal` (live state) | `#6fe0c8` | 12.65 | 12.12 |
| `--color-flare` (default accent) | `#ffb265` | 11.34 | 10.86 |
| accents, worst case (`core`) | `#c97b4a` | 6.16 | 5.90 |

`faint` is the one token that was changed for this document: at its original
`#5b616c` it measured 3.24:1 on void and 3.10:1 on deep, below 4.5:1 for the small
mono labels it is used for. `#747b88` clears the threshold on both field colours
while staying quiet. Hairlines and scrims are decorative surfaces, not text, and
are exempt.

Nothing in the page conveys meaning by colour alone: the active rung is marked by
`aria-current`, position and a size change, not only by `--color-signal`; accents
colour sections that are also numbered and named.

Focus is never invisible: `:focus-visible` draws a 2 px `--color-signal` outline
with a 3 px offset, globally.

## 8. Motion

Reduced motion is respected twice over:

* `matchMedia('(prefers-reduced-motion: reduce)')` is read once at boot; `?motion=reduce`
  forces the same state for testing.
* With it on: plate reveals are set instantly instead of animated (`revealBatch`
  goes straight to `opacity: 1, y: 0`), `scrollIntoView` is instant, and pointer
  parallax on the camera is disabled (`CameraRig`). The 3D scene still renders —
  the scroll is a user action, not an animation — but nothing moves on its own
  except the two things that are the lesson: the Moon's rotation and the pulsar's
  beams.
* A `@media (prefers-reduced-motion: reduce)` block at the end of `src/styles/global.css`
  also removes CSS transitions and the aperture animation, in case the preference
  is set after the app has booted.

## 9. Keyboard walkthrough

A complete pass, no pointer: skip link → brand → index button → 8 ruler marks →
8 rung experiments (button / range / choice group per rung) → copy link → back to
top. Focus is visible at every stop, the index dialog traps nothing (closed by
Escape, returning focus to whatever opened it), and no control exists only as a
hover target. The `.skip` link and the retracting chrome are the two places where
pointer and keyboard paths differ, and both are biased towards the keyboard.

## 10. Known limits

Recorded here rather than hidden:

* The page has been walked by keyboard and read through the DOM, but **no formal
  audit** (axe, screen-reader session, WCAG conformance statement) has been run.
  Nothing in this document should be read as a conformance claim.
* Contrast ratios above are computed from the token values; they are not measured
  on a physical display, and text over the moving canvas sits on a scrim whose
  final contrast depends on the scene behind it. The scrim is opaque enough in
  practice, but it is not a fixed background.
* The boot veil and the HUD are `aria-hidden` decoration; the scene's own motion
  (the camera travelling between rungs) is driven by scroll position and cannot be
  reduced further without breaking the metaphor. Under reduced motion the travel
  is still a direct, user-controlled mapping of scroll to position — it never
  animates on its own.

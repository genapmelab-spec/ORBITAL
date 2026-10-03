# UX — ORBITAL

## 1. The journey

The marketing progression is the page order. Nothing is asked of the visitor
before they have been given a reason to care.

| Stage | Section | What the visitor does | What they should feel |
| --- | --- | --- | --- |
| **Attention** | `entry` | Lands inside a window: hull at the edges, Earth's limb low in the frame, one line — *Somewhere above the night side.* | "Where am I?" |
| **Curiosity → Understanding** | `entry` (same screen, on scroll) | The identity arrives: ORBITAL, the headline, the value proposition, *Begin the flight* | "This is a model, not a page about planets." |
| **Purpose** | `premise` | Reads why a live model beats a diagram; three claims | "I understand why this exists." |
| **Interest** | `act-1` → `earth` → `moon` | Starts the flight; the two worlds already known | "It's moving." |
| **Tension** | `act-2` → `mars` → `belt` | Crosses the last measured thing; rocks pass the camera | "This is bigger than I thought." |
| **Awe** | `act-3` → `jupiter` | One planet that owns more mass than all the others together | "I'm small." |
| **Desire / climax** | `sun` | Arrives in the star's own light | "I want to see this move." |
| **Action** | `control` | Sets the date; every world moves along its orbit; watches Earth → Mars distance change | "I'm holding the model." |
| **Resolution** | `close` | Reads the last line; flies again or copies the link | "I want to show someone." |

## 2. Section rhythm

Arrive → hold → depart. The camera reaches a destination, holds still for the
whole section, then leaves while the next chapter's copy is already on screen.
Quiet and loud alternate on purpose: `earth` and `moon` are calm, the belt is
fast, `jupiter` is heavy, `sun` is the loudest frame in the page, and `control`
after it is deliberately calm again so the visitor can operate something.

## 3. Hero interaction

- At load the visitor sees the window, Earth's limb, one line — *Somewhere above
  the night side.* — and a single mono word, `Scroll`. Nothing else.
- 15% of a viewport of scrolling brings the identity: ORBITAL, the headline, the
  value proposition, the CTA, in a 0.9 s stagger. Measured in scrolled pixels,
  never in time, so it cannot arrive without the visitor.
- At 60% the whisper and the scroll cue leave; the window then opens outward
  (camera parameter 0.38 – 0.7) and the flight to Earth's framing begins.
- The camera itself holds still for 1.15 viewports (`data-hold` on the hero
  section) before it starts to travel, so the opening never feels like a
  runaway.
- Primary CTA *Begin the flight* jumps to `#earth`; the secondary *What am I
  looking at?* jumps to `#premise`. Both work with no JavaScript and no WebGL.
- Clicking the brand returns to `#entry`.

## 4. Scroll behaviour

Native scrolling only — never hijacked.

Each section contributes two stops to the scroll → camera mapping: the position
where its key has been reached (its top passing ~18% of the viewport) and the
position where the camera may leave (its bottom minus ~30% of the viewport).
Between stops the camera parameter interpolates linearly; between a section's two
stops it does not move. The camera then damps toward that target at 7 Hz, so the
shaft of a mouse wheel never produces a jerk.

Consequences that are deliberate:

- A section's copy is always on screen while the camera is holding its shot.
- Anchor jumps (navigation, CTAs) land where the camera has settled, because
  sections carry `scroll-margin-top: 18vh`.
- Nothing moves until the visitor scrolls; there is no autoplay.

## 5. Navigation

**One system.** A single `<header>` with a brand, the current position, the
section list and a progress rule. On wide screens the list is inline; on small
ones the same list folds behind the *Destinations* trigger — the DOM is never
duplicated.

**Behaviour.**

| State | Trigger |
| --- | --- |
| Visible | Page load, pointer within 110 px of the top edge, scroll up > 6 px, focus entering the chrome, trigger pressed, Escape pressed |
| Retracts | 3 s after the last navigation intent (3 s after load, if nothing happens) |
| Never retracts | While the section list is open, or while keyboard focus is inside the chrome |

The current section is marked with `aria-current="true"` and a 1 px ember
underline; the current position is also printed as text (`03 · Mars`) with an
`sr-only` sentence for screen readers. The retraction is a 0.42 s translate and
fade — the bar leaves like a panel sliding back, not like a menu snapping shut.

## 6. CTA placement

| Where | What | Why here |
| --- | --- | --- |
| Hero | *Begin the flight* (primary), *What am I looking at?* (secondary) | The moment the value proposition lands |
| After the premise | *Begin the flight* | The moment the argument is complete |
| Control | Date slider, *Back to today*, *Restart from the window*, *Copy the flight link* | The action the whole page has been promising |
| Close | *Fly it again* (primary), *Copy the flight link* | No new ask — the same action, repeated for anyone who arrived at the end without touching the model |

No email capture, no "request a demo", no newsletter: the page has no backend,
and it does not pretend to have one.

## 7. Information hierarchy

Per destination, exactly four things, in this order: index (`03 / 06`), name,
one fact, one explanation. Never more. The spatial annotation in the scene
repeats the name and one measured number — it is decoration for sighted users
(`aria-hidden`), never the only place something is said.

## 8. Interaction states

| Element | Default | Hover | Focus | Active |
| --- | --- | --- | --- | --- |
| Primary button | Ember fill, void text | 1 px lift + ember glow | Solar double ring | Lift released |
| Ghost button | Hairline border, ink text | Border and text turn ember | Solar double ring | — |
| Navigation link | Muted mono label | Ink | Solar ring | Ember underline via `aria-current` |
| Date slider | Hairline track, ember thumb | — | Solar ring on the input | Thumb follows the drag |
| Share button | Ghost; label confirms "Link copied" for 2.6 s | as ghost | Solar ring | — |

Missing capabilities remove the control instead of faking it: without the
clipboard API the share buttons hide themselves, and they are hidden entirely
when JavaScript is off.

The flight link carries the moment: `?date=YYYY-MM-DD` in the URL sets the time
control (clamped to its own range), the address bar follows every move of the
slider, and *Back to today* returns the URL to the plain page. Sharing is
therefore always honest — the link opens the sky the sharer saw, and the hero's
"positions computed for …" line states the same date.

## 9. Mobile behaviour

- Navigation folds behind the trigger; Escape and outside-press both close it.
- Stations stack their copy bottom-left regardless of the desktop side — the
  alternating composition is a landscape idea.
- The camera uses the portrait bias in `docs/TECHNICAL.md`: further from every
  subject, lateral framing reduced, so nothing is clipped by a narrow frame.
- Spatial annotations are not created below 768 px; the section copy carries the
  same information in text.
- The hero's whisper moves to the top-left corner and the sticky viewport keeps
  the headline clear of the navigation.

## 10. Reduced motion and fallbacks

- **Reduced motion**: the camera cuts between whole keys, all reveals are
  instant, the smooth scrolling is off. The date control still animates the
  model — the motion was removed, not the meaning.
- **No WebGL**: the canvas is hidden, a CSS sky renders instead, annotations are
  never created, the veil is dropped immediately, and the control section states
  plainly that the scene needs WebGL while the numbers keep working.
- **No JavaScript**: every section renders as static, fully readable HTML; the
  share controls and the veil are hidden by CSS; the CSS sky carries the stage
  (the probe script removes that fallback in `<head>`, so there is no flash);
  the anchor CTAs still navigate.

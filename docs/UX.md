# UX — ORBITAL

The interface has one job: make the visitor wait, on purpose, in eight different
lengths of time. Everything else is in service of that.

## 1. The first five seconds

The page opens as an eyepiece. The aperture ring is closed to `30vmax`; behind it
the sky and a Moon at the shortest delay there is. One sentence is visible:

> The Moon, one and a quarter seconds ago.
> It is the shortest delay the sky can offer.

**The identity is withheld until the visitor moves.** The wordmark, the tagline and
the two buttons appear only as `--aperture` opens — the hero section is
`min-height: 210svh` with a `100svh` sticky inner frame, and `live.hero` runs 0 → 1
across it. Scrolling is the instrument's first look; a visitor who does not scroll
still gets a complete sentence and a number.

At rest, a scroll cue in mono sits at the foot: *Scroll to look further back.*

## 2. The instrument card

One screen between the opening frame and the ladder. It answers the three
questions a visitor will otherwise ask, in the page's own voice:

| Rule | Copy |
|------|------|
| The number | Each rung is labelled with how long its light has been travelling. |
| The scenes | Each object is staged at a size the eye can follow. The distances are not to scale; the numbers are. |
| The experiments | Every rung can be operated: run the photon, fire the laser, change the light. |

Below it, the honesty note, marked `note`: *Distances here are compressed so they
can be seen. The numbers are not.* With no WebGL, a second note appears here that
explains the CSS sky and says every number, explanation and source is unchanged.

## 3. Climbing: the scroll contract

Each rung occupies `162svh`. The scroll is mapped to a continuous rung position
(long `src/lib/scroll.ts` `measure()`):

* **Arrive** at `top − 10svh` → the camera is at the rung (whole number).
* **Hold** to `top + 62svh` → the camera does not move. The plate is fully visible.
  This is where reading and operating happen.
* **Fly** until `top + 62svh + 0.5px`... in key terms: the next key is flagged
  `travelling` and the interpolation crosses into the next rung. The flight is
  deliberately longer than the hold — **the travel is the lesson**.
* The final key pins the last rung to the bottom of the document, so First Light
  cannot be scrolled *past*.

Cue from the scene: `uTravel` rises during a flight and drives the thread's speed
and the motes. The ruler's readout climbs in log space while the camera is between
rungs, so the number in the ruler and the thing on screen are always the same
moment.

Chrome behaviour: the header retracts after **3 seconds** without intent and
returns on any scroll-back, pointer move into the top 110px, Tab, or focus. It is
never hidden while the index sheet is open.

## 4. The plate

Reading order on every rung, top to bottom:

1. `01 /08` + the label (*Nearest delay*) — mono, small.
2. The numeral, huge, with the unit beside it in serif italic.
3. The name.
4. The fact, in one sentence.
5. The explanation, two or three sentences, including the source's substance
   (e.g. that SN 1054 was recorded by Chinese astronomers).
6. The experiment (section 5).
7. The source line — mono, dust-coloured, always visible.

Copy reveals once, 20px up, 720ms, staggered 70ms, triggered when the plate is 84%
up the viewport (`ScrollTrigger`, `once: true`). It never re-animates; re-reading is
not punished. Rungs alternate sides so the subject is never behind the words.

## 5. The four mechanisms

Each pair of rungs shares one interaction shape, so the visitor learns four ideas
and then meets them again larger:

| Mechanism | Rungs | What the visitor does | What the scene does | What cannot be faked |
|-----------|-------|-----------------------|---------------------|----------------------|
| **Pulse** | Moon, Voyager 1 | Presses *Fire the laser* / *Transmit* | A marker travels the real path and returns (Moon) or leaves and never returns (Voyager) | The Moon's clock is 2.56 s round trip; the pulse's duration is 2560ms. Voyager's is a compressed 5.2 s standing in for 47 h 20 m, and the copy says so |
| **Scrub** | Sun, First Light | Drags a slider | Corona brightens and a photon climbs out (Sun); the shell's temperature climbs from 2.725 K to the fog (First Light) | Sun phases: core → 10⁴–10⁵ yr → surface → 499 s. First Light: 2.725 K → 3,000 K → opacity |
| **Toggle** | Betelgeuse, Galactic Centre | Chooses one state | Shockwave ring expands (fuse); dust band fades and a photon ring appears (radio) | The Betelgeuse choice is a thought experiment and the note says so: nothing changes tonight |
| **Compare** | Crab, Andromeda | Switches between two moments | Wreck ↔ guest star of 1054; galaxy ↔ the arriving wavefront | Both sides are the same object, two dates |

Every mechanism writes its conclusion to the DOM as text (`exp-result`,
`exp-detail`) whether or not the scene is available. With no WebGL the controls are
disabled and the conclusions are still printed — the mechanism is the *experience*
of the wait, not the source of the information.

State (`ExpState` in `src/state/store.ts`) is one slot: `rung`, `phase`,
`progress`, `running`, `firedAt`, `announcement`. One experiment is ever active, and
the scene reads it through `useOrbital.getState().exp` inside its own frame loop —
so the controls never re-render the canvas.

## 6. Navigation

* **The ruler** (`src/ui/Ruler.tsx`) is the primary navigation and the lesson at
  once: eight marks at true logarithmic positions between 1.282 s and 4.354e17 s,
  with a live readout in the visitor's own units (`ms` → `s` → `h` → `yr` → `M y` →
  `G y`, via `formatLookback`). The crowding in the middle of the ruler is not a
  bug; it is what a log axis does to starlight. Each mark is a real `<button>`, so
  it is clickable *and* tabbable, with `aria-current` on the active rung.
* **The index sheet** — the header's `Index` control opens a dialog listing all
  eight rungs with their arrows and labels. Focus moves to the first item, `Escape`
  closes, click-outside closes, and jumping closes it and scrolls.
* **Anchors work.** Every rung has `id` (e.g. `#crab`); the URL hash is kept up to
  date with `history.replaceState` as the visitor climbs, and a deep link is
  honoured on load. That means a visitor can be sent to rung 6 directly, and
  *Copy this rung* at the close does exactly that.
* **Skip link** at the top of the document: *Skip to the ladder* → `#moon`.

## 7. The close

The last screen states the conclusion in plain sentences, then offers two actions:
*Look again* (back to the top) and *Copy this rung* (clipboard, with a link to the
rung the visitor is currently inside — or First Light if the ladder was never
climbed). If `navigator.clipboard` is missing or the write fails, the control
removes itself instead of pretending to have copied. The colophon repeats the
project's promises: no photographs, no textures, no tracking, no backend.

## 8. States the interface must handle

| State | Behaviour |
|-------|-----------|
| First paint, React not yet mounted | The built HTML carries a `<noscript>` ladder and the plates are rendered from the same data; JS only adds the scene |
| Scene chunk loading | The canvas is simply absent; the plates are already readable. `Boot` shows a three-line instrument log (aria-hidden) and clears on the scene's first frame or after 1900ms, whichever comes first |
| Scene chunk failed / WebGL unavailable | `SceneBoundary` renders `CssSky`: a flat sky that changes colour with the active rung. The instrument card explains it |
| Reduced motion requested | Camera snaps between whole rungs (no flight), reveals are placed immediately, pointer parallax off. Pulse clocks still run: they are data, not decoration — removing them would remove the point of the page |
| Scrolling back up | The camera reverses; plates do not re-animate; the chrome wakes |
| A short viewport (phone, landscape) | Plate becomes a card, camera biases the subject up and back (docs/RESPONSIVE.md) |
| Keyboard only | Skip link → hero actions → ruler marks → each experiment in
document order; the index sheet traps nothing but returns focus on close via the dialog's own ordering |

## 9. Deliberate UX decisions

* **No autoplaying animation of the photon.** The visitor presses a button because
  pressing it is the act of looking.
* **No progress bar for the whole page.** The ruler already is one, and it is
  measured in the units of the subject rather than in percent.
* **No share widgets.** One clipboard action, on the last screen, pointing at a
  rung's anchor.
* **Sources are never behind a toggle.** If a number is on screen, where it came
  from is on screen.
* **Nothing is hidden behind an interaction to make the page look cleaner.**
  Every rung's fact, explanation and source are in the DOM before anything is
  operated, which is also what makes the no-JS and no-WebGL paths work.

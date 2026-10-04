# ANIMATION — ORBITAL

Motion is the subject of this page, so the animation system is deliberately narrow:
**scroll is the time axis**, the camera is the only thing that travels, and
everything else either holds still or responds to one experiment.

## 1. The three layers of motion

| Layer | Driver | Rate | Can it be reduced away? |
|-------|--------|------|-------------------------|
| Travel | `window.scrollY` → `live.target` → damped `live.camera` | Exponential, λ = 5.5/s | Yes — snaps to whole rungs |
| Arrival | `ScrollTrigger` at 84% for a plate's copy | 720ms, 70ms stagger | Yes — placed instantly |
| Response | An experiment's phase, read inside `useFrame` | Per mechanism (below) | No — it *is* the content |

The rule behind that last row: a reduced-motion visitor still gets to fire the
laser and watch it take 2.56 seconds, because the clock is data, not decoration.

## 2. Travel, in detail

```
key structure (from measure())
  hero top            t = -0.55   hero 0
  hero + 0.5vh        t = -0.55   hero 1     ← the identity is fully open
  instrument + 0.2vh  t = -0.30   hero 1
  instrument - 0.45vh t = -0.06   hero 1
  rung i top - 0.1vh  t = i       travelling false
  rung i top + 0.62vh t = i       travelling false   ← the hold
  rung i top + 0.62vh + 0.5px
                      t = i       travelling true    ← the next key's flag is set
document bottom       t = 7       travelling false
```

* Interpolation between keys is `smoothstep` on the `t` field, so a flight leaves
  and arrives gently but crosses the middle at full speed.
* `travellingAt(y)` returns true if *either* neighbouring key is flagged, which is
  what sets `live.travelling` during the flight and `shared.uTravel` in the scene.
* `flight = min(1, |target - camera| * 1.5)`; `uTravel` chases it at 4/s. So the
  thread's speed and the motes only rise when the camera is genuinely between rungs.
* The camera damps at 5.5/s: 90% of a rung-to-rung move takes roughly 0.42s of
  *camera* time, but the scroll distance spent on it is 2.6× the hold — the visitor
  drives the pace, and a fast flick will still cross the gap visibly.

**Reduced motion:** `live.camera = Math.round(live.target)`. There is no flight at
all; the visitor jumps between whole rungs and the copy is already in place. The
`?motion=reduce` parameter forces the same behaviour without changing OS settings.

## 3. The opening frame

`App.tsx` runs one rAF loop that writes:

* `--aperture`: `30 + hero * 190` vmax, dancing across two stops of the `mask-image`
  radial gradient on `div.aperture`.
* `document.documentElement.dataset.hero`: `open` once `hero > 0.42`, which CSS uses
  for the identity's transition (the ring's edge and the copy crossfade).

The aperture is a CSS mask, not a canvas effect: it costs one composited layer and
it works with the scene absent (the CSS sky shows through it).

## 4. Arrival (plates)

`ui/Rung.tsx` reveals `.reveal` items inside a plate with `gsap.fromTo` — opacity
0 → 1, y 20 → 0, 720ms, `power2.out`, 70ms stagger, `overwrite: true`, triggered
once at `start: 'top 84%'`. `ScrollTrigger` is used only for this; nothing else on
the page is scroll-driven GSAP, because a timeline fighting the damped camera is
how you get jitter.

The chrome's retraction is plain React state: 3s of no intent (scroll-back, pointer
in the top 110px, Tab, focusin) hides the header; any of those wakes it.

## 5. Per-rung choreography

| Rung | Trigger | Animation |
|------|---------|-----------|
| 01 Moon | Pulse fired (`durationMs: 2560`) | Marker lerps `[6,16,138] → [0,3,61]` and back on a ping-pong curve (`k<0.5 ? k/0.5 : (1-k)/0.5`), scaling up 60% at the midpoint. The clock counts `0 → 2.56 s` in real time, then the button reports *complete* |
| 02 Sun | Scrub | Corona intensity `0.75 + 0.8p` (near) and `0.4 + 0.35p` (far), so the star brightens as the photon climbs. The photon appears above `p = 0.7` and lerps from the surface to the live camera position over the last 30% of the dial |
| 03 Voyager 1 | Pulse fired (`durationMs: 5200`) | Marker travels one way (`oneWay`), shrinking 40% as it goes; the DOM fills a three-line log (sent / arrives / earliest reply) from the real timestamps at 23.66h each way |
| 04 Betelgeuse | Toggle *fuse* | The star breathes at 0.42 rad/s throughout; choosing *fuse* starts a one-shot 4.2s shockwave (`ringGeometry` scaled 0.6 → 4.0, intensity `1.6 → 0`) and raises the halo |
| 05 Crab | Compare | One damped scalar (`2.6/s`) mixes between the two moments: filaments fade 0.22 ↔ 1.0, the 1054 guest star fades out as the wreck fades in, beams appear above 0.4 and spin 0.5 → 1.6 rad/s |
| 06 Galactic Centre | Toggle (visible / infrared / radio) | `mode` damps 0 → 1 → 2 at 3/s; the dust band's opacity falls `0.94 → 0.12`; above mode 1.05 a photon ring fades in and faces the camera; the shadow circle stays, because it is the point |
| 07 Andromeda | Compare | `travel` damps at 1.6/s; the arriving wavefront ring moves to z = 700 and scales 180 → 1080 as it approaches the camera, dimming its own glow |
| 08 First Light | Scrub | `uTemp` damps at 4/s toward the dial; the shell mixes cool → hot plasma, the motes fade out, and above 0.82 the mottling becomes fog — the last phase is deliberately *less* animated, because opacity is the end of seeing |

Every one of those reads `useOrbital.getState().exp` inside `useFrame`. No
animation state lives in React; no experiment re-renders the canvas.

## 6. Idle motion

Three things loop, and each one means something: the Moon's rotation (0.014 rad/s —
the only body whose rotation a visitor could actually notice), Betelgeuse's
breathing (±1.8% at 0.42 rad/s — a star that pulses), and the pulsar beams. Plus the
thread's wave (`sin(z * 0.012 + t * 1.1)`) and the point twinkle in every cloud
(`uTwinkle`). Nothing else loops: no floating, no drifting, no spinning for effect.

## 7. Frame governor

`scene/Stage.tsx` collects the last 120 frame deltas, takes the median, and:

* the first 2.5s after mount are discarded (first paint, shader compile);
* median > 18ms and tier ≠ low → step down;
* median < 17ms and tier ≠ high → step up;
* at most one step per 5 seconds.

120 frames is ~2s of evidence at 60fps; the median is used instead of the mean so a
single garbage collection pause cannot demote a device. Tier changes only alter
counts, DPR and antialiasing (docs/3D.md §8). A device that cannot hold 30fps stays
at `low` and loses nothing but density.

## 8. Reduced motion, exhaustively

| Mechanism | Honour | Refuse |
|-----------|--------|--------|
| `prefers-reduced-motion: reduce` | Camera snap, reveals placed immediately, pointer parallax off, `scroll-behavior: auto` (so the index links and the skip link land instantly), all CSS transitions/animations cut to 1ms, the ruler's jump asks for `auto` | — |
| `?motion=reduce` | Everything above, for QA without changing OS settings; the index rows are the exception in mechanism, not in effect — a query flag is invisible to a media query, so `IndexPanel` intercepts its own link click and does the jump with `behavior: 'auto'` | — |
| Pulse clock | — | Still runs a 2.56s timer: the wait is the content |
| Scrub phases | — | Still user-driven |
| Toggle / compare | Short damped crossfade of the *object*, no travel | — |

## 9. What is not animated

No parallax on the plates, no hover tilt, no number count-up on arrival, no
auto-advancing carousel, no cursor follower, no scroll-jacking (the page uses native
scrolling; if the browser smooth-scrolls, that is the browser's choice and the
visitor's setting). The animation budget is spent on the camera and on the four
mechanisms, and nowhere else.

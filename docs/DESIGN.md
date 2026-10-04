# DESIGN — ORBITAL

The look is a constraint list that turned into a style: no photographs, one
accent per rung, dark everywhere, and type doing the work that images normally do.

## 1. Art direction in one paragraph

An observatory instrument at night. Near-black fields, a single warm signal
colour per rung, thin hairlines instead of boxes, and numerals set large enough to
read as objects rather than labels. Everything that glows is computed by a shader;
everything that speaks is type. The page should feel like a plate from a working
instrument — recorded, not illustrated.

## 2. Colour

All colour is written down **once**, in `src/styles/tokens.css`, inside a
Tailwind v4 `@theme` block. `tools/check-content.mjs` fails the build if a hex
literal appears in any other `.ts`, `.tsx` or `.css` file; the only exemptions are
the token file itself and its runtime mirror `src/scene/palette.ts`.

| Token | Value | Role |
|-------|-------|------|
| `--color-void` | `#05070b` | The sky. Also the renderer's clear colour. |
| `--color-deep` | `#0b0e14` | Raised fields: index sheet, boot veil. |
| `--color-ink` | `#e9e5dc` | Body text — warm off-white, never `#fff` |
| `--color-dust` | `#8a8f99` | Secondary text, sources, captions |
| `--color-faint` | `#747b88` | Inactive marks, small mono labels (AA on both field colours) |
| `--color-signal` | `#6fe0c8` | Live state, the "in flight" dot |
| `--color-flare` | `#ffb265` | The default accent, the thread, the pulse |
| `--color-hairline` | `rgb(138 143 153 / .18)` | Every 1px rule on the page |
| `--color-scrim` | `rgb(5 7 11 / .74)` | Backdrops over the canvas |

Eight accents, one per rung, each chosen for the object rather than the palette:
moon `#d9d6ce`, sun `#ffd9a0`, voyager `#9fd8e8`, betelgeuse `#e8823f`, crab
`#7fd9c0`, core `#c97b4a`, andromeda `#a8c4e8`, firstlight `#ff7a2f`.

**The accent is not decoration.** A rung's accent sets `--accent` on its section,
which colours the plate index, the ruler tip, the focus ring and the buttons; the
same value reaches the scene as light for that object. The DOM and the 3D layer
cannot drift, because both read the same custom property.

### Darks, lights and glow

Because there are no images, brightness has to be manufactured. Three rules:

1. **Surfaces are lit by a fake sun.** `createSurfaceMaterial` takes a `lightDir`
   and does a Lambert term with a floor of `0.045` and a `smoothstep` terminator —
   so a body in shadow goes nearly black instead of flat grey.
2. **Hot objects are emissive.** A `uHot` blend mixes in `base * (0.7 + 1.6 * n)`
   times a limb-darkening term, which is what makes the Sun read as a light source
   and not a painted ball.
3. **Light that has no surface is additive.** Coronae, halos, the thread, the
   pulsar beams and every point cloud use additive blending with `depthWrite:false`,
   so glow adds instead of occluding.
4. **The DOM has one glow, and it obeys rule 3.** A hovered or focused row of the
   index sheet is washed in its rung's `--accent`, edged with 2px of the same
   value, and lets it spill as light — a `box-shadow` with no offset and a
   negative spread, plus a matching `text-shadow` on the name and arrow. It lights
   the row without pretending the row is raised, which is why it is not a drop
   shadow (see §7).

## 3. Type

Three families, all self-hosted from `node_modules` as latin-subset woff2, all OFL
1.1 (see `docs/licenses/README.md`):

| Role | Family | Weight | Why |
|------|--------|--------|-----|
| Interface | Archivo Variable | 100–900 (variable axis) | Neutral, slightly condensed, reads well in small caps and monospace-adjacent rosters |
| Statement | Newsreader | 400 roman + italic | A serif for the sentences that carry the idea; the italic sets every unit beside a numeral |
| Readout | IBM Plex Mono | 400 | Instrument voice: arrows, sources, indices, the ruler |

Rules that follow from the choice:

* The **numeral is the headline**: `.numeral` is set at the largest size in the
  page and the unit rides beside it in Newsreader italic (`1.28 <em>seconds</em>`).
* Monospace is never used for prose. It is for values, labels and sources — the
  places where the visitor is reading an instrument, not an essay.
* Screen-reader text separates the numeral from its meaning: the visible heading is
  `13.8` + `billion years`, the accessible text reads "13.8 billion years ago —
  First Light".

## 4. Layout

* **One page, one column of plates.** Rungs alternate left/right so the subject is
  never hidden behind the words; on portrait the plate becomes a full-width card
  and the camera bias moves the subject above it.
* **Sticky, then still.** Each rung is `162svh` tall with a `100svh` sticky plate:
  the camera holds its shot while the plate holds still, then both travel.
* **Hairlines, not boxes.** Separation is a 1px `--rule` border. Nothing is raised
  with a shadow except the index sheet; the accent glow on its rows adds light
  without an offset, so it raises nothing (§2.4).
* **The gutter is one variable**: `--gutter: clamp(1.15rem, 3.6vw, 4rem)`.
* **`svh`, never `vh`.** Mobile browser chrome must not change what the visitor can
  read; every vertical measurement that matters uses small viewport units.
* **The aperture.** A CSS motif — a ring whose diameter is `--aperture`, animated
  from `30vmax` to `220vmax` by the opening scroll. It is the eyepiece, and it is
  the one element that behaves like a curtain.

## 5. Motion language

Motion is either **travel** (the camera moving between rungs, the thread rushing
past) or **arrival** (a plate's copy fading up 20px, once). Nothing loops for
decoration except two things that mean something: the Moon's slow rotation and the
pulsar's beams. Durations live in `src/lib/motion.ts` (`DUR`: 160/380/720 ms) and
the camera uses exponential damping, never easing curves with overshoot. A visitor
should feel carried, not bounced.

## 6. Honesty as a design element

* The staging is compressed and the page says so in the instrument card
  (*"Distances here are compressed so they can be seen. The numbers are not."*).
* Voyager 1 is drawn as a schematic — dish, bus, boom, generator — because we will
  never have a photograph of it.
* The source line is printed on every plate, in mono, at body size, not hidden
  behind a disclosure.
* The `?hud=1` measurement instrument is a QC tool and never shipped in the
  product's nav; it is visible only when a developer asks for it.

## 7. What is explicitly not designed

* No illustrations, photographs, textures, gradients-as-images, glassmorphism,
  drop shadows on text, or emoji. The index rows' accent glow is the one thing
  close to a shadow and is deliberately not one: no offset, nothing darkened, and
  it only ever uses a colour the rung already owns (§2.4).
* No colour is invented at the point of use: if a new colour is needed, it enters
  `tokens.css` and is mirrored in `palette.ts`, or it does not exist.
* No layout exists only for desktop: both breakpoints are authored (see
  docs/RESPONSIVE.md).

# PRD — ORBITAL

## 1. Product

**Name.** ORBITAL

**Concept.** ORBITAL is a live model of the Solar System, played as one
unbroken flight. Positions come from real orbital elements computed for the
current date; every surface is drawn procedurally in the browser. The visitor
crosses the system at their own speed and, at the end, takes control of time
itself.

**Category.** Interactive science instrument — an explorable model, not an
article, not a gallery, not a game.

**One sentence.** *A working model of the Solar System: real positions for
today, every surface drawn live, one continuous crossing from a window above
Earth to the surface of the Sun.*

**Purpose.** Scale, distance and time cannot be transmitted by a diagram: every
picture of the Solar System is compressed to fit a page. ORBITAL does not
compress the experience — it makes the visitor cross the distance, so scale
arrives as experience rather than as a number.

### Target audience

| Audience | What they get |
| --- | --- |
| Curious adults who learn by seeing | A single, self-explaining flight; no interface to learn |
| Educators and students | One fact per destination, each attached to the object it belongs to, and a date control that makes orbital motion tangible |
| People who value real-time graphics | An honest procedural scene: no textures, no photographs, no image bytes |

### Core value proposition

1. **Honest source.** Nothing on the page is an image. Surfaces are generated;
   positions are computed. The claim can be checked by looking.
2. **Real positions.** Every body sits where it actually is on the date the
   visitor is reading — and moves if they change that date.
3. **One continuous camera.** No cuts, no dissolves, no resets. The flight never
   stops moving.
4. **A real action at the end.** The visitor takes the controls rather than
   being asked to sign up for something.

## 2. Goals

The page must, in order:

1. **Attract attention** — open inside an environment, not on a planet portrait.
2. **Explain ORBITAL** — say what it is in one screen: identity, headline, value
   proposition, CTA.
3. **Communicate value** — why a live model beats a diagram, in three claims.
4. **Create curiosity** — the first stations are the two worlds the visitor
   already knows; the promise is what comes after them.
5. **Demonstrate the experience** — the flight itself, unfaked.
6. **Build desire** — the belt, Jupiter and the Sun are staged as scale events.
7. **Guide to a clear CTA** — "Take the controls": the date control that moves
   the whole system, plus restart and copy-link.

**Success test (the only one that matters):** a first-time visitor can say, after
one screen, *what ORBITAL is*, *why it exists*, and *what they want to do next*.

## 3. User experience

**Feel:** an instrument, not a showreel. Precision, calm, confidence — a
documentary's opening shot rather than a title sequence.

**Understand:** the visitor should leave with three things: the Solar System is
mostly emptiness; the distances are not humanly imaginable; and a model that
runs live is a different kind of thing from a picture of one.

## 4. Core features

| Feature | Why it exists |
| --- | --- |
| The opening window | Answers "where am I?" before "what is this?" — the visitor starts inside a structure, with Earth's limb low in the frame |
| Six destinations | Earth, Moon, Mars, Asteroid Belt, Jupiter, Sun. Chosen as story beats, not as a catalogue |
| One fact + one explanation per destination | Enough to learn something; never an article |
| Spatial annotations | A destination's name and one measured number are projected from the body's real position — interface and world as one system |
| Date control (±3 years) | The product, unscripted: the visitor moves every world along its own orbit |
| Live readouts | Earth → Mars distance in AU, computed from the same elements the scene uses; they work without WebGL |
| Copy-the-link | The only honest share action for a page with no backend |
| Reduced motion | Whole-key camera cuts, no reveals, no parallax |
| WebGL fallback | A CSS sky and all copy; the numbers still run |

## 5. Landing-page goals

- The hero must function as a real landing hero — identity, headline,
  explanation, value proposition, CTA — while also being a place.
- Copy can be read at any point without the 3D: every section carries its own
  text in the DOM.
- CTAs are placed where the intent exists: *Begin the flight* (hero and after the
  premise), *Take the controls* (the model section), *Fly it again* / *Copy the
  flight link* (the close).

## 6. Non-goals

- **Not a planet encyclopedia.** No catalogue, no per-planet fact sheets, no
  eight-planet completeness. Six destinations, chosen for the story.
- **Not a dashboard or HUD.** No instrument panels, no telemetry chrome, no
  readouts that exist to look technical. The one control on the page is a date
  slider inside a sentence.
- **Not a generic SaaS landing page.** No feature grid, no pricing, no logos,
  no testimonials.
- **Not an information portal.** No long-form text, no glossary, no navigation
  tree.
- **Not a WebGL demo.** The 3D exists to serve the story; if a visual effect did
  not earn its place in the script, it was cut.
- **Not space tourism.** ORBITAL does not sell a trip; it is the instrument.
- **Not a backend product.** No accounts, no database, no analytics, no
  network calls at runtime.
- **No photographs, no textures, no models.** All imagery is procedural.

## 7. Responsive requirements

| Range | Behaviour |
| --- | --- |
| Desktop ≥ 1088px | Full composition: stations alternate their copy left/right, spatial annotations visible, full navigation list inline |
| Tablet 768–1087px | Premise and claims collapse to one column; annotations still visible; navigation folds behind a *Destinations* trigger (the section indicator stays visible) |
| Mobile < 768px | Stations stack their copy bottom-left; annotations hidden (the section copy carries the information); navigation folds behind a *Destinations* trigger; the camera uses a portrait framing bias (further from each subject, less lateral offset) |

Portrait matters: the camera contract has an explicit portrait bias, not a
shrunk desktop shot (`docs/TECHNICAL.md`).

## 8. Accessibility

- All content is in the DOM; the canvas is `aria-hidden` and the stage is
  non-interactive.
- Keyboard: skip link, one focus-visible style, full navigation list, the date
  slider is a native range input with a label and a live output, Escape closes
  the navigation panel.
- One `h1`; sections are landmarks with headings; the navigation marks the
  current section with `aria-current`.
- Contrast: all text sits on `--void` or a scrim at AA or better; the only
  saturated colour on text is the ember CTA (dark text on ember) and the ion
  index labels on dark.
- `prefers-reduced-motion`: the camera cuts between composed stills, reveals are
  instant, transitions are 1 ms.
- No WebGL: identical DOM, a CSS sky instead of the scene, an explicit note in
  the control section.

## 9. Performance

Targets, measured on the production build:

| Budget | Target | Actual |
| --- | --- | --- |
| Initial JavaScript (gzip) | ≤ 60 KB | ~51 KB (page scripts + GSAP/ScrollTrigger) |
| Lazy scene chunk (gzip) | ≤ 210 KB | ~144 KB (Three.js + scene) |
| CSS (gzip) | ≤ 22 KB | ~6 KB |
| Draw calls | < 60 desktop / < 30 low tier | planets 4 + sun 3 + belts 1 + fields 2 + guides 5 |
| Device pixel ratio | ≤ 2 | 2 / 1.6 / 1 by tier |
| Frame budget | 60 fps target, 3 quality tiers, FPS governor | governor: downgrade < 46 fps, upgrade > 58 fps, 5 s cooldown |
| Paused when hidden | yes | `visibilitychange` stops the loop |

Also enforced: one renderer, one animation loop, lazy `import()` of the scene
after first paint, deterministic seeded geometry, and full disposal on
`dispose()`.

## 10. Out of scope for v1

Self-hosted fonts, shareable date links, an educator mode, a second language.
See `docs/ROADMAP.md`.

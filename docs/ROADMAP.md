# ROADMAP — ORBITAL

## Built (v1)

| Phase | Scope | State |
| --- | --- | --- |
| 01 — Product definition | What ORBITAL is, who it is for, what it refuses to be | Done — `docs/PRD.md` |
| 02 — Documentation | PRD, design, UX, content, technical, roadmap, agent rules | Done |
| 03 — Design system | Colour, type, layout, motion, restraint rules | Done — `docs/DESIGN.md`, `src/styles/tokens.css` |
| 04 — Architecture | Content spine, layout contract, camera composition, epoch model, checker | Done — 1008/1008 checks pass |
| 05 — Hero | Window module, Earth's limb, reveal choreography, identity, CTA | Done |
| 06 — Landing page | 13 sections, 6 destinations, premise, acts, control, close | Done |
| 07 — 3D | Procedural bodies, atmosphere, belt, fields, orbit guides, annotations | Done |
| 08 — Motion | Eased camera path with clearance routing, reveals, opening pacing | Done |
| 09 — Navigation | One system, 3 s idle retract, wake on intent, active section | Done |
| 10 — Responsive | Portrait camera bias, three breakpoints, mobile navigation panel | Done |
| 11 — Performance | Quality tiers, FPS governor, lazy scene, budgets met | Done |
| 12 — Accessibility & fallbacks | Keyboard, reduced motion, no-WebGL CSS sky, no-JS readability | Done |

## Next (v1.1 — polish and reach)

| Item | Why |
| --- | --- |
| Self-hosted fonts | Removes a third-party request from the critical path of a page whose whole claim is independence |
| Shareable date links | `?date=2027-04-01` restores a scrubbed model, so a visitor can send the system as they saw it |
| Per-frame "today" label in the scene | The hero meta proves the model right now; a live in-scene readout would prove it during the flight too |
| Route guide | A faint hairline along the flown path, visible only in the overview — a map of what the visitor just did |

## Later (v2 — the model as a product)

| Item | Why |
| --- | --- |
| **Educator mode** | A quiet second layer: orbit parameters, a periodic table of distances, printable still-frame export. Same model, different depth |
| **Deep links per state** | `#jupiter?date=…` so a classroom can be pointed at one place at one time |
| **Second language** | The copy is written to be translated — short lines, no idioms |
| **Constellations and named stars** | The starfield is currently anonymous. Real names would reward looking up, without touching the planet-catalogue failure mode |
| **Mars moons, Jupiter's four** | The next step of the same story: the model already knows how to hold small bodies |

## Not planned

Planet catalogue navigation, an eight-planet checklist, accounts, analytics,
newsletters, or anything that turns the flight into a form. If a feature would
make ORBITAL a page *about* space instead of a model *of* it, it is out.

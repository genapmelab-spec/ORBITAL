# ORBITAL

A live model of the Solar System, played as one unbroken flight.

Positions come from real orbital elements for the current date; every surface is
drawn procedurally in the browser. No photographs, no textures, no backend.

## Commands

| Command | Does |
| --- | --- |
| `npm install` | Install dependencies |
| `npm run dev` | Local dev server |
| `npm run check` | Astro type check + layout/content contract check |
| `npm run check:layout` | Camera, composition and content contract only |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the built site |

## Documentation

Product, design, UX, content, technical and agent rules live in [`docs/`](docs/):

- [PRD.md](docs/PRD.md) — what ORBITAL is and why it exists
- [DESIGN.md](docs/DESIGN.md) — visual system and motion rules
- [UX.md](docs/UX.md) — the visitor journey and navigation behaviour
- [CONTENT.md](docs/CONTENT.md) — the page script, line by line
- [TECHNICAL.md](docs/TECHNICAL.md) — architecture, contracts, performance budget
- [ROADMAP.md](docs/ROADMAP.md) — build phases and what comes after v1
- [AGENTS.md](docs/AGENTS.md) — rules for agents working on this codebase

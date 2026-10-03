# AGENTS — working on ORBITAL

Read this before changing anything. It is short on purpose, and the rules are
enforced by `npm run check` where a machine can enforce them.

## 1. What this project is

A live model of the Solar System played as one continuous flight, as a landing
page. Product intent: `docs/PRD.md`. Visual rules: `docs/DESIGN.md`. Copy:
`docs/CONTENT.md`. Architecture and budgets: `docs/TECHNICAL.md`.

## 2. The spine and the contract

- `src/content/experience.ts` owns section order, copy and camera parameters.
  Components and scripts read it; nothing hard-codes a parameter, an id or a
  line of copy.
- `src/three/camera/anchors.ts` owns scale, body specs and camera keys. A camera
  key states where its subject lands on screen; `composeCamera()` solves the
  position from that. Never hand-place a camera "until it looks right".
- Station copy must sit on the opposite side of the frame from its subject. The
  checker asserts this against `frameX`.
- `tools/check-layout.mjs` must stay green. If a change breaks a check, the
  change is wrong until proven otherwise — do not weaken a check to pass.

## 3. Non-negotiables

1. **No textures, no photographs, no models, no binary assets.** All imagery is
   procedural. Adding an image file is a product change, not a technical one.
2. **No user-agent sniffing.** Capability probes only (`webgl`, pointer type,
   cores, width).
3. **One renderer, one camera, one loop.** Only `OrbitalScene.ts` owns them.
4. **No backend, no analytics, no runtime network calls.** Fonts are the single
   third-party request and are preconnected.
5. **No React, no R3F, no client framework.** Astro components, vanilla modules.
6. **Design tokens only.** No hex colour in a component or a stylesheet other
   than `src/styles/tokens.css` (and its mirror `src/three/systems/palette.ts`).
7. **Critical content is never canvas-only.** Every fact exists as text in the
   DOM, in the spine.
8. **Reduced motion, no-WebGL and no-JS must keep working.** They are features;
   breaking one is a regression.
9. **Do not reorder the flight.** Sections, stations and keys are a script with a
   rhythm (arrive → hold → depart). Reordering is a design decision that needs a
   new contract, not an edit.
10. **Prerendered output.** The build is static; nothing may require a server.

## 4. Conventions

- TypeScript strict; no `any`; type-only imports must use `import type`
  (`verbatimModuleSyntax`); the project is written for Node's type stripping, so
  no `enum`, no `namespace`, no parameter properties (`erasableSyntaxOnly`).
- **Import specifiers include the extension** (`./thing.ts`) — the layout checker
  imports the real modules in Node, so extensions are required there.
- Every scene object implements `SceneObject` (`root`, `update(ctx)`,
  `dispose()`), and disposal releases geometries, materials and listeners.
- Section markup carries `data-section`, `data-id` and `data-param`; the scroll
  mapping and the navigation depend on them.
- Comments explain *why*. A comment that restates the code should be deleted.

## 5. Motion rules

- The camera path is eased straight segments with a quintic ease; arrivals are
  calm, holds are still, departures are unhurried. Do not add bounce, overshoot
  or elastic easing anywhere.
- Reveals are `opacity` + `y ≤ 22px`, once, triggered by scroll position.
- Nothing animates on a timer that the visitor did not cause, except the
  one-time veil exit and its 3.2 s safety net.
- New motion must have a reduced-motion answer before it is merged.

## 6. Performance rules

- Stay inside the budgets in `docs/TECHNICAL.md`. New geometry must be
  instanced, seeded and disposable; new per-frame work must be O(1) per object.
- One draw call per thing. If something needs a second material, explain why.
- Anything allocated per frame must be pre-allocated in the closure instead.
- The scene is loaded lazily; do not import it from a component or the main page
  scripts.

## 7. Accessibility rules

- The canvas is decoration: `aria-hidden`, `pointer-events: none`.
- Every control is keyboard reachable, labelled, and visible when focused.
- The navigation must never retract while it holds focus or while its panel is
  open.
- Contrast: AA on any text over the scene, which means a scrim or a pure-void
  background behind it.
- Copy that means something must exist as text, not only as an annotation.

## 8. Before you say it is done

```bash
npm run check   # astro check + the layout/content contract
npm run build   # production build
npm run preview # then look at it
```

Then re-read `docs/PRD.md` §2 (goals) and `docs/DESIGN.md` §6 (what the design
refuses). A change that passes the checks but weakens either one is not done.

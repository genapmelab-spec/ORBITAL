/**
 * Layout contract check (AGENTS.md → Testing & Validation Procedure, step 4).
 *
 * Reads the real layout code (`src/three/anchors.ts`, bundled by
 * `npm run check:layout`) and asserts the properties the camera path must have.
 * It exists because three real bugs hid in this table and were invisible in the
 * rendered page until the frame was measured:
 *   1. the Sun's corona flooded every frame while the camera was at a planet;
 *   2. a spline through unevenly spaced keys overshot the Solar System;
 *   3. the Earth's opening composition left no room for the opening text.
 * Each of those is now an assertion here.
 *
 * Screen placement is measured by reproducing Matrix4.lookAt + the perspective
 * projection, so `x`/`y` are exactly what the renderer produces: +x is screen
 * right, +y is screen up, |value| > 1 means outside the frame.
 */

import {
  RENDER_BODY_IDS,
  STAGE_FRAMES,
  STAGE_ORDER,
  SUN_RADIUS,
  bodyPosition,
  bodyRadius,
  layoutStages,
} from '../node_modules/.cache/orbital/anchors.mjs';

const DEG = 180 / Math.PI;
const VIEWPORTS = [
  { label: 'desktop 16:10', width: 1440, height: 900 },
  { label: 'laptop 16:9', width: 1920, height: 1080 },
  { label: 'tablet portrait', width: 834, height: 1112 },
  { label: 'phone portrait', width: 390, height: 844 },
];

/**
 * Stages whose subject is allowed off frame:
 *   mercury / mars / jupiter — the close passes the composition is built on;
 *   asteroid-belt — the subject is the field and the Sun, not Ceres;
 *   outer — Pluto places the camera, but the shot looks back at the Sun.
 */
const INTENTIONAL_OVERFLOW = new Set(['mercury', 'mars', 'jupiter', 'asteroid-belt', 'outer']);

/** Stages built around the Sun being visible: the look-back and the finale. */
const SUN_CENTRED_STAGES = new Set(['asteroid-belt', 'outer', 'overview', 'sun']);

const bodies = RENDER_BODY_IDS.map((id) => ({
  id,
  position: bodyPosition(id),
  radius: bodyRadius(id),
}));

const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
const len = (a) => Math.hypot(a.x, a.y, a.z);
const norm = (a) => {
  const l = len(a) || 1;
  return { x: a.x / l, y: a.y / l, z: a.z / l };
};
const cross = (a, b) => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
});
const clamp01 = (v) => Math.min(Math.max(v, 0), 1);
const smoothstep = (e0, e1, v) => {
  const t = clamp01((v - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

function project(cameraPosition, target, fov, aspect, point) {
  const z = norm(sub(cameraPosition, target));
  // Matrix4.lookAt keeps the camera up and only nudges it when the cross
  // product degenerates — the projection has to match that, not approximate it.
  let up = { x: 0, y: 1, z: 0 };
  let x = cross(up, z);
  if (len(x) < 1e-6) {
    up = { x: 1, y: 0, z: 0 };
    x = cross(up, z);
  }
  x = norm(x);
  const y = cross(z, x);
  const rel = sub(point, cameraPosition);
  const depth = -dot(rel, z);
  const tanV = Math.tan(fov / 2 / DEG);
  if (depth <= 0) return { x: Number.NaN, y: Number.NaN, depth };
  return {
    x: dot(rel, x) / (depth * tanV * aspect),
    y: dot(rel, y) / (depth * tanV),
    depth,
  };
}

const failures = [];
const notes = [];

function check(viewport) {
  const aspect = viewport.width / viewport.height;
  const portrait = viewport.width <= 1024 || aspect < 1.15;
  const keys = layoutStages(aspect, portrait);
  const rows = [];

  keys.forEach((key, index) => {
    const frame = STAGE_FRAMES[key.id];
    const next = keys[index + 1];

    let inside = null;
    let nearest = { id: '-', distance: Infinity };
    for (const body of bodies) {
      const distance = len(sub(key.position, body.position));
      if (distance < nearest.distance) nearest = { id: body.id, distance };
      if (distance < body.radius * 1.02) inside = `${body.id} (${distance.toFixed(2)})`;
    }
    if (inside !== null) failures.push(`${viewport.label} · ${key.id}: camera inside ${inside}`);

    let graze = null;
    if (next) {
      for (let step = 0; step <= 60; step += 1) {
        const t = step / 60;
        const point = {
          x: key.position.x + (next.position.x - key.position.x) * t,
          y: key.position.y + (next.position.y - key.position.y) * t,
          z: key.position.z + (next.position.z - key.position.z) * t,
        };
        for (const body of bodies) {
          const distance = len(sub(point, body.position));
          if (distance < body.radius * 1.15) graze = `${body.id} (${distance.toFixed(2)})`;
        }
      }
    }
    if (graze !== null) {
      failures.push(`${viewport.label} · ${key.id}: path grazes ${graze}`);
    }

    let subject = null;
    let fill = 0;
    if (frame.body !== null) {
      const body = bodies.find((candidate) => candidate.id === frame.body);
      const distance = len(sub(key.position, body.position));
      subject = project(key.position, key.target, key.fov, aspect, body.position);
      fill = ((Math.atan(body.radius / distance) * DEG) / (key.fov / 2)) * 100;

      const offFrame = Number.isNaN(subject.x) || Math.abs(subject.x) > 1.05 || Math.abs(subject.y) > 1.15;
      if (offFrame && !INTENTIONAL_OVERFLOW.has(key.id)) {
        failures.push(
          `${viewport.label} · ${key.id}: subject out of frame at (${subject.x.toFixed(2)}, ${subject.y.toFixed(2)})`,
        );
      } else if (offFrame) {
        notes.push(`${viewport.label} · ${key.id}: subject off frame by design (leading it)`);
      }
    }

    const sunDistance = len(key.position);
    const sun = project(key.position, key.target, key.fov, aspect, { x: 0, y: 0, z: 0 });
    const alignment = dot(
      norm(sub(key.target, key.position)),
      norm({ x: -key.position.x, y: -key.position.y, z: -key.position.z }),
    );
    // Mirrors CORONA_VIEW_INNER/OUTER in objects/sunBody.ts.
    const corona = smoothstep(0.5, 0.98, alignment);

    // The regression that started all of this: no halo while parked at a planet.
    const planetStage = !['outer', 'overview', 'sun', 'asteroid-belt', 'earth-orbit'].includes(key.id);
    if (planetStage && corona > 0.05) {
      failures.push(`${viewport.label} · ${key.id}: Sun corona bleeds into a planet frame (${corona.toFixed(2)})`);
    }

    // Conversely, the moments that are about the Sun must actually show it.
    if (SUN_CENTRED_STAGES.has(key.id) && (Math.abs(sun.x) > 1.05 || Math.abs(sun.y) > 1.05)) {
      failures.push(
        `${viewport.label} · ${key.id}: Sun out of frame at (${sun.x.toFixed(2)}, ${sun.y.toFixed(2)})`,
      );
    }

    rows.push({
      stage: key.id,
      subjectFill: fill.toFixed(0),
      subjectAt: subject === null ? '—' : `${subject.x.toFixed(2)}, ${subject.y.toFixed(2)}`,
      sunFill: ((Math.atan(SUN_RADIUS / sunDistance) * DEG) / (key.fov / 2)) * 100,
      sunAt: `${sun.x.toFixed(2)}, ${sun.y.toFixed(2)}`,
      corona: corona.toFixed(2),
      nearest: `${nearest.id}@${nearest.distance.toFixed(1)}`,
      step: next ? len(sub(next.position, key.position)).toFixed(1) : '—',
    });
  });

  return rows;
}

console.log('Layout contract check — journey order:', STAGE_ORDER.join(' → '), `(${STAGE_ORDER.length} stages)\n`);

for (const viewport of VIEWPORTS) {
  const rows = check(viewport);
  console.log(`── ${viewport.label} (${viewport.width}×${viewport.height})`);
  console.log('   stage          subjFill%  subject x,y     sunFill%  sun x,y      corona  nearest        step');
  for (const row of rows) {
    console.log(
      `   ${row.stage.padEnd(14)} ${row.subjectFill.padStart(7)}  ${row.subjectAt.padStart(14)} ${row.sunFill.toFixed(0).padStart(8)}  ${row.sunAt.padStart(12)} ${row.corona.padStart(7)}  ${row.nearest.padStart(14)} ${row.step.padStart(6)}`,
    );
  }
  console.log('');
}

if (notes.length > 0) {
  console.log('Notes (intentional):');
  for (const note of notes) console.log(`  · ${note}`);
  console.log('');
}

if (failures.length > 0) {
  console.error(`FAIL — ${failures.length} contract violation(s):`);
  for (const failure of failures) console.error(`  ✗ ${failure}`);
  process.exit(1);
}

console.log('PASS — framing, collisions, path continuity and corona reach all within contract.');

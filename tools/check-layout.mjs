/**
 * Layout and content contract.
 *
 * Runs the project's own camera maths in Node — the same modules the browser
 * uses — and refuses to let the page ship if the story and the 3D scene have
 * drifted apart. Checks are grouped; every failure is printed, not just the
 * first. Exit code 1 means "do not build".
 *
 * Run with `npm run check:layout`.
 */

import {
  BODIES,
  CAMERA_KEYS,
  KEY_BY_ID,
  composeCamera,
  effectiveDistance,
  effectiveFrame,
  projectPoint,
  projectedRadius,
} from '../src/three/camera/anchors.ts';
import { nearestKey, sampleCamera } from '../src/three/camera/path.ts';
import { addDays, bodyPositions, formatIsoDate } from '../src/three/systems/epoch.ts';
import {
  CAMERA_PARAMS,
  DESTINATIONS,
  LAST_PARAM,
  OPENING,
  SECTIONS,
} from '../src/content/experience.ts';

const failures = [];
const checks = [];

function check(name, condition, detail) {
  checks.push(name);
  if (!condition) {
    failures.push(`${name}${detail === undefined ? '' : ` — ${detail}`}`);
  }
}

const VIEWPORTS = [
  { label: '1440x900', aspect: 1440 / 900, portrait: false },
  { label: '834x1112', aspect: 834 / 1112, portrait: true },
  { label: '390x844', aspect: 390 / 844, portrait: true },
];

const START = new Date();
const EPOCHS = [
  { label: 'today', date: START },
  { label: '+180d', date: addDays(START, 180) },
  { label: '-400d', date: addDays(START, -400) },
  { label: '+900d', date: addDays(START, 900) },
  { label: '-1000d', date: addDays(START, -1000) },
];

const NEAR = 1e-6;

/**
 * How large each subject is allowed to read, in NDC vertical radius. These are
 * design decisions, not tolerances: the hero is a limb, Jupiter fills more than
 * half the frame, and the transit keys are deliberately wide.
 */
const SIZE_BANDS = {
  entry: [0.24, 0.46],
  earth: [0.3, 0.6],
  'transit-moon': [0.05, 0.3],
  moon: [0.25, 0.6],
  mars: [0.3, 0.6],
  jupiter: [0.4, 0.72],
  ascent: [0.1, 0.5],
  sun: [0.4, 0.72],
  overview: [0.02, 0.2],
};

/* ----------------------------------------------------------- content spine --- */

const sectionIds = SECTIONS.map((section) => section.id);
check('sections are unique', new Set(sectionIds).size === SECTIONS.length);
check('thirteen sections', SECTIONS.length === 13, `found ${SECTIONS.length}`);

let previousParam = -Infinity;
for (const section of SECTIONS) {
  check(
    `section "${section.id}" param does not decrease`,
    section.param >= previousParam - 1e-9,
    `${previousParam} → ${section.param}`,
  );
  previousParam = section.param;
}

check(
  'last section sits on the final camera key',
  Math.abs((SECTIONS.at(-1)?.param ?? 0) - LAST_PARAM) <= 0.25,
  `close param ${SECTIONS.at(-1)?.param}, LAST_PARAM ${LAST_PARAM}`,
);

check('six destinations', DESTINATIONS.length === 6, `found ${DESTINATIONS.length}`);

const stationSections = SECTIONS.filter((section) => section.kind === 'station');
check('one station section per destination', stationSections.length === DESTINATIONS.length);

for (const destination of DESTINATIONS) {
  const section = stationSections.find((candidate) => candidate.station === destination.id);
  check(`destination "${destination.id}" has a section`, section !== undefined);
  if (section === undefined) continue;
  check(
    `station "${destination.id}" sits on its camera key`,
    Math.abs(section.param - CAMERA_PARAMS[section.cameraKey]) < NEAR,
    `param ${section.param} vs key ${CAMERA_PARAMS[section.cameraKey]}`,
  );
}

for (const section of SECTIONS) {
  if (section.cameraKey === null) continue;
  const key = KEY_BY_ID[section.cameraKey];
  check(`section "${section.id}" key exists`, key !== undefined);
  if (key === undefined) continue;
  check(
    `section "${section.id}" param matches key "${key.id}"`,
    Math.abs(key.param - CAMERA_PARAMS[key.id]) < NEAR,
  );
}

const expectedSides = {
  earth: 'left',
  moon: 'right',
  mars: 'left',
  belt: 'right',
  jupiter: 'left',
  sun: 'centre',
};
for (const destination of DESTINATIONS) {
  const section = stationSections.find((candidate) => candidate.station === destination.id);
  check(
    `caption side alternates as designed for "${destination.id}"`,
    section?.captionSide === expectedSides[destination.id],
    `expected ${expectedSides[destination.id]}, found ${section?.captionSide}`,
  );
}

check(
  'opening pacing is monotonic',
  OPENING.holdEnd < OPENING.revealEnd &&
    OPENING.revealEnd < OPENING.exitFrom &&
    OPENING.exitFrom < OPENING.exitTo &&
    OPENING.exitTo <= 1,
  JSON.stringify(OPENING),
);

/* -------------------------------------------------------------- camera keys --- */

let previousKeyParam = -Infinity;
for (const key of CAMERA_KEYS) {
  check(
    `key "${key.id}" param ascending`,
    key.param > previousKeyParam + 1e-9,
    `${previousKeyParam} → ${key.param}`,
  );
  previousKeyParam = key.param;
  check(`key "${key.id}" fov sane`, key.fov > 20 && key.fov < 70, `${key.fov}`);
  check(`key "${key.id}" frame inside view`, Math.abs(key.frameX) <= 0.6 && Math.abs(key.frameY) <= 0.8);
}

check(
  'camera params and keys agree',
  Object.entries(CAMERA_PARAMS).every(([id, param]) => KEY_BY_ID[id]?.param === param),
);
check('last camera key is the overview', LAST_PARAM === CAMERA_PARAMS.overview);

/* ----------------------------------------------------------- composition --- */

/**
 * Caption side versus subject side: copy on the left needs the subject right.
 * `centre` sections are allowed a small deliberate offset.
 */
for (const section of SECTIONS) {
  if (section.kind !== 'station') continue;
  const key = KEY_BY_ID[section.cameraKey];
  if (key === undefined) continue;
  if (section.captionSide === 'left') {
    check(`"${section.id}" subject sits right of the copy`, key.frameX >= 0.2, `frameX ${key.frameX}`);
  } else if (section.captionSide === 'right') {
    check(`"${section.id}" subject sits left of the copy`, key.frameX <= -0.2, `frameX ${key.frameX}`);
  } else {
    check(`"${section.id}" is centred on purpose`, Math.abs(key.frameX) <= 0.08, `frameX ${key.frameX}`);
  }
}

for (const epoch of EPOCHS) {
  const positions = bodyPositions(epoch.date);

  for (const viewport of VIEWPORTS) {
    for (const key of CAMERA_KEYS) {
      const frame = composeCamera(key, positions, viewport);
      const subject = positions[key.subject];
      const projection = projectPoint(subject, frame);
      const wantedX = effectiveFrame(key, viewport).x;
      const wantedY = effectiveFrame(key, viewport).y;

      check(
        `[${epoch.label} ${viewport.label}] "${key.id}" subject lands on frameX`,
        Math.abs(projection.x - wantedX) < 1e-6,
        `got ${projection.x.toFixed(6)}, wanted ${wantedX}`,
      );
      check(
        `[${epoch.label} ${viewport.label}] "${key.id}" subject lands on frameY`,
        Math.abs(projection.y - wantedY) < 1e-6,
        `got ${projection.y.toFixed(6)}, wanted ${wantedY}`,
      );
      check(
        `[${epoch.label} ${viewport.label}] "${key.id}" subject is in front of the camera`,
        projection.depth > 0,
        `depth ${projection.depth}`,
      );

      if (key.absolute === undefined) {
        // `distance` is measured along the view axis, so compare the axial gap
        // rather than the radial one — the frame offset moves the camera aside.
        const distance = effectiveDistance(key, viewport);
        const axial =
          (subject[0] - frame.position[0]) * frame.forward[0] +
          (subject[1] - frame.position[1]) * frame.forward[1] +
          (subject[2] - frame.position[2]) * frame.forward[2];
        check(
          `[${epoch.label} ${viewport.label}] "${key.id}" camera holds its distance`,
          Math.abs(axial - distance) < 1e-6,
          `got ${axial.toFixed(6)}, wanted ${distance}`,
        );
      }

      const body = BODIES[key.subject];
      const band = SIZE_BANDS[key.id];
      if (body !== undefined && band !== undefined) {
        const radius = projectedRadius(body.radius, projection.depth, frame);
        check(
          `[${epoch.label} ${viewport.label}] "${key.id}" subject reads at a sane size`,
          radius >= band[0] && radius <= band[1],
          `ndc radius ${radius.toFixed(3)} (band ${band[0]}–${band[1]})`,
        );
      }
    }

    /* --- the Sun must never photobomb a planet portrait or the hero --- */
    for (const id of ['entry', 'earth', 'moon', 'mars', 'jupiter']) {
      const key = KEY_BY_ID[id];
      const frame = composeCamera(key, positions, viewport);
      const sun = projectPoint(positions.sun, frame);
      const behind = sun.depth <= 0;
      const outside = Math.abs(sun.x) > 1.1 || Math.abs(sun.y) > 1.1;
      check(
        `[${epoch.label} ${viewport.label}] "${id}" keeps the Sun out of frame`,
        behind || outside,
        `sun ndc (${sun.x.toFixed(2)}, ${sun.y.toFixed(2)}) depth ${sun.depth.toFixed(1)}`,
      );
    }

    /* --- the hero: a limb, never a portrait --- */
    const entry = KEY_BY_ID.entry;
    const entryFrame = composeCamera(entry, positions, viewport);
    const earthProjection = projectPoint(positions.earth, entryFrame);
    const earthRadius = projectedRadius(BODIES.earth.radius, earthProjection.depth, entryFrame);
    check(
      `[${epoch.label} ${viewport.label}] hero shows a limb, not a planet portrait`,
      earthRadius <= 0.46 && earthProjection.y + earthRadius <= -0.12,
      `ndc radius ${earthRadius.toFixed(3)}, top edge ${(earthProjection.y + earthRadius).toFixed(3)}`,
    );
    check(
      `[${epoch.label} ${viewport.label}] hero keeps Earth substantial`,
      earthRadius >= 0.24,
      `ndc radius ${earthRadius.toFixed(3)}`,
    );

    /* --- the Moon shot must not contain Earth --- */
    const moonFrame = composeCamera(KEY_BY_ID.moon, positions, viewport);
    const earthFromMoon = projectPoint(positions.earth, moonFrame);
    check(
      `[${epoch.label} ${viewport.label}] Moon shot keeps Earth out of frame`,
      earthFromMoon.depth <= 0 || Math.abs(earthFromMoon.x) > 1.15 || Math.abs(earthFromMoon.y) > 1.15,
      `earth ndc (${earthFromMoon.x.toFixed(2)}, ${earthFromMoon.y.toFixed(2)}) depth ${earthFromMoon.depth.toFixed(1)}`,
    );

    /* --- reduced motion: whole keys, never a half-travelled camera --- */
    for (const sample of [0.3, 0.8, 1.2, 2.5, 3.4, 4.6, 5.2, 6.3, 6.8]) {
      const cutFrame = sampleCamera(sample, positions, viewport, true);
      const expected = composeCamera(nearestKey(sample), positions, viewport);
      check(
        `[${epoch.label} ${viewport.label}] reduced motion at ${sample} is a still key`,
        Math.abs(cutFrame.position[0] - expected.position[0]) < 1e-9 &&
          Math.abs(cutFrame.position[1] - expected.position[1]) < 1e-9 &&
          Math.abs(cutFrame.position[2] - expected.position[2]) < 1e-9 &&
          Math.abs(cutFrame.fov - expected.fov) < 1e-9,
        'cut frame differs from its nearest key',
      );
    }

    /* --- the flight never clips a body --- */
    for (const body of Object.values(BODIES)) {
      const clearance = body.radius * 1.15 + 0.05;
      let worst = Number.POSITIVE_INFINITY;
      let worstParam = 0;
      const samples = 400;
      for (let index = 0; index <= samples; index += 1) {
        const param = (index / samples) * LAST_PARAM;
        const frame = sampleCamera(param, positions, viewport, false);
        const distance = Math.hypot(
          frame.position[0] - positions[body.id][0],
          frame.position[1] - positions[body.id][1],
          frame.position[2] - positions[body.id][2],
        );
        if (distance < worst) {
          worst = distance;
          worstParam = param;
        }
      }
      check(
        `[${epoch.label} ${viewport.label}] flight clears ${body.id}`,
        worst >= clearance,
        `closest ${worst.toFixed(3)} at param ${worstParam.toFixed(2)} (needs ${clearance.toFixed(3)})`,
      );
    }
  }
}

/* --------------------------------------------------------------- reporting --- */

const label = `${checks.length - failures.length}/${checks.length} checks passed`;
if (failures.length === 0) {
  console.log(`check-layout: PASS — ${label}`);
  console.log(
    `  ${SECTIONS.length} sections · ${DESTINATIONS.length} destinations · ${CAMERA_KEYS.length} camera keys · ${EPOCHS.length} epochs × ${VIEWPORTS.length} viewports`,
  );
  console.log(`  dates sampled: ${EPOCHS.map((epoch) => formatIsoDate(epoch.date)).join(', ')}`);
} else {
  console.log(`check-layout: FAIL — ${label}`);
  for (const failure of failures) {
    console.log(`  ✗ ${failure}`);
  }
  process.exitCode = 1;
}

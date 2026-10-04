#!/usr/bin/env node
/**
 * The content contract. It is deliberately strict about the things that are easy
 * to get wrong in a hurry: an unsourced number, a rung out of order, a missing
 * experiment, a colour written down twice, docs that drifted from the code.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { RUNGS } from '../src/content/ladder.ts'

const here = decodeURIComponent(new URL("..", import.meta.url).pathname)
const root = here.startsWith("/") && /^[A-Za-z]:/.test(here.slice(1)) ? here.slice(1) : here
const failures = []
const notes = []
const fail = (msg) => failures.push(msg)

if (RUNGS.length !== 8) fail(`the ladder must have 8 rungs, found ${RUNGS.length}`)

const ids = new Set()
let previous = 0
for (const [i, rung] of RUNGS.entries()) {
  const at = `rung ${i + 1} (${rung.id ?? 'no id'})`
  if (ids.has(rung.id)) fail(`${at}: duplicate id`)
  ids.add(rung.id)
  if (rung.index !== String(i + 1).padStart(2, '0')) fail(`${at}: index should be ${i + 1} padded to two digits`)
  if (!(rung.seconds > previous)) fail(`${at}: look-back must increase; ${rung.seconds} does not beat ${previous}`)
  previous = rung.seconds
  for (const key of ['name', 'value', 'unit', 'arrow', 'fact', 'explanation', 'source', 'accent', 'label']) {
    const text = typeof rung[key] === 'string' ? rung[key].trim() : ''
    // "value" is the plate numeral and may legitimately be a single figure —
    // the Sun's headline is "8" with "minutes 20 seconds" set beside it.
    if (!text || (key !== 'value' && text.length < 2)) fail(`${at}: "${key}" is missing or too short`)
  }
  if (!/\d/.test(rung.source)) fail(`${at}: the source line carries no figure`)
  if (rung.source.length < 24) fail(`${at}: the source line is too thin to check`)
  for (const axis of ['pos', 'look']) {
    const v = rung.frame?.[axis]
    if (!Array.isArray(v) || v.length !== 3 || v.some((n) => typeof n !== 'number')) {
      fail(`${at}: frame.${axis} must be three numbers`)
    }
  }
  if (RUNGS.some((other, j) => j !== i && other.id === rung.id)) fail(`${at}: id is not unique`)

  const spec = rung.experiment
  if (!spec) {
    fail(`${at}: no experiment`)
    continue
  }
  if (!['pulse', 'scrub', 'compare', 'toggle'].includes(spec.mechanism)) fail(`${at}: unknown mechanism`)
  for (const key of ['prompt', 'result', 'detail']) {
    if (!spec[key] || spec[key].length < 8) fail(`${at}: experiment.${key} is missing`)
  }
  if (spec.mechanism === 'pulse' && !(spec.durationMs > 0)) fail(`${at}: a pulse needs a duration`)
  if (spec.mechanism === 'scrub') {
    if (!spec.phases?.length) fail(`${at}: a scrub needs phases`)
    else {
      const sorted = [...spec.phases].sort((a, b) => a.at - b.at)
      if (sorted[0].at !== 0) fail(`${at}: phases must start at 0`)
      if (sorted[sorted.length - 1].at > 1) fail(`${at}: phases must not exceed 1`)
      if (sorted.some((p, j) => j > 0 && p.at <= sorted[j - 1].at)) fail(`${at}: phase breakpoints must increase`)
      for (const p of spec.phases) if (!p.text || p.text.length < 20) fail(`${at}: a phase caption is too short`)
    }
  }
  if (spec.mechanism === 'compare' || spec.mechanism === 'toggle') {
    if (!spec.options || spec.options.length < 2) fail(`${at}: a choice needs at least two options`)
    else {
      const optionIds = new Set(spec.options.map((o) => o.id))
      if (optionIds.size !== spec.options.length) fail(`${at}: duplicate option ids`)
      for (const o of spec.options) {
        if (!o.label || !o.note || o.note.length < 20) fail(`${at}: option "${o.id}" needs a label and a real note`)
      }
    }
  }
}

/* ── the docs must not drift from the code ─────────────────────────────── */
const content = readFileSync(join(root, 'docs/CONTENT.md'), 'utf8')
for (const rung of RUNGS) {
  if (!content.includes(rung.id)) fail(`docs/CONTENT.md does not mention the rung "${rung.id}"`)
  if (!content.includes(rung.arrow)) fail(`docs/CONTENT.md is missing the look-back value ${rung.arrow}`)
  if (!content.includes(rung.source)) fail(`docs/CONTENT.md is missing the source line for ${rung.id}`)
  if (!content.includes(rung.fact)) fail(`docs/CONTENT.md is missing the fact for ${rung.id}`)
}

/* ── one colour, one place ─────────────────────────────────────────────── */
const mirror = ['src/scene/palette.ts']
const walk = (dir) =>
  readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry)
    return statSync(full).isDirectory() ? walk(full) : [full]
  })

let hexCount = 0
for (const file of walk(join(root, 'src'))) {
  const rel = relative(root, file).split(sep).join('/')
  if (!/\.(ts|tsx|css)$/.test(rel)) continue
  if (rel === 'src/styles/tokens.css' || mirror.includes(rel)) continue
  const body = readFileSync(file, 'utf8')
  const matches = body.match(/#[0-9a-fA-F]{3,8}\b/g)
  if (matches) {
    hexCount += matches.length
    fail(`${rel}: ${matches.length} colour literal(s) outside the token file (${matches.join(', ')})`)
  }
}

/* ── report ────────────────────────────────────────────────────────────── */
notes.push(`${RUNGS.length} rungs · ${hexCount} stray colours · sources verified against docs/CONTENT.md`)
if (failures.length) {
  console.error('\ncontent contract FAILED\n')
  for (const f of failures) console.error(`  ✗ ${f}`)
  console.error(`\n${failures.length} failure(s)\n`)
  process.exit(1)
}
console.log('content contract ok')
for (const n of notes) console.log(`  ${n}`)

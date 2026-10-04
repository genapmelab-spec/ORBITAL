#!/usr/bin/env node
/**
 * Post-build budget gate. Reads the real output of the real build: gzip sizes,
 * what is loaded up front versus lazily, image bytes, and the no-JavaScript copy
 * of the ladder that the HTML plugin injected.
 */
import { gzipSync } from 'node:zlib'
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, extname, relative, sep } from 'node:path'
import { RUNGS } from '../src/content/ladder.ts'

const here = decodeURIComponent(new URL("..", import.meta.url).pathname)
const root = here.startsWith("/") && /^[A-Za-z]:/.test(here.slice(1)) ? here.slice(1) : here
const dist = join(root, 'dist')

const BUDGET = {
  initialJs: 150 * 1024,
  lazyJs: 350 * 1024,
  css: 30 * 1024,
  fonts: 140 * 1024,
  images: 0,
}

const failures = []
const warn = []
const fail = (m) => failures.push(m)

if (!existsSync(dist)) {
  console.error('no dist/ — run `npm run build` first')
  process.exit(1)
}

const walk = (dir) =>
  readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry)
    return statSync(full).isDirectory() ? walk(full) : [full]
  })

const files = walk(dist)
const gz = (f) => gzipSync(readFileSync(f), { level: 9 }).length
const kb = (n) => `${(n / 1024).toFixed(1)} KB`

const html = readFileSync(join(dist, 'index.html'), 'utf8')
const initialAssets = new Set()
for (const m of html.matchAll(/(?:src|href)="([^"]+\.(?:js|cjs|css))"/g)) {
  initialAssets.add(m[1].replace(/^\//, ''))
}

const js = files.filter((f) => extname(f) === '.js')
const css = files.filter((f) => extname(f) === '.css')
const fonts = files.filter((f) => extname(f) === '.woff2')
const images = files.filter((f) => ['.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif', '.mp4'].includes(extname(f)))

let initial = 0
let lazy = 0
for (const f of js) {
  const size = gz(f)
  const rel = relative(dist, f).split(sep).join('/')
  if (initialAssets.has(rel)) initial += size
  else lazy += size
}

const cssSize = css.reduce((sum, f) => sum + gz(f), 0)
const fontSize = fonts.reduce((sum, f) => sum + gz(f), 0)
const imageSize = images.reduce((sum, f) => sum + statSync(f).size, 0)

if (initial > BUDGET.initialJs) fail(`initial JavaScript is ${kb(initial)} (budget ${kb(BUDGET.initialJs)})`)
if (lazy > BUDGET.lazyJs) fail(`the lazy scene chunk is ${kb(lazy)} (budget ${kb(BUDGET.lazyJs)})`)
if (cssSize > BUDGET.css) fail(`CSS is ${kb(cssSize)} (budget ${kb(BUDGET.css)})`)
if (fontSize > BUDGET.fonts) fail(`font bytes are ${kb(fontSize)} (budget ${kb(BUDGET.fonts)})`)
if (imageSize > BUDGET.images) fail(`${kb(imageSize)} of image or video bytes shipped; ORBITAL draws everything`)
if (js.length > 3) warn.push(`${js.length} JavaScript chunks — check that nothing else crept into the critical path`)

/* The no-JavaScript ladder must survive the build. */
for (const rung of RUNGS) {
  if (!html.includes(rung.name)) fail(`dist/index.html has no <noscript> copy of rung "${rung.id}"`)
}
if (!html.includes('<noscript')) fail('dist/index.html lost the noscript ladder entirely')

console.log('build budget')
console.log(`  initial JS   ${kb(initial).padStart(9)}  (budget ${kb(BUDGET.initialJs)})`)
console.log(`  lazy JS      ${kb(lazy).padStart(9)}  (budget ${kb(BUDGET.lazyJs)})  ${js.length} chunks total`)
console.log(`  CSS          ${kb(cssSize).padStart(9)}  (budget ${kb(BUDGET.css)})`)
console.log(`  fonts        ${kb(fontSize).padStart(9)}  (budget ${kb(BUDGET.fonts)})  ${fonts.length} files`)
console.log(`  images       ${kb(imageSize).padStart(9)}  (budget ${kb(BUDGET.images)})`)
console.log(`  total        ${kb(initial + lazy + cssSize + fontSize).padStart(9)}  first visit`)

for (const w of warn) console.warn(`  ! ${w}`)
if (failures.length) {
  console.error('\nbudget FAILED\n')
  for (const f of failures) console.error(`  ✗ ${f}`)
  console.error('')
  process.exit(1)
}
console.log('\nbudget ok · the noscript ladder is in the built HTML')

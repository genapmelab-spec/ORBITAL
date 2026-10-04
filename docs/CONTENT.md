# CONTENT — the script, the numbers, and where they come from

ORBITAL has one rule that matters more than any other: **every figure on screen is
sourced on screen.** This file is the human-readable side of that rule. The code
side is [`src/content/ladder.ts`](../src/content/ladder.ts), and
[`tools/check-content.mjs`](../tools/check-content.mjs) fails the build unless this
file contains, for every rung, its `id`, its `arrow`, its `fact` and its `source`
line **verbatim**. If you change a number in the ladder, change it here in the
same commit or `npm run check:content` will stop you.

## The eight rungs

| # | id | Ruler (arrow) | Look-back | Light-seconds | Mechanism |
|---|----|---------------|-----------|---------------|-----------|
| 01 | `moon` | 1.28 s | 1.28 seconds | 1.282 | pulse |
| 02 | `sun` | 8 m 20 s | 8 minutes 20 seconds | 499 | scrub |
| 03 | `voyager` | 23 h 40 m | 23 hours 40 minutes | 85,180 | pulse |
| 04 | `betelgeuse` | 550 y | 550 years | 1.7357×10¹⁰ | toggle |
| 05 | `crab` | 6,500 y | 6,500 years | 2.0512×10¹¹ | compare |
| 06 | `core` | 26,000 y | 26,000 years | 8.205×10¹¹ | toggle |
| 07 | `andromeda` | 2.5 M y | 2.5 million years | 8.0156×10¹³ | compare |
| 08 | `firstlight` | 13.8 G y | 13.8 billion years | 4.354×10¹⁷ | scrub |

Four mechanisms are shared across eight rungs, so the visitor learns the
instrument once and then only has to read: **pulse** (fire and wait — Moon,
Voyager), **scrub** (drag a process across its stages — Sun, First Light),
**toggle** (switch the light through which the object is seen — Betelgeuse,
Galactic Centre), **compare** (hold two dates at once — Crab, Andromeda).

## Conversion rules

All look-back figures are stored in the ladder as **seconds**, so ordering can be
checked numerically instead of alphabetically.

- `c = 299,792.458 km/s`.
- One Julian year `= 3.15576×10⁷ s`; 1 light-year = 9.4607×10¹² km.
- Light time = distance ÷ c. For one astronomical unit: 149,597,870.7 ÷ 299,792.458
  = **499.0 s** (8 m 19 s, quoted everywhere as 8 m 20 s).
- The Moon: 384,400 ÷ 299,792.458 = **1.282 s**; the round trip is 2.56 s.
- Voyager 1: 85,180 s = 23 h 40 m, which is 170.7 AU of light travel — the
  rounded ≈170 AU published in the mission status.
- Betelgeuse: 550 ly × 3.15576×10⁷ = **1.7357×10¹⁰ s**.
- Crab: 6,500 ly × 3.15576×10⁷ = **2.0512×10¹¹ s**.
- Galactic Centre: 26,000 ly × 3.15576×10⁷ = **8.205×10¹¹ s** (the source line
  quotes the more precise 8.15 kpc ≈ 26,600 ly; the rung's headline is the
  round 26,000 y).
- Andromeda: 2.54 Mly × 3.15576×10⁷ = **8.0156×10¹³ s**.
- First Light: 13.797 Gyr × 3.15576×10⁷ = **4.354×10¹⁷ s**.

Only the *look-back* figures are real. Sizes and separations in the 3D scene are
staged, and the instrument section says so out loud: *"Distances here are
compressed so they can be seen. The numbers are not."*

## 01 · The Moon — `moon`

**Ruler:** 1.28 s

**Fact.** The Moon is one and a quarter seconds away.

**Source.** 384,400 km mean distance · Apollo 11/14/15 retroreflectors · NASA-GSFC lunar laser ranging

**Experiment.** Fire the laser (pulse, 2,560 ms). Apollo 11, 14 and 15 each left a
retroreflector on the surface; observatories still fire at them and time the
return. Round trip: 2.56 seconds.

## 02 · The Sun — `sun`

**Ruler:** 8 m 20 s

**Fact.** The light on your face left the surface eight minutes ago.

**Source.** 1 AU = 149,597,870.7 km · 499 s at c · core-to-surface photon diffusion 10⁴–10⁵ yr (NASA)

**Experiment.** Run the photon (scrub). Four phases: inside the core; tens of
thousands of years of collisions; the last leg; 499 seconds to Earth. The point
of the rung is the split — the same photon takes ~100,000 years to escape the Sun
and 8 minutes 20 seconds to cross to your eye.

## 03 · Voyager 1 — `voyager`

**Ruler:** 23 h 40 m

**Fact.** The farthest thing we have ever sent is most of a day away at the speed of light.

**Source.** ≈170 AU (2026) · NASA/JPL Voyager mission status · light time = distance ÷ c

**Experiment.** Transmit (pulse, 5,200 ms). The command takes 23 h 40 m to arrive;
the earliest possible reply comes back a day after that. Nothing can answer sooner.

## 04 · Betelgeuse — `betelgeuse`

**Ruler:** 550 y

**Fact.** Betelgeuse may already be gone. The news is 550 years late.

**Source.** Gaia DR3 ≈168 pc (~548 ly, ±25%) · radius ≈764 R☉ · collapse expected within ~10⁵ yr

**Experiment.** Light the fuse (toggle). *Tonight* — nothing, the star you are
watching left 550 years ago. *If it detonated tonight* — the shockwave leaves now,
the light follows at the same speed, and we find out in about 2576. The 550-year
delay is the whole argument: the explosion may already have happened.

## 05 · The Crab Nebula — `crab`

**Ruler:** 6,500 y

**Fact.** In 1054, Chinese astronomers logged a guest star you could see in daylight for twenty-three days.

**Source.** SN 1054 records · distance ≈6,500 ly · PSR B0531+21 at 30.2 Hz · expansion ≈1,500 km/s

**Experiment.** Two dates (compare). *1054* — the arrival, a guest star in Taurus,
in daylight for 23 days. *Tonight* — the wreck roughly 970 years after the blast,
lit from inside by a pulsar spinning 30.2 times a second. The rung carries two
clocks at once: 6,500 years of light travel, and 970 years of aftermath.

## 06 · The Galactic Centre — `core`

**Ruler:** 26,000 y

**Fact.** The middle of our own galaxy is invisible to your eyes.

**Source.** 8.15 kpc (≈26,600 ly) · A_V ≈ 30 mag toward Sgr A* · EHT 2022: 4.297×10⁶ M☉, ring ≈52 μas

**Experiment.** Change the light (toggle). *Visible* — nothing; the dust wins.
*Infrared* — the dust itself, glowing. *Radio, 1.3 mm* — the shadow of the black
hole: 4.3 million solar masses, ringed by light that bent around them. The first
image of it (EHT, 2022) was radio, not light. The rung is partly about distance
and partly about the fact that *seeing* has a wavelength, and ours is narrow.

## 07 · Andromeda — `andromeda`

**Ruler:** 2.5 M y

**Fact.** The farthest thing your unaided eye can reach left before our species existed.

**Source.** M31: 2.54 ± 0.06 Mly · ~10¹² stars · approaching the Milky Way at ≈110 km/s

**Experiment.** Then and now (compare). *Then* — the light leaves, Oldowan stone
tools, Homo sapiens 2.2 million years away. *Now* — it lands in your eye and the
galaxy that sent it has turned a quarter of a turn since. No instrument is needed
for this rung; it is naked-eye astronomy.

## 08 · First Light — `firstlight`

**Ruler:** 13.8 G y

**Fact.** You cannot see further back than this.

**Source.** Planck 2018: 13.797 Gyr · T = 2.7255 K · recombination z ≈ 1100 (~3,000 K) · fluctuations ~1 part in 10⁵

**Experiment.** Turn up the heat (scrub). 2.725 K: the whole sky as a whisper of
microwaves, with the blueprint of every galaxy inside it. Warm it and the glow
climbs from microwave into the visible; at ~3,000 K the universe glows like a star's
surface. Further back is opacity — a charged fog that light could not cross for the
first 380,000 years. This is the oldest light there is.

## How the checker enforces it

`tools/check-content.mjs` asserts: exactly eight rungs; unique ids; two-digit
indices; strictly increasing look-back; no empty name/value/unit/arrow/fact/
explanation/source/accent/label; a source line at least 24 characters long that
contains a numeral; three numbers in each `frame` vector; a known mechanism; a
positive duration for every pulse; scrub phases that start at 0, never exceed 1,
strictly increase, and carry real captions; two or more options with distinct ids
and real notes for every toggle and compare — **and** that this file mentions each
rung's id and carries its arrow, source and fact strings unaltered. It also scans
`src/` for hex colour literals outside `src/styles/tokens.css` and
`src/scene/palette.ts`.

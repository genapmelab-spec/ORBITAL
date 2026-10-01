/**
 * Deterministic RNG (mulberry32). Every procedural layout in the scene is
 * seeded, so the starfield and the asteroid fields are identical on every
 * reload — reviewable, diffable, never a different picture each visit.
 */
export function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Evenly distributed point on a unit sphere — used for stars and rubble. */
export function randomDirection(random: () => number): [number, number, number] {
  const z = random() * 2 - 1;
  const angle = random() * Math.PI * 2;
  const radius = Math.sqrt(Math.max(0, 1 - z * z));
  return [Math.cos(angle) * radius, z, Math.sin(angle) * radius];
}

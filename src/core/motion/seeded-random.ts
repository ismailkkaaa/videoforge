/**
 * Deterministic pseudo-random number generator (PRNG) using mulberry32.
 * Takes a seed (string or number) and returns a function that produces numbers between 0 and 1.
 */
export function seededRandom(seed: number | string) {
  let h = 0;
  if (typeof seed === 'string') {
    // Generate a numeric hash from string seed
    for (let i = 0; i < seed.length; i++) {
      h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
    }
  } else {
    h = seed | 0;
  }

  return function next(): number {
    h = (h + 0x6d2b79f5) | 0;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

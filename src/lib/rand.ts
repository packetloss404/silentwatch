// Deterministic PRNG used for seed data so the same payload comes out on every
// server restart. Avoids hydration mismatches and gives a "lived-in" feeling
// dataset without mutation between requests.

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickFrom<T>(rand: () => number, arr: readonly T[]): T {
  if (arr.length === 0) {
    throw new Error('pickFrom: empty array');
  }
  return arr[Math.floor(rand() * arr.length)]!;
}

export function intBetween(rand: () => number, min: number, max: number): number {
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  return Math.floor(rand() * (hi - lo + 1)) + lo;
}

export function floatBetween(rand: () => number, min: number, max: number): number {
  return rand() * (max - min) + min;
}

export function chance(rand: () => number, p: number): boolean {
  return rand() < p;
}

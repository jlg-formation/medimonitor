// Générateurs pseudo-aléatoires déterministes. Math.random() est interdit dans le domaine.

/** Générateur mulberry32 seedé. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Hash sans état d'une suite d'entiers vers [0, 1). */
export function hashUnit(...parts: number[]): number {
  let h = 0x811c9dc5;
  for (const p of parts) {
    h = Math.imul(h ^ (p | 0), 0x01000193) >>> 0;
    h ^= h >>> 13;
    h = Math.imul(h, 0x5bd1e995) >>> 0;
    h ^= h >>> 15;
  }
  return mulberry32(h)();
}

/** Entier déterministe dans [-amplitude, amplitude]. */
export function hashJitter(amplitude: number, ...parts: number[]): number {
  return Math.floor(hashUnit(...parts) * (2 * amplitude + 1)) - amplitude;
}

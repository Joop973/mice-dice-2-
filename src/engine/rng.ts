// Deterministischer Zufallsgenerator. Bewusst injizierbar, damit Engine-Tests
// reproduzierbar sind und der Online-Modus später eine gemeinsame Seed teilen kann.

export interface RNG {
  /** Liefert eine Zahl in [0, 1). */
  next(): number;
}

/** mulberry32 — kleiner, schneller, gut verteilter PRNG mit 32-Bit-Seed. */
export function createRNG(seed: number): RNG {
  let a = seed >>> 0;
  return {
    next(): number {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
  };
}

/** Ganzzahl in [min, max] (inklusive) aus einem RNG. */
export function randInt(rng: RNG, min: number, max: number): number {
  return min + Math.floor(rng.next() * (max - min + 1));
}

/** Wählt ein zufälliges Element aus einem nicht-leeren Array. */
export function pick<T>(rng: RNG, items: readonly T[]): T {
  return items[randInt(rng, 0, items.length - 1)];
}

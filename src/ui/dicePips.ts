// Single-Source der Würfel-Augen (Pips). 2D (Die.tsx) und 3D (dieTexture.ts)
// nutzen DIESELBEN Layouts — keine zweite Definition. Reine Präsentation: die
// Augen-Anordnung leitet sich nur aus dem (von der Engine gelieferten) Wert ab,
// die Wertelogik bleibt unangetastet.
//
// Position im 3x3-Raster:  0 1 2 / 3 4 5 / 6 7 8.
export const PIP_LAYOUT: Record<number, readonly number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
  7: [0, 2, 3, 4, 5, 6, 8],
  8: [0, 1, 2, 3, 5, 6, 7, 8],
  9: [0, 1, 2, 3, 4, 5, 6, 7, 8],
};

/** Augen-Layout für einen Wert, oder null (dann Zahl anzeigen, z. B. W12/W20). */
export function pipsFor(value: number): readonly number[] | null {
  return PIP_LAYOUT[value] ?? null;
}

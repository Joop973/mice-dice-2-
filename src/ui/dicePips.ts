// Geteilte Würfel-Augen-Logik (Pips) für 2D (Die.tsx) und 3D (dice3d/dieTexture.ts),
// damit beide Renderer identische Augen-Anordnungen und Kontrastwahl nutzen.
// Rein (kein DOM/THREE) -> in jsdom unit-testbar.

/** Pip-Positionen im 3×3-Raster (gx, gy ∈ {0,1,2}) je Augenzahl 1–6. */
export const PIP_LAYOUT: Record<number, [number, number][]> = {
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [2, 0], [0, 2], [2, 2]],
  5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]],
  6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]],
};

/** Werte 1–6 werden als Augen gezeichnet; sonst (negativ/≥7) als Zahl. */
export function hasPips(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= 6;
}

/** Relative Luminanz einer Hex-Farbe (#rrggbb) für die Kontrastwahl. */
export function luminance(hex: string): number {
  const c = hex.replace('#', '');
  const r = parseInt(c.slice(0, 2), 16) / 255;
  const g = parseInt(c.slice(2, 4), 16) / 255;
  const b = parseInt(c.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Kontrastreiche Vordergrundfarbe (dunkel auf hell, hell auf dunkel). */
export function pipColor(bg: string): string {
  return luminance(bg) > 0.5 ? '#1c1410' : '#f6efe6';
}

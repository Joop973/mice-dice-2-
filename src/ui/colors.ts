// Farb-Slots für die Würfel. Phase 4 ersetzt diese CSS-Farben durch echte
// 3D-Materialien (react-three-fiber): ~8 Material-/Farbdefinitionen + ein
// Zahlensatz statt ~118 einzeln gezeichneter Würfelseiten.

import type { DieColor } from '../engine';

export const DIE_COLORS: Record<DieColor, string> = {
  yellow: '#f4c542',
  green: '#5fbf6a',
  blue: '#4f8ef0',
  purple: '#9b6cd6',
  red: '#e0564f',
  clear: '#dfe6ec',
  pink: '#f07ec0',
  orange: '#f0913f',
  sabotage: '#3a3f47',
  brown: '#8a6240',
};

export const DIE_LABELS: Record<DieColor, string> = {
  yellow: 'Gelb',
  green: 'Grün',
  blue: 'Blau',
  purple: 'Lila',
  red: 'Rot',
  clear: 'Klar',
  pink: 'Pink',
  orange: 'Orange',
  sabotage: 'Sabotage',
  brown: 'Braun',
};

// Spielerfarben (Ohren-Innenseite + Schal der Maus-Avatare). Single-Source,
// auf die Pixel-Palette abgestimmt und CVD-tauglich unterscheidbar (Gelb, Blau,
// Grün, Magenta, Orange, Türkis). Bis zu 6 Spieler werden eindeutig eingefärbt.
export const PLAYER_COLORS: readonly string[] = [
  '#f4c542', // 0 Gelb (Käse)
  '#5aa9e6', // 1 Blau
  '#5fbf6a', // 2 Grün
  '#e0568a', // 3 Magenta
  '#f0913f', // 4 Orange
  '#4bb3a6', // 5 Türkis
];

/** Farbe eines Spielers anhand seines Index (stabil, wrappt bei >6). */
export function playerColor(index: number): string {
  return PLAYER_COLORS[
    ((index % PLAYER_COLORS.length) + PLAYER_COLORS.length) % PLAYER_COLORS.length
  ];
}

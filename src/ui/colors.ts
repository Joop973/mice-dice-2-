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

/** Farben der Spieler-Mäuse (Sitz 0–5); zum Einfärben von Avataren/Figuren.
 *  Auf CVD-Unterscheidbarkeit geachtet (kein zweites Rot/Grün): Teal + Magenta. */
export const PLAYER_COLORS: string[] = [
  '#e0564f', // Rot
  '#4f8ef0', // Blau
  '#5fbf6a', // Grün
  '#f0913f', // Orange
  '#2bb3c0', // Teal
  '#b15fd6', // Magenta
];

/** Spieler-Index aus der Engine-ID ('p0'..'p3'). */
export function playerIndex(id: string): number {
  const n = Number(id.replace(/^p/, ''));
  return Number.isFinite(n) ? n : 0;
}

/** Symbole je Würfelfarbe für den Farbenblind-Modus (zusätzlich zur Farbe). */
export const DIE_GLYPHS: Record<DieColor, string> = {
  yellow: '◆',
  green: '●',
  blue: '■',
  purple: '▲',
  red: '✕',
  clear: '◌',
  pink: '◇',
  orange: '★',
  sabotage: '☣',
  brown: '⬟',
};

/** Symbole je Spieler-Sitz (0–5) für den Farbenblind-Modus. */
export const PLAYER_GLYPHS: string[] = ['①', '②', '③', '④', '⑤', '⑥'];

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

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

/**
 * Kurze Beschreibung jeder Würfelfarbe (für Tooltips beim Drüberfahren bzw.
 * langem Drücken im Draft-Angebot). Eine knappe Zeile pro Farbe.
 */
export const DIE_DESCRIPTIONS: Record<DieColor, string> = {
  yellow: 'Gelb: höchste Gelb-Summe gewinnt die Käse-Krone.',
  green: 'Grün: zählt einfach mit seiner Augensumme.',
  blue: 'Blau: zählt mit seiner Summe; Glitzer zählt als dieselbe Farbe.',
  purple: 'Lila: zählt einfach mit seiner Augensumme.',
  red: 'Rot: hohes Risiko – kann negativ sein, dafür hohe Spitzenwerte.',
  clear: 'Klar: in der Tausch-Phase neu würfelbar. Zählt selbst nicht zur Wertung.',
  pink: 'Pink: zählt einfach mit seiner Augensumme.',
  orange: 'Orange: Wert × Anzahl verschiedener Farben dieser Runde.',
  sabotage: 'Sabotage: die Summe wird dem Kronenhalter abgezogen.',
  brown: 'Braun: Summe × Größe der größten gleichen Gruppe.',
};

// Spielerfarben (Ohren-Innenseite + Schal der Maus-Avatare). Single-Source,
// auf die Pixel-Palette abgestimmt und CVD-tauglich unterscheidbar (Gelb, Blau,
// Grün, Magenta, Orange, Türkis). Bis zu 6 Spieler werden eindeutig eingefärbt.
// Reihenfolge passend zu den Schalfarben der Maus-Sprites (public/sprites).
export const PLAYER_COLORS: readonly string[] = [
  '#d8483a', // 0 Rot
  '#3f7fd0', // 1 Blau
  '#4fa64a', // 2 Grün
  '#8a5bc0', // 3 Lila
  '#e0832f', // 4 Orange
  '#3fa890', // 5 Türkis
];

/** Farbe eines Spielers anhand seines Index (stabil, wrappt bei >6). */
export function playerColor(index: number): string {
  return PLAYER_COLORS[
    ((index % PLAYER_COLORS.length) + PLAYER_COLORS.length) % PLAYER_COLORS.length
  ];
}

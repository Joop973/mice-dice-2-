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

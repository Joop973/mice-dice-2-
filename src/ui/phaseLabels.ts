// Single-Source der Phasen-Texte. Geteilt von App (lokal) und OnlineFlow (online),
// damit beide Screens identische Beschriftungen zeigen.
//
// ACHTUNG: Die PHASE_LABEL-Strings sind an Tests gekoppelt
// (src/ui/__tests__/OnlineFlow.test.tsx prüft z. B. '1 · Würfeln',
// '2 · Mitleidswürfel'). Nicht umformulieren.

import type { Phase } from '../engine';

export const PHASE_LABEL: Record<Phase, string> = {
  roll: '1 · Würfeln',
  pity: '2 · Mitleidswürfel',
  swap: '3 · Klar tauschen',
  draft: '4 · Drafting',
};

export const PHASE_HINT: Record<Phase, string> = {
  roll: 'Alle Mäuse haben ihren Beutel geworfen.',
  pity: 'Schwächere Mäuse erhalten einen Mitleidswürfel (hervorgehoben).',
  swap: 'Tippe deine Klar-Würfel an und würfle sie neu. Andere Farben bleiben.',
  draft: 'Reihum einen Würfel aus dem Angebot wählen – oder passen.',
};

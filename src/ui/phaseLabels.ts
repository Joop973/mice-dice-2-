// Geteilte Phasen-Beschriftungen (lokal + online). Strings bewusst byte-identisch
// zu den Test-Erwartungen in OnlineFlow.test.tsx halten.

import type { Phase } from '../engine';

export const PHASE_LABEL: Record<Phase, string> = {
  roll: '1 · Würfeln',
  pity: '2 · Mitleidswürfel',
  swap: '3 · Klar tauschen',
  draft: '4 · Drafting',
};

export const PHASE_ICON: Record<Phase, string> = {
  roll: '🎲',
  pity: '🫶',
  swap: '🔄',
  draft: '🛒',
};

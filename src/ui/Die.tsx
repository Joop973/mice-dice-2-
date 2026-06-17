// CSS-Platzhalter-Würfel (Phase 0/2). Wird in Phase 4 durch einen 3D-Würfel
// (react-three-fiber) ersetzt. Bewusst dumme Präsentationskomponente.

import type { RolledDie } from '../engine';
import { DIE_COLORS, DIE_LABELS } from './colors';

interface DieProps {
  die: RolledDie;
}

export function Die({ die }: DieProps) {
  const label = `${DIE_LABELS[die.color]} W${die.sides}${
    die.variant === 'glitter' ? ' ✨' : ''
  }`;
  return (
    <div
      className="die"
      style={{ background: DIE_COLORS[die.color] }}
      title={label}
      aria-label={`${label}: ${die.value}`}
    >
      <span className="die__value">{die.value}</span>
    </div>
  );
}

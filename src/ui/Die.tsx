// CSS-Platzhalter-Würfel (Phase 0/2). Wird in Phase 4 durch einen 3D-Würfel
// (react-three-fiber) ersetzt. Bewusst dumme Präsentationskomponente.

import type { RolledDie } from '../engine';
import { DIE_COLORS, DIE_LABELS } from './colors';

interface DieProps {
  die: RolledDie;
  /** Markiert (z. B. zum Tausch ausgewählt). */
  selected?: boolean;
  /** Als Mitleidswürfel hervorheben. */
  pity?: boolean;
  /** Klickbar machen (z. B. Klar-Würfel in der Swap-Phase). */
  onClick?: () => void;
}

export function Die({ die, selected, pity, onClick }: DieProps) {
  const label = `${DIE_LABELS[die.color]} W${die.sides}${
    die.variant === 'glitter' ? ' ✨' : ''
  }`;
  const className = [
    'die',
    selected ? 'die--selected' : '',
    pity ? 'die--pity' : '',
    onClick ? 'die--clickable' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      <span className="die__value">{die.value}</span>
      {pity && <span className="die__tag">Mitleid</span>}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        className={className}
        style={{ background: DIE_COLORS[die.color] }}
        title={label}
        aria-pressed={selected}
        aria-label={`${label}: ${die.value}`}
        onClick={onClick}
      >
        {content}
      </button>
    );
  }

  return (
    <div
      className={className}
      style={{ background: DIE_COLORS[die.color] }}
      title={label}
      aria-label={`${label}: ${die.value}`}
    >
      {content}
    </div>
  );
}

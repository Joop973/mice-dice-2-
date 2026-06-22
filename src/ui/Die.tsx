// CSS-Platzhalter-Würfel (Phase 0/2). Wird in Phase 4 durch einen 3D-Würfel
// (react-three-fiber) ersetzt. Bewusst dumme Präsentationskomponente.

import type { CSSProperties } from 'react';
import type { RolledDie } from '../engine';
import { DIE_COLORS, DIE_LABELS } from './colors';
import { pipsFor } from './dicePips';
import { THEME, luminance } from './theme';

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
    die.variant === 'glitter' ? ' Glitzer' : ''
  }`;
  const className = [
    'die',
    selected ? 'die--selected' : '',
    pity ? 'die--pity' : '',
    onClick ? 'die--clickable' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const bg = DIE_COLORS[die.color];
  // Augen-/Zahlfarbe je nach Helligkeit des Würfels (Kontrast).
  const fg = luminance(bg) > 0.5 ? THEME.wood900 : THEME.cream100;
  const pips = pipsFor(die.value);
  const style = { background: bg, color: fg } as CSSProperties;

  const content = (
    <>
      {pips ? (
        <span className="die__pips" aria-hidden="true">
          {Array.from({ length: 9 }, (_, i) => (
            <span key={i} className={pips.includes(i) ? 'pip pip--on' : 'pip'} />
          ))}
        </span>
      ) : (
        <span className="die__value">{die.value}</span>
      )}
      {pity && <span className="die__tag">Mitleid</span>}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        className={className}
        style={style}
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
    <div className={className} style={style} title={label} aria-label={`${label}: ${die.value}`}>
      {content}
    </div>
  );
}

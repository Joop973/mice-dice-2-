// CSS-Platzhalter-Würfel (Phase 0/2). Wird in Phase 4 durch einen 3D-Würfel
// (react-three-fiber) ersetzt. Bewusst dumme Präsentationskomponente.

import type { RolledDie } from '../engine';
import { DIE_COLORS, DIE_GLYPHS, DIE_LABELS } from './colors';
import { PIP_LAYOUT, hasPips, pipColor } from './dicePips';
import { useSettings } from './useSettings';

interface DieProps {
  die: RolledDie;
  /** Markiert (z. B. zum Tausch ausgewählt). */
  selected?: boolean;
  /** Als Mitleidswürfel hervorheben. */
  pity?: boolean;
  /** Klickbar machen (z. B. Klar-Würfel in der Swap-Phase). */
  onClick?: () => void;
}

/** Echte Augen (Pips) als kleines SVG, passend zur 3D-Würfelseite. */
function Pips({ value, color }: { value: number; color: string }) {
  const fg = pipColor(color);
  return (
    <svg className="die__pips" viewBox="0 0 48 48" aria-hidden="true">
      {PIP_LAYOUT[value].map(([gx, gy], i) => (
        <circle key={i} cx={12 + gx * 12} cy={12 + gy * 12} r={4.5} fill={fg} />
      ))}
    </svg>
  );
}

export function Die({ die, selected, pity, onClick }: DieProps) {
  const { colorblind } = useSettings();
  const label = `${DIE_LABELS[die.color]} W${die.sides}${
    die.variant === 'glitter' ? ' ✨' : ''
  }`;
  const className = [
    'die',
    selected ? 'die--selected' : '',
    pity ? 'die--pity' : '',
    die.variant === 'glitter' ? 'die--glitter' : '',
    onClick ? 'die--clickable' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      {colorblind && (
        <span className="die__glyph" aria-hidden="true">
          {DIE_GLYPHS[die.color]}
        </span>
      )}
      {hasPips(die.value) ? (
        <Pips value={die.value} color={DIE_COLORS[die.color]} />
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

// Ein Würfel im Draft-Angebot mit Kurzbeschreibung als Tooltip.
// Die Beschreibung erscheint beim Drüberfahren (Maus) und beim langen Drücken
// (Touch). Ein langer Druck löst KEINEN Pick aus – er zeigt nur die Info.

import { useRef, useState, type CSSProperties } from 'react';
import type { DieColor, DieVariant } from '../engine';
import { DIE_COLORS, DIE_DESCRIPTIONS, DIE_LABELS } from './colors';
import { luminance, THEME } from './theme';
import { PixelIcon } from './PixelIcon';

const LONG_PRESS_MS = 450;
const TOOLTIP_AUTO_HIDE_MS = 2600;

interface OfferButtonProps {
  color: DieColor;
  sides: number;
  variant: DieVariant;
  disabled?: boolean;
  onPick: () => void;
}

export function OfferButton({ color, sides, variant, disabled, onPick }: OfferButtonProps) {
  const [open, setOpen] = useState(false);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const longPressed = useRef(false);
  const desc = DIE_DESCRIPTIONS[color];

  function show() {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setOpen(true);
  }

  function hide() {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setOpen(false);
  }

  function startPress() {
    longPressed.current = false;
    pressTimer.current = setTimeout(() => {
      longPressed.current = true;
      show();
      // Auf Touch-Geräten nach kurzer Zeit selbst wieder ausblenden.
      hideTimer.current = setTimeout(() => setOpen(false), TOOLTIP_AUTO_HIDE_MS);
    }, LONG_PRESS_MS);
  }

  function endPress() {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  }

  function handleClick() {
    // Ein langer Druck (Info-Anzeige) darf den Würfel nicht versehentlich wählen.
    if (longPressed.current) {
      longPressed.current = false;
      return;
    }
    onPick();
  }

  return (
    <span className="offer-wrap">
      <button
        type="button"
        className="offer offer--3d"
        title={desc}
        aria-label={`${DIE_LABELS[color]} W${sides} – ${desc}`}
        style={
          {
            borderColor: DIE_COLORS[color],
            ['--die']: DIE_COLORS[color],
            ['--pip']: luminance(DIE_COLORS[color]) > 0.5 ? THEME.wood900 : THEME.cream100,
          } as CSSProperties
        }
        disabled={disabled}
        onClick={handleClick}
        onMouseEnter={show}
        onMouseLeave={hide}
        onTouchStart={startPress}
        onTouchEnd={endPress}
        onTouchMove={endPress}
        onTouchCancel={endPress}
      >
        <span className="offer__cube" aria-hidden="true">
          {/* Safari-sicher: ein einzelner, leicht kippender Würfel mit Seitenzahl. */}
          <span className="offer__die">{sides}</span>
        </span>
        <span className="offer__label">
          {DIE_LABELS[color]} W{sides}
          {variant === 'glitter' && (
            <>
              {' '}
              <PixelIcon name="sparkle" title="Glitzer" />
            </>
          )}
        </span>
      </button>
      {open && (
        <span className="offer__tip" role="tooltip">
          {desc}
        </span>
      )}
    </span>
  );
}

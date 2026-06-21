// Lässt die Käse-Krone sichtbar vom alten zum neuen Halter fliegen, wenn sich der
// Kronenwechsel ereignet. Rendert selbst nichts; die ruhende Krone zeigt
// PlayerCard beim aktuellen Halter. No-op ohne Layout/WAAPI/reduced-motion.

import { useEffect } from 'react';
import { flyToken, playerRect } from './fx/flyToken';
import type { CrownMove } from './gameEvents';
import { CROWN_SRC } from './avatarArt';

const CROWN_HTML = CROWN_SRC ? `<img src="${CROWN_SRC}" width="38" height="38" alt="">` : '👑';

export function CrownToken({ move }: { move: CrownMove | null }) {
  useEffect(() => {
    if (!move) return;
    const to = playerRect(move.to);
    const from = move.from ? playerRect(move.from) : to;
    flyToken({
      from,
      to,
      html: CROWN_HTML,
      size: 38,
      durationMs: 700,
      className: 'fly-token--crown',
    });
  }, [move]);
  return null;
}

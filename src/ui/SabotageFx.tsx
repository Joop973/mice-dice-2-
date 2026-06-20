// Sabotage-Angriff: wirft pro Saboteur ein „Knabber"-Token (Käsebiss) zum
// Kronenhalter. Der Warn-Shake des Opfers kommt bereits über fx.warnNow.
// No-op ohne Layout/WAAPI/reduced-motion.

import { useEffect } from 'react';
import { flyToken, playerRect } from './fx/flyToken';
import type { SabotageMove } from './gameEvents';

export function SabotageFx({ moves }: { moves: SabotageMove[] }) {
  useEffect(() => {
    if (!moves || moves.length === 0) return;
    for (const m of moves) {
      flyToken({
        from: playerRect(m.from),
        to: playerRect(m.to),
        html: '🧀',
        size: 28,
        durationMs: 600,
        className: 'fly-token--nibble',
      });
    }
  }, [moves]);
  return null;
}

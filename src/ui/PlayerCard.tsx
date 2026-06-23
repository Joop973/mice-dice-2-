// Spieler-Karte: Kopf (Krone, Name, Punkte) + Würfelreihe (2D oder 3D).
// In der Swap-Phase sind Klar-Würfel klickbar (Auswahl zum Neu-Würfeln).

import type { CSSProperties } from 'react';
import type { Player } from '../engine';
import { DiceView } from './DiceView';
import { AnimatedNumber } from './AnimatedNumber';
import { PixelIcon } from './PixelIcon';
import { MouseAvatar } from './MouseAvatar';
import { playerColor } from './colors';

interface PlayerCardProps {
  player: Player;
  /** Sitz-/Spieler-Index für die Avatar-Farbe (aus colors.ts). */
  colorIndex: number;
  /** 3D-Würfel statt CSS-Platzhalter rendern. */
  use3d: boolean;
  /** Hebt den Spieler hervor (z. B. „ist gerade am Zug" beim Draften). */
  active?: boolean;
  /** Spieler hat gerade die Krone gewonnen (Puls-Animation). */
  crowned?: boolean;
  /** Spieler hat gerade eine Negativ-Wertung kassiert (Warn-Shake). */
  warn?: boolean;
  /** IDs der zum Tausch ausgewählten Klar-Würfel. */
  selectedDieIds?: Set<string>;
  /** Callback, wenn ein Klar-Würfel an-/abgewählt wird (nur Swap-Phase). */
  onToggleClear?: (dieId: string) => void;
}

export function PlayerCard({
  player,
  colorIndex,
  use3d,
  active,
  crowned,
  warn,
  selectedDieIds,
  onToggleClear,
}: PlayerCardProps) {
  const className = [
    'player',
    active ? 'player--active' : '',
    crowned ? 'player--crowned' : '',
    warn ? 'player--warn' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const style = { '--player': playerColor(colorIndex) } as CSSProperties;

  return (
    <article className={className} style={style}>
      <header className="player__head">
        <span className="player__name">
          <span className="player__avatar">
            <MouseAvatar colorIndex={colorIndex} size={40} title={`Maus von ${player.name}`} />
          </span>{' '}
          {player.hasCrown && (
            <span className="player__crown">
              <PixelIcon name="crown" title="Käse-Krone" />
            </span>
          )}
          {player.name}
          {player.isAI && (
            <>
              {' '}
              <PixelIcon name="ai" title="KI-Gegner" />
            </>
          )}
        </span>
        <span className="player__score">
          <AnimatedNumber value={player.totalScore} />
          {player.roundScore !== 0 && (
            <em>
              {' '}
              ({player.roundScore > 0 ? '+' : ''}
              {player.roundScore})
            </em>
          )}
        </span>
      </header>
      <DiceView
        dice={player.rolled}
        use3d={use3d}
        selectedDieIds={selectedDieIds}
        onToggleClear={onToggleClear}
      />
    </article>
  );
}

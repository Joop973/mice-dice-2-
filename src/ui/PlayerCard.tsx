// Spieler-Karte: Kopf (Krone, Name, Punkte) + Würfelreihe (2D oder 3D).
// In der Swap-Phase sind Klar-Würfel klickbar (Auswahl zum Neu-Würfeln).

import type { Player } from '../engine';
import { DiceView } from './DiceView';

interface PlayerCardProps {
  player: Player;
  /** 3D-Würfel statt CSS-Platzhalter rendern. */
  use3d: boolean;
  /** Hebt den Spieler hervor (z. B. „ist gerade am Zug" beim Draften). */
  active?: boolean;
  /** IDs der zum Tausch ausgewählten Klar-Würfel. */
  selectedDieIds?: Set<string>;
  /** Callback, wenn ein Klar-Würfel an-/abgewählt wird (nur Swap-Phase). */
  onToggleClear?: (dieId: string) => void;
}

export function PlayerCard({
  player,
  use3d,
  active,
  selectedDieIds,
  onToggleClear,
}: PlayerCardProps) {
  return (
    <article className={`player${active ? ' player--active' : ''}`}>
      <header className="player__head">
        <span className="player__name">
          {player.hasCrown ? '👑 ' : ''}
          {player.name}
          {player.isAI ? ' 🤖' : ''}
        </span>
        <span className="player__score">
          {player.totalScore}
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

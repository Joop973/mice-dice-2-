// Spieler-Karte: Kopf (Krone, Name, Punkte) + Würfelreihe.
// In der Swap-Phase sind Klar-Würfel klickbar (Auswahl zum Neu-Würfeln).

import type { Player } from '../engine';
import { Die } from './Die';

interface PlayerCardProps {
  player: Player;
  /** Hebt den Spieler hervor (z. B. „ist gerade am Zug" beim Draften). */
  active?: boolean;
  /** IDs der zum Tausch ausgewählten Klar-Würfel. */
  selectedDieIds?: Set<string>;
  /** Callback, wenn ein Klar-Würfel an-/abgewählt wird (nur Swap-Phase). */
  onToggleClear?: (dieId: string) => void;
}

export function PlayerCard({
  player,
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
      <div className="dice">
        {player.rolled.length === 0 && (
          <span className="dice__empty">noch nicht gewürfelt</span>
        )}
        {player.rolled.map((d) => {
          const clickable = onToggleClear && d.color === 'clear';
          return (
            <Die
              key={d.id}
              die={d}
              pity={d.isPity}
              selected={selectedDieIds?.has(d.id)}
              onClick={clickable ? () => onToggleClear!(d.id) : undefined}
            />
          );
        })}
      </div>
    </article>
  );
}

// Siegerehrung: Podest mit den drei besten Mäusen (Avatar-Figuren), Pokal/Käse
// für die Gewinner-Maus, darunter die vollständige Rangliste. Geteilt lokal/online.

import type { Player } from '../engine';
import { MouseAvatar } from './MouseAvatar';
import { playerIndex } from './colors';

export function Podium({
  players,
  actionLabel,
  onAction,
}: {
  players: Player[];
  actionLabel: string;
  onAction: () => void;
}) {
  const ranked = [...players].sort((a, b) => b.totalScore - a.totalScore);
  const top3 = ranked.slice(0, 3);
  // Visuelle Podest-Reihenfolge: 2. – 1. – 3.
  const order = [top3[1], top3[0], top3[2]].filter(Boolean) as Player[];

  return (
    <section className="podium">
      <h2 className="podium__title">🏆 Siegerehrung</h2>
      <div className="podium__row">
        {order.map((p) => {
          const rank = ranked.indexOf(p) + 1;
          return (
            <div key={p.id} className={`podium__col podium__col--${rank}`}>
              {rank === 1 && (
                <span className="podium__crown" aria-hidden="true">
                  🧀👑
                </span>
              )}
              <MouseAvatar
                colorIndex={playerIndex(p.id)}
                size={rank === 1 ? 56 : 44}
                state={rank === 1 ? 'winning' : 'idle'}
                isAI={p.isAI}
              />
              <span className="podium__name">{p.name}</span>
              <div className="podium__block">
                <span className="podium__rank">{rank}</span>
                <span className="podium__score">{p.totalScore}</span>
              </div>
            </div>
          );
        })}
      </div>

      <ol className="standings">
        {ranked.map((p) => (
          <li key={p.id}>
            {p.name}: {p.totalScore}
          </li>
        ))}
      </ol>

      <button onClick={onAction}>{actionLabel}</button>
    </section>
  );
}

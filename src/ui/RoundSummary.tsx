// Rundenauswertung: macht die (von der Engine berechnete) Aufschlüsselung
// sichtbar – wie jeder Spieler in der gerade gewerteten Runde zu seinen Punkten
// kam (Farb-Beiträge, Sabotage, Krone). Reine Präsentationskomponente.

import type { Player, ScoreBreakdown, ScoreContributions } from '../engine';
import { DIE_COLORS, DIE_LABELS } from './colors';

const ORDER: (keyof ScoreContributions)[] = [
  'yellow',
  'green',
  'blue',
  'purple',
  'pink',
  'red',
  'clear',
  'orange',
  'brown',
];

export function RoundSummary({
  scores,
  players,
}: {
  scores: ScoreBreakdown[];
  players: Player[];
}) {
  const nameById = new Map(players.map((p) => [p.id, p.name]));

  return (
    <section className="panel summary">
      <h2>Rundenauswertung</h2>
      <ul className="summary__list">
        {scores.map((s) => {
          const parts = ORDER.filter((c) => s.contributions[c] !== 0);
          return (
            <li key={s.playerId} className="summary__row">
              <div className="summary__head">
                <span className="summary__name">
                  {s.hasCrown ? '👑 ' : ''}
                  {nameById.get(s.playerId) ?? s.playerId}
                </span>
                <strong className={s.final < 0 ? 'summary__final neg' : 'summary__final'}>
                  {s.final > 0 ? '+' : ''}
                  {s.final}
                </strong>
              </div>
              <div className="summary__chips">
                {parts.length === 0 && s.sabotageReceived === 0 && (
                  <span className="muted">keine Basis-Punkte</span>
                )}
                {parts.map((c) => (
                  <span key={c} className="chip" style={{ borderColor: DIE_COLORS[c] }}>
                    {DIE_LABELS[c]} {s.contributions[c] > 0 ? '+' : ''}
                    {s.contributions[c]}
                  </span>
                ))}
                {s.sabotageReceived > 0 && (
                  <span className="chip chip--bad">Sabotage −{s.sabotageReceived}</span>
                )}
                {s.sabotageThrown > 0 && (
                  <span className="chip chip--throw">wirft Sabotage {s.sabotageThrown}</span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

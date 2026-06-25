// Rundenauswertung: zeigt pro Maus die tatsächlich geworfenen Würfel als kleine
// Würfel-Sprites (Farbe + Zahl) plus Krone/Sabotage und die Rundenpunkte.
// Reine Präsentationskomponente.

import type { CSSProperties } from 'react';
import type { Player, ScoreBreakdown } from '../engine';
import { DIE_COLORS } from './colors';
import { luminance, THEME } from './theme';
import { PixelIcon } from './PixelIcon';

export function RoundSummary({ scores, players }: { scores: ScoreBreakdown[]; players: Player[] }) {
  const byId = new Map(players.map((p) => [p.id, p]));

  return (
    <section className="panel summary">
      <h2>Rundenauswertung</h2>
      <ul className="summary__list">
        {scores.map((s) => {
          const p = byId.get(s.playerId);
          const dice = p?.rolled ?? [];
          return (
            <li key={s.playerId} className="summary__row">
              <div className="summary__head">
                <span className="summary__name">
                  {s.hasCrown && (
                    <>
                      <PixelIcon name="crown" title="Käse-Krone" />{' '}
                    </>
                  )}
                  {p?.name ?? s.playerId}
                </span>
                <strong className={s.final < 0 ? 'summary__final neg' : 'summary__final'}>
                  {s.final > 0 ? '+' : ''}
                  {s.final}
                </strong>
              </div>
              <div className="summary__dice">
                {dice.length === 0 && <span className="muted">keine Würfel</span>}
                {dice.map((d) => (
                  <span
                    key={d.id}
                    className={`die-chip${d.isPity ? ' die-chip--pity' : ''}`}
                    title={d.color}
                    style={
                      {
                        ['--die']: DIE_COLORS[d.color],
                        color: luminance(DIE_COLORS[d.color]) > 0.5 ? THEME.wood900 : THEME.cream100,
                      } as CSSProperties
                    }
                  >
                    {d.value}
                  </span>
                ))}
                {s.crownBonus > 0 && (
                  <span className="chip chip--crown">
                    <PixelIcon name="crown" title="Krone" /> +{s.crownBonus}
                  </span>
                )}
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

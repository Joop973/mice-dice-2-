// Sieger-/End-Screen, geteilt von lokalem Spiel (App) und Online (OnlineFlow).
// Vorher als fast identischer Block dupliziert (Code-Audit #3). Der einzige
// Unterschied ist die Abschluss-Aktion (neue Partie vs. zurück zum Menü).

import type { CSSProperties } from 'react';
import type { Player } from '../engine';
import { PixelIcon } from './PixelIcon';

interface WinScreenProps {
  players: Player[];
  /** Beschriftung des Abschluss-Knopfs (z. B. „Neue Partie"). */
  actionLabel: string;
  onAction: () => void;
}

export function WinScreen({ players, actionLabel, onAction }: WinScreenProps) {
  const leader = players.reduce((best, p) => (p.totalScore > best.totalScore ? p : best));
  const ranked = [...players].sort((a, b) => b.totalScore - a.totalScore);

  return (
    <div className="app">
      <div className="confetti" aria-hidden="true">
        {Array.from({ length: 14 }, (_, i) => (
          <span key={i} style={{ '--i': i } as CSSProperties} />
        ))}
      </div>
      <header className="app__header">
        <h1>
          <PixelIcon name="cheese" size={28} title="Dice Mice" /> Dice Mice
        </h1>
      </header>
      <section className="panel panel--win">
        <h2>
          Partie beendet <PixelIcon name="trophy" size={22} title="" />
        </h2>
        <p>
          Sieger: <strong>{leader.name}</strong> mit {leader.totalScore} Punkten.
        </p>
        <ol className="standings">
          {ranked.map((p) => (
            <li key={p.id}>
              {p.name}: {p.totalScore}
            </li>
          ))}
        </ol>
        <button onClick={onAction}>{actionLabel}</button>
      </section>
    </div>
  );
}

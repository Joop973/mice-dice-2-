// Statistik-Bildschirm: zeigt aggregierte lokale Werte + die letzten Ergebnisse.

import { clearStats, loadStats } from './stats';

export function StatsPanel({ onBack }: { onBack: () => void }) {
  const stats = loadStats();
  const wins = stats.rankCounts[0] ?? 0;
  const winRate = stats.gamesPlayed > 0 ? Math.round((wins / stats.gamesPlayed) * 100) : 0;

  return (
    <div className="app">
      <header className="app__header">
        <h1>🧀 Dice Mice</h1>
        <p className="hint">Statistik (dieses Gerät)</p>
      </header>

      <section className="panel">
        {stats.gamesPlayed === 0 ? (
          <p className="muted">Noch keine beendete Partie gespielt.</p>
        ) : (
          <>
            <div className="stats__grid">
              <div className="stats__cell">
                <span className="stats__num">{stats.gamesPlayed}</span>
                <span className="stats__cap">Partien</span>
              </div>
              <div className="stats__cell">
                <span className="stats__num">{wins}</span>
                <span className="stats__cap">Siege</span>
              </div>
              <div className="stats__cell">
                <span className="stats__num">{winRate}%</span>
                <span className="stats__cap">Siegquote</span>
              </div>
              <div className="stats__cell">
                <span className="stats__num">{stats.highScore}</span>
                <span className="stats__cap">Highscore</span>
              </div>
            </div>

            <h2>Letzte Partien</h2>
            <ol className="standings">
              {stats.lastResults.map((r, i) => (
                <li key={i}>
                  Platz {r.rank}/{r.players} · {r.score} Punkte
                </li>
              ))}
            </ol>
          </>
        )}
      </section>

      <div className="actions">
        <button className="ghost" onClick={onBack}>
          ← Zurück
        </button>
        {stats.gamesPlayed > 0 && (
          <button
            className="ghost"
            onClick={() => {
              clearStats();
              onBack();
            }}
          >
            Zurücksetzen
          </button>
        )}
      </div>
    </div>
  );
}

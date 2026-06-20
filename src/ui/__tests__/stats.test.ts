// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { startGame, type GameState } from '../../engine';
import { clearStats, loadStats, recordGame } from '../stats';

afterEach(() => clearStats());

/** Beendete Partie mit gesetzten Gesamtpunkten (p0 = Mensch, p1 = KI). */
function finished(scores: number[]): GameState {
  const base = startGame({ players: [{ name: 'A' }, { name: 'B', isAI: true }], seed: 1 }).state;
  return {
    ...base,
    finished: true,
    players: base.players.map((p, i) => ({ ...p, totalScore: scores[i] })),
  };
}

describe('stats', () => {
  it('verbucht Partien und aggregiert Platzierungen/Highscore', () => {
    recordGame(finished([30, 10])); // p0 Platz 1
    recordGame(finished([5, 40])); // p0 Platz 2
    const s = loadStats();
    expect(s.gamesPlayed).toBe(2);
    expect(s.rankCounts[0]).toBe(1);
    expect(s.rankCounts[1]).toBe(1);
    expect(s.highScore).toBe(30);
    expect(s.lastResults).toHaveLength(2);
  });

  it('begrenzt die letzten Ergebnisse auf 10', () => {
    for (let i = 0; i < 12; i++) recordGame(finished([i, 0]));
    expect(loadStats().lastResults).toHaveLength(10);
  });

  it('ignoriert nicht beendete Partien', () => {
    const running = startGame({ players: [{ name: 'A' }, { name: 'B' }], seed: 1 }).state;
    recordGame(running);
    expect(loadStats().gamesPlayed).toBe(0);
  });
});

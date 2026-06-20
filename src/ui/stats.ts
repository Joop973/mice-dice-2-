// Einfache lokale Statistik (aggregiert, keine Profile – Pass-and-Play hat
// Ad-hoc-Namen). Muster wie persistence.ts: versioniert, jsdom-/Privatmodus-sicher.
// Gewertet wird der erste menschliche Sitz (p0) der beendeten Partie.

import type { GameState } from '../engine';

const KEY = 'dicemice.stats';
const VERSION = 1;
const MAX_RESULTS = 10;

export interface GameResult {
  date: number;
  rank: number;
  score: number;
  players: number;
}

export interface Stats {
  version: number;
  gamesPlayed: number;
  /** rankCounts[r-1] = wie oft Platz r erreicht. */
  rankCounts: number[];
  highScore: number;
  lastResults: GameResult[];
}

function empty(): Stats {
  return { version: VERSION, gamesPlayed: 0, rankCounts: [], highScore: 0, lastResults: [] };
}

export function loadStats(): Stats {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    const parsed = JSON.parse(raw) as Stats;
    if (parsed.version !== VERSION) return empty();
    return parsed;
  } catch {
    return empty();
  }
}

export function clearStats(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignorieren
  }
}

/** Verbucht eine beendete Partie (Sicht des ersten Menschen, Sitz p0). */
export function recordGame(state: GameState): void {
  if (!state.finished || state.players.length === 0) return;
  const me = state.players.find((p) => !p.isAI) ?? state.players[0];
  const sorted = [...state.players].sort((a, b) => b.totalScore - a.totalScore);
  const rank = sorted.findIndex((p) => p.id === me.id) + 1;

  const stats = loadStats();
  stats.gamesPlayed += 1;
  stats.rankCounts[rank - 1] = (stats.rankCounts[rank - 1] ?? 0) + 1;
  stats.highScore = Math.max(stats.highScore, me.totalScore);
  stats.lastResults.unshift({
    date: Date.now(),
    rank,
    score: me.totalScore,
    players: state.players.length,
  });
  stats.lastResults = stats.lastResults.slice(0, MAX_RESULTS);

  try {
    localStorage.setItem(KEY, JSON.stringify(stats));
  } catch {
    // Speicher voll / Privatmodus – Statistik ist „nice to have".
  }
}

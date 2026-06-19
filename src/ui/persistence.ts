// Persistenz der laufenden LOKALEN Partie (Solo / Pass-and-Play) im
// localStorage, damit ein Seiten-Reload das Spiel nicht verliert.
//
// Online-Partien werden NICHT hier gespeichert – dort hält der Server den
// maßgeblichen Zustand. Der RNG (stateful) wird bewusst nicht serialisiert; beim
// Fortsetzen genügt ein frischer Zufallsstrom für künftige Würfe.

import type { GameState } from '../engine';
import type { Difficulty } from '../ai';

const KEY = 'dicemice.localgame';
const VERSION = 1;

export interface SavedGame {
  version: number;
  state: GameState;
  humans: number;
  ais: number;
  difficulty: Difficulty;
}

export function saveLocalGame(data: Omit<SavedGame, 'version'>): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ version: VERSION, ...data }));
  } catch {
    // Speicher voll / Privatmodus – Persistenz ist nur „nice to have".
  }
}

export function loadLocalGame(): SavedGame | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedGame;
    if (parsed.version !== VERSION || !parsed.state || parsed.state.finished) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearLocalGame(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignorieren
  }
}

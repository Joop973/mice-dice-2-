// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { startGame } from '../../engine';
import { clearLocalGame, loadLocalGame, saveLocalGame } from '../persistence';

afterEach(() => clearLocalGame());

function freshState() {
  return startGame({ players: [{ name: 'A' }, { name: 'B' }], seed: 1 }).state;
}

describe('Persistenz der lokalen Partie', () => {
  it('speichert und lädt eine laufende Partie verlustfrei', () => {
    const state = freshState();
    saveLocalGame({ state, humans: 1, ais: 1, difficulty: 'hard' });

    const loaded = loadLocalGame();
    expect(loaded).not.toBeNull();
    expect(loaded!.difficulty).toBe('hard');
    expect(loaded!.state.round).toBe(state.round);
    expect(loaded!.state.players).toHaveLength(2);
  });

  it('gibt nichts zurück, wenn nichts gespeichert ist', () => {
    expect(loadLocalGame()).toBeNull();
  });

  it('verwirft eine beendete Partie beim Laden', () => {
    const state = { ...freshState(), finished: true };
    saveLocalGame({ state, humans: 2, ais: 0, difficulty: 'medium' });
    expect(loadLocalGame()).toBeNull();
  });

  it('clear entfernt den Speicher', () => {
    saveLocalGame({ state: freshState(), humans: 1, ais: 1, difficulty: 'easy' });
    clearLocalGame();
    expect(loadLocalGame()).toBeNull();
  });
});

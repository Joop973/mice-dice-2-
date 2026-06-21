// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { App } from '../../App';
import { startGame } from '../../engine';
import { clearLocalGame, saveLocalGame } from '../persistence';

afterEach(() => {
  cleanup();
  clearLocalGame();
});

describe('App-Menü', () => {
  it('öffnet die Spielregeln und kehrt zurück', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Spielregeln'));
    expect(screen.getByText('Würfel & Wertung')).toBeTruthy();
    fireEvent.click(screen.getByText('← Zurück'));
    expect(screen.getByText('Solo / Pass-and-Play')).toBeTruthy();
  });

  it('zeigt „Fortsetzen" nur, wenn eine Partie gespeichert ist', () => {
    expect(render(<App />).queryByText(/fortsetzen/i)).toBeNull();
    cleanup();

    const state = startGame({ players: [{ name: 'A' }, { name: 'B' }], seed: 3 }).state;
    saveLocalGame({ state, humans: 2, ais: 0, difficulty: 'medium' });

    render(<App />);
    expect(screen.getByText(/Partie fortsetzen/)).toBeTruthy();
  });
});

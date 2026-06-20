// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { OnlineFlow } from '../OnlineFlow';

// Verifiziert die Online-UI-Verdrahtung end-to-end über den In-Process-Loopback
// (kein Server, kein Mock): Verbinden -> Lobby -> Start -> Host-Aktion. Der
// autoritative Kern (src/net) liefert dabei echte Zustände.

afterEach(cleanup);

describe('OnlineFlow (Loopback)', () => {
  it('führt von Raum erstellen über die Lobby ins laufende Spiel und schaltet weiter', () => {
    render(<OnlineFlow onBack={() => {}} />);

    // 1) Verbinden: Standardname „Maus", Server-URL leer -> LocalTransport.
    fireEvent.click(screen.getByText('Raum erstellen →'));

    // 2) Lobby erscheint mit Sitzliste (Host + 1 KI) und Start-Knopf.
    expect(screen.getByText('🧀 Lobby')).toBeTruthy();
    expect(screen.getByText(/\(du\)/)).toBeTruthy();
    const startBtn = screen.getByText('Partie starten →') as HTMLButtonElement;
    expect(startBtn.disabled).toBe(false);

    // 3) Start -> Spielbrett, Phase „Würfeln", Host sieht „Weiter".
    fireEvent.click(startBtn);
    expect(screen.getByText('1 · Würfeln')).toBeTruthy();
    const weiter = screen.getByText('Weiter →');

    // 4) Host schaltet weiter -> Phase wechselt zu „Mitleidswürfel".
    fireEvent.click(weiter);
    expect(screen.getByText('2 · Mitleidswürfel')).toBeTruthy();
  });

  it('zeigt einen Hinweis, dass Beitreten ohne Server nicht geht', () => {
    render(<OnlineFlow onBack={() => {}} />);
    fireEvent.click(screen.getByText('Beitreten'));
    expect(screen.getByText(/benötigt einen laufenden Server/)).toBeTruthy();
  });
});

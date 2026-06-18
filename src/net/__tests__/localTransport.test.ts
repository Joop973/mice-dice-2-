import { describe, expect, it } from 'vitest';
import { LocalTransport } from '../LocalTransport';
import type { GameState } from '../../engine';
import type { ServerMessage } from '../protocol';

// Treibt den Online-Code-Pfad rein lokal (ohne Server) und prüft, dass die
// autoritative Schicht über den Transport eine ganze Partie hindurch konsistente
// Zustände liefert.

function collect(t: LocalTransport): { msgs: ServerMessage[]; lastState: () => GameState | null } {
  const msgs: ServerMessage[] = [];
  t.onMessage((m) => msgs.push(m));
  return {
    msgs,
    lastState: () => {
      for (let i = msgs.length - 1; i >= 0; i--) {
        if (msgs[i].kind === 'state') return (msgs[i] as { state: GameState }).state;
      }
      return null;
    },
  };
}

describe('LocalTransport', () => {
  it('erzeugt Raum, startet und liefert welcome + lobby + state', () => {
    const t = new LocalTransport();
    const { msgs, lastState } = collect(t);

    t.send({ kind: 'create', name: 'Anna', ais: 1, difficulty: 'easy' });
    t.send({ kind: 'start' });

    expect(msgs.some((m) => m.kind === 'welcome')).toBe(true);
    expect(msgs.some((m) => m.kind === 'lobby')).toBe(true);
    expect(lastState()?.phase).toBe('roll');
    t.close();
  });

  it('meldet einen Fehler bei Aktion ohne Raum', () => {
    const t = new LocalTransport();
    const { msgs } = collect(t);
    t.send({ kind: 'action', action: { type: 'advance' } });
    expect(msgs[msgs.length - 1]).toMatchObject({ kind: 'error' });
    t.close();
  });

  it('spielt eine komplette Partie (Host treibt) bis finished', () => {
    const t = new LocalTransport();
    const { lastState } = collect(t);
    t.send({ kind: 'create', name: 'Anna', ais: 1, difficulty: 'medium' });
    t.send({ kind: 'start' });

    // Host schaltet wiederholt weiter; im Draft nimmt der Host das erste Angebot.
    for (let i = 0; i < 200; i++) {
      const s = lastState();
      if (!s || s.finished) break;
      if (s.phase === 'draft') {
        const active = s.players.find((p) => !s.draftedThisPhase.includes(p.id));
        if (active?.id === 'p0') {
          const offerId = s.draftOffers[0]?.id;
          t.send({ kind: 'action', action: { type: 'draftPick', offerId } });
          continue;
        }
      }
      t.send({ kind: 'action', action: { type: 'advance' } });
    }

    const final = lastState();
    expect(final?.finished).toBe(true);
    expect(final?.round).toBe(final?.config.totalRounds);
    t.close();
  });
});

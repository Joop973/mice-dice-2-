// Minimaler, aber lauffähiger UI-Treiber für die Engine (Phase 0/2-Anfang).
// Demonstriert die strikte Trennung: die UI hält nur GameState + RNG und ruft
// reine Engine-Funktionen auf. Würfel sind CSS-Platzhalter (Phase 4 -> 3D).

import { useMemo, useRef, useState } from 'react';
import {
  advancePhase,
  createRNG,
  draftPick,
  performRoll,
  startGame,
  type GameState,
  type Phase,
  type RNG,
} from './engine';
import { Die } from './ui/Die';
import { DIE_COLORS, DIE_LABELS } from './ui/colors';

const PHASE_LABEL: Record<Phase, string> = {
  roll: '1 · Würfeln',
  pity: '2 · Mitleidswürfel',
  swap: '3 · Klar tauschen',
  draft: '4 · Drafting',
};

const DEFAULT_PLAYERS = [{ name: 'Maus 1' }, { name: 'Maus 2', isAI: true }];

export function App() {
  const rngRef = useRef<RNG>(createRNG(Date.now() >>> 0));
  const [state, setState] = useState<GameState>(() => {
    const seed = Date.now() >>> 0;
    rngRef.current = createRNG(seed);
    return performRoll(
      // startGame erzeugt einen eigenen RNG; hier teilen wir bewusst einen RNG,
      // damit Folgeaktionen denselben Strom nutzen.
      startGame({ players: DEFAULT_PLAYERS, seed }).state,
      rngRef.current
    );
  });

  const leader = useMemo(
    () =>
      state.players.reduce((best, p) =>
        p.totalScore > best.totalScore ? p : best
      ),
    [state.players]
  );

  function newGame() {
    const seed = Date.now() >>> 0;
    rngRef.current = createRNG(seed);
    setState(performRoll(startGame({ players: DEFAULT_PLAYERS, seed }).state, rngRef.current));
  }

  return (
    <div className="app">
      <header className="app__header">
        <h1>🧀 Dice Mice</h1>
        <div className="app__meta">
          <span>
            Runde {state.round} / {state.config.totalRounds}
          </span>
          <span className="badge">{PHASE_LABEL[state.phase]}</span>
        </div>
      </header>

      {state.finished ? (
        <section className="panel">
          <h2>Partie beendet</h2>
          <p>
            Sieger: <strong>{leader.name}</strong> mit {leader.totalScore} Punkten.
          </p>
          <button onClick={newGame}>Neue Partie</button>
        </section>
      ) : (
        <>
          <section className="players">
            {state.players.map((p) => (
              <article key={p.id} className="player">
                <header className="player__head">
                  <span className="player__name">
                    {p.hasCrown ? '👑 ' : ''}
                    {p.name}
                    {p.isAI ? ' 🤖' : ''}
                  </span>
                  <span className="player__score">
                    {p.totalScore}{' '}
                    {p.roundScore !== 0 && (
                      <em>({p.roundScore > 0 ? '+' : ''}{p.roundScore})</em>
                    )}
                  </span>
                </header>
                <div className="dice">
                  {p.rolled.map((d) => (
                    <Die key={d.id} die={d} />
                  ))}
                </div>
              </article>
            ))}
          </section>

          {state.phase === 'draft' && (
            <section className="panel">
              <h2>Angebot</h2>
              <div className="offers">
                {state.draftOffers.map((o) => (
                  <button
                    key={o.id}
                    className="offer"
                    style={{ borderColor: DIE_COLORS[o.die.color] }}
                    onClick={() => setState(draftPick(state, state.players[0].id, o.id))}
                    disabled={state.draftedThisPhase.includes(state.players[0].id)}
                  >
                    {DIE_LABELS[o.die.color]} W{o.die.sides}
                    {o.die.variant === 'glitter' ? ' ✨' : ''}
                  </button>
                ))}
              </div>
            </section>
          )}

          <div className="actions">
            <button onClick={() => setState(advancePhase(state, rngRef.current))}>
              Weiter →
            </button>
            <button className="ghost" onClick={newGame}>
              Neue Partie
            </button>
          </div>
        </>
      )}

      {state.log.length > 0 && (
        <details className="log">
          <summary>Protokoll</summary>
          <ul>
            {state.log.slice(-8).map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

// Phase 2: vollständige Anbindung der UI an die Engine.
// Alle vier Rundenphasen sind im Interface abgebildet; lokales Pass-and-Play.
// Die UI hält nur GameState + RNG und ruft reine Engine-Funktionen auf
// (strikte Trennung). Würfel sind CSS-Platzhalter (Phase 4 -> 3D).

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  advancePhase,
  createRNG,
  draftPass,
  draftPick,
  startGame,
  swapClearDice,
  type GameState,
  type Phase,
  type Player,
  type RNG,
} from './engine';
import { PlayerCard } from './ui/PlayerCard';
import { DIE_COLORS, DIE_LABELS } from './ui/colors';

const PHASE_LABEL: Record<Phase, string> = {
  roll: '1 · Würfeln',
  pity: '2 · Mitleidswürfel',
  swap: '3 · Klar tauschen',
  draft: '4 · Drafting',
};

const PHASE_HINT: Record<Phase, string> = {
  roll: 'Alle Mäuse haben ihren Beutel geworfen.',
  pity: 'Schwächere Mäuse erhalten einen Mitleidswürfel (hervorgehoben).',
  swap: 'Tippe deine Klar-Würfel an und würfle sie neu. Andere Farben bleiben.',
  draft: 'Reihum einen Würfel aus dem Angebot wählen – oder passen.',
};

const DEFAULT_PLAYERS = [{ name: 'Maus 1' }, { name: 'Maus 2' }];

function newSeed(): number {
  return Date.now() >>> 0;
}

export function App() {
  const rngRef = useRef<RNG>(createRNG(newSeed()));
  const [state, setState] = useState<GameState>(() => {
    const seed = newSeed();
    rngRef.current = createRNG(seed);
    return startGame({ players: DEFAULT_PLAYERS, seed }).state;
  });
  const [selectedClear, setSelectedClear] = useState<Set<string>>(new Set());

  // Auswahl zurücksetzen, sobald sich die Phase ändert.
  useEffect(() => {
    setSelectedClear(new Set());
  }, [state.phase, state.round]);

  const leader = useMemo(
    () => state.players.reduce((best, p) => (p.totalScore > best.totalScore ? p : best)),
    [state.players]
  );

  // Wer ist in der Draft-Phase als Nächstes am Zug?
  const activeDrafter: Player | undefined = useMemo(() => {
    if (state.phase !== 'draft') return undefined;
    return state.players.find((p) => !state.draftedThisPhase.includes(p.id));
  }, [state]);

  const draftComplete = state.phase === 'draft' && !activeDrafter;

  function newGame() {
    const seed = newSeed();
    rngRef.current = createRNG(seed);
    setState(startGame({ players: DEFAULT_PLAYERS, seed }).state);
  }

  function toggleClear(dieId: string) {
    setSelectedClear((prev) => {
      const next = new Set(prev);
      if (next.has(dieId)) next.delete(dieId);
      else next.add(dieId);
      return next;
    });
  }

  function rerollSelected() {
    if (selectedClear.size === 0) return;
    let next = state;
    // Ausgewählte IDs je Spieler gruppieren und tauschen.
    for (const p of state.players) {
      const ids = p.rolled
        .filter((d) => d.color === 'clear' && selectedClear.has(d.id))
        .map((d) => d.id);
      if (ids.length > 0) next = swapClearDice(next, p.id, ids, rngRef.current);
    }
    setState(next);
    setSelectedClear(new Set());
  }

  const hasClearDice = state.players.some((p) =>
    p.rolled.some((d) => d.color === 'clear')
  );

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
          <h2>Partie beendet 🎉</h2>
          <p>
            Sieger: <strong>{leader.name}</strong> mit {leader.totalScore} Punkten.
          </p>
          <ol className="standings">
            {[...state.players]
              .sort((a, b) => b.totalScore - a.totalScore)
              .map((p) => (
                <li key={p.id}>
                  {p.name}: {p.totalScore}
                </li>
              ))}
          </ol>
          <button onClick={newGame}>Neue Partie</button>
        </section>
      ) : (
        <>
          <p className="hint">{PHASE_HINT[state.phase]}</p>

          <section className="players">
            {state.players.map((p) => (
              <PlayerCard
                key={p.id}
                player={p}
                active={activeDrafter?.id === p.id}
                selectedDieIds={state.phase === 'swap' ? selectedClear : undefined}
                onToggleClear={state.phase === 'swap' ? toggleClear : undefined}
              />
            ))}
          </section>

          {state.phase === 'swap' && (
            <section className="panel">
              {hasClearDice ? (
                <button onClick={rerollSelected} disabled={selectedClear.size === 0}>
                  {selectedClear.size > 0
                    ? `${selectedClear.size} Klar-Würfel neu würfeln`
                    : 'Klar-Würfel auswählen'}
                </button>
              ) : (
                <p className="muted">Keine Klar-Würfel im Spiel.</p>
              )}
            </section>
          )}

          {state.phase === 'draft' && (
            <section className="panel">
              <h2>
                Angebot
                {activeDrafter && <> · {activeDrafter.name} ist am Zug</>}
              </h2>
              <div className="offers">
                {state.draftOffers.map((o) => (
                  <button
                    key={o.id}
                    className="offer"
                    style={{ borderColor: DIE_COLORS[o.die.color] }}
                    disabled={!activeDrafter}
                    onClick={() =>
                      activeDrafter &&
                      setState(draftPick(state, activeDrafter.id, o.id))
                    }
                  >
                    {DIE_LABELS[o.die.color]} W{o.die.sides}
                    {o.die.variant === 'glitter' ? ' ✨' : ''}
                  </button>
                ))}
              </div>
              {activeDrafter ? (
                <button
                  className="ghost"
                  onClick={() => setState(draftPass(state, activeDrafter.id))}
                >
                  {activeDrafter.name} passt
                </button>
              ) : (
                <p className="muted">Alle haben gewählt.</p>
              )}
            </section>
          )}

          <div className="actions">
            <button
              onClick={() => setState(advancePhase(state, rngRef.current))}
              disabled={state.phase === 'draft' && !draftComplete}
            >
              {state.phase === 'draft'
                ? state.round >= state.config.totalRounds
                  ? 'Partie beenden →'
                  : 'Nächste Runde →'
                : 'Weiter →'}
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
            {state.log.slice(-10).map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

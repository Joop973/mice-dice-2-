// Phasen 2 + 3: vollständige UI-Anbindung inkl. KI-Gegner (Solo).
// Die UI hält nur GameState + RNG und ruft reine Engine-/KI-Funktionen auf
// (strikte Trennung). KI-Spieler agieren automatisch über das gekapselte
// ai-Modul. Würfel sind CSS-Platzhalter (Phase 4 -> 3D).

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import {
  advancePhase,
  createRNG,
  draftPass,
  draftPick,
  startGame,
  swapClearDice,
  type GameState,
  type NewPlayer,
  type Phase,
  type Player,
  type RNG,
} from './engine';
import {
  aiTakePhaseAction,
  DIFFICULTIES,
  DIFFICULTY_LABELS,
  type Difficulty,
} from './ai';
import { PlayerCard } from './ui/PlayerCard';
import { RoundSummary } from './ui/RoundSummary';
import { DraftTable } from './ui/DraftTable';
import { RollButton } from './ui/RollButton';
import { CrownToken } from './ui/CrownToken';
import { SabotageFx } from './ui/SabotageFx';
import { Rules } from './ui/Rules';
import { clearLocalGame, loadLocalGame, saveLocalGame } from './ui/persistence';
import { useGameEvents, type GameEventFx } from './ui/useGameEvents';
import { OnlineFlow } from './ui/OnlineFlow';
import { PhaseTrack } from './ui/PhaseTrack';
import { ScoreTrack } from './ui/ScoreTrack';
import { useSound } from './sound';

const PHASE_HINT: Record<Phase, string> = {
  roll: 'Alle Mäuse haben ihren Beutel geworfen.',
  pity: 'Schwächere Mäuse erhalten einen Mitleidswürfel (hervorgehoben).',
  swap: 'Tippe deine Klar-Würfel an und würfle sie neu. Andere Farben bleiben.',
  draft: 'Reihum einen Würfel aus dem Angebot wählen – oder passen.',
};

const AI_STEP_DELAY_MS = 400;

function newSeed(): number {
  return Date.now() >>> 0;
}

function buildPlayers(humans: number, ais: number): NewPlayer[] {
  const players: NewPlayer[] = [];
  for (let i = 0; i < humans; i++) players.push({ name: `Maus ${i + 1}` });
  for (let i = 0; i < ais; i++) players.push({ name: `KI ${i + 1}`, isAI: true });
  return players;
}

export function App() {
  const rngRef = useRef<RNG>(createRNG(newSeed()));
  const aiSwapRoundRef = useRef(0);

  const [mode, setMode] = useState<'menu' | 'local' | 'online' | 'rules'>('menu');
  const [started, setStarted] = useState(false);
  const [humans, setHumans] = useState(1);
  const [ais, setAis] = useState(1);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');

  const [state, setState] = useState<GameState | null>(null);
  const [selectedClear, setSelectedClear] = useState<Set<string>>(new Set());
  const [use3d, setUse3d] = useState(true);

  const { play, muted, toggleMuted } = useSound();
  const fx = useGameEvents(state, play);

  // Gespeicherte lokale Partie für „Fortsetzen" (beim Menü-Eintritt aktualisiert).
  const [saved, setSaved] = useState(() => loadLocalGame());
  useEffect(() => {
    if (mode === 'menu') setSaved(loadLocalGame());
  }, [mode]);

  // Laufende lokale Partie sichern; beendete/aufgegebene Partien verwerfen.
  useEffect(() => {
    if (mode === 'local' && started && state && !state.finished) {
      saveLocalGame({ state, humans, ais, difficulty });
    } else if (state?.finished) {
      clearLocalGame();
    }
  }, [mode, started, state, humans, ais, difficulty]);

  function resume() {
    if (!saved) return;
    rngRef.current = createRNG(newSeed());
    aiSwapRoundRef.current = saved.state.round;
    setHumans(saved.humans);
    setAis(saved.ais);
    setDifficulty(saved.difficulty);
    setState(saved.state);
    setSelectedClear(new Set());
    setStarted(true);
    setMode('local');
  }

  function start() {
    clearLocalGame();
    setSaved(null);
    const seed = newSeed();
    rngRef.current = createRNG(seed);
    aiSwapRoundRef.current = 0;
    setState(startGame({ players: buildPlayers(humans, ais), seed }).state);
    setSelectedClear(new Set());
    setStarted(true);
  }

  // Auswahl zurücksetzen, sobald sich Phase/Runde ändern.
  useEffect(() => {
    setSelectedClear(new Set());
  }, [state?.phase, state?.round]);

  // KI-Treiber: agiert automatisch in der Swap- und Draft-Phase.
  useEffect(() => {
    if (!state || state.finished) return;

    if (state.phase === 'swap' && aiSwapRoundRef.current !== state.round) {
      aiSwapRoundRef.current = state.round;
      if (state.players.some((p) => p.isAI)) {
        setState((s) => {
          if (!s) return s;
          let next = s;
          for (const p of s.players) {
            if (p.isAI) next = aiTakePhaseAction(next, p.id, difficulty, rngRef.current);
          }
          return next;
        });
      }
      return;
    }

    if (state.phase === 'draft') {
      const drafter = state.players.find((p) => !state.draftedThisPhase.includes(p.id));
      if (drafter?.isAI) {
        const t = setTimeout(() => {
          setState((s) => {
            if (!s || s.phase !== 'draft') return s;
            const d = s.players.find((p) => !s.draftedThisPhase.includes(p.id));
            if (!d || !d.isAI) return s;
            return aiTakePhaseAction(s, d.id, difficulty, rngRef.current);
          });
        }, AI_STEP_DELAY_MS);
        return () => clearTimeout(t);
      }
    }
  }, [state, difficulty]);

  if (mode === 'menu') {
    return (
      <Menu
        onLocal={() => setMode('local')}
        onOnline={() => setMode('online')}
        onRules={() => setMode('rules')}
        onResume={saved ? resume : undefined}
        resumeRound={saved?.state.round}
      />
    );
  }

  if (mode === 'rules') {
    return <Rules onBack={() => setMode('menu')} />;
  }

  if (mode === 'online') {
    return <OnlineFlow onBack={() => setMode('menu')} />;
  }

  if (!started || !state) {
    return (
      <Setup
        humans={humans}
        ais={ais}
        difficulty={difficulty}
        setHumans={setHumans}
        setAis={setAis}
        setDifficulty={setDifficulty}
        onStart={start}
        onBack={() => setMode('menu')}
      />
    );
  }

  return (
    <Game
      state={state}
      difficulty={difficulty}
      use3d={use3d}
      onToggle3d={() => setUse3d((v) => !v)}
      muted={muted}
      onToggleMute={toggleMuted}
      fx={fx}
      selectedClear={selectedClear}
      onToggleClear={(id) =>
        setSelectedClear((prev) => {
          const next = new Set(prev);
          next.has(id) ? next.delete(id) : next.add(id);
          return next;
        })
      }
      onRerollSelected={() => {
        if (selectedClear.size === 0) return;
        let next = state;
        for (const p of state.players) {
          const ids = p.rolled
            .filter((d) => d.color === 'clear' && selectedClear.has(d.id))
            .map((d) => d.id);
          if (ids.length > 0) next = swapClearDice(next, p.id, ids, rngRef.current);
        }
        setState(next);
        setSelectedClear(new Set());
      }}
      onAdvance={() => setState(advancePhase(state, rngRef.current))}
      onPick={(playerId, offerId) => setState(draftPick(state, playerId, offerId))}
      onPass={(playerId) => setState(draftPass(state, playerId))}
      onNewGame={() => setStarted(false)}
    />
  );
}

function Menu({
  onLocal,
  onOnline,
  onRules,
  onResume,
  resumeRound,
}: {
  onLocal: () => void;
  onOnline: () => void;
  onRules: () => void;
  onResume?: () => void;
  resumeRound?: number;
}) {
  return (
    <div className="app">
      <header className="app__header">
        <h1>🧀 Dice Mice</h1>
        <p className="hint">Würfelspiel mit Mäuse-Thema</p>
      </header>
      <section className="panel">
        {onResume && (
          <>
            <button onClick={onResume}>▶️ Partie fortsetzen (Runde {resumeRound})</button>
            <p className="muted" style={{ margin: '10px 0 18px' }}>
              Deine zuletzt gespeicherte lokale Partie.
            </p>
          </>
        )}
        <button onClick={onLocal}>🎲 Solo / Pass-and-Play</button>
        <p className="muted" style={{ margin: '10px 0 18px' }}>
          Lokal an einem Gerät – allein gegen die KI oder reihum.
        </p>
        <button onClick={onOnline}>🌐 Online spielen</button>
        <p className="muted" style={{ margin: '10px 0 18px' }}>
          Raum erstellen und Code teilen. Ohne Server lokal simuliert.
        </p>
        <button className="ghost" onClick={onRules}>
          📖 Spielregeln
        </button>
      </section>
    </div>
  );
}

interface SetupProps {
  humans: number;
  ais: number;
  difficulty: Difficulty;
  setHumans: (n: number) => void;
  setAis: (n: number) => void;
  setDifficulty: (d: Difficulty) => void;
  onStart: () => void;
  onBack: () => void;
}

function Setup({
  humans,
  ais,
  difficulty,
  setHumans,
  setAis,
  setDifficulty,
  onStart,
  onBack,
}: SetupProps) {
  const total = humans + ais;
  const valid = total >= 2 && total <= 4 && humans >= 1;

  return (
    <div className="app">
      <header className="app__header">
        <h1>🧀 Dice Mice</h1>
        <p className="hint">Neue Partie einrichten</p>
      </header>

      <section className="panel">
        <Counter label="Menschen (Pass-and-Play)" value={humans} min={1} max={4} onChange={setHumans} />
        <Counter label="KI-Gegner" value={ais} min={0} max={3} onChange={setAis} />

        <div className="field">
          <span className="field__label">KI-Schwierigkeit</span>
          <div className="seg">
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                className={`seg__btn${d === difficulty ? ' seg__btn--on' : ''}`}
                onClick={() => setDifficulty(d)}
              >
                {DIFFICULTY_LABELS[d]}
              </button>
            ))}
          </div>
        </div>

        {!valid && <p className="muted">2–4 Mäuse insgesamt, mindestens 1 Mensch.</p>}
        <button onClick={onStart} disabled={!valid}>
          Partie starten →
        </button>
      </section>

      <div className="actions">
        <button className="ghost" onClick={onBack}>
          ← Zurück
        </button>
      </div>
    </div>
  );
}

function Counter({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="field">
      <span className="field__label">{label}</span>
      <div className="counter">
        <button onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}>
          −
        </button>
        <span className="counter__value">{value}</span>
        <button onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}>
          +
        </button>
      </div>
    </div>
  );
}

interface GameProps {
  state: GameState;
  difficulty: Difficulty;
  use3d: boolean;
  onToggle3d: () => void;
  muted: boolean;
  onToggleMute: () => void;
  fx: GameEventFx;
  selectedClear: Set<string>;
  onToggleClear: (id: string) => void;
  onRerollSelected: () => void;
  onAdvance: () => void;
  onPick: (playerId: string, offerId: string) => void;
  onPass: (playerId: string) => void;
  onNewGame: () => void;
}

function Game({
  state,
  use3d,
  onToggle3d,
  muted,
  onToggleMute,
  fx,
  selectedClear,
  onToggleClear,
  onRerollSelected,
  onAdvance,
  onPick,
  onPass,
  onNewGame,
}: GameProps) {
  const leader = useMemo(
    () => state.players.reduce((best, p) => (p.totalScore > best.totalScore ? p : best)),
    [state.players]
  );

  const activeDrafter: Player | undefined =
    state.phase === 'draft'
      ? state.players.find((p) => !state.draftedThisPhase.includes(p.id))
      : undefined;
  const draftComplete = state.phase === 'draft' && !activeDrafter;
  const humanDrafting = activeDrafter && !activeDrafter.isAI;
  const hasClearDice = state.players.some((p) => p.rolled.some((d) => d.color === 'clear'));

  // „Würfeln"-Reveal: zu Rundenbeginn sind die (längst geworfenen) Würfel
  // verdeckt, bis der Knopf gedrückt wird. Pro Runde zurücksetzen.
  const [rolledRevealed, setRolledRevealed] = useState(false);
  useEffect(() => setRolledRevealed(false), [state.round]);
  const diceRevealed = state.phase !== 'roll' || rolledRevealed;
  const awaitingRoll = state.phase === 'roll' && !rolledRevealed;

  if (state.finished) {
    return (
      <div className="app">
        <div className="confetti" aria-hidden="true">
          {Array.from({ length: 14 }, (_, i) => (
            <span key={i} style={{ '--i': i } as CSSProperties} />
          ))}
        </div>
        <header className="app__header">
          <h1>🧀 Dice Mice</h1>
        </header>
        <section className="panel panel--win">
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
          <button onClick={onNewGame}>Neue Partie</button>
        </section>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app__header">
        <h1>🧀 Dice Mice</h1>
        <div className="app__meta">
          <span>
            Runde {state.round} / {state.config.totalRounds}
          </span>
          <button className="toggle3d" onClick={onToggle3d}>
            {use3d ? '3D' : '2D'}
          </button>
          <button
            className="toggle3d"
            onClick={onToggleMute}
            aria-label={muted ? 'Ton einschalten' : 'Ton ausschalten'}
            aria-pressed={muted}
          >
            {muted ? '🔇' : '🔊'}
          </button>
        </div>
      </header>

      <PhaseTrack phase={state.phase} />
      <ScoreTrack players={state.players} />

      {fx.banner && (
        <div className="banner" role="status" aria-live="polite">
          <span>{fx.banner}</span>
        </div>
      )}

      <CrownToken move={fx.crownMove} />
      <SabotageFx moves={fx.sabotage} />

      <p className="hint">{PHASE_HINT[state.phase]}</p>

      <section className="players">
        {state.players.map((p) => (
          <PlayerCard
            key={p.id}
            player={p}
            use3d={use3d}
            active={activeDrafter?.id === p.id}
            crowned={fx.crownedNow.has(p.id)}
            warn={fx.warnNow.has(p.id)}
            selectedDieIds={state.phase === 'swap' ? selectedClear : undefined}
            onToggleClear={state.phase === 'swap' && !p.isAI ? onToggleClear : undefined}
            revealed={diceRevealed}
          />
        ))}
      </section>

      {awaitingRoll && <RollButton onReveal={() => setRolledRevealed(true)} />}

      {state.phase === 'swap' && (
        <section className="panel">
          {hasClearDice ? (
            <button onClick={onRerollSelected} disabled={selectedClear.size === 0}>
              {selectedClear.size > 0
                ? `${selectedClear.size} Klar-Würfel neu würfeln`
                : 'Klar-Würfel auswählen'}
            </button>
          ) : (
            <p className="muted">Keine Klar-Würfel im Spiel.</p>
          )}
        </section>
      )}

      {state.phase === 'draft' && state.lastScores && (
        <RoundSummary scores={state.lastScores} players={state.players} />
      )}

      {state.phase === 'draft' && (
        <DraftTable
          offers={state.draftOffers}
          activeName={activeDrafter?.name}
          isAITurn={!!activeDrafter?.isAI}
          canPick={!!humanDrafting}
          onPick={(offerId) => activeDrafter && onPick(activeDrafter.id, offerId)}
          targetId={activeDrafter?.id}
          onPass={humanDrafting ? () => onPass(activeDrafter!.id) : undefined}
          complete={draftComplete}
        />
      )}

      <div className="actions">
        {!awaitingRoll && (
          <button onClick={onAdvance} disabled={state.phase === 'draft' && !draftComplete}>
            {state.phase === 'draft'
              ? state.round >= state.config.totalRounds
                ? 'Partie beenden →'
                : 'Nächste Runde →'
              : 'Weiter →'}
          </button>
        )}
        <button className="ghost" onClick={onNewGame}>
          Neue Partie
        </button>
      </div>

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

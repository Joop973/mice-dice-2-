// Phasen 2 + 3: vollständige UI-Anbindung inkl. KI-Gegner (Solo).
// Die UI hält nur GameState + RNG und ruft reine Engine-/KI-Funktionen auf
// (strikte Trennung). KI-Spieler agieren automatisch über das gekapselte
// ai-Modul. Würfel sind CSS-Platzhalter (Phase 4 -> 3D).

import { useEffect, useRef, useState } from 'react';
import {
  advancePhase,
  createRNG,
  draftPass,
  draftPick,
  startGame,
  swapClearDice,
  type GameState,
  type NewPlayer,
  type Player,
  type RNG,
} from './engine';
import { aiTakePhaseAction, DIFFICULTIES, DIFFICULTY_LABELS, type Difficulty } from './ai';
import { RoundSummary } from './ui/RoundSummary';
import { Rules } from './ui/Rules';
import { clearLocalGame, loadLocalGame, saveLocalGame } from './ui/persistence';
import { useGameEvents, type GameEventFx } from './ui/useGameEvents';
import { OnlineFlow } from './ui/OnlineFlow';
import { useSound } from './sound';
import { Counter } from './ui/Counter';
import { PixelIcon } from './ui/PixelIcon';
import { OfferButton } from './ui/OfferButton';
import { MouseAvatar } from './ui/MouseAvatar';
import { MenuScene, BoardTable, Scoreboard, GameScreen, RollReveal } from './ui/scene/KitchenScene';
import { WinScreen } from './ui/WinScreen';
import { useClearSelection } from './ui/useClearSelection';

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
  const selectedClear = useClearSelection();

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
    selectedClear.reset();
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
    selectedClear.reset();
    setStarted(true);
  }

  // Auswahl zurücksetzen, sobald sich Phase/Runde ändern.
  const resetClear = selectedClear.reset;
  useEffect(() => {
    resetClear();
  }, [state?.phase, state?.round, resetClear]);

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
      muted={muted}
      onToggleMute={toggleMuted}
      fx={fx}
      selectedClear={selectedClear.selected}
      onToggleClear={selectedClear.toggle}
      onRerollSelected={() => {
        if (selectedClear.selected.size === 0) return;
        let next = state;
        for (const p of state.players) {
          const ids = p.rolled
            .filter((d) => d.color === 'clear' && selectedClear.selected.has(d.id))
            .map((d) => d.id);
          if (ids.length > 0) next = swapClearDice(next, p.id, ids, rngRef.current);
        }
        setState(next);
        selectedClear.reset();
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
    <MenuScene
      onPlay={onResume ?? onLocal}
      playLabel={onResume ? `Partie fortsetzen (Runde ${resumeRound})` : 'Spielen'}
    >
      {onResume && (
        <button className="wood-chip" onClick={onResume}>
          <PixelIcon name="play" title="" /> Fortsetzen (Runde {resumeRound})
        </button>
      )}
      <button className="wood-chip" onClick={onLocal}>
        <PixelIcon name="dice" title="" /> Solo / Pass-and-Play
      </button>
      <button className="wood-chip" onClick={onOnline}>
        <PixelIcon name="globe" title="" /> Online
      </button>
      <button className="wood-chip" onClick={onRules}>
        <PixelIcon name="book" title="" /> Regeln
      </button>
    </MenuScene>
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
        <h1>
          <PixelIcon name="cheese" size={28} title="Dice Mice" /> Dice Mice
        </h1>
        <p className="hint">Neue Partie einrichten</p>
      </header>

      <div className="hero hero--small" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className="hero__mouse--back">
            <MouseAvatar colorIndex={i} size={48} />
          </span>
        ))}
      </div>

      <section className="panel">
        <Counter
          label="Menschen (Pass-and-Play)"
          value={humans}
          min={1}
          max={4}
          onChange={setHumans}
        />
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

interface GameProps {
  state: GameState;
  difficulty: Difficulty;
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
  // Sub-Schritt der Würfel-Phase: erst Übersicht ("Würfeln"), dann der Wurf.
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    setRevealed(false);
  }, [state.round]);

  const activeDrafter: Player | undefined =
    state.phase === 'draft'
      ? state.players.find((p) => !state.draftedThisPhase.includes(p.id))
      : undefined;
  const draftComplete = state.phase === 'draft' && !activeDrafter;
  const humanDrafting = activeDrafter && !activeDrafter.isAI;

  if (state.finished) {
    return <WinScreen players={state.players} actionLabel="Neue Partie" onAction={onNewGame} />;
  }

  const top = {
    round: state.round,
    total: state.config.totalRounds,
    muted,
    onToggleMute,
    phase: state.phase,
  };

  const newGameBtn = (
    <button className="ghost dock__secondary" onClick={onNewGame}>
      Neue Partie
    </button>
  );

  const eventBanner = fx.banner ? (
    <div className="banner banner--float" role="status" aria-live="polite">
      <span>{fx.banner}</span>
    </div>
  ) : null;

  // Screen 1 — Übersicht VOR dem Wurf: Tisch-Ansicht, Würfel noch verdeckt.
  if (state.phase === 'roll' && !revealed) {
    return (
      <GameScreen
        {...top}
        dock={
          <>
            <button className="dock__primary" onClick={() => setRevealed(true)}>
              Würfeln →
            </button>
            {newGameBtn}
          </>
        }
      >
        <BoardTable players={state.players} hideDice crownedNow={fx.crownedNow} warnNow={fx.warnNow} />
        <Scoreboard players={state.players} />
      </GameScreen>
    );
  }

  // Screen 2 — Wurf: die eigenen Würfel rollen sehen.
  if (state.phase === 'roll' && revealed) {
    return (
      <GameScreen
        {...top}
        dock={
          <>
            <button className="dock__primary" onClick={onAdvance}>
              Weiter →
            </button>
            {newGameBtn}
          </>
        }
      >
        <RollReveal players={state.players} />
      </GameScreen>
    );
  }

  // Screen 3 — Übersicht NACH dem Wurf (Mitleidswürfel + Stand).
  if (state.phase === 'pity') {
    return (
      <GameScreen
        {...top}
        dock={
          <>
            <button className="dock__primary" onClick={onAdvance}>
              Weiter →
            </button>
            {newGameBtn}
          </>
        }
      >
        {eventBanner}
        <BoardTable players={state.players} crownedNow={fx.crownedNow} warnNow={fx.warnNow} />
        <Scoreboard players={state.players} />
      </GameScreen>
    );
  }

  // Screen 4a — Auswahl: eigene Klar-Würfel zum Neu-Würfeln antippen.
  if (state.phase === 'swap') {
    return (
      <GameScreen
        {...top}
        dock={
          <>
            <button
              className="dock__primary"
              onClick={onRerollSelected}
              disabled={selectedClear.size === 0}
            >
              {selectedClear.size > 0
                ? `${selectedClear.size} Klar-Würfel neu würfeln`
                : 'Klar-Würfel antippen'}
            </button>
            <button className="dock__primary ghost" onClick={onAdvance}>
              Weiter →
            </button>
            {newGameBtn}
          </>
        }
      >
        {eventBanner}
        <BoardTable
          players={state.players}
          swap
          selectedClear={selectedClear}
          onToggleClear={onToggleClear}
          crownedNow={fx.crownedNow}
          warnNow={fx.warnNow}
        />
      </GameScreen>
    );
  }

  // Screen 4b — Auswahl: einen Würfel aus dem Angebot antippen (Draft).
  return (
    <GameScreen
      {...top}
      dock={
        <>
          {state.lastScores && <RoundSummary scores={state.lastScores} players={state.players} />}
          {humanDrafting && (
            <button className="ghost" onClick={() => onPass(activeDrafter!.id)}>
              {activeDrafter!.name} passt
            </button>
          )}
          <button className="dock__primary" onClick={onAdvance} disabled={!draftComplete}>
            {state.round >= state.config.totalRounds ? 'Partie beenden →' : 'Nächste Runde →'}
          </button>
          {newGameBtn}
        </>
      }
    >
      {eventBanner}
      <div className="draft-select">
        <h2 className="draft-select__turn">
          {draftComplete
            ? 'Alle haben gewählt.'
            : activeDrafter
              ? activeDrafter.isAI
                ? `${activeDrafter.name} (KI) wählt …`
                : `${activeDrafter.name} – tippe einen Würfel`
              : ''}
        </h2>
        <div className="offers offers--big">
          {state.draftOffers.map((o) => (
            <OfferButton
              key={o.id}
              color={o.die.color}
              sides={o.die.sides}
              variant={o.die.variant}
              disabled={!humanDrafting}
              onPick={() => activeDrafter && onPick(activeDrafter.id, o.id)}
            />
          ))}
        </div>
      </div>
    </GameScreen>
  );
}

// Phasen 2 + 3: vollständige UI-Anbindung inkl. KI-Gegner (Solo).
// Die UI hält nur GameState + RNG und ruft reine Engine-/KI-Funktionen auf
// (strikte Trennung). KI-Spieler agieren automatisch über das gekapselte
// ai-Modul. Würfel sind CSS-Platzhalter (Phase 4 -> 3D).

import { useEffect, useRef, useState, type CSSProperties } from 'react';
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
import { Podium } from './ui/Podium';
import { Rules } from './ui/Rules';
import { StatsPanel } from './ui/StatsPanel';
import { Tutorial, isOnboarded } from './ui/Tutorial';
import { clearLocalGame, loadLocalGame, saveLocalGame } from './ui/persistence';
import { recordGame } from './ui/stats';
import { useGameEvents, type GameEventFx } from './ui/useGameEvents';
import { OnlineFlow } from './ui/OnlineFlow';
import { PhaseTrack } from './ui/PhaseTrack';
import { ScoreTrack } from './ui/ScoreTrack';
import { playerIndex } from './ui/colors';
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

function buildPlayers(humans: number, ais: number, names: string[]): NewPlayer[] {
  const players: NewPlayer[] = [];
  for (let i = 0; i < humans; i++) players.push({ name: names[i]?.trim() || `Maus ${i + 1}` });
  for (let i = 0; i < ais; i++) players.push({ name: `KI ${i + 1}`, isAI: true });
  return players;
}

// Wird in Phase „6 Spieler" auf 6 angehoben (zusammen mit Farben/WebGL/Layout).
const MAX_PLAYERS = 4;
const ROUND_CHOICES = [5, 10, 15];

export function App() {
  const rngRef = useRef<RNG>(createRNG(newSeed()));
  const aiSwapRoundRef = useRef(0);

  const [mode, setMode] = useState<'menu' | 'local' | 'online' | 'rules' | 'stats'>('menu');
  const [showTutorial, setShowTutorial] = useState(() => !isOnboarded());
  const recordedRef = useRef(false);
  const [started, setStarted] = useState(false);
  const [humans, setHumans] = useState(1);
  const [ais, setAis] = useState(1);
  // Schwierigkeit je KI-Sitz (Index = KI-Ordinalzahl 0..); reine UI/App-Sache.
  const [aiDifficulty, setAiDifficulty] = useState<Difficulty[]>(() =>
    Array(MAX_PLAYERS).fill('medium')
  );
  const [humanNames, setHumanNames] = useState<string[]>([]);
  const [totalRounds, setTotalRounds] = useState(10);

  const [state, setState] = useState<GameState | null>(null);
  const [selectedClear, setSelectedClear] = useState<Set<string>>(new Set());
  const [use3d, setUse3d] = useState(true);

  // Schwierigkeit für einen KI-Sitz (KI-Ordinalzahl = Spielerindex − Menschen).
  const aiDiffForSeat = (playerId: string): Difficulty =>
    aiDifficulty[playerIndex(playerId) - humans] ?? 'medium';

  const { play, muted, toggleMuted, musicAvailable, musicOn, toggleMusic } = useSound();
  const fx = useGameEvents(state, play, muted);

  // Gespeicherte lokale Partie für „Fortsetzen" (beim Menü-Eintritt aktualisiert).
  const [saved, setSaved] = useState(() => loadLocalGame());
  useEffect(() => {
    if (mode === 'menu') setSaved(loadLocalGame());
  }, [mode]);

  // Laufende lokale Partie sichern; beendete/aufgegebene Partien verwerfen.
  useEffect(() => {
    if (mode === 'local' && started && state && !state.finished) {
      saveLocalGame({
        state,
        humans,
        ais,
        difficulty: aiDifficulty[0] ?? 'medium',
        names: humanNames,
        totalRounds,
        aiDifficulty,
      });
    } else if (state?.finished) {
      if (mode === 'local' && started && !recordedRef.current) {
        recordedRef.current = true;
        recordGame(state);
      }
      clearLocalGame();
    }
  }, [mode, started, state, humans, ais, aiDifficulty, humanNames, totalRounds]);

  function resume() {
    if (!saved) return;
    rngRef.current = createRNG(newSeed());
    aiSwapRoundRef.current = saved.state.round;
    recordedRef.current = false;
    setHumans(saved.humans);
    setAis(saved.ais);
    setAiDifficulty(saved.aiDifficulty ?? Array(MAX_PLAYERS).fill(saved.difficulty));
    setHumanNames(saved.names ?? []);
    setTotalRounds(saved.totalRounds ?? 10);
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
    recordedRef.current = false;
    setState(
      startGame({ players: buildPlayers(humans, ais, humanNames), seed, config: { totalRounds } })
        .state
    );
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
            if (p.isAI) next = aiTakePhaseAction(next, p.id, aiDiffForSeat(p.id), rngRef.current);
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
            return aiTakePhaseAction(s, d.id, aiDiffForSeat(d.id), rngRef.current);
          });
        }, AI_STEP_DELAY_MS);
        return () => clearTimeout(t);
      }
    }
  }, [state, aiDifficulty, humans]);

  if (mode === 'menu') {
    return (
      <>
        <Menu
          onLocal={() => setMode('local')}
          onOnline={() => setMode('online')}
          onRules={() => setMode('rules')}
          onStats={() => setMode('stats')}
          onTutorial={() => setShowTutorial(true)}
          onResume={saved ? resume : undefined}
          resumeRound={saved?.state.round}
        />
        {showTutorial && <Tutorial onClose={() => setShowTutorial(false)} />}
      </>
    );
  }

  if (mode === 'rules') {
    return <Rules onBack={() => setMode('menu')} />;
  }

  if (mode === 'stats') {
    return <StatsPanel onBack={() => setMode('menu')} />;
  }

  if (mode === 'online') {
    return <OnlineFlow onBack={() => setMode('menu')} />;
  }

  if (!started || !state) {
    return (
      <Setup
        humans={humans}
        ais={ais}
        aiDifficulty={aiDifficulty}
        humanNames={humanNames}
        totalRounds={totalRounds}
        setHumans={setHumans}
        setAis={setAis}
        setAiDifficulty={setAiDifficulty}
        setHumanNames={setHumanNames}
        setTotalRounds={setTotalRounds}
        onStart={start}
        onBack={() => setMode('menu')}
      />
    );
  }

  return (
    <Game
      state={state}
      use3d={use3d}
      onToggle3d={() => setUse3d((v) => !v)}
      muted={muted}
      onToggleMute={toggleMuted}
      musicAvailable={musicAvailable}
      musicOn={musicOn}
      onToggleMusic={toggleMusic}
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
  onStats,
  onTutorial,
  onResume,
  resumeRound,
}: {
  onLocal: () => void;
  onOnline: () => void;
  onRules: () => void;
  onStats: () => void;
  onTutorial: () => void;
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
        <div className="menu__row">
          <button className="ghost" onClick={onStats}>
            📊 Statistik
          </button>
          <button className="ghost" onClick={onTutorial}>
            ❔ Tutorial
          </button>
        </div>
      </section>
    </div>
  );
}

interface SetupProps {
  humans: number;
  ais: number;
  aiDifficulty: Difficulty[];
  humanNames: string[];
  totalRounds: number;
  setHumans: (n: number) => void;
  setAis: (n: number) => void;
  setAiDifficulty: (d: Difficulty[]) => void;
  setHumanNames: (n: string[]) => void;
  setTotalRounds: (n: number) => void;
  onStart: () => void;
  onBack: () => void;
}

function Setup({
  humans,
  ais,
  aiDifficulty,
  humanNames,
  totalRounds,
  setHumans,
  setAis,
  setAiDifficulty,
  setHumanNames,
  setTotalRounds,
  onStart,
  onBack,
}: SetupProps) {
  const total = humans + ais;
  const valid = total >= 2 && total <= MAX_PLAYERS && humans >= 1;

  const setName = (i: number, v: string) => {
    const next = humanNames.slice();
    next[i] = v;
    setHumanNames(next);
  };
  const setAiDiff = (i: number, d: Difficulty) => {
    const next = aiDifficulty.slice();
    next[i] = d;
    setAiDifficulty(next);
  };

  return (
    <div className="app">
      <header className="app__header">
        <h1>🧀 Dice Mice</h1>
        <p className="hint">Neue Partie einrichten</p>
      </header>

      <section className="panel">
        <Counter label="Menschen (Pass-and-Play)" value={humans} min={1} max={MAX_PLAYERS} onChange={setHumans} />
        <Counter label="KI-Gegner" value={ais} min={0} max={MAX_PLAYERS - 1} onChange={setAis} />

        <div className="field">
          <span className="field__label">Namen</span>
          <div className="names">
            {Array.from({ length: humans }, (_, i) => (
              <input
                key={i}
                className="names__input"
                value={humanNames[i] ?? ''}
                placeholder={`Maus ${i + 1}`}
                maxLength={16}
                onChange={(e) => setName(i, e.target.value)}
              />
            ))}
          </div>
        </div>

        <div className="field">
          <span className="field__label">Runden</span>
          <div className="seg">
            {ROUND_CHOICES.map((r) => (
              <button
                key={r}
                className={`seg__btn${r === totalRounds ? ' seg__btn--on' : ''}`}
                onClick={() => setTotalRounds(r)}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {Array.from({ length: ais }, (_, i) => (
          <div className="field" key={i}>
            <span className="field__label">{`KI ${i + 1} – Schwierigkeit`}</span>
            <div className="seg">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  className={`seg__btn${d === (aiDifficulty[i] ?? 'medium') ? ' seg__btn--on' : ''}`}
                  onClick={() => setAiDiff(i, d)}
                >
                  {DIFFICULTY_LABELS[d]}
                </button>
              ))}
            </div>
          </div>
        ))}

        {!valid && <p className="muted">2–{MAX_PLAYERS} Mäuse insgesamt, mindestens 1 Mensch.</p>}
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
  use3d: boolean;
  onToggle3d: () => void;
  muted: boolean;
  onToggleMute: () => void;
  musicAvailable: boolean;
  musicOn: boolean;
  onToggleMusic: () => void;
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
  musicAvailable,
  musicOn,
  onToggleMusic,
  fx,
  selectedClear,
  onToggleClear,
  onRerollSelected,
  onAdvance,
  onPick,
  onPass,
  onNewGame,
}: GameProps) {
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
          <Podium players={state.players} actionLabel="Neue Partie" onAction={onNewGame} />
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
          {musicAvailable && (
            <button
              className="toggle3d"
              onClick={onToggleMusic}
              aria-label={musicOn ? 'Musik aus' : 'Musik an'}
              aria-pressed={musicOn}
              style={{ opacity: musicOn ? 1 : 0.5 }}
            >
              🎵
            </button>
          )}
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

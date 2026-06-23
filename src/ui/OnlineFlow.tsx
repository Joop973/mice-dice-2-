// Online-Modus-UI: Verbinden (Raum erstellen/beitreten) → Lobby → Online-Partie.
// Läuft über die Transport-Schicht: mit Server-URL via WebSocket, sonst über den
// In-Process-Loopback (LocalTransport) – so funktioniert der Online-Code-Pfad
// auch ohne laufenden Server (Solo gegen KI).
//
// Der Server ist autoritativ: diese Komponente rendert nur den empfangenen
// GameState und schickt Aktionen; die Zug-/Rechteprüfung passiert serverseitig.

import { useMemo, useState } from 'react';
import { LocalTransport, WebSocketTransport, type Transport } from '../net';
import { DIFFICULTIES, DIFFICULTY_LABELS, type Difficulty } from '../ai';
import type { GameState, Player } from '../engine';
import { PlayerCard } from './PlayerCard';
import { RoundSummary } from './RoundSummary';
import { useGameClient, type GameClient } from './useGameClient';
import { useGameEvents } from './useGameEvents';
import { useSound } from '../sound';
import { PHASE_LABEL, PHASE_HINT } from './phaseLabels';
import { Counter } from './Counter';
import { PixelIcon } from './PixelIcon';
import { OfferButton } from './OfferButton';
import { WinScreen } from './WinScreen';
import { useClearSelection } from './useClearSelection';

const ENV_SERVER_URL: string =
  (import.meta.env as Record<string, string | undefined>).VITE_SERVER_URL ?? '';

function transportFactory(serverUrl: string): () => Transport {
  const url = serverUrl.trim();
  return url ? () => new WebSocketTransport(url) : () => new LocalTransport();
}

export function OnlineFlow({ onBack }: { onBack: () => void }) {
  const client = useGameClient();
  const { play } = useSound();
  const fx = useGameEvents(client.state, play);

  if (client.state && client.started) {
    return <OnlineGame client={client} fx={fx} onBack={onBack} />;
  }
  if (client.you) {
    return <Lobby client={client} onBack={onBack} />;
  }
  return <Connect client={client} onBack={onBack} />;
}

// --- Verbinden ------------------------------------------------------------

function Connect({ client, onBack }: { client: GameClient; onBack: () => void }) {
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [name, setName] = useState('Maus');
  const [serverUrl, setServerUrl] = useState(ENV_SERVER_URL);
  const [ais, setAis] = useState(1);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [code, setCode] = useState('');

  const isLocal = serverUrl.trim() === '';
  const nameOk = name.trim().length > 0;

  return (
    <div className="app">
      <header className="app__header">
        <h1>
          <PixelIcon name="cheese" size={28} title="Dice Mice" /> Dice Mice · Online
        </h1>
        <p className="hint">
          {isLocal
            ? 'Kein Server angegeben → lokal simuliert (Solo gegen KI über den Online-Pfad).'
            : 'Verbindet mit deinem Server.'}
        </p>
      </header>

      <div className="seg" style={{ marginBottom: 16 }}>
        <button
          className={`seg__btn${tab === 'create' ? ' seg__btn--on' : ''}`}
          onClick={() => setTab('create')}
        >
          Raum erstellen
        </button>
        <button
          className={`seg__btn${tab === 'join' ? ' seg__btn--on' : ''}`}
          onClick={() => setTab('join')}
        >
          Beitreten
        </button>
      </div>

      <section className="panel">
        <label className="field">
          <span className="field__label">Dein Name</span>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="field">
          <span className="field__label">Server-URL</span>
          <input
            className="input"
            placeholder="leer = lokal"
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
          />
        </label>

        {tab === 'create' ? (
          <>
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
            <button
              disabled={!nameOk}
              onClick={() =>
                client.createRoom(transportFactory(serverUrl), {
                  name: name.trim(),
                  ais,
                  difficulty,
                })
              }
            >
              Raum erstellen →
            </button>
          </>
        ) : (
          <>
            <label className="field">
              <span className="field__label">Raumcode</span>
              <input
                className="input"
                value={code}
                maxLength={4}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
              />
            </label>
            {isLocal && (
              <p className="muted">
                Beitreten benötigt einen laufenden Server (Server-URL angeben).
              </p>
            )}
            <button
              disabled={!nameOk || code.trim().length === 0 || isLocal}
              onClick={() => client.joinRoom(transportFactory(serverUrl), code.trim(), name.trim())}
            >
              Beitreten →
            </button>
          </>
        )}

        {client.error && <p className="error">{client.error}</p>}
      </section>

      <div className="actions">
        <button className="ghost" onClick={onBack}>
          ← Zurück
        </button>
      </div>
    </div>
  );
}

// --- Lobby ----------------------------------------------------------------

function Lobby({ client, onBack }: { client: GameClient; onBack: () => void }) {
  const isHost = client.seats.find((s) => s.isHost)?.id === client.you;
  const canStart = client.seats.length >= 2;

  return (
    <div className="app">
      <header className="app__header">
        <h1>
          <PixelIcon name="cheese" size={28} title="Dice Mice" /> Lobby
        </h1>
        <p className="hint">
          Raumcode: <strong className="code">{client.code}</strong>
          {' · '}teile ihn zum Beitreten.
        </p>
      </header>

      <section className="panel">
        <h2>Mäuse im Raum</h2>
        <ul className="standings">
          {client.seats.map((s) => (
            <li key={s.id}>
              {s.isHost && (
                <>
                  <PixelIcon name="star" title="Host" />{' '}
                </>
              )}
              {s.name}
              {s.isAI && (
                <>
                  {' '}
                  <PixelIcon name="ai" title="KI-Gegner" />
                </>
              )}
              {s.id === client.you ? ' (du)' : ''}
              {!s.connected ? ' – getrennt' : ''}
            </li>
          ))}
        </ul>

        {isHost ? (
          <button disabled={!canStart} onClick={() => client.start()}>
            {canStart ? 'Partie starten →' : 'Mindestens 2 Mäuse'}
          </button>
        ) : (
          <p className="muted">Warte auf den Host …</p>
        )}
        {client.error && <p className="error">{client.error}</p>}
      </section>

      <div className="actions">
        <button
          className="ghost"
          onClick={() => {
            client.leave();
            onBack();
          }}
        >
          ← Verlassen
        </button>
      </div>
    </div>
  );
}

// --- Online-Partie --------------------------------------------------------

function OnlineGame({
  client,
  fx,
  onBack,
}: {
  client: GameClient;
  fx: ReturnType<typeof useGameEvents>;
  onBack: () => void;
}) {
  const state = client.state as GameState;
  const you = client.you;
  const { muted, toggleMuted } = useSound();
  const selectedClear = useClearSelection();

  const isHost = client.seats.find((s) => s.isHost)?.id === you;

  const activeDrafter: Player | undefined =
    state.phase === 'draft'
      ? state.players.find((p) => !state.draftedThisPhase.includes(p.id))
      : undefined;
  const draftComplete = state.phase === 'draft' && !activeDrafter;
  const youAreActiveDrafter = !!activeDrafter && activeDrafter.id === you;
  const yourClearDice = useMemo(() => {
    const me = state.players.find((p) => p.id === you);
    return me ? me.rolled.some((d) => d.color === 'clear') : false;
  }, [state.players, you]);

  if (state.finished) {
    return (
      <WinScreen
        players={state.players}
        actionLabel="Zurück zum Menü"
        onAction={() => {
          client.leave();
          onBack();
        }}
      />
    );
  }

  const rerollSelected = () => {
    if (selectedClear.selected.size === 0) return;
    client.sendAction({ type: 'swap', dieIds: [...selectedClear.selected] });
    selectedClear.reset();
  };

  return (
    <div className="app">
      <header className="app__header">
        <h1>
          <PixelIcon name="cheese" size={28} title="Dice Mice" /> Dice Mice
        </h1>
        <div className="app__meta">
          <span>
            Runde {state.round} / {state.config.totalRounds}
          </span>
          <span className="badge">{PHASE_LABEL[state.phase]}</span>
          <span className="code">#{client.code}</span>
          <button
            className="toggle3d"
            onClick={toggleMuted}
            aria-label={muted ? 'Ton einschalten' : 'Ton ausschalten'}
            aria-pressed={muted}
          >
            <PixelIcon name={muted ? 'soundOff' : 'soundOn'} title={muted ? 'Ton aus' : 'Ton an'} />
          </button>
        </div>
      </header>

      {fx.banner && (
        <div className="banner" role="status" aria-live="polite">
          <span>{fx.banner}</span>
        </div>
      )}

      <p className="hint">{PHASE_HINT[state.phase]}</p>

      <section className="players">
        {state.players.map((p, i) => {
          const isYou = p.id === you;
          return (
            <PlayerCard
              key={p.id}
              player={p}
              colorIndex={i}
              use3d
              active={activeDrafter?.id === p.id}
              crowned={fx.crownedNow.has(p.id)}
              warn={fx.warnNow.has(p.id)}
              selectedDieIds={state.phase === 'swap' && isYou ? selectedClear.selected : undefined}
              onToggleClear={state.phase === 'swap' && isYou ? selectedClear.toggle : undefined}
            />
          );
        })}
      </section>

      {state.phase === 'swap' && (
        <section className="panel">
          {yourClearDice ? (
            <button onClick={rerollSelected} disabled={selectedClear.selected.size === 0}>
              {selectedClear.selected.size > 0
                ? `${selectedClear.selected.size} eigene Klar-Würfel neu würfeln`
                : 'Eigene Klar-Würfel auswählen'}
            </button>
          ) : (
            <p className="muted">Du hast keine Klar-Würfel.</p>
          )}
        </section>
      )}

      {state.phase === 'draft' && state.lastScores && (
        <RoundSummary scores={state.lastScores} players={state.players} />
      )}

      {state.phase === 'draft' && (
        <section className="panel">
          <h2>
            Angebot
            {activeDrafter && (
              <>
                {' '}
                · {activeDrafter.name}
                {activeDrafter.id === you ? ' (du) wählst' : ' wählt …'}
              </>
            )}
          </h2>
          <div className="offers">
            {state.draftOffers.map((o) => (
              <OfferButton
                key={o.id}
                color={o.die.color}
                sides={o.die.sides}
                variant={o.die.variant}
                disabled={!youAreActiveDrafter}
                onPick={() => client.sendAction({ type: 'draftPick', offerId: o.id })}
              />
            ))}
          </div>
          {youAreActiveDrafter && (
            <button className="ghost" onClick={() => client.sendAction({ type: 'draftPass' })}>
              Passen
            </button>
          )}
          {draftComplete && <p className="muted">Alle haben gewählt.</p>}
        </section>
      )}

      <div className="actions">
        {isHost ? (
          <button
            onClick={() => client.sendAction({ type: 'advance' })}
            disabled={state.phase === 'draft' && !draftComplete}
          >
            {state.phase === 'draft'
              ? state.round >= state.config.totalRounds
                ? 'Partie beenden →'
                : 'Nächste Runde →'
              : 'Weiter →'}
          </button>
        ) : (
          <p className="muted">Der Host schaltet die Phasen weiter.</p>
        )}
        <button
          className="ghost"
          onClick={() => {
            client.leave();
            onBack();
          }}
        >
          Verlassen
        </button>
      </div>

      {client.error && <p className="error">{client.error}</p>}
    </div>
  );
}

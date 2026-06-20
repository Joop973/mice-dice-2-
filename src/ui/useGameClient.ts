// React-Anbindung an die Transport-Schicht (src/net). Hält den Verbindungs- und
// Spielzustand, den der autoritative Server/Loopback schickt, und stellt
// imperative Aktionen bereit. Das net-Modul bleibt dadurch frei von React.

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  type ClientMessage,
  type GameAction,
  type RoomCode,
  type SeatId,
  type SeatInfo,
  type ServerMessage,
  type Transport,
} from '../net';
import type { GameState } from '../engine';
import type { Difficulty } from '../ai';

export interface CreateOpts {
  name: string;
  ais?: number;
  difficulty?: Difficulty;
}

export interface GameClient {
  connected: boolean;
  you: SeatId | null;
  code: RoomCode | null;
  seats: SeatInfo[];
  state: GameState | null;
  started: boolean;
  error: string | null;
  /** Verbindet über die Transport-Fabrik und erstellt einen Raum. */
  createRoom(transport: () => Transport, opts: CreateOpts): void;
  /** Verbindet über die Transport-Fabrik und tritt einem Raum bei. */
  joinRoom(transport: () => Transport, code: RoomCode, name: string): void;
  start(): void;
  sendAction(action: GameAction): void;
  leave(): void;
}

export function useGameClient(): GameClient {
  const [connected, setConnected] = useState(false);
  const [you, setYou] = useState<SeatId | null>(null);
  const [code, setCode] = useState<RoomCode | null>(null);
  const [seats, setSeats] = useState<SeatInfo[]>([]);
  const [state, setState] = useState<GameState | null>(null);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const transportRef = useRef<Transport | null>(null);

  const handle = useCallback((msg: ServerMessage) => {
    switch (msg.kind) {
      case 'welcome':
        setYou(msg.you);
        setCode(msg.code);
        setError(null);
        break;
      case 'lobby':
        setSeats(msg.seats);
        setStarted(msg.started);
        setCode(msg.code);
        break;
      case 'state':
        setState(msg.state);
        setStarted(true);
        break;
      case 'error':
        setError(msg.message);
        break;
    }
  }, []);

  const connect = useCallback(
    (factory: () => Transport) => {
      transportRef.current?.close();
      const t = factory();
      t.onMessage(handle);
      transportRef.current = t;
      setConnected(true);
    },
    [handle]
  );

  const send = useCallback((msg: ClientMessage) => {
    transportRef.current?.send(msg);
  }, []);

  const createRoom = useCallback(
    (factory: () => Transport, opts: CreateOpts) => {
      connect(factory);
      send({ kind: 'create', name: opts.name, ais: opts.ais, difficulty: opts.difficulty });
    },
    [connect, send]
  );

  const joinRoom = useCallback(
    (factory: () => Transport, roomCode: RoomCode, name: string) => {
      connect(factory);
      send({ kind: 'join', code: roomCode, name });
    },
    [connect, send]
  );

  const start = useCallback(() => send({ kind: 'start' }), [send]);
  const sendAction = useCallback((action: GameAction) => send({ kind: 'action', action }), [send]);

  const leave = useCallback(() => {
    send({ kind: 'leave' });
    transportRef.current?.close();
    transportRef.current = null;
    setConnected(false);
    setYou(null);
    setCode(null);
    setSeats([]);
    setState(null);
    setStarted(false);
    setError(null);
  }, [send]);

  // Transport beim Unmount sauber schließen.
  useEffect(() => () => transportRef.current?.close(), []);

  return {
    connected,
    you,
    code,
    seats,
    state,
    started,
    error,
    createRoom,
    joinRoom,
    start,
    sendAction,
    leave,
  };
}

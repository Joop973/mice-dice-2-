// Autoritativer Spielraum: hält Sitzplätze + GameState und wendet validierte
// Aktionen über die REINE Engine an. Server und lokaler Loopback-Transport
// nutzen denselben Code – so ist „dieselbe Engine lokal wie online" eingelöst.
//
// Bewusst ohne Netzwerk/IO: Funktionen nehmen Raum + Aktion (+ injizierten RNG)
// und liefern einen neuen Raum. Der RNG wird vom Aufrufer gehalten (der Server
// besitzt pro Raum eine Instanz), damit der Zufall serverseitig autoritativ ist.

import {
  advancePhase,
  draftPass,
  draftPick,
  startGame,
  swapClearDice,
  type GameConfig,
  type GameState,
  type NewPlayer,
  type RNG,
} from '../engine';
import { aiTakePhaseAction, type Difficulty } from '../ai';
import type { GameAction, RoomCode, SeatId, SeatInfo } from './protocol';

export const MAX_SEATS = 4;

export interface Seat {
  /** Engine-Spieler-ID. Wird bei Spielstart anhand der Sitzreihenfolge vergeben. */
  id: SeatId;
  name: string;
  isAI: boolean;
  /** Mensch verbunden? KI-Sitze gelten immer als „verbunden". */
  connected: boolean;
}

export interface Room {
  code: RoomCode;
  hostSeat: SeatId;
  difficulty: Difficulty;
  config?: Partial<GameConfig>;
  seats: Seat[];
  started: boolean;
  state: GameState | null;
}

export interface ActionResult {
  room: Room;
  /** Gesetzt, wenn die Aktion abgelehnt wurde (Raum bleibt unverändert). */
  error?: string;
}

/** Vergibt Engine-konforme Sitz-IDs ('p0', 'p1', …) entlang der Reihenfolge. */
function renumber(seats: Seat[]): Seat[] {
  return seats.map((s, i) => ({ ...s, id: `p${i}` }));
}

export function createRoom(
  code: RoomCode,
  hostName: string,
  opts: {
    ais?: number;
    difficulty?: Difficulty;
    config?: Partial<GameConfig>;
  } = {}
): Room {
  const seats: Seat[] = [{ id: 'p0', name: hostName, isAI: false, connected: true }];
  const aiCount = Math.max(0, Math.min(opts.ais ?? 0, MAX_SEATS - 1));
  for (let i = 0; i < aiCount; i++) {
    seats.push({ id: `p${seats.length}`, name: `KI ${i + 1}`, isAI: true, connected: true });
  }
  return {
    code,
    hostSeat: 'p0',
    difficulty: opts.difficulty ?? 'medium',
    config: opts.config,
    seats: renumber(seats),
    started: false,
    state: null,
  };
}

/** Fügt einen menschlichen Sitz hinzu (nur vor Spielstart). Gibt die neue ID. */
export function joinRoom(
  room: Room,
  name: string
): { room: Room; seat?: SeatId; error?: string } {
  if (room.started) return { room, error: 'Partie läuft bereits.' };
  if (room.seats.length >= MAX_SEATS) return { room, error: 'Raum ist voll.' };
  const seats = renumber([
    ...room.seats,
    { id: 'tmp', name, isAI: false, connected: true },
  ]);
  const seat = seats[seats.length - 1].id;
  return { room: { ...room, seats }, seat };
}

/** Entfernt einen Sitz. Vor Spielstart wird neu nummeriert; danach nur Trennung. */
export function leaveRoom(room: Room, seatId: SeatId): Room {
  if (room.started) {
    // Im laufenden Spiel bleibt der Sitz erhalten (KI/Auto-Play übernimmt),
    // wird aber als getrennt markiert.
    return {
      ...room,
      seats: room.seats.map((s) => (s.id === seatId ? { ...s, connected: false } : s)),
    };
  }
  const remaining = room.seats.filter((s) => s.id !== seatId);
  if (remaining.length === 0) return { ...room, seats: [] };
  // Position des bisherigen Hosts in der verbleibenden Reihenfolge merken, BEVOR
  // neu nummeriert wird (renumber vergibt 'p{index}' entlang dieser Reihenfolge).
  const hostIndex = remaining.findIndex((s) => s.id === room.hostSeat);
  const seats = renumber(remaining);
  const hostSeat = hostIndex >= 0 ? seats[hostIndex].id : seats[0].id;
  return { ...room, seats, hostSeat };
}

export function startRoom(room: Room, rng: RNG): ActionResult {
  if (room.started) return { room, error: 'Partie läuft bereits.' };
  if (room.seats.length < 2) return { room, error: 'Mindestens 2 Mäuse nötig.' };

  const players: NewPlayer[] = room.seats.map((s) => ({ name: s.name, isAI: s.isAI }));
  // startGame nutzt einen eigenen Seed; wir würfeln Runde 1 deterministisch über
  // den geteilten RNG, indem wir denselben Seed-Strom verwenden.
  const seed = Math.floor(rng.next() * 0xffffffff) >>> 0;
  const { state } = startGame({ players, seed, config: room.config });
  return { room: { ...room, started: true, state } };
}

export function seatInfos(room: Room): SeatInfo[] {
  return room.seats.map((s) => ({
    id: s.id,
    name: s.name,
    isAI: s.isAI,
    connected: s.connected,
    isHost: s.id === room.hostSeat,
  }));
}

/** Soll dieser Sitz automatisch (KI) gespielt werden? KI oder getrennter Mensch. */
function isBotSeat(room: Room, seatId: SeatId): boolean {
  const seat = room.seats.find((s) => s.id === seatId);
  return !seat || seat.isAI || !seat.connected;
}

/** KI-/Auto-Sitze würfeln in der Swap-Phase einmalig ihre Klar-Würfel neu. */
function runAiSwaps(room: Room, state: GameState, rng: RNG): GameState {
  let s = state;
  for (const seat of room.seats) {
    if (isBotSeat(room, seat.id)) s = aiTakePhaseAction(s, seat.id, room.difficulty, rng);
  }
  return s;
}

/** Spielt im Draft alle KI-/Auto-Sitze ab, bis ein Mensch am Zug ist. */
function runAiDrafts(room: Room, state: GameState, rng: RNG): GameState {
  let s = state;
  let guard = 0;
  while (s.phase === 'draft' && guard++ < MAX_SEATS + 1) {
    const next = s.players.find((p) => !s.draftedThisPhase.includes(p.id));
    if (!next || !isBotSeat(room, next.id)) break;
    s = aiTakePhaseAction(s, next.id, room.difficulty, rng);
  }
  return s;
}

/**
 * Validiert und wendet eine Client-Aktion an. Mirror der Einzelgerät-Logik aus
 * App.tsx, nur serverseitig autoritativ und mit Zug-/Eigentumsprüfung.
 */
export function applyAction(
  room: Room,
  actor: SeatId,
  action: GameAction,
  rng: RNG
): ActionResult {
  if (!room.started || !room.state) return { room, error: 'Partie nicht gestartet.' };
  const state = room.state;

  switch (action.type) {
    case 'advance': {
      if (actor !== room.hostSeat) return { room, error: 'Nur der Host kann weiterschalten.' };
      if (state.phase === 'draft') {
        const open = state.players.some((p) => !state.draftedThisPhase.includes(p.id));
        if (open) return { room, error: 'Es haben noch nicht alle gedraftet.' };
      }
      let next = advancePhase(state, rng);
      if (next.phase === 'swap') next = runAiSwaps(room, next, rng);
      if (next.phase === 'draft') next = runAiDrafts(room, next, rng);
      return { room: { ...room, state: next } };
    }

    case 'swap': {
      if (state.phase !== 'swap') return { room, error: 'Tausch nur in der Tausch-Phase.' };
      const player = state.players.find((p) => p.id === actor);
      if (!player) return { room, error: 'Unbekannter Sitz.' };
      const ownClear = new Set(
        player.rolled.filter((d) => d.color === 'clear').map((d) => d.id)
      );
      if (!action.dieIds.every((id) => ownClear.has(id))) {
        return { room, error: 'Nur eigene Klar-Würfel können getauscht werden.' };
      }
      if (action.dieIds.length === 0) return { room };
      const next = swapClearDice(state, actor, action.dieIds, rng);
      return { room: { ...room, state: next } };
    }

    case 'draftPick':
    case 'draftPass': {
      if (state.phase !== 'draft') return { room, error: 'Draft nur in der Draft-Phase.' };
      const active = state.players.find((p) => !state.draftedThisPhase.includes(p.id));
      if (!active) return { room, error: 'Draft ist abgeschlossen.' };
      if (active.id !== actor) return { room, error: 'Du bist nicht am Zug.' };
      let next =
        action.type === 'draftPick'
          ? draftPick(state, actor, action.offerId)
          : draftPass(state, actor);
      if (next === state) return { room, error: 'Ungültiger Draft-Zug.' };
      next = runAiDrafts(room, next, rng);
      return { room: { ...room, state: next } };
    }
  }
}

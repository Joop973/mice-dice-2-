// Autoritativer Online-Server für Dice Mice.
//
// Bewusst dünn: die gesamte Spiel-/Lobby-Logik liegt im getesteten, geteilten
// Kern unter src/net (room, lobby) und src/engine + src/ai. Der Server kümmert
// sich nur um WebSocket-Transport, Verbindungs-/Sitz-Zuordnung und Broadcast.
//
// Start (separat vom Client-Build):
//   npm run dev:server      # mit Auto-Reload (tsx watch)
//   npm run start:server    # einmalig
//
// Diese Datei ist NICHT Teil des Client-Bundles oder von `tsc -b` (steht nicht in
// tsconfig.app.json). Sie wird über `tsx` direkt unter Node ausgeführt.

import { randomUUID } from 'node:crypto';
import { WebSocketServer, type WebSocket } from 'ws';
import {
  applyAction,
  joinRoom,
  leaveRoom,
  reconnectSeat,
  seatInfos,
  startRoom,
  Lobby,
} from '../src/net';
import type { ClientMessage, RoomCode, SeatId, ServerMessage } from '../src/net';
import { TokenBucket, isRoomIdle } from './limits';

const PORT = Number(process.env.PORT ?? 8787);
/** Heartbeat-Intervall: tote Sockets werden nach spätestens 2×30s erkannt. */
const HEARTBEAT_MS = 30_000;
/** Verwaiste Räume (keine Verbindung) nach dieser Leerlaufzeit aufräumen. */
const ROOM_TTL_MS = 30 * 60_000;
const SWEEP_MS = 60_000;
/** Rate-Limit pro Verbindung: bis 20 Nachrichten Spitze, 5/s Nachfüllung. */
const RATE_CAPACITY = 20;
const RATE_REFILL_PER_SEC = 5;

const lobby = new Lobby();
/** Verbindungen je Raum, damit wir den autoritativen Zustand broadcasten können. */
const connections = new Map<RoomCode, Map<SeatId, WebSocket>>();
/** Geheimes Token je Sitz – nachweis fürs Wiederverbinden nach Abbruch. */
const seatTokens = new Map<RoomCode, Map<SeatId, string>>();
/** Zeitpunkt der letzten Aktivität je Raum (für TTL-Aufräumen). */
const roomActivity = new Map<RoomCode, number>();

/** ws-Socket mit Heartbeat-Markierung (per pong gesetzt). */
type AliveSocket = WebSocket & { isAlive?: boolean };

interface ConnState {
  code: RoomCode | null;
  seat: SeatId | null;
  bucket: TokenBucket;
}

function issueToken(code: RoomCode, seat: SeatId): string {
  let tokens = seatTokens.get(code);
  if (!tokens) {
    tokens = new Map();
    seatTokens.set(code, tokens);
  }
  const token = randomUUID();
  tokens.set(seat, token);
  return token;
}

function touch(code: RoomCode): void {
  roomActivity.set(code, Date.now());
}

function send(ws: WebSocket, msg: ServerMessage): void {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(msg));
}

function broadcast(code: RoomCode, msg: ServerMessage): void {
  const conns = connections.get(code);
  if (!conns) return;
  for (const ws of conns.values()) send(ws, msg);
}

function broadcastLobby(code: RoomCode): void {
  const entry = lobby.get(code);
  if (!entry) return;
  broadcast(code, {
    kind: 'lobby',
    code,
    seats: seatInfos(entry.room),
    started: entry.room.started,
  });
}

function broadcastState(code: RoomCode): void {
  const entry = lobby.get(code);
  if (entry?.room.state) broadcast(code, { kind: 'state', state: entry.room.state });
}

function register(code: RoomCode, seat: SeatId, ws: WebSocket): void {
  let conns = connections.get(code);
  if (!conns) {
    conns = new Map();
    connections.set(code, conns);
  }
  conns.set(seat, ws);
}

const wss = new WebSocketServer({ port: PORT });

wss.on('connection', (ws: AliveSocket) => {
  const conn: ConnState = {
    code: null,
    seat: null,
    bucket: new TokenBucket(RATE_CAPACITY, RATE_REFILL_PER_SEC),
  };

  ws.isAlive = true;
  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('message', (data: Buffer) => {
    if (!conn.bucket.tryRemove()) {
      send(ws, { kind: 'error', message: 'Zu viele Anfragen – bitte kurz warten.' });
      return;
    }
    let msg: ClientMessage;
    try {
      msg = JSON.parse(data.toString()) as ClientMessage;
    } catch {
      send(ws, { kind: 'error', message: 'Ungültige Nachricht.' });
      return;
    }
    handle(ws, conn, msg);
  });

  ws.on('close', () => {
    if (!conn.code || !conn.seat) return;
    const entry = lobby.get(conn.code);
    if (entry) {
      lobby.update(conn.code, leaveRoom(entry.room, conn.seat));
      connections.get(conn.code)?.delete(conn.seat);
      touch(conn.code);
      broadcastLobby(conn.code);
      // Im laufenden Spiel übernimmt KI/Auto-Play den getrennten Sitz beim
      // nächsten Host-Advance/Draft; der Sitz bleibt für ein Rejoin erhalten.
    }
  });
});

// Heartbeat: tote Verbindungen erkennen und schließen, damit Sitze nicht
// dauerhaft als „verbunden" gelten und Ressourcen belegt bleiben.
const heartbeat = setInterval(() => {
  for (const client of wss.clients) {
    const ws = client as AliveSocket;
    if (ws.isAlive === false) {
      ws.terminate();
      continue;
    }
    ws.isAlive = false;
    ws.ping();
  }
}, HEARTBEAT_MS);

// Verwaiste Räume (keine Verbindung + Leerlauf) aufräumen.
const sweep = setInterval(() => {
  const now = Date.now();
  for (const code of [...roomActivity.keys()]) {
    const conns = connections.get(code);
    const hasConns = !!conns && conns.size > 0;
    if (isRoomIdle(roomActivity.get(code) ?? now, hasConns, now, ROOM_TTL_MS)) {
      lobby.remove(code);
      connections.delete(code);
      seatTokens.delete(code);
      roomActivity.delete(code);
    }
  }
}, SWEEP_MS);

wss.on('close', () => {
  clearInterval(heartbeat);
  clearInterval(sweep);
});

function handle(ws: WebSocket, conn: ConnState, msg: ClientMessage): void {
  switch (msg.kind) {
    case 'create': {
      const entry = lobby.create(msg.name, {
        ais: msg.ais,
        difficulty: msg.difficulty,
        config: msg.config,
      });
      conn.code = entry.room.code;
      conn.seat = entry.room.hostSeat;
      register(conn.code, conn.seat, ws);
      touch(conn.code);
      const token = issueToken(conn.code, conn.seat);
      send(ws, { kind: 'welcome', code: conn.code, you: conn.seat, token });
      broadcastLobby(conn.code);
      return;
    }

    case 'join': {
      const entry = lobby.get(msg.code);
      if (!entry) {
        send(ws, { kind: 'error', message: 'Raum nicht gefunden.' });
        return;
      }
      const res = joinRoom(entry.room, msg.name);
      if (res.error || !res.seat) {
        send(ws, { kind: 'error', message: res.error ?? 'Beitritt fehlgeschlagen.' });
        return;
      }
      lobby.update(msg.code, res.room);
      conn.code = msg.code;
      conn.seat = res.seat;
      register(conn.code, conn.seat, ws);
      touch(conn.code);
      const token = issueToken(conn.code, conn.seat);
      send(ws, { kind: 'welcome', code: conn.code, you: conn.seat, token });
      broadcastLobby(conn.code);
      return;
    }

    case 'rejoin': {
      const tokens = seatTokens.get(msg.code);
      const entry = lobby.get(msg.code);
      if (!entry || tokens?.get(msg.seat) !== msg.token) {
        send(ws, { kind: 'error', message: 'Wiederverbinden fehlgeschlagen.' });
        return;
      }
      lobby.update(msg.code, reconnectSeat(entry.room, msg.seat));
      conn.code = msg.code;
      conn.seat = msg.seat;
      register(conn.code, conn.seat, ws);
      touch(conn.code);
      send(ws, { kind: 'welcome', code: conn.code, you: conn.seat, token: msg.token });
      broadcastLobby(conn.code);
      broadcastState(conn.code);
      return;
    }

    case 'start': {
      if (!conn.code) return;
      const entry = lobby.get(conn.code);
      if (!entry) return;
      if (conn.seat !== entry.room.hostSeat) {
        send(ws, { kind: 'error', message: 'Nur der Host kann starten.' });
        return;
      }
      const res = startRoom(entry.room, entry.rng);
      if (res.error) {
        send(ws, { kind: 'error', message: res.error });
        return;
      }
      lobby.update(conn.code, res.room);
      touch(conn.code);
      broadcastLobby(conn.code);
      broadcastState(conn.code);
      return;
    }

    case 'action': {
      if (!conn.code || !conn.seat) return;
      const entry = lobby.get(conn.code);
      if (!entry) return;
      const res = applyAction(entry.room, conn.seat, msg.action, entry.rng);
      if (res.error) {
        send(ws, { kind: 'error', message: res.error });
        return;
      }
      lobby.update(conn.code, res.room);
      touch(conn.code);
      broadcastState(conn.code);
      return;
    }

    case 'leave': {
      if (conn.code && conn.seat) {
        const entry = lobby.get(conn.code);
        if (entry) {
          lobby.update(conn.code, leaveRoom(entry.room, conn.seat));
          connections.get(conn.code)?.delete(conn.seat);
          seatTokens.get(conn.code)?.delete(conn.seat);
          touch(conn.code);
          broadcastLobby(conn.code);
        }
      }
      conn.code = null;
      conn.seat = null;
      return;
    }
  }
}

console.log(`Dice Mice Server lauscht auf ws://localhost:${PORT}`);

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

import { WebSocketServer, type WebSocket } from 'ws';
import { applyAction, joinRoom, leaveRoom, seatInfos, startRoom, Lobby } from '../src/net';
import type { ClientMessage, RoomCode, SeatId, ServerMessage } from '../src/net';

const PORT = Number(process.env.PORT ?? 8787);

const lobby = new Lobby();
/** Verbindungen je Raum, damit wir den autoritativen Zustand broadcasten können. */
const connections = new Map<RoomCode, Map<SeatId, WebSocket>>();

interface ConnState {
  code: RoomCode | null;
  seat: SeatId | null;
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

wss.on('connection', (ws: WebSocket) => {
  const conn: ConnState = { code: null, seat: null };

  ws.on('message', (data: Buffer) => {
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
      broadcastLobby(conn.code);
      // Im laufenden Spiel übernimmt KI/Auto-Play den getrennten Sitz beim
      // nächsten Host-Advance/Draft – kein Sonderfall nötig.
    }
  });
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
      send(ws, { kind: 'welcome', code: conn.code, you: conn.seat });
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
      send(ws, { kind: 'welcome', code: conn.code, you: conn.seat });
      broadcastLobby(conn.code);
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
      broadcastState(conn.code);
      return;
    }

    case 'leave': {
      if (conn.code && conn.seat) {
        const entry = lobby.get(conn.code);
        if (entry) {
          lobby.update(conn.code, leaveRoom(entry.room, conn.seat));
          connections.get(conn.code)?.delete(conn.seat);
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

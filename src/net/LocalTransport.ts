// In-Process-Loopback: führt die autoritative Lobby/Room-Logik direkt im Browser
// aus, ohne Netzwerk. Damit läuft der Online-Code-Pfad auch offline (Solo gegen
// KI über exakt dieselbe Transport-Schicht wie online) – die Abstraktion ist so
// von Anfang an „echt" und nicht nur ein Platzhalter.

import { applyAction, leaveRoom, seatInfos, startRoom } from './room';
import { Lobby, type RoomEntry } from './lobby';
import type { ClientMessage, RoomCode, SeatId, ServerMessage } from './protocol';
import type { Transport, ServerMessageHandler } from './transport';

export class LocalTransport implements Transport {
  private handlers = new Set<ServerMessageHandler>();
  private lobby = new Lobby();
  private code: RoomCode | null = null;
  private you: SeatId | null = null;

  onMessage(handler: ServerMessageHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  close(): void {
    if (this.code && this.you) {
      const entry = this.lobby.get(this.code);
      if (entry) this.lobby.update(this.code, leaveRoom(entry.room, this.you));
    }
    this.handlers.clear();
    this.code = null;
    this.you = null;
  }

  send(msg: ClientMessage): void {
    switch (msg.kind) {
      case 'create': {
        const entry = this.lobby.create(msg.name, {
          ais: msg.ais,
          difficulty: msg.difficulty,
          config: msg.config,
        });
        this.code = entry.room.code;
        this.you = entry.room.hostSeat;
        this.emit({ kind: 'welcome', code: entry.room.code, you: this.you });
        this.emitLobby(entry);
        break;
      }
      case 'join': {
        // Loopback bedient nur einen Client; „join" wird wie ein neuer Raum
        // behandelt, falls der Code unbekannt ist.
        const entry = this.lobby.get(msg.code);
        if (!entry) {
          this.emit({ kind: 'error', message: 'Raum nicht gefunden.' });
          return;
        }
        this.code = msg.code;
        this.you = entry.room.hostSeat;
        this.emit({ kind: 'welcome', code: msg.code, you: this.you });
        this.emitLobby(entry);
        break;
      }
      case 'start': {
        const entry = this.requireEntry();
        if (!entry) return;
        const res = startRoom(entry.room, entry.rng);
        if (res.error) {
          this.emit({ kind: 'error', message: res.error });
          return;
        }
        this.lobby.update(entry.room.code, res.room);
        this.emitLobby({ ...entry, room: res.room });
        this.emitState(res.room.code);
        break;
      }
      case 'action': {
        const entry = this.requireEntry();
        if (!entry || !this.you) return;
        const res = applyAction(entry.room, this.you, msg.action, entry.rng);
        if (res.error) {
          this.emit({ kind: 'error', message: res.error });
          return;
        }
        this.lobby.update(entry.room.code, res.room);
        this.emitState(res.room.code);
        break;
      }
      case 'leave': {
        this.close();
        break;
      }
    }
  }

  private requireEntry(): RoomEntry | undefined {
    if (!this.code) {
      this.emit({ kind: 'error', message: 'Kein Raum aktiv.' });
      return undefined;
    }
    const entry = this.lobby.get(this.code);
    if (!entry) this.emit({ kind: 'error', message: 'Raum nicht gefunden.' });
    return entry;
  }

  private emitLobby(entry: RoomEntry): void {
    this.emit({
      kind: 'lobby',
      code: entry.room.code,
      seats: seatInfos(entry.room),
      started: entry.room.started,
    });
  }

  private emitState(code: RoomCode): void {
    const entry = this.lobby.get(code);
    if (entry?.room.state) this.emit({ kind: 'state', state: entry.room.state });
  }

  private emit(msg: ServerMessage): void {
    // Kopie der Handler-Menge, falls ein Handler sich während des Dispatch abmeldet.
    for (const h of [...this.handlers]) h(msg);
  }
}

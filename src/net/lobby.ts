// Lobby-Registry: verwaltet mehrere Räume und vergibt eindeutige Beitrittscodes.
// Hält pro Raum den autoritativen RNG (außerhalb des serialisierbaren Room-Objekts,
// damit der Zufallsstrom serverseitig verbleibt und nicht an Clients geht).
//
// Reine Datenhaltung – Server und Loopback-Transport setzen darauf auf.

import { createRNG, type GameConfig, type RNG } from '../engine';
import { type Difficulty } from '../ai';
import { createRoom, type Room } from './room';
import type { RoomCode } from './protocol';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // ohne leicht verwechselbare Zeichen
const CODE_LENGTH = 4;

export interface RoomEntry {
  room: Room;
  rng: RNG;
}

export class Lobby {
  private rooms = new Map<RoomCode, RoomEntry>();

  private nextCode(rng: RNG): RoomCode {
    for (let attempt = 0; attempt < 50; attempt++) {
      let code = '';
      for (let i = 0; i < CODE_LENGTH; i++) {
        code += CODE_ALPHABET[Math.floor(rng.next() * CODE_ALPHABET.length)];
      }
      if (!this.rooms.has(code)) return code;
    }
    throw new Error('Konnte keinen freien Raumcode erzeugen.');
  }

  /** Legt einen Raum an und gibt Code + Eintrag zurück. */
  create(
    hostName: string,
    opts: { ais?: number; difficulty?: Difficulty; config?: Partial<GameConfig>; seed?: number } = {}
  ): RoomEntry {
    const seed = opts.seed ?? (Date.now() >>> 0) ^ Math.floor(Math.random() * 0xffffffff);
    const rng = createRNG(seed >>> 0);
    const code = this.nextCode(rng);
    const room = createRoom(code, hostName, opts);
    const entry: RoomEntry = { room, rng };
    this.rooms.set(code, entry);
    return entry;
  }

  get(code: RoomCode): RoomEntry | undefined {
    return this.rooms.get(code);
  }

  /** Ersetzt den Raum-Zustand eines Eintrags (RNG bleibt erhalten). */
  update(code: RoomCode, room: Room): void {
    const entry = this.rooms.get(code);
    if (entry) entry.room = room;
  }

  remove(code: RoomCode): void {
    this.rooms.delete(code);
  }

  get size(): number {
    return this.rooms.size;
  }
}

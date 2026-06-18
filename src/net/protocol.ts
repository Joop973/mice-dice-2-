// Netzwerk-Protokoll für den Online-Modus.
//
// Der Server ist AUTORITATIV: Clients schicken nur Absichten (GameAction), der
// Server validiert sie gegen die reine Engine und schickt den maßgeblichen
// GameState zurück. Dadurch kann kein Client den Spielstand fälschen, und
// dieselbe Engine läuft lokal (Pass-and-Play / Solo) wie serverseitig.
//
// Diese Datei enthält ausschließlich Typen – keine Logik, keine Transport-Details.

import type { GameConfig, GameState } from '../engine';
import type { Difficulty } from '../ai';

/** Sitzplatz-Kennung; entspricht der Engine-Spieler-ID ('p0', 'p1', …). */
export type SeatId = string;

/** Kurzer, menschlich tippbarer Beitrittscode eines Raums (z. B. 'KQ4D'). */
export type RoomCode = string;

/**
 * Aktion, die ein Client beim Server anfragt. Der Server entscheidet, ob der
 * anfragende Sitz sie ausführen darf (Host-/Eigentums-/Zugprüfung).
 */
export type GameAction =
  | { type: 'advance' } // nur Host: zur nächsten Phase / Runde schalten
  | { type: 'swap'; dieIds: string[] } // eigene Klar-Würfel neu werfen
  | { type: 'draftPick'; offerId: string } // aktiver Drafter: Würfel nehmen
  | { type: 'draftPass' }; // aktiver Drafter: passen

/** Sitzplatz-Info für die Lobby-/Spielanzeige. */
export interface SeatInfo {
  id: SeatId;
  name: string;
  isAI: boolean;
  connected: boolean;
  isHost: boolean;
}

/** Client → Server. */
export type ClientMessage =
  | {
      kind: 'create';
      name: string;
      ais?: number;
      difficulty?: Difficulty;
      config?: Partial<GameConfig>;
    }
  | { kind: 'join'; code: RoomCode; name: string }
  | { kind: 'start' }
  | { kind: 'action'; action: GameAction }
  | { kind: 'leave' };

/** Server → Client. */
export type ServerMessage =
  | { kind: 'welcome'; code: RoomCode; you: SeatId }
  | { kind: 'lobby'; code: RoomCode; seats: SeatInfo[]; started: boolean }
  | { kind: 'state'; state: GameState }
  | { kind: 'error'; message: string };

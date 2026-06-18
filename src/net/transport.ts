// Transport-Abstraktion: trennt die Spiel-/Lobby-Logik von „wie kommen die
// Nachrichten von A nach B". Dieselbe Client-UI kann darüber lokal (Loopback)
// oder online (WebSocket) laufen.

import type { ClientMessage, ServerMessage } from './protocol';

export type ServerMessageHandler = (msg: ServerMessage) => void;

export interface Transport {
  /** Schickt eine Nachricht an den (echten oder simulierten) Server. */
  send(msg: ClientMessage): void;
  /** Registriert einen Empfänger; gibt eine Abmelde-Funktion zurück. */
  onMessage(handler: ServerMessageHandler): () => void;
  /** Verbindung schließen / Ressourcen freigeben. */
  close(): void;
}

// Online-Transport über WebSocket. Serialisiert Client-/Server-Nachrichten als
// JSON. Puffert ausgehende Nachrichten, bis die Verbindung offen ist, und
// verbindet bei unerwartetem Abbruch automatisch mit exponentiellem Backoff neu.
//
// Verbindungswechsel meldet der Transport als lokal erzeugte Server-Nachrichten
// (`reconnecting`/`reconnected`), damit die UI ein Rejoin auslösen kann, ohne dass
// die Transport-Schnittstelle erweitert werden muss.

import type { ClientMessage, ServerMessage } from './protocol';
import type { Transport, ServerMessageHandler } from './transport';

/** Backoff-Stufen in ms; nach dem letzten Eintrag wird endgültig aufgegeben. */
const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 16000];

export class WebSocketTransport implements Transport {
  private ws: WebSocket | null = null;
  private handlers = new Set<ServerMessageHandler>();
  private outbox: string[] = [];
  private open = false;
  /** Verhindert Reconnect nach absichtlichem close(). */
  private closed = false;
  private attempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly url: string) {
    this.connect();
  }

  private connect(): void {
    const ws = new WebSocket(this.url);
    this.ws = ws;

    ws.addEventListener('open', () => {
      this.open = true;
      const wasReconnect = this.attempts > 0;
      this.attempts = 0;
      for (const raw of this.outbox) ws.send(raw);
      this.outbox = [];
      // Nach einem erfolgreichen Wiederaufbau die UI informieren, damit sie ein
      // Rejoin senden kann. Beim ersten Verbindungsaufbau ist das nicht nötig.
      if (wasReconnect) this.emit({ kind: 'reconnected' });
    });

    ws.addEventListener('message', (ev) => {
      let msg: ServerMessage;
      try {
        msg = JSON.parse(typeof ev.data === 'string' ? ev.data : '') as ServerMessage;
      } catch {
        return; // unverständliche Nachricht ignorieren
      }
      this.emit(msg);
    });

    ws.addEventListener('close', () => {
      this.open = false;
      if (this.closed) return;
      this.scheduleReconnect();
    });

    ws.addEventListener('error', () => {
      // Der folgende 'close' steuert den Reconnect; hier nur einmalig melden.
      if (!this.closed && this.attempts === 0)
        this.emit({ kind: 'error', message: 'Verbindungsfehler.' });
    });
  }

  private scheduleReconnect(): void {
    if (this.attempts >= RECONNECT_DELAYS.length) {
      this.emit({ kind: 'error', message: 'Verbindung getrennt.' });
      return;
    }
    const delay = RECONNECT_DELAYS[this.attempts];
    this.attempts++;
    this.emit({ kind: 'reconnecting' });
    this.reconnectTimer = setTimeout(() => {
      if (!this.closed) this.connect();
    }, delay);
  }

  send(msg: ClientMessage): void {
    const raw = JSON.stringify(msg);
    if (this.open && this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(raw);
    } else {
      this.outbox.push(raw);
    }
  }

  onMessage(handler: ServerMessageHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  close(): void {
    this.closed = true;
    this.handlers.clear();
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    try {
      this.ws?.close();
    } catch {
      // bereits geschlossen
    }
  }

  private emit(msg: ServerMessage): void {
    for (const h of [...this.handlers]) h(msg);
  }
}

// Online-Transport über WebSocket. Serialisiert Client-/Server-Nachrichten als
// JSON. Puffert ausgehende Nachrichten, bis die Verbindung offen ist, und meldet
// Verbindungsabbrüche als Fehler-Nachricht (die UI kann dann neu verbinden).

import type { ClientMessage, ServerMessage } from './protocol';
import type { Transport, ServerMessageHandler } from './transport';

export class WebSocketTransport implements Transport {
  private ws: WebSocket;
  private handlers = new Set<ServerMessageHandler>();
  private outbox: string[] = [];
  private open = false;

  constructor(url: string) {
    this.ws = new WebSocket(url);

    this.ws.addEventListener('open', () => {
      this.open = true;
      for (const raw of this.outbox) this.ws.send(raw);
      this.outbox = [];
    });

    this.ws.addEventListener('message', (ev) => {
      let msg: ServerMessage;
      try {
        msg = JSON.parse(typeof ev.data === 'string' ? ev.data : '') as ServerMessage;
      } catch {
        return; // unverständliche Nachricht ignorieren
      }
      this.emit(msg);
    });

    this.ws.addEventListener('close', () => {
      this.open = false;
      this.emit({ kind: 'error', message: 'Verbindung getrennt.' });
    });

    this.ws.addEventListener('error', () => {
      this.emit({ kind: 'error', message: 'Verbindungsfehler.' });
    });
  }

  send(msg: ClientMessage): void {
    const raw = JSON.stringify(msg);
    if (this.open && this.ws.readyState === WebSocket.OPEN) {
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
    this.handlers.clear();
    try {
      this.ws.close();
    } catch {
      // bereits geschlossen
    }
  }

  private emit(msg: ServerMessage): void {
    for (const h of [...this.handlers]) h(msg);
  }
}

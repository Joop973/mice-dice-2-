// Reine, testbare Helfer für die Server-Härtung (Rate-Limit + Raum-Aufräumen).
// Bewusst ohne IO/Zeit-Abhängigkeit: „now" wird hereingereicht, damit die Logik
// deterministisch testbar bleibt (server/__tests__/limits.test.ts).

/**
 * Einfacher Token-Bucket pro Verbindung. Erlaubt kurze Spitzen bis `capacity`
 * und füllt mit `refillPerSec` Tokens/Sekunde nach. Schützt den Server vor
 * Nachrichtenfluten einzelner Clients.
 */
export class TokenBucket {
  private tokens: number;
  private last: number;

  constructor(
    private readonly capacity: number,
    private readonly refillPerSec: number,
    now: number = Date.now()
  ) {
    this.tokens = capacity;
    this.last = now;
  }

  /** Versucht, `cost` Tokens zu entnehmen. Gibt false zurück, wenn zu wenige da sind. */
  tryRemove(now: number = Date.now(), cost = 1): boolean {
    const elapsedSec = Math.max(0, now - this.last) / 1000;
    this.tokens = Math.min(this.capacity, this.tokens + elapsedSec * this.refillPerSec);
    this.last = now;
    if (this.tokens < cost) return false;
    this.tokens -= cost;
    return true;
  }
}

/**
 * Soll ein Raum aufgeräumt werden? Nur wenn er KEINE offene Verbindung mehr hat
 * und seit `ttlMs` keine Aktivität zeigte – so verschwinden verwaiste Räume,
 * aber laufende (auch pausierte, solange jemand verbunden ist) bleiben erhalten.
 */
export function isRoomIdle(
  lastActivity: number,
  hasConnections: boolean,
  now: number,
  ttlMs: number
): boolean {
  if (hasConnections) return false;
  return now - lastActivity > ttlMs;
}

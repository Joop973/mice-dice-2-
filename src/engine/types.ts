// Reine Typdefinitionen für die Spiel-Engine.
// Diese Datei enthält KEINE Logik, KEINE UI- und KEINE Netzwerk-Abhängigkeiten,
// damit dieselbe Engine lokal (Pass-and-Play / Solo) und online laufen kann.

/** Alle zehn Würfelfarben aus dem Würfel-Katalog. */
export type DieColor =
  | 'yellow'
  | 'green'
  | 'blue'
  | 'purple'
  | 'red'
  | 'clear'
  | 'pink'
  | 'orange'
  | 'sabotage'
  | 'brown';

/** Optische / regeltechnische Variante einer Farbe (z. B. Blau-Glitzer). */
export type DieVariant = 'normal' | 'glitter';

/**
 * Definition eines Würfels im Beutel: Farbe + Seitenzahl (+ optionale Variante
 * und optionaler, expliziter Face-Satz). Der Würfelbeutel ist eine LISTE solcher
 * Definitionen — "eine Farbe = ein Würfel" gilt ausdrücklich NICHT.
 */
export interface DieDef {
  /** Stabile ID einer konkreten Würfel-Instanz im Beutel. */
  id: string;
  color: DieColor;
  sides: number;
  variant: DieVariant;
  /**
   * Expliziter Face-Satz. Wenn gesetzt, wird beim Würfeln aus diesen Werten
   * gezogen (z. B. Rot mit negativen Werten, Braun mit Gruppen-Faces, Orange W3).
   * Wenn nicht gesetzt, gilt ein Standard-Würfel 1..sides.
   */
  faces?: number[];
}

/** Ein geworfener Würfel: Definition plus konkret gewürfelter Wert. */
export interface RolledDie extends DieDef {
  value: number;
  /** true, wenn dieser Würfel als Mitleidswürfel dazugekommen ist. */
  isPity?: boolean;
}

/** Eintrag im Draft-Angebot. */
export interface DraftOffer {
  id: string;
  die: DieDef;
}

/** Die vier Phasen pro Runde, in fester Reihenfolge. */
export type Phase = 'roll' | 'pity' | 'swap' | 'draft';

export const PHASE_ORDER: readonly Phase[] = ['roll', 'pity', 'swap', 'draft'] as const;

export interface Player {
  id: string;
  name: string;
  isAI: boolean;
  /** Würfelbeutel: alle Würfel, die dieser Spieler besitzt. */
  bag: DieDef[];
  /** Ergebnis des aktuellen Wurfs (nur in/ab der Roll-Phase gefüllt). */
  rolled: RolledDie[];
  /** Punkte in der aktuellen Runde. */
  roundScore: number;
  /** Gesamtpunkte über alle Runden. */
  totalScore: number;
  /** Hält dieser Spieler aktuell die Käse-Krone? */
  hasCrown: boolean;
}

export interface GameState {
  config: GameConfig;
  players: Player[];
  round: number;
  phase: Phase;
  /** Aktuelles Draft-Angebot (nur in der Draft-Phase relevant). */
  draftOffers: DraftOffer[];
  /** Spieler-IDs, die in der laufenden Draft-Phase schon gewählt haben. */
  draftedThisPhase: string[];
  /** true, sobald Runde 10 abgeschlossen ist. */
  finished: boolean;
  /** Fortlaufender Zähler für eindeutige IDs (Würfel, Angebote). */
  nextId: number;
  /** Protokoll wichtiger Ereignisse (z. B. Sabotage, Kronenwechsel). */
  log: string[];
}

/**
 * Konfigurierbare Balance-Parameter. Bewusst nach außen gelegt, damit im
 * Playtesting an Braun, Rot und Timing-Fragen geschraubt werden kann, ohne die
 * Engine-Logik anzufassen.
 */
export interface GameConfig {
  totalRounds: number;
  /**
   * Braun-Faces. Standard {2,3} (als {2,2,2,3,3,3}). Alternativen für
   * Playtesting: {1,2} oder {1,2,3}.
   */
  brownFaces: number[];
  /** Rot-Faces je Seitenzahl (positive UND negative Werte). */
  redFaces: { 6: number[]; 8: number[] };
  /**
   * Zählt der Klar-Würfel (Klar W6) zur Punktwertung? Standard: nein — Klar ist
   * ein reiner Utility-/Tausch-Würfel. Konfigurierbar für Playtesting.
   */
  clearScores: boolean;
  /** Anzahl der Würfel im Draft-Angebot pro Runde. */
  draftOfferSize: number;
}

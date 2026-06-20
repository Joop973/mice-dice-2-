// Vollständiger Würfel-Katalog (Abschnitt 3 des Gesamtplans) als Daten.
// Reine Definitionen — keine Logik. Grafik-/Material-Zuordnung passiert später
// in der UI (Phase 4, 3D-Würfel); hier nur Farbe, Seiten und Face-Sätze.

import type { DieColor, DieVariant, GameConfig } from './types';

/** Standard-Balance-Konfiguration. */
export const DEFAULT_CONFIG: GameConfig = {
  totalRounds: 10,
  // Braun-Standard {2,3} -> Faces {2,2,2,3,3,3}.
  brownFaces: [2, 2, 2, 3, 3, 3],
  // Rot: High-Variance-Würfel mit echtem Risiko (negative Faces) UND lohnender
  // Oberkante. Erwartungswert leicht über einem normalen Würfel gleicher Größe
  // (W6: 3.67 vs 3.5; W8: 5.5 vs 4.5) als Prämie fürs Risiko, damit Rot
  // überhaupt gewählt wird (Balance-Sim: vorher totes Inhalt bei EV ~1).
  redFaces: {
    6: [-3, -1, 4, 6, 7, 9], // Summe 22, mean 3.67
    8: [-4, -2, 5, 6, 8, 9, 10, 12], // Summe 44, mean 5.5
  },
  clearScores: false,
  draftOfferSize: 6,
  // Gezielteres Rubberbanding als „unter dem Spitzenstand": nur Mäuse unter dem
  // Durchschnitt erhalten Mitleidswürfel (Balance-Sim: ~26 -> ~16 pro Partie).
  pityMode: 'belowAverage',
  // Kronen-Aufwertung (sonst ist die Krone nur Sabotage-Ziel). Werte per
  // Balance-Simulation justiert; siehe RULES_AND_DECISIONS.md.
  crownBonusPerRound: 14,
  crownEndgameBonus: 15,
};

/** Alternative Braun-Face-Sätze für Playtesting. */
export const BROWN_FACE_PRESETS = {
  standard: [2, 2, 2, 3, 3, 3], // {2,3}
  lowOneTwo: [1, 1, 1, 2, 2, 2], // {1,2}
  oneTwoThree: [1, 1, 2, 2, 3, 3], // {1,2,3}
} as const;

/**
 * Eine "Blaupause" für einen draftbaren Würfel (ohne Instanz-ID). Aus diesen
 * Blueprints werden konkrete DieDef-Instanzen mit eindeutiger ID erzeugt.
 */
export interface DieBlueprint {
  color: DieColor;
  sides: number;
  variant: DieVariant;
  /** Wird gegen die Config aufgelöst (Rot/Braun) statt fest verdrahtet. */
  facesFromConfig?: 'red' | 'brown' | 'orange';
}

/**
 * Der vollständige Katalog aller draftbaren Würfel-Typen. Mehrere Einträge pro
 * Farbe sind ausdrücklich vorgesehen.
 */
export const DICE_CATALOG: DieBlueprint[] = [
  // Gelb — höchste Gelb-Summe gewinnt die Käse-Krone.
  { color: 'yellow', sides: 6, variant: 'normal' },
  { color: 'yellow', sides: 8, variant: 'normal' },
  // Grün — Standard-Summe.
  { color: 'green', sides: 20, variant: 'normal' },
  // Blau — normal + Glitzer-Variante; zählen für Orange als EINE Farbe.
  { color: 'blue', sides: 6, variant: 'normal' },
  { color: 'blue', sides: 8, variant: 'normal' },
  { color: 'blue', sides: 12, variant: 'normal' },
  { color: 'blue', sides: 6, variant: 'glitter' },
  { color: 'blue', sides: 8, variant: 'glitter' },
  { color: 'blue', sides: 12, variant: 'glitter' },
  // Lila — Standard-Summe.
  { color: 'purple', sides: 8, variant: 'normal' },
  { color: 'purple', sides: 12, variant: 'normal' },
  // Rot — Faces positiv UND negativ (aus Config).
  { color: 'red', sides: 6, variant: 'normal', facesFromConfig: 'red' },
  { color: 'red', sides: 8, variant: 'normal', facesFromConfig: 'red' },
  // Klar — tauschbar in der Tausch-Phase.
  { color: 'clear', sides: 6, variant: 'normal' },
  // Pink — Standard-Summe.
  { color: 'pink', sides: 12, variant: 'normal' },
  // Orange — W3, Wert × Anzahl verschiedener Farben dieser Runde.
  { color: 'orange', sides: 3, variant: 'normal', facesFromConfig: 'orange' },
  // Sabotage — W8/W12, Summe wird dem Kronenhalter abgezogen.
  { color: 'sabotage', sides: 8, variant: 'normal' },
  { color: 'sabotage', sides: 12, variant: 'normal' },
  // Braun — Faces {2,2,2,3,3,3} (aus Config), Summe × größte Gruppe.
  { color: 'brown', sides: 6, variant: 'normal', facesFromConfig: 'brown' },
];

/** Löst den Face-Satz einer Blueprint gegen die Config auf (falls nötig). */
export function resolveFaces(
  blueprint: DieBlueprint,
  config: GameConfig
): number[] | undefined {
  switch (blueprint.facesFromConfig) {
    case 'red':
      return blueprint.sides === 6 ? config.redFaces[6] : config.redFaces[8];
    case 'brown':
      return config.brownFaces;
    case 'orange':
      return [1, 2, 3];
    default:
      return undefined;
  }
}

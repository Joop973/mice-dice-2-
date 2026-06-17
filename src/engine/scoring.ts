// Reine Wertungslogik. Alle Funktionen sind seiteneffektfrei und arbeiten nur auf
// bereits geworfenen Würfeln (RolledDie). Dadurch sind sie deterministisch und
// einzeln testbar.
//
// TIMING-ENTSCHEIDUNG (offene Frage aus dem Plan, Abschnitt 5):
// Orange und Sabotage werten zum RUNDENENDE, nachdem ALLE Spieler in Phase 1
// geworfen haben. Da zu diesem Zeitpunkt alle Würfe feststehen, gibt es keine
// Reihenfolge-Mehrdeutigkeit. Orange zählt die Farbvielfalt des JEWEILIGEN
// Spielers (seine eigenen, in dieser Runde geworfenen Würfel).

import type { DieColor, Player, RolledDie } from './types';

/** Normalisiert eine Farbe für die Orange-Zählung: Blau-Glitzer zählt als Blau. */
export function colorKey(die: RolledDie): DieColor {
  // Variante spielt für die Farbzählung keine Rolle; Blau == Blau-Glitzer.
  return die.color;
}

/** Summe aller Würfel einer bestimmten Farbe (alle Varianten). */
export function sumOfColor(rolled: RolledDie[], color: DieColor): number {
  return rolled
    .filter((d) => d.color === color)
    .reduce((acc, d) => acc + d.value, 0);
}

/** Gelb-Summe — entscheidet über die Käse-Krone. */
export function yellowSum(rolled: RolledDie[]): number {
  return sumOfColor(rolled, 'yellow');
}

/**
 * Anzahl verschiedener Farben, die ein Spieler in dieser Runde geworfen hat.
 * Blau und Blau-Glitzer zählen als EINE Farbe. Orange und Pink werden — wie alle
 * anderen anwesenden Farben — mitgezählt.
 */
export function distinctColorCount(rolled: RolledDie[]): number {
  const colors = new Set<DieColor>();
  for (const d of rolled) colors.add(colorKey(d));
  return colors.size;
}

/** Orange: (Summe der Orange-Würfel) × Anzahl verschiedener Farben dieser Runde. */
export function orangeScore(rolled: RolledDie[]): number {
  const orangeSum = sumOfColor(rolled, 'orange');
  if (orangeSum === 0) return 0;
  return orangeSum * distinctColorCount(rolled);
}

/**
 * Braun: (Summe aller braunen Würfel) × Größe der größten passenden Gruppe.
 * Ohne Match (alle Werte verschieden) ist der Faktor 1.
 */
export function brownScore(rolled: RolledDie[]): number {
  const browns = rolled.filter((d) => d.color === 'brown');
  if (browns.length === 0) return 0;
  const sum = browns.reduce((acc, d) => acc + d.value, 0);

  const groups = new Map<number, number>();
  for (const d of browns) groups.set(d.value, (groups.get(d.value) ?? 0) + 1);
  const largestGroup = Math.max(...groups.values());

  return sum * largestGroup;
}

/**
 * Basis-Rundenpunkte eines Spielers OHNE Sabotage-Interaktion.
 * Enthält: Gelb, Grün, Blau (beide Varianten), Lila, Pink, Rot (kann negativ
 * sein), Orange, Braun und — falls konfiguriert — Klar.
 * Sabotage zählt NICHT zu den eigenen Punkten (sie ist ein Angriff).
 */
export function baseRoundScore(
  rolled: RolledDie[],
  clearScores: boolean
): number {
  let total = 0;
  total += sumOfColor(rolled, 'yellow');
  total += sumOfColor(rolled, 'green');
  total += sumOfColor(rolled, 'blue');
  total += sumOfColor(rolled, 'purple');
  total += sumOfColor(rolled, 'pink');
  total += sumOfColor(rolled, 'red');
  if (clearScores) total += sumOfColor(rolled, 'clear');
  total += orangeScore(rolled);
  total += brownScore(rolled);
  return total;
}

export interface ScoreBreakdown {
  playerId: string;
  yellow: number;
  base: number;
  distinctColors: number;
  sabotageThrown: number;
  sabotageReceived: number;
  final: number;
  hasCrown: boolean;
}

/**
 * Rangfolge für die Krone: höchste Gelb-Summe zuerst.
 * Tie-Break: wer in dieser Runde am meisten (Basis) gepunktet hat; danach die
 * stabile Spielerreihenfolge. Gibt die Spieler-Indizes in Rang-Reihenfolge.
 */
function crownRanking(
  players: Player[],
  base: number[],
  yellow: number[]
): number[] {
  return players
    .map((_, i) => i)
    .sort((a, b) => {
      if (yellow[b] !== yellow[a]) return yellow[b] - yellow[a];
      if (base[b] !== base[a]) return base[b] - base[a];
      return a - b;
    });
}

/**
 * Wertet eine komplette Runde aus: Basis-Punkte, Krone, Sabotage-Verrechnung.
 * Reine Funktion — verändert die übergebenen Spieler NICHT, sondern liefert eine
 * Aufschlüsselung zurück. Der Engine-Reducer wendet die Ergebnisse an.
 */
export function scoreRound(
  players: Player[],
  clearScores: boolean
): ScoreBreakdown[] {
  const base = players.map((p) => baseRoundScore(p.rolled, clearScores));
  const yellow = players.map((p) => yellowSum(p.rolled));
  const sabotageThrown = players.map((p) => sumOfColor(p.rolled, 'sabotage'));

  const ranking = crownRanking(players, base, yellow);
  const crownIdx = ranking[0];
  const secondIdx = ranking.length > 1 ? ranking[1] : -1;

  const sabotageReceived = players.map(() => 0);
  for (let i = 0; i < players.length; i++) {
    if (sabotageThrown[i] === 0) continue;
    // Ziel ist normalerweise der Kronenhalter; ist der Werfer selbst der
    // Kronenhalter, trifft die Sabotage den Zweitplatzierten.
    const targetIdx = i === crownIdx ? secondIdx : crownIdx;
    if (targetIdx < 0) continue; // kein gültiges Ziel (z. B. nur 1 Spieler)
    sabotageReceived[targetIdx] += sabotageThrown[i];
  }

  return players.map((p, i) => ({
    playerId: p.id,
    yellow: yellow[i],
    base: base[i],
    distinctColors: distinctColorCount(p.rolled),
    sabotageThrown: sabotageThrown[i],
    sabotageReceived: sabotageReceived[i],
    // Werte dürfen negativ werden (Rot/Sabotage).
    final: base[i] - sabotageReceived[i],
    hasCrown: i === crownIdx,
  }));
}

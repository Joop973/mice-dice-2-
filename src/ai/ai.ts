// KI-Gegner für den Solo-Modus.
//
// Bewusst als EIGENES Modul gekapselt: hängt nur von der reinen Engine ab, kennt
// KEINE UI. Dadurch lässt sich dieselbe Logik später serverseitig wiederverwenden,
// wenn ein Online-Spieler ausfällt (Timeout -> KI übernimmt oder überspringt).
//
// Die KI trifft Entscheidungen für die beiden interaktiven Phasen:
//   - swap:  welche Klar-Würfel neu würfeln?
//   - draft: welchen Würfel aus dem Angebot nehmen (oder passen)?
// Würfeln und Mitleidswürfel laufen automatisch in der Engine.

import {
  draftPass,
  draftPick,
  swapClearDice,
  type DieColor,
  type DieDef,
  type GameState,
  type Player,
  type RNG,
} from '../engine';

export type Difficulty = 'easy' | 'medium' | 'hard';

export const DIFFICULTIES: readonly Difficulty[] = ['easy', 'medium', 'hard'] as const;

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Leicht',
  medium: 'Mittel',
  hard: 'Schwer',
};

/** Erwartungswert eines Würfels (Mittel der Faces bzw. (sides+1)/2). */
export function expectedValue(die: DieDef): number {
  if (die.faces && die.faces.length > 0) {
    return die.faces.reduce((a, b) => a + b, 0) / die.faces.length;
  }
  return (die.sides + 1) / 2;
}

/** Verschiedene Farben im Beutel (Blau + Blau-Glitzer zählen als eine Farbe). */
function distinctColorsInBag(bag: DieDef[]): number {
  const colors = new Set<DieColor>();
  for (const d of bag) colors.add(d.color);
  return colors.size;
}

/** Anzahl Würfel einer Farbe im Beutel. */
function countColor(bag: DieDef[], color: DieColor): number {
  return bag.filter((d) => d.color === color).length;
}

/**
 * Heuristischer Wert eines angebotenen Würfels für einen Spieler.
 * `synergy = false` ignoriert Farb-Synergien (mittlere Stärke);
 * `synergy = true` berücksichtigt sie (hohe Stärke).
 */
export function draftHeuristic(
  state: GameState,
  player: Player,
  die: DieDef,
  synergy: boolean
): number {
  const ev = expectedValue(die);
  if (!synergy) {
    // Klar zählt standardmäßig nicht zur Wertung -> kaum Wert.
    if (die.color === 'clear' && !state.config.clearScores) return 0.5;
    return ev;
  }

  switch (die.color) {
    case 'yellow':
      return ev + 1.5; // Beitrag zur Käse-Krone
    case 'orange': {
      // Skaliert mit der Farbvielfalt, die der Spieler erreichen kann.
      const distinct = Math.max(1, distinctColorsInBag(player.bag));
      return ev * distinct;
    }
    case 'sabotage':
      return ev * 0.8; // situativ, vom Spielstand abhängig
    case 'brown': {
      // Gruppen-Synergie: weitere braune Würfel erhöhen den Multiplikator.
      const browns = countColor(player.bag, 'brown');
      return ev * (1 + browns * 0.5);
    }
    case 'clear':
      return state.config.clearScores ? ev : 0.5;
    case 'red':
      return ev; // Erwartungswert enthält bereits die negativen Faces
    default:
      return ev;
  }
}

/** Wählt für einen KI-Spieler die zu tauschenden Klar-Würfel aus. */
export function aiChooseSwap(
  state: GameState,
  playerId: string,
  difficulty: Difficulty
): string[] {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return [];
  // Tauschen lohnt nur, wenn Klar überhaupt wertet.
  if (!state.config.clearScores) return [];
  if (difficulty === 'easy') return [];

  const threshold = difficulty === 'hard' ? 3 : 2;
  return player.rolled
    .filter((d) => d.color === 'clear' && d.value <= threshold)
    .map((d) => d.id);
}

/** Spielkontext aus Sicht eines Spielers, für die strategische (harte) KI. */
interface DraftContext {
  /** Künftige Runden, in denen ein jetzt gedrafteter Würfel noch geworfen wird. */
  roundsLeft: number;
  /** Führt der Spieler (>= bester Gegner)? */
  amLeader: boolean;
  /** Punkte-Rückstand auf den besten Gegner (>= 0). */
  behind: number;
}

function draftContext(state: GameState, player: Player): DraftContext {
  const others = state.players.filter((p) => p.id !== player.id);
  const leaderScore = others.length ? Math.max(...others.map((p) => p.totalScore)) : 0;
  return {
    roundsLeft: Math.max(0, state.config.totalRounds - state.round),
    amLeader: player.totalScore >= leaderScore,
    behind: Math.max(0, leaderScore - player.totalScore),
  };
}

/**
 * Strategischer Würfelwert für die HARTE KI. Anders als der reine
 * Erwartungswert (mittlere KI) berücksichtigt sie:
 *  - Farb-Synergien (Orange × Farbvielfalt, Braun-Stapel),
 *  - dass es sich NICHT lohnt, Gelb aktiv zu stapeln: die Krone bringt zwar
 *    Bonuspunkte, zieht aber Sabotage an (selbstbalancierend) — Gelb wird daher
 *    wie eine normale Summe bewertet, die Krone entsteht organisch,
 *  - Spielstand (Sabotage/Risiko sind im Rückstand mehr wert),
 *  - verbleibende Runden (Build-Arounds wie Braun brauchen Zeit).
 */
export function strategicDraftValue(
  state: GameState,
  player: Player,
  die: DieDef
): number {
  const ev = expectedValue(die);
  const ctx = draftContext(state, player);

  switch (die.color) {
    case 'orange': {
      // Skaliert mit der erreichbaren Farbvielfalt des Spielers.
      const distinct = Math.max(2, distinctColorsInBag(player.bag));
      return ev * distinct;
    }
    case 'brown': {
      // Build-Around: stark steigend mit eigenen Braun-Würfeln. Ein moderater
      // Start-Bonus zündet den Aufbau, solange genug Runden bleiben.
      const browns = countColor(player.bag, 'brown');
      const ramp = 1 + browns * 0.9;
      const starter = browns === 0 ? (ctx.roundsLeft >= 4 ? 1.6 : 0) : browns * 0.6;
      return ev * ramp + starter;
    }
    case 'sabotage': {
      // Zieht dem Kronenhalter Punkte ab: wertvoll, wenn jemand vor mir liegt;
      // defensiv schwächer, wenn ich selbst führe. Skaliert mit dem Rückstand.
      const aggression = ctx.amLeader ? 0.5 : 0.9 + Math.min(0.8, ctx.behind / 40);
      return ev * aggression;
    }
    case 'red':
      // High-Variance: im Rückstand attraktiver (Swings nötig), in Führung weniger.
      return ev * (ctx.amLeader ? 0.95 : 1.1);
    case 'clear':
      return state.config.clearScores ? ev : 0.5;
    default:
      // Gelb, Grün, Blau, Lila, Pink: schlicht die erwartete Summe.
      return ev;
  }
}

export type DraftDecision =
  | { kind: 'pick'; offerId: string }
  | { kind: 'pass' };

/** Wählt für einen KI-Spieler einen Würfel aus dem Angebot (oder passt). */
export function aiChooseDraft(
  state: GameState,
  playerId: string,
  difficulty: Difficulty,
  rng: RNG
): DraftDecision {
  const player = state.players.find((p) => p.id === playerId);
  if (!player || state.draftOffers.length === 0) return { kind: 'pass' };

  if (difficulty === 'easy') {
    const idx = Math.floor(rng.next() * state.draftOffers.length);
    return { kind: 'pick', offerId: state.draftOffers[idx].id };
  }

  // Mittel: reiner Erwartungswert. Hart: kontextbewusste Strategie.
  const value =
    difficulty === 'hard'
      ? (die: DieDef) => strategicDraftValue(state, player, die)
      : (die: DieDef) => draftHeuristic(state, player, die, false);

  let best = state.draftOffers[0];
  let bestScore = -Infinity;
  for (const offer of state.draftOffers) {
    const score = value(offer.die);
    if (score > bestScore) {
      bestScore = score;
      best = offer;
    }
  }
  return { kind: 'pick', offerId: best.id };
}

/**
 * Führt die KI-Aktion für die AKTUELLE Phase aus und liefert den neuen Zustand.
 * Diese Funktion ist der wiederverwendbare Einstiegspunkt — UI (Solo) und später
 * der Server (Spielerausfall) rufen sie identisch auf.
 */
export function aiTakePhaseAction(
  state: GameState,
  playerId: string,
  difficulty: Difficulty,
  rng: RNG
): GameState {
  switch (state.phase) {
    case 'swap': {
      const ids = aiChooseSwap(state, playerId, difficulty);
      return ids.length > 0 ? swapClearDice(state, playerId, ids, rng) : state;
    }
    case 'draft': {
      const decision = aiChooseDraft(state, playerId, difficulty, rng);
      return decision.kind === 'pick'
        ? draftPick(state, playerId, decision.offerId)
        : draftPass(state, playerId);
    }
    default:
      // roll/pity laufen automatisch in der Engine — keine KI-Aktion nötig.
      return state;
  }
}

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

  const synergy = difficulty === 'hard';
  let best = state.draftOffers[0];
  let bestScore = -Infinity;
  for (const offer of state.draftOffers) {
    const score = draftHeuristic(state, player, offer.die, synergy);
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

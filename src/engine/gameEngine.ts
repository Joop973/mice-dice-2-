// Spiel-Engine: Zustands-Maschine für eine Partie Dice Mice.
//
// Strikte Trennung: Diese Datei kennt KEINE UI und KEIN Netzwerk. Sie nimmt einen
// Zustand + eine Aktion (+ optional einen injizierten RNG) und liefert einen neuen
// Zustand. Dadurch läuft dieselbe Engine in Pass-and-Play, Solo (mit KI) und
// später serverseitig im Online-Modus.
//
// Rundenablauf (4 Phasen, feste Reihenfolge):
//   roll  -> würfeln (alle eigenen Würfel)
//   pity  -> Mitleidswürfel an schwächere Spieler
//   swap  -> Klar-Würfel tauschen (neu werfen)
//   draft -> neue Würfel aus dem Angebot wählen
// Gewertet wird beim Übergang swap -> draft (alle Würfe stehen dann fest; das
// Draft-Angebot beeinflusst erst die nächste Runde). Siehe scoring.ts für die
// Timing-Entscheidung zu Orange/Sabotage.

import {
  DEFAULT_CONFIG,
  DICE_CATALOG,
  resolveFaces,
  type DieBlueprint,
} from './diceCatalog';
import { createRNG, pick, randInt, type RNG } from './rng';
import { scoreRound } from './scoring';
import type {
  DieDef,
  DraftOffer,
  GameConfig,
  GameState,
  Player,
  RolledDie,
  ScoreBreakdown,
} from './types';

export interface NewPlayer {
  name: string;
  isAI?: boolean;
}

export interface CreateGameOptions {
  players: NewPlayer[];
  seed?: number;
  config?: Partial<GameConfig>;
}

/** Erzeugt eine konkrete Würfel-Instanz mit eindeutiger ID aus einer Blueprint. */
function instantiate(
  blueprint: DieBlueprint,
  config: GameConfig,
  id: string
): DieDef {
  return {
    id,
    color: blueprint.color,
    sides: blueprint.sides,
    variant: blueprint.variant,
    faces: resolveFaces(blueprint, config),
  };
}

/** Findet die Standard-Startwürfel-Blueprint (1× gelber W6 je Maus). */
const STARTER: DieBlueprint = { color: 'yellow', sides: 6, variant: 'normal' };

/** Wirft genau einen Würfel mit dem injizierten RNG. */
export function rollDie(def: DieDef, rng: RNG): RolledDie {
  const value = def.faces
    ? pick(rng, def.faces)
    : randInt(rng, 1, def.sides);
  return { ...def, value };
}

/** Wirft alle Würfel im Beutel eines Spielers. */
function rollPlayer(player: Player, rng: RNG): RolledDie[] {
  return player.bag.map((die) => rollDie(die, rng));
}

/** Initialisiert eine neue Partie. Würfelt Runde 1 noch NICHT. */
export function createGame(opts: CreateGameOptions): GameState {
  const config: GameConfig = { ...DEFAULT_CONFIG, ...opts.config };
  let nextId = 0;

  const players: Player[] = opts.players.map((p, idx) => {
    const starterDie = instantiate(STARTER, config, `d${nextId++}`);
    return {
      id: `p${idx}`,
      name: p.name,
      isAI: p.isAI ?? false,
      bag: [starterDie],
      rolled: [],
      roundScore: 0,
      totalScore: 0,
      hasCrown: false,
    };
  });

  return {
    config,
    players,
    round: 1,
    phase: 'roll',
    draftOffers: [],
    draftedThisPhase: [],
    finished: false,
    nextId,
    log: [`Runde 1 beginnt.`],
  };
}

/** Hilfsfunktion: tiefe-genug-Kopie eines Spielers für unveränderliche Updates. */
function cloneState(state: GameState): GameState {
  return {
    ...state,
    players: state.players.map((p) => ({ ...p, bag: [...p.bag], rolled: [...p.rolled] })),
    draftOffers: [...state.draftOffers],
    draftedThisPhase: [...state.draftedThisPhase],
    log: [...state.log],
  };
}

/**
 * Roll-Phase: wirft die Beutel ALLER Spieler. Nur in der Roll-Phase erlaubt und
 * nur einmal pro Runde (Wiederholung würfelt nicht erneut).
 */
export function performRoll(state: GameState, rng: RNG): GameState {
  if (state.phase !== 'roll') return state;
  const next = cloneState(state);
  for (const p of next.players) {
    if (p.rolled.length === 0) p.rolled = rollPlayer(p, rng);
  }
  return next;
}

/** Entscheidet anhand des pityMode, welche Spieler einen Mitleidswürfel erhalten. */
function pityEligible(scores: number[], mode: GameConfig['pityMode']): boolean[] {
  const max = Math.max(...scores);
  const min = Math.min(...scores);
  // Alle gleichauf (z. B. Runde 1, alle 0): niemand bekommt einen Mitleidswürfel.
  if (max === min) return scores.map(() => false);
  switch (mode) {
    case 'belowMax':
      return scores.map((s) => s < max);
    case 'belowAverage': {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      return scores.map((s) => s < avg);
    }
    case 'lastPlace':
      return scores.map((s) => s === min);
  }
}

/**
 * Mitleidswürfel-Phase: Spieler im Rückstand (gemäß `config.pityMode`) erhalten
 * einen zusätzlichen gelben W6, der sofort geworfen und dieser Runde
 * gutgeschrieben wird (nicht im Beutel behalten). In Runde 1 (alle 0 Punkte)
 * passiert nichts.
 */
export function distributePity(state: GameState, rng: RNG): GameState {
  const next = cloneState(state);
  const eligible = pityEligible(
    next.players.map((p) => p.totalScore),
    next.config.pityMode
  );
  next.players.forEach((p, i) => {
    if (!eligible[i]) return;
    const die = instantiate(STARTER, next.config, `d${next.nextId++}`);
    p.rolled.push({ ...rollDie(die, rng), isPity: true });
    next.log.push(`${p.name} erhält einen Mitleidswürfel.`);
  });
  return next;
}

/**
 * Swap-Phase: ein Spieler wirft ausgewählte KLAR-Würfel neu. Andere Farben
 * können nicht getauscht werden.
 */
export function swapClearDice(
  state: GameState,
  playerId: string,
  dieIds: string[],
  rng: RNG
): GameState {
  if (state.phase !== 'swap') return state;
  const next = cloneState(state);
  const player = next.players.find((p) => p.id === playerId);
  if (!player) return state;
  const toSwap = new Set(dieIds);
  player.rolled = player.rolled.map((d) =>
    d.color === 'clear' && toSwap.has(d.id) ? rollDie(d, rng) : d
  );
  return next;
}

/** Erzeugt das Draft-Angebot für die aktuelle Runde. */
function generateDraftOffers(state: GameState, rng: RNG): {
  offers: DraftOffer[];
  nextId: number;
} {
  const offers: DraftOffer[] = [];
  let nextId = state.nextId;
  for (let i = 0; i < state.config.draftOfferSize; i++) {
    const blueprint = pick(rng, DICE_CATALOG);
    const die = instantiate(blueprint, state.config, `d${nextId++}`);
    offers.push({ id: `o${nextId++}`, die });
  }
  return { offers, nextId };
}

/** Draft-Phase: ein Spieler nimmt einen Würfel aus dem Angebot in seinen Beutel. */
export function draftPick(
  state: GameState,
  playerId: string,
  offerId: string
): GameState {
  if (state.phase !== 'draft') return state;
  if (state.draftedThisPhase.includes(playerId)) return state;
  const offer = state.draftOffers.find((o) => o.id === offerId);
  if (!offer) return state;

  const next = cloneState(state);
  const player = next.players.find((p) => p.id === playerId);
  if (!player) return state;
  player.bag.push(offer.die);
  next.draftOffers = next.draftOffers.filter((o) => o.id !== offerId);
  next.draftedThisPhase.push(playerId);
  return next;
}

/**
 * Draft-Phase: ein Spieler verzichtet auf einen Pick. Markiert ihn als fertig,
 * ohne einen Würfel zu nehmen.
 */
export function draftPass(state: GameState, playerId: string): GameState {
  if (state.phase !== 'draft') return state;
  if (state.draftedThisPhase.includes(playerId)) return state;
  if (!state.players.some((p) => p.id === playerId)) return state;
  const next = cloneState(state);
  next.draftedThisPhase.push(playerId);
  return next;
}

/** Wendet das Ergebnis von scoreRound auf die Spieler an. */
function applyScores(next: GameState, breakdown: ScoreBreakdown[]): void {
  const byId = new Map(breakdown.map((b) => [b.playerId, b]));
  for (const p of next.players) {
    const b = byId.get(p.id);
    if (!b) continue;
    p.roundScore = b.final;
    p.totalScore += b.final;
    const hadCrown = p.hasCrown;
    p.hasCrown = b.hasCrown;
    if (b.hasCrown && !hadCrown) next.log.push(`${p.name} trägt jetzt die Käse-Krone.`);
    if (b.sabotageReceived > 0) {
      next.log.push(`${p.name} verliert ${b.sabotageReceived} durch Sabotage.`);
    }
  }
}

/**
 * Schaltet zur nächsten Phase weiter und führt automatische Übergänge aus:
 *  - roll  -> pity:  Mitleidswürfel verteilen
 *  - pity  -> swap:  (nur Phasenwechsel; Tausch passiert interaktiv vorher)
 *  - swap  -> draft: Runde werten, Krone setzen, Angebot erzeugen
 *  - draft -> roll:  nächste Runde (oder Partie beendet)
 */
export function advancePhase(state: GameState, rng: RNG): GameState {
  if (state.finished) return state;

  switch (state.phase) {
    case 'roll': {
      const rolled = performRoll(state, rng);
      const withPity = distributePity({ ...rolled, phase: 'roll' }, rng);
      return { ...withPity, phase: 'pity' };
    }
    case 'pity': {
      return { ...cloneState(state), phase: 'swap' };
    }
    case 'swap': {
      const next = cloneState(state);
      const breakdown = scoreRound(next.players, next.config.clearScores);
      applyScores(next, breakdown);
      next.lastScores = breakdown;
      const { offers, nextId } = generateDraftOffers(next, rng);
      next.draftOffers = offers;
      next.draftedThisPhase = [];
      next.nextId = nextId;
      next.phase = 'draft';
      return next;
    }
    case 'draft': {
      const next = cloneState(state);
      if (next.round >= next.config.totalRounds) {
        next.finished = true;
        next.log.push('Partie beendet.');
        return next;
      }
      next.round += 1;
      next.phase = 'roll';
      next.draftOffers = [];
      next.draftedThisPhase = [];
      for (const p of next.players) {
        p.rolled = [];
        p.roundScore = 0;
      }
      next.log.push(`Runde ${next.round} beginnt.`);
      // Direkt würfeln, damit "Eintritt in roll" konsistent gewürfelt ist.
      return performRoll(next, rng);
    }
  }
}

/** Bequemer Convenience-Wrapper: erzeugt Partie und würfelt Runde 1. */
export function startGame(opts: CreateGameOptions): {
  state: GameState;
  rng: RNG;
} {
  const rng = createRNG(opts.seed ?? Date.now() >>> 0);
  const state = performRoll(createGame(opts), rng);
  return { state, rng };
}

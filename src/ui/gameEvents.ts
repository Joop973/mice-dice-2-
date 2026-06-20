// Reine Ereignis-Erkennung: vergleicht zwei Engine-Zustände und leitet daraus
// Klang-Ereignisse + Animations-Flags ab. Bewusst frei von React/DOM, damit
// die Logik direkt gegen echte Engine-Übergänge getestet werden kann.

import type { GameState } from '../engine';
import type { SoundEvent } from '../sound';

/** Kronen-Wanderung von einem Halter zum neuen (from=null bei Erst-Vergabe). */
export interface CrownMove {
  from: string | null;
  to: string;
}

/** Sabotage-Wurf: Werfer -> Opfer (Kronenhalter) mit abgezogener Summe. */
export interface SabotageMove {
  from: string;
  to: string;
  amount: number;
}

export interface Snapshot {
  round: number;
  finished: boolean;
  crowns: Record<string, boolean>;
  totals: Record<string, number>;
  drafted: number;
  offers: number;
  /** Signatur des aktuellen Wurfs (ändert sich bei jedem frischen Würfeln). */
  rollKey: string;
  rolledAny: boolean;
  /** Sabotage-Würfe der zuletzt gewerteten Runde (aus lastScores). */
  sabotage: SabotageMove[];
}

function deriveSabotage(s: GameState): SabotageMove[] {
  const scores = s.lastScores;
  if (!scores) return [];
  // Hauptopfer = größter erlittener Sabotage-Abzug (i. d. R. der Kronenhalter).
  let victim = scores[0];
  for (const b of scores) if (b.sabotageReceived > victim.sabotageReceived) victim = b;
  if (!victim || victim.sabotageReceived <= 0) return [];
  const moves: SabotageMove[] = [];
  for (const t of scores) {
    if (t.sabotageThrown > 0) {
      moves.push({ from: t.playerId, to: victim.playerId, amount: t.sabotageThrown });
    }
  }
  return moves;
}

export function snapshot(s: GameState): Snapshot {
  const crowns: Record<string, boolean> = {};
  const totals: Record<string, number> = {};
  let rolledAny = false;
  const parts: string[] = [];
  for (const p of s.players) {
    crowns[p.id] = p.hasCrown;
    totals[p.id] = p.totalScore;
    if (p.rolled.length > 0) rolledAny = true;
    parts.push(p.rolled.map((d) => `${d.id}#${d.value}`).join(','));
  }
  return {
    round: s.round,
    finished: s.finished,
    crowns,
    totals,
    drafted: s.draftedThisPhase.length,
    offers: s.draftOffers.length,
    rollKey: `${s.round}:${s.phase}:${parts.join('|')}`,
    rolledAny,
    sabotage: deriveSabotage(s),
  };
}

export interface DetectedEvents {
  /** Abzuspielende Klänge (in Reihenfolge). */
  sounds: SoundEvent[];
  /** Spieler, die gerade die Krone gewonnen haben. */
  crownedNow: Set<string>;
  /** Spieler mit frischer Negativ-Wertung. */
  warnNow: Set<string>;
  /** Banner-Text (Rundenwechsel / Sieg) oder null. */
  banner: string | null;
  /** Kronen-Wanderung (für die wandernde-Krone-Animation) oder null. */
  crownMove: CrownMove | null;
  /** Sabotage-Würfe dieser Wertung (für die Angriffs-Animation). */
  sabotage: SabotageMove[];
}

/**
 * Vergleicht den vorherigen mit dem aktuellen Zustand. In der Praxis fällt pro
 * Zustandsübergang nur eine Scoring-Kategorie an (Wertung in swap->draft,
 * Rundenwechsel in draft->roll), daher genügt eine schlichte Prioritätenliste.
 */
export function detectEvents(prev: Snapshot, cur: Snapshot): DetectedEvents {
  const sounds: SoundEvent[] = [];

  const crownedNow = new Set<string>();
  for (const id of Object.keys(cur.crowns)) {
    if (cur.crowns[id] && !prev.crowns[id]) crownedNow.add(id);
  }

  const warnNow = new Set<string>();
  let scoredPositive = false;
  for (const id of Object.keys(cur.totals)) {
    const delta = cur.totals[id] - (prev.totals[id] ?? 0);
    if (delta < 0) warnNow.add(id);
    else if (delta > 0) scoredPositive = true;
  }

  const roundUp = cur.round > prev.round;
  const justFinished = cur.finished && !prev.finished;
  const draftedGrew = cur.drafted > prev.drafted;
  const rollChanged = cur.rolledAny && cur.rollKey !== prev.rollKey;
  // „Wertungs-Übergang" = irgendein Gesamtpunktestand hat sich geändert.
  const scoringTransition = scoredPositive || warnNow.size > 0 || crownedNow.size > 0;

  // Kronen-Wanderung: wer hat die Krone neu, wer hatte sie vorher?
  let crownMove: CrownMove | null = null;
  const gained = [...crownedNow][0];
  if (gained) {
    const prevHolder = Object.keys(prev.crowns).find((id) => prev.crowns[id]) ?? null;
    crownMove = { from: prevHolder, to: gained };
  }

  // Sabotage nur am Wertungs-Übergang auslösen (nicht bei Draft-Picks).
  const sabotage = scoringTransition ? cur.sabotage : [];

  let banner: string | null = null;

  if (justFinished) {
    banner = 'Sieger! 🎉';
    sounds.push('win');
  } else if (crownedNow.size > 0) {
    sounds.push('crown');
  } else if (warnNow.size > 0) {
    sounds.push('warn');
  } else if (scoredPositive) {
    sounds.push('tick');
  }

  if (roundUp && !justFinished) {
    banner = `Runde ${cur.round}`;
    sounds.push('round');
  } else if (draftedGrew) {
    sounds.push(cur.offers < prev.offers ? 'pick' : 'pass');
  } else if (
    rollChanged &&
    !scoredPositive &&
    warnNow.size === 0 &&
    crownedNow.size === 0
  ) {
    sounds.push('roll');
  }

  return { sounds, crownedNow, warnNow, banner, crownMove, sabotage };
}

// Reine Ereignis-Erkennung: vergleicht zwei Engine-Zustände und leitet daraus
// Klang-Ereignisse + Animations-Flags ab. Bewusst frei von React/DOM, damit
// die Logik direkt gegen echte Engine-Übergänge getestet werden kann.

import type { GameState } from '../engine';
import type { SoundEvent } from '../sound';

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

  let banner: string | null = null;

  if (justFinished) {
    banner = 'Sieger!';
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
  } else if (rollChanged && !scoredPositive && warnNow.size === 0 && crownedNow.size === 0) {
    sounds.push('roll');
  }

  return { sounds, crownedNow, warnNow, banner };
}

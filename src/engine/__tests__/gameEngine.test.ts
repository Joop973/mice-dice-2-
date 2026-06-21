import { describe, it, expect } from 'vitest';
import {
  advancePhase,
  createGame,
  distributePity,
  draftPass,
  draftPick,
  performRoll,
  startGame,
  swapClearDice,
} from '../gameEngine';
import { DEFAULT_CONFIG } from '../diceCatalog';
import { createRNG } from '../rng';
import type { PityMode } from '../types';

function pityDiceFor(scores: number[], pityMode: PityMode): number[] {
  const s = createGame({
    players: scores.map((_, i) => ({ name: `P${i}` })),
    config: { pityMode },
  });
  s.players.forEach((p, i) => {
    p.totalScore = scores[i];
  });
  const after = distributePity(s, createRNG(1));
  return after.players.map((p) => p.rolled.filter((d) => d.isPity).length);
}

describe('Mitleilswürfel-Verteilung (pityMode)', () => {
  it('belowMax: jeder unter dem Spitzenstand', () => {
    expect(pityDiceFor([10, 5, 5, 0], 'belowMax')).toEqual([0, 1, 1, 1]);
  });
  it('belowAverage: nur unter dem Durchschnitt', () => {
    // avg = 5 -> nur der mit 0 liegt darunter
    expect(pityDiceFor([10, 5, 5, 0], 'belowAverage')).toEqual([0, 0, 0, 1]);
  });
  it('lastPlace: nur die hinterste Maus', () => {
    expect(pityDiceFor([10, 5, 3, 0], 'lastPlace')).toEqual([0, 0, 0, 1]);
  });
  it('niemand bei Gleichstand (z. B. Runde 1)', () => {
    expect(pityDiceFor([0, 0, 0, 0], 'belowAverage')).toEqual([0, 0, 0, 0]);
  });
});

describe('Rot-Balance (Default-Config)', () => {
  it('Rot ist ein fairer High-Variance-Würfel (EV ≥ normaler Würfel, mit Negativ-Faces)', () => {
    const w6 = DEFAULT_CONFIG.redFaces[6];
    const w8 = DEFAULT_CONFIG.redFaces[8];
    const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    expect(w6).toHaveLength(6);
    expect(w8).toHaveLength(8);
    expect(mean(w6)).toBeGreaterThanOrEqual(3.5); // ≥ normaler W6
    expect(mean(w8)).toBeGreaterThanOrEqual(4.5); // ≥ normaler W8
    expect(Math.min(...w6)).toBeLessThan(0); // echtes Risiko
    expect(Math.min(...w8)).toBeLessThan(0);
  });
});

describe('createGame', () => {
  it('gibt jeder Maus genau einen gelben W6 als Startwürfel', () => {
    const s = createGame({ players: [{ name: 'A' }, { name: 'B' }] });
    expect(s.players).toHaveLength(2);
    for (const p of s.players) {
      expect(p.bag).toHaveLength(1);
      expect(p.bag[0]).toMatchObject({ color: 'yellow', sides: 6 });
    }
    expect(s.round).toBe(1);
    expect(s.phase).toBe('roll');
    expect(s.finished).toBe(false);
  });
});

describe('lastScores', () => {
  it('ist nach der Wertung (swap -> draft) gesetzt, davor nicht', () => {
    const rng = createRNG(99);
    let s = startGame({ players: [{ name: 'A' }, { name: 'B' }], seed: 99 }).state;
    expect(s.lastScores).toBeUndefined();
    while (s.phase !== 'draft') s = advancePhase(s, rng);
    expect(s.lastScores).toBeDefined();
    expect(s.lastScores).toHaveLength(2);
    expect(s.lastScores![0]).toHaveProperty('contributions');
  });
});

describe('Draft-Angebotsgröße', () => {
  function offersFor(playerCount: number): number {
    const rng = createRNG(3);
    let s = startGame({
      players: Array.from({ length: playerCount }, (_, i) => ({ name: `P${i}` })),
      seed: 3,
    }).state;
    while (s.phase !== 'draft') s = advancePhase(s, rng);
    return s.draftOffers.length;
  }

  it('bietet Spieleranzahl + 1 Würfel an (auch bei 6 Mäusen)', () => {
    expect(offersFor(2)).toBe(3);
    expect(offersFor(3)).toBe(4);
    expect(offersFor(4)).toBe(5);
    expect(offersFor(6)).toBe(7);
  });

  it('respektiert einen festen Override', () => {
    const rng = createRNG(3);
    let s = startGame({
      players: [{ name: 'A' }, { name: 'B' }],
      seed: 3,
      config: { draftOfferSize: 6 },
    }).state;
    while (s.phase !== 'draft') s = advancePhase(s, rng);
    expect(s.draftOffers).toHaveLength(6);
  });
});

describe('Kronen-Endspiel-Bonus', () => {
  function playOut(endgameBonus: number) {
    const rng = createRNG(5);
    let s = startGame({
      players: [{ name: 'A' }, { name: 'B' }],
      seed: 5,
      config: { totalRounds: 1, crownBonusPerRound: 0, crownEndgameBonus: endgameBonus },
    }).state;
    while (!s.finished) s = advancePhase(s, rng);
    return s.players;
  }

  it('zählt Kronen-Runden und vergibt den Endspiel-Bonus an den Spitzenreiter', () => {
    const withoutBonus = playOut(0);
    const withBonus = playOut(25);
    const crownIdx = withoutBonus.findIndex((p) => p.crownRounds === 1);
    expect(crownIdx).toBeGreaterThanOrEqual(0); // genau ein Kronenhalter
    // Nur der Kronen-Spitzenreiter erhält die 25 extra.
    expect(withBonus[crownIdx].totalScore - withoutBonus[crownIdx].totalScore).toBe(25);
    const otherIdx = crownIdx === 0 ? 1 : 0;
    expect(withBonus[otherIdx].totalScore - withoutBonus[otherIdx].totalScore).toBe(0);
  });
});

describe('performRoll', () => {
  it('würfelt alle Beutel und ist deterministisch bei gleicher Seed', () => {
    const rng1 = createRNG(42);
    const rng2 = createRNG(42);
    const s1 = performRoll(createGame({ players: [{ name: 'A' }] }), rng1);
    const s2 = performRoll(createGame({ players: [{ name: 'A' }] }), rng2);
    expect(s1.players[0].rolled).toHaveLength(1);
    expect(s1.players[0].rolled[0].value).toBe(s2.players[0].rolled[0].value);
  });

  it('würfelt nicht erneut, wenn schon geworfen wurde', () => {
    const rng = createRNG(7);
    const s1 = performRoll(createGame({ players: [{ name: 'A' }] }), rng);
    const v = s1.players[0].rolled[0].value;
    const s2 = performRoll(s1, rng);
    expect(s2.players[0].rolled[0].value).toBe(v);
  });
});

describe('Phasenfolge', () => {
  it('läuft roll -> pity -> swap -> draft und erzeugt ein Angebot', () => {
    const rng = createRNG(123);
    let s = performRoll(createGame({ players: [{ name: 'A' }, { name: 'B' }] }), rng);
    expect(s.phase).toBe('roll');
    s = advancePhase(s, rng);
    expect(s.phase).toBe('pity');
    s = advancePhase(s, rng);
    expect(s.phase).toBe('swap');
    s = advancePhase(s, rng);
    expect(s.phase).toBe('draft');
    expect(s.draftOffers.length).toBeGreaterThan(0);
  });

  it('beendet die Partie nach der konfigurierten Rundenzahl', () => {
    const rng = createRNG(5);
    let s = performRoll(createGame({ players: [{ name: 'A' }], config: { totalRounds: 2 } }), rng);
    // 2 Runden × 4 Phasenübergänge -> finished.
    for (let i = 0; i < 8 && !s.finished; i++) s = advancePhase(s, rng);
    expect(s.finished).toBe(true);
    expect(s.round).toBe(2);
  });
});

describe('Draft', () => {
  it('verschiebt einen Würfel aus dem Angebot in den Beutel', () => {
    const rng = createRNG(99);
    let s = performRoll(createGame({ players: [{ name: 'A' }] }), rng);
    s = advancePhase(s, rng); // pity
    s = advancePhase(s, rng); // swap
    s = advancePhase(s, rng); // draft
    const bagBefore = s.players[0].bag.length;
    const offerId = s.draftOffers[0].id;
    s = draftPick(s, 'p0', offerId);
    expect(s.players[0].bag).toHaveLength(bagBefore + 1);
    expect(s.draftOffers.find((o) => o.id === offerId)).toBeUndefined();
  });

  it('lässt einen Spieler pro Phase nur einmal draften', () => {
    const rng = createRNG(31);
    let s = performRoll(createGame({ players: [{ name: 'A' }] }), rng);
    s = advancePhase(advancePhase(advancePhase(s, rng), rng), rng); // -> draft
    s = draftPick(s, 'p0', s.draftOffers[0].id);
    const afterFirst = s.players[0].bag.length;
    s = draftPick(s, 'p0', s.draftOffers[0].id);
    expect(s.players[0].bag).toHaveLength(afterFirst); // zweiter Pick ignoriert
  });

  it('lässt einen Spieler passen, ohne einen Würfel zu nehmen', () => {
    const rng = createRNG(77);
    let s = performRoll(createGame({ players: [{ name: 'A' }] }), rng);
    s = advancePhase(advancePhase(advancePhase(s, rng), rng), rng); // -> draft
    const bagBefore = s.players[0].bag.length;
    const offersBefore = s.draftOffers.length;
    s = draftPass(s, 'p0');
    expect(s.players[0].bag).toHaveLength(bagBefore);
    expect(s.draftOffers).toHaveLength(offersBefore);
    expect(s.draftedThisPhase).toContain('p0');
  });
});

describe('swapClearDice', () => {
  it('würfelt nur Klar-Würfel neu, keine anderen Farben', () => {
    // Konstruiere einen Spieler mit Klar-Würfel im Beutel.
    const rng = createRNG(3);
    let s = createGame({ players: [{ name: 'A' }] });
    s.players[0].bag.push({
      id: 'clear1',
      color: 'clear',
      sides: 6,
      variant: 'normal',
    });
    s = performRoll(s, rng);
    s = advancePhase(s, rng); // pity
    s = advancePhase(s, rng); // swap
    const yellowBefore = s.players[0].rolled.find((d) => d.color === 'yellow')!.value;
    s = swapClearDice(s, 'p0', ['clear1'], rng);
    const yellowAfter = s.players[0].rolled.find((d) => d.color === 'yellow')!.value;
    expect(yellowAfter).toBe(yellowBefore); // Gelb bleibt unverändert
  });
});

describe('startGame', () => {
  it('erzeugt eine Partie und würfelt Runde 1', () => {
    const { state } = startGame({ players: [{ name: 'A' }], seed: 1 });
    expect(state.players[0].rolled).toHaveLength(1);
  });
});

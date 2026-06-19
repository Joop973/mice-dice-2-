import { describe, it, expect } from 'vitest';
import {
  advancePhase,
  createGame,
  draftPass,
  draftPick,
  performRoll,
  startGame,
  swapClearDice,
} from '../gameEngine';
import { createRNG } from '../rng';

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
    let s = performRoll(
      createGame({ players: [{ name: 'A' }], config: { totalRounds: 2 } }),
      rng
    );
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

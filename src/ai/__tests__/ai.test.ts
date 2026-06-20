import { describe, it, expect } from 'vitest';
import {
  aiChooseDraft,
  aiChooseSwap,
  aiTakePhaseAction,
  expectedValue,
  strategicDraftValue,
} from '../ai';
import {
  advancePhase,
  createGame,
  createRNG,
  performRoll,
  type DieDef,
  type GameState,
} from '../../engine';

describe('expectedValue', () => {
  it('nutzt (sides+1)/2 ohne explizite Faces', () => {
    expect(expectedValue({ id: 'x', color: 'green', sides: 20, variant: 'normal' })).toBe(10.5);
  });
  it('mittelt explizite Faces (inkl. negativer Rot-Werte)', () => {
    expect(
      expectedValue({ id: 'x', color: 'red', sides: 6, variant: 'normal', faces: [-2, -1, 1, 2, 3, 4] })
    ).toBeCloseTo(7 / 6);
  });
});

/** Bringt eine frische Partie bis in die Draft-Phase. */
function toDraft(seed: number): { state: GameState; rng: ReturnType<typeof createRNG> } {
  const rng = createRNG(seed);
  let s = performRoll(createGame({ players: [{ name: 'KI', isAI: true }] }), rng);
  s = advancePhase(advancePhase(advancePhase(s, rng), rng), rng); // -> draft
  return { state: s, rng };
}

describe('aiChooseDraft', () => {
  it('mittel/schwer wählen einen Würfel (nicht passen), wenn Angebot existiert', () => {
    const { state, rng } = toDraft(11);
    expect(state.draftOffers.length).toBeGreaterThan(0);
    const med = aiChooseDraft(state, 'p0', 'medium', rng);
    expect(med.kind).toBe('pick');
  });

  it('mittel wählt das Angebot mit höchstem Erwartungswert', () => {
    const { state, rng } = toDraft(11);
    // Angebot manuell auf zwei klar unterscheidbare Würfel setzen.
    const s: GameState = {
      ...state,
      draftOffers: [
        { id: 'low', die: { id: 'a', color: 'yellow', sides: 6, variant: 'normal' } },
        { id: 'high', die: { id: 'b', color: 'green', sides: 20, variant: 'normal' } },
      ],
    };
    const dec = aiChooseDraft(s, 'p0', 'medium', rng);
    expect(dec).toEqual({ kind: 'pick', offerId: 'high' });
  });

  it('passt, wenn kein Angebot vorhanden ist', () => {
    const { state, rng } = toDraft(11);
    const dec = aiChooseDraft({ ...state, draftOffers: [] }, 'p0', 'hard', rng);
    expect(dec.kind).toBe('pass');
  });
});

describe('aiChooseSwap', () => {
  it('tauscht nichts, wenn Klar nicht wertet (Default)', () => {
    const rng = createRNG(3);
    let s = createGame({ players: [{ name: 'KI', isAI: true }] });
    s.players[0].bag.push({ id: 'c1', color: 'clear', sides: 6, variant: 'normal' });
    s = performRoll(s, rng);
    s = advancePhase(advancePhase(s, rng), rng); // -> swap
    expect(aiChooseSwap(s, 'p0', 'hard')).toEqual([]);
  });

  it('tauscht niedrige Klar-Würfel, wenn Klar wertet', () => {
    const rng = createRNG(3);
    let s = createGame({
      players: [{ name: 'KI', isAI: true }],
      config: { clearScores: true },
    });
    s.players[0].bag.push({ id: 'c1', color: 'clear', sides: 6, variant: 'normal' });
    s = performRoll(s, rng);
    s = advancePhase(advancePhase(s, rng), rng); // -> swap
    // Wert von c1 künstlich niedrig setzen.
    const clear = s.players[0].rolled.find((d) => d.id === 'c1')!;
    clear.value = 1;
    expect(aiChooseSwap(s, 'p0', 'hard')).toContain('c1');
  });
});

describe('strategicDraftValue (harte KI)', () => {
  const brown: DieDef = {
    id: 'b', color: 'brown', sides: 6, variant: 'normal', faces: [2, 2, 2, 3, 3, 3],
  };
  const sabotage: DieDef = { id: 's', color: 'sabotage', sides: 8, variant: 'normal' };

  it('bewertet Braun als Build-Around höher, je mehr Braun man schon hat', () => {
    const s = createGame({ players: [{ name: 'A' }] });
    const p = s.players[0];
    const v0 = strategicDraftValue(s, p, brown);
    p.bag.push({ ...brown, id: 'b0' }, { ...brown, id: 'b1' });
    const v2 = strategicDraftValue(s, p, brown);
    expect(v2).toBeGreaterThan(v0);
  });

  it('vergibt für Gelb keinen Kronen-Bonus (Krone gibt keine Punkte)', () => {
    const s = createGame({ players: [{ name: 'A' }] });
    const yellow: DieDef = { id: 'y', color: 'yellow', sides: 8, variant: 'normal' };
    // Gelb wird wie eine normale Summe bewertet (= Erwartungswert), kein Aufschlag.
    expect(strategicDraftValue(s, s.players[0], yellow)).toBe(expectedValue(yellow));
  });

  it('bewertet Sabotage im Rückstand höher als in Führung', () => {
    const s = createGame({ players: [{ name: 'A' }, { name: 'B' }] });
    s.players[0].totalScore = 0; // A liegt zurück
    s.players[1].totalScore = 80; // B führt
    const behind = strategicDraftValue(s, s.players[0], sabotage);
    const leading = strategicDraftValue(s, s.players[1], sabotage);
    expect(behind).toBeGreaterThan(leading);
  });

  it('bewertet Sabotage höher, wenn ein führender Gegner die Krone trägt', () => {
    const s = createGame({ players: [{ name: 'A' }, { name: 'B' }] });
    s.players[0].totalScore = 0; // A (wir) liegen zurück
    s.players[1].totalScore = 40; // B führt
    const without = strategicDraftValue(s, s.players[0], sabotage);
    s.players[1].hasCrown = true; // jetzt trägt der Leader die Krone
    const withCrown = strategicDraftValue(s, s.players[0], sabotage);
    expect(withCrown).toBeGreaterThan(without);
  });
});

describe('aiTakePhaseAction', () => {
  it('lässt die KI in der Draft-Phase tatsächlich einen Würfel nehmen', () => {
    const { state, rng } = toDraft(22);
    const bagBefore = state.players[0].bag.length;
    const next = aiTakePhaseAction(state, 'p0', 'hard', rng);
    expect(next.players[0].bag.length).toBe(bagBefore + 1);
    expect(next.draftedThisPhase).toContain('p0');
  });

  it('ist in roll/pity ein No-op', () => {
    const rng = createRNG(1);
    const s = performRoll(createGame({ players: [{ name: 'KI', isAI: true }] }), rng);
    expect(aiTakePhaseAction(s, 'p0', 'medium', rng)).toBe(s);
  });
});

import { describe, it, expect } from 'vitest';
import {
  aiChooseDraft,
  aiChooseSwap,
  aiTakePhaseAction,
  expectedValue,
} from '../ai';
import {
  advancePhase,
  createGame,
  createRNG,
  performRoll,
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

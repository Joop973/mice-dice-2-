import { describe, expect, it } from 'vitest';
import {
  advancePhase,
  createRNG,
  startGame,
  type GameState,
  type RNG,
} from '../../engine';
import { detectEvents, snapshot } from '../gameEvents';

// Treibt ein deterministisches Spiel und prüft, dass die Ereignis-Erkennung
// auf echten Engine-Übergängen die richtigen Klänge/Flags liefert.

function setup(seed: number): { state: GameState; rng: RNG } {
  const { state } = startGame({
    players: [{ name: 'A' }, { name: 'B' }],
    seed,
  });
  return { state, rng: createRNG(seed) };
}

describe('detectEvents', () => {
  it('liefert keine Ereignisse, wenn sich nichts ändert', () => {
    const { state } = setup(1);
    const snap = snapshot(state);
    const res = detectEvents(snap, snap);
    expect(res.sounds).toEqual([]);
    expect(res.crownedNow.size).toBe(0);
    expect(res.warnNow.size).toBe(0);
    expect(res.banner).toBeNull();
  });

  it('erkennt die Wertung in swap->draft (Tick und/oder Krone)', () => {
    const { state, rng } = setup(7);
    // roll -> pity -> swap
    const swap = advancePhase(advancePhase(state, rng), rng);
    expect(swap.phase).toBe('swap');
    const draft = advancePhase(swap, rng); // swap -> draft: hier wird gewertet
    expect(draft.phase).toBe('draft');

    const res = detectEvents(snapshot(swap), snapshot(draft));
    // Es muss mindestens ein wertungsbezogenes Ereignis geben.
    const scoring = res.sounds.filter((s) =>
      ['tick', 'crown', 'warn'].includes(s)
    );
    expect(scoring.length).toBeGreaterThan(0);
  });

  it('meldet einen Kronenwechsel als crownedNow + crown-Klang', () => {
    const prev = snapshot(setup(2).state);
    // Synthetischer „Nachher"-Snapshot: Spieler p0 gewinnt die Krone.
    const cur = { ...prev, crowns: { ...prev.crowns } };
    const firstId = Object.keys(cur.crowns)[0];
    cur.crowns[firstId] = true;
    const before = { ...prev, crowns: { ...prev.crowns } };
    before.crowns[firstId] = false;

    const res = detectEvents(before, cur);
    expect(res.crownedNow.has(firstId)).toBe(true);
    expect(res.sounds).toContain('crown');
  });

  it('meldet negative Wertung als warnNow + warn-Klang', () => {
    const base = snapshot(setup(3).state);
    const id = Object.keys(base.totals)[0];
    const before = { ...base, totals: { ...base.totals, [id]: 5 } };
    const after = { ...base, totals: { ...base.totals, [id]: -3 } };

    const res = detectEvents(before, after);
    expect(res.warnNow.has(id)).toBe(true);
    expect(res.sounds).toContain('warn');
  });

  it('blendet ein Runden-Banner ein, wenn die Runde steigt', () => {
    const base = snapshot(setup(4).state);
    const after = { ...base, round: base.round + 1 };
    const res = detectEvents(base, after);
    expect(res.banner).toBe(`Runde ${after.round}`);
    expect(res.sounds).toContain('round');
  });

  it('spielt die Sieger-Sequenz, wenn die Partie endet', () => {
    const base = snapshot(setup(5).state);
    const after = { ...base, finished: true };
    const res = detectEvents(base, after);
    expect(res.sounds).toContain('win');
    expect(res.banner).toContain('Sieger');
  });

  it('unterscheidet Draft-Pick (Angebot schrumpft) von Pass', () => {
    const base = snapshot(setup(6).state);
    const withOffers = { ...base, drafted: 0, offers: 5 };

    const pick = detectEvents(withOffers, { ...withOffers, drafted: 1, offers: 4 });
    expect(pick.sounds).toContain('pick');

    const pass = detectEvents(withOffers, { ...withOffers, drafted: 1, offers: 5 });
    expect(pass.sounds).toContain('pass');
  });

  it('spielt roll bei frischem Wurf ohne Wertung (z. B. Klar-Tausch)', () => {
    const base = snapshot(setup(8).state);
    const after = { ...base, rollKey: base.rollKey + 'X', rolledAny: true };
    const res = detectEvents(base, after);
    expect(res.sounds).toContain('roll');
  });
});

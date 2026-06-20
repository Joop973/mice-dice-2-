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

  it('liefert crownMove vom alten zum neuen Halter', () => {
    const base = snapshot(setup(2).state);
    const before = { ...base, crowns: { p0: true, p1: false } };
    const after = { ...base, crowns: { p0: false, p1: true } };
    expect(detectEvents(before, after).crownMove).toEqual({ from: 'p0', to: 'p1' });
  });

  it('crownMove from=null bei Erst-Vergabe', () => {
    const base = snapshot(setup(2).state);
    const before = { ...base, crowns: { p0: false, p1: false } };
    const after = { ...base, crowns: { p0: true, p1: false } };
    expect(detectEvents(before, after).crownMove).toEqual({ from: null, to: 'p0' });
  });

  it('meldet Sabotage am Wertungs-Übergang, aber nicht bei Draft-Picks', () => {
    const base = snapshot(setup(2).state);
    const sab = [{ from: 'p0', to: 'p1', amount: 7 }];

    // Wertung: Gesamtpunkte ändern sich -> Sabotage feuert.
    const before = { ...base, totals: { p0: 0, p1: 0 }, sabotage: [] };
    const after = { ...base, totals: { p0: 5, p1: 3 }, sabotage: sab };
    expect(detectEvents(before, after).sabotage).toEqual(sab);

    // Draft-Pick: Gesamtpunkte unverändert -> keine Sabotage-Wiederholung.
    const b2 = { ...base, totals: { p0: 5, p1: 3 }, drafted: 0, sabotage: sab };
    const a2 = { ...base, totals: { p0: 5, p1: 3 }, drafted: 1, sabotage: sab };
    expect(detectEvents(b2, a2).sabotage).toEqual([]);
  });

  it('deriveSabotage (via snapshot): Werfer -> Hauptopfer', () => {
    const zero = () => ({
      yellow: 0, green: 0, blue: 0, purple: 0, pink: 0, red: 0, clear: 0, orange: 0, brown: 0,
    });
    const state = {
      ...setup(2).state,
      lastScores: [
        { playerId: 'p0', yellow: 0, base: 5, contributions: zero(), distinctColors: 1, sabotageThrown: 7, sabotageReceived: 0, crownBonus: 0, final: 5, hasCrown: false },
        { playerId: 'p1', yellow: 10, base: 10, contributions: zero(), distinctColors: 1, sabotageThrown: 0, sabotageReceived: 7, crownBonus: 14, final: 24, hasCrown: true },
      ],
    };
    expect(snapshot(state).sabotage).toEqual([{ from: 'p0', to: 'p1', amount: 7 }]);
  });
});

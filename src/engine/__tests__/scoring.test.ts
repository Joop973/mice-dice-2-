import { describe, it, expect } from 'vitest';
import {
  baseRoundScore,
  brownScore,
  distinctColorCount,
  orangeScore,
  scoreContributions,
  scoreRound,
  sumContributions,
  sumOfColor,
  yellowSum,
} from '../scoring';
import type { DieColor, DieVariant, Player, RolledDie } from '../types';

let counter = 0;
/** Kleiner Builder für geworfene Würfel in Tests. */
function rd(
  color: DieColor,
  value: number,
  opts: { sides?: number; variant?: DieVariant } = {}
): RolledDie {
  return {
    id: `t${counter++}`,
    color,
    sides: opts.sides ?? 6,
    variant: opts.variant ?? 'normal',
    value,
  };
}

function player(name: string, rolled: RolledDie[]): Player {
  return {
    id: name,
    name,
    isAI: false,
    bag: [],
    rolled,
    roundScore: 0,
    totalScore: 0,
    hasCrown: false,
  };
}

describe('Basis-Summen', () => {
  it('summiert eine Farbe über alle Würfel', () => {
    const r = [rd('yellow', 3), rd('yellow', 5), rd('green', 10)];
    expect(sumOfColor(r, 'yellow')).toBe(8);
    expect(yellowSum(r)).toBe(8);
  });
});

describe('scoreContributions', () => {
  it('schlüsselt die Beiträge je Farbe auf und summiert zur Basis', () => {
    const r = [
      rd('yellow', 4),
      rd('green', 10, { sides: 20 }),
      rd('orange', 3, { sides: 3 }), // × 3 verschiedene Farben = 9
    ];
    const c = scoreContributions(r, false);
    expect(c.yellow).toBe(4);
    expect(c.green).toBe(10);
    expect(c.orange).toBe(9);
    expect(c.clear).toBe(0);
    expect(sumContributions(c)).toBe(baseRoundScore(r, false));
    expect(sumContributions(c)).toBe(23);
  });

  it('zählt Klar nur, wenn clearScores aktiv ist', () => {
    const r = [rd('clear', 6)];
    expect(scoreContributions(r, false).clear).toBe(0);
    expect(scoreContributions(r, true).clear).toBe(6);
  });

  it('scoreRound liefert die Beiträge pro Spieler mit', () => {
    const breakdown = scoreRound([player('A', [rd('yellow', 5), rd('red', -2)])], false);
    expect(breakdown[0].contributions.yellow).toBe(5);
    expect(breakdown[0].contributions.red).toBe(-2);
    expect(breakdown[0].final).toBe(3);
  });
});

describe('distinctColorCount', () => {
  it('zählt Blau und Blau-Glitzer als EINE Farbe', () => {
    const r = [
      rd('blue', 4, { variant: 'normal' }),
      rd('blue', 2, { variant: 'glitter' }),
    ];
    expect(distinctColorCount(r)).toBe(1);
  });

  it('zählt Orange und Pink mit', () => {
    const r = [rd('orange', 3, { sides: 3 }), rd('pink', 7, { sides: 12 })];
    expect(distinctColorCount(r)).toBe(2);
  });
});

describe('orangeScore', () => {
  it('Wert × Anzahl verschiedener Farben (inkl. Orange/Pink)', () => {
    // Farben: orange, pink, blau(=1), gelb => 4 verschiedene.
    const r = [
      rd('orange', 2, { sides: 3 }),
      rd('pink', 5, { sides: 12 }),
      rd('blue', 3, { variant: 'glitter' }),
      rd('yellow', 1),
    ];
    expect(orangeScore(r)).toBe(2 * 4);
  });

  it('ist 0 ohne Orange-Würfel', () => {
    expect(orangeScore([rd('yellow', 4)])).toBe(0);
  });
});

describe('brownScore', () => {
  it('Summe × Größe der größten Gruppe', () => {
    // Werte 2,2,3 -> Summe 7, größte Gruppe (zwei 2en) = 2 -> 14.
    const r = [rd('brown', 2), rd('brown', 2), rd('brown', 3)];
    expect(brownScore(r)).toBe(7 * 2);
  });

  it('ohne Match Faktor ×1', () => {
    const r = [rd('brown', 2), rd('brown', 3)];
    expect(brownScore(r)).toBe(5 * 1);
  });

  it('ist 0 ohne braune Würfel', () => {
    expect(brownScore([rd('green', 9)])).toBe(0);
  });
});

describe('baseRoundScore', () => {
  it('verrechnet negative Rot-Werte', () => {
    const r = [rd('yellow', 5), rd('red', -2)];
    expect(baseRoundScore(r, false)).toBe(3);
  });

  it('zählt Klar nur, wenn konfiguriert', () => {
    const r = [rd('yellow', 4), rd('clear', 6)];
    expect(baseRoundScore(r, false)).toBe(4);
    expect(baseRoundScore(r, true)).toBe(10);
  });

  it('schließt Sabotage NICHT in die eigenen Punkte ein', () => {
    const r = [rd('yellow', 4), rd('sabotage', 8, { sides: 8 })];
    expect(baseRoundScore(r, false)).toBe(4);
  });
});

describe('scoreRound – Krone & Sabotage', () => {
  it('vergibt die Krone an die höchste Gelb-Summe', () => {
    const a = player('A', [rd('yellow', 6)]);
    const b = player('B', [rd('yellow', 3)]);
    const res = scoreRound([a, b], false);
    expect(res[0].hasCrown).toBe(true);
    expect(res[1].hasCrown).toBe(false);
  });

  it('zieht Sabotage vom Kronenhalter ab', () => {
    const a = player('A', [rd('yellow', 6)]); // Krone
    const b = player('B', [rd('yellow', 2), rd('sabotage', 8, { sides: 8 })]);
    const res = scoreRound([a, b], false);
    const ra = res.find((r) => r.playerId === 'A')!;
    const rb = res.find((r) => r.playerId === 'B')!;
    expect(ra.sabotageReceived).toBe(8);
    expect(ra.final).toBe(6 - 8); // darf negativ werden
    expect(rb.final).toBe(2); // Werfer bekommt Sabotage nicht gutgeschrieben
  });

  it('trifft den Zweitplatzierten, wenn der Werfer selbst die Krone hält', () => {
    // A hält Krone UND wirft Sabotage -> trifft B (zweite).
    const a = player('A', [rd('yellow', 9), rd('sabotage', 5, { sides: 8 })]);
    const b = player('B', [rd('yellow', 4)]);
    const c = player('C', [rd('yellow', 1)]);
    const res = scoreRound([a, b, c], false);
    const rb = res.find((r) => r.playerId === 'B')!;
    const rc = res.find((r) => r.playerId === 'C')!;
    expect(rb.sabotageReceived).toBe(5);
    expect(rc.sabotageReceived).toBe(0);
  });

  it('Tie-Break Krone: höhere Basis-Punkte bei gleicher Gelb-Summe', () => {
    const a = player('A', [rd('yellow', 4), rd('green', 2)]); // base 6
    const b = player('B', [rd('yellow', 4), rd('green', 9)]); // base 13
    const res = scoreRound([a, b], false);
    expect(res.find((r) => r.playerId === 'B')!.hasCrown).toBe(true);
  });

  it('fizzelt, wenn der einzige Spieler die Krone hält (kein Ziel)', () => {
    const a = player('A', [rd('yellow', 3), rd('sabotage', 8, { sides: 8 })]);
    const res = scoreRound([a], false);
    expect(res[0].sabotageReceived).toBe(0);
    expect(res[0].final).toBe(3);
  });
});

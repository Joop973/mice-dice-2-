import { describe, expect, it } from 'vitest';
import { PIP_LAYOUT, hasPips, luminance, pipColor } from '../dicePips';

describe('dicePips', () => {
  it('hat für 1–6 genau so viele Pips wie die Augenzahl', () => {
    for (let v = 1; v <= 6; v++) {
      expect(PIP_LAYOUT[v]).toHaveLength(v);
    }
  });

  it('Pip-Positionen liegen im 3×3-Raster', () => {
    for (let v = 1; v <= 6; v++) {
      for (const [gx, gy] of PIP_LAYOUT[v]) {
        expect(gx).toBeGreaterThanOrEqual(0);
        expect(gx).toBeLessThanOrEqual(2);
        expect(gy).toBeGreaterThanOrEqual(0);
        expect(gy).toBeLessThanOrEqual(2);
      }
    }
  });

  it('hasPips nur für ganze Zahlen 1–6', () => {
    expect(hasPips(1)).toBe(true);
    expect(hasPips(6)).toBe(true);
    expect(hasPips(0)).toBe(false);
    expect(hasPips(7)).toBe(false);
    expect(hasPips(-2)).toBe(false);
    expect(hasPips(3.5)).toBe(false);
  });

  it('pipColor wählt kontrastreich (dunkel auf hell, hell auf dunkel)', () => {
    expect(luminance('#ffffff')).toBeGreaterThan(0.5);
    expect(luminance('#000000')).toBeLessThan(0.5);
    expect(pipColor('#f4c542')).toBe('#1c1410'); // helles Gelb -> dunkle Pips
    expect(pipColor('#2a211b')).toBe('#f6efe6'); // dunkles Braun -> helle Pips
  });
});

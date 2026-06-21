// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { Die } from '../Die';
import { setSetting } from '../settings';
import { DIE_GLYPHS } from '../colors';
import type { RolledDie } from '../../engine';

const die: RolledDie = { id: 'd1', color: 'red', sides: 6, value: 4, variant: 'normal' };

afterEach(() => setSetting('colorblind', false));

describe('Die – A11y/Farbenblind', () => {
  it('hat ein aria-label mit Farbe und Wert (auch nicht-klickbar)', () => {
    const { container } = render(<Die die={die} />);
    const el = container.querySelector('.die')!;
    expect(el.getAttribute('aria-label')).toContain('Rot');
    expect(el.getAttribute('aria-label')).toContain('4');
  });

  it('zeigt das Farb-Glyph nur im Farbenblind-Modus', () => {
    const { container, rerender } = render(<Die die={die} />);
    expect(container.querySelector('.die__glyph')).toBeNull();
    setSetting('colorblind', true);
    rerender(<Die die={die} />);
    expect(container.querySelector('.die__glyph')!.textContent).toBe(DIE_GLYPHS.red);
  });
});

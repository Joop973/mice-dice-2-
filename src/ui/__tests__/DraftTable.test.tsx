// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { DraftTable } from '../DraftTable';
import type { DraftOffer } from '../../engine';

afterEach(cleanup);

const offers: DraftOffer[] = [
  { id: 'o1', die: { id: 'd1', color: 'green', sides: 20, variant: 'normal' } },
  { id: 'o2', die: { id: 'd2', color: 'blue', sides: 12, variant: 'glitter' } },
];

describe('DraftTable (Tischmitte)', () => {
  it('zeigt die Würfel und nimmt einen per Klick', () => {
    const onPick = vi.fn();
    render(<DraftTable offers={offers} canPick onPick={onPick} activeName="Du" />);
    expect(screen.getByText(/Nimm dir einen Würfel/)).toBeTruthy();
    // Würfel-Token tragen ihr Aria-Label (Farbe + Seiten).
    fireEvent.click(screen.getByLabelText(/Grün W20/));
    expect(onPick).toHaveBeenCalledWith('o1');
  });

  it('sperrt die Würfel, wenn man nicht am Zug ist', () => {
    render(<DraftTable offers={offers} canPick={false} isAITurn activeName="KI 1" onPick={() => {}} />);
    expect(screen.getByText(/KI 1 wählt/)).toBeTruthy();
    expect((screen.getByLabelText(/Grün W20/) as HTMLButtonElement).disabled).toBe(true);
  });
});

import { afterEach, describe, expect, it, vi } from 'vitest';
import { HAPTIC_PATTERNS, vibrate } from '../haptics';
import type { SoundEvent } from '../events';

const ALL_EVENTS: SoundEvent[] = [
  'roll', 'pick', 'pass', 'crown', 'tick', 'round', 'win', 'warn',
];

describe('haptics', () => {
  afterEach(() => {
    // navigator.vibrate ggf. wieder entfernen
    delete (navigator as unknown as { vibrate?: unknown }).vibrate;
    vi.restoreAllMocks();
  });

  it('HAPTIC_PATTERNS deckt jedes Sound-Ereignis ab', () => {
    for (const e of ALL_EVENTS) {
      expect(HAPTIC_PATTERNS[e]).toBeDefined();
    }
  });

  it('ist ein no-op ohne navigator.vibrate (jsdom-Standard)', () => {
    expect(() => vibrate('roll')).not.toThrow();
  });

  it('ruft navigator.vibrate mit dem Muster, wenn verfügbar', () => {
    const spy = vi.fn();
    (navigator as unknown as { vibrate: unknown }).vibrate = spy;
    vibrate('crown');
    expect(spy).toHaveBeenCalledWith(HAPTIC_PATTERNS.crown);
  });
});

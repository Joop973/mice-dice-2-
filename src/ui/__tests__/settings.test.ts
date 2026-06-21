// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getSettings, setSetting, subscribe } from '../settings';
import { prefersReducedMotion, shouldAnimate } from '../motion';

afterEach(() => {
  // Auf Defaults zurücksetzen
  setSetting('haptics', true);
  setSetting('reduceMotion', false);
  setSetting('colorblind', false);
});

describe('settings', () => {
  it('hat sinnvolle Defaults', () => {
    expect(getSettings()).toMatchObject({ haptics: true, reduceMotion: false, colorblind: false });
  });

  it('ändert Werte, persistiert und benachrichtigt Subscriber', () => {
    const fn = vi.fn();
    const unsub = subscribe(fn);
    setSetting('colorblind', true);
    expect(getSettings().colorblind).toBe(true);
    expect(fn).toHaveBeenCalled();
    const raw = JSON.parse(localStorage.getItem('dicemice.settings')!);
    expect(raw.colorblind).toBe(true);
    expect(raw.version).toBe(1);
    unsub();
  });

  it('benachrichtigt nicht bei unverändertem Wert', () => {
    const fn = vi.fn();
    const unsub = subscribe(fn);
    setSetting('haptics', true); // bereits true
    expect(fn).not.toHaveBeenCalled();
    unsub();
  });
});

describe('motion', () => {
  it('reduceMotion-Setting erzwingt reduzierte Bewegung', () => {
    setSetting('reduceMotion', false);
    expect(prefersReducedMotion()).toBe(false);
    setSetting('reduceMotion', true);
    expect(prefersReducedMotion()).toBe(true);
  });

  it('shouldAnimate ist in jsdom (kein matchMedia) konservativ false', () => {
    expect(shouldAnimate()).toBe(false);
  });
});

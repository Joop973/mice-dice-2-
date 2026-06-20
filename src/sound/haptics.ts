// Mobile Haptik: spiegelt Klang-Ereignisse als Vibrationsmuster. Bewusst
// getrennt vom Audio-Pfad. Degradiert sauber: ohne navigator.vibrate (jsdom,
// Desktop) oder bei reduced-motion passiert nichts.

import type { SoundEvent } from './events';

/** Vibrationsmuster je Ereignis (ms; Array = an/aus/an …). */
export const HAPTIC_PATTERNS: Record<SoundEvent, number | number[]> = {
  roll: [8, 22, 8, 22, 12],
  pick: 12,
  pass: 6,
  crown: [14, 30, 14, 30, 26],
  tick: 5,
  round: [10, 40, 10],
  win: [30, 60, 30, 60, 60],
  warn: [40, 30, 24],
  land: 8,
  turn: [12, 40, 12],
};

function reducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/** Löst die Vibration für ein Ereignis aus (no-op, wenn nicht unterstützt). */
export function vibrate(event: SoundEvent): void {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  if (reducedMotion()) return;
  navigator.vibrate(HAPTIC_PATTERNS[event]);
}

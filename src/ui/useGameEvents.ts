// React-Brücke: beobachtet die Engine-Zustände, ruft die reine Ereignis-
// Erkennung (gameEvents.ts) auf und übersetzt deren Ergebnis in Klänge sowie
// kurzlebige Animations-Flags. Die eigentliche Logik liegt – testbar – daneben.

import { useEffect, useRef, useState } from 'react';
import type { GameState } from '../engine';
import type { SoundEvent } from '../sound';
import { detectEvents, snapshot, type Snapshot } from './gameEvents';

export interface GameEventFx {
  /** Spieler, die gerade die Krone gewonnen haben (Puls-Animation). */
  crownedNow: Set<string>;
  /** Spieler mit frischer Negativ-Wertung (Warn-Shake). */
  warnNow: Set<string>;
  /** Aktuell einzublendendes Banner (Rundenwechsel / Sieg) oder null. */
  banner: string | null;
}

const EMPTY: GameEventFx = { crownedNow: new Set(), warnNow: new Set(), banner: null };

export function useGameEvents(
  state: GameState | null,
  play: (event: SoundEvent) => void
): GameEventFx {
  const prevRef = useRef<Snapshot | null>(null);
  const [fx, setFx] = useState<GameEventFx>(EMPTY);

  useEffect(() => {
    if (!state) {
      prevRef.current = null;
      return;
    }
    const cur = snapshot(state);
    const prev = prevRef.current;
    prevRef.current = cur;
    if (!prev) return; // Erster Zustand: keine Differenz, kein Effekt.

    const { sounds, crownedNow, warnNow, banner } = detectEvents(prev, cur);
    for (const s of sounds) play(s);

    if (crownedNow.size > 0 || warnNow.size > 0 || banner) {
      setFx({ crownedNow, warnNow, banner });
      const duration = banner ? 1600 : 900;
      const t = setTimeout(() => setFx(EMPTY), duration);
      return () => clearTimeout(t);
    }
  }, [state, play]);

  return fx;
}

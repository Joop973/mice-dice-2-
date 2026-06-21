// React-Brücke: beobachtet die Engine-Zustände, ruft die reine Ereignis-
// Erkennung (gameEvents.ts) auf und übersetzt deren Ergebnis in Klänge sowie
// kurzlebige Animations-Flags. Die eigentliche Logik liegt – testbar – daneben.

import { useEffect, useRef, useState } from 'react';
import type { GameState } from '../engine';
import { vibrate, type SoundEvent } from '../sound';
import { getSettings } from './settings';
import {
  detectEvents,
  snapshot,
  type CrownMove,
  type SabotageMove,
  type Snapshot,
} from './gameEvents';

export interface GameEventFx {
  /** Spieler, die gerade die Krone gewonnen haben (Puls-Animation). */
  crownedNow: Set<string>;
  /** Spieler mit frischer Negativ-Wertung (Warn-Shake). */
  warnNow: Set<string>;
  /** Aktuell einzublendendes Banner (Rundenwechsel / Sieg) oder null. */
  banner: string | null;
  /** Kronen-Wanderung (kurzlebig) für die Token-Animation. */
  crownMove: CrownMove | null;
  /** Sabotage-Würfe (kurzlebig) für die Angriffs-Animation. */
  sabotage: SabotageMove[];
}

const EMPTY: GameEventFx = {
  crownedNow: new Set(),
  warnNow: new Set(),
  banner: null,
  crownMove: null,
  sabotage: [],
};

// Verzögerung des „Landungs"-Sounds nach einem Draft-Pick – passend zur
// flyToken-Standarddauer (fx/flyToken.ts), damit Ton und Bild zusammenfallen.
const LAND_DELAY_MS = 650;

export function useGameEvents(
  state: GameState | null,
  play: (event: SoundEvent) => void,
  muted = false
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

    const haptics = !muted && getSettings().haptics;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const { sounds, crownedNow, warnNow, banner, crownMove, sabotage } = detectEvents(prev, cur);
    for (const s of sounds) {
      play(s);
      if (haptics) vibrate(s); // Haptik an Mute + Setting gekoppelt
      // Draft-Pick: „Landung" passend zur Flug-Animation (~650 ms) nachklingen.
      if (s === 'pick') {
        timers.push(
          setTimeout(() => {
            play('land');
            if (haptics) vibrate('land');
          }, LAND_DELAY_MS)
        );
      }
    }

    if (crownedNow.size > 0 || warnNow.size > 0 || banner || crownMove || sabotage.length > 0) {
      setFx({ crownedNow, warnNow, banner, crownMove, sabotage });
      const duration = banner ? 1600 : 1000;
      timers.push(setTimeout(() => setFx(EMPTY), duration));
    }

    if (timers.length > 0) return () => timers.forEach(clearTimeout);
  }, [state, play, muted]);

  return fx;
}

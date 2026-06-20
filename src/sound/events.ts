// Sound-Ereignisse + ihre Klang-„Rezepte".
//
// Phase 5 liefert bewusst KEINE echten Audio-Assets, sondern prozedurale
// Platzhaltertöne (WebAudio-Oszillatoren). Dadurch ist sofort etwas hörbar,
// ohne Binärdateien ins Repo zu legen. Jeder Eintrag hat einen `src`-Slot:
// wird dort später ein echtes Asset (z. B. '/sfx/crown.mp3') eingetragen,
// spielt der SoundManager dieses statt des Platzhaltertons – ohne Code-Änderung.

/** Alle benannten Klang-Ereignisse des Spiels. */
export type SoundEvent =
  | 'roll' // Würfelwurf (auch Klar-Tausch, Mitleidswürfel)
  | 'pick' // Würfel aus dem Draft-Angebot genommen
  | 'pass' // im Draft gepasst
  | 'crown' // Käse-Krone gewechselt
  | 'tick' // Punkte gutgeschrieben (positive Wertung)
  | 'round' // neue Runde beginnt
  | 'win' // Partie beendet / Sieger-Sequenz
  | 'warn'; // negative Wertung (Rot / Sabotage)

/** Ein einzelner Oszillator-Ton des Platzhalter-Synths. */
export interface ToneSpec {
  /** Grundfrequenz in Hz. */
  freq: number;
  /** Optionale Zielfrequenz für einen Glide (linearer Ramp). */
  to?: number;
  /** Dauer in Sekunden. */
  dur: number;
  /** Wellenform (Standard: 'sine'). */
  type?: OscillatorType;
  /** Spitzenlautstärke 0..1 (Standard: 0.2). */
  gain?: number;
}

export interface SoundSpec {
  /**
   * Slot für ein späteres echtes Audio-Asset (URL/Pfad). Solange leer, wird
   * die prozedurale `tones`-Sequenz gespielt.
   */
  src?: string;
  /** Prozeduraler Platzhalter: nacheinander gespielte Töne. */
  tones: ToneSpec[];
}

export const SOUNDS: Record<SoundEvent, SoundSpec> = {
  roll: {
    tones: [{ freq: 380, to: 220, dur: 0.12, type: 'triangle', gain: 0.18 }],
  },
  pick: {
    tones: [
      { freq: 520, dur: 0.06, type: 'sine', gain: 0.2 },
      { freq: 784, dur: 0.08, type: 'sine', gain: 0.2 },
    ],
  },
  pass: {
    tones: [{ freq: 200, dur: 0.12, type: 'sine', gain: 0.15 }],
  },
  crown: {
    tones: [
      { freq: 523, dur: 0.1, type: 'triangle', gain: 0.2 },
      { freq: 659, dur: 0.1, type: 'triangle', gain: 0.2 },
      { freq: 784, dur: 0.18, type: 'triangle', gain: 0.22 },
    ],
  },
  tick: {
    tones: [{ freq: 880, dur: 0.05, type: 'square', gain: 0.1 }],
  },
  round: {
    tones: [
      { freq: 440, dur: 0.12, type: 'sine', gain: 0.18 },
      { freq: 660, dur: 0.14, type: 'sine', gain: 0.18 },
    ],
  },
  win: {
    tones: [
      { freq: 523, dur: 0.14, type: 'triangle', gain: 0.22 },
      { freq: 659, dur: 0.14, type: 'triangle', gain: 0.22 },
      { freq: 784, dur: 0.14, type: 'triangle', gain: 0.22 },
      { freq: 1047, dur: 0.24, type: 'triangle', gain: 0.24 },
    ],
  },
  warn: {
    tones: [{ freq: 160, to: 110, dur: 0.3, type: 'sawtooth', gain: 0.16 }],
  },
};

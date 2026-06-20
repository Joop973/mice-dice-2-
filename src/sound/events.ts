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
  | 'warn' // negative Wertung (Rot / Sabotage)
  | 'land'; // gedrafteter Würfel landet im Beutel (nach Flug-Animation)

/** Ein einzelner Ton/Geräusch des Platzhalter-Synths. */
export interface ToneSpec {
  /** Grundfrequenz in Hz (bei `noise`: Tiefpass-Eckfrequenz). */
  freq: number;
  /** Optionale Zielfrequenz für einen Glide (linearer Ramp). */
  to?: number;
  /** Dauer in Sekunden. */
  dur: number;
  /** Wellenform (Standard: 'sine'). */
  type?: OscillatorType;
  /** Spitzenlautstärke 0..1 (Standard: 0.2). */
  gain?: number;
  /** Rausch-Burst (Würfelrattern/Holzklack) statt Oszillator. */
  noise?: boolean;
  /** Startversatz in s ab Ereignisbeginn (zum Überlagern); sonst sequenziell. */
  delay?: number;
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
  // Würfelrattern (überlagerte Rausch-Bursts) + tiefer Holzklack zum Schluss.
  roll: {
    tones: [
      { freq: 2600, dur: 0.05, gain: 0.12, noise: true, delay: 0 },
      { freq: 2200, dur: 0.05, gain: 0.12, noise: true, delay: 0.05 },
      { freq: 1800, dur: 0.06, gain: 0.13, noise: true, delay: 0.11 },
      { freq: 420, dur: 0.1, gain: 0.18, noise: true, delay: 0.18 },
      { freq: 150, to: 90, dur: 0.12, type: 'triangle', gain: 0.16, delay: 0.19 },
    ],
  },
  // Holz-„Tock": kurzer Klack + warmer Anschlag.
  pick: {
    tones: [
      { freq: 900, dur: 0.045, gain: 0.18, noise: true, delay: 0 },
      { freq: 440, dur: 0.08, type: 'triangle', gain: 0.18, delay: 0 },
    ],
  },
  pass: {
    tones: [{ freq: 240, to: 180, dur: 0.12, type: 'sine', gain: 0.14 }],
  },
  // Käse-Krone: Arpeggio + heller Shimmer.
  crown: {
    tones: [
      { freq: 523, dur: 0.1, type: 'triangle', gain: 0.2 },
      { freq: 659, dur: 0.1, type: 'triangle', gain: 0.2 },
      { freq: 784, dur: 0.16, type: 'triangle', gain: 0.22 },
      { freq: 1568, dur: 0.2, type: 'sine', gain: 0.12, delay: 0.34 },
    ],
  },
  // Käse-„Squeak": kurzer hoher Aufwärts-Glide.
  tick: {
    tones: [{ freq: 760, to: 1060, dur: 0.07, type: 'square', gain: 0.1 }],
  },
  round: {
    tones: [
      { freq: 440, dur: 0.12, type: 'sine', gain: 0.18 },
      { freq: 660, dur: 0.14, type: 'sine', gain: 0.18 },
      { freq: 880, dur: 0.12, type: 'triangle', gain: 0.12, delay: 0.26 },
    ],
  },
  win: {
    tones: [
      { freq: 523, dur: 0.14, type: 'triangle', gain: 0.22 },
      { freq: 659, dur: 0.14, type: 'triangle', gain: 0.22 },
      { freq: 784, dur: 0.14, type: 'triangle', gain: 0.22 },
      { freq: 1047, dur: 0.24, type: 'triangle', gain: 0.24 },
      { freq: 1568, dur: 0.3, type: 'sine', gain: 0.14, delay: 0.66 },
    ],
  },
  // Sabotage/Negativ: dissonanter Abwärts-Saw + dumpfer Stoß.
  warn: {
    tones: [
      { freq: 170, to: 90, dur: 0.3, type: 'sawtooth', gain: 0.16 },
      { freq: 300, dur: 0.12, gain: 0.12, noise: true, delay: 0 },
    ],
  },
  // Würfel landet im Beutel: leiser Holz-Tap (kurzer Klack + tiefer Anschlag).
  land: {
    tones: [
      { freq: 520, dur: 0.04, gain: 0.12, noise: true, delay: 0 },
      { freq: 200, to: 130, dur: 0.07, type: 'triangle', gain: 0.14, delay: 0 },
    ],
  },
};

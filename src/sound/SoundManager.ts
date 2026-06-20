// Spielt Klang-Ereignisse ab – als prozeduralen WebAudio-Ton (Platzhalter)
// oder, falls für das Ereignis ein echtes Asset hinterlegt ist, als Audiodatei.
//
// Bewusst frei von React, damit die Logik isoliert testbar ist. Die Anbindung
// an die UI passiert über useSound(). Ein einzelner AudioContext wird erst nach
// einer Nutzergeste erzeugt/„entsperrt" (Browser-Autoplay-Richtlinie).

import { SOUNDS, type SoundEvent, type ToneSpec } from './events';
import { hasMusic, MUSIC } from './music';

const STORAGE_KEY = 'dicemice.muted';
const MUSIC_KEY = 'dicemice.music';

type AudioCtor = typeof AudioContext;

function readFlag(key: string, fallback: boolean): boolean {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : v === '1';
  } catch {
    return fallback;
  }
}

function persistFlag(key: string, on: boolean): void {
  try {
    localStorage.setItem(key, on ? '1' : '0');
  } catch {
    // Privatmodus o. Ä. – Wert bleibt dann nur für die Sitzung.
  }
}

export class SoundManager {
  private ctx: AudioContext | null = null;
  private muted: boolean;
  /** Cache für echte Audio-Assets (pro src eine wiederverwendbare Quelle). */
  private assets = new Map<string, HTMLAudioElement>();
  private musicEl: HTMLAudioElement | null = null;
  private musicOn: boolean;

  constructor() {
    this.muted = readFlag(STORAGE_KEY, false);
    this.musicOn = readFlag(MUSIC_KEY, false);
  }

  isMuted(): boolean {
    return this.muted;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    persistFlag(STORAGE_KEY, muted);
    this.syncMusic();
  }

  toggleMuted(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  // --- Hintergrundmusik (slot-basiert; aktiv nur wenn ein Track hinterlegt ist) ---
  musicAvailable(): boolean {
    return hasMusic();
  }

  isMusicOn(): boolean {
    return this.musicOn;
  }

  setMusic(on: boolean): void {
    this.musicOn = on;
    persistFlag(MUSIC_KEY, on);
    this.syncMusic();
  }

  toggleMusic(): boolean {
    this.setMusic(!this.musicOn);
    return this.musicOn;
  }

  private syncMusic(): void {
    if (!this.musicAvailable()) return;
    if (this.musicOn && !this.muted) {
      if (!this.musicEl) {
        this.musicEl = new Audio(MUSIC.src);
        this.musicEl.loop = true;
        this.musicEl.volume = 0.35;
      }
      void this.musicEl.play().catch(() => {
        // Wiedergabe blockiert (z. B. fehlende Geste) – startet bei nächster Geste.
      });
    } else if (this.musicEl) {
      this.musicEl.pause();
    }
  }

  /**
   * Stellt sicher, dass ein (laufender) AudioContext existiert. Sollte nach
   * einer Nutzergeste aufgerufen werden, sonst bleibt der Context „suspended".
   */
  unlock(): void {
    this.ensureCtx();
    this.syncMusic();
  }

  private ensureCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const Ctor: AudioCtor | undefined =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext;
    if (!Ctor) return null;
    if (!this.ctx) {
      try {
        this.ctx = new Ctor();
      } catch {
        return null;
      }
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  /** Spielt das Klang-Ereignis (no-op bei Stummschaltung oder ohne Audio-API). */
  play(event: SoundEvent): void {
    if (this.muted) return;
    const spec = SOUNDS[event];
    if (!spec) return;

    if (spec.src) {
      this.playAsset(spec.src);
      return;
    }

    const ctx = this.ensureCtx();
    if (!ctx) return;
    let at = ctx.currentTime;
    for (const tone of spec.tones) {
      this.playTone(ctx, tone, at);
      at += tone.dur;
    }
  }

  private playTone(ctx: AudioContext, tone: ToneSpec, start: number): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const peak = tone.gain ?? 0.2;

    osc.type = tone.type ?? 'sine';
    osc.frequency.setValueAtTime(tone.freq, start);
    if (tone.to !== undefined) {
      osc.frequency.linearRampToValueAtTime(tone.to, start + tone.dur);
    }

    // Kurze Attack/Release-Hüllkurve gegen Knackser.
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(peak, start + Math.min(0.01, tone.dur / 2));
    gain.gain.linearRampToValueAtTime(0, start + tone.dur);

    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + tone.dur + 0.02);
  }

  private playAsset(src: string): void {
    let base = this.assets.get(src);
    if (!base) {
      base = new Audio(src);
      base.preload = 'auto';
      this.assets.set(src, base);
    }
    // Klon erlaubt überlappende Wiedergabe desselben Effekts.
    const node = base.cloneNode(true) as HTMLAudioElement;
    void node.play().catch(() => {
      // Wiedergabe blockiert (z. B. fehlende Geste) – bewusst ignoriert.
    });
  }
}

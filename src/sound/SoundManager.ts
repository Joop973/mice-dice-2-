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
const VOLUME_KEY = 'dicemice.volume';

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

function readNum(key: string, fallback: number): number {
  try {
    const v = localStorage.getItem(key);
    const n = v === null ? NaN : Number(v);
    return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : fallback;
  } catch {
    return fallback;
  }
}

export class SoundManager {
  private ctx: AudioContext | null = null;
  private muted: boolean;
  /** Master-Gain zwischen allen Klängen und dem Ausgang (Lautstärke). */
  private masterGain: GainNode | null = null;
  private volume: number;
  /** Cache für echte Audio-Assets (pro src eine wiederverwendbare Quelle). */
  private assets = new Map<string, HTMLAudioElement>();
  private musicEl: HTMLAudioElement | null = null;
  private musicOn: boolean;
  // Prozeduraler Musik-Generator (wenn kein echtes Asset hinterlegt ist).
  private musicGain: GainNode | null = null;
  private musicTimer: ReturnType<typeof setInterval> | null = null;
  private musicNextTime = 0;
  private musicStep = 0;

  constructor() {
    this.muted = readFlag(STORAGE_KEY, false);
    this.musicOn = readFlag(MUSIC_KEY, false);
    this.volume = readNum(VOLUME_KEY, 0.8);
  }

  isMuted(): boolean {
    return this.muted;
  }

  getVolume(): number {
    return this.volume;
  }

  setVolume(v: number): void {
    this.volume = Math.max(0, Math.min(1, v));
    try {
      localStorage.setItem(VOLUME_KEY, String(this.volume));
    } catch {
      // ignorieren
    }
    if (this.masterGain) this.masterGain.gain.value = this.volume;
    if (this.musicEl) this.musicEl.volume = 0.35 * this.volume;
  }

  /** Lazy-erzeugter Master-Gain-Knoten (Lautstärke), an den alles geht. */
  private master(ctx: AudioContext): GainNode {
    if (!this.masterGain) {
      this.masterGain = ctx.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(ctx.destination);
    }
    return this.masterGain;
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

  // --- Hintergrundmusik: echtes Asset (falls hinterlegt) oder prozeduraler Loop ---
  musicAvailable(): boolean {
    return true; // ohne Asset wird prozedural erzeugt
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
    const wantMusic = this.musicOn && !this.muted;
    if (hasMusic()) {
      // Echtes Asset hat Vorrang.
      if (wantMusic) {
        if (!this.musicEl) {
          this.musicEl = new Audio(MUSIC.src);
          this.musicEl.loop = true;
        }
        this.musicEl.volume = 0.35 * this.volume;
        void this.musicEl.play().catch(() => {
          // Wiedergabe blockiert (fehlende Geste) – startet bei nächster Geste.
        });
      } else if (this.musicEl) {
        this.musicEl.pause();
      }
      return;
    }
    // Kein Asset -> prozeduraler Pad-Loop.
    if (wantMusic) this.startProceduralMusic();
    else this.stopProceduralMusic();
  }

  // Sanfter Ambient-Loop: warme Pad-Akkorde, im Voraus geplant (Lookahead-Scheduler).
  private startProceduralMusic(): void {
    if (this.musicTimer) return;
    const ctx = this.ensureCtx();
    if (!ctx) return;
    if (!this.musicGain) {
      this.musicGain = ctx.createGain();
      this.musicGain.gain.value = 0.16;
      this.musicGain.connect(this.master(ctx));
    }
    this.musicNextTime = ctx.currentTime + 0.1;
    this.musicStep = 0;
    const schedule = () => {
      const c = this.ctx;
      if (!c || !this.musicGain) return;
      // Plane alle fälligen Akkorde der nächsten Sekunde ein.
      while (this.musicNextTime < c.currentTime + 1) {
        this.scheduleChord(c, this.musicGain, this.musicNextTime);
        this.musicNextTime += 2.6; // Akkord-Abstand (s)
        this.musicStep++;
      }
    };
    schedule();
    this.musicTimer = setInterval(schedule, 500);
  }

  private stopProceduralMusic(): void {
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  /** Ein warmer, leiser Akkord (Maus-/Käse-Stimmung), sanft ein-/ausgeblendet. */
  private scheduleChord(ctx: AudioContext, out: GainNode, at: number): void {
    // Vier-Akkord-Schleife in A-Moll-Pentatonik (ruhig, freundlich).
    const roots = [220, 196, 174.61, 164.81]; // A3 G3 F3 E3
    const root = roots[this.musicStep % roots.length];
    const voices = [root, root * 1.5, root * 2]; // Grundton, Quinte, Oktave
    const dur = 2.8;
    voices.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = i === 2 ? 'triangle' : 'sine';
      osc.frequency.value = freq;
      const peak = i === 0 ? 0.5 : 0.3;
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(peak, at + 0.6);
      g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
      osc.connect(g).connect(out);
      osc.start(at);
      osc.stop(at + dur + 0.05);
    });
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
    const base = ctx.currentTime;
    let cursor = base;
    for (const tone of spec.tones) {
      // `delay` -> ab Ereignisbeginn überlagern; sonst sequenziell anhängen.
      const start = tone.delay !== undefined ? base + tone.delay : cursor;
      if (tone.noise) this.playNoise(ctx, tone, start);
      else this.playTone(ctx, tone, start);
      if (tone.delay === undefined) cursor = start + tone.dur;
    }
  }

  /** Kurzer Rausch-Burst (Würfelrattern/Holzklack) mit Tiefpass + Hüllkurve. */
  private playNoise(ctx: AudioContext, tone: ToneSpec, start: number): void {
    const dur = tone.dur;
    const length = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;

    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(tone.freq, start);

    const gain = ctx.createGain();
    const peak = tone.gain ?? 0.15;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(peak, start + Math.min(0.005, dur / 2));
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);

    src.connect(filter).connect(gain).connect(this.master(ctx));
    src.start(start);
    src.stop(start + dur + 0.02);
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

    osc.connect(gain).connect(this.master(ctx));
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

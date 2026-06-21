// Globale Nutzer-Einstellungen (außerhalb der Sound-Domäne) als versionierter
// localStorage-Store + Listener, damit useSettings() per useSyncExternalStore
// auch tief liegende Komponenten ohne Prop-Drilling aktualisiert.
// jsdom-/Privatmodus-sicher (try/catch).

const KEY = 'dicemice.settings';
const VERSION = 1;

export interface Settings {
  /** Vibration erlaubt (zusätzlich zu Mute/Reduced-Motion-Gate). */
  haptics: boolean;
  /** Bewegung reduzieren – additiv zur System-Einstellung. */
  reduceMotion: boolean;
  /** Farbenblind-Modus: Glyphen zusätzlich zur Farbe. */
  colorblind: boolean;
}

const DEFAULTS: Settings = { haptics: true, reduceMotion: false, colorblind: false };

let current: Settings = load();
const listeners = new Set<() => void>();

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as { version?: number } & Partial<Settings>;
    if (parsed.version !== VERSION) return { ...DEFAULTS };
    return {
      haptics: parsed.haptics ?? DEFAULTS.haptics,
      reduceMotion: parsed.reduceMotion ?? DEFAULTS.reduceMotion,
      colorblind: parsed.colorblind ?? DEFAULTS.colorblind,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

function persist(): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ version: VERSION, ...current }));
  } catch {
    // ignorieren
  }
}

export function getSettings(): Settings {
  return current;
}

export function setSetting<K extends keyof Settings>(key: K, value: Settings[K]): void {
  if (current[key] === value) return;
  current = { ...current, [key]: value };
  persist();
  for (const fn of listeners) fn();
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

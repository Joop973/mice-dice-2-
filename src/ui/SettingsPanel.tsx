// Einstellungs-Bildschirm: Ton/Lautstärke/Musik (Sound-Domäne) + Haptik,
// Bewegung reduzieren und Farbenblind-Modus (Settings-Store).

import { useSound } from '../sound';
import { useSettings } from './useSettings';
import { setSetting } from './settings';

export function SettingsPanel({ onBack }: { onBack: () => void }) {
  const { muted, toggleMuted, musicOn, toggleMusic, volume, setVolume } = useSound();
  const s = useSettings();

  return (
    <div className="app">
      <header className="app__header">
        <h1>🧀 Dice Mice</h1>
        <p className="hint">Einstellungen</p>
      </header>

      <section className="panel">
        <h2>Klang</h2>

        <label className="field" htmlFor="set-vol">
          <span className="field__label">Lautstärke</span>
          <input
            id="set-vol"
            type="range"
            min={0}
            max={100}
            value={Math.round(volume * 100)}
            onChange={(e) => setVolume(Number(e.target.value) / 100)}
          />
        </label>

        <label className="field toggle">
          <span className="field__label">Ton</span>
          <input type="checkbox" checked={!muted} onChange={toggleMuted} />
        </label>

        <label className="field toggle">
          <span className="field__label">Musik</span>
          <input type="checkbox" checked={musicOn} onChange={toggleMusic} />
        </label>

        <h2>Bedienung</h2>

        <label className="field toggle">
          <span className="field__label">Vibration (Haptik)</span>
          <input
            type="checkbox"
            checked={s.haptics}
            onChange={(e) => setSetting('haptics', e.target.checked)}
          />
        </label>

        <label className="field toggle">
          <span className="field__label">Bewegung reduzieren</span>
          <input
            type="checkbox"
            checked={s.reduceMotion}
            onChange={(e) => setSetting('reduceMotion', e.target.checked)}
          />
        </label>

        <label className="field toggle">
          <span className="field__label">Farbenblind-Modus (Symbole)</span>
          <input
            type="checkbox"
            checked={s.colorblind}
            onChange={(e) => setSetting('colorblind', e.target.checked)}
          />
        </label>
      </section>

      <div className="actions">
        <button className="ghost" onClick={onBack}>
          ← Zurück
        </button>
      </div>
    </div>
  );
}

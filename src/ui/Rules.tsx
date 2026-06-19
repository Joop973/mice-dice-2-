// In-App-Spielregeln: Ziel, Rundenablauf und Würfel-Katalog mit Wertung.
// Statischer Erklär-Screen, damit neue Spieler das Spiel in der App lernen.

import type { DieColor } from '../engine';
import { DIE_COLORS, DIE_LABELS } from './colors';

const PHASES: { title: string; text: string }[] = [
  { title: '1 · Würfeln', text: 'Alle Mäuse werfen ihren kompletten Würfelbeutel.' },
  {
    title: '2 · Mitleidswürfel',
    text: 'Mäuse unter dem Spitzenstand erhalten einen zusätzlichen gelben W6 für diese Runde.',
  },
  {
    title: '3 · Klar tauschen',
    text: 'Klar-Würfel dürfen einmal neu geworfen werden. Andere Farben bleiben.',
  },
  {
    title: '4 · Drafting',
    text: 'Die Runde wird gewertet, dann wählt reihum jede Maus einen neuen Würfel aus dem Angebot (oder passt). Er kommt erst ab der nächsten Runde zum Einsatz.',
  },
];

const CATALOG: { color: DieColor; dice: string; scoring: string }[] = [
  { color: 'yellow', dice: 'W6, W8', scoring: 'Summe. Höchste Gelb-Summe trägt die 👑 Käse-Krone.' },
  { color: 'green', dice: 'W20', scoring: 'Summe.' },
  { color: 'blue', dice: 'W6/8/12 (+ Glitzer)', scoring: 'Summe. Blau + Blau-Glitzer zählen für Orange als eine Farbe.' },
  { color: 'purple', dice: 'W8, W12', scoring: 'Summe.' },
  { color: 'pink', dice: 'W12', scoring: 'Summe.' },
  { color: 'red', dice: 'W6, W8', scoring: 'Faces positiv UND negativ — kann Punkte kosten.' },
  { color: 'clear', dice: 'W6', scoring: 'Utility: in Phase 3 neu würfelbar. Zählt standardmäßig nicht zur Wertung.' },
  { color: 'orange', dice: 'W3', scoring: 'Wert × Anzahl verschiedener Farben, die du diese Runde geworfen hast.' },
  { color: 'sabotage', dice: 'W8, W12', scoring: 'Summe wird dem Kronenhalter abgezogen (sonst dem Werfer selbst nichts).' },
  { color: 'brown', dice: 'Faces 2–3', scoring: 'Summe × größte gleiche Gruppe (Mengen-Bonus).' },
];

export function Rules({ onBack }: { onBack: () => void }) {
  return (
    <div className="app">
      <header className="app__header">
        <h1>🧀 Spielregeln</h1>
        <p className="hint">Würfle clever, sammle Käse, schnapp dir die Krone.</p>
      </header>

      <section className="panel">
        <h2>Ziel</h2>
        <p className="rules__p">
          Über <strong>10 Runden</strong> die meisten Punkte sammeln. Jede Runde baust
          du deinen Würfelbeutel weiter aus und wertest deine Würfe.
        </p>
      </section>

      <section className="panel">
        <h2>Eine Runde</h2>
        <ol className="rules__phases">
          {PHASES.map((p) => (
            <li key={p.title}>
              <span className="rules__phase-title">{p.title}</span>
              <span className="rules__phase-text">{p.text}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="panel">
        <h2>Würfel & Wertung</h2>
        <ul className="rules__catalog">
          {CATALOG.map((c) => (
            <li key={c.color} className="rules__die">
              <span
                className="rules__swatch"
                style={{ background: DIE_COLORS[c.color] }}
                aria-hidden="true"
              />
              <div>
                <span className="rules__die-name">
                  {DIE_LABELS[c.color]} <em className="muted">· {c.dice}</em>
                </span>
                <span className="rules__die-scoring">{c.scoring}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <h2>Käse-Krone & Sabotage</h2>
        <p className="rules__p">
          Wer in einer Runde die höchste <strong>Gelb-Summe</strong> hat, hält die
          Krone. <strong>Sabotage</strong>-Würfel ziehen ihre Summe dem Kronenhalter ab
          — hältst du selbst die Krone, trifft es die zweitplatzierte Maus.
          Endpunkte einer Runde dürfen <strong>negativ</strong> werden.
        </p>
      </section>

      <div className="actions">
        <button className="ghost" onClick={onBack}>
          ← Zurück
        </button>
      </div>
    </div>
  );
}

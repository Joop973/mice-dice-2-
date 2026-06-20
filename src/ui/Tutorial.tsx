// Erststart-Tutorial: kompaktes Overlay, das die 4 Phasen + Käse-Krone + Sabotage
// erklärt. Wird per localStorage-Flag nur einmal automatisch gezeigt; im Menü
// jederzeit erneut aufrufbar.

import { useEffect, useRef } from 'react';

const KEY = 'dicemice.onboarded';

export function isOnboarded(): boolean {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return true; // Im Zweifel nicht nerven.
  }
}

function setOnboarded(): void {
  try {
    localStorage.setItem(KEY, '1');
  } catch {
    // ignorieren
  }
}

const STEPS: { icon: string; title: string; text: string }[] = [
  {
    icon: '🎲',
    title: '1 · Würfeln',
    text: 'Alle Mäuse werfen ihren Beutel. Tippe „Würfeln", um deinen Wurf aufzudecken.',
  },
  {
    icon: '🫶',
    title: '2 · Mitleidswürfel',
    text: 'Schwächere Mäuse bekommen einen Extra-Würfel – fair bleibt fair.',
  },
  {
    icon: '🔄',
    title: '3 · Klar tauschen',
    text: 'Klar-Würfel kannst du antippen und neu würfeln. Andere Farben bleiben.',
  },
  {
    icon: '🛒',
    title: '4 · Drafting',
    text: 'Reihum nimmst du dir einen Würfel aus der Tischmitte – oder passt.',
  },
  {
    icon: '🧀👑',
    title: 'Käse-Krone',
    text: 'Wer am meisten Käse-Punkte hat, trägt die Krone und kassiert Bonus pro Runde.',
  },
  {
    icon: '🐭',
    title: 'Sabotage',
    text: 'Sabotage-Würfel knabbern Punkte vom Kronenhalter ab. Wähle klug!',
  },
];

export function Tutorial({ onClose }: { onClose: () => void }) {
  const btnRef = useRef<HTMLButtonElement>(null);

  function dismiss() {
    setOnboarded();
    onClose();
  }

  // Auto-Fokus auf „Verstanden" + Esc schließt (kleiner Dialog-Komfort).
  useEffect(() => {
    btnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="tutorial" role="dialog" aria-modal="true" aria-label="Tutorial">
      <div className="tutorial__card">
        <h2 className="tutorial__title">So spielt sich Dice Mice</h2>
        <ul className="tutorial__steps">
          {STEPS.map((s) => (
            <li key={s.title} className="tutorial__step">
              <span className="tutorial__icon" aria-hidden="true">
                {s.icon}
              </span>
              <span>
                <strong>{s.title}</strong>
                <br />
                {s.text}
              </span>
            </li>
          ))}
        </ul>
        <button ref={btnRef} onClick={dismiss}>
          Verstanden 🧀
        </button>
      </div>
    </div>
  );
}

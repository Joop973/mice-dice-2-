// „Würfeln"-Knopf: rein präsentationaler Reveal. Die Würfel sind in der Engine
// längst geworfen (Werte stehen in state); dieser Knopf deckt sie mit einem
// kurzen Schüttel-Moment auf und spielt den Wurf-Sound. Kein Engine-/Netz-Effekt.

import { useState } from 'react';
import { useSound, vibrate } from '../sound';

const SHAKE_MS = 350;

/** Animation nur, wenn matchMedia verfügbar ist UND reduced-motion NICHT gesetzt. */
function shouldAnimate(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function RollButton({ onReveal }: { onReveal: () => void }) {
  const { play, muted } = useSound();
  const [rolling, setRolling] = useState(false);

  function roll() {
    if (rolling) return;
    play('roll');
    if (!muted) vibrate('roll');
    if (!shouldAnimate()) {
      onReveal();
      return;
    }
    setRolling(true);
    window.setTimeout(() => {
      setRolling(false);
      onReveal();
    }, SHAKE_MS);
  }

  return (
    <div className="roll">
      <button
        className={`roll__btn${rolling ? ' roll__btn--shake' : ''}`}
        onClick={roll}
        disabled={rolling}
      >
        🎲 Würfeln
      </button>
    </div>
  );
}

// Wählt die Würfel-Darstellung: 3D (react-three-fiber) oder 2D-Platzhalter.
// Kapselt die Fallback-Logik, damit PlayerCard nichts davon wissen muss.

import { lazy, Suspense } from 'react';
import type { RolledDie } from '../engine';
import { Die } from './Die';
import { DiceErrorBoundary } from './dice3d/DiceErrorBoundary';
import { isWebGLAvailable } from './dice3d/webgl';

// three.js + r3f werden erst geladen, wenn der 3D-Modus tatsächlich aktiv ist.
// Hält den Initial-Load klein; der 2D-/Solo-Modus läuft ohne 3D-Bundle.
const DiceCanvas = lazy(() =>
  import('./dice3d/DiceCanvas').then((m) => ({ default: m.DiceCanvas }))
);

interface DiceViewProps {
  dice: RolledDie[];
  use3d: boolean;
  selectedDieIds?: Set<string>;
  onToggleClear?: (dieId: string) => void;
}

function TwoD({ dice, selectedDieIds, onToggleClear }: Omit<DiceViewProps, 'use3d'>) {
  return (
    <div className="dice">
      {dice.length === 0 && <span className="dice__empty">noch nicht gewürfelt</span>}
      {dice.map((d) => {
        const clickable = onToggleClear && d.color === 'clear';
        return (
          <Die
            key={`${d.id}#${d.value}`}
            die={d}
            pity={d.isPity}
            selected={selectedDieIds?.has(d.id)}
            onClick={clickable ? () => onToggleClear!(d.id) : undefined}
          />
        );
      })}
    </div>
  );
}

export function DiceView({ dice, use3d, selectedDieIds, onToggleClear }: DiceViewProps) {
  const twoD = <TwoD dice={dice} selectedDieIds={selectedDieIds} onToggleClear={onToggleClear} />;

  if (!use3d || dice.length === 0 || !isWebGLAvailable()) return twoD;

  return (
    <div className="dice3d">
      <DiceErrorBoundary fallback={twoD}>
        <Suspense fallback={twoD}>
          <DiceCanvas dice={dice} selectedDieIds={selectedDieIds} onToggleClear={onToggleClear} />
        </Suspense>
      </DiceErrorBoundary>
    </div>
  );
}

// 3D-Würfelreihe eines Spielers in einem react-three-fiber <Canvas>.
// Eine Szene pro Spieler-Karte (max. 4 Spieler -> max. 4 WebGL-Kontexte).

import { Canvas } from '@react-three/fiber';
import type { RolledDie } from '../../engine';
import { Die3D } from './Die3D';

interface DiceCanvasProps {
  dice: RolledDie[];
  selectedDieIds?: Set<string>;
  onToggleClear?: (dieId: string) => void;
}

const SPACING = 1.35;

export function DiceCanvas({ dice, selectedDieIds, onToggleClear }: DiceCanvasProps) {
  const n = Math.max(dice.length, 1);
  // Kamera so weit zurück, dass alle Würfel der Reihe ins Bild passen.
  const camZ = Math.max(4, n * SPACING * 0.95);

  return (
    <Canvas
      className="dice-canvas"
      dpr={[1, 2]}
      camera={{ position: [0, 0.6, camZ], fov: 40 }}
      gl={{ antialias: false, alpha: true }}
    >
      <ambientLight intensity={0.75} />
      <directionalLight position={[3, 6, 5]} intensity={0.9} />
      <directionalLight position={[-4, 2, 2]} intensity={0.25} />
      {dice.map((d, i) => {
        const clickable = onToggleClear && d.color === 'clear';
        return (
          <Die3D
            key={d.id}
            die={d}
            position={[(i - (n - 1) / 2) * SPACING, 0, 0]}
            selected={selectedDieIds?.has(d.id)}
            pity={d.isPity}
            onClick={clickable ? () => onToggleClear!(d.id) : undefined}
          />
        );
      })}
    </Canvas>
  );
}

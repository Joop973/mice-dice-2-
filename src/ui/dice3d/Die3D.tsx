// Einzelner 3D-Würfel (react-three-fiber). Farbiger Würfel mit Zahl auf allen
// Seiten; bei jedem neuen Wert eine kurze Wurf-/Tumble-Animation, die danach
// ausgedämpft wird. Klar-Würfel sind in der Swap-Phase anklickbar.

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import type { RolledDie } from '../../engine';
import { DIE_COLORS } from '../colors';
import { THEME } from '../theme';
import { dieTexture } from './dieTexture';

interface Die3DProps {
  die: RolledDie;
  position: [number, number, number];
  selected?: boolean;
  pity?: boolean;
  onClick?: () => void;
}

const ACCENT = new THREE.Color(THEME.cheese500);
const PITY = new THREE.Color(THEME.good500);
const BLACK = new THREE.Color(THEME.black);

export function Die3D({ die, position, selected, pity, onClick }: Die3DProps) {
  const group = useRef<THREE.Group>(null);
  const spin = useRef(0.7); // Sekunden Rest-Tumble; >0 beim Mount = Wurf-Gefühl
  const prevValue = useRef(die.value);

  const texture = useMemo(
    () => dieTexture(die.value, DIE_COLORS[die.color]),
    [die.value, die.color]
  );

  // Neuer Wert -> erneut werfen (Tumble auslösen).
  useEffect(() => {
    if (prevValue.current !== die.value) {
      prevValue.current = die.value;
      spin.current = 0.7;
    }
  }, [die.value]);

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    const d = Math.min(delta, 0.05); // gegen Sprünge bei Tab-Wechseln
    if (spin.current > 0) {
      spin.current -= d;
      g.rotation.x += d * 14;
      g.rotation.y += d * 10;
    } else {
      // Sanft zur Ruhelage (Vorderseite zur Kamera) dämpfen.
      g.rotation.x += (0 - g.rotation.x) * Math.min(1, d * 8);
      g.rotation.y += (0 - g.rotation.y) * Math.min(1, d * 8);
    }
  });

  const emissive = pity ? PITY : selected ? ACCENT : BLACK;
  const emissiveIntensity = pity ? 0.35 : selected ? 0.45 : 0;
  const scale = selected ? 1.12 : 1;

  const handleClick = onClick
    ? (e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onClick();
      }
    : undefined;

  const handlePointer = onClick
    ? (cursor: string) => () => {
        document.body.style.cursor = cursor;
      }
    : undefined;

  return (
    <group
      ref={group}
      position={position}
      scale={scale}
      onClick={handleClick}
      onPointerOver={handlePointer?.('pointer')}
      onPointerOut={handlePointer?.('auto')}
    >
      <mesh castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          map={texture}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          roughness={0.45}
          metalness={0.1}
        />
      </mesh>
    </group>
  );
}

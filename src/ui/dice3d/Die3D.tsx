// Einzelner 3D-Würfel (react-three-fiber). Farbiger Würfel mit Zahl auf allen
// Seiten; bei jedem neuen Wert eine kurze Wurf-/Tumble-Animation, die danach
// ausgedämpft wird. Klar-Würfel sind in der Swap-Phase anklickbar.

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import type { RolledDie } from '../../engine';
import { DIE_COLORS } from '../colors';
import { THEME } from '../theme';
import { prefersReducedMotion } from '../../motion';
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
  // Bewegungsreduzierung: kein Tumble, Würfel ruht zur Kamera (No-op).
  const reduced = prefersReducedMotion();
  const ROLL_TIME = 1.15; // Sekunden Wurf-Tumble beim Mount/neuem Wert
  const spin = useRef(reduced ? 0 : ROLL_TIME);
  const prevValue = useRef(die.value);

  const texture = useMemo(
    () => dieTexture(die.value, DIE_COLORS[die.color]),
    [die.value, die.color]
  );

  // Neuer Wert -> erneut werfen (Tumble auslösen) — außer bei reduced-motion.
  useEffect(() => {
    if (prevValue.current !== die.value) {
      prevValue.current = die.value;
      if (!reduced) spin.current = ROLL_TIME;
    }
  }, [die.value, reduced]);

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    if (reduced) {
      g.rotation.set(0, 0, 0);
      g.position.y = position[1];
      return;
    }
    const d = Math.min(delta, 0.05); // gegen Sprünge bei Tab-Wechseln
    if (spin.current > 0) {
      spin.current -= d;
      // Mehrachsiges Tumbeln, das gegen Ende ausläuft (ease-out).
      const speed = Math.max(0.15, spin.current / ROLL_TIME);
      g.rotation.x += d * 26 * speed;
      g.rotation.y += d * 19 * speed;
      g.rotation.z += d * 11 * speed;
      // Kleiner Hüpfer wie ein geworfener Würfel auf dem Tisch.
      g.position.y = position[1] + Math.abs(Math.sin(spin.current * 9)) * 0.45 * speed;
    } else {
      // Sanft in die Ruhelage (Vorderseite zur Kamera) + auf den Tisch dämpfen.
      const k = Math.min(1, d * 9);
      g.rotation.x += (0 - g.rotation.x) * k;
      g.rotation.y += (0 - g.rotation.y) * k;
      g.rotation.z += (0 - g.rotation.z) * k;
      g.position.y += (position[1] - g.position.y) * k;
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
          roughness={1}
          metalness={0}
        />
      </mesh>
    </group>
  );
}

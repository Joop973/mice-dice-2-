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
  /** Wurf-Modus: Würfel kommt aus der „Hand" und kullert über den Tisch an seinen Platz. */
  roll?: boolean;
  onClick?: () => void;
}

const ACCENT = new THREE.Color(THEME.cheese500);
const PITY = new THREE.Color(THEME.good500);
const BLACK = new THREE.Color(THEME.black);

export function Die3D({ die, position, selected, pity, roll, onClick }: Die3DProps) {
  const group = useRef<THREE.Group>(null);
  // Bewegungsreduzierung: kein Tumble, Würfel ruht zur Kamera (No-op).
  const reduced = prefersReducedMotion();
  const ROLL_TIME = 1.25; // Sekunden Wurf-Tumble beim Mount/neuem Wert
  const spin = useRef(reduced ? 0 : ROLL_TIME);
  const prevValue = useRef(die.value);

  // Startpunkt im Wurf-Modus: unten/seitlich (aus der „Hand"), dann an den Platz.
  const start = useRef<THREE.Vector3 | null>(null);
  if (start.current === null) {
    start.current =
      roll && !reduced
        ? new THREE.Vector3(
            position[0] * 0.25 + (Math.random() * 1.6 - 0.8),
            -2.9,
            position[2] + 0.8
          )
        : new THREE.Vector3(position[0], position[1], position[2]);
  }

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
      g.position.set(position[0], position[1], position[2]);
      return;
    }
    const d = Math.min(delta, 0.05); // gegen Sprünge bei Tab-Wechseln
    const s = start.current as THREE.Vector3;
    if (spin.current > 0) {
      spin.current -= d;
      // Mehrachsiges Tumbeln, das gegen Ende ausläuft (ease-out).
      const speed = Math.max(0.15, spin.current / ROLL_TIME);
      g.rotation.x += d * 30 * speed;
      g.rotation.y += d * 21 * speed;
      g.rotation.z += d * 12 * speed;
      // Fortschritt 0..1 mit Ease-out: aus der Hand an den Zielplatz kullern.
      const t = 1 - Math.max(0, spin.current) / ROLL_TIME;
      const ease = 1 - (1 - t) * (1 - t);
      const bounce = Math.abs(Math.sin(spin.current * 9)) * 0.5 * speed;
      g.position.x = THREE.MathUtils.lerp(s.x, position[0], ease);
      g.position.z = THREE.MathUtils.lerp(s.z, position[2], ease);
      g.position.y = THREE.MathUtils.lerp(s.y, position[1], ease) + bounce;
    } else {
      // Sanft in die Ruhelage (Vorderseite zur Kamera) + auf den Tisch dämpfen.
      const k = Math.min(1, d * 9);
      g.rotation.x += (0 - g.rotation.x) * k;
      g.rotation.y += (0 - g.rotation.y) * k;
      g.rotation.z += (0 - g.rotation.z) * k;
      g.position.x += (position[0] - g.position.x) * k;
      g.position.y += (position[1] - g.position.y) * k;
      g.position.z += (position[2] - g.position.z) * k;
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

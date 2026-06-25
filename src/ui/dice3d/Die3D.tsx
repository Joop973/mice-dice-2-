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
  /** Reihen-Index (für gestaffeltes Landen im Wurf-Modus). */
  index?: number;
  onClick?: () => void;
}

const ACCENT = new THREE.Color(THEME.cheese500);
const PITY = new THREE.Color(THEME.good500);
const BLACK = new THREE.Color(THEME.black);
const HALF_PI = Math.PI / 2;
const randSpin = () =>
  new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1)
    .normalize()
    .multiplyScalar(16 + Math.random() * 10);

export function Die3D({ die, position, selected, pity, roll, index = 0, onClick }: Die3DProps) {
  const group = useRef<THREE.Group>(null);
  // Bewegungsreduzierung: kein Tumble, Würfel ruht zur Kamera (No-op).
  const reduced = prefersReducedMotion();
  const ROLL_TIME = 1.2; // Sekunden Wurf-Tumble
  const delay = roll ? index * 0.12 : 0; // gestaffeltes Landen
  const spin = useRef(reduced ? 0 : ROLL_TIME + delay);
  const av = useRef(randSpin()); // Winkelgeschwindigkeit (läuft weich aus)
  const prevValue = useRef(die.value);

  // Startpunkt im Wurf-Modus: unten/seitlich (aus der „Hand"), dann an den Platz.
  const start = useRef<THREE.Vector3 | null>(null);
  if (start.current === null) {
    start.current =
      roll && !reduced
        ? new THREE.Vector3(
            position[0] * 0.2 + (Math.random() * 1.6 - 0.8),
            -3,
            position[2] + 1
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
      if (!reduced) {
        spin.current = ROLL_TIME;
        av.current = randSpin();
      }
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
      // Wartephase (gestaffelt): noch in der „Hand", kein Tumbeln.
      if (spin.current > ROLL_TIME) {
        g.position.set(s.x, s.y, s.z);
        return;
      }
      // Tumbeln mit weich auslaufender Winkelgeschwindigkeit.
      g.rotation.x += av.current.x * d;
      g.rotation.y += av.current.y * d;
      g.rotation.z += av.current.z * d;
      av.current.multiplyScalar(Math.exp(-2 * d));
      // Reise aus der Hand an den Platz (easeOutCubic) + Aufprall-Hüpfer.
      const p = 1 - spin.current / ROLL_TIME;
      const e = 1 - Math.pow(1 - p, 3);
      const bounce = Math.abs(Math.sin(p * Math.PI * 2.5)) * 0.45 * (1 - p);
      g.position.x = THREE.MathUtils.lerp(s.x, position[0], e);
      g.position.z = THREE.MathUtils.lerp(s.z, position[2], e);
      g.position.y = THREE.MathUtils.lerp(s.y, position[1], e) + bounce;
    } else {
      // Einrasten: auf die nächste 90°-Lage (eine Fläche zeigt) + auf den Tisch.
      const k = Math.min(1, d * 11);
      g.rotation.x += (Math.round(g.rotation.x / HALF_PI) * HALF_PI - g.rotation.x) * k;
      g.rotation.y += (Math.round(g.rotation.y / HALF_PI) * HALF_PI - g.rotation.y) * k;
      g.rotation.z += (Math.round(g.rotation.z / HALF_PI) * HALF_PI - g.rotation.z) * k;
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

// Lebendige Speisekammer-Kulisse für Startbildschirm und Lobby.
// Reine Deko (aria-hidden); alle Bewegungen sind in scene.css definiert und bei
// prefers-reduced-motion abgeschaltet. Die Mäuse-/Würfel-Sprites bleiben die
// vorhandenen Pixel-Assets (MouseAvatar), damit der Stil konsistent ist.

import type { ReactNode } from 'react';
import { MouseAvatar } from '../MouseAvatar';
import './scene.css';

/** Zufällig gestreute, langsam aufsteigende Staubpartikel im Lichtschein. */
function DustMotes({ count = 14 }: { count?: number }) {
  return (
    <div className="motes" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          style={{
            left: `${(i * 37) % 100}%`,
            top: `${20 + ((i * 53) % 70)}%`,
            animationDelay: `${(i % 7) * 1.3}s`,
            animationDuration: `${8 + (i % 5)}s`,
          }}
        />
      ))}
    </div>
  );
}

/** Vollflächige Hintergrund-Kulisse: Wand, Regal mit Vorräten, Laterne, Knoblauch. */
export function KitchenScene({ children }: { children?: ReactNode }) {
  return (
    <div className="scene">
      {/* Regal mit Gläsern und Pflanze. */}
      <div className="scene__shelf" aria-hidden="true">
        <span className="jar jar--honey">
          <span className="jar__lid" />
          <span className="steam" />
        </span>
        <span className="jar jar--jam">
          <span className="jar__lid" />
          <span className="steam" />
        </span>
        <span className="plant">
          <span className="plant__leaf" />
          <span className="plant__leaf" />
          <span className="plant__leaf" />
          <span className="plant__pot" />
        </span>
        <span className="jar jar--tea">
          <span className="jar__lid" />
        </span>
      </div>

      {/* Hängende Laterne mit flackerndem Licht. */}
      <div className="lantern" aria-hidden="true">
        <span className="lantern__glow" />
        <span className="lantern__cap" />
        <span className="lantern__body">
          <span className="lantern__flame" />
        </span>
      </div>

      {/* Knoblauchzopf. */}
      <div className="garlic" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>

      <DustMotes />

      <div className="scene__content">{children}</div>
    </div>
  );
}

/** Geschnitztes „Dice Mice"-Holzschild, das an zwei Seilen schaukelt. */
export function LogoSign({ subtitle }: { subtitle?: string }) {
  return (
    <div className="logo-sign">
      <span className="logo-sign__rope logo-sign__rope--l" aria-hidden="true" />
      <span className="logo-sign__rope logo-sign__rope--r" aria-hidden="true" />
      <div className="logo-sign__board">
        <h1 className="logo-sign__title">
          <span>Dice</span>
          <span>Mice</span>
        </h1>
      </div>
      {subtitle && <p className="hint" style={{ textAlign: 'center', marginTop: 8 }}>{subtitle}</p>}
    </div>
  );
}

const MINI_DICE = ['#4f8ef0', '#e0564f', '#5fbf6a', '#f4c542'];

/** Vignette: vier belebte Mäuse rund um einen runden Tisch mit Würfeln. */
export function TableVignette({ seats = 4 }: { seats?: number }) {
  const places = ['table-seat--n', 'table-seat--e', 'table-seat--s', 'table-seat--w'];
  return (
    <div className="table-scene" aria-hidden="true">
      <div className="table-scene__rug" />
      <div className="table-scene__top" />
      <div className="table-scene__dice">
        {MINI_DICE.map((c, i) => (
          <span key={i} className="mini-die" style={{ ['--die' as string]: c }} />
        ))}
      </div>
      {Array.from({ length: Math.min(seats, 4) }, (_, i) => (
        <span key={i} className={`table-seat ${places[i]}`}>
          <MouseAvatar colorIndex={i} size={62} />
        </span>
      ))}
    </div>
  );
}

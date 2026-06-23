// Bild-basierte Kulissen + animiertes Spielbrett.
//
// Startbildschirm: die echte Mockup-Grafik (public/scenes/menu.png) als
// Vollbild-Hintergrund mit interaktivem „Play"-Hotspot und dezenten
// Bewegungs-Overlays (Staub, Laternen-Glühen). So trifft die Optik exakt die
// Vorlage. In-Game: KEINE Liste mehr, sondern Mäuse rund um einen Filztisch.
//
// Alle Bewegungen sind in scene.css definiert und bei prefers-reduced-motion
// abgeschaltet. Mäuse/Würfel bleiben die vorhandenen Pixel-Assets.

import type { CSSProperties, ReactNode } from 'react';
import { MouseAvatar } from '../MouseAvatar';
import { PixelIcon } from '../PixelIcon';
import { DIE_COLORS } from '../colors';
import { PHASE_LABEL } from '../phaseLabels';
import type { Phase, Player, RolledDie } from '../../engine';
import './scene.css';

const base = import.meta.env.BASE_URL;

/** Langsam aufsteigende Staubpartikel im Lichtschein (rein dekorativ). */
function DustMotes({ count = 16 }: { count?: number }) {
  return (
    <div className="motes" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          style={{
            left: `${(i * 37) % 100}%`,
            top: `${15 + ((i * 53) % 75)}%`,
            animationDelay: `${(i % 8) * 1.1}s`,
            animationDuration: `${8 + (i % 5)}s`,
          }}
        />
      ))}
    </div>
  );
}

/**
 * Startbildschirm als Vollbild-Grafik. Der große, transparente Button liegt
 * über der „Play"-Holzscheibe der Vorlage; darunter kleine Holz-Chips für die
 * übrigen Aktionen.
 */
export function MenuScene({
  onPlay,
  playLabel,
  children,
}: {
  onPlay: () => void;
  playLabel: string;
  children?: ReactNode;
}) {
  return (
    <div className="menu-bg">
      <img className="menu-bg__img" src={`${base}scenes/menu.png`} alt="Dice Mice" />
      <span className="menu-bg__lantern" aria-hidden="true" />
      <DustMotes />
      <button className="menu-bg__play" onClick={onPlay} aria-label={playLabel} />
      <div className="menu-bg__chips">{children}</div>
    </div>
  );
}

/** Würfel-Chip am Sitzplatz; Klar-Würfel sind in der Tausch-Phase wählbar. */
function DieChip({
  die,
  selected,
  onToggle,
}: {
  die: RolledDie;
  selected?: boolean;
  onToggle?: (id: string) => void;
}) {
  const style = { ['--die' as string]: DIE_COLORS[die.color] } as CSSProperties;
  const cls = [
    'die-chip',
    die.color === 'clear' ? 'die-chip--clear' : '',
    selected ? 'die-chip--sel' : '',
    die.isPity ? 'die-chip--pity' : '',
  ]
    .filter(Boolean)
    .join(' ');

  if (onToggle && die.color === 'clear') {
    return (
      <button type="button" className={cls} style={style} onClick={() => onToggle(die.id)}>
        {die.value}
      </button>
    );
  }
  return (
    <span className={cls} style={style}>
      {die.value}
    </span>
  );
}

/** Position eines Sitzes auf der Tisch-Ellipse (i=0 unten, dann im Kreis). */
function seatStyle(i: number, n: number): CSSProperties {
  const angle = ((90 + (i * 360) / n) * Math.PI) / 180;
  const x = 50 + 45 * Math.cos(angle);
  const y = 50 + 43 * Math.sin(angle);
  return { left: `${x}%`, top: `${y}%` };
}

interface BoardTableProps {
  players: Player[];
  activeId?: string;
  swap?: boolean;
  selectedClear?: Set<string>;
  onToggleClear?: (id: string) => void;
  crownedNow?: Set<string>;
  warnNow?: Set<string>;
}

/** Mäuse rund um den Filztisch – ersetzt die alte Spielerliste. */
export function BoardTable({
  players,
  activeId,
  swap,
  selectedClear,
  onToggleClear,
  crownedNow,
  warnNow,
}: BoardTableProps) {
  const n = players.length;
  return (
    <div className="board">
      <div className="board__rug" aria-hidden="true" />
      <div className="board__felt" aria-hidden="true">
        <span className="board__felt-shine" />
      </div>
      {players.map((p, i) => {
        const cls = [
          'seat',
          activeId === p.id ? 'seat--active' : '',
          crownedNow?.has(p.id) ? 'seat--crowned' : '',
          warnNow?.has(p.id) ? 'seat--warn' : '',
        ]
          .filter(Boolean)
          .join(' ');
        const canToggle = swap && !p.isAI ? onToggleClear : undefined;
        return (
          <div key={p.id} className={cls} style={seatStyle(i, n)}>
            <div className="seat__mouse">
              <MouseAvatar colorIndex={i} size={56} title={p.name} />
              <span className="seat__token">
                {p.hasCrown && <PixelIcon name="crown" title="Käse-Krone" />}
                {p.totalScore}
              </span>
            </div>
            <span className="seat__name">{p.name}</span>
            {p.rolled.length > 0 && (
              <div className="seat__dice">
                {p.rolled.map((d) => (
                  <DieChip
                    key={d.id}
                    die={d}
                    selected={selectedClear?.has(d.id)}
                    onToggle={canToggle}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Wertungs-Banner oben (Holzschild) im Stil der Vorlage. */
export function PhaseBanner({ phase, hint }: { phase: Phase; hint: string }) {
  return (
    <div className="phase-banner">
      <span className="phase-banner__title">
        <PixelIcon name="dice" title="" /> {PHASE_LABEL[phase]}
      </span>
      <span className="phase-banner__hint">{hint}</span>
    </div>
  );
}

/** Rangliste rechts/unten als Holzpanel. */
export function Scoreboard({ players }: { players: Player[] }) {
  const ranked = players
    .map((p, idx) => ({ p, idx }))
    .sort((a, b) => b.p.totalScore - a.p.totalScore);
  return (
    <div className="scoreboard">
      {ranked.map(({ p, idx }, rank) => (
        <div key={p.id} className="score-row">
          <span className="score-row__rank">{rank + 1}</span>
          <MouseAvatar colorIndex={idx} size={20} />
          <span className="score-row__name">
            {p.name}
            {p.hasCrown && (
              <>
                {' '}
                <PixelIcon name="crown" title="Krone" />
              </>
            )}
          </span>
          <span className="score-row__pts">{p.totalScore}</span>
        </div>
      ))}
    </div>
  );
}

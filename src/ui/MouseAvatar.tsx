// Pixel-Art-Maus-Avatar (Emoji-frei). 16x16-Raster als Inline-SVG mit
// shape-rendering: crispEdges (scharfe Pixel, integer-skalierbar). Die
// Spielerfarbe (Ohren-Innenseite + Schal) wird über 'C' eingefärbt und kommt aus
// colors.ts (playerColor) -> eine Quelle. Restfarben aus der Palette.
//
// Slot-Konvention: alle 6 Mäuse nutzen dasselbe Raster; nur die Farbe wechselt
// (vgl. AVATAR_SRC-Idee in docs/UI_SYSTEM.md). '.' = transparent.

import type { CSSProperties } from 'react';
import { playerColor } from './colors';
import { AVATAR_SRC } from './avatarArt';

// Feste Palette-Farben des Maus-Körpers.
const FILL: Record<string, string> = {
  d: '#5b5048', // dunkle Kontur (kein reines Schwarz)
  m: '#bcb4aa', // Fell (warmes Hellgrau)
  l: '#968d83', // Fell-Schatten
  w: '#f6efe6', // Augen-Glanz / Innenohr-Highlight
  k: '#1c1410', // Augen
  p: '#e0568a', // Nase / Bäckchen
  Y: '#f4c542', // Käse hell
  y: '#b8902a', // Käse-Kante / Loch
};

// 16x16-Raster einer niedlichen, frontalen Maus mit Käsestück.
// d=Kontur, m=Fell, l=Fellschatten, w=Glanz, k=Augen, p=Nase, C=Spielerfarbe
// (Ohr-Innenseite), Y/y=Käse.
const MOUSE: readonly string[] = [
  '................',
  '.dd........dd...',
  'dCCd......dCCd..',
  'dCwd......dwCd..',
  '.dmddddddddmd...',
  '..dmmmmmmmmd....',
  '.dmmmmmmmmmmd...',
  '.dmkwmmmmwkmd...',
  '.dmkkmmmmkkmd...',
  '.dmmmmppmmmmd...',
  '.dmmmmllmmmmd...',
  '..dmmmmmmmmd....',
  '...dddddddd.....',
  '.....yYYYy......',
  '....yYkYYkYy....',
  '....yYYYYYYy....',
];

interface MouseAvatarProps {
  /** Spieler-Index → Fellakzent/Schal-Farbe (aus colors.ts). */
  colorIndex: number;
  /** Kantenlänge in px (Vielfaches von 16 hält das Raster scharf). */
  size?: number;
  /** Zugänglicher Name; ohne title gilt der Avatar als dekorativ. */
  title?: string;
  style?: CSSProperties;
}

export function MouseAvatar({ colorIndex, size = 28, title, style }: MouseAvatarProps) {
  // Externe Pixel-Art bevorzugen (public/sprites/), sonst eingebauter SVG-Fallback.
  const src = AVATAR_SRC[colorIndex];
  if (src) {
    return (
      <img
        src={src}
        width={size}
        height={size}
        alt={title ?? ''}
        aria-hidden={title ? undefined : true}
        className="pixel-sprite"
        style={{ width: size, height: size, ...style }}
      />
    );
  }

  const accent = playerColor(colorIndex);
  const fill: Record<string, string> = { ...FILL, C: accent };

  const cells = [];
  for (let y = 0; y < MOUSE.length; y++) {
    const row = MOUSE[y];
    for (let x = 0; x < row.length; x++) {
      const color = fill[row[x]];
      if (color) {
        cells.push(<rect key={`${x}_${y}`} x={x} y={y} width={1} height={1} fill={color} />);
      }
    }
  }

  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      shapeRendering="crispEdges"
      style={{ display: 'inline-block', verticalAlign: 'middle', flex: '0 0 auto', ...style }}
    >
      {title ? <title>{title}</title> : null}
      {cells}
    </svg>
  );
}

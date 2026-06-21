// Pixel-Art-Maus-Avatar (Emoji-frei). 16x16-Raster als Inline-SVG mit
// shape-rendering: crispEdges (scharfe Pixel, integer-skalierbar). Die
// Spielerfarbe (Ohren-Innenseite + Schal) wird über 'C' eingefärbt und kommt aus
// colors.ts (playerColor) -> eine Quelle. Restfarben aus der Palette.
//
// Slot-Konvention: alle 6 Mäuse nutzen dasselbe Raster; nur die Farbe wechselt
// (vgl. AVATAR_SRC-Idee in docs/UI_SYSTEM.md). '.' = transparent.

import type { CSSProperties } from 'react';
import { playerColor } from './colors';

// Feste Palette-Farben des Maus-Körpers.
const BODY = '#a8a29a'; // warmes Grau (Fell)
const LINE = '#5b5048'; // dunkle Kontur (kein reines Schwarz)
const DARK = '#1c1410'; // Augen / Nase

// 16x16-Raster. d=Kontur, m=Fell, k=Augen/Nase, C=Spielerfarbe.
const MOUSE: readonly string[] = [
  '................',
  '..dd......dd....',
  '..dCd....dCd....',
  '..dCd....dCd....',
  '..ddd....ddd....',
  '....dddddd......',
  '...dmmmmmmd.....',
  '..dmmmmmmmmd....',
  '..dmkmmmmkmd....',
  '..dmmmmmmmmd....',
  '..dmmmmkmmmd....',
  '...dmmmmmmd.....',
  '...CCCCCCCC.....',
  '...CdCCCCdC.....',
  '...C......C.....',
  '................',
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
  const accent = playerColor(colorIndex);
  const fill: Record<string, string> = { d: LINE, m: BODY, k: DARK, C: accent };

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

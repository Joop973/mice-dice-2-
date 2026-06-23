// Pixel-Art-Icon-System (Emoji-Ersatz). Jedes Icon ist ein 16x16-Raster aus
// Zeichen; gerendert als <rect>-Gitter mit shape-rendering: crispEdges (kein
// Anti-Aliasing -> scharfe Pixel, integer-skalierbar). Farben ausschließlich aus
// der gemeinsamen Palette (docs/UI_SYSTEM.md §4). Keine Emojis in der UI.
//
// Stil-Anker: warme Küche, Käse/Holz. '.' = transparent.

import type { CSSProperties, ReactElement } from 'react';
import { ICON_SRC } from './avatarArt';

/** Zeichen -> Palette-Farbe. */
const C: Record<string, string> = {
  Y: '#f4c542', // Käse / Akzent
  y: '#b8902a', // Käse dunkel (Kante/Schatten)
  D: '#1c1410', // Outline / Löcher
  W: '#f6efe6', // Creme
  G: '#5fbf6a', // Grün (Schallwellen)
  a: '#9c8e7d', // Tan/Grau (Buchseiten)
  K: '#b9c0c9', // Kühlgrau (Metall/KI)
  P: '#e0568a', // Pink
  B: '#5aa9e6', // Blau (Globus)
  R: '#c0392b', // Rot (Mute-Kreuz)
};

const ICONS = {
  // 🧀 Käse-Keil mit Löchern
  cheese: [
    '................',
    '................',
    '......yyyy......',
    '....yyYYYYyy....',
    '...yYYYYYYYYy...',
    '..yYYYYDYYYYYy..',
    '.yYYYYYYYYYYYYy.',
    '.yYYDYYYYYYDYYy.',
    '.yYYYYYYYYYYYYy.',
    '.yYYYYYYDYYYYYy.',
    '.yYYYYYYYYYYYYy.',
    '.yyyyyyyyyyyyyy.',
    '................',
    '................',
    '................',
    '................',
  ],
  // 👑 Käse-Krone
  crown: [
    '................',
    '................',
    '................',
    '..Y.Y.Y.Y.Y.Y.Y.',
    '..YYYYYYYYYYYYY.',
    '..YYYYYYYYYYYYY.',
    '..YYYDYYYYYDYYY.',
    '..YYYYYYYYYYYYY.',
    '..yyyyyyyyyyyyy.',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
  // 🤖 KI-Roboterkopf
  ai: [
    '................',
    '.......K........',
    '......KKK.......',
    '....KKKKKKK.....',
    '...KKKKKKKKK....',
    '...KKKKKKKKK....',
    '...KKDKKKDKK....',
    '...KKKKKKKKK....',
    '...KKDDDDDKK....',
    '...KKKKKKKKK....',
    '....KKKKKKK.....',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
  // ✨ Glitzer
  sparkle: [
    '................',
    '................',
    '.......Y........',
    '......YYY.......',
    '.....YYYYY......',
    '..YYYYYYYYYYY...',
    '.....YYYYY......',
    '......YYY.......',
    '.......Y........',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
  // 🎉/🏆 Pokal (Sieg)
  trophy: [
    '................',
    '...YYYYYYYYY....',
    '...YYYYYYYYY....',
    '..YYYYYYYYYYY...',
    '..yYYYYYYYYYy...',
    '...YYYYYYYYY....',
    '....YYYYYYY.....',
    '.....YYYYY......',
    '.......Y........',
    '.......Y........',
    '.....YYYYY......',
    '....YYYYYYY.....',
    '................',
    '................',
    '................',
    '................',
  ],
  // 🔊 Ton an
  soundOn: [
    '................',
    '................',
    '................',
    '................',
    '....YY..........',
    '...YYY..G.......',
    '..YYYY..G.G.....',
    '..YYYY..G.G.....',
    '...YYY..G.......',
    '....YY..........',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
  // 🔇 Ton aus
  soundOff: [
    '................',
    '................',
    '................',
    '................',
    '....YY..........',
    '...YYY..R...R...',
    '..YYYY...R.R....',
    '..YYYY....R.....',
    '...YYY...R.R....',
    '....YY..R...R...',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
  // 🎲 Würfel (5er-Seite)
  dice: [
    '................',
    '................',
    '................',
    '..WWWWWWWWWW....',
    '..WDWWWWWWDW....',
    '..WWWWWWWWWW....',
    '..WWWWDWWWWW....',
    '..WWWWWWWWWW....',
    '..WDWWWWWWDW....',
    '..WWWWWWWWWW....',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
  // 🌐 Globus
  globe: [
    '................',
    '................',
    '.....BBBWBB.....',
    '...BBBBBWBBBB...',
    '..BBBBBBWBBBBB..',
    '..BBBBBBWBBBBB..',
    '.BBBBBBBWBBBBBB.',
    '.WWWWWWWWWWWWWW.',
    '.BBBBBBBWBBBBBB.',
    '..BBBBBBWBBBBB..',
    '..BBBBBBWBBBBB..',
    '...BBBBBWBBBB...',
    '.....BBBWBB.....',
    '................',
    '................',
    '................',
  ],
  // 📖 Buch
  book: [
    '................',
    '................',
    '................',
    '................',
    '..WWWWWWWWWW....',
    '..WaaaWWaaaW....',
    '..WaaaWWaaaW....',
    '..WaaaWWaaaW....',
    '..WaaaWWaaaW....',
    '..WWWWWWWWWW....',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
  // ▶️ Wiedergabe / Fortsetzen
  play: [
    '................',
    '................',
    '................',
    '................',
    '....Y...........',
    '....YYY.........',
    '....YYYYY.......',
    '....YYYYYYY.....',
    '....YYYYYYYYY...',
    '....YYYYYYY.....',
    '....YYYYY.......',
    '....YYY.........',
    '....Y...........',
    '................',
    '................',
    '................',
  ],
  // ⭐ Stern (Host-Marker)
  star: [
    '................',
    '................',
    '.......Y........',
    '......YYY.......',
    '......YYY.......',
    'YYYYYYYYYYYYYYY.',
    '.YYYYYYYYYYYYY..',
    '..YYYYYYYYYYY...',
    '...YYYYYYYYY....',
    '..YYYYYYYYYYY...',
    '..YYYY...YYYY...',
    '.YY.......YY....',
    '................',
    '................',
    '................',
    '................',
  ],
} as const;

export type PixelIconName = keyof typeof ICONS;

interface PixelIconProps {
  name: PixelIconName;
  /** Kantenlänge in px (Vielfaches von 16 hält das Raster scharf). */
  size?: number;
  /** Zugänglicher Name. Ohne title gilt das Icon als dekorativ (aria-hidden). */
  title?: string;
  style?: CSSProperties;
}

export function PixelIcon({ name, size = 16, title, style }: PixelIconProps) {
  // Externe Pixel-Art bevorzugen (public/sprites/), sonst gerastertes SVG-Icon.
  const src = ICON_SRC[name];
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

  const grid = ICONS[name];
  const cells: ReactElement[] = [];
  for (let y = 0; y < grid.length; y++) {
    const row = grid[y];
    for (let x = 0; x < row.length; x++) {
      const fill = C[row[x]];
      if (fill) {
        cells.push(<rect key={`${x}_${y}`} x={x} y={y} width={1} height={1} fill={fill} />);
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

// JS-Pendant zur CSS-Theme-Palette (src/styles.css :root). Damit ziehen auch der
// 3D-Würfel-Code (Three.js) und andere JS-Stellen ihre Farben aus EINER Quelle,
// statt Hex-Literale zu duplizieren. Werte bewusst identisch zu den CSS-Variablen
// (siehe docs/UI_SYSTEM.md §4). Bei Palette-Änderungen beide Stellen anpassen.

export const THEME = {
  wood900: '#1c1410',
  cream100: '#f6efe6',
  cheese500: '#f4c542',
  good500: '#5fbf6a',
  black: '#000000',
} as const;

/** Relative Luminanz einer Hex-Farbe (#rrggbb) für die Kontrastwahl. */
export function luminance(hex: string): number {
  const c = hex.replace('#', '');
  const r = parseInt(c.slice(0, 2), 16) / 255;
  const g = parseInt(c.slice(2, 4), 16) / 255;
  const b = parseInt(c.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

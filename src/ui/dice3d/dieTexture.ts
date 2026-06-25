// Erzeugt eine Zahlen-Textur für einen Würfel mit dem 2D-Canvas des Browsers.
// Bewusst KEIN externer Font / kein Netzwerk -> offline-tauglich (PWA).
// Phase-4-Idee: ~8 Material-/Farbdefinitionen + ein Zahlensatz statt ~118
// einzeln gezeichneter Würfelseiten. Texturen werden pro (Wert+Farbe) gecacht.

import * as THREE from 'three';
import { THEME, luminance } from '../theme';
import { pipsFor } from '../dicePips';

const cache = new Map<string, THREE.CanvasTexture>();

export function dieTexture(value: number, bg: string): THREE.CanvasTexture {
  const key = `${value}|${bg}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  // Cel-Bevel: heller Grat oben/links, dunkle Kante unten/rechts (flach, kein Verlauf).
  const bevel = Math.round(size * 0.06);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
  ctx.fillRect(0, 0, size, bevel);
  ctx.fillRect(0, 0, bevel, size);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
  ctx.fillRect(0, size - bevel, size, bevel);
  ctx.fillRect(size - bevel, 0, bevel, size);

  ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, size - 6, size - 6);

  // Kontrastfarbe je nach Hintergrund.
  const fg = luminance(bg) > 0.5 ? THEME.wood900 : THEME.cream100;
  ctx.fillStyle = fg;

  const pips = pipsFor(value);
  if (pips) {
    // Pixel-Augen im 3x3-Raster (quadratische Pips → scharfer Würfel-Look).
    const step = size / 4; // Raster bei 32/64/96
    const r = Math.round(size * 0.09);
    for (const i of pips) {
      const cx = Math.round((1 + (i % 3)) * step);
      const cy = Math.round((1 + Math.floor(i / 3)) * step);
      ctx.fillRect(cx - r, cy - r, 2 * r, 2 * r);
    }
  } else {
    // Höhere Werte (W12/W20): Zahl als Fallback.
    ctx.font = 'bold 74px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(value), size / 2, size / 2 + 4);
  }

  const tex = new THREE.CanvasTexture(canvas);
  // Pixel-Look: harte Kanten statt Weichzeichnen (Nearest, keine Mipmaps).
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  cache.set(key, tex);
  return tex;
}

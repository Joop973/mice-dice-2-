// Erzeugt eine Zahlen-Textur für einen Würfel mit dem 2D-Canvas des Browsers.
// Bewusst KEIN externer Font / kein Netzwerk -> offline-tauglich (PWA).
// Phase-4-Idee: ~8 Material-/Farbdefinitionen + ein Zahlensatz statt ~118
// einzeln gezeichneter Würfelseiten. Texturen werden pro (Wert+Farbe) gecacht.

import * as THREE from 'three';

const cache = new Map<string, THREE.CanvasTexture>();

/** Relative Luminanz einer Hex-Farbe (#rrggbb) für die Kontrastwahl. */
function luminance(hex: string): number {
  const c = hex.replace('#', '');
  const r = parseInt(c.slice(0, 2), 16) / 255;
  const g = parseInt(c.slice(2, 4), 16) / 255;
  const b = parseInt(c.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

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

  ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.lineWidth = 8;
  ctx.strokeRect(6, 6, size - 12, size - 12);

  // Kontrastreiche Zahlenfarbe je nach Hintergrund.
  ctx.fillStyle = luminance(bg) > 0.5 ? '#1c1410' : '#f6efe6';
  ctx.font = 'bold 74px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(value), size / 2, size / 2 + 4);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  cache.set(key, tex);
  return tex;
}

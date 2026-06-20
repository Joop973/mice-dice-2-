// Erzeugt die Würfelseiten-Textur mit dem 2D-Canvas des Browsers.
// Bewusst KEIN externer Font / kein Netzwerk -> offline-tauglich (PWA).
// Thematische Seiten: echte Augen (Pips) für 1–6 wie auf echten Würfeln,
// Zahlen für größere/negative Werte; Glitzer-Variante bekommt einen Funkel-Overlay.
// Texturen werden pro (Wert + Farbe + Variante) gecacht.

import * as THREE from 'three';
import type { DieVariant } from '../../engine';
import { PIP_LAYOUT, luminance } from '../dicePips';

const cache = new Map<string, THREE.CanvasTexture>();

function drawPips(ctx: CanvasRenderingContext2D, value: number, size: number, fg: string) {
  const margin = size * 0.26;
  const step = (size - margin * 2) / 2;
  const r = size * 0.085;
  ctx.fillStyle = fg;
  for (const [gx, gy] of PIP_LAYOUT[value]) {
    const x = margin + gx * step;
    const y = margin + gy * step;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawNumber(ctx: CanvasRenderingContext2D, value: number, size: number, fg: string) {
  // Negative Werte (Rot) warm-rot hervorheben, sonst Kontrastfarbe.
  ctx.fillStyle = value < 0 ? '#c0392b' : fg;
  ctx.font = 'bold 74px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(value), size / 2, size / 2 + 4);
}

/** Streut ein paar Funkel-Punkte für die Glitzer-Variante (deterministisch). */
function drawGlitter(ctx: CanvasRenderingContext2D, size: number) {
  const sparkles: [number, number, number][] = [
    [0.18, 0.2, 0.05],
    [0.82, 0.28, 0.035],
    [0.3, 0.78, 0.04],
    [0.7, 0.72, 0.05],
    [0.5, 0.16, 0.03],
    [0.86, 0.62, 0.03],
  ];
  for (const [fx, fy, fr] of sparkles) {
    const x = fx * size;
    const y = fy * size;
    const r = fr * size;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, 'rgba(255,255,255,0.95)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function dieTexture(
  value: number,
  bg: string,
  opts: { variant?: DieVariant } = {}
): THREE.CanvasTexture {
  const variant = opts.variant ?? 'normal';
  const key = `${value}|${bg}|${variant}`;
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

  const fg = luminance(bg) > 0.5 ? '#1c1410' : '#f6efe6';
  if (value >= 1 && value <= 6) {
    drawPips(ctx, value, size, fg);
  } else {
    drawNumber(ctx, value, size, fg);
  }
  if (variant === 'glitter') drawGlitter(ctx, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  cache.set(key, tex);
  return tex;
}

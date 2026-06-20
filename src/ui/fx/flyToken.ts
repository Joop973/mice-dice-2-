// Cross-DOM-Flug-Animation: lässt ein Token (Emoji/HTML) von einem Quell-Rechteck
// zu einem Ziel-Rechteck fliegen. Direkte DOM-Manipulation über ein fixes Overlay
// + Web Animations API. Degradiert sauber: ohne Layout (jsdom, Rects = 0),
// ohne WAAPI oder bei reduced-motion passiert schlicht nichts.

import { prefersReducedMotion as reducedMotion } from '../motion';

/** Bounding-Rect des ersten Treffers für einen Selektor (oder null). */
export function rectOf(selector: string): DOMRect | null {
  if (typeof document === 'undefined') return null;
  const el = document.querySelector(selector);
  return el ? el.getBoundingClientRect() : null;
}

/** Rect der Spielermatte mit gegebener Engine-ID. */
export function playerRect(playerId: string): DOMRect | null {
  return rectOf(`[data-fly-target="${cssEscape(playerId)}"]`);
}

function cssEscape(s: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') return CSS.escape(s);
  return s.replace(/["\\]/g, '\\$&');
}

function center(r: DOMRect): { x: number; y: number } {
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

export interface FlyOptions {
  from: DOMRect | null;
  to: DOMRect | null;
  html: string;
  size?: number;
  durationMs?: number;
  className?: string;
}

export function flyToken({ from, to, html, size = 40, durationMs = 650, className = '' }: FlyOptions): void {
  if (typeof document === 'undefined' || reducedMotion()) return;
  if (!from || !to) return;
  // jsdom / kein Layout -> alle Rects 0: nichts animieren.
  if (from.width === 0 && from.height === 0 && to.width === 0 && to.height === 0) return;

  const a = center(from);
  const b = center(to);

  const el = document.createElement('div');
  el.className = `fly-token ${className}`.trim();
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = html;
  el.style.position = 'fixed';
  el.style.left = '0';
  el.style.top = '0';
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.pointerEvents = 'none';
  el.style.zIndex = '9999';
  el.style.willChange = 'transform, opacity';

  if (typeof el.animate !== 'function') return; // keine WAAPI -> kein Overlay anhängen

  document.body.appendChild(el);
  const anim = el.animate(
    [
      { transform: `translate(${a.x}px, ${a.y}px) translate(-50%, -50%) scale(1)`, opacity: 1 },
      {
        transform: `translate(${(a.x + b.x) / 2}px, ${Math.min(a.y, b.y) - 40}px) translate(-50%, -50%) scale(1.15)`,
        opacity: 1,
        offset: 0.5,
      },
      { transform: `translate(${b.x}px, ${b.y}px) translate(-50%, -50%) scale(0.7)`, opacity: 0.9 },
    ],
    { duration: durationMs, easing: 'cubic-bezier(.45,.05,.3,1)' }
  );
  const cleanup = () => el.remove();
  anim.onfinish = cleanup;
  anim.oncancel = cleanup;
}

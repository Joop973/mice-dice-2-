// Zentrale Bewegungs-Präferenz: System-Einstellung ODER der „Bewegung
// reduzieren"-Schalter aus den Settings. Ersetzt die zuvor an mehreren Stellen
// duplizierte matchMedia-Prüfung. jsdom-sicher (kein matchMedia -> nur Setting).

import { getSettings } from './settings';

export function prefersReducedMotion(): boolean {
  if (getSettings().reduceMotion) return true;
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/** Konservatives „soll eine JS-Animation laufen?": nur im echten Browser mit
 *  matchMedia und ohne Reduced-Motion (in jsdom/SSR daher false). */
export function shouldAnimate(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return !prefersReducedMotion();
}

// Zentrale Bewegungs-Gates. EINE Quelle für prefers-reduced-motion, damit
// Komponenten den Check nicht duplizieren (vorher in AnimatedNumber lokal, im
// 3D-Würfel gar nicht). jsdom-sicher: ohne matchMedia -> keine Animation erzwungen.

/** true, wenn der Nutzer reduzierte Bewegung wünscht (oder kein matchMedia da ist). */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/** Bequemes Gegenstück: sollen dekorative Animationen laufen? */
export function shouldAnimate(): boolean {
  return !prefersReducedMotion();
}

// Proaktive WebGL-Erkennung. Ergänzt die Error-Boundary: ist WebGL gar nicht
// verfügbar, rendern wir von vornherein 2D, statt erst einen Render-Fehler
// abzufangen. Ergebnis wird gecacht (einmal pro Session genügt).

let cached: boolean | null = null;

export function isWebGLAvailable(): boolean {
  if (cached !== null) return cached;
  if (typeof document === 'undefined') {
    cached = false;
    return cached;
  }
  try {
    const canvas = document.createElement('canvas');
    cached =
      !!window.WebGLRenderingContext &&
      (!!canvas.getContext('webgl') || !!canvas.getContext('experimental-webgl'));
  } catch {
    cached = false;
  }
  return cached;
}

// Slot-Auflösung für echte Avatar-Grafiken. Index = Spieler-/Sitzfarbe (0..5).
// Liegt für einen Index eine Datei in /public/avatars/ vor, wird sie genutzt;
// sonst bleibt `undefined` und MouseAvatar zeichnet das Platzhalter-SVG. So
// funktionieren auch unvollständige Bildersätze.

const BASE = `${import.meta.env.BASE_URL}avatars`;

export const AVATAR_SRC: (string | undefined)[] = [
  `${BASE}/mouse-0.svg`,
  `${BASE}/mouse-1.svg`,
  `${BASE}/mouse-2.svg`,
  `${BASE}/mouse-3.svg`,
  `${BASE}/mouse-4.svg`,
  `${BASE}/mouse-5.svg`,
];

/** Bild der Käse-Krone (Token/Badge); leer = Emoji-Fallback. */
export const CROWN_SRC: string | undefined = `${BASE}/cheese-crown.svg`;

/** Quelle für einen Sitz (oder undefined -> Platzhalter-SVG). */
export function avatarSrc(colorIndex: number): string | undefined {
  return AVATAR_SRC[colorIndex % AVATAR_SRC.length];
}

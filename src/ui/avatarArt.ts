// Optionale externe Pixel-Art-Assets ("Drop-in").
//
// Standardmäßig leer -> die UI nutzt die eingebauten SVG-Sprites (MouseAvatar,
// PixelIcon). Sobald du echte Pixel-PNGs nach `public/sprites/` legst und hier
// einträgst, verwendet die UI automatisch diese (gerendert mit
// image-rendering: pixelated, also scharf). Empfohlen: ein kohärentes CC0-Pack
// (z. B. Kenney, kenney.nl) für einen hochwertigen, einheitlichen Look.
//
// WICHTIG: Jedes externe Asset in docs/ASSET_LICENSES.md eintragen.
// Maße/Anleitung: public/sprites/README.md und docs/UI_SYSTEM.md.

const base = import.meta.env.BASE_URL; // respektiert vite `base: './'`

/** Hilfsfunktion: Pfad zu einer Datei in public/sprites/. */
export function sprite(file: string): string {
  return `${base}sprites/${file}`;
}

/**
 * Maus-Avatar je Spielerindex (0..5). `null` = eingebauter SVG-Fallback.
 * Aktuell: ausgeschnittene Sprites aus dem Pixel-Art-Sheet (public/sprites/).
 */
export const AVATAR_SRC: ReadonlyArray<string | null> = [0, 1, 2, 3, 4, 5].map((i) =>
  sprite(`mouse-${i}.png`)
);

/**
 * Icon-Overrides (PixelIcon-Name -> PNG-Pfad). Fehlt/`null` = SVG-Fallback.
 */
export const ICON_SRC: Readonly<Record<string, string | null | undefined>> = {
  crown: sprite('crown.png'),
  ai: sprite('ai.png'),
  trophy: sprite('trophy.png'),
  cheese: sprite('cheese.png'),
  soundOn: sprite('music-on.png'),
  soundOff: sprite('music-off.png'),
};

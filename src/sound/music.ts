// Hintergrundmusik-Slot. Solange `src` leer ist, gibt es keine Musik und der
// Musik-Schalter bleibt in der UI ausgeblendet. Echten Loop hier eintragen
// (z. B. 'sfx/theme.mp3' nach public/sfx/), dann erscheint der Schalter.

export const MUSIC: { src: string } = { src: '' };

export function hasMusic(): boolean {
  return MUSIC.src.length > 0;
}

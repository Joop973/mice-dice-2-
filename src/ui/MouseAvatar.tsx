// Maus-Avatar pro Spieler. Platzhalter-Inline-SVG (getönt nach Spielerfarbe),
// slot-bereit: liegt später ein echtes Bild als `src` vor, wird dieses gezeigt.
// Zustände steuern eine CSS-Klasse (z. B. Wackeln bei Sabotage).

import { PLAYER_COLORS } from './colors';
import { avatarSrc } from './avatarArt';

export type AvatarState = 'idle' | 'winning' | 'sabotaged' | 'crowned';

interface MouseAvatarProps {
  colorIndex: number;
  state?: AvatarState;
  isAI?: boolean;
  /** Optionaler Pfad zu echter Avatar-Grafik (ersetzt das Platzhalter-SVG).
   *  Ohne Angabe wird die Sitz-Grafik aus avatarArt genutzt (falls vorhanden). */
  src?: string;
  size?: number;
}

export function MouseAvatar({
  colorIndex,
  state = 'idle',
  isAI,
  src,
  size = 40,
}: MouseAvatarProps) {
  const tint = PLAYER_COLORS[colorIndex % PLAYER_COLORS.length];
  const className = `avatar avatar--${state}`;
  const art = src ?? avatarSrc(colorIndex);

  if (art) {
    return (
      <span className={className} style={{ width: size, height: size }} aria-hidden="true">
        <img src={art} alt="" width={size} height={size} />
        {isAI && <span className="avatar__ai">KI</span>}
      </span>
    );
  }

  return (
    <span className={className} style={{ width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 48 48" width={size} height={size}>
        {/* Ohren */}
        <circle cx="15" cy="13" r="9" fill={tint} />
        <circle cx="33" cy="13" r="9" fill={tint} />
        <circle cx="15" cy="13" r="4.5" fill="#f3b6d0" />
        <circle cx="33" cy="13" r="4.5" fill="#f3b6d0" />
        {/* Kopf */}
        <circle cx="24" cy="28" r="15" fill="#d8cfc4" />
        <circle cx="24" cy="28" r="15" fill={tint} opacity="0.18" />
        {/* Augen */}
        <circle cx="19" cy="26" r="2.2" fill="#1c1410" />
        <circle cx="29" cy="26" r="2.2" fill="#1c1410" />
        {/* Nase */}
        <circle cx="24" cy="32" r="2.4" fill="#e0568a" />
        {/* Schnurrhaare */}
        <g stroke="#1c1410" strokeWidth="1" opacity="0.5" strokeLinecap="round">
          <line x1="26" y1="33" x2="40" y2="31" />
          <line x1="26" y1="34" x2="40" y2="35" />
          <line x1="22" y1="33" x2="8" y2="31" />
          <line x1="22" y1="34" x2="8" y2="35" />
        </g>
      </svg>
      {isAI && <span className="avatar__ai">KI</span>}
    </span>
  );
}

// Spieler-Karte: Kopf (Krone, Name, Punkte) + Würfelreihe (2D oder 3D).
// In der Swap-Phase sind Klar-Würfel klickbar (Auswahl zum Neu-Würfeln).

import type { Player } from '../engine';
import { DiceView } from './DiceView';
import { AnimatedNumber } from './AnimatedNumber';
import { MouseAvatar, type AvatarState } from './MouseAvatar';
import { DiceCollection } from './DiceCollection';
import { playerIndex, PLAYER_GLYPHS } from './colors';
import { CROWN_SRC } from './avatarArt';
import { useSettings } from './useSettings';

interface PlayerCardProps {
  player: Player;
  /** 3D-Würfel statt CSS-Platzhalter rendern. */
  use3d: boolean;
  /** Hebt den Spieler hervor (z. B. „ist gerade am Zug" beim Draften). */
  active?: boolean;
  /** Spieler hat gerade die Krone gewonnen (Puls-Animation). */
  crowned?: boolean;
  /** Spieler hat gerade eine Negativ-Wertung kassiert (Warn-Shake). */
  warn?: boolean;
  /** IDs der zum Tausch ausgewählten Klar-Würfel. */
  selectedDieIds?: Set<string>;
  /** Callback, wenn ein Klar-Würfel an-/abgewählt wird (nur Swap-Phase). */
  onToggleClear?: (dieId: string) => void;
  /** Würfel anzeigen? false = „noch nicht gewürfelt" (vor dem Würfeln-Knopf). */
  revealed?: boolean;
}

export function PlayerCard({
  player,
  use3d,
  active,
  crowned,
  warn,
  selectedDieIds,
  onToggleClear,
  revealed = true,
}: PlayerCardProps) {
  const { colorblind } = useSettings();
  const className = [
    'player',
    active ? 'player--active' : '',
    crowned ? 'player--crowned' : '',
    warn ? 'player--warn' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const avatarState: AvatarState = player.hasCrown
    ? 'crowned'
    : warn
      ? 'sabotaged'
      : 'idle';

  return (
    <article className={className} data-fly-target={player.id}>
      <header className="player__head">
        <span className="player__id">
          <span className="player__avatar">
            <MouseAvatar
              colorIndex={playerIndex(player.id)}
              state={avatarState}
              isAI={player.isAI}
            />
            {player.hasCrown && (
              <span className="crown-badge" aria-label="trägt die Käse-Krone">
                {CROWN_SRC ? <img src={CROWN_SRC} alt="" width={20} height={20} /> : '👑'}
              </span>
            )}
          </span>
          <span className="player__name">{player.name}</span>
          {colorblind && (
            <span className="player__glyph" aria-hidden="true">
              {PLAYER_GLYPHS[playerIndex(player.id) % PLAYER_GLYPHS.length]}
            </span>
          )}
          {active && <span className="turn-pill" aria-hidden="true">🐾 Am Zug</span>}
        </span>
        <span className="player__score">
          <AnimatedNumber value={player.totalScore} />
          {player.roundScore !== 0 && (
            <em>
              {' '}
              ({player.roundScore > 0 ? '+' : ''}
              {player.roundScore})
            </em>
          )}
        </span>
      </header>
      <DiceView
        dice={revealed ? player.rolled : []}
        use3d={use3d}
        selectedDieIds={selectedDieIds}
        onToggleClear={onToggleClear}
      />
      <DiceCollection bag={player.bag} />
    </article>
  );
}

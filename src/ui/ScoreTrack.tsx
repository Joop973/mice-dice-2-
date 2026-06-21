// Punkte-Leiste im Brettspiel-Stil: pro Maus eine Schiene, auf der eine
// Maus-Figur mit den Punkten wandert. Position normalisiert (Cap ~400), damit
// es über 10 Runden auf dem Handy lesbar bleibt; Zahl via AnimatedNumber.

import type { Player } from '../engine';
import { AnimatedNumber } from './AnimatedNumber';
import { MouseAvatar } from './MouseAvatar';
import { playerIndex } from './colors';

const CAP = 400;

export function ScoreTrack({ players }: { players: Player[] }) {
  const max = Math.max(CAP, ...players.map((p) => p.totalScore), 1);
  return (
    <div className="scoretrack" aria-label="Punktestand">
      {players.map((p) => {
        const pct = Math.max(0, Math.min(100, (p.totalScore / max) * 100));
        return (
          <div className="scoretrack__lane" key={p.id}>
            <div className="scoretrack__rail">
              <span className="scoretrack__pawn" style={{ left: `${pct}%` }}>
                <MouseAvatar colorIndex={playerIndex(p.id)} size={22} />
              </span>
            </div>
            <span className="scoretrack__score">
              <AnimatedNumber value={p.totalScore} />
            </span>
          </div>
        );
      })}
    </div>
  );
}

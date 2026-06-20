// „Tischmitte": stellt die draftbaren Würfel wie auf einem Brettspieltisch in die
// Mitte; der Spieler am Zug nimmt sich einen davon. Geteilt von lokalem und
// Online-Spiel. Reine Präsentation – die Eltern binden Zug-/Rechtelogik an.

import { type CSSProperties } from 'react';
import type { DraftOffer } from '../engine';
import { DIE_COLORS, DIE_LABELS } from './colors';

interface DraftTableProps {
  offers: DraftOffer[];
  /** Anzeigename der Maus am Zug (für Nicht-Bediener-Sicht). */
  activeName?: string;
  /** Ist die Maus am Zug eine KI (oder ein anderer Spieler online)? */
  isAITurn?: boolean;
  /** Darf der lokale Bediener gerade einen Würfel nehmen? */
  canPick: boolean;
  onPick: (offerId: string) => void;
  /** Passen (nur wenn der Bediener am Zug ist). */
  onPass?: () => void;
  /** Alle haben in dieser Runde gewählt. */
  complete?: boolean;
}

export function DraftTable({
  offers,
  activeName,
  isAITurn,
  canPick,
  onPick,
  onPass,
  complete,
}: DraftTableProps) {
  const prompt = complete
    ? 'Alle haben gewählt – es kann weitergehen.'
    : canPick
      ? '🫳 Nimm dir einen Würfel aus der Tischmitte'
      : isAITurn
        ? `${activeName ?? 'Die KI'} wählt …`
        : `${activeName ?? 'Nächste Maus'} ist am Zug`;

  return (
    <section className="table" aria-label="Tischmitte – Würfelangebot">
      <div className="table__felt">
        <p className="table__prompt">{prompt}</p>
        <div className="table__dice">
          {offers.length === 0 && <span className="table__empty">Tisch ist leer.</span>}
          {offers.map((o, i) => {
            const label = `${DIE_LABELS[o.die.color]} W${o.die.sides}${
              o.die.variant === 'glitter' ? ' (Glitzer)' : ''
            }`;
            return (
              <button
                key={o.id}
                className="draft-die"
                style={{ background: DIE_COLORS[o.die.color], '--n': i } as CSSProperties}
                disabled={!canPick}
                onClick={() => onPick(o.id)}
                title={label}
                aria-label={label}
              >
                <span className="draft-die__sides">W{o.die.sides}</span>
                <span className="draft-die__name">
                  {DIE_LABELS[o.die.color]}
                  {o.die.variant === 'glitter' ? ' ✨' : ''}
                </span>
              </button>
            );
          })}
        </div>
        {canPick && onPass && (
          <button className="ghost table__pass" onClick={onPass}>
            Passen
          </button>
        )}
      </div>
    </section>
  );
}

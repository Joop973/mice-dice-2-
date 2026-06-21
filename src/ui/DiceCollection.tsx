// Sichtbare Würfelsammlung einer Maus: zeigt den Beutel (alle besessenen Würfel,
// nicht den aktuellen Wurf) als kompakte, nach Farbe gruppierte Mini-Chips –
// man sieht seinen Beutel über die Runden wachsen.

import type { DieColor, DieDef } from '../engine';
import { DIE_COLORS, DIE_GLYPHS, DIE_LABELS } from './colors';
import { useSettings } from './useSettings';

const ORDER: DieColor[] = [
  'yellow',
  'green',
  'blue',
  'purple',
  'pink',
  'red',
  'orange',
  'sabotage',
  'brown',
  'clear',
];

export function DiceCollection({ bag }: { bag: DieDef[] }) {
  const { colorblind } = useSettings();
  if (bag.length === 0) return null;

  // Nach Farbe gruppieren (Anzahl + größte Seitenzahl je Farbe für die Anzeige).
  const groups = new Map<DieColor, DieDef[]>();
  for (const d of bag) {
    const list = groups.get(d.color) ?? [];
    list.push(d);
    groups.set(d.color, list);
  }
  const colors = ORDER.filter((c) => groups.has(c));

  return (
    <div className="collection" aria-label={`Sammlung: ${bag.length} Würfel`}>
      <span className="collection__label">Beutel</span>
      <div className="collection__chips">
        {colors.map((c) => {
          const list = groups.get(c)!;
          return (
            <span
              key={c}
              className="collection__chip"
              style={{ background: DIE_COLORS[c] }}
              title={`${list.length}× ${DIE_LABELS[c]}`}
            >
              {colorblind && (
                <span className="die__glyph" aria-hidden="true">
                  {DIE_GLYPHS[c]}
                </span>
              )}
              {list.length > 1 && <em className="collection__count">{list.length}</em>}
            </span>
          );
        })}
      </div>
    </div>
  );
}

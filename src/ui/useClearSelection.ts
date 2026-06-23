// Auswahl-Status für Klar-Würfel (Swap-Phase). Geteilt von App (lokal) und
// OnlineFlow (online), die vorher dieselbe Set-Toggle-Logik dupliziert hatten
// (Code-Audit #4). Die eigentliche Reroll-Aktion bleibt screenspezifisch
// (lokal: Engine-Aufruf, online: Server-Aktion) — nur die Auswahl ist gemeinsam.

import { useCallback, useState } from 'react';

export interface ClearSelection {
  /** Aktuell ausgewählte Klar-Würfel-IDs. */
  selected: Set<string>;
  /** Schaltet eine ID an/ab. */
  toggle: (id: string) => void;
  /** Leert die Auswahl. */
  reset: () => void;
}

export function useClearSelection(): ClearSelection {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const reset = useCallback(() => setSelected(new Set()), []);

  return { selected, toggle, reset };
}

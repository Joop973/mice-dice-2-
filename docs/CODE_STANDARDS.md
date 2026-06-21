# CODE_STANDARDS.md — Dice Mice

> Verbindliche Code-Konventionen, **aus dem bestehenden Code abgeleitet** (nicht neu
> erfunden). Ziel: Homogenität halten, Engine schützen, Tests grün halten.

## 1. Architektur-Grenzen

- **`src/engine/` ist tabu.** Keine Logik-/Würfel-/Wertungsänderung. Reveal/Optik ist
  UI, nie Engine. Engine bleibt rein und deterministisch (RNG über `rng.ts`).
- **Reinheit beibehalten:** `engine/`, `ai/`, `gameEvents.ts`, `scoring.ts` sind frei
  von React/DOM und so direkt testbar. Neue reine Logik gehört in solche Module, nicht
  in Komponenten.
- **Lokal == Online:** Sichtbares kommt aus geteilten `src/ui/`-Komponenten
  (`PlayerCard`, `DiceView`, `RoundSummary` …). Eine UI-Änderung muss in `App.tsx`
  **und** `OnlineFlow.tsx` identisch wirken.
- **Server bleibt autoritativ** für Online; die UI rendert nur und sendet Aktionen.

## 2. Single Sources of Truth (Ist-Stand)

| Konzept | Quelle | Regel |
|---|---|---|
| Würfelfarben/-labels | `src/ui/colors.ts` (`DIE_COLORS`, `DIE_LABELS`) | 2D **und** 3D ziehen Farben hier. Keine zweite Farbdefinition. |
| Theme | `src/styles.css` (`:root`) | Komponenten nutzen Variablen, **keine** Hex-Literale. (Variablensatz ist auszubauen — siehe `UI_SYSTEM.md §4`.) |
| Sound | `src/sound/events.ts` (`SOUNDS`) + `SoundManager` | Alle Töne hier; `src`-Slot für echte Assets. jsdom-/Autoplay-sicher (no-op ohne Geste). |
| Event-Erkennung | `src/ui/gameEvents.ts` | Sound/FX-Ableitung rein per Snapshot-Diff. Keine Event-Logik in Komponenten. |
| Lokale Persistenz | `src/ui/persistence.ts` (versioniert) | Versionsfeld + Migration/Fallback beibehalten. |
| Phasen-Labels | derzeit dupliziert in `App.tsx` + `OnlineFlow.tsx` | **Soll:** eine Quelle `phaseLabels.ts`. Strings sind testgekoppelt — nicht umformulieren. |

> Wenn ein Konzept (noch) keine echte Single-Source hat (Theme-Variablen,
> Phasen-Labels, Spielerfarben), ist das in `TECH_DEBT.md` vermerkt — dort
> konsolidieren, nicht dezentral duplizieren.

## 3. Farben & Theme

- **Keine Hex-Literale** in Komponenten/CSS-Regeln, sobald passende Variablen
  existieren. Neue Farben nur über die Palette (`UI_SYSTEM.md §4`).
- 3D-Materialfarben aus derselben Quelle wie das CSS-Theme (kein eigener Hex-Satz in
  `Die3D.tsx`/`dieTexture.ts`).
- Negativ-Wertung bleibt **rot** (Regel).

## 4. Animation & Bewegung

- **Jede** dekorative Animation braucht einen `prefers-reduced-motion`-Fallback.
- Reduced-Motion-Checks sollen über eine zentrale Stelle laufen (`motion.ts`, geplant),
  nicht je Komponente neu implementiert.
- Animationen und Audio müssen in **jsdom** und bei reduced-motion sauber zu **No-ops**
  degradieren (sonst brechen Tests/A11y).

## 5. Keine Emojis in der UI

- Emojis sind verboten — auch nicht als Fallback. Ersatz über Pixel-Assets je Slot
  (`UI_SYSTEM.md §8`). Bis Assets vorliegen: dokumentiert in `TECH_DEBT.md §F`.

## 6. Komponenten-Konventionen (beobachtet)

- Präsentationskomponenten sind „dumm": Props rein, kein Engine-Zugriff
  (`Die`, `PlayerCard`, `RoundSummary`, `Rules`). Dieses Muster beibehalten.
- ClassName-Komposition über gefilterte Arrays
  (`[...].filter(Boolean).join(' ')`) — Stil beibehalten.
- A11y nicht verschlechtern: `aria-label`/`aria-pressed`/`role="status"`/
  `aria-live` sind vorhanden (z. B. `Die.tsx`, Banner). Bei Asset-Ersatz erhalten.
- Tap-Ziele ≥ 44px.

## 7. Tests & Definition of Done (real)

Vor/nach jeder Änderung (real verfügbar):

- [ ] `npm test` (vitest) grün
- [ ] `npm run typecheck` sauber
- [ ] `npm run typecheck:server` sauber
- [ ] reduced-motion + jsdom = no-op verifiziert
- [ ] lokal und online identisch geprüft
- [ ] `src/engine/` unverändert
- [ ] keine Emojis neu eingeführt
- [ ] testgekoppelte Strings (`PHASE_LABEL`) unverändert
- [ ] betroffene Doku aktualisiert
- [ ] ein Thema pro Commit, klare Message (was/warum)

> `lint`/`format:check`/E2E aus der Leitfaden-DoD existieren noch nicht
> (`TECH_DEBT.md §H`). Erst ergänzen oder DoD bewusst anpassen, dann darauf verweisen.

## 8. Assets & Lizenzen

- Neue externe Assets in `docs/ASSET_LICENSES.md` mit Herkunft/Lizenz dokumentieren
  (Datei existiert noch nicht — beim ersten externen Asset anlegen).
- Slot-Konvention beibehalten: `SOUNDS.<event>.src`, später `CROWN_SRC`,
  `AVATAR_SRC[colorIndex]` + `public/avatars/`. Nur die Kunst tauschen, nicht den
  Mechanismus. Stil-Anker **Pixel-Art** (`UI_SYSTEM.md`).

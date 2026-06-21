# CODE_AUDIT.md — Dice Mice (Phase 4)

> A–F-Bewertung **jeder Nicht-Engine-Datei** (A = sauber … F = kritisch).
> Fokus laut Leitfaden: Duplikate, Magic Numbers, Hardcoded Strings/Farben,
> zyklische Abhängigkeiten. **`src/engine/` ist tabu und nicht bewertet.**
> Belege als `Datei:Zeile`. Reine Bewertung, keine Code-Änderung.

## Benotung je Datei

### Kern-Logik (rein, UI-frei) — durchweg stark

| Datei | Note | Begründung |
|---|---|---|
| `ai/ai.ts` | **B+** | Sauber gekapselt, rein, gut dokumentiert. Viele Tuning-Magic-Numbers (`+1.5`, `*0.8`, `ramp 0.9` …), aber bewusst/kommentiert. Könnten als benannte Konstanten gebündelt werden. |
| `net/protocol.ts` | **A** | Reine Typen, klar kommentiert. |
| `net/transport.ts` | **A** | Schlanke Abstraktion. |
| `net/lobby.ts` | **A-** | Sauber; Magic Numbers (`CODE_LENGTH`, 50 Versuche) sind benannt/lokal. |
| `net/room.ts` | **A-** | Autoritative Logik, rein, gut getrennt. `applyAction`-`switch` hat kein explizites `default` (TS-exhaustiv über Union, aber Rückgabe `undefined` bei Fremdwert möglich). |
| `net/LocalTransport.ts` | **A-** | Solide; `join` behandelt unbekannten Code als Sonderfall (kommentiert). |
| `net/WebSocketTransport.ts` | **A-** | Korrektes Buffering/Reconnect-Signal. |
| `server/index.ts` | **A-** | Bewusst dünn; Logik liegt im geteilten Kern. |
| `ui/useGameClient.ts` | **A** | Saubere React-Brücke, Cleanup vorhanden. |
| `ui/gameEvents.ts` | **A-** | Reine Snapshot-Diff-Logik; enthält 1 Emoji im Banner-String (`:83` `'Sieger! 🎉'`). |
| `ui/useGameEvents.ts` | **A-** | Sauber; Timeout-Cleanup korrekt. |
| `ui/persistence.ts` | **A** | Versioniert, defensiv (try/catch), klar. |
| `sound/events.ts` | **A** | Reine Daten + Typen. |
| `sound/SoundManager.ts` | **A-** | React-frei, jsdom-sicher; Hüllkurven-Magic-Numbers lokal/ok. |
| `sound/useSound.ts` | **A** | Singleton-Hook, sauber. |
| `*/index.ts` (Barrels) | **A** | Triviale Re-Exports. |

### Präsentation / UI — gemischte Qualität

| Datei | Note | Begründung |
|---|---|---|
| `ui/colors.ts` | **A-** | Single-Source für Würfelfarben/-labels (10 Hex hier ist legitim). Noch nicht an gemeinsame Theme-/Palette-Quelle gekoppelt. |
| `ui/DiceView.tsx` | **A-** | Saubere 2D/3D-Auswahl + Lazy-Load + Fallback. |
| `ui/dice3d/webgl.ts` | **A** | Saubere, gecachte Erkennung. |
| `ui/dice3d/DiceErrorBoundary.tsx` | **A** | Minimal, korrekt. |
| `main.tsx` | **A** | Schlank. (PWA-Register o. Ä. nicht hier — kein Mangel.) |
| `ui/AnimatedNumber.tsx` | **B** | Sauber, aber **dupliziert** den reduced-motion-Check (`:8`) → gehört in zentrales `motion.ts`. |
| `ui/dice3d/DiceCanvas.tsx` | **B+** | Magic Numbers (`SPACING`, `camZ`, Licht-Intensitäten) lokal/ok. |
| `ui/Die.tsx` | **B** | Farbe aus `DIE_COLORS` ✅; enthält Emoji `✨` im Label (`:19`). |
| `ui/PlayerCard.tsx` | **C** | Hardcoded Emojis `👑`/`🤖` als Namens-Präfix (`:46,48`) statt Asset-Slot. |
| `ui/RoundSummary.tsx` | **B-** | Emoji `👑` (`:39,58`); `ORDER`-Array (`:8`) dupliziert die Farb-Reihenfolge der Engine-`ScoreContributions`. |
| `ui/dice3d/dieTexture.ts` | **C** | Eigene `luminance()` (`:11`, vom Leitfaden als zentral gedacht); Hardcoded-Hex (`:37`); Magic Numbers (Größe 128, Font). |
| `ui/dice3d/Die3D.tsx` | **C** | Hardcoded-Hex-Dubletten (`:20-22`); Spin/Tumble **ohne** reduced-motion-Gate (`:42-55`); Magic Numbers (`0.7`, `14`, `10`, `8`). |
| `ui/Rules.tsx` | **C** | Emojis `🧀`/`👑`; großer Hardcoded-`CATALOG`/`PHASES`-Block (`:7,23`), der Engine-/Doku-Wissen dupliziert; `PHASES`-Titel = testgekoppelte Phasen-Strings. |
| `ui/OnlineFlow.tsx` | **C** | `PHASE_LABEL`-Dublette (`:23`), `Counter`-Dublette, „Partie beendet"-Block-Dublette, viele Emojis, Paritätslücken (kein Phasen-Hinweis/Toggle). |
| `App.tsx` | **C** | Größte UI-Datei; `PHASE_LABEL`+`PHASE_HINT` (`:35,42`) mit OnlineFlow dupliziert; `Counter`-Dublette; viele Emojis + Inline-Styles; Menu/Setup/Game/Counter in einer Datei. |
| `styles.css` | **C** | Funktioniert, aber ~40 Hardcoded-Hex statt Variablen; kein Variablensystem (`--wood*/--felt*` fehlen); **kein** `:focus-visible`. Größte Homogenitäts-Schuld. |

**Notenverteilung:** A/A-: 16 · B+/B/B-: 6 · C: 7 · D–F: 0.
Der reine Logik-Kern (engine-nah, net, ai, sound, hooks) ist durchgehend stark; die
Schwächen konzentrieren sich erwartbar in der **Präsentationsschicht** (Emojis,
Farb-Hardcoding, Duplikate) — genau die Phase-7-Themen.

## Querschnitt: Duplikate (wichtigster Befund)

| # | Duplikat | Stellen | Lösung |
|---|---|---|---|
| 1 | `PHASE_LABEL` | `App.tsx:35`, `OnlineFlow.tsx:23` (+ `Rules.tsx:7` Titel) | `src/ui/phaseLabels.ts` (Strings unverändert — testgekoppelt) |
| 2 | `Counter`-Komponente | `App.tsx:339`, `OnlineFlow.tsx:433` (identisch) | gemeinsame Komponente nach `src/ui/` |
| 3 | „Partie beendet"-Endscreen | `App.tsx:413`, `OnlineFlow.tsx:260` (fast identisch) | geteilte `WinScreen`-Komponente |
| 4 | Klar-Auswahl/Reroll-Handler | `App.tsx:203-221`, `OnlineFlow.tsx:298-309` | geteilter Hook/Helfer |
| 5 | Farb-Hex | `styles.css` (~40×), `Die3D.tsx:20-22`, `dieTexture.ts:37` | Theme-Variablen + JS-Palette-Konstanten |
| 6 | reduced-motion-Check | `AnimatedNumber.tsx:8`, `styles.css:602`, fehlt in `Die3D` | zentrales `motion.ts` |
| 7 | `luminance()` | `dieTexture.ts:11` (2D hat keins) | gemeinsamer Helfer, wenn 2D nachzieht |
| 8 | Farb-Reihenfolge | `RoundSummary.tsx:8` `ORDER` vs. Engine-`ScoreContributions` | aus einer Quelle ableiten |

## Magic Numbers (überschaubar, meist lokal)

- KI-Gewichte (`ai/ai.ts`) — bewusst, kommentiert; optional als benannte Konstanten.
- 3D-Parameter (`DiceCanvas.tsx`, `Die3D.tsx`: Spin/Licht/Spacing) — lokal, vertretbar.
- Audio-Hüllkurve (`SoundManager.ts`) — lokal, ok.
- Timeouts/Dauern: `AI_STEP_DELAY_MS` (benannt ✅), FX-Dauern `1600/900` in
  `useGameEvents.ts:43` (knapp doppelt zur CSS-Dauer — bewusst gekoppelt halten).

## Hardcoded Strings (Domänenwissen)

- `Rules.tsx` `CATALOG`/`PHASES` und `RoundSummary.tsx` `ORDER` halten Würfel-/Phasen-
  Wissen, das auch in `engine/diceCatalog.ts` und `docs/RULES_AND_DECISIONS.md` steht.
  → Nicht kritisch (reiner Erklär-Screen), aber Drift-Risiko bei Regeländerungen.
  Engine bleibt tabu; ggf. Labels aus geteilter Quelle ziehen.

## Zyklische Abhängigkeiten

**Keine gefunden.** Schichtung ist sauber gerichtet:
`engine → ai → net → ui`, `ui → sound`, `server → src/net`. Keine Rückkanten.

## Fazit für Phase 7

Code-Gesundheit ist insgesamt gut; **keine** D/E/F-Dateien. Die Hebel liegen
ausschließlich in der Präsentationsschicht und decken sich mit dem Design-Audit:
1. Theme-Variablen + Hex konsolidieren (Duplikat #5, `styles.css`/3D).
2. UI-Duplikate zusammenführen (#1–#4) → stärkt „Lokal == Online".
3. reduced-motion zentralisieren (#6) + 3D-Gate (D4).
4. Emojis → Assets (PlayerCard/Rules/RoundSummary/App/OnlineFlow/Die/gameEvents).

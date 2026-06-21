# Dice Mice — Leitfaden für Claude Code

**Zweck:** Guardrails gegen Halluzination + verbindlicher Homogenisierungs-Standard.
**Ziel:** Ein optisch und strukturell *einheitliches*, **hochwertiges, haptisch-brettspielartiges** Spiel (lokal == online), ohne neue Features, ohne Engine-Änderungen.
**Qualitätslatte:** echte Material-Anmutung (Filz/Holz), spürbare Tiefe (Bevel/Schatten), physisch wirkende Animationen, Haptik — alles in **einem** kohärenten Kunststil. **Keine Emojis in der UI.**
**Grundlage:** PR #2 „Brettspiel-Feeling" (Beschreibung + 25 Commits). Stand: 21.06.2026.

---

## 0. Wie dieser Leitfaden zu lesen ist

Jede Aussage ist eingestuft:

- **VERIFIZIERT** = direkt aus PR #2 belegbar.
- **[VERIFY]** = plausible Annahme, die Claude Code mit Repo-Zugriff prüfen und mit echten Werten füllen muss, **bevor** er handelt.

> Regel: Wo `[VERIFY]` steht, wird **nicht geraten**. Erst Datei öffnen, Wert eintragen, dann weiter.

---

## 1. Eiserne Regeln (Anti-Halluzination)

1. **`src/engine/` ist tabu.** In PR #2: 0 Änderungen. Spiel-Logik, Würfeln, Wertung niemals anfassen. Präsentation/Reveal ist UI, nie Engine.
2. **Erst lesen, dann ändern.** Vor jeder Bearbeitung die betroffene Datei vollständig lesen. Niemals Inhalt „aus dem Gedächtnis" annehmen.
3. **Keine neuen Features, keine Gameplay-Änderungen** ohne ausdrückliche Begründung und Freigabe.
4. **Nichts erfinden.** Keine neuen Farben, Strings, Komponenten oder Icons. Nur die zentralen Quellen aus Abschnitt 3 verwenden.
5. **Lokal == Online.** Alles Sichtbare kommt aus geteilten `src/ui/`-Komponenten. Eine Änderung muss in beiden Screens identisch wirken (`App` lokal, `OnlineFlow` online).
6. **Tests bleiben grün.** Vor/nach jeder Änderung: Unit + E2E. `PHASE_LABEL`-Strings sind laut Commit *byte-identisch zur Testkopplung* — nicht umformulieren.
7. **jsdom/reduced-motion = no-op.** Animationen (WAAPI/`flyToken`) und Audio müssen in jsdom und bei `prefers-reduced-motion` sauber zu No-ops degradieren. Sonst brechen Tests / A11y.
8. **Bei Unsicherheit: stoppen, Datei lesen, fragen.** Nicht „verennen", nicht spekulativ refactoren.

---

## 2. Verifizierte Architektur (Ist-Zustand)

**Stack (VERIFIZIERT):** React + TypeScript + Vite · vitest (Unit) · Playwright (E2E) · PWA (`virtual:pwa-register`) · WebSocket-Server in Node · Three.js/WebGL für 3D-Würfel mit 2D-Fallback · ESLint (Flat) + Prettier · GitHub Actions CI.

**Verzeichnisbild (VERIFIZIERT, soweit in Commits genannt):**

```
src/
  engine/            # REIN, TABU (0 Diffs)
  ui/                # geteilte Präsentations-Komponenten (lokal + online)
    MouseAvatar      DiceCollection   RollButton
    CrownToken       SabotageFx       TurnMarker (Pill)
    ScoreTrack       PhaseTrack       Podium
    Die.tsx (2D)
    dicePips.ts      # PIP_LAYOUT, hasPips, luminance, pipColor
    phaseLabels.ts   # PHASE_LABEL (Testkopplung!)
    avatarArt.ts     # AVATAR_SRC[colorIndex], CROWN_SRC
    colors.ts        # PLAYER_COLORS, playerIndex, DIE_GLYPHS, PLAYER_GLYPHS
    fx/flyToken      # Cross-DOM-Flug via Overlay + WAAPI
  sound/
    music.ts         # Track-Slot + prozedurale Pad-Loop-Musik
    haptics.ts       # HAPTIC_PATTERNS, vibrate()
    (SoundManager, useSound)
  dice3d/
    dieTexture.ts    # 3D-Würfelseiten, importiert PIP_LAYOUT aus dicePips
  settings.ts        # versionierter Store + useSettings
  motion.ts          # prefersReducedMotion / shouldAnimate (zentral)
  stats.ts           # aggregierte, versionierte Statistik
  Tutorial.tsx  SettingsPanel  StatsPanel
  DraftTable.tsx     # „Tischmitte", Draft-Angebot
  PlayerCard         App (lokal)  OnlineFlow (online)
  main.tsx  PwaToast
server/
  index.ts  room.ts  limits.ts
public/
  avatars/ mouse-0..5.svg  cheese-crown.svg
styles.css           # Theme-Variablen --felt*, --wood*
docs/
  ASSETS_TODO.md  RULES_AND_DECISIONS
.github/workflows/ci.yml  playwright.config.ts  e2e/*.spec.ts
```

**Datenfluss (VERIFIZIERT):**
`engine` (rein) → `gameEvents.ts` (rein; liefert `crownMove`, `sabotage`) → `useGameEvents` (reicht Events durch, triggert Sound/Haptik/fx) → UI-Komponenten. Online identisch über Transport-Schicht (`WebSocketTransport` / `LocalTransport` → `useGameClient`).

**Persistenz (VERIFIZIERT):** versioniert. `settings.ts`, `stats.ts`, Save „v2" (Felder `names`/`totalRounds`/`aiDifficulty`; v1 wird verworfen).

---

## 3. Single Sources of Truth (zentrale Quellen — IMMER von hier)

| Konzept | Einzige Quelle | Regel |
|---|---|---|
| Spielerfarben (6) | `colors.ts` → `PLAYER_COLORS`, `playerIndex` | Schal, Ohren, Beutel-Chips, ScoreTrack, Glyph ziehen **alle** hieraus. Keine lokalen Farb-Literale. |
| Würfel-Augen | `src/ui/dicePips.ts` → `PIP_LAYOUT`, `luminance`, `pipColor` | **2D (`Die.tsx`) und 3D (`dieTexture.ts`) nutzen dieselbe Quelle.** Keine zweite Pip-Definition. |
| Avatare / Krone | `avatarArt.ts` (`AVATAR_SRC`, `CROWN_SRC`) + `public/avatars/` | `MouseAvatar` ohne `src` zieht Sitz-Grafik automatisch. Krone = `CROWN_SRC`, Emoji nur als Fallback. |
| Phasen-Labels | `src/ui/phaseLabels.ts` → `PHASE_LABEL` | Geteilt von App + OnlineFlow + PhaseTrack. **Strings nicht ändern** (Testkopplung). |
| Theme/Farben/Holz/Filz | `styles.css` Variablen `--felt*`, `--wood*` | Komponenten verwenden Variablen, **keine Hex-Literale**. |
| Bewegung | `motion.ts` → `prefersReducedMotion`, `shouldAnimate` | Alle Animations-Gates hier. Keine eigenen reduced-motion-Checks duplizieren. |
| Einstellungen | `settings.ts` + `useSettings` | Ton, Musik, Vibration, Bewegung, Farbenblind. |
| Sound/Haptik | `src/sound/*` (`SoundManager`, `music.ts`, `haptics.ts`) | Alle Töne über Master-Gain; jsdom-sicher. |
| CVD-Glyphen | `colors.ts` → `DIE_GLYPHS`, `PLAYER_GLYPHS` | Symbol-Overlays nur hieraus. |

---

## 4. Design-System (Soll-Standard) — teils [VERIFY]

> Claude Code muss diese Tabelle aus `styles.css` mit echten Werten füllen, **bevor** er Design vereinheitlicht.

**Farben**
- Filz (Spielfläche): `--felt*` — [VERIFY exakte Werte]
- Holz (Rahmen/Tischplatte/Karten): `--wood*` — [VERIFY]
- Gold/Akzent (Krone, Focus-Ring): [VERIFY] (Commit nennt „Gold-Ring" für `:focus-visible`)
- Negativ-Würfel: **Rot** für negative Zahlen — VERIFIZIERT (Regel beibehalten)
- Spielerpalette: 6 Farben, CVD-tauglich, inkl. Teal + Magenta — VERIFIZIERT (Quelle: `colors.ts`)

**Typografie:** [VERIFY] Font-Familie, Größen-Skala, Gewichte — aus `styles.css` extrahieren und als Skala dokumentieren.

**Buttons (VERIFIZIERT):** geschnitzter Holz-/Token-Stil (Bevel + Press-Animation); `.ghost` = Outline. → Standard: **nur diese zwei Button-Typen**, kein dritter Stil.

**Karten (VERIFIZIERT):** Spielermatten (`.player`) und Panels als Holzkarten.

**Animationen (VERIFIZIERT):** CSS (`score-pop`, `pity-shimmer`, `turn-pulse`, `phase-fade`) + WAAPI (`flyToken`, Krone, Sabotage-Käsebiss). **Jede** Animation braucht reduced-motion-Fallback.

**Abstände / Tap-Ziele (VERIFIZIERT als Regel):** Tap-Ziele ≥ 44px. Exakte Spacing-Skala [VERIFY].

---

## 5. Verdachtsliste: wo Design/Code abweichen könnte

> Das ist die „welche Kombis weichen ab"-Analyse. Sie basiert auf Commit-Signalen, **nicht** auf gelesenem Code — daher zuerst bestätigen, dann entscheiden.

1. **Emojis raus (entschieden).** Emojis sind in der UI verboten — auch als Fallback. `🐾` (Am-Zug), `🎵` (Musik), `🤖` (KI), `👑` (Krone), `🏆`/Käse (Podium) werden durch lizenzierte Bild-/SVG-Assets aus **einer** Quelle ersetzt (siehe Abschnitt 9). Das ist die wichtigste Homogenitäts-Maßnahme.
2. **Krone doppelt geführt.** Bild-Badge am Avatar + Flug-Token, beide mit Emoji-Fallback. → Eine Quelle (`CROWN_SRC`) konsequent, Fallback einheitlich.
3. **2D/3D-Würfel-Parität.** Pip-Parität wurde nachträglich gezogen (Commit P1) → das deutet auf frühere Drift. Prüfen, ob in `dieTexture.ts` keine Rest-Pip-Logik dupliziert ist und beide wirklich `dicePips.ts` nutzen.
4. **Hardcoded Farben.** `--felt*/--wood*` kamen erst in Phase A. → `styles.css` und Komponenten nach Hex-Literalen durchsuchen, die nicht über Variablen laufen.
5. **Spielerfarben 4 → 6.** Teal/Magenta nachgerüstet. → Jede farbnutzende Stelle muss aus `colors.ts` ziehen (Ohren, Schal, Chips, Track, Glyph). Suchen nach Stellen, die noch von „max 4" ausgehen.
6. **`PHASE_LABEL`-Testkopplung.** „Byte-identisch" ist fragil. → Dokumentieren, **nicht** brechen; ggf. Kopplung über Konstante sauberer beschreiben (ohne Strings zu ändern).
7. **Drei versionierte Stores** (`settings`, `stats`, Save-v2). → Einheitliches Versionierungs-/Migrationsmuster prüfen; gleiche Konventionen für `version`, Migration, Fallback.
8. **Mehrere „am Zug"-Signale.** Turn-Pill + `🐾` + `player--active` + `turn-pulse` + Ton + Haptik. → Auf Redundanz prüfen; ein klares, konsistentes Signal-Set definieren.
9. **Tote Pfade nach Ersetzungen.** Podium ersetzt „alte Win-Panels"; PhaseTrack ersetzt „Phasen-Badge"; MouseAvatar ersetzt `🤖/👑`. → Prüfen, ob die alten Implementierungen wirklich entfernt sind (keine ungenutzten Komponenten/CSS-Klassen).
10. **Prozedurale vs. echte Assets.** Avatare = SVG, Sounds/Musik = prozedural, Krone = CSS/SVG. → In `docs/ASSETS_TODO.md` konsistente Slot-Konvention bestätigen (`MouseAvatar src`, `SOUNDS.<event>.src`, `music.ts`, `dieTexture.ts`).

---

## 6. Die 8 Phasen — konkret für dieses Projekt

**Phase 1 — Analyse.** Zuerst lesen (in dieser Reihenfolge): `styles.css`, `colors.ts`, `dicePips.ts`, `Die.tsx`, `dice3d/dieTexture.ts`, `avatarArt.ts`, `MouseAvatar`, `CrownToken`, `PlayerCard`, `App`, `OnlineFlow`, `DraftTable.tsx`, `phaseLabels.ts`, `settings.ts`, `stats.ts`, `motion.ts`, `src/sound/*`, `docs/`. Ergebnis: Verdachtsliste (Abschnitt 5) bestätigen oder verwerfen.

**Phase 2 — Doku.** Erzeugen/aktualisieren: `docs/ARCHITECTURE.md`, `docs/UI_SYSTEM.md` (gefüllte Design-Tabelle aus Abschnitt 4), `docs/TECH_DEBT.md` (bestätigte Punkte aus Abschnitt 5), `docs/CODE_STANDARDS.md`. Nur dokumentieren, was im Code steht.

**Phase 3 — Design-Audit.** Screens prüfen: Setup, lokales Spiel, Online-Lobby + Flow, Settings, Stats, Tutorial, Rules, Podium. Pro Screen: Farben aus Variablen? Button-Stil korrekt? Emoji/SVG konsistent? Tap-Ziele ≥44px? reduced-motion ok?

**Phase 4 — Code-Audit.** Jede Datei A–F bewerten (A sauber … F kritisch). Fokus: Duplikate (Pips, Farb-Checks), Magic Numbers, Hardcoded Strings/Farben, zyklische Abhängigkeiten. Engine bleibt unbewertet/unangetastet.

**Phase 5 — Asset-Audit.** `public/avatars/` (Namensschema `mouse-0..5.svg` ist gut), Sound-Slots, Krone. Struktur und Benennung vereinheitlichen, ungenutzte Assets finden. **Alle Emoji-Vorkommen finden und durch Assets ersetzen** (Abschnitt 9). Externe Assets in `docs/ASSET_LICENSES.md` mit Herkunft/Lizenz dokumentieren.

**Phase 6 — Performance.** VERIFIZIERT vorhanden: ab >4 Mäusen automatisch 2D (`effectiveUse3d`), 3D lazy-load, WAAPI-Overlay. Prüfen auf unnötige Rebuilds, große Assets, Audio-Scheduler-Last.

**Phase 7 — Homogenisierung.** Reihenfolge: (a) Theme-Variablen erzwingen → (b) Farb-/Pip-Quellen konsolidieren → (c) Emoji/SVG-Entscheidung umsetzen → (d) Signal-Sets vereinheitlichen → (e) tote Pfade entfernen. Jede Änderung: Begründung, Auswirkung, Risiko, Migrationsschritte.

**Phase 8 — Umsetzung.** Strikt schrittweise, **ein Thema pro Commit**. Nach jedem Schritt: Tests + lint + format + typecheck. Doku mitziehen.

---

## 7. Definition of Done (pro Änderung)

- [ ] `npm test` (Unit) grün
- [ ] `npm run test:e2e` (Playwright) grün
- [ ] `npm run lint`, `format:check`, `typecheck`, `typecheck:server` sauber
- [ ] reduced-motion + jsdom = no-op verifiziert
- [ ] lokal und online identisch geprüft
- [ ] `src/engine/` unverändert
- [ ] betroffene Doku aktualisiert
- [ ] Commit: ein Thema, klare Message, was/warum

---

## 8. Grenzen dieses Leitfadens (Ehrlichkeit)

- Er beruht auf der **PR-Beschreibung und Commit-Messages**, nicht auf gelesenem Dateiinhalt.
- Alle `[VERIFY]`-Punkte (exakte Farbwerte, Font, Spacing-Skala, tatsächliche Datei-Imports, tote Pfade) muss Claude Code mit Repo-Zugriff bestätigen, bevor er sie als Fakt behandelt.
- Die Verdachtsliste (Abschnitt 5) ist **Hypothese**, kein Befund. Erst prüfen, dann ändern.
- Findet Claude Code einen Widerspruch zwischen diesem Leitfaden und dem echten Code: **der Code gewinnt** — Leitfaden korrigieren, nicht den Code an den Leitfaden anpassen.

---

## 9. Asset- & Lizenzstandard (rechtlich sauber, deutscher Markt)

**Grundsatz:** Ein hochwertiger, kohärenter Look entsteht durch **eine** Stilquelle, nicht durch Zusammenwürfeln. Erst Stil/Quelle festlegen, dann alles daran angleichen.

### Empfohlene Quellen (nach Sicherheit)

1. **CC0 (gemeinfrei) — beste Wahl für UI, Buttons, Tokens, Icons, Würfel.**
   - Kenney (`kenney.nl`): u. a. *Board Game Pack*, *UI Pack*, *Fantasy UI Borders*, *Board Game Info* — CC0 1.0, kommerziell nutzbar, keine Attribution, durchgängig **ein** Stil.
   - CC0 ist die sicherste Lizenz: gemeinfrei, keine Bedingungen.
2. **Pixabay — ok für Texturen/Hintergründe (Filz, Holz), Geräusche.**
   - Royalty-free, kommerziell, ohne Attribution. ABER:
   - Nur **als Teil des Spiels** verwenden — die Datei selbst nicht unverändert weiterverkaufen.
   - **Keine** Marken/Logos/Produkte (Apple, Lego, Disney …) und keine erkennbaren Personen.
   - „AI"-markierte Items meiden (Urheberrechtsstatus ungeklärt).
   - Pixabay gibt **keine Haftungsfreistellung**; Dritte (Copytrack, Pixsy, PicRights) verfolgen falsch hochgeladene Inhalte → Herkunft dokumentieren.
**Stil-Anker (festgelegt): Pixel-Art.** Thema Mäuse + Käse + Würfel in einer gemütlichen, hölzernen Küche (warmes Holz, Vorratskammer, Käse) — **kein** Casino-Look. Eine gemeinsame Palette legt den Look fest; **alles** richtet sich danach. **Ausnahme Würfel:** bleiben 3D-animiert, werden aber flach/cel-schattiert und farblich an die Pixel-Palette angeglichen (Pip-Texturen im Pixel-Stil, Nearest-Filter). Vollständige Stil-Spec: `docs/UI_SYSTEM.md`.

3. **Eigene SVGs/Bilder** sind weiter erlaubt, **müssen aber dem Stil-Anker folgen.** Die bestehenden Maus-SVGs werden auf den Pack-Stil umgezogen (Mechanismus/Slot `avatarArt.ts` + `public/avatars/` bleibt, nur die Kunst wird getauscht). Ein UI-/Board-Game-Pack enthält selten fertige „Mäuse mit Schal" — daher Charaktere als pack-konforme Eigen-Assets, falls der Pack keine passenden liefert.

### Verboten
- Emojis in der UI.
- Marken, Logos, geschützte Designs, erkennbare Personen.
- KI-„Remakes" geschützter Werke/Figuren.
- Assets ohne dokumentierte Lizenz.

### Herkunftsnachweis: `docs/ASSET_LICENSES.md`
Pro externem Asset eine Zeile:

| Datei | Quelle (URL) | Autor | Lizenz | Lizenz-Ära/Datum | Download-Datum | Screenshot |
|---|---|---|---|---|---|---|

(Pixabay hatte drei Lizenz-Ären: CC0 vor 2019, „Pixabay License" 2019–2023, „Content License" ab 04/2023 — Ära mitschreiben, sonst entsteht Unsicherheit.)

### Technische Vorgaben
- Format: **SVG** bevorzugt (scharf, skalierbar). Sonst optimiertes **PNG/WebP**.
- Slot-Konvention beibehalten: `MouseAvatar` `src`, `CROWN_SRC`, `SOUNDS.<event>.src`, `src/sound/music.ts`, `dieTexture.ts`.
- Emoji-Ersatz-Mapping: `👑`→Krone-Asset, `🤖`→KI-Icon, `🐾`→Marker-Icon, `🎵`→Audio-Icon, `🏆`/Käse→Pokal-/Käse-Asset.
- „Haptisches" Gefühl: Material-Texturen + Bevel/Schatten für Tiefe; bestehende Haptik (`src/sound/haptics.ts`) an passende Aktionen koppeln (bereits vorhanden) — kein neues System nötig.

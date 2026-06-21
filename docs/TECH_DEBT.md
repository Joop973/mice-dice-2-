# TECH_DEBT.md — Dice Mice

> Bestätigte Befunde aus der Phase-1-Analyse, **am echten Code belegt** (nicht
> Hypothese). Jede Zeile nennt Beleg und Lösungsrichtung. Reihenfolge grob nach
> Hebelwirkung für die Homogenisierung. `src/engine/` ist tabu und nicht bewertet.

## A. Abweichungen Leitfaden ↔ Code (Doku-Schuld)

`docs/LEITFADEN.md` und `claude.md` beschreiben den Zielzustand nach PR #2. Der Code
ist ein früheres Stadium. Folgende im Leitfaden als „VERIFIZIERT" geführten Dinge
**existieren nicht**:

- Dateien: `dicePips.ts`, `phaseLabels.ts`, `avatarArt.ts`, `MouseAvatar`,
  `CrownToken`, `SabotageFx`, `TurnMarker`, `ScoreTrack`, `PhaseTrack`, `Podium`,
  `DraftTable.tsx`, `Tutorial.tsx`, `SettingsPanel`, `StatsPanel`, `settings.ts`,
  `stats.ts`, `motion.ts`, `sound/music.ts`, `sound/haptics.ts`, `fx/flyToken`,
  `public/avatars/`.
- Symbole: `PLAYER_COLORS`, `playerIndex`, `DIE_GLYPHS`, `PLAYER_GLYPHS`.
- Theme-Variablen: `--felt*`, `--wood*` (es gibt nur `--bg/--panel/--accent/--text`).
- Tooling: Playwright/E2E (`e2e/*.spec.ts`), `lint`, `format:check`.

→ **Lösung:** Doku am realen Stand führen (diese Datei + `ARCHITECTURE.md`).
`LEITFADEN.md`/`claude.md` bleiben als *Zielbild* erhalten, sind aber explizit als
solches zu lesen.

## B. Kein Theme-Variablensystem — viele Hardcoded-Farben

- `styles.css` hat nur 4 Variablen; ~40 Hex-Literale stehen direkt im CSS.
- Dubletten von `--bg` (`#1c1410`) und `--accent` (`#f4c542`) als Roh-Hex an vielen
  Stellen.
- **Belege:** `styles.css:3-6` (Vars) und Z.42,47,77,102,115,137,145,146,156,161,
  215,222,256,273,278,289,291,301,307,308,314,329,354,364,369,370,374,375,379,380,
  392,408,441,506,535,592,595,598 (Literale).

→ **Lösung (Phase 7a):** `--wood*`/`--felt*`/`--cheese*`/Semantik-Variablen in
`:root` einführen (Palette siehe `UI_SYSTEM.md §4`), Literale darauf umstellen.

## C. Hex-Dubletten im 3D-Code (zweite Farbquelle)

- `dice3d/Die3D.tsx:20-22`: `#f4c542` (= `--accent`), `#5fbf6a` (= green), `#000000`.
- `dice3d/dieTexture.ts:37`: `#1c1410` / `#f6efe6` (= `--bg`/`--text`).

→ **Lösung:** Aus einer gemeinsamen Palette-/Konstantenquelle ziehen (JS-Pendant zu
den CSS-Variablen), damit 3D nicht eigenständig driftet.

## D. `PHASE_LABEL` doppelt geführt (testgekoppelt)

- Byte-identische Kopien in `App.tsx:35` **und** `OnlineFlow.tsx:23`.
- Strings sind an Tests gekoppelt: `OnlineFlow.test.tsx:27,32` prüft
  `'1 · Würfeln'`, `'2 · Mitleidswürfel'`.

→ **Lösung:** In **eine** Quelle ziehen (`src/ui/phaseLabels.ts`), beide importieren.
**Strings unverändert lassen** (Testkopplung).

## E. `prefers-reduced-motion` dezentral dupliziert

- `AnimatedNumber.tsx:8` (eigene Funktion) **und** `styles.css:602` (Media-Query).

→ **Lösung:** Zentrales `motion.ts` (`prefersReducedMotion`/`shouldAnimate`); JS-Gates
darüber führen. CSS-Media-Query bleibt (CSS-seitig korrekt).

## F. Emojis in der UI (Stil-Anker verlangt Ersatz)

- Vorkommen: `🧀 👑 🤖 ✨ 🎉 🔇 🔊 🎲 🌐 📖 ▶️ ⭐` — vollständige Stellenliste in
  `UI_SYSTEM.md §8`.
- Die Emoji→Asset-Mappings in `claude.md`/`UI_SYSTEM.md` nannten teils Emojis, die es
  **nicht** gibt (`🐾`, `🎵`, `🏆`) und ließen real vorhandene aus. Tabelle in
  `UI_SYSTEM.md §8` ist auf den Ist-Stand korrigiert.

→ **Lösung (Phase 7c):** Pixel-Assets je Slot; **keine** Emoji-Fallbacks.

## G. Keine Spielerfarben / keine Single-Source dafür

- `colors.ts` enthält nur **Würfel**farben (`DIE_COLORS`). Spieler haben keine
  Farbe/Avatar; Krone/KI sind reine Emoji-Präfixe am Namen (`PlayerCard.tsx:46-48`).
- Spiel ist auf **2–4** Spieler begrenzt (`App.tsx:296`) — keine 6er-Palette nötig,
  bis Avatare/Spielerfarben eingeführt werden.

→ **Lösung:** Erst wenn Charakter-Art kommt (siehe `ASSETS_TODO.md §2`): `PLAYER_COLORS`
+ CVD-Glyphen als Single-Source in `colors.ts`, an die Pixel-Palette gekoppelt.

## H. Fehlendes Qualitäts-Tooling (DoD nicht erfüllbar)

- ~~Keine `lint`/`format:check`-Scripts, kein ESLint/Prettier~~ → **erledigt:**
  ESLint flat (`eslint.config.js`) + Prettier (`.prettierrc.json`) eingerichtet,
  Scripts `lint`/`lint:fix`/`format`/`format:check`. `src/engine` und `docs` in
  `.prettierignore` (Engine tabu, Doku-Umbrüche manuell).
- **Offen:** E2E (Playwright) ist weiterhin nicht eingerichtet.

## Nicht-Befunde (Verdacht widerlegt)

Diese Punkte aus `LEITFADEN.md §5` treffen am realen Code **nicht** zu:

- Krone doppelt (Badge + Flug-Token): existiert nicht — nur Emoji.
- 2D/3D-Pip-Drift: keine Pips vorhanden, beide zeigen Zahlen; Farbquelle geteilt.
- Drei versionierte Stores: nur einer (`persistence.ts`).
- Mehrere „am Zug"-Signale: nur ein CSS-Outline-Signal, keine Redundanz.
- Tote Pfade nach Ersetzungen: keine (die beschriebenen Refactors fanden nie statt).

## Status nach Phase 7/8 (Umsetzung)

**Erledigt:**
- **B** Theme-Variablensystem in `styles.css`; alle ~40 Hex-Literale auf Variablen.
- **C** 3D-Hex-Dubletten entfernt → `src/ui/theme.ts` (+ geteiltes `luminance`).
- **D** `PHASE_LABEL`/`PHASE_HINT` Single-Source `src/ui/phaseLabels.ts`.
- **E** reduced-motion zentral `src/motion.ts`; 3D-Würfel-Gate ergänzt.
- **F** alle UI-Emojis durch `src/ui/PixelIcon.tsx` ersetzt (keine Emojis mehr).
- Duplikate #1 (PHASE_LABEL), #2 (`Counter`), #6 (reduced-motion), #7 (`luminance`) behoben.
- Design-Audit D2 (Tap ≥44px), D3 (`:focus-visible`), D4 (3D reduced-motion),
  D5 (Emojis), D6 (Lokal==Online: Hinweis + Mute) behoben.
- Würfel pixel-angeglichen (antialias off, Nearest, mattes Material, `pixelated`).

**Offen (bewusst, Folge-Arbeit):**
- ~~**D1** Button-System auf 2 Token-Stile + Holz/Bevel-Anmutung~~ → **erledigt**:
  gefüllter Holz-/Token-Knopf (Bevel + Press) vs. `.ghost` (Outline); übrige Knöpfe als
  Sub-Rollen dieser zwei Familien. Maus-Avatare (`MouseAvatar` + `PLAYER_COLORS`) ergänzt.
- **A/H** Doku-Zielbild (`LEITFADEN`/`claude.md`) vs. Code bleibt als Zielbild stehen;
  `lint`/`format:check`/E2E-Tooling weiterhin nicht eingerichtet.
- **G** Spielerfarben/`PLAYER_COLORS` + 6 Pixel-Maus-Avatare + volle Pixel-Pips
  (Feature-/Asset-Arbeit, siehe `ASSET_AUDIT.md`).
- Duplikate #3 (Win-Screen) und #4 (Reroll-Handler) noch nicht zusammengeführt.

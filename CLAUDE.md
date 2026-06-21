# CLAUDE.md — Dice Mice

Kurzfassung der harten Regeln. Details in den referenzierten Dateien.
**Bei Konflikt zwischen dieser Datei und dem echten Code gewinnt der Code.**

## Referenzen (laden automatisch mit)
@docs/LEITFADEN.md
@docs/UI_SYSTEM.md

## Qualitätslatte
Das Spiel soll sich wie ein **hochwertiges, haptisches Brettspiel** anfühlen: spürbare Tiefe, physisch wirkende Animationen, Haptik-Feedback. Alles in **einem** kohärenten Kunststil — kein Stilmix.

## Stil-Anker (festgelegt)
**Pixel-Art.** Thema: **Mäuse + Käse + Würfel** in einer **gemütlichen, hölzernen Küche** (warmes Holz, Vorratskammer-Stimmung, Käse, kleine Küchen-Props). Warm und einladend — **kein** Casino/Glücksspiel-Look.
**Ausnahme Würfel:** Die Würfel bleiben **3D-animiert** (bestehendes System), werden aber **flach/cel-schattiert** und **farblich an die Pixel-Palette angeglichen** (Pip-Texturen im Pixel-Stil, Nearest-Filter statt Glanz). Sie müssen wie Teil der Pixel-Welt wirken, nicht wie ein Fremdkörper.
Vollständige Spec: `docs/UI_SYSTEM.md`.

## Eiserne Regeln

1. `src/engine/` ist **tabu** — keine Logik-, Würfel- oder Wertungsänderung. Reveal/Optik ist UI, nie Engine.
2. **Erst die betroffene Datei lesen, dann ändern.** Nichts aus dem Gedächtnis annehmen.
3. **Keine neuen Features, Farben, Strings, Icons oder Komponenten erfinden.** Nur zentrale Quellen (unten) nutzen.
4. **Lokal == Online.** Sichtbares kommt aus geteilten `src/ui/`-Komponenten; Änderung wirkt in `App` und `OnlineFlow` identisch.
5. **Tests bleiben grün** (Unit + E2E). `PHASE_LABEL`-Strings nicht ändern (Testkopplung).
6. **jsdom + `prefers-reduced-motion` = no-op** für alle Animationen und Audio.
7. **Ein Thema pro Commit.** Bei Unsicherheit: stoppen, lesen, fragen — nicht raten.

## KEINE Emojis
Emojis sind in der UI **verboten** (auch nicht als Fallback). Jedes bisherige Emoji wird durch ein lizenziertes Bild-/SVG-Asset ersetzt:

| Bisher Emoji | Ersetzen durch |
|---|---|
| `👑` Krone | Krone-Asset (`CROWN_SRC`) |
| `🤖` KI-Badge | KI-Icon-Asset |
| `🐾` Am-Zug-Marker | Pfoten-/Marker-Icon-Asset |
| `🎵` Musik-Schalter | Noten-/Audio-Icon-Asset |
| `🏆`/Käse (Podium) | Pokal-/Käse-Asset |

## Asset- & Lizenzregeln (rechtlich sauber)

- **Bevorzugt CC0** (z. B. Kenney `kenney.nl`: Board Game Pack, UI Pack, Fantasy UI Borders). CC0 = gemeinfrei, kommerziell ok, keine Attribution. Bester Schutz und kohärenter Stil.
- **Pixabay** erlaubt (royalty-free, kommerziell, ohne Attribution), aber: nur **als Teil des Spiels** verwenden (kein Weiterverkauf der Datei selbst); **keine** Marken/Logos/erkennbaren Personen; bei „AI"-markierten Items wegen ungeklärtem Status meiden.
- **Stil-Anker = Pixel-Art** (siehe oben). Eine **gemeinsame Palette** legt den Look fest; **alles** richtet sich danach — Buttons, Würfel (auch die 3D-Texturen), Icons, Krone UND Charaktere. Integer-Scaling + Nearest-Neighbor (kein Weichzeichnen). CC0-Pixel-Packs bevorzugen, aber pro Pack Lizenz prüfen (manche sind CC-BY-SA → Namensnennung/Weitergabe-Pflicht).
- **Herkunftsnachweis Pflicht.** Jedes externe Asset in `docs/ASSET_LICENSES.md` eintragen: Datei, Quelle-URL, Autor, Lizenz, Lizenz-Ära, Download-Datum, Screenshot. (Pixabay hat keine Haftungsfreistellung; Dritte verfolgen falsch hochgeladene Inhalte.)
- **Keine KI-„Remakes" geschützter Werke**, keine Disney-/Lego-/Markeninhalte.
- Format: **PNG** (Pixel-Art, transparenter Hintergrund), exakte Pixelmaße aus `docs/UI_SYSTEM.md`, **kein** Anti-Aliasing/Weichzeichnen. Slot-Konvention beibehalten (`MouseAvatar src`, `CROWN_SRC`, `SOUNDS.<event>.src`, `music.ts`).

## Homogenität: die vier Bausteine

### Buttons
- Nur **zwei** Typen: geschnitzter **Holz-/Token-Stil** (Bevel + Press) und `.ghost` (Outline). Kein dritter Stil.
- Farben/Bevel aus Theme-Variablen, nie aus Hex-Literalen. Tap-Ziele ≥ 44px.
- Optionale Button-Grafiken nur aus **einem** CC0-UI-Pack.

### Charaktere (Mäuse)
- **Stil: Pixel-Art-Maus** nach `docs/UI_SYSTEM.md` (festes Raster, gemeinsame Palette, einheitliche Outline/Schattierung). Mit Käse-Bezug (z. B. Käsestück, Käse-Krone).
- Pixel-Maus-Packs als CC0 sind selten → die Mäuse werden als **eigene Pixel-Grafiken** nach der Stil-Spec erstellt. Bestehende SVGs werden ersetzt.
- **Slot bleibt:** Quelle weiterhin `avatarArt.ts` (`AVATAR_SRC[colorIndex]`) + `public/avatars/`; `MouseAvatar` ohne `src` zieht die Sitz-Grafik. Nur die *Kunst* wird getauscht, nicht der Mechanismus.
- Spielerfarbe (Ohren/Schal o. Ä.) **immer** aus `colors.ts` (`PLAYER_COLORS`), abgestimmt auf die Pixel-Palette.
- Zustände nur über vorhandenes CSS: `idle / crowned / winning / sabotaged` (+ KI-Badge als Asset).
- Krone = Käse-Krone über `CROWN_SRC` (eine Quelle), **kein** Emoji-Fallback.
- Alle 6 Mäuse im gleichen Raster/Stil — keine Ausreißer.

### Würfel (3D, aber pixel-angeglichen)
- **3D-Animation bleibt** (bestehendes System), aber: **flach/cel-schattiert**, Pip-Texturen im **Pixel-Stil**, Textur-Filter **nearest** (kein Glanz/Blur). Würfel sollen zur Pixel-Welt passen.
- **Würfelkörper-Farben aus der gemeinsamen Palette** (= dieselbe Quelle wie Charaktere/Theme). Negativ = rot bleibt.
- Augen/Pips **ausschließlich** aus `src/ui/dicePips.ts` (`PIP_LAYOUT`, `luminance`, `pipColor`). **2D (`Die.tsx`) und 3D (`dieTexture.ts`) nutzen dieselbe Quelle** — keine zweite Pip-Logik. 2D-Fallback = Pixel-Variante des 3D-Würfels.
- Würfel-**Logik** unverändert — nur Material/Textur/Palette stylen.
- CVD-Glyphen aus `colors.ts` (`DIE_GLYPHS`).

### Hintergründe / Theme
- Holz + Tischtuch **nur** über Variablen `--wood*` / `--felt*` in `styles.css`. Keine Hex-Literale in Komponenten.
- **Holz ist Hauptmaterial** (Küchentisch, Rahmen, Karten); `--felt*` als Tischtuch/Platzset uminterpretieren. Gleiche Pixel-Textur-Familie überall.
- Optional kleine Küchen-Props (Vorratskammer, Käse) als Hintergrund-Stimmung — dezent, nicht ablenkend.

## Zentrale Quellen (immer von hier)

| Konzept | Quelle |
|---|---|
| Spielerfarben + Glyphen | `colors.ts` |
| Würfel-Pips | `src/ui/dicePips.ts` |
| Avatare / Krone | `avatarArt.ts`, `public/avatars/` |
| Phasen-Labels | `src/ui/phaseLabels.ts` |
| Theme (Filz/Holz/Gold) | `styles.css` (`--felt*`, `--wood*`) |
| Bewegung | `motion.ts` |
| Einstellungen | `settings.ts` |
| Sound / Haptik | `src/sound/*` |
| Asset-Lizenzen | `docs/ASSET_LICENSES.md` |

## Definition of Done
Tests grün · lint/format/typecheck sauber · reduced-motion + jsdom no-op · lokal == online · `src/engine/` unverändert · kein Emoji in der UI · neue Assets in `ASSET_LICENSES.md` dokumentiert · Doku aktualisiert.

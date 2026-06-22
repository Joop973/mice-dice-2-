# ASSET_LICENSES.md — Herkunftsnachweis externer Assets

> **Pflicht** für **jedes** externe Asset (Grafik, Sound, Schrift): eine Zeile mit
> Herkunft und Lizenz. Grundlage: `claude.md` + `docs/LEITFADEN.md §9`.
> Bevorzugt **CC0** (z. B. Kenney). Pixabay nur als Teil des Spiels, keine Marken/
> erkennbaren Personen, „AI"-Items meiden. Lizenz-**Ära/Datum** mitschreiben.

## Status (Stand Phase 5)

**Noch keine externen Assets.** Alle aktuell vorhandenen Grafiken sind **Eigen-SVG**
(`public/icons/*`), Audio ist **prozedural** erzeugt (WebAudio, keine Samples). Daher
besteht derzeit **kein** Drittlizenz-Bedarf. Beim ersten externen Asset hier eintragen.

## Eigene Assets (kein Drittlizenz-Bedarf)

| Datei | Art | Urheber |
|---|---|---|
| `public/icons/icon.svg` | SVG | Projekt (eigen) |
| `public/icons/icon-maskable.svg` | SVG | Projekt (eigen) |
| `public/icons/favicon.svg` | SVG | Projekt (eigen) |
| `public/icons/*.png` | aus SVG generiert (`gen:icons`) | Projekt (eigen) |

## Pixel-Art-Sprites (`public/sprites/*.png`)

Quelle: **`art/source-sheet.png`** — ein Pixel-Art-Sheet (1536×1024), das der
**Projektinhaber bereitgestellt** hat (Upload, 2026-06-22). Die Einzel-Sprites sind
daraus per `scripts/slice-sprites.mjs` ausgeschnitten und freigestellt
(Holzhintergrund per Flood-Fill entfernt).

| Datei(en) | Inhalt | Herkunft | Lizenz/Rechte |
|---|---|---|---|
| `mouse-0..5.png` | 6 Spieler-Mäuse (Schal in Spielerfarbe) | aus `art/source-sheet.png` | **vom Projektinhaber bereitgestellt** |
| `mouse-crowned/win/sad.png` | Stimmungs-Mäuse | dito | dito |
| `crown.png`, `ai.png`, `trophy.png`, `cheese.png`, `music-on/off.png`, `paw.png` | Icons/Objekte | dito | dito |

> ⚠️ **Zu klären vom Projektinhaber:** Ist das Quell-Sheet **selbst erstellt**, **lizenziert
> gekauft** oder **KI-generiert**? Bitte Herkunft/Lizenz hier präzisieren (bei Drittquelle:
> URL, Autor, Lizenz, Datum). Solange ungeklärt, gilt: Nutzung nur mit Rechten des
> Projektinhabers; **keine** Veröffentlichung ohne diese Klärung.

## Externe Assets (Dritte)

| Datei | Quelle (URL) | Autor | Lizenz | Lizenz-Ära/Datum | Download-Datum | Screenshot |
|---|---|---|---|---|---|---|
| _(noch keine)_ | | | | | | |

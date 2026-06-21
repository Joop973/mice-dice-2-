# UI_SYSTEM.md — Stil-Spec (Dice Mice)

Verbindliche visuelle Vorgaben. Ergänzt `CLAUDE.md` und `docs/LEITFADEN.md`.
Werte mit **[TUNE]** sind sinnvolle Startwerte und dürfen im Playtest angepasst werden — aber dann **hier** zentral, nicht verstreut. Werte mit **[VERIFY]** muss Claude Code am echten Code/Asset bestätigen.

---

## 1. Stil-Anker

**Pixel-Art.** Thema: **Mäuse + Käse + Würfel** in einer **gemütlichen, hölzernen Küche** (warmes Holz, Vorratskammer-Stimmung, Käse, kleine Küchen-Props).

- Warm und einladend — **kein** Casino/Glücksspiel-Look.
- Ein durchgehender Look: lieber wenige, stilgleiche Quellen als ein Flickenteppich.

---

## 2. Pixel-Grundregeln (gelten überall)

- **Integer-Scaling only.** Assets nur in ganzzahligen Vielfachen skalieren (×2, ×3 …), nie krumm.
- **Nearest-Neighbor.** Kein Anti-Aliasing/Weichzeichnen. CSS: `image-rendering: pixelated;` an allen Pixel-Grafiken und am 3D-Canvas-Upscaling.
- **Ein Pixelraster.** Kein Mischen verschiedener „Pixelgrößen" im selben Bild.
- **Begrenzte Palette.** Alle Assets nutzen dieselbe Palette (Abschnitt 4). Keine Off-Palette-Farben.
- **Einheitliche Outline & Schattierung.** Eine Regel für alle Sprites (Abschnitt 5).

---

## 3. Raster / Größen [TUNE]

| Element | Basis-Pixelmaß | Hinweis |
|---|---|---|
| Maus-Avatar | 64×64 | front-facing idle; Zustände idle/crowned/winning/sabotaged |
| Käse-Krone | 32×32 | als Badge + Flug-Token |
| UI-Icons (Marker, KI, Audio, Score) | 32×32 | Emoji-Ersatz |
| Würfel-Pip-Textur (3D-Seite) | 64×64 | pro Würfelseite, Pixel-Pips |
| Buttons (Holz/Token) | 9-slice | Eckradius klein halten, damit Pixel scharf bleiben |

Mobile zuerst: alles muss bei kleiner Anzeige lesbar bleiben; Tap-Ziele ≥ 44 CSS-px (Asset darunter darf kleiner sein, Hitbox nicht).

---

## 4. Palette (gemeinsame Quelle) — abgeleitet (Phase 1)

**Prinzip:** *Eine* Palette für Pixel-Art, CSS-Theme **und** 3D-Würfel.

**VERIFY-Ergebnis (Stand Phase 1):** In `src/styles.css` existieren **nur** vier
Variablen — `--bg #1c1410`, `--panel #2a211b`, `--accent #f4c542`, `--text #f6efe6`.
Es gibt **keine** `--wood*`/`--felt*`-Variablen; stattdessen ~40 Hex-Literale verstreut
(siehe `TECH_DEBT.md §B`). Die folgende Palette ist daraus + `colors.ts` abgeleitet.

Legende: **(code)** = exakt so im Code vorhanden · **(neu)** = vorgeschlagener
Lücken-Füller im selben Warmton-Raum, noch **nicht** im Code.

### Holz — Hauptmaterial (Tisch/Rahmen/Karten)
| Token | Hex | Herkunft |
|---|---|---|
| `--wood-900` | `#1c1410` | (code) `--bg` |
| `--wood-800` | `#2a211b` | (code) `--panel` |
| `--wood-700` | `#4a3d33` | (code) Border |
| `--wood-600` | `#8a6240` | (code) = Würfel „brown" |

### Tischtuch / Platzset (ehem. „Filz")
| Token | Hex | Herkunft |
|---|---|---|
| `--cloth-700` | `#3a3f47` | (code) = Würfel „sabotage" / `chip--throw` |
| `--cloth-500` | `#5a6b5a` | (neu) gedämpftes Tuchgrün |

### Käse / Akzent
| Token | Hex | Herkunft |
|---|---|---|
| `--cheese-500` | `#f4c542` | (code) `--accent` |
| `--cheese-300` | `#f0d98a` | (neu) helle Käsestufe |
| `--cheese-700` | `#b8902a` | (neu) dunkle Kante/Outline |

### Neutral / Text
| Token | Hex | Herkunft |
|---|---|---|
| `--cream-100` | `#f6efe6` | (code) `--text` |
| `--tan-200` | `#e8ddcd` | (code) |
| `--tan-300` | `#cbbfae` | (code) |
| `--tan-400` | `#9c8e7d` | (code) |
| `--tan-500` | `#7d7164` | (code) Placeholder |

### Semantik
| Token | Hex | Herkunft |
|---|---|---|
| `--good-500` | `#5fbf6a` | (code) Grün/Mitleid/Erfolg |
| `--bad-500` | `#c0392b` | (code) Warn-Rahmen |
| `--bad-300` | `#ff8a7a` | (code) Fehlertext (auch `#ff9a8a`) |
| `--cool-300` | `#b9c0c9` | (code) Detail-Grau |

### Würfelkörper (aus `colors.ts`, an Palette koppeln)
`yellow #f4c542` · `green #5fbf6a` · `blue #4f8ef0` · `purple #9b6cd6` ·
`red #e0564f` · `clear #dfe6ec` · `pink #f07ec0` · `orange #f0913f` ·
`sabotage #3a3f47` · `brown #8a6240`

- **Negativ-Würfel: Rot** bleibt (Regel).
- `yellow`/`green`/`brown`/`sabotage` sind bereits palette-deckungsgleich mit
  Theme-Tönen. `blue`/`purple`/`pink` sind kühl-gesättigt und brechen den warmen
  Küchen-Anker am stärksten → **Haupt-Tuning-Kandidaten** [TUNE].

**Spielerfarben (6, CVD):** im Code **noch nicht vorhanden** — `colors.ts` hat kein
`PLAYER_COLORS`, Spieler haben keine Farbe (Spiel ist 2–4 Spieler). Erst mit
Charakter-Art einzuführen (siehe `TECH_DEBT.md §G`, `ASSETS_TODO.md §2`).

**To-do (Phase 7a):** Diese Tokens als CSS-Variablen in `:root` anlegen, die ~40
Literale darauf umstellen und ein JS-Pendant für die 3D-Hex-Dubletten schaffen.

---

## 5. Outline & Schattierung [TUNE]

- **Outline:** selektive dunkle Kontur (dunklere Variante der Eigenfarbe, kein reines Schwarz). Konsequent bei allen Sprites.
- **Schattierung:** 1–2 Schattenstufen, klare Lichtrichtung (oben-links). **Kein** Pillow-Shading, keine Verläufe.
- **Lesbarkeit vor Detail** bei kleinen Größen.

---

## 6. Würfel: 3D, aber pixel-angeglichen (Kernregel)

Die Würfel sind der einzige bewusste Stilbruch — sauber aufgelöst:

- **3D-Animation bleibt** (bestehendes Three.js-System + 2D-Fallback).
- **Flache/Cel-Schattierung**, kein realistisches Glanzlicht/Specular. Wenig, hartes Licht.
- **Pip-Texturen im Pixel-Stil** (gerasterte Augen), Textur-Filter **nearest** statt linear.
- **Würfelkörper-Farben aus der gemeinsamen Palette** (Abschnitt 4) — dieselbe Quelle wie alles andere.
- Optional: 3D bei niedriger interner Auflösung rendern und hochskalieren, damit der Würfel „pixelig" zur Welt passt. [TUNE]
- **2D-Fallback (`Die.tsx`)** = Pixel-Variante des 3D-Würfels: gleiche Palette, gleiche Pips über `dicePips.ts`.
- **Pip-Logik unverändert.** Nur Material/Textur/Palette anfassen, nie die Werte/Layout-Logik. `2D` und `3D` ziehen Pips **ausschließlich** aus `src/ui/dicePips.ts`.

---

## 7. Animationen

- **Flat-UI** (Score-Pop, Phasen-Fade, Token-Flug, Krone, Sabotage): WAAPI/CSS wie bisher, immer mit reduced-motion-Fallback.
- **Würfel-Roll/Reveal**: 3D als der eine „taktische" Moment. In jsdom/reduced-motion → ruhiges No-op-Resultat.
- Haptik (`src/sound/haptics.ts`) an passende Aktionen koppeln (vorhanden) — kein neues System.

---

## 8. Emoji-Ersatz (Pixel-Assets) — UMGESETZT (Phase 7c)

**Status:** Alle UI-Emojis sind durch das Pixel-Art-Icon-System `src/ui/PixelIcon.tsx`
ersetzt (16×16-Raster, `shape-rendering: crispEdges`, Farben aus der Palette §4).
Krone/KI laufen über `PixelIcon name="crown"|"ai"`. **Format-Entscheidung:** Inline-
**SVG mit crispEdges** statt PNG — scharf, integer-skalierbar, kein Build-Schritt, keine
Binärdateien (LEITFADEN §9 nennt „SVG bevorzugt"; weicht bewusst von der PNG-Notiz in
`claude.md` ab → Code gewinnt). Avatare (6 Mäuse) als eigene Pixel-Grafik stehen noch
aus (Feature, kein Emoji — siehe `ASSET_AUDIT.md`).

Die folgende Tabelle dokumentiert die ersetzten Emojis und das Ziel-Icon:

| Bisher | Neu (Pixel-Asset) | Fundstellen |
|---|---|---|
| `🧀` | Logo-/Käse-Asset | `App.tsx:246,301,422,447`; `OnlineFlow.tsx:65,181,269,314`; `Rules.tsx:40` |
| `👑` | Käse-Krone (`CROWN_SRC`) | `PlayerCard.tsx:46`; `RoundSummary.tsx:39,58`; `Rules.tsx:24` |
| `🤖` | KI-Badge-Icon | `PlayerCard.tsx:48`; `OnlineFlow.tsx:195` |
| `✨` | Glitzer-Marker (Blau-Glitzer) | `Die.tsx:19`; `App.tsx:530`; `OnlineFlow.tsx:387` |
| `🎉` | Sieg-/Konfetti-Asset | `App.tsx:425`; `OnlineFlow.tsx:272`; `gameEvents.ts:83` (Banner) |
| `🔇`/`🔊` | Audio-Aus/-An-Icon | `App.tsx:462` |
| `🎲`/`🌐`/`📖`/`▶️` | Menü-Icons | `App.tsx:258,262,267,252` |
| `⭐` | Host-Marker (Lobby) | `OnlineFlow.tsx:193` |

Keine Emojis in der UI — auch nicht als Fallback. (Typografische Zeichen `→ ← −` in
Button-Beschriftungen sind keine Emojis; sie bleiben, sofern nicht streng ausgelegt.)

---

## 9. Offene Punkte für Claude Code

1. ~~Konkrete Pixel-Palette als Hex-Liste ableiten~~ → **erledigt (Phase 1)**, siehe Abschnitt 4.
2. Palette-Tokens als CSS-Variablen in `:root` anlegen und die ~40 Hex-Literale darauf umstellen (Phase 7a; `TECH_DEBT.md §B`).
3. JS-Pendant für die 3D-Hex-Dubletten (`Die3D.tsx`/`dieTexture.ts`) schaffen (`TECH_DEBT.md §C`).
4. Endgültiges Avatar-Raster bestätigen (64×64 vorgeschlagen) und in `avatarArt.ts`/`public/avatars/` umsetzen (noch nicht vorhanden).
5. 3D-Würfel-Material auf flach/cel + nearest umstellen, Körperfarben an Palette koppeln, Tests grün halten.
6. `image-rendering: pixelated` global an Pixel-Grafiken und Canvas-Upscaling setzen (aktuell nirgends gesetzt).
7. Emojis durch Pixel-Assets ersetzen (Abschnitt 8), keine Fallbacks.

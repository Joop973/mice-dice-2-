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

## 4. Palette (gemeinsame Quelle) [TUNE/VERIFY]

**Prinzip:** *Eine* Palette für Pixel-Art, CSS-Theme **und** 3D-Würfel. Sie wird aus den bestehenden Theme-Variablen abgeleitet, damit nichts auseinanderläuft.

- Holz (Tisch/Rahmen/Karten): `--wood*` — **Hauptmaterial** der Küche, [VERIFY echte Werte in `styles.css`]
- Tischtuch/Unterlage (ehem. „Filz"): `--felt*` — als Küchen-Tischtuch/Platzset uminterpretieren, [VERIFY]
- Akzent (Krone, Focus-Ring): [TUNE warmes Messing/Kupfer oder Gold, küchenpassend]
- Käse: [TUNE warme Gelb-/Orangetöne, 2–3 Stufen]
- Negativ-Würfel: **Rot** (Regel bleibt)
- Spielerfarben (6, CVD-tauglich): aus `colors.ts` (`PLAYER_COLORS`) — auf die Pixel-Palette abgestimmt halten

**To-do für Claude Code:** Aus diesen Quellen eine konkrete Pixel-Palette (z. B. 16–24 Farben) ableiten, hier als Hex-Liste dokumentieren, und sicherstellen, dass Avatare, Icons, 2D- und 3D-Würfel **nur** daraus schöpfen.

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

## 8. Emoji-Ersatz (Pixel-Assets)

| Bisher | Neu (Pixel-Asset) | Slot |
|---|---|---|
| `👑` | Käse-Krone | `CROWN_SRC` |
| `🤖` | KI-Badge-Icon | Avatar-Badge |
| `🐾` | Am-Zug-Marker | Turn-Marker |
| `🎵` | Audio/Noten-Icon | Musik-Schalter |
| `🏆`/Käse | Pokal-/Käse-Asset | Podium |

Keine Emojis in der UI — auch nicht als Fallback.

---

## 9. Offene Punkte für Claude Code (zuerst klären)

1. Konkrete Pixel-Palette als Hex-Liste ableiten und hier eintragen (Abschnitt 4).
2. Endgültiges Avatar-Raster bestätigen (64×64 vorgeschlagen) und in `avatarArt.ts`/`public/avatars/` umsetzen.
3. 3D-Würfel-Material auf flach/cel + nearest umstellen, Körperfarben an Palette koppeln, Tests grün halten.
4. `image-rendering: pixelated` global an Pixel-Grafiken und Canvas-Upscaling setzen.
5. Alle Off-Palette-Farben in `styles.css`/Komponenten finden und auf die Palette ziehen.

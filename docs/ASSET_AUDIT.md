# ASSET_AUDIT.md — Dice Mice (Phase 5)

> Bestandsaufnahme aller Assets, Slot-Konventionen, ungenutzter Dateien und der
> Emoji→Asset-Lücken. Stil-Anker: **Pixel-Art** (`docs/UI_SYSTEM.md`). Reine
> Analyse, keine Asset-/Code-Änderung.

## 1. Vorhandene Assets (Inventar)

### App-Icons — `public/icons/` (vollständig, referenziert)

| Datei | Typ | Referenziert in | Status |
|---|---|---|---|
| `icon.svg` | SVG-Quelle „any" | `gen-icons.mjs` | genutzt (Quelle) |
| `icon-maskable.svg` | SVG-Quelle „maskable" | `gen-icons.mjs` | genutzt (Quelle) |
| `favicon.svg` | SVG | `index.html:5`, `vite.config.ts` (manifest + includeAssets) | genutzt |
| `apple-touch-icon.png` | 180² | `index.html:6`, `vite.config.ts` includeAssets | genutzt |
| `icon-192.png` | 192² any | `vite.config.ts` manifest | genutzt |
| `icon-512.png` | 512² any | `vite.config.ts` manifest | genutzt |
| `icon-192-maskable.png` | 192² maskable | `vite.config.ts` manifest | genutzt |
| `icon-512-maskable.png` | 512² maskable | `vite.config.ts` manifest | genutzt |

- **Pipeline sauber:** `icon.svg`/`icon-maskable.svg` → `npm run gen:icons` (sharp) → PNGs
  (eingecheckt, damit der Client-Build keine native Abhängigkeit braucht).
- **Ungenutzte Assets: keine.** Alle Icons sind referenziert.
- **Stil-Abweichung:** Das Icon-Motiv ist eine **flache geometrische** Behelfsgrafik
  (käsegelber Rundrechteck-Würfel mit Ohren/Schwanz), **kein Pixel-Art**. Es nutzt zudem
  Off-Palette-Pink `#e0568a` für die Ohren (`icon.svg:8-9`, = Konfetti-Pink). → Bei
  Phase 7 auf Pixel-Art + Palette umziehen (Quelle bleibt SVG→PNG-Pipeline).

### Sounds — prozedural, keine Dateien

- `src/sound/events.ts`: **8** Ereignisse (`roll, pick, pass, crown, tick, round, win,
  warn`), alle als WebAudio-Töne. **Jeder hat einen leeren `src`-Slot** → echtes Asset
  eintragen genügt (kein Code-Umbau).
- **Kein `public/sfx/`-Verzeichnis** vorhanden.

### Charaktere / Krone / UI-Icons — fehlen komplett

- **Kein `public/avatars/`**, keine `mouse-0..5.*`. Spieler = Name + Emoji.
- **Kein Krone-Asset / kein `CROWN_SRC`-Slot.** Krone = `👑`-Emoji.
- **Keine UI-Icons** (Mute/KI/Menü) — alles Emoji.

## 2. Slot-Konventionen

| Slot | Status | Konvention |
|---|---|---|
| `SOUNDS.<event>.src` | **vorhanden**, leer | `src: 'sfx/<event>.<ext>'` (relativ, wegen `base: './'`) |
| Icon-Pipeline | **vorhanden** | SVG-Quelle → `gen:icons` → PNG (committet) |
| `AVATAR_SRC[colorIndex]` + `public/avatars/` | **fehlt** | aus Leitfaden/`UI_SYSTEM`: `mouse-0..5.png` (Pixel) |
| `CROWN_SRC` | **fehlt** | einzelne Quelle für Krone (Badge + ggf. Flug-Token) |
| UI-Icon-Slots (Mute/KI/Marker) | **fehlt** | einheitliche Icon-Familie, z. B. `public/ui/<name>.png` |

→ Empfohlenes Namensschema (Phase 7, mit Assets festzulegen):
`public/avatars/mouse-{0..5}.png`, `public/sfx/{event}.{mp3|ogg}`,
`public/ui/{crown|ai|mute|sound|...}.png` — alle Pixel-Art, Nearest-Filter.

## 3. Emoji → Asset (zu ersetzen)

Vollständige Stellenliste in `docs/UI_SYSTEM.md §8`. Im Code real vorhanden:

`🧀 👑 🤖 ✨ 🎉 🔇 🔊 🎲 🌐 📖 ▶️ ⭐` (12 verschiedene).

Zielslots: `🧀`→Logo/Käse · `👑`→`CROWN_SRC` · `🤖`→KI-Badge · `✨`→Glitzer-Marker ·
`🎉`→Sieg/Konfetti · `🔇/🔊`→Audio-Icon · `🎲/🌐/📖/▶️`→Menü-Icons · `⭐`→Host-Marker.
**Keine Emoji-Fallbacks.**

## 4. Lizenzen

- **Aktuell keine externen Assets.** Alle vorhandenen Grafiken sind **Eigen-SVG**
  (Icons), Audio ist **prozedural** (kein Sample). → Derzeit **kein** Drittlizenz-Bedarf.
- `docs/ASSET_LICENSES.md` als Stub angelegt (Tabellenkopf + Status), damit beim **ersten**
  externen Asset (z. B. CC0-Pixel-Pack) sofort dokumentiert wird — Pflicht laut
  `claude.md`/`LEITFADEN.md §9`.

## 5. To-do für Phase 7 (Assets)

1. Pixel-Maus-Avatare erstellen (`public/avatars/mouse-0..5.png`) + `avatarArt.ts`-Slot,
   `MouseAvatar` in `PlayerCard` einsetzen.
2. Käse-Krone als Pixel-Asset + `CROWN_SRC`; `👑` ersetzen.
3. UI-Icon-Familie (Mute/KI/Menü/Host) als Pixel-Assets; restliche Emojis ersetzen.
4. App-Icon-SVGs auf Pixel-Art + Palette umziehen, `gen:icons` neu laufen lassen.
5. Optional echte SFX in `public/sfx/` + `SOUNDS.<event>.src` setzen (Slots bereit).
6. Jedes **externe** Asset sofort in `docs/ASSET_LICENSES.md` eintragen.

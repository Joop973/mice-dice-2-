# Icon-Slots (Platzhalter)

Diese Dateien sind **Platzhalter-Slots**. Echte Maus-Illustrationen, App-Icons und
Splash-Screens werden separat beschafft (siehe Gesamtplan, Abschnitt 6) und hier ersetzt.

Benötigte Dateien für die PWA (`vite.config.ts` -> `manifest`):

| Datei            | Größe     | Zweck                          |
|------------------|-----------|--------------------------------|
| `favicon.svg`    | vektoriell| Browser-Tab (vorhanden)        |
| `icon-192.png`   | 192×192   | PWA-Icon (Slot, noch leer)     |
| `icon-512.png`   | 512×512   | PWA-Icon / Splash (Slot, leer) |

Bis echte PNGs vorliegen, kann der SVG-Favicon als Quelle exportiert werden, z. B.:

```sh
# Beispiel (Tool nach Wahl), nicht Teil des Builds:
# rsvg-convert -w 192 -h 192 favicon.svg > icon-192.png
# rsvg-convert -w 512 -h 512 favicon.svg > icon-512.png
```

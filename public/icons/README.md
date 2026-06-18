# App-Icons

Das Icon-Motiv (käse-gelber Würfel mit Mäuse-Ohren und Schwanz) liegt als SVG vor;
die PNGs werden daraus generiert.

| Datei                      | Größe      | Zweck                                   |
|----------------------------|------------|-----------------------------------------|
| `favicon.svg`              | vektoriell | Browser-Tab                             |
| `icon.svg`                 | vektoriell | Quelle „any" (volle Fläche)             |
| `icon-maskable.svg`        | vektoriell | Quelle „maskable" (mit Sicherheitszone) |
| `icon-192.png`             | 192×192    | PWA-Icon (any)                          |
| `icon-512.png`             | 512×512    | PWA-Icon / Splash (any)                 |
| `icon-192-maskable.png`    | 192×192    | PWA-Icon (maskable)                     |
| `icon-512-maskable.png`    | 512×512    | PWA-Icon (maskable)                     |
| `apple-touch-icon.png`     | 180×180    | iOS-Homescreen                          |

## Neu generieren

Nach Änderungen an `icon.svg` / `icon-maskable.svg`:

```sh
npm run gen:icons
```

Das Skript (`scripts/gen-icons.mjs`, nutzt `sharp`) rastert die SVGs zu den PNGs.
Die PNGs sind eingecheckt, damit der reguläre Client-Build **keine** native
Abhängigkeit braucht.

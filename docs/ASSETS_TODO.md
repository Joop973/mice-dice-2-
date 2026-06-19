# Design- & Asset-Liste (Platzhalter → echte Assets)

Alles, was im Code aktuell **Platzhalter, Emoji oder Programmierer-Grafik** ist und
durch echte Designs ersetzt werden sollte. Jede Zeile nennt **wo es im Code andockt**,
**Format/Spez** und **Priorität** (P1 = für einen runden Launch nötig, P2 = sichtbarer
Mehrwert, P3 = Kür).

---

## 1 · Logo & Branding

| Was | Status jetzt | Gebraucht | Andockpunkt | Prio |
|---|---|---|---|---|
| **App-Icon** | geometrische Behelfsgrafik (Käse-Würfel + Ohren) | echtes Icon als SVG | `public/icons/icon.svg` **und** `public/icons/icon-maskable.svg` ersetzen, dann `npm run gen:icons` → erzeugt alle PNGs (192/512, maskable, apple-touch) | **P1** |
| **Wortmarke / Logo** „Dice Mice" | nur Text „🧀 Dice Mice" | Logo-SVG (waagerecht + gestapelt) | Header in `App.tsx`, `OnlineFlow.tsx`, `Rules.tsx` (ersetzt den `<h1>`) | **P1** |
| **favicon.ico** (Alt-Browser) | nur `favicon.svg` | 32×32/48×48 .ico | `public/icons/`, Link in `index.html` | P2 |
| **Social-/Share-Bild** (Open Graph) | fehlt komplett | 1200×630 PNG + `og:`/`twitter:`-Tags | `public/`, Meta-Tags in `index.html` | **P1** |

## 2 · Charaktere (die Mäuse)

> Aktuell gibt es **keinerlei Charakter-Art** — Spieler sind nur Name + Emoji (🐭/🤖/👑).

| Was | Gebraucht | Andockpunkt | Prio |
|---|---|---|---|
| **Maus-Avatare** | 4+ unterscheidbare Mäuse (für bis zu 4 Spieler) | `PlayerCard.tsx` (Kopfzeile neben Name) | **P1** |
| **Zustände je Maus** | idle · gewinnt · sabotiert/getroffen · trägt Krone | Anbindung an `fx.crownedNow` / `fx.warnNow` (siehe `useGameEvents`) | P2 |
| **KI-Gegner-Look** | optisch von Menschen unterscheidbar | `PlayerCard` (statt 🤖) | P2 |
| **Maskottchen** | 1 Hero-Maus für Menü/Leerzustände | Menü (`App.tsx`), Sieger-Screen | P2 |

## 3 · Würfel-Optik

| Was | Status jetzt | Gebraucht | Andockpunkt | Prio |
|---|---|---|---|---|
| **3D-Würfel-Materialien** | flache Farben + prozedurale Zahlen-Textur | echte Materialien/Texturen je Farbe (10 Farben) | `src/ui/colors.ts` (Farben) + `src/ui/dice3d/dieTexture.ts` (Zahlen) + `Die3D.tsx` | P2 |
| **Glitzer-Variante** | nur „✨" im Label, **kein** echter Effekt | Glitzer-Textur/Shader für Blau-Glitzer | `dieTexture.ts` / `Die3D.tsx` (variant === 'glitter') | P2 |
| **Spezial-Faces** | Zahlen | Symbole für Rot (negativ), Braun (Gruppen), Orange | `dieTexture.ts` | P3 |
| **2D-Würfel** | CSS-Farbquadrate | optional Icons/Pips | `src/ui/Die.tsx` | P3 |

## 4 · Sounds

> 8 Ereignisse spielen **prozedurale Platzhaltertöne** (WebAudio). Jeder Eintrag hat
> bereits einen `src`-Slot in `src/sound/events.ts` — echtes Asset eintragen, fertig.

| Event | Auslöser | Andockpunkt | Prio |
|---|---|---|---|
| `roll` | Würfelwurf / Klar-Tausch | `SOUNDS.roll.src` | **P1** |
| `pick` | Würfel aus Angebot genommen | `SOUNDS.pick.src` | **P1** |
| `pass` | im Draft gepasst | `SOUNDS.pass.src` | P2 |
| `crown` | Kronenwechsel | `SOUNDS.crown.src` | **P1** |
| `tick` | Punkte gutgeschrieben | `SOUNDS.tick.src` | P2 |
| `round` | neue Runde | `SOUNDS.round.src` | P2 |
| `win` | Partie gewonnen (Fanfare) | `SOUNDS.win.src` | **P1** |
| `warn` | negative Wertung (Rot/Sabotage) | `SOUNDS.warn.src` | **P1** |

**Format:** kurze `.mp3` **oder** `.ogg`, normalisiert, je < ~50 KB. Ablage in `public/sfx/`,
dann z. B. `src: 'sfx/roll.mp3'` (relativ, wegen `base: './'`).
**Optional (P2/P3):** Hintergrundmusik-Loop (braucht eigenen Player + Mute-Anbindung),
thematische SFX (Maus-Quieken, Würfel-Rattern, Käse, Sabotage-„Sting").

## 5 · Theme / UI-Art

| Was | Status jetzt | Gebraucht | Andockpunkt | Prio |
|---|---|---|---|---|
| **Farbpalette** | 3 flache Farben (dunkelbraun/käsegelb) | finale, **farbfehlsicht-geprüfte** Palette | `:root` in `src/styles.css` + `src/ui/colors.ts` | P2 |
| **Hintergrund/Texturen** | einfarbig `#1c1410` | optional illustrierter Hintergrund/Textur | `body`/`.app` in `styles.css` | P3 |
| **Konfetti** | farbige Rechtecke | thematisch (Käsestücke/Sterne) | `.confetti` in `styles.css` (App/OnlineFlow) | P3 |
| **Custom-Icons** | Emoji (👑🤖🔊🔇📖🎲🌐▶️) | einheitliches Icon-Set | div. Komponenten | P3 |

## 6 · Splash & Store

| Was | Status jetzt | Gebraucht | Prio |
|---|---|---|---|
| **iOS-Splash/Launch-Images** | auto aus Icon+Farbe | eigene Launch-Screens je Gerätegröße (für Capacitor/iOS) | P2 |
| **App-Store/Play-Assets** | fehlen | Screenshots je Gerät, Feature-Grafik, Vorschau-Video, Beschreibung, Keywords | P2 (bei Veröffentlichung) |

## 7 · Tutorial / Regeln

| Was | Status jetzt | Gebraucht | Andockpunkt | Prio |
|---|---|---|---|---|
| **Regel-Illustrationen** | Text + Farbtupfer | Diagramme der 4 Phasen, Beispiel-Würfe | `src/ui/Rules.tsx` | P3 |

## 8 · Typografie & Copy

| Was | Status jetzt | Gebraucht | Prio |
|---|---|---|---|
| **Schrift** | `system-ui` | optional lizensierte Display-Schrift für Logo/Headlines | P3 |
| **Marketing-Copy** | nur Funktionstexte | App-Beschreibung, Slogan, Store-Text | P2 |
| **Spielernamen** | „Maus 1", „KI 1" | optional thematische Namen | P3 |

---

## Schnell-Anleitung zum Einsetzen

- **Icon:** `icon.svg` + `icon-maskable.svg` in `public/icons/` ersetzen → `npm run gen:icons` → committen.
- **Sounds:** Dateien nach `public/sfx/` → in `src/sound/events.ts` je Event `src: 'sfx/<name>.<ext>'` setzen. Der `SoundManager` spielt dann das Asset statt des Platzhaltertons.
- **Charaktere/Logos:** als Komponenten/`<img>`/SVG in den genannten Andockpunkten einsetzen (sag Bescheid, ich verdrahte sie).

**P1-Minimum für einen runden Launch:** App-Icon, Wortmarke, Share-Bild, Maus-Avatare und die 5 P1-Sounds (`roll, pick, crown, win, warn`).

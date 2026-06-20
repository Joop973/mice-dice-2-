# Dice Mice 🧀🐭

Ein eigenständiges Würfelspiel mit Mäuse-Thema (im Geist von Panda Royale, aber
eigener Name, eigene Grafiken und Regeltexte). Stack: **React + Vite**, PWA-fähig,
später Capacitor für iOS.

> Status: **Phasen 0–7** sind umgesetzt:
> - **Phase 0** – Setup + PWA-Gerüst (Vite, manifest, Service Worker, Icon-Slots)
> - **Phase 1** – reine Engine + 26 Unit-Tests
> - **Phase 2** – UI an die Engine angebunden, alle vier Phasen interaktiv (Pass-and-Play)
> - **Phase 3** – KI-Gegner (Solo) mit 3 Schwierigkeitsgraden, gekapselt für spätere
>   serverseitige Wiederverwendung
> - **Phase 4** – 3D-Würfel (react-three-fiber) mit Wurf-/Tumble-Animation,
>   2D-Fallback + Error-Boundary, lazy geladenes three.js-Bundle, 3D/2D-Umschalter
> - **Phase 5** – Sound + Animationen: prozedurale WebAudio-Klänge (mit Slots für
>   echte Assets) und Klang-/Animations-Feedback für Wurf, Kronenwechsel,
>   Punkte-Tick, Draft-Pick/-Pass, Rundenwechsel, Sieger-Sequenz und Negativ-Wertung;
>   Mute-Schalter, `prefers-reduced-motion` respektiert
> - **Phase 6** – Online-Multiplayer: server-autoritativer Raum (wiederverwendet
>   Engine + KI), Lobby mit Beitrittscodes, Transport-Abstraktion mit Loopback-
>   **und** WebSocket-Implementierung, echter Node-`ws`-Server **und** die
>   verdrahtete Online-UI (Menü → Verbinden → Lobby → Online-Partie). Ohne Server
>   läuft der Online-Pfad über den Loopback (Solo gegen KI). Voll getestet
>   (60 Tests, inkl. DOM-Integrationstest der Online-UI).
> - **Phase 7** – PWA-Feinschliff + Deploy: echtes App-Icon (Maus + Käse-Würfel)
>   als SVG mit generierten PNGs (any **und** maskable) + Apple-Touch-Icon,
>   poliertes Manifest, iOS-Meta-Tags, Offline-`navigateFallback`, GitHub-Pages-
>   Deploy-Workflow.
>
> Damit ist der Gesamtplan (Phasen 0–7) umgesetzt.
>
> **Spiel-Feinschliff (nach den Phasen):**
> - **Rundenauswertung** – sichtbare Aufschlüsselung pro Spieler (Farb-Beiträge,
>   Sabotage, Krone) in der Draft-Phase, lokal **und** online.
> - **In-App-Regeln** – Erklär-Screen (Ziel, Ablauf, Würfel-Katalog mit Wertung).
> - **Persistenz** – laufende lokale Partie übersteht einen Reload („Fortsetzen").
>
> Insgesamt **70 Tests** (Engine, Wertung, KI, Netzwerk, UI-Integration via jsdom).

## Entwicklung

```sh
npm install
npm run dev        # Dev-Server (Vite)
npm test           # Unit-Tests der Engine (Vitest)
npm run build      # Produktions-Build (PWA)
npm run typecheck  # TypeScript ohne Emit
npm run gen:icons  # App-Icon-PNGs aus den SVG-Quellen neu rastern (sharp)
```

## Deploy

`base: './'` macht den Build portabel (statische Hosts, Capacitor/`file://`).

- **GitHub Pages:** Repo → Settings → Pages → Source = „GitHub Actions". Der
  Workflow `.github/workflows/deploy.yml` baut + testet + veröffentlicht bei
  jedem Push auf `main` (oder manuell). Ergebnis: statische PWA (Solo,
  Pass-and-Play, Offline, Online über den lokalen Loopback).
- **Beliebiger Static-Host:** `npm run build` → `dist/` ausliefern.
- **Echter Online-Mehrspieler** braucht zusätzlich den WebSocket-Server
  (`server/`) auf einem Node-Host. Im Client die Server-URL angeben
  (`VITE_SERVER_URL` oder Eingabefeld im Online-Menü).

## Architektur

Strikte Trennung von **Engine** und **UI/Transport**, damit dieselbe Engine
lokal (Pass-and-Play / Solo) und später online läuft.

```
src/
  engine/            # reine Spiellogik – KEINE UI, KEIN Netzwerk
    types.ts         #   Typen (Würfel, Spieler, GameState, Config)
    diceCatalog.ts   #   vollständiger Würfel-Katalog + Balance-Config
    rng.ts           #   deterministischer, injizierbarer Zufall (testbar)
    scoring.ts       #   reine Wertungslogik (alle Farben, Tie-Breaks)
    gameEngine.ts    #   Zustands-Maschine (4 Phasen pro Runde)
    __tests__/       #   Unit-Tests je Wertungsregel + Phasenfolge
  ai/                # KI-Gegner – hängt nur von der Engine ab, KEINE UI
    ai.ts            #   Entscheidungen (swap/draft) + Schwierigkeitsgrade
  ui/                # Präsentation
    Die.tsx          #   2D-Platzhalter-Würfel
    DiceView.tsx     #   wählt 3D oder 2D (lazy three.js, Error-Boundary)
    dice3d/          #   react-three-fiber: Canvas, Würfel, Zahlen-Textur
    AnimatedNumber.tsx #  weicher Punkte-Tick (ease-out, reduced-motion-fähig)
    gameEvents.ts    #   reine Ereignis-Erkennung (Zustands-Diff -> Klang/Flags)
    useGameEvents.ts #   React-Brücke: feuert Klänge + kurzlebige Animations-Flags
  sound/             # Audio – hängt nur von benannten Ereignissen ab, KEINE Engine
    events.ts        #   Ereignis-Katalog + prozedurale Töne (Slots für Assets)
    SoundManager.ts  #   WebAudio-Synth/Asset-Player, Mute, Autoplay-Unlock
    useSound.ts      #   React-Hook (Singleton-Manager, Geste-Freischaltung)
  net/               # Online-Kern – server-autoritativ, hängt nur von Engine + KI ab
    protocol.ts      #   Client-/Server-Nachrichten + Aktionen (nur Typen)
    room.ts          #   autoritativer Raum: validiert Aktionen, wendet Engine an
    lobby.ts         #   Raum-Registry + Beitrittscodes (hält pro Raum den RNG)
    transport.ts     #   Transport-Abstraktion (Loopback ⟷ WebSocket)
    LocalTransport.ts#   In-Process-Loopback (Online-Pfad ohne Netzwerk)
    WebSocketTransport.ts # Online-Transport (JSON über WebSocket)
  ui/
    useGameClient.ts #   React-Hook über den Transport (Verbindung + Aktionen)
    OnlineFlow.tsx   #   Online-UI: Verbinden → Lobby → Online-Partie
  App.tsx            # Menü (Lokal/Online) + lokaler Spielablauf, KI-Treiber, Mute
server/
  index.ts           # echter Node-ws-Server – dünn, nutzt den getesteten net-Kern
  tsconfig.json      # eigener Typecheck (npm run typecheck:server), NICHT im Build
```

### Online-Modus (Server)

Der Server ist **autoritativ**: Clients schicken nur Absichten (`GameAction`),
der Server validiert sie gegen die reine Engine und broadcastet den maßgeblichen
`GameState`. Würfeln/Zufall passieren serverseitig (geteilter RNG pro Raum), KI
bzw. Auto-Play übernimmt getrennte oder KI-Sitze.

```sh
npm install            # zieht ws / tsx (Server-Devabhängigkeiten)
npm run dev:server     # WebSocket-Server auf ws://localhost:8787 (Auto-Reload)
npm run typecheck:server
```

Dieselbe Logik läuft ohne Netzwerk über `LocalTransport` (Loopback) – so ist der
Online-Code-Pfad auch offline nutzbar und vollständig testbar.

> Die KI (`src/ai`) ist bewusst von der UI getrennt. `aiTakePhaseAction` ist der
> gemeinsame Einstiegspunkt für den Solo-Modus **und** für serverseitige
> Spielerausfälle im Online-Modus. Drei Stufen: **leicht** (zufällig), **mittel**
> (reiner Erwartungswert), **hart** (kontextbewusste Strategie: Farb-Synergien,
> Braun-Build-Around, Sabotage je nach Spielstand, kein wertloser Kronen-Bonus).
> Belegt per Simulation (`npm run sim`): hart schlägt mittel ~60 %, mittel schlägt
> leicht ~88 %.

## Spielregeln (Kurzfassung)

- 10 Runden. Jede Maus startet mit 1 gelben W6.
- Vier Phasen pro Runde: **Würfeln → Mitleidswürfel → Klar tauschen → Drafting**.
- **Käse-Krone:** höchste Gelb-Summe.
- Zehn Farben (Gelb, Grün, Blau (+Glitzer), Lila, Rot, Klar, Pink, Orange,
  Sabotage, Braun). Der Würfelbeutel ist eine **Liste** von Würfel-Definitionen.

Details und Wertung: siehe `docs/RULES_AND_DECISIONS.md`.

## Getroffene Entscheidungen (offene Fragen aus dem Plan)

Siehe [`docs/RULES_AND_DECISIONS.md`](docs/RULES_AND_DECISIONS.md) — u. a. Timing
von Orange/Sabotage, konfigurierbare Braun-Faces, Rot-Faces und Klar-Wertung.
Alle balance-relevanten Werte liegen in `GameConfig` und sind ohne Engine-Änderung
anpassbar.

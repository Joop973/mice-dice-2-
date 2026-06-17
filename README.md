# Dice Mice 🧀🐭

Ein eigenständiges Würfelspiel mit Mäuse-Thema (im Geist von Panda Royale, aber
eigener Name, eigene Grafiken und Regeltexte). Stack: **React + Vite**, PWA-fähig,
später Capacitor für iOS.

> Status: **Phase 0 (Setup + PWA-Gerüst)** und **Phase 1 (Engine + Tests)** sind
> umgesetzt. Eine minimal lauffähige UI (CSS-Platzhalter-Würfel) treibt die Engine
> bereits an. Phasen 2–7 folgen.

## Entwicklung

```sh
npm install
npm run dev        # Dev-Server (Vite)
npm test           # Unit-Tests der Engine (Vitest)
npm run build      # Produktions-Build (PWA)
npm run typecheck  # TypeScript ohne Emit
```

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
  ui/                # Präsentation (Phase 4: 3D-Würfel ersetzen Platzhalter)
  App.tsx            # minimaler Engine-Treiber
```

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

# ARCHITECTURE.md — Dice Mice (Ist-Zustand)

> Beschreibt den **tatsächlichen** Code auf diesem Branch, nicht den Zielzustand
> aus `docs/LEITFADEN.md` (der PR #2 vorwegnimmt). Wo Leitfaden und Code sich
> widersprechen, **gewinnt der Code** — siehe `docs/TECH_DEBT.md` für die Liste der
> Abweichungen. Stand: Phase-1-Analyse.

## Stack

- **React 18 + TypeScript + Vite** (PWA via `vite-plugin-pwa`).
- **Three.js + @react-three/fiber** für 3D-Würfel, mit 2D-CSS-Fallback.
- **WebSocket-Server** (`ws`) in Node für den Online-Modus; `tsx` als Runner.
- **vitest** + Testing Library (jsdom) für Unit/Component-Tests.
- **ESLint** (flat, `eslint.config.js`) + **Prettier** (`.prettierrc.json`) für
  Korrektheit/Formatierung; `src/engine` und `docs` sind von Prettier ausgenommen.
- **Playwright** (`e2e/`, `playwright.config.ts`, Script `test:e2e`) für E2E-Rauchtests
  (Browser-Binaries müssen mit Netzwerkzugriff einmalig installiert werden).

## Verzeichnisbild (real)

```
src/
  engine/                 # REIN, TABU — Spiel-Logik, Würfeln, Wertung
    gameEngine.ts  scoring.ts  diceCatalog.ts  rng.ts  types.ts  index.ts
    __tests__/gameEngine.test.ts  scoring.test.ts
  ai/                     # KI-Gegner (rein), gekapselt
    ai.ts  index.ts  __tests__/ai.test.ts
  net/                    # Transport + Online-Protokoll + Räume
    transport.ts  LocalTransport.ts  WebSocketTransport.ts
    protocol.ts  lobby.ts  room.ts  index.ts
    __tests__/localTransport.test.ts  room.test.ts
  sound/                  # prozedurale WebAudio-Töne (Platzhalter)
    SoundManager.ts  events.ts  useSound.ts  index.ts
  ui/                     # Präsentation (lokal + online geteilt)
    colors.ts             # DIE_COLORS, DIE_LABELS (nur Würfelfarben!)
    Die.tsx               # 2D-Würfel (CSS, zeigt Zahl)
    DiceView.tsx          # wählt 2D/3D + Lazy-Load + Fallback
    PlayerCard.tsx  RoundSummary.tsx  Rules.tsx  AnimatedNumber.tsx
    OnlineFlow.tsx        # gesamter Online-UI-Flow
    persistence.ts        # lokale Partie (localStorage, v1)
    gameEvents.ts  useGameEvents.ts   # Event-Erkennung -> Sound/FX
    useGameClient.ts      # Online-Client-Hook
    dice3d/
      DiceCanvas.tsx  Die3D.tsx  dieTexture.ts  DiceErrorBoundary.tsx  webgl.ts
    __tests__/App.test.tsx  OnlineFlow.test.tsx  gameEvents.test.ts  persistence.test.ts
  App.tsx                 # lokaler Flow (Menü/Setup/Game) + PHASE_LABEL-Kopie
  main.tsx  styles.css  vite-env.d.ts
server/
  index.ts  tsconfig.json
public/
  icons/ (...)            # generierte App-Icons (Platzhalter-Grafik)
docs/
  LEITFADEN.md  UI_SYSTEM.md  ARCHITECTURE.md  TECH_DEBT.md
  CODE_STANDARDS.md  ASSETS_TODO.md  RULES_AND_DECISIONS.md
scripts/                  # gen-icons.mjs, simulate.ts
```

## Schichten & Datenfluss

```
engine/ (rein, deterministisch über RNG)
   │  GameState
   ▼
App.tsx (lokal)            OnlineFlow.tsx (online)
   │  hält GameState         │  rendert empfangenen GameState,
   │  + ruft Engine/AI       │  schickt Aktionen an den Server
   ▼                         ▼
   └────────── geteilte UI: PlayerCard / DiceView / RoundSummary ──────────┘
                                  │
   GameState-Übergänge  ─────────►  useGameEvents → gameEvents.detectEvents
                                  │     (rein: Snapshot-Diff)
                                  ▼
                          Sound (useSound/SoundManager) + FX-Flags (Banner/Puls/Shake)
```

- **Engine ist autoritativ und rein.** Würfeln/Wertung/Krone/Sabotage passieren
  ausschließlich in `engine/` (deterministisch über `rng.ts`).
- **Lokal:** `App.tsx` hält `GameState` in React-State, ruft reine Engine-Funktionen
  (`advancePhase`, `draftPick`, `swapClearDice` …) und das `ai`-Modul auf.
- **Online:** Der Server (`server/index.ts` + `net/room.ts`) ist autoritativ.
  `OnlineFlow` rendert den empfangenen Zustand und sendet Aktionen. Ohne Server-URL
  fällt der Online-Pfad auf `LocalTransport` (In-Process-Loopback) zurück.
- **Events/FX:** `gameEvents.ts` vergleicht zwei `Snapshot`s rein (ohne React/DOM)
  und liefert Sound-Liste + Animations-Flags; `useGameEvents` spielt Sounds und setzt
  kurzlebige FX (Banner, Krone-Puls, Warn-Shake).

## Würfel-Rendering

- **2D (`Die.tsx`):** farbiges CSS-Quadrat mit **Zahl** (`die.value`),
  Hintergrund aus `DIE_COLORS`.
- **3D (`dice3d/`):** `DiceView` lädt `DiceCanvas` lazy (nur wenn `use3d` und WebGL
  verfügbar), je Spielerkarte ein `<Canvas>`. `Die3D` rendert eine `boxGeometry` mit
  `dieTexture()` (Canvas-Textur mit der **Zahl**), Farbe aus `DIE_COLORS`.
- **Es gibt keine Pips** und kein `dicePips.ts` — beide Pfade zeigen die Zahl.
  Gemeinsame Farbquelle ist `colors.ts`; `Die3D`/`dieTexture` enthalten zusätzlich
  einzelne hartkodierte Hex-Werte (siehe TECH_DEBT).

## Persistenz

- **Eine** versionierte Quelle: `persistence.ts` (`KEY=dicemice.localgame`, `VERSION=1`)
  speichert die laufende **lokale** Partie. Online-Partien hält der Server.
- `SoundManager` speichert die Stummschaltung (`dicemice.muted`) als **unversionierten**
  rohen localStorage-String.
- Kein `settings.ts`/`stats.ts` (anders als im Leitfaden).

## Reduced-Motion / jsdom

- Dekorative CSS-Animationen werden in `styles.css` per
  `@media (prefers-reduced-motion: reduce)` abgeschaltet.
- `AnimatedNumber.tsx` prüft `prefers-reduced-motion` **zusätzlich** selbst und springt
  dann auf den Endwert. Es gibt **kein** zentrales `motion.ts`.
- 3D lädt nur bei vorhandenem WebGL (`isWebGLAvailable`), sonst 2D-Fallback — in jsdom
  damit automatisch 2D.

## Test-/Build-Kommandos (real, aus `package.json`)

| Zweck | Kommando |
|---|---|
| Unit/Component-Tests | `npm test` (`vitest run`) |
| E2E (Browser nötig) | `npm run test:e2e` (`playwright test`) |
| Lint | `npm run lint` (`eslint .`) |
| Format prüfen / schreiben | `npm run format:check` / `npm run format` |
| Typecheck (App) | `npm run typecheck` |
| Typecheck (Server) | `npm run typecheck:server` |
| Build | `npm run build` |
| Dev-Server (Web) | `npm run dev` |
| Dev-Server (WS) | `npm run dev:server` |
| Icons generieren | `npm run gen:icons` |
| Balance-Simulation | `npm run sim` |

> **Hinweis:** `lint`/`format:check`/`test:e2e` sind eingerichtet. Der E2E-Lauf
> braucht installierte Browser-Binaries (in dieser Sandbox blockiert, siehe TECH_DEBT §H).
</invoke>

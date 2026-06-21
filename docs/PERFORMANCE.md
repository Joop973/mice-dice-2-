# PERFORMANCE.md — Dice Mice (Phase 6)

> Performance-Bestandsaufnahme am realen Code. Befunde mit Belegen. Reine Analyse.

## Bereits vorhandene Optimierungen (gut)

- **3D lazy-geladen:** `DiceView` importiert `DiceCanvas` per `lazy()` + `Suspense`
  (`DiceView.tsx:12`). Three.js/r3f landen in einem separaten Chunk und werden nur
  geladen, wenn 3D aktiv **und** WebGL verfügbar ist. Solo-/2D-Modus bleibt schlank.
- **Proaktive WebGL-Erkennung, gecacht:** `isWebGLAvailable()` prüft einmal pro Session
  (`webgl.ts:5`), sonst sofort 2D-Fallback (kein teurer Render-Fehler).
- **Würfel-Texturen gecacht:** `dieTexture` cached pro `(value|bg)`
  (`dieTexture.ts:8`); `Die3D` memoisiert die Textur zusätzlich per `useMemo`
  (`Die3D.tsx:29`).
- **Frame-Schutz:** `Die3D` deckelt `delta` (`Die3D.tsx:45`) gegen Sprünge nach
  Tab-Wechseln; Spin dämpft sauber aus.
- **PWA-Caching:** Workbox cached alle Build-Assets inkl. des three.js-Chunks
  (`vite.config.ts:50`) → Solo offline spielbar.
- **rAF mit Cleanup:** `AnimatedNumber` nutzt `requestAnimationFrame` und räumt auf
  (`AnimatedNumber.tsx:43`).
- **Relative `base: './'`** hält den Build portabel (Capacitor/statisch).

## Befunde (gering — keine kritischen Engpässe)

| # | Befund | Beleg | Bewertung |
|---|---|---|---|
| P1 | **Ein `<Canvas>` pro Spielerkarte** → bis zu 4 WebGL-Kontexte gleichzeitig (Spiel ist auf 4 Spieler begrenzt). | `DiceView.tsx:50`, `DiceCanvas.tsx` | ok bei ≤4; **kein** „ab >4 → 2D"-Schalter nötig, da Spielerzahl begrenzt (`App.tsx:296`). Der im Leitfaden erwähnte `effectiveUse3d` existiert nicht — auch nicht nötig. |
| P2 | **Textur-Cache wird nie geräumt.** | `dieTexture.ts:8` | unkritisch: max ~10 Farben × Wertebereich ≈ wenige hundert kleine Texturen; pro Session begrenzt. |
| P3 | **Kein `antialias:false` trotz Pixel-Ziel.** `Canvas` rendert mit `antialias: true`. | `DiceCanvas.tsx:26` | für den Pixel-Stil (Phase 7) ohnehin auf `false` + Nearest-Filter umzustellen → spart sogar GPU-Last. |
| P4 | **PlayerCard rendert bei jedem State-Wechsel neu.** | `App.tsx:476` | unkritisch bei ≤4 Karten; keine Virtualisierung nötig. Kein `React.memo`, aber Listen sind winzig. |
| P5 | **Audio-Scheduler** erzeugt Oszillatoren on-demand, kurze Stops. | `SoundManager.ts:98` | leichtgewichtig; keine Dauerlast. |

## Empfehlungen (klein, meist in Phase 7 mitnehmbar)

1. Bei der Pixel-Umstellung `antialias: false` + `texture.magFilter = NearestFilter`
   setzen (P3) — passt zum Stil **und** entlastet die GPU.
2. Optional: 3D bei niedriger interner Auflösung rendern und hochskalieren
   (`image-rendering: pixelated` am Canvas) — Pixel-Look + weniger Pixel-Last.
3. Textur-Cache kann so bleiben; bei Bedarf später eine simple LRU-Grenze.

**Fazit:** Performance ist solide; keine kritischen Engpässe. Die einzige sinnvolle
Maßnahme (P3) fällt ohnehin mit der Pixel-Würfel-Umstellung in Phase 7 an.

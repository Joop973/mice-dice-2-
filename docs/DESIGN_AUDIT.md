# DESIGN_AUDIT.md — Dice Mice (Phase 3)

> Screen-für-Screen-Audit am **realen Code** gegen fünf Kriterien:
> **(1)** Farben aus Variablen? · **(2)** Button-Stil korrekt (nur 2 Typen)? ·
> **(3)** Emoji/SVG konsistent? · **(4)** Tap-Ziele ≥ 44 px? · **(5)** reduced-motion ok?
>
> Bewertung je Kriterium: ✅ ok · ⚠️ teils · ❌ verletzt · — n/a.
> Reine Bestandsaufnahme, keine Code-Änderung. Belege als `Datei:Zeile`.

## Vorhandene vs. erwartete Screens

Der Leitfaden nennt: Setup, lokales Spiel, Online-Lobby + Flow, Settings, Stats,
Tutorial, Rules, Podium.

| Screen | Status |
|---|---|
| Menü | vorhanden (`App.tsx` `Menu`) |
| Setup | vorhanden (`App.tsx` `Setup`) |
| Lokales Spiel | vorhanden (`App.tsx` `Game`) |
| Online — Connect | vorhanden (`OnlineFlow.tsx` `Connect`) |
| Online — Lobby | vorhanden (`OnlineFlow.tsx` `Lobby`) |
| Online — Spiel | vorhanden (`OnlineFlow.tsx` `OnlineGame`) |
| Rules | vorhanden (`Rules.tsx`) |
| Sieger-/„Podium"-Screen | nur `panel--win`-Endscreen (kein eigenes Podium) in `App.tsx` + `OnlineFlow.tsx` |
| **Settings** | **fehlt** — nur ein Mute-Toggle im Spiel-Header |
| **Stats** | **fehlt** |
| **Tutorial** | **fehlt** — nur statischer Rules-Screen |

## Audit-Matrix

| Screen | 1 Farb-Vars | 2 Button-Stil | 3 Emoji/SVG | 4 Tap ≥44px | 5 reduced-motion |
|---|---|---|---|---|---|
| Menü | ⚠️ | ⚠️ | ❌ | ✅ | ✅ |
| Setup | ⚠️ | ❌ | ✅ | ❌ | ✅ |
| Lokales Spiel | ⚠️ | ❌ | ❌ | ❌ | ⚠️ |
| Online — Connect | ⚠️ | ❌ | ❌ | ❌ | ✅ |
| Online — Lobby | ⚠️ | ⚠️ | ❌ | ✅ | ✅ |
| Online — Spiel | ⚠️ | ❌ | ❌ | ❌ | ⚠️ |
| Rules | ⚠️ | ✅ | ❌ | ✅ | ✅ |
| Sieger-Screen | ⚠️ | ✅ | ❌ | ✅ | ✅ |

> **Kriterium 1 ist überall ⚠️:** Komponenten-Inline-Farben kommen sauber aus
> `DIE_COLORS` (`colors.ts`), aber das CSS selbst nutzt fast nur Hardcoded-Hex statt
> Variablen (nur `--bg/--panel/--accent/--text` existieren). Details in
> `TECH_DEBT.md §B`.

---

## Querschnitt-Befunde (screenübergreifend)

### D1 — Button-Wildwuchs: 5+ Stile statt 2 (Kriterium 2) · hoch
Der Standard erlaubt nur **zwei** Typen (geschnitzter Holz-/Token-Button + `.ghost`).
Real existieren:
- `button` (Basis) — flaches Gold, **ohne** Bevel/Press, also nicht der „geschnitzte
  Holz-Stil" (`styles.css:254`).
- `button.ghost` — Outline ✅ (`styles.css:270`).
- `.toggle3d` — transparente Pille mit Rand (`styles.css:99`).
- `.seg__btn` / `.seg__btn--on` — Segmented-Control (`styles.css:212`).
- `.offer` — Outline in Würfelfarbe (`styles.css:238`).
- `.counter button` — 40×40-Rundtaste (`styles.css:192`).

→ Auf zwei Token-Stile konsolidieren (+ klar definierte Sub-Rollen). Der primäre
Button hat zudem **noch keine** Holz-/Bevel-Anmutung (Qualitätslatte).

### D2 — Tap-Ziele < 44 px (Kriterium 4) · hoch
- `.counter button` → **40 px** (`styles.css:194`).
- `.toggle3d` → padding `2px 12px` ≈ **~23 px** (`styles.css:104`) — 3D- und Mute-Toggle.
- `.seg__btn` → padding `8px 12px` ≈ **~32 px** (`styles.css:216`).
- `.offer` → padding `8px 12px` ≈ **~34 px** (`styles.css:243`).
- `.input` → padding `10px 12px` ≈ **~40 px** (`styles.css:293`).
- OK: Basis-`button` (`12px 18px`, `styles.css:259`), `.die` (46 px, `styles.css:111`).

→ Min-Höhe 44 px bzw. größere Hitboxen erzwingen (Asset darf kleiner sein, Hitbox nicht).

### D3 — Kein Focus-Ring (A11y / Kriterium 2) · hoch
Im gesamten `styles.css` gibt es **keine** `:focus`/`:focus-visible`-Regel. Tastatur-
Fokus zeigt nur den Browser-Default; der im Leitfaden genannte „Gold-Ring" fehlt.
→ Zentralen `:focus-visible`-Stil (Akzent/Gold) einführen — wichtig, da viele
interaktive Elemente Outlines bereits für *Auswahl* (`die--selected`) nutzen.

### D4 — 3D-Würfel ignoriert reduced-motion (Kriterium 5) · mittel
Die CSS-Animationen sind sauber per `@media (prefers-reduced-motion: reduce)` abgeschaltet
(`styles.css:602`), und `AnimatedNumber` springt bei reduced-motion (`AnimatedNumber.tsx:8`).
**Aber:** `Die3D` würfelt in `useFrame` **immer** (Tumble/Spin), ohne reduced-motion-Gate
(`Die3D.tsx:42-55`). In jsdom greift der 2D-Fallback (kein WebGL), reale Nutzer mit
reduced-motion sehen aber weiterhin die 3D-Animation.
→ Spin/Tumble bei reduced-motion auf ruhiges End-Resultat setzen (No-op).

### D5 — Emojis statt Assets (Kriterium 3) · hoch (Stil-Anker)
Auf fast jedem Screen; vollständige Stellen- und Mapping-Liste in `UI_SYSTEM.md §8`.
Zusätzlich **inkonsistent**: Mute nutzt `🔇/🔊`, aber es gibt keine konsistente
Icon-Familie; Menü mischt `🎲 🌐 📖 ▶️`.

### D6 — Lokal ≠ Online: Paritätslücken · mittel
- **Phasen-Hinweis fehlt online:** lokal zeigt `Game` `PHASE_HINT` (`App.tsx:473`),
  `OnlineGame` zeigt **keinen** Hinweistext (`OnlineFlow.tsx`, Header endet bei `#code`).
- **Mute-/3D-Toggle fehlt online:** `Game`-Header hat beide Toggles (`App.tsx:453-463`);
  `OnlineGame` hat keinen (`use3d` ist dort fest `true`, `OnlineFlow.tsx:338`).
→ Geteilte Header-/Hinweis-Komponente, damit beide Screens identisch wirken
(Leitfaden-Regel „Lokal == Online").

---

## Positiv (bereits konform)

- A11y-Grundlagen vorhanden: `aria-label`/`aria-pressed` an Würfeln (`Die.tsx:44-45`),
  `role="status"` + `aria-live="polite"` am Banner (`App.tsx:468`, `OnlineFlow.tsx:324`),
  `aria-hidden` an dekorativem Konfetti/Swatch.
- Würfelfarben durchgängig aus **einer** Quelle (`DIE_COLORS`) in 2D, 3D, RoundSummary,
  Rules, Draft-Angebot.
- CSS-Animationen degradieren sauber bei reduced-motion (außer D4).
- `.die` (46 px) und Basis-`button` erfüllen die Tap-Größe bereits.

## Priorisierte To-do-Liste (für Phase 7)

1. **D1** Button-System auf 2 Token-Stile konsolidieren + Holz/Bevel-Anmutung. (hoch)
2. **D2** Tap-Ziele ≥ 44 px erzwingen. (hoch)
3. **D3** `:focus-visible`-Gold-Ring zentral einführen. (hoch)
4. **D5** Emojis durch Pixel-Assets ersetzen (`UI_SYSTEM.md §8`). (hoch)
5. **D6** Header/Hinweis als geteilte Komponente → Lokal==Online. (mittel)
6. **D4** 3D-Würfel an reduced-motion koppeln. (mittel)
7. Fehlende Screens (Settings/Stats/Tutorial) sind Feature-Arbeit, **kein**
   Homogenisierungs-Thema — nur erwähnt, nicht in Phase 7 eingeplant.

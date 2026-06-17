# Regeln & getroffene Entscheidungen

Dieses Dokument hält fest, **wie** die Engine die Regeln umsetzt — insbesondere die
im Gesamtplan (Abschnitt 5) offen gelassenen Fragen. Alle balance-relevanten Werte
liegen in `GameConfig` (`src/engine/types.ts`, Defaults in `diceCatalog.ts`).

## Würfel-Katalog

| Farbe     | Würfel              | Wertung |
|-----------|---------------------|---------|
| Gelb      | W6, W8              | Summe; höchste Gelb-Summe = Käse-Krone |
| Grün      | W20                 | Standard-Summe |
| Blau      | W6, W8, W12 (+Glitzer) | Standard-Summe; Blau + Blau-Glitzer = **eine** Farbe für Orange |
| Lila      | W8, W12             | Standard-Summe |
| Rot       | W6, W8              | Faces positiv **und** negativ (konfigurierbar) |
| Klar      | W6                  | Utility; in der Swap-Phase neu würfelbar |
| Pink      | W12                 | Standard-Summe |
| Orange    | W3                  | Wert × Anzahl verschiedener Farben dieser Runde |
| Sabotage  | W8, W12             | Summe wird dem Kronenhalter abgezogen |
| Braun     | Faces {2,2,2,3,3,3} | Summe × größte passende Gruppe |

## Entscheidung 1 — Timing von Orange & Sabotage

**Frage:** Lesen Orange/Sabotage den Rundenstand beim Werten oder am Rundenende?

**Entscheidung:** **Am Rundenende**, nachdem alle Spieler in Phase 1 geworfen haben.
Konkret beim Phasenübergang `swap → draft` (`advancePhase`). Zu diesem Zeitpunkt
stehen alle Würfe fest, daher gibt es **keine Reihenfolge-Mehrdeutigkeit**.

- **Orange** zählt die Farbvielfalt des **jeweiligen Spielers** (dessen eigene, in
  dieser Runde geworfene Würfel). Blau + Blau-Glitzer = eine Farbe; Orange und Pink
  werden mitgezählt.
- **Sabotage** wird gegen den zu diesem Zeitpunkt feststehenden Kronenhalter
  verrechnet.

## Entscheidung 2 — Sabotage-Ziel & Tie-Breaks

- Ziel ist der **Kronenhalter** (höchste Gelb-Summe der Runde).
- Hält der **Werfer selbst** die Krone, trifft seine Sabotage den **Zweitplatzierten**.
- **Krone-Rangfolge / Tie-Break:** höchste Gelb-Summe; bei Gleichstand höhere
  Basis-Rundenpunkte; danach stabile Spielerreihenfolge.
- Mehrere Sabotage-Würfe eines Spielers werden als **kombinierte Summe** abgezogen.
- Gibt es kein gültiges Ziel (z. B. nur 1 Spieler und der hält die Krone),
  **verpufft** die Sabotage.
- Endwerte dürfen **negativ** werden (Rot und Sabotage).

## Entscheidung 3 — Klar-Würfel-Wertung

`GameConfig.clearScores` (Default **false**): Klar ist standardmäßig ein reiner
Utility-/Tausch-Würfel und zählt **nicht** zur Punktwertung. Für Playtesting auf
`true` setzbar (dann Standard-Summe).

## Entscheidung 4 — Braun-Balance (konfigurierbar)

`GameConfig.brownFaces` (Default `{2,2,2,3,3,3}` = {2,3}). Quadratisches
Skalierungsrisiko (Summe **und** Multiplikator wachsen). Presets in
`diceCatalog.ts` (`BROWN_FACE_PRESETS`): `standard {2,3}`, `lowOneTwo {1,2}`,
`oneTwoThree {1,2,3}`. Im Playtesting beobachten.

## Entscheidung 5 — Rot-Faces (konfigurierbar)

`GameConfig.redFaces` — Default:
- W6: `[-2, -1, 1, 2, 3, 4]`
- W8: `[-3, -2, -1, 1, 2, 3, 4, 5]`

Bewusst als Slot ausgelegt; exakte Werte stehen im Plan nicht fest und sind
Balance-Material.

## Entscheidung 6 — Mitleidswürfel (Platzhalter-Regel)

Der Plan nennt die Phase, aber keine exakte Verteilregel. **Platzhalter-Default:**
jeder Spieler mit **unterdurchschnittlichem** Gesamtstand (`totalScore < Maximum`)
erhält einen zusätzlichen gelben W6, der sofort geworfen und dieser Runde
gutgeschrieben wird (nicht im Beutel behalten). In Runde 1 (alle 0 Punkte) passiert
nichts. **Im Playtesting zu verfeinern.**

## Wertungszeitpunkt zusammengefasst

```
roll  → alle Spieler würfeln ihren Beutel
pity  → Mitleidswürfel (siehe Entscheidung 6)
swap  → Klar-Würfel neu würfeln (interaktiv)
draft → ⟵ HIER wird die Runde gewertet (Orange/Sabotage/Krone), dann Angebot
```

Das Draft-Angebot beeinflusst erst die **nächste** Runde, daher ist die Wertung am
Ende der Swap-Phase eindeutig.

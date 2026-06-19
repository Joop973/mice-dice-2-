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

## Entscheidung 5 — Rot-Faces (balance-getunt)

`GameConfig.redFaces` — Default (nach Balance-Simulation):
- W6: `[-3, -1, 4, 6, 7, 9]` (Summe 22, Mittel **3.67**)
- W8: `[-4, -2, 5, 6, 8, 9, 10, 12]` (Summe 44, Mittel **5.5**)

**Begründung:** Die ursprünglichen Slots (EV ~1) machten Rot zu *totem Inhalt* —
in 4000 simulierten Partien nur **0.3 %** Punktanteil, kaum gedraftet. Rot ist als
High-Variance-Würfel gedacht: echte Negativ-Faces (Risiko) **und** eine lohnende
Oberkante. Der EV liegt nun leicht über einem normalen Würfel gleicher Größe
(Prämie fürs Risiko). Nach dem Tuning: **8 %** Anteil, regelmäßig gedraftet.

## Entscheidung 6 — Mitleidswürfel (konfigurierbar)

`GameConfig.pityMode` steuert die Rubberbanding-Stärke:
- `belowMax` — jeder unter dem Spitzenstand (großzügig, ~3/4 Spieler)
- `belowAverage` — **Default**: jeder unter dem Punkte-Durchschnitt (~1/2 Spieler)
- `lastPlace` — nur die hinterste(n) Maus/Mäuse

Wer berechtigt ist, erhält einen zusätzlichen gelben W6, der sofort geworfen und
dieser Runde gutgeschrieben wird (nicht im Beutel behalten). Bei Gleichstand
(z. B. Runde 1, alle 0) passiert nichts.

**Begründung:** `belowMax` verteilte in der Simulation ~26 Mitleidswürfel pro
Partie (praktisch „alle außer dem Führenden, jede Runde"). `belowAverage` zielt
gezielter auf echte Nachzügler (~19/Partie), ohne die Rennen-Enge zu verlieren
(Sieger-Streuung und Krone-Wechsel praktisch unverändert).

## Balance-Methodik

`npm run sim [partien] [difficulty] [seed]` (`scripts/simulate.ts`) spielt viele
vollständige KI-Partien über die reine Engine und misst u. a. Punktverteilungen,
Punktanteil **je Farbe**, Sabotage-Häufigkeit, Krone-Wechsel und negative Runden.
Die obigen Default-Werte sind aus diesen Messungen abgeleitet (4000 Partien, je
Schwierigkeitsgrad geprüft).

**Braun** bleibt bewusst ein **High-Variance-Build-Around**: als Einzelwürfel
schwach, gestapelt (Summe × größte Gruppe) mit hoher Decke (bis ~110 Punkte/Runde
in der Sim). Greedy gedraftet wird es selten — das ist gewollte Nischen-Tiefe, kein
Balance-Fehler. Presets in `diceCatalog.ts`, falls im echten Playtesting anders
gewünscht.

## Wertungszeitpunkt zusammengefasst

```
roll  → alle Spieler würfeln ihren Beutel
pity  → Mitleidswürfel (siehe Entscheidung 6)
swap  → Klar-Würfel neu würfeln (interaktiv)
draft → ⟵ HIER wird die Runde gewertet (Orange/Sabotage/Krone), dann Angebot
```

Das Draft-Angebot beeinflusst erst die **nächste** Runde, daher ist die Wertung am
Ende der Swap-Phase eindeutig.

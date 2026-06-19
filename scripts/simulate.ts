// Balance-Simulation: spielt viele vollständige KI-Partien über die REINE Engine
// und sammelt Statistiken, um die offenen Balance-Slots (Rot, Braun, Orange,
// Sabotage, Mitleidswürfel) datengetrieben zu tunen – kein Playtesting mit
// Menschen nötig, aber belastbare Verteilungen.
//
// Lauf:  npx tsx scripts/simulate.ts [partien] [difficulty] [seed]
//   z. B. npx tsx scripts/simulate.ts 3000 hard

import {
  advancePhase,
  startGame,
  type DieColor,
  type GameConfig,
  type GameState,
  type RNG,
  createRNG,
} from '../src/engine';
import { aiTakePhaseAction, type Difficulty } from '../src/ai';

const COLORS: DieColor[] = [
  'yellow', 'green', 'blue', 'purple', 'red', 'clear', 'pink', 'orange', 'sabotage', 'brown',
];

interface RoundRecord {
  playerId: string;
  final: number;
  base: number;
  contributions: Record<DieColor, number>;
  sabotageThrown: number;
  sabotageReceived: number;
  hasCrown: boolean;
  colorCounts: Record<DieColor, number>;
}

interface GameRecord {
  finals: number[];
  winner: number;
  rounds: RoundRecord[][]; // [round][player]
  pityCount: number;
  crownChanges: number;
}

function countColors(rolled: { color: DieColor }[]): Record<DieColor, number> {
  const c = Object.fromEntries(COLORS.map((k) => [k, 0])) as Record<DieColor, number>;
  for (const d of rolled) c[d.color]++;
  return c;
}

/** Treibt eine komplette KI-Partie und protokolliert jede gewertete Runde. */
function playGame(
  seed: number,
  difficulties: Difficulty[],
  config?: Partial<GameConfig>
): GameRecord {
  const rng: RNG = createRNG(seed);
  let state: GameState = startGame({
    players: difficulties.map((_, i) => ({ name: `P${i}`, isAI: true })),
    seed,
    config,
  }).state;
  const diffOf = (id: string) => difficulties[Number(id.slice(1))] ?? 'medium';

  const rounds: RoundRecord[][] = [];
  let pityCount = 0;
  let lastCrown = -1;
  let crownChanges = 0;

  for (let guard = 0; guard < 200 && !state.finished; guard++) {
    if (state.phase === 'swap') {
      // KI-Tausch (no-op bei clearScores=false), dann werten.
      for (const p of state.players) state = aiTakePhaseAction(state, p.id, diffOf(p.id), rng);
      const before = state;
      state = advancePhase(state, rng); // swap -> draft: wertet
      // Mitleidswürfel dieser Runde zählen (rolled enthält isPity-Marker).
      pityCount += before.players.reduce(
        (n, p) => n + p.rolled.filter((d) => d.isPity).length,
        0
      );
      const scores = state.lastScores!;
      const rec: RoundRecord[] = scores.map((s, i) => ({
        playerId: s.playerId,
        final: s.final,
        base: s.base,
        contributions: s.contributions as Record<DieColor, number>,
        sabotageThrown: s.sabotageThrown,
        sabotageReceived: s.sabotageReceived,
        hasCrown: s.hasCrown,
        colorCounts: countColors(before.players[i].rolled),
      }));
      rounds.push(rec);
      const crownIdx = scores.findIndex((s) => s.hasCrown);
      if (lastCrown !== -1 && crownIdx !== lastCrown) crownChanges++;
      lastCrown = crownIdx;
      continue;
    }
    if (state.phase === 'draft') {
      let g = 0;
      while (state.phase === 'draft' && g++ < 6) {
        const next = state.players.find((p) => !state.draftedThisPhase.includes(p.id));
        if (!next) break;
        state = aiTakePhaseAction(state, next.id, diffOf(next.id), rng);
      }
      state = advancePhase(state, rng); // draft -> nächste Runde / Ende
      continue;
    }
    state = advancePhase(state, rng); // roll -> pity -> swap
  }

  const finals = state.players.map((p) => p.totalScore);
  const winner = finals.indexOf(Math.max(...finals));
  return { finals, winner, rounds, pityCount, crownChanges };
}

// --- Statistik-Helfer ---
function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}
function stdev(xs: number[]): number {
  const m = mean(xs);
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)));
}
function pct(xs: number[], p: number): number {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))];
}
function minOf(xs: number[]): number {
  return xs.reduce((m, x) => (x < m ? x : m), Infinity);
}
function maxOf(xs: number[]): number {
  return xs.reduce((m, x) => (x > m ? x : m), -Infinity);
}
function fmt(n: number): string {
  return n.toFixed(1).padStart(7);
}

/** Rotiert ein Array um n Positionen (für faire Sitzverteilung). */
function rotate<T>(xs: T[], n: number): T[] {
  const k = ((n % xs.length) + xs.length) % xs.length;
  return [...xs.slice(k), ...xs.slice(0, k)];
}

/**
 * Kopf-an-Kopf: gibt eine Liste von Sitz-Schwierigkeiten vor und rotiert sie pro
 * Partie durch alle Sitze (eliminiert Positionsbias). Meldet die Siegquote je
 * Schwierigkeitsgrad. Fair-Share = Sitzanteil des Grades.
 */
function runMatchup(games: number, lineup: Difficulty[], baseSeed: number) {
  const wins: Record<string, number> = {};
  const seats: Record<string, number> = {};
  for (const d of lineup) seats[d] = (seats[d] ?? 0) + 1;

  for (let i = 0; i < games; i++) {
    const order = rotate(lineup, i); // Sitzrotation
    const g = playGame(baseSeed + i, order);
    const winnerDiff = order[g.winner];
    wins[winnerDiff] = (wins[winnerDiff] ?? 0) + 1;
  }

  console.log(`\n=== Kopf-an-Kopf (${games} Partien, Sitzrotation) ===`);
  console.log(`Aufstellung: ${lineup.join(', ')}\n`);
  console.log(`  Grad      Siege%   Fair-Share%   Index (Sieg/Fair)`);
  for (const d of Object.keys(seats)) {
    const winPct = (100 * (wins[d] ?? 0)) / games;
    const fair = (100 * seats[d]) / lineup.length;
    console.log(
      `  ${d.padEnd(8)} ${winPct.toFixed(1).padStart(6)}   ${fair.toFixed(1).padStart(8)}     ${(winPct / fair).toFixed(2)}`
    );
  }
  console.log('');
}

function run() {
  const games = Number(process.argv[2] ?? 3000);
  const difficultyArg = (process.argv[3] as string) ?? 'hard';
  const baseSeed = Number(process.argv[4] ?? 1);

  // Komma-getrennt -> Kopf-an-Kopf-Modus (z. B. "hard,hard,medium,medium").
  if (difficultyArg.includes(',')) {
    runMatchup(games, difficultyArg.split(',') as Difficulty[], baseSeed);
    return;
  }
  const difficulty = difficultyArg as Difficulty;

  const allFinals: number[] = [];
  const winnerScores: number[] = [];
  const allRoundFinals: number[] = [];
  let negativeRounds = 0;
  let totalRounds = 0;
  let totalPity = 0;
  let totalCrownChanges = 0;
  let gamesWithSabotage = 0;
  let sabotageHitRounds = 0;
  let sabotageTotal = 0;

  // Per-Farbe: Gesamt-Beitrag und Gesamt-Würfelzahl (für Durchschnitt je Würfel).
  const colorContrib = Object.fromEntries(COLORS.map((c) => [c, 0])) as Record<DieColor, number>;
  const colorDice = Object.fromEntries(COLORS.map((c) => [c, 0])) as Record<DieColor, number>;
  const maxColorRound = Object.fromEntries(COLORS.map((c) => [c, 0])) as Record<DieColor, number>;

  const lineup: Difficulty[] = [difficulty, difficulty, difficulty, difficulty];
  for (let i = 0; i < games; i++) {
    const g = playGame(baseSeed + i, lineup);
    allFinals.push(...g.finals);
    winnerScores.push(g.finals[g.winner]);
    totalPity += g.pityCount;
    totalCrownChanges += g.crownChanges;
    let sabInGame = 0;
    for (const round of g.rounds) {
      totalRounds++;
      let sabThisRound = 0;
      for (const r of round) {
        allRoundFinals.push(r.final);
        if (r.final < 0) negativeRounds++;
        for (const c of COLORS) {
          colorContrib[c] += r.contributions[c] ?? 0;
          colorDice[c] += r.colorCounts[c] ?? 0;
          maxColorRound[c] = Math.max(maxColorRound[c], r.contributions[c] ?? 0);
        }
        sabThisRound += r.sabotageReceived;
        sabInGame += r.sabotageThrown;
      }
      if (sabThisRound > 0) {
        sabotageHitRounds++;
        sabotageTotal += sabThisRound;
      }
    }
    if (sabInGame > 0) gamesWithSabotage++;
  }

  console.log(`\n=== Dice Mice Balance-Simulation ===`);
  console.log(`Partien: ${games} · KI: ${difficulty} · 4 Spieler · Seed-Basis: ${baseSeed}\n`);

  console.log(`Endpunkte (alle Spieler): mean ${fmt(mean(allFinals))}  sd ${fmt(stdev(allFinals))}` +
    `  p5 ${fmt(pct(allFinals, 5))}  median ${fmt(pct(allFinals, 50))}  p95 ${fmt(pct(allFinals, 95))}`);
  console.log(`Sieger-Endpunkte:          mean ${fmt(mean(winnerScores))}  sd ${fmt(stdev(winnerScores))}` +
    `  min ${fmt(minOf(winnerScores))}  max ${fmt(maxOf(winnerScores))}`);
  console.log(`Runden-Endpunkte:          mean ${fmt(mean(allRoundFinals))}  sd ${fmt(stdev(allRoundFinals))}` +
    `  min ${fmt(minOf(allRoundFinals))}  max ${fmt(maxOf(allRoundFinals))}`);
  console.log(`Negative Runden:           ${(100 * negativeRounds / allRoundFinals.length).toFixed(1)}%`);
  console.log(`Krone-Wechsel/Partie:      ${(totalCrownChanges / games).toFixed(2)} (von 9 möglichen)`);
  console.log(`Mitleidswürfel/Partie:     ${(totalPity / games).toFixed(2)}`);
  console.log(`Sabotage: Partien mit      ${(100 * gamesWithSabotage / games).toFixed(0)}%` +
    ` · getroffene Runden ${(100 * sabotageHitRounds / totalRounds).toFixed(1)}%` +
    ` · Ø Abzug/Treffer ${(sabotageTotal / Math.max(1, sabotageHitRounds)).toFixed(1)}`);

  console.log(`\nFarb-Beitrag (über alle Runden):`);
  console.log(`  Farbe      Ø/Würfel   Gesamt%   maxRunde   #Würfel`);
  const grandTotal = Object.values(colorContrib).reduce((a, b) => a + b, 0);
  for (const c of COLORS) {
    const perDie = colorDice[c] > 0 ? colorContrib[c] / colorDice[c] : 0;
    const share = grandTotal !== 0 ? (100 * colorContrib[c]) / grandTotal : 0;
    console.log(
      `  ${c.padEnd(9)} ${fmt(perDie)}   ${share.toFixed(1).padStart(6)}%   ${String(maxColorRound[c]).padStart(7)}   ${String(colorDice[c]).padStart(7)}`
    );
  }
  console.log('');
}

run();

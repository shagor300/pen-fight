/**
 * Economy balance simulation. Run: npm run sim:economy
 * Plays many synthetic players through the real EconomyEngine for 30 days and
 * prints the metrics used to tune src/config/economyConfig.ts.
 * Win rates and play habits below are ASSUMPTIONS, not measured player data.
 */
import { EconomyEngine, type StorageAdapter } from '../src/economy/EconomyEngine.ts';
import type { AIDifficultyId, MatchTierId } from '../src/config/economyConfig.ts';

class Mem implements StorageAdapter {
  m = new Map<string, string>();
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
}
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Profile {
  name: string;
  matchesPerDay: number;
  tier: MatchTierId;
  difficulty: AIDifficultyId;
  /** win chance by difficulty */
  win: Record<AIDifficultyId, number>;
  claimsMissions: number; // chance per day
  /** days between tier upgrade attempts (always tries its tier first) */
}

const PROFILES: Profile[] = [
  { name: 'New player', matchesPerDay: 3, tier: 'practice', difficulty: 'easy', win: { easy: 0.6, normal: 0.35, hard: 0.15 }, claimsMissions: 0.5 },
  { name: 'Casual', matchesPerDay: 4, tier: 'bronze', difficulty: 'normal', win: { easy: 0.65, normal: 0.45, hard: 0.2 }, claimsMissions: 0.6 },
  { name: 'Frequent', matchesPerDay: 12, tier: 'silver', difficulty: 'normal', win: { easy: 0.8, normal: 0.6, hard: 0.3 }, claimsMissions: 0.9 },
  { name: 'Skilled (Gold/Hard)', matchesPerDay: 10, tier: 'gold', difficulty: 'hard', win: { easy: 0.95, normal: 0.85, hard: 0.65 }, claimsMissions: 0.9 },
  { name: 'Skilled (Gold/Easy farm)', matchesPerDay: 30, tier: 'gold', difficulty: 'easy', win: { easy: 0.95, normal: 0.85, hard: 0.65 }, claimsMissions: 1 },
  { name: 'Loses a lot', matchesPerDay: 6, tier: 'bronze', difficulty: 'normal', win: { easy: 0.3, normal: 0.15, hard: 0.05 }, claimsMissions: 0.3 },
  { name: 'Broke-prone (Gold, weak)', matchesPerDay: 6, tier: 'gold', difficulty: 'normal', win: { easy: 0.4, normal: 0.25, hard: 0.1 }, claimsMissions: 0.3 },
];

const DAYS = 30;
const PLAYERS = 20;
const DAY = 24 * 60 * 60 * 1000;
const T0 = Date.UTC(2026, 9, 24, 6, 0, 0);

interface Row {
  name: string;
  avgEarnPerMatch: number;
  avgSpendPerMatch: number;
  netPerDay: number;
  finalBalanceMedian: number;
  pctEverZero: number;
  pctStuckDays: number;
  missionClaimRate: number;
  created: number;
  removed: number;
}

function runProfile(p: Profile): Row {
  const finals: number[] = [];
  let everZero = 0;
  let matches = 0;
  let earned = 0;
  let spent = 0;
  let net = 0;
  let missionsOffered = 0;
  let missionsClaimed = 0;
  let created = 0;
  let removed = 0;
  let stuckDays = 0;

  for (let i = 0; i < PLAYERS; i++) {
    const rand = rng(1000 + i * 7919);
    const clock = { t: T0 };
    const eco = new EconomyEngine(new Mem(), { now: () => clock.t });
    const start = eco.getBalance();
    let hitZero = false;
    let n = 0;

    for (let day = 0; day < DAYS; day++) {
      clock.t = T0 + day * DAY;
      for (let k = 0; k < p.matchesPerDay; k++) {
        let tier: MatchTierId = p.tier;
        if (!eco.previewEntry(tier, 'VS_AI', p.difficulty).affordable) tier = 'practice';
        const id = `p${i}d${day}k${k}`;
        const s = eco.startMatch({ matchId: id, mode: 'VS_AI', tier, difficulty: p.difficulty, penId: 'gel-pen' });
        if (!s.ok) continue;
        eco.markMatchStarted(id);
        const win = rand() < p.win[p.difficulty];
        const f = eco.finalizeMatch(id, win ? 'win' : 'loss');
        eco.takePendingPenXp();
        if (f.ok && f.fresh) {
          n++;
          if (f.match.entryFee > 0) {
            const mm = f.match;
            earned += mm.payout + mm.bonusPen;
            spent += mm.entryFee;
            net += mm.netPen + mm.bonusPen;
            created += Math.max(0, mm.payout - mm.entryFee) + mm.bonusPen;
            removed += mm.payout === 0 ? mm.entryFee : 0;
          } else {
            earned += f.match.bonusPen;
            net += f.match.bonusPen;
            created += f.match.bonusPen;
          }
        }
        if (eco.getBalance() === 0) hitZero = true;
      }
      // end of day: missions and refill
      for (const m of eco.getMissions()) {
        if (m.claimable) {
          missionsOffered++;
          if (rand() < p.claimsMissions) {
            const r = eco.claimMission(m.id);
            if (r.ok) {
              missionsClaimed++;
              created += r.rewardPen;
              net += r.rewardPen;
              earned += r.rewardPen;
            }
          }
        }
      }
      if (eco.canClaimAllowance()) {
        const r = eco.claimAllowance();
        if (r.ok) {
          created += r.amount;
          net += r.amount;
          earned += r.amount;
        }
      }
      if (eco.getBalance() < p.tier.length * 0 + 1000 && p.tier !== 'practice') stuckDays++;
    }
    matches += n;
    if (hitZero) everZero++;
    finals.push(eco.getBalance());
    void start;
  }
  finals.sort((a, b) => a - b);
  return {
    name: p.name,
    avgEarnPerMatch: Math.round(earned / Math.max(1, matches)),
    avgSpendPerMatch: Math.round(spent / Math.max(1, matches)),
    netPerDay: Math.round(net / PLAYERS / DAYS),
    finalBalanceMedian: finals[Math.floor(finals.length / 2)],
    pctEverZero: Math.round((everZero / PLAYERS) * 100),
    pctStuckDays: Math.round((stuckDays / (PLAYERS * DAYS)) * 100),
    missionClaimRate: missionsOffered ? Math.round((missionsClaimed / missionsOffered) * 100) : 0,
    created: Math.round(created / PLAYERS),
    removed: Math.round(removed / PLAYERS),
  };
}

const rows = PROFILES.map(runProfile);
const pad = (s: string | number, n: number) => String(s).padEnd(n);
console.log(`Economy simulation: ${PLAYERS} players x ${DAYS} days per profile (assumed win rates)\n`);
console.log(
  pad('Profile', 27) + pad('earn/match', 12) + pad('fee/match', 11) + pad('net/day', 10) + pad('median end', 12) + pad('%hit 0', 8) + pad('%days<1k', 10) + pad('mission%', 10) + pad('created', 10) + 'lost fees',
);
for (const r of rows) {
  console.log(
    pad(r.name, 27) + pad(r.avgEarnPerMatch, 12) + pad(r.avgSpendPerMatch, 11) + pad(r.netPerDay, 10) + pad(r.finalBalanceMedian, 12) + pad(r.pctEverZero, 8) + pad(r.pctStuckDays, 10) + pad(r.missionClaimRate, 10) + pad(r.created, 10) + r.removed,
  );
}

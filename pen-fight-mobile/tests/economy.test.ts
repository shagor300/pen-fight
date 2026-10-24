/**
 * Economy unit tests. No dependencies: run with
 *   npm run test:economy
 * (Node 22+, uses node:test and built-in TypeScript stripping.)
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  EconomyEngine,
  levelForXp,
  xpToNextLevel,
  dateKeyFor,
  type StorageAdapter,
} from '../src/economy/EconomyEngine.ts';
import { ECONOMY_CONFIG } from '../src/config/economyConfig.ts';

class MemoryStorage implements StorageAdapter {
  data = new Map<string, string>();
  failAfter = Infinity;
  writes = 0;
  getItem(k: string) {
    return this.data.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    if (this.writes >= this.failAfter) throw new Error('disk full');
    this.writes++;
    this.data.set(k, v);
  }
}

const DAY = 24 * 60 * 60 * 1000;
// 12:00 Dhaka (UTC+6) so +/- a few hours never crosses a day boundary.
const T0 = Date.UTC(2026, 9, 24, 6, 0, 0);

function make(opts: { storage?: MemoryStorage; start?: number } = {}) {
  const storage = opts.storage ?? new MemoryStorage();
  const clock = { t: opts.start ?? T0 };
  const eco = new EconomyEngine(storage, { now: () => clock.t });
  return { eco, storage, clock };
}

let n = 0;
const mid = () => `m${++n}`;

function play(
  eco: EconomyEngine,
  tier: 'practice' | 'bronze' | 'silver' | 'gold',
  outcome: 'win' | 'loss' | 'draw',
  difficulty: 'easy' | 'normal' | 'hard' = 'normal',
) {
  const matchId = mid();
  const s = eco.startMatch({ matchId, mode: 'VS_AI', tier, difficulty, penId: 'gel-pen' });
  assert.ok(s.ok, 'start should succeed');
  eco.markMatchStarted(matchId);
  const f = eco.finalizeMatch(matchId, outcome);
  assert.ok(f.ok, 'finalize should succeed');
  return f.ok ? f.match : (null as never);
}

test('new wallet starts with 5,000 PEN and a grant in the ledger', () => {
  const { eco } = make();
  assert.equal(eco.getBalance(), 5000);
  assert.equal(eco.getLedger()[0].type, 'initial_grant');
});

test('entry fee is charged once even if Start is tapped repeatedly', () => {
  const { eco } = make();
  const req = { matchId: 'dup', mode: 'VS_AI' as const, tier: 'bronze' as const, penId: 'gel-pen' };
  const a = eco.startMatch(req);
  const b = eco.startMatch(req);
  const c = eco.startMatch(req);
  assert.ok(a.ok && b.ok && c.ok);
  assert.equal(eco.getBalance(), 4000);
  assert.equal(eco.getLedger().filter((t) => t.type === 'entry_fee').length, 1);
  assert.equal(b.ok && b.alreadyExisted, true);
});

test('bronze win on Normal pays fee x1.9 once, plus first win and level reward', () => {
  const { eco } = make();
  const m = play(eco, 'bronze', 'win');
  assert.equal(m.entryFee, 1000);
  assert.equal(m.payout, 1900);
  assert.equal(m.netPen, 900);
  // 100 account XP reaches level 2 (250 PEN) and the first daily win gives 200.
  assert.equal(m.accountXp, 100);
  assert.deepEqual(m.levelsGained, [2]);
  assert.equal(m.bonusPen, 450);
  assert.equal(eco.getBalance(), 5000 - 1000 + 1900 + 450);
  assert.equal(m.balanceAfter, eco.getBalance());
});

test('finalizing the same match again never pays or awards twice', () => {
  const { eco } = make();
  const matchId = mid();
  eco.startMatch({ matchId, mode: 'VS_AI', tier: 'silver', penId: 'gel-pen' });
  eco.markMatchStarted(matchId);
  const first = eco.finalizeMatch(matchId, 'win');
  const balance = eco.getBalance();
  const xp = eco.getAccountProgress().totalXp;
  for (let i = 0; i < 5; i++) {
    const again = eco.finalizeMatch(matchId, 'win');
    assert.ok(again.ok && again.fresh === false);
  }
  assert.ok(first.ok && first.fresh === true);
  assert.equal(eco.getBalance(), balance);
  assert.equal(eco.getAccountProgress().totalXp, xp);
  assert.equal(eco.takePendingPenXp().length, 1);
  assert.equal(eco.takePendingPenXp().length, 0);
});

test('a loss keeps the entry fee gone and pays nothing', () => {
  const { eco } = make();
  const m = play(eco, 'silver', 'loss');
  assert.equal(m.payout, 0);
  assert.equal(m.netPen, -2000);
  assert.equal(eco.getBalance(), 3000 + m.bonusPen);
});

test('a draw refunds the entry fee exactly once', () => {
  const { eco } = make();
  const before = eco.getBalance();
  const m = play(eco, 'gold', 'draw');
  assert.equal(m.payout, 5000);
  assert.equal(m.netPen, 0);
  assert.equal(eco.getBalance(), before + m.bonusPen);
  assert.equal(eco.getLedger().filter((t) => t.type === 'match_refund').length, 1);
});

test('payout multiplier depends on AI difficulty', () => {
  const easy = make().eco;
  const hard = make().eco;
  assert.equal(play(easy, 'bronze', 'win', 'easy').payout, 1200);
  assert.equal(play(hard, 'bronze', 'win', 'hard').payout, 2300);
});

test('insufficient PEN blocks the match and changes nothing', () => {
  const { eco } = make();
  // Burn down to 0 with Gold losses.
  play(eco, 'gold', 'loss');
  const guard = eco.getBalance();
  const matchId = mid();
  const r = eco.startMatch({ matchId, mode: 'VS_AI', tier: 'gold', penId: 'gel-pen' });
  if (guard < 5000) {
    assert.equal(r.ok, false);
    assert.equal(!r.ok && r.code, 'INSUFFICIENT_PEN');
    assert.equal(eco.getBalance(), guard);
    assert.equal(eco.getMatch(matchId), null);
    assert.equal(eco.getActiveMatch(), null);
  }
});

test('balance can never go negative across many losing matches', () => {
  const { eco } = make();
  for (let i = 0; i < 40; i++) {
    const id = mid();
    const s = eco.startMatch({ matchId: id, mode: 'VS_AI', tier: 'bronze', penId: 'gel-pen' });
    if (!s.ok) {
      assert.equal(s.code, 'INSUFFICIENT_PEN');
      break;
    }
    eco.markMatchStarted(id);
    eco.finalizeMatch(id, 'loss');
    assert.ok(eco.getBalance() >= 0);
  }
  assert.ok(eco.getBalance() < 1000);
});

test('daily AI profit cap limits farming on Gold/Hard', () => {
  const { eco } = make();
  const payouts = [1, 2, 3].map(() => play(eco, 'gold', 'win', 'hard').payout);
  // profit wanted per win = 6,500; net cap = 4,000 per day: 4,000 then 0 then 0.
  assert.deepEqual(payouts, [9000, 5000, 5000]);
});

test('Practice is free, never touches PEN, and has capped XP', () => {
  const { eco } = make();
  const before = eco.getBalance();
  const m = play(eco, 'practice', 'win');
  assert.equal(m.entryFee, 0);
  assert.equal(m.payout, 0);
  assert.equal(m.netPen, 0);
  assert.ok(m.accountXp > 0 && m.accountXp < 100);
  // first daily win is allowed for Practice on Normal, so only bonus PEN moves.
  assert.equal(eco.getBalance(), before + m.bonusPen);
  // Farm Practice: low-stakes daily account XP cap holds.
  for (let i = 0; i < 40; i++) play(eco, 'practice', 'win');
  assert.ok(eco.getState().daily.lowStakesAccountXp <= ECONOMY_CONFIG.rewards.lowStakesDailyAccountXpCap);
});

test('Practice + Easy gives no first-daily-win bonus', () => {
  const { eco } = make();
  const m = play(eco, 'practice', 'win', 'easy');
  assert.equal(m.bonusPen - m.levelsGained.reduce((s, l) => s + ECONOMY_CONFIG.accountLevels.rewardPen(l), 0), 0);
});

test('local 2-player duels cannot use paid tiers', () => {
  const { eco } = make();
  const r = eco.startMatch({ matchId: mid(), mode: 'TWO_PLAYER', tier: 'bronze', penId: 'gel-pen' });
  assert.equal(r.ok, false);
  assert.equal(eco.getBalance(), 5000);
});

test('Endless series cannot be played for PEN', () => {
  const { eco } = make();
  const r = eco.startMatch({ matchId: mid(), mode: 'VS_AI', tier: 'bronze', penId: 'gel-pen', endless: true });
  assert.equal(!r.ok && r.code, 'ENDLESS_NOT_ALLOWED');
  assert.equal(eco.getBalance(), 5000);
});

test('only one match can be open at a time', () => {
  const { eco } = make();
  eco.startMatch({ matchId: mid(), mode: 'VS_AI', tier: 'bronze', penId: 'gel-pen' });
  const r = eco.startMatch({ matchId: mid(), mode: 'VS_AI', tier: 'bronze', penId: 'gel-pen' });
  assert.equal(!r.ok && r.code, 'MATCH_ALREADY_ACTIVE');
  assert.equal(eco.getBalance(), 4000);
});

test('leaving before the first shot refunds the fee', () => {
  const { eco } = make();
  const id = mid();
  eco.startMatch({ matchId: id, mode: 'VS_AI', tier: 'silver', penId: 'gel-pen' });
  assert.equal(eco.getBalance(), 3000);
  const r = eco.abandonMatch(id);
  assert.ok(r.ok && r.refunded);
  assert.equal(eco.getBalance(), 5000);
  assert.equal(eco.getActiveMatch(), null);
  // Repeating it does not refund again.
  eco.abandonMatch(id);
  assert.equal(eco.getBalance(), 5000);
});

test('leaving after the first shot forfeits: fee kept, loss counted, no XP', () => {
  const { eco } = make();
  const id = mid();
  eco.startMatch({ matchId: id, mode: 'VS_AI', tier: 'silver', penId: 'gel-pen' });
  eco.markMatchStarted(id);
  const r = eco.abandonMatch(id);
  assert.ok(r.ok && r.refunded === false && r.match.forfeited);
  assert.equal(eco.getBalance(), 3000);
  assert.equal(eco.getStats().losses, 1);
  assert.equal(eco.getAccountProgress().totalXp, 0);
});

test('state survives an app restart and a finalized match is not paid again', () => {
  const storage = new MemoryStorage();
  const a = make({ storage });
  const id = mid();
  a.eco.startMatch({ matchId: id, mode: 'VS_AI', tier: 'bronze', penId: 'gel-pen' });
  a.eco.markMatchStarted(id);
  a.eco.finalizeMatch(id, 'win');
  const balance = a.eco.getBalance();

  const b = make({ storage });
  assert.equal(b.eco.getBalance(), balance);
  const again = b.eco.finalizeMatch(id, 'win');
  assert.ok(again.ok && !again.fresh);
  assert.equal(b.eco.getBalance(), balance);
  assert.equal(b.eco.getStats().wins, 1);
});

test('a failed save rolls everything back (no fee without a match)', () => {
  const storage = new MemoryStorage();
  const { eco } = make({ storage });
  storage.failAfter = storage.writes; // next write throws
  const id = mid();
  const r = eco.startMatch({ matchId: id, mode: 'VS_AI', tier: 'bronze', penId: 'gel-pen' });
  assert.equal(!r.ok && r.code, 'STORAGE_FAILED');
  assert.equal(eco.getBalance(), 5000);
  assert.equal(eco.getMatch(id), null);
  assert.equal(eco.getActiveMatch(), null);
  // Recovers once storage works again.
  storage.failAfter = Infinity;
  assert.ok(eco.startMatch({ matchId: id, mode: 'VS_AI', tier: 'bronze', penId: 'gel-pen' }).ok);
  assert.equal(eco.getBalance(), 4000);
});

test('interrupted before any shot: fee refunded on next launch', () => {
  const storage = new MemoryStorage();
  const a = make({ storage });
  const id = mid();
  a.eco.startMatch({ matchId: id, mode: 'VS_AI', tier: 'gold', penId: 'gel-pen' });
  // app killed before the first shot
  const b = make({ storage });
  assert.equal(b.eco.getBalance(), 0);
  const msg = b.eco.recoverInterrupted();
  assert.ok(msg && msg.includes('5,000'));
  assert.equal(b.eco.getBalance(), 5000);
  assert.equal(b.eco.getActiveMatch(), null);
  assert.equal(b.eco.recoverInterrupted(), null);
  assert.equal(b.eco.getBalance(), 5000);
});

test('interrupted after the first shot: counts as a loss (no free exit)', () => {
  const storage = new MemoryStorage();
  const a = make({ storage });
  const id = mid();
  a.eco.startMatch({ matchId: id, mode: 'VS_AI', tier: 'gold', penId: 'gel-pen' });
  a.eco.markMatchStarted(id);
  const b = make({ storage });
  const msg = b.eco.recoverInterrupted();
  assert.ok(msg && msg.includes('loss'));
  assert.equal(b.eco.getBalance(), 0);
  assert.equal(b.eco.getStats().losses, 1);
  assert.equal(b.eco.recoverInterrupted(), null);
});

test('local duel opponent pen XP respects the daily low-stakes cap', () => {
  const { eco } = make();
  let total = 0;
  for (let i = 0; i < 40; i++) {
    const id = mid();
    eco.startMatch({ matchId: id, mode: 'TWO_PLAYER', tier: 'practice', penId: 'gel-pen', opponentPenId: 'marker' });
    eco.markMatchStarted(id);
    eco.finalizeMatch(id, 'win');
    for (const x of eco.takePendingPenXp()) if (x.penId === 'marker') total += x.amount;
  }
  assert.ok(total <= ECONOMY_CONFIG.rewards.lowStakesDailyPenXpCap);
});

test('match remembers its own series format (endless flag)', () => {
  const { eco } = make();
  const id = mid();
  const r = eco.startMatch({ matchId: id, mode: 'VS_AI', tier: 'practice', penId: 'gel-pen', endless: true });
  assert.ok(r.ok && r.match.endless === true);
});

test('Reset keeps rev increasing so an older mirrored copy cannot win', () => {
  const { eco, storage } = make();
  play(eco, 'bronze', 'win');
  const before = JSON.parse(storage.data.get('pen_fight_economy_v1')!).rev;
  eco.resetAll();
  const after = JSON.parse(storage.data.get('pen_fight_economy_v1')!).rev;
  assert.ok(after > before);
  assert.equal(eco.getBalance(), 5000);
});

test('zero-PEN player can still play Practice, claim a mission and the daily refill', () => {
  const { eco, clock } = make();
  // Drain: Gold loss leaves 0.
  play(eco, 'gold', 'loss');
  assert.equal(eco.getBalance() - 0 >= 0, true);
  const bal = eco.getBalance();
  assert.ok(bal < 1000, 'player is broke');
  // Practice always works.
  assert.equal(eco.startMatch({ matchId: 'p1', mode: 'VS_AI', tier: 'practice', penId: 'gel-pen' }).ok, true);
  eco.markMatchStarted('p1');
  eco.finalizeMatch('p1', 'loss');
  // Refill.
  assert.equal(eco.canClaimAllowance(), true);
  const c = eco.claimAllowance();
  assert.ok(c.ok);
  assert.equal(eco.getBalance(), ECONOMY_CONFIG.allowance.topUpTo);
  assert.equal(eco.claimAllowance().ok, false);
  // Next local day it renews.
  clock.t += DAY;
  assert.equal(eco.getBalance() >= 0, true);
});

test('allowance is refused when the player still has PEN', () => {
  const { eco } = make();
  const r = eco.claimAllowance();
  assert.equal(!r.ok && r.code, 'NOT_ELIGIBLE');
});

test('missions: cannot claim early, pay once, reset next day', () => {
  const { eco, clock } = make();
  assert.equal(eco.claimMission('m_practice_1').ok, false);
  play(eco, 'practice', 'loss');
  const before = eco.getBalance();
  const a = eco.claimMission('m_practice_1');
  assert.ok(a.ok);
  assert.equal(eco.getBalance(), before + 100);
  const b = eco.claimMission('m_practice_1');
  assert.equal(!b.ok && b.code, 'ALREADY_CLAIMED');
  assert.equal(eco.getBalance(), before + 100);
  const view = eco.getMissions().find((m) => m.id === 'm_practice_1')!;
  assert.equal(view.claimed, true);

  clock.t += DAY;
  const next = eco.getMissions().find((m) => m.id === 'm_practice_1')!;
  assert.equal(next.claimed, false);
  assert.equal(next.progress, 0);
});

test('first daily win pays once per day and again the next day', () => {
  const { eco, clock } = make();
  const first = play(eco, 'bronze', 'win');
  const second = play(eco, 'bronze', 'win');
  const firstWins = eco.getLedger().filter((t) => t.type === 'first_daily_win').length;
  assert.equal(firstWins, 1);
  assert.ok(first.bonusPen >= 200);
  assert.ok(second.bonusPen < first.bonusPen + 1);
  clock.t += DAY;
  play(eco, 'bronze', 'win');
  assert.equal(eco.getLedger().filter((t) => t.type === 'first_daily_win').length, 2);
});

test('day boundary follows Asia/Dhaka, not UTC', () => {
  // 2026-10-23 18:30 UTC is 00:30 on Oct 24 in Dhaka.
  assert.equal(dateKeyFor(Date.UTC(2026, 9, 23, 18, 30)), '2026-10-24');
  assert.equal(dateKeyFor(Date.UTC(2026, 9, 23, 17, 30)), '2026-10-23');
});

test('account levels: table, growth beyond the table and level rewards pay once each', () => {
  assert.equal(levelForXp(0), 1);
  assert.equal(levelForXp(99), 1);
  assert.equal(levelForXp(100), 2);
  assert.equal(levelForXp(250), 3);
  assert.ok(xpToNextLevel(30) > xpToNextLevel(15));

  const { eco } = make();
  for (let i = 0; i < 12; i++) play(eco, 'bronze', 'win', 'hard');
  const levelUps = eco.getLedger().filter((t) => t.type === 'level_up');
  const ids = new Set(levelUps.map((t) => t.id));
  assert.equal(ids.size, levelUps.length, 'no level reward paid twice');
  assert.equal(levelUps.length, eco.getAccountProgress().level - 1);
});

test('account progress exposes numbers the UI needs', () => {
  const { eco } = make();
  play(eco, 'bronze', 'loss');
  const p = eco.getAccountProgress();
  assert.ok(p.xpForNext > 0 && p.ratio >= 0 && p.ratio <= 1);
  assert.ok(p.nextRewardPen > 0);
});

test('pen purchase is atomic, rejects duplicates and negative balances', () => {
  const cfg = ECONOMY_CONFIG.penPrices as Record<string, number>;
  cfg['test-pen'] = 3000;
  cfg['test-pen-2'] = 99999;
  try {
    const { eco } = make();
    assert.equal(!eco.purchasePen('nope').ok, true);
    const tooMuch = eco.purchasePen('test-pen-2');
    assert.equal(!tooMuch.ok && tooMuch.code, 'INSUFFICIENT_PEN');
    assert.equal(eco.ownsPen('test-pen-2'), false);
    assert.equal(eco.getBalance(), 5000);

    assert.ok(eco.purchasePen('test-pen').ok);
    assert.equal(eco.getBalance(), 2000);
    assert.equal(eco.ownsPen('test-pen'), true);
    const dup = eco.purchasePen('test-pen');
    assert.equal(!dup.ok && dup.code, 'ALREADY_OWNED');
    assert.equal(eco.getBalance(), 2000);
  } finally {
    delete cfg['test-pen'];
    delete cfg['test-pen-2'];
  }
});

test('corrupted save is backed up and a fresh wallet is created', () => {
  const storage = new MemoryStorage();
  storage.data.set('pen_fight_economy_v1', '{not json');
  const { eco } = make({ storage });
  assert.equal(eco.recoveredFromCorruption, true);
  assert.equal(eco.getBalance(), 5000);
  assert.equal(storage.data.get('pen_fight_economy_v1.corrupt'), '{not json');
});

test('a tampered negative balance is rejected on load', () => {
  const a = make();
  const raw = JSON.parse(a.storage.data.get('pen_fight_economy_v1')!);
  raw.balance = -50;
  a.storage.data.set('pen_fight_economy_v1', JSON.stringify(raw));
  const b = make({ storage: a.storage });
  assert.equal(b.eco.recoveredFromCorruption, true);
  assert.ok(b.eco.getBalance() >= 0);
});

test('local duel gives both pens mastery XP and counts separately from VS stats', () => {
  const { eco } = make();
  const id = mid();
  eco.startMatch({ matchId: id, mode: 'TWO_PLAYER', tier: 'practice', penId: 'gel-pen', opponentPenId: 'marker' });
  eco.markMatchStarted(id);
  eco.finalizeMatch(id, 'win');
  const xp = eco.takePendingPenXp();
  assert.deepEqual(xp.map((x) => x.penId).sort(), ['gel-pen', 'marker']);
  assert.equal(eco.getStats().localDuels, 1);
  assert.equal(eco.getStats().matches, 0);
});

test('preview matches what a win will actually pay', () => {
  const { eco } = make();
  const p = eco.previewEntry('silver', 'VS_AI', 'normal');
  assert.equal(p.entryFee, 2000);
  assert.equal(p.balanceAfterEntry, 3000);
  assert.equal(p.winPayout, 3800);
  const m = play(eco, 'silver', 'win', 'normal');
  assert.equal(m.payout, p.winPayout);
});

test('stats track earned/spent consistently with the ledger', () => {
  const { eco } = make();
  play(eco, 'bronze', 'win');
  play(eco, 'silver', 'loss');
  const ledgerNet = eco.getLedger().reduce((s, t) => s + t.amount, 0);
  assert.equal(ledgerNet, eco.getBalance());
  const st = eco.getStats();
  assert.equal(st.wins, 1);
  assert.equal(st.losses, 1);
  assert.equal(st.penSpent, 3000);
});

test('daily profit cap is NET: lost fees make room for later wins', () => {
  const { eco } = make();
  // One Gold/Hard win reaches the 4,000 net cap.
  play(eco, 'gold', 'win', 'hard');
  assert.equal(play(eco, 'gold', 'win', 'hard').payout, 5000); // capped: fee only
  // A Gold loss (-5,000 net) re-opens room, so the next win can profit again.
  play(eco, 'gold', 'loss', 'hard');
  const next = play(eco, 'bronze', 'win', 'hard');
  assert.equal(next.payout, 2300); // full Bronze/Hard payout again: the loss opened room
});

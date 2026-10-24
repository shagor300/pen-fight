/**
 * src/economy/EconomyEngine.ts
 * Pure (no PixiJS / Capacitor) PEN economy: wallet, ledger, match entry and
 * payout, account XP, daily missions, allowance and pen ownership.
 *
 * Integrity rules:
 *  - Every mutation runs on a cloned draft and is committed (and persisted)
 *    in one step. If anything throws, nothing changes.
 *  - Every credit/debit has a unique transaction id. Re-applying the same id
 *    is a no-op, so repeated taps, reopened screens, restarts and duplicate
 *    events can never pay or charge twice.
 *  - Balance can never go negative.
 *
 * Limits: this is local-only. Anyone who can edit device storage can edit the
 * balance. It is not cheat-proof and must not back anything with real value.
 */
import {
  ECONOMY_CONFIG,
  type AIDifficultyId,
  type MatchTierId,
} from '../config/economyConfig.ts';

// ─── Types ────────────────────────────────────────────────────────────────

export type GameModeId = 'VS_AI' | 'TWO_PLAYER';
export type MatchOutcome = 'win' | 'loss' | 'draw';
export type MatchStatus = 'pending' | 'in_progress' | 'finalized' | 'cancelled';

export type TxType =
  | 'initial_grant'
  | 'entry_fee'
  | 'match_payout'
  | 'match_refund'
  | 'first_daily_win'
  | 'mission'
  | 'level_up'
  | 'allowance'
  | 'purchase';

export interface Transaction {
  id: string;
  type: TxType;
  /** Positive = credit, negative = debit. */
  amount: number;
  reason: string;
  refId: string;
  balanceAfter: number;
  ts: number;
  status: 'confirmed';
}

export interface MatchRecord {
  matchId: string;
  mode: GameModeId;
  tier: MatchTierId;
  difficulty: AIDifficultyId;
  penId: string;
  opponentPenId: string | null;
  /** Series format fixed when the match starts (Endless = no winner). */
  endless: boolean;
  entryFee: number;
  status: MatchStatus;
  outcome: MatchOutcome | 'cancelled' | null;
  forfeited: boolean;
  /** Total PEN returned for this match (winner payout incl. fee, or refund). */
  payout: number;
  /** payout - entryFee. Negative on a loss. */
  netPen: number;
  /** First-daily-win and level-up PEN earned because of this match. */
  bonusPen: number;
  accountXp: number;
  penXp: number;
  levelsGained: number[];
  balanceAfter: number | null;
  configVersion: number;
  createdAt: number;
  finalizedAt: number | null;
}

export interface DailyState {
  dateKey: string;
  firstWinClaimed: boolean;
  aiProfitUsed: number;
  lowStakesAccountXp: number;
  lowStakesPenXp: Record<string, number>;
  tally: {
    matches_played: number;
    matches_won: number;
    paid_matches_won: number;
    practice_played: number;
  };
  missionsClaimed: string[];
  allowanceClaimed: boolean;
}

export interface EconomyStats {
  matches: number;
  wins: number;
  losses: number;
  draws: number;
  localDuels: number;
  penEarned: number;
  penSpent: number;
  currentStreak: number;
  bestStreak: number;
  penUsage: Record<string, number>;
}

export interface EconomyState {
  schema: 1;
  /** Increments on every commit. Used to pick the newest of two stores. */
  rev: number;
  configVersion: number;
  playerId: string;
  balance: number;
  accountXp: number;
  accountLevel: number;
  levelRewardedUpTo: number;
  ownedPens: string[];
  ledger: Transaction[];
  processed: string[];
  matches: Record<string, MatchRecord>;
  matchOrder: string[];
  activeMatchId: string | null;
  /** Mastery XP waiting to be applied to ProgressionManager exactly once. */
  pendingPenXp: { matchId: string; penId: string; amount: number }[];
  daily: DailyState;
  stats: EconomyStats;
}

export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export type EconomyErrorCode =
  | 'INSUFFICIENT_PEN'
  | 'MATCH_ALREADY_ACTIVE'
  | 'INVALID_TIER_FOR_MODE'
  | 'ENDLESS_NOT_ALLOWED'
  | 'UNKNOWN_MATCH'
  | 'UNKNOWN_MISSION'
  | 'UNKNOWN_PEN'
  | 'ALREADY_OWNED'
  | 'ALREADY_CLAIMED'
  | 'NOT_COMPLETE'
  | 'NOT_ELIGIBLE'
  | 'STORAGE_FAILED';

export class EconomyError extends Error {
  code: EconomyErrorCode;
  detail?: Record<string, number | string>;
  constructor(code: EconomyErrorCode, message: string, detail?: Record<string, number | string>) {
    super(message);
    this.code = code;
    this.detail = detail;
  }
}

export type Result<T> =
  | ({ ok: true } & T)
  | { ok: false; code: EconomyErrorCode; message: string; detail?: Record<string, number | string> };

export interface StartMatchRequest {
  matchId: string;
  mode: GameModeId;
  tier: MatchTierId;
  difficulty?: AIDifficultyId;
  penId: string;
  opponentPenId?: string | null;
  /** True when the series has no end (Endless). Paid tiers refuse it. */
  endless?: boolean;
}

export interface MissionView {
  id: string;
  title: string;
  target: number;
  rewardPen: number;
  progress: number;
  claimed: boolean;
  claimable: boolean;
}

export interface AccountProgress {
  level: number;
  totalXp: number;
  xpIntoLevel: number;
  xpForNext: number;
  ratio: number;
  nextRewardPen: number;
  maxed: boolean;
}

// ─── Pure helpers ─────────────────────────────────────────────────────────

const CFG = ECONOMY_CONFIG;

/** XP needed to go from `level` to `level + 1`. */
export function xpToNextLevel(level: number): number {
  const table = CFG.accountLevels.xpToNext;
  const idx = level - 1;
  if (idx < table.length) return table[idx];
  return table[table.length - 1] + CFG.accountLevels.growthAfterTable * (idx - table.length + 1);
}

/** Level reached with `totalXp` cumulative account XP. */
export function levelForXp(totalXp: number): number {
  let level = 1;
  let remaining = totalXp;
  while (level < CFG.accountLevels.maxLevel) {
    const need = xpToNextLevel(level);
    if (remaining < need) break;
    remaining -= need;
    level++;
  }
  return level;
}

export function dateKeyFor(ts: number, timeZone: string = CFG.timezone): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(ts));
}

function freshDaily(dateKey: string): DailyState {
  return {
    dateKey,
    firstWinClaimed: false,
    aiProfitUsed: 0,
    lowStakesAccountXp: 0,
    lowStakesPenXp: {},
    tally: { matches_played: 0, matches_won: 0, paid_matches_won: 0, practice_played: 0 },
    missionsClaimed: [],
    allowanceClaimed: false,
  };
}

function freshStats(): EconomyStats {
  return {
    matches: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    localDuels: 0,
    penEarned: 0,
    penSpent: 0,
    currentStreak: 0,
    bestStreak: 0,
    penUsage: {},
  };
}

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

function randomId(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  return 'p_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

// ─── Engine ───────────────────────────────────────────────────────────────

export const ECONOMY_STORAGE_KEY = 'pen_fight_economy_v1';

export interface EconomyEngineOptions {
  now?: () => number;
  storageKey?: string;
}

export class EconomyEngine {
  private state: EconomyState;
  private storage: StorageAdapter;
  private now: () => number;
  private key: string;
  private listeners = new Set<() => void>();
  /** True when saved data was unreadable and a new wallet had to be created. */
  public recoveredFromCorruption = false;

  constructor(storage: StorageAdapter, opts: EconomyEngineOptions = {}) {
    this.storage = storage;
    this.now = opts.now ?? (() => Date.now());
    this.key = opts.storageKey ?? ECONOMY_STORAGE_KEY;
    this.state = this.loadOrCreate();
  }

  // ── Persistence ─────────────────────────────────────────────────────

  private loadOrCreate(): EconomyState {
    let raw: string | null = null;
    try {
      raw = this.storage.getItem(this.key);
    } catch {
      raw = null;
    }
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as EconomyState;
        if (parsed && parsed.schema === 1 && typeof parsed.balance === 'number' && parsed.balance >= 0) {
          return this.normalize(parsed);
        }
      } catch {
        /* fall through to recovery */
      }
      // Keep the unreadable blob for manual recovery, then start fresh.
      try {
        this.storage.setItem(this.key + '.corrupt', raw);
      } catch {
        /* ignore */
      }
      this.recoveredFromCorruption = true;
    }
    return this.createInitial();
  }

  /** Fill fields added by later versions so old saves keep working. */
  private normalize(s: EconomyState): EconomyState {
    const base = this.createInitial(false);
    return {
      ...base,
      ...s,
      stats: { ...base.stats, ...s.stats },
      daily: { ...base.daily, ...s.daily, tally: { ...base.daily.tally, ...(s.daily?.tally ?? {}) } },
    };
  }

  private createInitial(persist = true): EconomyState {
    const ts = this.now();
    const owned = Object.entries(CFG.penPrices)
      .filter(([, price]) => price === 0)
      .map(([id]) => id);
    const s: EconomyState = {
      schema: 1,
      rev: 0,
      configVersion: CFG.version,
      playerId: randomId(),
      balance: CFG.currency.initialBalance,
      accountXp: 0,
      accountLevel: 1,
      levelRewardedUpTo: 1,
      ownedPens: owned,
      ledger: [
        {
          id: 'initial:grant',
          type: 'initial_grant',
          amount: CFG.currency.initialBalance,
          reason: 'Welcome grant',
          refId: 'initial',
          balanceAfter: CFG.currency.initialBalance,
          ts,
          status: 'confirmed',
        },
      ],
      processed: ['initial:grant'],
      matches: {},
      matchOrder: [],
      activeMatchId: null,
      pendingPenXp: [],
      daily: freshDaily(dateKeyFor(ts)),
      stats: freshStats(),
    };
    if (persist) {
      try {
        this.storage.setItem(this.key, JSON.stringify(s));
      } catch {
        /* first commit will retry */
      }
    }
    return s;
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify(): void {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch {
        /* listener errors must not break the economy */
      }
    });
  }

  /**
   * Run `mutator` on a draft. Commit only if it returns without throwing and
   * the draft was persisted. Otherwise the live state is untouched.
   */
  private run<T extends object>(mutator: (d: EconomyState) => T, touchOnly = false): Result<T> {
    const draft = clone(this.state);
    try {
      this.rollDay(draft);
      const out = mutator(draft);
      draft.rev = this.state.rev + 1;
      try {
        this.storage.setItem(this.key, JSON.stringify(draft));
      } catch {
        throw new EconomyError('STORAGE_FAILED', 'Could not save. Nothing was changed.');
      }
      this.state = draft;
      if (!touchOnly) this.notify();
      return { ok: true, ...out };
    } catch (e) {
      if (e instanceof EconomyError) {
        return { ok: false, code: e.code, message: e.message, detail: e.detail };
      }
      throw e;
    }
  }

  private rollDay(d: EconomyState): void {
    const key = dateKeyFor(this.now());
    if (d.daily.dateKey !== key) d.daily = freshDaily(key);
  }

  /** Apply one ledger entry. Returns false if this id was already applied. */
  private applyTx(
    d: EconomyState,
    tx: { id: string; type: TxType; amount: number; reason: string; refId: string },
  ): boolean {
    if (d.processed.includes(tx.id)) return false;
    if (!Number.isInteger(tx.amount)) throw new Error('PEN amounts must be whole numbers');
    const next = d.balance + tx.amount;
    if (next < 0) {
      throw new EconomyError('INSUFFICIENT_PEN', 'Not enough PEN.', {
        needed: -tx.amount,
        balance: d.balance,
      });
    }
    d.balance = next;
    d.ledger.push({ ...tx, balanceAfter: next, ts: this.now(), status: 'confirmed' });
    d.processed.push(tx.id);
    if (d.ledger.length > CFG.limits.maxHistoryRows) {
      d.ledger.splice(0, d.ledger.length - CFG.limits.maxHistoryRows);
    }
    if (d.processed.length > CFG.limits.maxProcessedEventIds) {
      d.processed.splice(0, d.processed.length - CFG.limits.maxProcessedEventIds);
    }
    if (tx.type === 'entry_fee' || tx.type === 'purchase') d.stats.penSpent += -tx.amount;
    else if (tx.type === 'match_refund') d.stats.penSpent = Math.max(0, d.stats.penSpent - tx.amount);
    else if (tx.type !== 'initial_grant') d.stats.penEarned += tx.amount;
    return true;
  }

  // ── Read API ────────────────────────────────────────────────────────

  getBalance(): number {
    return this.state.balance;
  }
  getPlayerId(): string {
    return this.state.playerId;
  }
  getState(): Readonly<EconomyState> {
    return this.state;
  }
  getStats(): Readonly<EconomyStats> {
    return this.state.stats;
  }
  getLedger(): readonly Transaction[] {
    return this.state.ledger;
  }
  getMatch(matchId: string): MatchRecord | null {
    return this.state.matches[matchId] ?? null;
  }
  getActiveMatch(): MatchRecord | null {
    const id = this.state.activeMatchId;
    return id ? this.state.matches[id] ?? null : null;
  }
  getRecentMatches(limit = 20): MatchRecord[] {
    return this.state.matchOrder
      .slice(-limit)
      .reverse()
      .map((id) => this.state.matches[id])
      .filter((m): m is MatchRecord => !!m && m.status === 'finalized');
  }
  ownsPen(penId: string): boolean {
    return this.state.ownedPens.includes(penId);
  }
  getFavoritePenId(): string | null {
    let best: string | null = null;
    let n = 0;
    for (const [id, c] of Object.entries(this.state.stats.penUsage)) {
      if (c > n) {
        best = id;
        n = c;
      }
    }
    return best;
  }

  /** Daily counters as they read right now (rolled over if the day changed). */
  private todayDaily(): DailyState {
    const key = dateKeyFor(this.now());
    return this.state.daily.dateKey === key ? this.state.daily : freshDaily(key);
  }

  getAccountProgress(): AccountProgress {
    const s = this.state;
    const level = s.accountLevel;
    const maxed = level >= CFG.accountLevels.maxLevel;
    let spent = 0;
    for (let l = 1; l < level; l++) spent += xpToNextLevel(l);
    const xpIntoLevel = maxed ? 0 : s.accountXp - spent;
    const xpForNext = maxed ? 0 : xpToNextLevel(level);
    return {
      level,
      totalXp: s.accountXp,
      xpIntoLevel,
      xpForNext,
      ratio: maxed || xpForNext === 0 ? 1 : Math.min(1, xpIntoLevel / xpForNext),
      nextRewardPen: maxed ? 0 : CFG.accountLevels.rewardPen(level + 1),
      maxed,
    };
  }

  getMissions(): MissionView[] {
    const daily = this.todayDaily();
    return CFG.missions.map((m) => {
      const progress = Math.min(m.target, daily.tally[m.metric]);
      const claimed = daily.missionsClaimed.includes(m.id);
      return {
        id: m.id,
        title: m.title,
        target: m.target,
        rewardPen: m.rewardPen,
        progress,
        claimed,
        claimable: !claimed && progress >= m.target,
      };
    });
  }

  canClaimAllowance(): boolean {
    return this.state.balance < CFG.allowance.belowBalance && !this.todayDaily().allowanceClaimed;
  }

  /** Preview the exact numbers shown on the confirm dialog. */
  previewEntry(tier: MatchTierId, mode: GameModeId, difficulty: AIDifficultyId = 'normal') {
    const fee = mode === 'TWO_PLAYER' ? 0 : CFG.tiers[tier].entryFee;
    const mult = CFG.aiPayoutMultiplier[difficulty];
    const profit = Math.round(fee * (mult - 1));
    const remaining = Math.max(0, CFG.aiDailyNetProfitCap - this.todayDaily().aiProfitUsed);
    const winPayout = fee > 0 ? fee + Math.min(profit, remaining) : 0;
    return {
      entryFee: fee,
      balance: this.state.balance,
      balanceAfterEntry: this.state.balance - fee,
      winPayout,
      winProfit: winPayout - fee,
      lossMeansLosingFee: fee > 0,
      drawRefunds: fee > 0,
      affordable: this.state.balance >= fee,
      dailyProfitCapReached: fee > 0 && remaining === 0,
    };
  }

  // ── Match lifecycle ─────────────────────────────────────────────────

  /**
   * Charge the entry fee and open a match. Idempotent per matchId: calling it
   * again (double tap, retry) returns the same match and charges nothing.
   */
  startMatch(req: StartMatchRequest): Result<{ match: MatchRecord; alreadyExisted: boolean }> {
    return this.run((d) => {
      const existing = d.matches[req.matchId];
      if (existing) return { match: clone(existing), alreadyExisted: true };

      const active = d.activeMatchId ? d.matches[d.activeMatchId] : null;
      if (active && (active.status === 'pending' || active.status === 'in_progress')) {
        throw new EconomyError('MATCH_ALREADY_ACTIVE', 'Another match is still open.');
      }
      if (req.mode === 'TWO_PLAYER' && req.tier !== 'practice') {
        throw new EconomyError('INVALID_TIER_FOR_MODE', 'Local duels are free and have no PEN stakes.');
      }
      const tierCfg = CFG.tiers[req.tier];
      if (!tierCfg) throw new EconomyError('INVALID_TIER_FOR_MODE', 'Unknown match tier.');
      if (tierCfg.entryFee > 0 && req.endless) {
        throw new EconomyError('ENDLESS_NOT_ALLOWED', 'PEN matches need a 3 or 5 win series.');
      }
      const fee = tierCfg.entryFee;
      if (fee > 0) {
        this.applyTx(d, {
          id: `fee:${req.matchId}`,
          type: 'entry_fee',
          amount: -fee,
          reason: `${tierCfg.label} entry`,
          refId: req.matchId,
        });
      }
      const match: MatchRecord = {
        matchId: req.matchId,
        mode: req.mode,
        tier: req.tier,
        difficulty: req.difficulty ?? 'normal',
        penId: req.penId,
        opponentPenId: req.opponentPenId ?? null,
        endless: !!req.endless,
        entryFee: fee,
        status: 'pending',
        outcome: null,
        forfeited: false,
        payout: 0,
        netPen: 0,
        bonusPen: 0,
        accountXp: 0,
        penXp: 0,
        levelsGained: [],
        balanceAfter: null,
        configVersion: CFG.version,
        createdAt: this.now(),
        finalizedAt: null,
      };
      d.matches[req.matchId] = match;
      d.matchOrder.push(req.matchId);
      d.activeMatchId = req.matchId;
      return { match: clone(match), alreadyExisted: false };
    });
  }

  /** Call on the first shot. From here on, leaving the match forfeits it. */
  markMatchStarted(matchId: string): Result<{ match: MatchRecord }> {
    return this.run((d) => {
      const m = d.matches[matchId];
      if (!m) throw new EconomyError('UNKNOWN_MATCH', 'Match not found.');
      if (m.status === 'pending') m.status = 'in_progress';
      return { match: clone(m) };
    }, true);
  }

  /**
   * Leave a match before it ends. Before the first shot: full refund.
   * After the first shot: counts as a loss and the entry fee is kept.
   */
  abandonMatch(matchId: string): Result<{ match: MatchRecord; refunded: boolean }> {
    const m = this.state.matches[matchId];
    if (m && m.status === 'in_progress') {
      const r = this.finalizeMatch(matchId, 'loss', { forfeit: true });
      return r.ok ? { ok: true, match: r.match, refunded: false } : r;
    }
    return this.run((d) => {
      const dm = d.matches[matchId];
      if (!dm) throw new EconomyError('UNKNOWN_MATCH', 'Match not found.');
      if (dm.status === 'pending') {
        if (dm.entryFee > 0) {
          this.applyTx(d, {
            id: `refund:${matchId}`,
            type: 'match_refund',
            amount: dm.entryFee,
            reason: 'Match cancelled',
            refId: matchId,
          });
        }
        dm.status = 'cancelled';
        dm.outcome = 'cancelled';
        dm.payout = dm.entryFee;
        dm.netPen = 0;
        dm.balanceAfter = d.balance;
        dm.finalizedAt = this.now();
        if (d.activeMatchId === matchId) d.activeMatchId = null;
        return { match: clone(dm), refunded: dm.entryFee > 0 };
      }
      return { match: clone(dm), refunded: false };
    });
  }

  /**
   * Settle a match exactly once. Calling again with the same matchId returns
   * the stored result and awards nothing.
   */
  finalizeMatch(
    matchId: string,
    outcome: MatchOutcome,
    opts: { forfeit?: boolean } = {},
  ): Result<{ match: MatchRecord; fresh: boolean }> {
    return this.run((d) => {
      const m = d.matches[matchId];
      if (!m) throw new EconomyError('UNKNOWN_MATCH', 'Match not found.');
      if (m.status === 'finalized' || m.status === 'cancelled') {
        return { match: clone(m), fresh: false };
      }

      const forfeit = !!opts.forfeit;
      const effective: MatchOutcome = forfeit ? 'loss' : outcome;
      const isAi = m.mode === 'VS_AI';
      const fee = m.entryFee;
      const today = d.daily;

      // 1) Entry-fee payout / refund ---------------------------------
      let payout = 0;
      if (fee > 0 && isAi) {
        if (effective === 'win') {
          const mult = CFG.aiPayoutMultiplier[m.difficulty];
          const wanted = Math.round(fee * (mult - 1));
          const room = Math.max(0, CFG.aiDailyNetProfitCap - today.aiProfitUsed);
          const profit = Math.min(wanted, room);
          today.aiProfitUsed += profit;
          payout = fee + profit;
          this.applyTx(d, {
            id: `payout:${matchId}`,
            type: 'match_payout',
            amount: payout,
            reason: `${CFG.tiers[m.tier].label} win`,
            refId: matchId,
          });
        } else if (effective === 'loss') {
          // Net accounting: a lost fee makes room under the daily profit cap.
          today.aiProfitUsed -= fee;
        } else if (effective === 'draw') {
          payout = fee;
          this.applyTx(d, {
            id: `refund:${matchId}`,
            type: 'match_refund',
            amount: fee,
            reason: 'Draw refund',
            refId: matchId,
          });
        }
      }

      // 2) XP -----------------------------------------------------------
      const isLocalDuel = m.mode === 'TWO_PLAYER';
      const lowStakes = m.tier === 'practice' || isLocalDuel || (isAi && m.difficulty === 'easy');
      const ax = CFG.rewards.accountXp;
      const px = CFG.rewards.penXp;
      let accMult = 1;
      let penMult = 1;
      if (m.tier === 'practice') {
        accMult = Math.min(accMult, ax.practiceMultiplier);
        penMult = Math.min(penMult, px.practiceMultiplier);
      }
      if (isLocalDuel) accMult = Math.min(accMult, ax.localDuelMultiplier);
      if (isAi && m.difficulty === 'easy') {
        accMult = Math.min(accMult, ax.easyMultiplier);
        penMult = Math.min(penMult, px.easyMultiplier);
      }
      let accountXp = 0;
      let penXp = 0;
      if (!forfeit) {
        // In a local duel "win" is ambiguous, so there is no win bonus.
        const winBonus = effective === 'win' && !isLocalDuel ? ax.winBonus : 0;
        accountXp = Math.round((ax.completion + winBonus) * accMult);
        penXp = Math.round((effective === 'win' ? px.win : effective === 'draw' ? px.draw : px.loss) * penMult);
        if (lowStakes) {
          const room = Math.max(0, CFG.rewards.lowStakesDailyAccountXpCap - today.lowStakesAccountXp);
          accountXp = Math.min(accountXp, room);
          today.lowStakesAccountXp += accountXp;
          const used = today.lowStakesPenXp[m.penId] ?? 0;
          const penRoom = Math.max(0, CFG.rewards.lowStakesDailyPenXpCap - used);
          penXp = Math.min(penXp, penRoom);
          today.lowStakesPenXp[m.penId] = used + penXp;
        }
      }

      // 3) Account level-ups (each level pays once) ----------------------
      const levelsGained: number[] = [];
      let bonusPen = 0;
      if (accountXp > 0) {
        d.accountXp += accountXp;
        const newLevel = levelForXp(d.accountXp);
        for (let l = d.levelRewardedUpTo + 1; l <= newLevel; l++) {
          const reward = CFG.accountLevels.rewardPen(l);
          if (this.applyTx(d, {
            id: `levelup:${l}`,
            type: 'level_up',
            amount: reward,
            reason: `Reached level ${l}`,
            refId: `level:${l}`,
          })) {
            bonusPen += reward;
          }
          levelsGained.push(l);
        }
        d.accountLevel = Math.max(d.accountLevel, newLevel);
        d.levelRewardedUpTo = Math.max(d.levelRewardedUpTo, newLevel);
      }

      // 4) First daily win ------------------------------------------------
      const eligibleFirstWin =
        effective === 'win' && isAi && !forfeit && !(m.tier === 'practice' && m.difficulty === 'easy');
      if (eligibleFirstWin && !today.firstWinClaimed) {
        const amt = CFG.rewards.firstDailyWinPen;
        if (this.applyTx(d, {
          id: `firstwin:${today.dateKey}`,
          type: 'first_daily_win',
          amount: amt,
          reason: 'First win of the day',
          refId: matchId,
        })) {
          bonusPen += amt;
        }
        today.firstWinClaimed = true;
      }

      // 5) Mission tallies --------------------------------------------------
      if (!forfeit) {
        today.tally.matches_played++;
        if (effective === 'win' && isAi) {
          today.tally.matches_won++;
          if (m.tier !== 'practice') today.tally.paid_matches_won++;
        }
        if (m.tier === 'practice') today.tally.practice_played++;
      }

      // 6) Lifetime stats ----------------------------------------------------
      const st = d.stats;
      st.penUsage[m.penId] = (st.penUsage[m.penId] ?? 0) + 1;
      if (isLocalDuel) {
        st.localDuels++;
      } else {
        st.matches++;
        if (effective === 'win') {
          st.wins++;
          st.currentStreak++;
          st.bestStreak = Math.max(st.bestStreak, st.currentStreak);
        } else if (effective === 'draw') {
          st.draws++;
        } else {
          st.losses++;
          st.currentStreak = 0;
        }
      }

      // 7) Pen mastery XP, applied to ProgressionManager exactly once ----------
      if (penXp > 0) d.pendingPenXp.push({ matchId, penId: m.penId, amount: penXp });
      if (isLocalDuel && m.opponentPenId && !forfeit) {
        let oppXp = Math.round(px.loss * penMult);
        // Same daily low-stakes cap as the first pen (local duels are always low stakes).
        const oppUsed = today.lowStakesPenXp[m.opponentPenId] ?? 0;
        oppXp = Math.min(oppXp, Math.max(0, CFG.rewards.lowStakesDailyPenXpCap - oppUsed));
        today.lowStakesPenXp[m.opponentPenId] = oppUsed + oppXp;
        if (oppXp > 0) d.pendingPenXp.push({ matchId: matchId + ':opp', penId: m.opponentPenId, amount: oppXp });
      }

      // 8) Seal the record -------------------------------------------------------
      m.status = 'finalized';
      m.outcome = effective;
      m.forfeited = forfeit;
      m.payout = payout;
      m.netPen = payout - fee;
      m.bonusPen = bonusPen;
      m.accountXp = accountXp;
      m.penXp = penXp;
      m.levelsGained = levelsGained;
      m.balanceAfter = d.balance;
      m.finalizedAt = this.now();
      if (d.activeMatchId === matchId) d.activeMatchId = null;

      // Keep the match map small.
      while (d.matchOrder.length > 40) {
        const old = d.matchOrder.shift()!;
        if (old !== d.activeMatchId) delete d.matches[old];
      }
      return { match: clone(m), fresh: true };
    });
  }

  /** Take (and clear) mastery XP that still has to be applied to pens. */
  takePendingPenXp(): { matchId: string; penId: string; amount: number }[] {
    if (this.state.pendingPenXp.length === 0) return [];
    let taken: { matchId: string; penId: string; amount: number }[] = [];
    const r = this.run((d) => {
      taken = d.pendingPenXp;
      d.pendingPenXp = [];
      return {};
    }, true);
    return r.ok ? taken : [];
  }

  /**
   * Call once at boot. Settles a match that was open when the app died.
   * Returns a short description for a toast, or null.
   */
  recoverInterrupted(): string | null {
    const m = this.getActiveMatch();
    if (!m) return null;
    if (m.status === 'in_progress' && CFG.interruptedInProgressPolicy === 'forfeit') {
      this.finalizeMatch(m.matchId, 'loss', { forfeit: true });
      return 'Last match was interrupted and counted as a loss.';
    }
    // Refund path for 'pending' and, by policy, 'in_progress'.
    const r = this.run((d) => {
      const dm = d.matches[m.matchId];
      if (dm && (dm.status === 'pending' || dm.status === 'in_progress')) {
        if (dm.entryFee > 0) {
          this.applyTx(d, {
            id: `refund:${dm.matchId}`,
            type: 'match_refund',
            amount: dm.entryFee,
            reason: 'Interrupted match refund',
            refId: dm.matchId,
          });
        }
        dm.status = 'cancelled';
        dm.outcome = 'cancelled';
        dm.payout = dm.entryFee;
        dm.netPen = 0;
        dm.balanceAfter = d.balance;
        dm.finalizedAt = this.now();
      }
      d.activeMatchId = null;
      return { refunded: m.entryFee };
    });
    if (r.ok && r.refunded > 0) return `Last match was interrupted. ${r.refunded.toLocaleString('en-US')} PEN refunded.`;
    return null;
  }

  // ── Missions, allowance, purchases ───────────────────────────────

  claimMission(missionId: string): Result<{ rewardPen: number; balance: number }> {
    return this.run((d) => {
      const mc = CFG.missions.find((m) => m.id === missionId);
      if (!mc) throw new EconomyError('UNKNOWN_MISSION', 'Mission not found.');
      if (d.daily.missionsClaimed.includes(missionId)) {
        throw new EconomyError('ALREADY_CLAIMED', 'Already claimed today.');
      }
      if (d.daily.tally[mc.metric] < mc.target) {
        throw new EconomyError('NOT_COMPLETE', 'Mission is not complete yet.');
      }
      this.applyTx(d, {
        id: `mission:${d.daily.dateKey}:${missionId}`,
        type: 'mission',
        amount: mc.rewardPen,
        reason: mc.title,
        refId: missionId,
      });
      d.daily.missionsClaimed.push(missionId);
      return { rewardPen: mc.rewardPen, balance: d.balance };
    });
  }

  /** Free daily top-up so a player at (or near) zero is never stuck. */
  claimAllowance(): Result<{ amount: number; balance: number }> {
    return this.run((d) => {
      if (d.daily.allowanceClaimed) throw new EconomyError('ALREADY_CLAIMED', 'Already claimed today.');
      if (d.balance >= CFG.allowance.belowBalance) {
        throw new EconomyError('NOT_ELIGIBLE', 'You still have enough PEN.');
      }
      const amount = CFG.allowance.topUpTo - d.balance;
      this.applyTx(d, {
        id: `allowance:${d.daily.dateKey}`,
        type: 'allowance',
        amount,
        reason: 'Daily PEN refill',
        refId: d.daily.dateKey,
      });
      d.daily.allowanceClaimed = true;
      return { amount, balance: d.balance };
    });
  }

  /** Atomic: deduct price and grant ownership together, or do neither. */
  purchasePen(penId: string): Result<{ balance: number }> {
    return this.run((d) => {
      const price = CFG.penPrices[penId];
      if (price === undefined) throw new EconomyError('UNKNOWN_PEN', 'Unknown pen.');
      if (d.ownedPens.includes(penId)) throw new EconomyError('ALREADY_OWNED', 'You already own this pen.');
      if (price > 0) {
        this.applyTx(d, {
          id: `purchase:${penId}`,
          type: 'purchase',
          amount: -price,
          reason: 'Pen unlock',
          refId: penId,
        });
      }
      d.ownedPens.push(penId);
      return { balance: d.balance };
    });
  }

  /** Wipe PEN progress back to a fresh wallet (used by Reset Progress). */
  resetAll(): void {
    const nextRev = this.state.rev + 1;
    const fresh = this.createInitial(false);
    // Keep rev increasing so an older mirrored copy can never win at next boot.
    fresh.rev = nextRev;
    try {
      this.storage.setItem(this.key, JSON.stringify(fresh));
    } catch {
      /* in-memory state still resets; the next commit will persist */
    }
    this.state = fresh;
    this.notify();
  }
}

export function formatPen(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

/**
 * src/config/economyConfig.ts
 * Single, versioned source of truth for the PEN economy.
 *
 * Every number here is a starting value for playtesting. UI and game code
 * must read from this file and never hard-code amounts.
 *
 * PEN is a virtual, local-only soft currency: no cash-out, no transfer,
 * no real-money value.
 */

export type MatchTierId = 'practice' | 'bronze' | 'silver' | 'gold';
export type AIDifficultyId = 'easy' | 'normal' | 'hard';

export interface TierConfig {
  id: MatchTierId;
  label: string;
  /** PEN charged when the player confirms the match. */
  entryFee: number;
  /** Short line shown on the tier card. */
  blurb: string;
}

export interface MissionConfig {
  id: string;
  title: string;
  /** Which counter in the daily match tally this mission reads. */
  metric: 'matches_played' | 'matches_won' | 'paid_matches_won' | 'practice_played';
  target: number;
  rewardPen: number;
}

export const ECONOMY_CONFIG = {
  /** Bump when any value below changes meaning. Stored with every save. */
  version: 1,

  currency: {
    name: 'PEN',
    initialBalance: 5000,
  },

  /** Day boundaries (daily bonus, missions, caps) use this IANA zone. */
  timezone: 'Asia/Dhaka',

  tiers: {
    practice: { id: 'practice', label: 'Practice', entryFee: 0, blurb: 'Free. Learn the desk.' },
    bronze: { id: 'bronze', label: 'Bronze', entryFee: 1000, blurb: 'Low stakes.' },
    silver: { id: 'silver', label: 'Silver', entryFee: 2000, blurb: 'Serious desk.' },
    gold: { id: 'gold', label: 'Gold', entryFee: 5000, blurb: 'High stakes.' },
  } as Record<MatchTierId, TierConfig>,

  /**
   * VS Computer payouts. The AI does not put PEN into a pool, so the winner's
   * payout is a fixed multiple of the entry fee (payout includes the fee).
   * Lower difficulty pays less so Easy cannot be farmed.
   */
  aiPayoutMultiplier: {
    easy: 1.2,
    normal: 1.9,
    hard: 2.3,
  } as Record<AIDifficultyId, number>,

  /**
   * Max NET PEN profit per local day from paid VS Computer matches
   * (win profit minus fees lost on defeats). Once the day's net reaches the
   * cap, a win only returns the entry fee (break-even).
   */
  aiDailyNetProfitCap: 4000,

  /**
   * Reference model for a real two-player pool (online, future). Winner takes
   * 90% of the combined pool, 10% leaves circulation. Not used by local play.
   */
  pvpPoolWinnerShare: 0.9,

  /** Local 2-player duels share one device and one wallet: no PEN stakes. */
  localDuelUsesPen: false,

  rewards: {
    /** Account XP. A win earns completion + win bonus. */
    accountXp: {
      completion: 50,
      winBonus: 50,
      practiceMultiplier: 0.5,
      easyMultiplier: 0.5,
      localDuelMultiplier: 0.5,
    },
    /** Pen mastery XP for the pen used (matches the old 100 / 30 values). */
    penXp: {
      win: 100,
      loss: 30,
      draw: 30,
      practiceMultiplier: 0.5,
      easyMultiplier: 0.5,
    },
    /** Account XP that Practice + Easy + local duels can earn per local day. */
    lowStakesDailyAccountXpCap: 400,
    /** Pen XP that low-stakes matches can earn per pen per local day. */
    lowStakesDailyPenXpCap: 300,
    firstDailyWinPen: 200,
  },

  /** Renewable safety net so a broke player is never stuck. */
  allowance: {
    /** Claimable once per local day while balance is below the threshold. */
    belowBalance: 1000,
    /** Tops balance up to this amount (never more). */
    topUpTo: 1000,
  },

  missions: [
    { id: 'm_practice_1', title: 'Play 1 Practice match', metric: 'practice_played', target: 1, rewardPen: 100 },
    { id: 'm_play_3', title: 'Play 3 matches', metric: 'matches_played', target: 3, rewardPen: 150 },
    { id: 'm_win_2', title: 'Win 2 matches', metric: 'matches_won', target: 2, rewardPen: 300 },
    { id: 'm_paid_win', title: 'Win a Bronze or higher match', metric: 'paid_matches_won', target: 1, rewardPen: 500 },
  ] as MissionConfig[],

  /**
   * Account level cost: XP needed to go from level N to N+1.
   * Index 0 = level 1 -> 2. Beyond the table the last value grows by growth.
   */
  accountLevels: {
    xpToNext: [100, 150, 200, 250, 300, 400, 450, 500, 550, 600, 700, 750, 800, 850, 900] as number[],
    growthAfterTable: 100,
    maxLevel: 100,
    /** PEN paid once per level reached (idempotent per level). */
    rewardPen: (level: number): number => (level <= 5 ? 250 : level <= 15 ? 500 : 1000),
  },

  /** Pen purchase prices. 0 = owned from the start. */
  penPrices: {
    'cheap-ballpoint': 0,
    'gel-pen': 0,
    'marker': 0,
    '4-colour-pen': 0,
    'highlighter': 0,
    'click-pen': 0,
    'fountain-pen': 0,
    'metal-pen': 0,
  } as Record<string, number>,

  /**
   * App killed or crashed mid-match (Android can kill a backgrounded app).
   * 'pending' (fee charged, no shot taken yet) is always refunded.
   * 'in_progress' follows this policy. Default 'forfeit': force-closing after
   * the first shot must not be a free way out of a losing match. Switch to
   * 'refund' if playtests show Android killing the app too often.
   */
  interruptedInProgressPolicy: 'forfeit' as 'forfeit' | 'refund',

  /** Ledger and idempotency bookkeeping limits. */
  limits: {
    maxHistoryRows: 200,
    maxProcessedEventIds: 2000,
  },
} as const;

export type EconomyConfig = typeof ECONOMY_CONFIG;

/**
 * ProgressionManager.ts
 * XP tracking and level unlock system.
 * PRD §6.3 — XP, Level Up & Customization.
 *
 * Uses localStorage for browser dev; will switch to @capacitor/preferences in Phase 4.
 */

export interface PenProgress {
  penId: string;
  xp: number;
  level: number; // 1-5
}

const LEVEL_THRESHOLDS = [0, 200, 500, 1000, 2000] as const;
const STAT_BONUSES = [0, 0.02, 0.04, 0.06, 0.08] as const;

const STORAGE_KEY = 'pen_fight_progression';

export class ProgressionManager {
  private progressMap: Map<string, PenProgress> = new Map();

  constructor() {
    this.load();
  }

  /** Get progress for a pen by ID */
  getProgress(penId: string): PenProgress {
    if (!this.progressMap.has(penId)) {
      this.progressMap.set(penId, { penId, xp: 0, level: 1 });
    }
    return this.progressMap.get(penId)!;
  }

  /** Add XP to a pen and check level-ups */
  addXP(penId: string, amount: number): PenProgress {
    const progress = this.getProgress(penId);
    progress.xp += amount;

    // Check level-ups
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (progress.xp >= LEVEL_THRESHOLDS[i]) {
        progress.level = i + 1;
        break;
      }
    }

    this.save();
    return progress;
  }

  /** Get stat bonus multiplier for a pen's level */
  getStatBonus(penId: string): number {
    const progress = this.getProgress(penId);
    return STAT_BONUSES[progress.level - 1] || 0;
  }

  /** XP needed for next level */
  getXPForNextLevel(penId: string): { current: number; needed: number; ratio: number } {
    const progress = this.getProgress(penId);
    if (progress.level >= 5) {
      return { current: progress.xp, needed: progress.xp, ratio: 1 };
    }
    const currentThreshold = LEVEL_THRESHOLDS[progress.level - 1];
    const nextThreshold = LEVEL_THRESHOLDS[progress.level];
    const current = progress.xp - currentThreshold;
    const needed = nextThreshold - currentThreshold;
    return { current, needed, ratio: current / needed };
  }

  /** Record match result */
  recordMatch(penId: string, won: boolean): PenProgress {
    const xp = won ? 100 : 30;
    return this.addXP(penId, xp);
  }

  /** Save to localStorage */
  private save(): void {
    try {
      const data: Record<string, PenProgress> = {};
      this.progressMap.forEach((v, k) => { data[k] = v; });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Storage unavailable
    }
  }

  /** Load from localStorage */
  private load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw) as Record<string, PenProgress>;
        for (const [k, v] of Object.entries(data)) {
          this.progressMap.set(k, v);
        }
      }
    } catch {
      // Storage unavailable
    }
  }
}

/** Singleton progression manager */
export const progressionManager = new ProgressionManager();

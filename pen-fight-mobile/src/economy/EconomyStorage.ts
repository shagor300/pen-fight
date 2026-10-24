/**
 * src/economy/EconomyStorage.ts
 * Storage for the PEN economy.
 *
 * Writes are synchronous to localStorage (so a commit is durable before the
 * UI reacts) and mirrored to Capacitor Preferences, which survives WebView
 * data clears better on Android. At boot, hydrateEconomyStorage() copies the
 * newer of the two copies into localStorage before the engine loads.
 *
 * Neither store is tamper-proof. See EconomyEngine.ts.
 */
import { Preferences } from '@capacitor/preferences';
import { EconomyEngine, ECONOMY_STORAGE_KEY, type StorageAdapter } from './EconomyEngine';

function revOf(raw: string | null): number {
  if (!raw) return -1;
  try {
    const v = JSON.parse(raw) as { rev?: number };
    return typeof v.rev === 'number' ? v.rev : 0;
  } catch {
    return -1;
  }
}

export function createEconomyStorage(): StorageAdapter {
  return {
    getItem(key: string): string | null {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    setItem(key: string, value: string): void {
      // Throws if localStorage is unavailable: the engine then rolls back.
      localStorage.setItem(key, value);
      // Best-effort mirror; failures here never block gameplay.
      Preferences.set({ key, value }).catch(() => undefined);
    },
  };
}

/** Pick the newest saved copy (by rev) between localStorage and Preferences. */
export async function hydrateEconomyStorage(key: string = ECONOMY_STORAGE_KEY): Promise<void> {
  let local: string | null = null;
  let mirrored: string | null = null;
  try {
    local = localStorage.getItem(key);
  } catch {
    local = null;
  }
  try {
    mirrored = (await Preferences.get({ key })).value;
  } catch {
    mirrored = null;
  }
  if (revOf(mirrored) > revOf(local) && mirrored) {
    try {
      localStorage.setItem(key, mirrored);
    } catch {
      /* ignore: engine will start from whatever it can read */
    }
  }
}

let instance: EconomyEngine | null = null;

/** Call once at boot, before creating GameManager. */
export async function initEconomy(): Promise<EconomyEngine> {
  if (!instance) {
    await hydrateEconomyStorage();
    instance = new EconomyEngine(createEconomyStorage());
  }
  return instance;
}

/** The shared engine. Throws if initEconomy() has not finished. */
export function getEconomy(): EconomyEngine {
  if (!instance) throw new Error('Economy not initialised. Call initEconomy() at boot.');
  return instance;
}

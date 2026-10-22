/**
 * SoundAndHaptics.ts
 * Android Pen Fight Pro — Multi-Event Professional Sound System
 * Re-exports the exact extracted Shunnek reference audio & multi-event engine.
 */
import { soundSystem, PenFightProSoundSystem, SoundEffect } from './penFightProSoundEngine';

export { soundSystem, PenFightProSoundSystem };
export type { SoundEffect };

// Export soundManager as an alias to soundSystem for 100% backward compatibility
export const soundManager = soundSystem;

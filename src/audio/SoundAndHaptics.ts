/**
 * SoundAndHaptics.ts
 * Synthesized audio via Web Audio API + future Howler integration.
 * Haptics via Capacitor (stubbed for browser dev).
 * PRD §8 — Audio & Haptics.
 */

export type SoundEffect = 'flick' | 'hit_light' | 'hit_heavy' | 'slide' | 'fall';

class SoundManager {
  private audioCtx: AudioContext | null = null;
  private sfxVolume = 0.7;
  private musicVolume = 0.5;
  private enabled = true;

  private getContext(): AudioContext {
    if (!this.audioCtx) {
      this.audioCtx = new AudioContext();
    }
    return this.audioCtx;
  }

  /** Resume audio context (must be called after user gesture) */
  async resume(): Promise<void> {
    const ctx = this.getContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
  }

  setSFXVolume(vol: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
  }

  setMusicVolume(vol: number): void {
    this.musicVolume = Math.max(0, Math.min(1, vol));
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /** Play a synthesized sound effect */
  play(effect: SoundEffect, intensity = 1): void {
    if (!this.enabled) return;

    try {
      const ctx = this.getContext();
      const gainNode = ctx.createGain();
      gainNode.connect(ctx.destination);
      gainNode.gain.value = this.sfxVolume * intensity;

      switch (effect) {
        case 'flick':
          this.synthFlick(ctx, gainNode);
          break;
        case 'hit_light':
          this.synthHit(ctx, gainNode, 0.6);
          break;
        case 'hit_heavy':
          this.synthHit(ctx, gainNode, 1.0);
          break;
        case 'slide':
          this.synthSlide(ctx, gainNode);
          break;
        case 'fall':
          this.synthFall(ctx, gainNode);
          break;
      }
    } catch (e) {
      // Silently fail if audio is not available
      console.warn('Audio error:', e);
    }
  }

  /** Short click/tick for pen flick */
  private synthFlick(ctx: AudioContext, gain: GainNode): void {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.08);
  }

  /** Plastic collision sound — intensity 0–1 */
  private synthHit(ctx: AudioContext, gain: GainNode, intensity: number): void {
    // Noise burst for impact
    const bufferSize = ctx.sampleRate * 0.06;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    // Bandpass filter for plastic-like tone
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1200 + intensity * 2000;
    filter.Q.value = 2;

    noise.connect(filter);
    filter.connect(gain);
    gain.gain.setValueAtTime(intensity * 0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    noise.start(ctx.currentTime);

    // Add a tonal click
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400 + intensity * 600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(intensity * 0.2, ctx.currentTime);
    oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
  }

  /** Sliding/rolling sound */
  private synthSlide(ctx: AudioContext, gain: GainNode): void {
    const bufferSize = ctx.sampleRate * 0.3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.1 * Math.exp(-i / (bufferSize * 0.5));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 600;

    noise.connect(filter);
    filter.connect(gain);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    noise.start(ctx.currentTime);
  }

  /** Falling off desk sound */
  private synthFall(ctx: AudioContext, gain: GainNode): void {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(500, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  }

  /**
   * Trigger haptic feedback (stubbed for browser, uses Capacitor on mobile)
   */
  async haptic(style: 'light' | 'medium' | 'heavy' = 'medium'): Promise<void> {
    // Try navigator.vibrate (works on Android Chrome)
    if ('vibrate' in navigator) {
      const duration = style === 'light' ? 10 : style === 'medium' ? 25 : 50;
      navigator.vibrate(duration);
    }
    // Capacitor haptics will be integrated in Phase 5
  }
}

/** Singleton sound manager */
export const soundManager = new SoundManager();

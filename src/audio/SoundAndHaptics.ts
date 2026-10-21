/**
 * SoundAndHaptics.ts
 * Complete Multi-Layered Web Audio API Synthesizer + Native Capacitor Haptics
 * matching Desk Wars: Pen Fight (shunneklabs.app/games/pen-fight/).
 */
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export type SoundEffect =
  | 'ui_click'
  | 'aim_tick'
  | 'flick'
  | 'hit_light'
  | 'hit_heavy'
  | 'slide'
  | 'fall'
  | 'round_win'
  | 'round_lose'
  | 'match_victory';

class SoundManager {
  private audioCtx: AudioContext | null = null;
  private sfxVolume = 0.8;
  private musicVolume = 0.5;
  private enabled = true;

  private getContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtx();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

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

  play(effect: SoundEffect, intensity = 1): void {
    if (!this.enabled || this.sfxVolume <= 0.01) return;

    try {
      const ctx = this.getContext();
      const masterGain = ctx.createGain();
      masterGain.connect(ctx.destination);
      masterGain.gain.value = this.sfxVolume * Math.min(1.2, Math.max(0.15, intensity));

      switch (effect) {
        case 'ui_click':
          this.synthUiClick(ctx, masterGain);
          break;
        case 'aim_tick':
          this.synthAimTick(ctx, masterGain, intensity);
          break;
        case 'flick':
          this.synthFlick(ctx, masterGain, intensity);
          break;
        case 'hit_light':
          this.synthHit(ctx, masterGain, 0.55 * intensity);
          break;
        case 'hit_heavy':
          this.synthHit(ctx, masterGain, 1.0 * intensity);
          break;
        case 'slide':
          this.synthSlide(ctx, masterGain, intensity);
          break;
        case 'fall':
          this.synthFall(ctx, masterGain);
          break;
        case 'round_win':
          this.synthFanfare(ctx, masterGain, [523.25, 659.25, 783.99]);
          break;
        case 'round_lose':
          this.synthFanfare(ctx, masterGain, [392.0, 349.23, 293.66]);
          break;
        case 'match_victory':
          this.synthFanfare(ctx, masterGain, [523.25, 659.25, 783.99, 1046.5]);
          break;
      }
    } catch {
      // Ignore audio errors prior to user gesture
    }
  }

  private synthUiClick(ctx: AudioContext, gain: GainNode): void {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(620, now);
    osc.frequency.exponentialRampToValueAtTime(240, now + 0.035);
    osc.connect(gain);
    gain.gain.setValueAtTime(0.28 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.038);
    osc.start(now);
    osc.stop(now + 0.04);
  }

  private synthAimTick(ctx: AudioContext, gain: GainNode, bucket = 1): void {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    const baseFreq = 380 + bucket * 110;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.65, now + 0.025);
    osc.connect(gain);
    gain.gain.setValueAtTime(0.18 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.028);
    osc.start(now);
    osc.stop(now + 0.03);
  }

  private synthFlick(ctx: AudioContext, gain: GainNode, intensity = 1): void {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1020 + intensity * 240, now);
    osc.frequency.exponentialRampToValueAtTime(175, now + 0.055);
    osc.connect(gain);
    gain.gain.setValueAtTime(0.42 * Math.min(1.0, intensity) * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.start(now);
    osc.stop(now + 0.062);
  }

  private synthHit(ctx: AudioContext, gain: GainNode, intensity: number): void {
    const now = ctx.currentTime;
    const clamped = Math.min(1, Math.max(0.2, intensity));

    const bufferSize = Math.floor(ctx.sampleRate * 0.055);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.16));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1450 + clamped * 1850;
    filter.Q.value = 2.4;

    noise.connect(filter);
    filter.connect(gain);
    gain.gain.setValueAtTime(clamped * 0.55 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    noise.start(now);

    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520 + clamped * 640, now);
    osc.frequency.exponentialRampToValueAtTime(125, now + 0.085);
    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(clamped * 0.28 * this.sfxVolume, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.092);
  }

  private synthSlide(ctx: AudioContext, gain: GainNode, intensity = 1): void {
    const now = ctx.currentTime;
    const dur = 0.24 + Math.min(1.0, intensity) * 0.22;
    const bufferSize = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = lastOut * 0.74 + white * 0.26;
      const progress = i / bufferSize;
      const env = Math.pow(1 - progress, 1.75);
      data[i] = lastOut * env * 0.45;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1180 + intensity * 380, now);
    filter.frequency.exponentialRampToValueAtTime(480, now + dur);
    filter.Q.value = 2.1;

    noise.connect(filter);
    filter.connect(gain);

    const targetGain = Math.min(0.48, 0.20 + intensity * 0.24) * this.sfxVolume;
    gain.gain.setValueAtTime(targetGain, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    noise.start(now);
  }

  private synthFall(ctx: AudioContext, gain: GainNode): void {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(75, now + 0.32);
    osc.connect(gain);
    gain.gain.setValueAtTime(0.38 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.34);
    osc.start(now);
    osc.stop(now + 0.35);

    const bounceOsc = ctx.createOscillator();
    const bounceGain = ctx.createGain();
    bounceOsc.type = 'triangle';
    bounceOsc.frequency.setValueAtTime(680, now + 0.18);
    bounceOsc.frequency.exponentialRampToValueAtTime(190, now + 0.24);
    bounceGain.gain.setValueAtTime(0.22 * this.sfxVolume, now + 0.18);
    bounceGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    bounceOsc.connect(bounceGain);
    bounceGain.connect(ctx.destination);
    bounceOsc.start(now + 0.18);
    bounceOsc.stop(now + 0.26);
  }

  private synthFanfare(ctx: AudioContext, _gain: GainNode, notes: number[]): void {
    notes.forEach((freq, idx) => {
      const start = ctx.currentTime + idx * 0.085;
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      noteGain.gain.setValueAtTime(0.24 * this.sfxVolume, start);
      noteGain.gain.exponentialRampToValueAtTime(0.001, start + 0.24);
      osc.connect(noteGain);
      noteGain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.25);
    });
  }

  async haptic(style: 'light' | 'medium' | 'heavy' = 'medium'): Promise<void> {
    try {
      const capStyle =
        style === 'light'
          ? ImpactStyle.Light
          : style === 'heavy'
          ? ImpactStyle.Heavy
          : ImpactStyle.Medium;
      await Haptics.impact({ style: capStyle });
      return;
    } catch {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        const duration = style === 'light' ? 10 : style === 'medium' ? 22 : 45;
        navigator.vibrate(duration);
      }
    }
  }
}

export const soundManager = new SoundManager();

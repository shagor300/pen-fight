/**
 * SoundAndHaptics.ts
 * Hyper-Realistic Acoustic Web Audio Synthesizer + Native Capacitor Haptics
 * matching https://shunneklabs.app/games/pen-fight/ (v1.5.1).
 *
 * Acoustic Layers:
 * 1. Empty Board Flick ('flick' + 'slide'):
 *    - Finger-nail plastic barrel snap (1650Hz -> 420Hz crisp click)
 *    - Hollow wooden school desk board thump (185Hz -> 88Hz + 340Hz oak resonance)
 *    - Textured wood-grain plastic sliding friction ('slide')
 * 2. Pen-on-Pen Collision ('hit_light' / 'hit_heavy'):
 *    - Dual-resonator hard acrylic/plastic clack (2150Hz & 1480Hz high-Q peaks)
 *    - Crisp 15ms impact crack + 230Hz wooden desk transfer knock
 * 3. Desk Edge Fall ('fall'):
 *    - Wooden rim tick (520Hz) + falling whoosh + double floor clatter bounce
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
  private overallVolume = 0.8;
  private sfxVolume = 0.7;
  private musicVolume = 0.3;
  private enabled = true;
  private vibrationEnabled = true;

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

  setOverallVolume(vol: number): void {
    this.overallVolume = Math.max(0, Math.min(1, vol));
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

  setVibrationEnabled(enabled: boolean): void {
    this.vibrationEnabled = enabled;
  }

  private getEffectiveGain(): number {
    return this.overallVolume * this.sfxVolume;
  }

  play(effect: SoundEffect, intensity = 1): void {
    const effVol = this.getEffectiveGain();
    if (!this.enabled || effVol <= 0.01) return;

    try {
      const ctx = this.getContext();
      const masterGain = ctx.createGain();
      masterGain.connect(ctx.destination);
      masterGain.gain.value = effVol * Math.min(1.25, Math.max(0.18, intensity));

      switch (effect) {
        case 'ui_click':
          this.synthUiClick(ctx, masterGain, effVol);
          break;
        case 'aim_tick':
          this.synthAimTick(ctx, masterGain, intensity, effVol);
          break;
        case 'flick':
          this.synthBoardFlick(ctx, masterGain, intensity, effVol);
          break;
        case 'hit_light':
          this.synthPenCollision(ctx, masterGain, 0.58 * intensity, effVol);
          break;
        case 'hit_heavy':
          this.synthPenCollision(ctx, masterGain, 1.0 * intensity, effVol);
          break;
        case 'slide':
          this.synthWoodSlide(ctx, masterGain, intensity, effVol);
          break;
        case 'fall':
          this.synthDeskFall(ctx, masterGain, effVol);
          break;
        case 'round_win':
          this.synthFanfare(ctx, [523.25, 659.25, 783.99], effVol);
          break;
        case 'round_lose':
          this.synthFanfare(ctx, [392.0, 349.23, 293.66], effVol);
          break;
        case 'match_victory':
          this.synthFanfare(ctx, [523.25, 659.25, 783.99, 1046.5], effVol);
          break;
      }
    } catch {
      // Ignore audio errors prior to user interaction
    }
  }

  private synthUiClick(ctx: AudioContext, gain: GainNode, effVol: number): void {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(680, now);
    osc.frequency.exponentialRampToValueAtTime(250, now + 0.032);
    osc.connect(gain);
    gain.gain.setValueAtTime(0.30 * effVol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
    osc.start(now);
    osc.stop(now + 0.038);
  }

  private synthAimTick(ctx: AudioContext, gain: GainNode, bucket = 1, effVol = 0.7): void {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    const baseFreq = 410 + bucket * 115;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.62, now + 0.022);
    osc.connect(gain);
    gain.gain.setValueAtTime(0.20 * effVol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.026);
    osc.start(now);
    osc.stop(now + 0.028);
  }

  /**
   * Realistic Empty Board Flick:
   * Combines finger-nail snap on plastic barrel + hollow wooden school desk knock
   */
  private synthBoardFlick(ctx: AudioContext, gain: GainNode, intensity = 1, effVol = 0.7): void {
    const now = ctx.currentTime;
    const pwr = Math.min(1.0, Math.max(0.25, intensity));

    // Layer A: Finger-flick plastic barrel snap (1650Hz -> 380Hz)
    const snapOsc = ctx.createOscillator();
    snapOsc.type = 'triangle';
    snapOsc.frequency.setValueAtTime(1580 + pwr * 340, now);
    snapOsc.frequency.exponentialRampToValueAtTime(340, now + 0.034);
    snapOsc.connect(gain);
    gain.gain.setValueAtTime(0.46 * pwr * effVol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.042);
    snapOsc.start(now);
    snapOsc.stop(now + 0.045);

    // Layer B: Hollow Wooden School Desk Resonance (185Hz -> 88Hz + 340Hz oak formant)
    const woodOsc = ctx.createOscillator();
    const woodGain = ctx.createGain();
    woodOsc.type = 'sine';
    woodOsc.frequency.setValueAtTime(192, now);
    woodOsc.frequency.exponentialRampToValueAtTime(86, now + 0.085);
    woodGain.gain.setValueAtTime(0.42 * pwr * effVol, now);
    woodGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    woodOsc.connect(woodGain);
    woodGain.connect(ctx.destination);
    woodOsc.start(now);
    woodOsc.stop(now + 0.095);

    const oakFormant = ctx.createOscillator();
    const oakGain = ctx.createGain();
    oakFormant.type = 'triangle';
    oakFormant.frequency.setValueAtTime(345, now);
    oakFormant.frequency.exponentialRampToValueAtTime(165, now + 0.055);
    oakGain.gain.setValueAtTime(0.24 * pwr * effVol, now);
    oakGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    oakFormant.connect(oakGain);
    oakGain.connect(ctx.destination);
    oakFormant.start(now);
    oakFormant.stop(now + 0.065);
  }

  /**
   * Realistic Pen-on-Pen Hard Plastic/Acrylic Collision + Wooden Desk Transfer Thud
   */
  private synthPenCollision(ctx: AudioContext, gain: GainNode, intensity: number, effVol: number): void {
    const now = ctx.currentTime;
    const clamped = Math.min(1, Math.max(0.22, intensity));

    // Layer 1: Crisp 16ms impact transient burst through dual high-Q plastic resonators
    const bufferSize = Math.floor(ctx.sampleRate * 0.05);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.14));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter1 = ctx.createBiquadFilter();
    filter1.type = 'bandpass';
    filter1.frequency.value = 1850 + clamped * 950;
    filter1.Q.value = 3.2;

    noise.connect(filter1);
    filter1.connect(gain);
    gain.gain.setValueAtTime(clamped * 0.68 * effVol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);
    noise.start(now);

    // Layer 2: Primary hard plastic tube clack (2150Hz -> 540Hz)
    const clackA = ctx.createOscillator();
    const clackAGain = ctx.createGain();
    clackA.type = 'triangle';
    clackA.frequency.setValueAtTime(1950 + clamped * 550, now);
    clackA.frequency.exponentialRampToValueAtTime(480, now + 0.045);
    clackAGain.gain.setValueAtTime(clamped * 0.38 * effVol, now);
    clackAGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    clackA.connect(clackAGain);
    clackAGain.connect(ctx.destination);
    clackA.start(now);
    clackA.stop(now + 0.052);

    // Layer 3: Secondary barrel harmonic + wooden desk knock (680Hz -> 135Hz)
    const woodKnock = ctx.createOscillator();
    const woodKnockGain = ctx.createGain();
    woodKnock.type = 'sine';
    woodKnock.frequency.setValueAtTime(640 + clamped * 280, now);
    woodKnock.frequency.exponentialRampToValueAtTime(120, now + 0.088);
    woodKnockGain.gain.setValueAtTime(clamped * 0.34 * effVol, now);
    woodKnockGain.gain.exponentialRampToValueAtTime(0.001, now + 0.092);
    woodKnock.connect(woodKnockGain);
    woodKnockGain.connect(ctx.destination);
    woodKnock.start(now);
    woodKnock.stop(now + 0.095);
  }

  /**
   * Realistic Plastic Pen Sliding / Scraping across Wooden Desk Grain
   */
  private synthWoodSlide(ctx: AudioContext, gain: GainNode, intensity = 1, effVol = 0.7): void {
    const now = ctx.currentTime;
    const pwr = Math.min(1.0, Math.max(0.2, intensity));
    const dur = 0.26 + pwr * 0.24;
    const bufferSize = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = lastOut * 0.76 + white * 0.24;
      const progress = i / bufferSize;
      // Subtle wood-grain micro-modulation + smooth friction decay
      const grainMod = 0.85 + 0.15 * Math.sin(i * 0.045);
      const env = Math.pow(1 - progress, 1.65) * grainMod;
      data[i] = lastOut * env * 0.52;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1120 + pwr * 420, now);
    filter.frequency.exponentialRampToValueAtTime(420, now + dur);
    filter.Q.value = 1.9;

    noise.connect(filter);
    filter.connect(gain);

    const targetGain = Math.min(0.52, 0.22 + pwr * 0.26) * effVol;
    gain.gain.setValueAtTime(targetGain, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    noise.start(now);
  }

  /**
   * Realistic Pen Falling off Wooden Desk Edge & Clattering on Floor
   */
  private synthDeskFall(ctx: AudioContext, gain: GainNode, effVol: number): void {
    const now = ctx.currentTime;

    // 1. Desk edge rim tick + downward Doppler drop
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(460, now);
    osc.frequency.exponentialRampToValueAtTime(78, now + 0.28);
    osc.connect(gain);
    gain.gain.setValueAtTime(0.36 * effVol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.30);
    osc.start(now);
    osc.stop(now + 0.31);

    // 2. Double plastic clatter bounce on classroom floor
    const bounces = [
      { delay: 0.17, freq: 820, gain: 0.28 },
      { delay: 0.25, freq: 640, gain: 0.16 }
    ];
    bounces.forEach(b => {
      const bOsc = ctx.createOscillator();
      const bGain = ctx.createGain();
      bOsc.type = 'triangle';
      bOsc.frequency.setValueAtTime(b.freq, now + b.delay);
      bOsc.frequency.exponentialRampToValueAtTime(185, now + b.delay + 0.055);
      bGain.gain.setValueAtTime(b.gain * effVol, now + b.delay);
      bGain.gain.exponentialRampToValueAtTime(0.001, now + b.delay + 0.06);
      bOsc.connect(bGain);
      bGain.connect(ctx.destination);
      bOsc.start(now + b.delay);
      bOsc.stop(now + b.delay + 0.065);
    });
  }

  private synthFanfare(ctx: AudioContext, notes: number[], effVol: number): void {
    notes.forEach((freq, idx) => {
      const start = ctx.currentTime + idx * 0.085;
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      noteGain.gain.setValueAtTime(0.24 * effVol, start);
      noteGain.gain.exponentialRampToValueAtTime(0.001, start + 0.24);
      osc.connect(noteGain);
      noteGain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.25);
    });
  }

  async haptic(style: 'light' | 'medium' | 'heavy' = 'medium'): Promise<void> {
    if (!this.vibrationEnabled) return;
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

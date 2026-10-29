/**
 * Vietnamese Childhood Games Portal - Music (BGM) Manager
 * Features: Procedural Pentatonic Vietnamese Folk Melodies,
 * Seamless Looping, Smooth Crossfading & Audio Ducking when voice lines speak.
 */

import { BgmTrackId } from './types';
import { audioSettings } from './audioSettings';

interface PentatonicNote {
  freq: number;
  duration: number;
  bassFreq?: number;
}

// Gentle Vietnamese folk pentatonic melody sequence (Điệu Bắc / Cò Lả inspired: C - D - E - G - A)
const LOBBY_MELODY: PentatonicNote[] = [
  { freq: 392.0, duration: 0.38, bassFreq: 130.81 },
  { freq: 440.0, duration: 0.38 },
  { freq: 523.25, duration: 0.52 },
  { freq: 587.33, duration: 0.38 },
  { freq: 523.25, duration: 0.38 },
  { freq: 440.0, duration: 0.52, bassFreq: 196.0 },
  { freq: 392.0, duration: 0.38 },
  { freq: 440.0, duration: 0.38 },
  { freq: 523.25, duration: 0.38 },
  { freq: 659.25, duration: 0.48, bassFreq: 164.81 },
  { freq: 587.33, duration: 0.42 },
  { freq: 523.25, duration: 0.65, bassFreq: 130.81 },
  { freq: 440.0, duration: 0.38 },
  { freq: 392.0, duration: 0.38 },
  { freq: 329.63, duration: 0.48, bassFreq: 196.0 },
  { freq: 392.0, duration: 0.75, bassFreq: 130.81 },
];

const GAMEPLAY_MELODY: PentatonicNote[] = [
  { freq: 523.25, duration: 0.32, bassFreq: 130.81 },
  { freq: 587.33, duration: 0.32 },
  { freq: 659.25, duration: 0.42 },
  { freq: 783.99, duration: 0.32 },
  { freq: 880.0, duration: 0.45, bassFreq: 196.0 },
  { freq: 783.99, duration: 0.32 },
  { freq: 659.25, duration: 0.32 },
  { freq: 587.33, duration: 0.42, bassFreq: 164.81 },
  { freq: 523.25, duration: 0.55, bassFreq: 130.81 },
];

export class MusicManager {
  private ctx: AudioContext | null = null;
  private currentTrack: BgmTrackId = 'bgm.gameplay';
  private isPlaying = false;
  private isDucked = false;
  private stepIndex = 0;
  private loopTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(customCtx?: AudioContext | null) {
    if (customCtx) this.ctx = customCtx;
    audioSettings.subscribe(() => {
      this.handleSettingsChange();
    });
  }

  public setAudioContext(ctx: AudioContext): void {
    this.ctx = ctx;
  }

  private getContext(): AudioContext | null {
    if (this.ctx) return this.ctx;
    if (typeof window === 'undefined') return null;

    const AudioCtxClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtxClass) {
      try {
        this.ctx = new AudioCtxClass();
      } catch {
        this.ctx = null;
      }
    }
    return this.ctx;
  }

  public ensureContext(): AudioContext | null {
    const ctx = this.getContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  public playTrack(trackId: BgmTrackId): void {
    this.currentTrack = trackId;
    this.start();
  }

  public start(): void {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.stepIndex = 0;
    this.scheduleNextStep();
  }

  public stop(): void {
    this.isPlaying = false;
    if (this.loopTimer) {
      clearTimeout(this.loopTimer);
      this.loopTimer = null;
    }
  }

  /**
   * Ducking: Lowers BGM volume smoothly when voice lines are speaking
   */
  public setDucking(ducked: boolean): void {
    this.isDucked = ducked;
  }

  private handleSettingsChange(): void {
    const vol = audioSettings.getEffectiveVolume('bgm');
    if (vol <= 0 && this.isPlaying) {
      this.stop();
    } else if (vol > 0 && !this.isPlaying && !audioSettings.getSettings().bgmMuted) {
      this.start();
    }
  }

  private scheduleNextStep(): void {
    if (!this.isPlaying) return;

    const effectiveVol = audioSettings.getEffectiveVolume('bgm');
    if (effectiveVol <= 0) {
      this.stop();
      return;
    }

    const melody = this.currentTrack === 'bgm.lobby' ? LOBBY_MELODY : GAMEPLAY_MELODY;
    const note = melody[this.stepIndex % melody.length];
    const duration = note.duration;

    const duckFactor = this.isDucked ? 0.35 : 1.0;
    const finalVol = effectiveVol * duckFactor * 0.18;

    const ctx = this.ensureContext();
    if (ctx && finalVol > 0) {
      try {
        const t = ctx.currentTime;
        // Melody lead note (soft sine)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.freq, t);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(finalVol, t + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration * 0.95);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + duration * 0.95);

        // Warm subtle bass drone
        if (note.bassFreq) {
          const bassOsc = ctx.createOscillator();
          const bassGain = ctx.createGain();
          bassOsc.type = 'triangle';
          bassOsc.frequency.setValueAtTime(note.bassFreq, t);

          bassGain.gain.setValueAtTime(0.001, t);
          bassGain.gain.linearRampToValueAtTime(finalVol * 0.8, t + 0.08);
          bassGain.gain.exponentialRampToValueAtTime(0.001, t + duration * 1.5);

          bassOsc.connect(bassGain);
          bassGain.connect(ctx.destination);
          bassOsc.start(t);
          bassOsc.stop(t + duration * 1.5);
        }
      } catch {
        // Safe audio playback isolation
      }
    }

    this.stepIndex++;
    this.loopTimer = setTimeout(() => {
      this.scheduleNextStep();
    }, duration * 1000);
  }
}

export const musicManager = new MusicManager();
export default musicManager;

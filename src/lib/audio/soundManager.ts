/**
 * Sound & Audio Synthesizer (Zero-Asset Web Audio Engine)
 *
 * Provides retro, cheerful Vietnamese childhood-themed sound effects and
 * gentle pentatonic Vietnamese folk BGM, 100% procedurally synthesized via
 * the Web Audio API without requiring any external audio files.
 *
 * Fully SSR-safe, Node.js-safe, and gracefully handles browser audio autoplay policies.
 */

import { CharacterId, VoiceTriggerId, SfxId, BgmTrackId } from './types';
import { voiceManager } from './voiceManager';
import { sfxManager } from './sfxManager';
import { musicManager } from './musicManager';
import { audioSettings } from './audioSettings';
import type { MascotType } from '@/lib/game-engine/types';

export interface SoundSettings {
  bgmEnabled: boolean;
  sfxEnabled: boolean;
  volume: number;
}

export interface SoundManagerOptions {
  audioContext?: AudioContext | null;
}

interface PentatonicNote {
  freq: number;
  duration: number; // in seconds
  bassFreq?: number;
}

// Gentle Vietnamese folk pentatonic melody sequence (Điệu Bắc / Cò Lả inspired: C - D - E - G - A)
const FOLK_MELODY: PentatonicNote[] = [
  { freq: 392.00, duration: 0.35, bassFreq: 130.81 }, // G4 (C3 bass)
  { freq: 440.00, duration: 0.35 },                   // A4
  { freq: 523.25, duration: 0.50 },                   // C5
  { freq: 587.33, duration: 0.35 },                   // D5
  { freq: 523.25, duration: 0.35 },                   // C5
  { freq: 440.00, duration: 0.50, bassFreq: 196.00 }, // A4 (G3 bass)
  { freq: 392.00, duration: 0.35 },                   // G4
  { freq: 440.00, duration: 0.35 },                   // A4
  { freq: 523.25, duration: 0.35 },                   // C5
  { freq: 659.25, duration: 0.45, bassFreq: 164.81 }, // E5 (E3 bass)
  { freq: 587.33, duration: 0.40 },                   // D5
  { freq: 523.25, duration: 0.60, bassFreq: 130.81 }, // C5 (C3 bass)
  { freq: 440.00, duration: 0.35 },                   // A4
  { freq: 392.00, duration: 0.35 },                   // G4
  { freq: 329.63, duration: 0.45, bassFreq: 196.00 }, // E4 (G3 bass)
  { freq: 392.00, duration: 0.70, bassFreq: 130.81 }, // G4 (C3 bass)
];

const STORAGE_KEY = 'vietnam_monopoly_sound_settings';

export class SoundManager {
  private ctx: AudioContext | null = null;
  private customCtxProvided = false;
  private settings: SoundSettings = {
    bgmEnabled: true,
    sfxEnabled: true,
    volume: 0.7,
  };

  private isBgmPlaying = false;
  private isDucked = false;
  private bgmStep = 0;
  private bgmTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(options?: SoundManagerOptions) {
    if (options && 'audioContext' in options) {
      this.ctx = options.audioContext ?? null;
      this.customCtxProvided = true;
    }
    this.loadSettings();
    voiceManager.onDucking((ducked) => {
      this.isDucked = ducked;
    });
  }

  // ==========================================
  // Context & Initialization
  // ==========================================

  private getContext(): AudioContext | null {
    if (this.customCtxProvided) {
      return this.ctx;
    }
    if (typeof window === 'undefined') {
      return null;
    }
    if (!this.ctx) {
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
    }
    return this.ctx;
  }

  private ensureAudioContext(): AudioContext | null {
    const ctx = this.getContext();
    if (!ctx) return null;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  // ==========================================
  // Settings & Persistence
  // ==========================================

  public playCashSound(): void {
    this.playCoinSound();
  }

  public setDucking(ducked: boolean): void {
    this.isDucked = ducked;
  }

  public playVoice(characterId: CharacterId, trigger: VoiceTriggerId): boolean {
    return voiceManager.playVoice(characterId, trigger);
  }

  public playMascotVoice(mascot?: MascotType, trigger: VoiceTriggerId = 'turn.start'): boolean {
    const map: Record<string, CharacterId> = {
      PIG: 'CHAR_01',
      FOX: 'CHAR_02',
      CAT: 'CHAR_03',
      BUFFALO: 'CHAR_04',
    };
    const charId = mascot ? map[mascot] || 'CHAR_01' : 'CHAR_01';
    return voiceManager.playVoice(charId, trigger);
  }

  public playSfx(id: SfxId): void {
    sfxManager.play(id);
  }

  public playMusic(trackId: BgmTrackId): void {
    musicManager.playTrack(trackId);
  }

  public getSettings(): SoundSettings {
    return { ...this.settings };
  }

  public setVolume(vol: number): void {
    this.settings.volume = Math.max(0, Math.min(1, vol));
    this.saveSettings();
  }

  public toggleSfx(enable?: boolean): boolean {
    this.settings.sfxEnabled = enable !== undefined ? enable : !this.settings.sfxEnabled;
    this.saveSettings();
    if (this.settings.sfxEnabled) {
      if (audioSettings.getSettings().sfxMuted) audioSettings.toggleSfxMute();
    } else {
      if (!audioSettings.getSettings().sfxMuted) audioSettings.toggleSfxMute();
    }
    return this.settings.sfxEnabled;
  }

  public toggleBgm(enable?: boolean): boolean {
    this.settings.bgmEnabled = enable !== undefined ? enable : !this.settings.bgmEnabled;
    this.saveSettings();
    if (this.settings.bgmEnabled) {
      if (audioSettings.getSettings().bgmMuted) audioSettings.toggleBgmMute();
      this.startBgm();
    } else {
      if (!audioSettings.getSettings().bgmMuted) audioSettings.toggleBgmMute();
      this.stopBgm();
    }
    return this.settings.bgmEnabled;
  }

  private loadSettings(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
          const parsed = JSON.parse(data);
          if (typeof parsed.bgmEnabled === 'boolean') {
            this.settings.bgmEnabled = parsed.bgmEnabled;
          }
          if (typeof parsed.sfxEnabled === 'boolean') {
            this.settings.sfxEnabled = parsed.sfxEnabled;
          }
          if (typeof parsed.volume === 'number' && !isNaN(parsed.volume)) {
            this.settings.volume = Math.max(0, Math.min(1, parsed.volume));
          }
        }
      }
    } catch {
      // Safe fallback on quota error or restricted storage environment
    }
  }

  private saveSettings(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
      }
    } catch {
      // Safe fallback on quota error or restricted storage environment
    }
  }

  // ==========================================
  // Sound Effects Synthesis
  // ==========================================

  /**
   * Tactile subtle UI click
   */
  public playClickSound(): void {
    if (!this.settings.sfxEnabled) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.03);

      gain.gain.setValueAtTime(0.25 * this.settings.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.03);
    } catch {
      // Safe fallback
    }
  }

  /**
   * Cheerful high-pitched "ting-ting" coin pickup sound
   */
  public playCoinSound(): void {
    if (!this.settings.sfxEnabled) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const notes = [
        { freq: 987.77, start: 0, duration: 0.12 }, // B5
        { freq: 1318.51, start: 0.08, duration: 0.22 }, // E6
      ];

      notes.forEach(({ freq, start, duration }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = ctx.currentTime + start;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.35 * this.settings.volume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + duration);
      });
    } catch {
      // Safe fallback
    }
  }

  /**
   * Rolling dice tumble / wooden rattle
   */
  public playDiceRoll(): void {
    if (!this.settings.sfxEnabled) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const duration = 0.32;
      const bufferSize = Math.floor(ctx.sampleRate * duration);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // Procedural noise with decay envelope
      for (let i = 0; i < bufferSize; i++) {
        const progress = i / bufferSize;
        const decay = Math.pow(1 - progress, 2);
        data[i] = (Math.random() * 2 - 1) * decay;
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, ctx.currentTime);
      filter.Q.setValueAtTime(3, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.4 * this.settings.volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      noiseSource.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noiseSource.start(ctx.currentTime);

      // Add 3 sharp wooden tap clicks
      const tapDelays = [0.03, 0.12, 0.22];
      tapDelays.forEach((delay) => {
        const osc = ctx.createOscillator();
        const tapGain = ctx.createGain();
        const t = ctx.currentTime + delay;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(260 + Math.random() * 80, t);
        osc.frequency.exponentialRampToValueAtTime(80, t + 0.04);

        tapGain.gain.setValueAtTime(0.25 * this.settings.volume, t);
        tapGain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

        osc.connect(tapGain);
        tapGain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + 0.04);
      });
    } catch {
      // Safe fallback
    }
  }

  /**
   * Constructive ascending chime / arpeggio when building houses or hotels
   */
  public playBuildSound(): void {
    if (!this.settings.sfxEnabled) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const arpeggio = [
        { freq: 523.25, time: 0 },    // C5
        { freq: 659.25, time: 0.07 }, // E5
        { freq: 783.99, time: 0.14 }, // G5
        { freq: 1046.50, time: 0.21 },// C6
      ];

      arpeggio.forEach(({ freq, time }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = ctx.currentTime + time;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.3 * this.settings.volume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + 0.25);
      });
    } catch {
      // Safe fallback
    }
  }

  /**
   * Heavy metallic cell door clank when sent to Jail
   */
  public playJailSound(): void {
    if (!this.settings.sfxEnabled) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Heavy low frequency impact
      const oscLow = ctx.createOscillator();
      const gainLow = ctx.createGain();

      oscLow.type = 'triangle';
      oscLow.frequency.setValueAtTime(140, now);
      oscLow.frequency.exponentialRampToValueAtTime(45, now + 0.35);

      gainLow.gain.setValueAtTime(0.5 * this.settings.volume, now);
      gainLow.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      oscLow.connect(gainLow);
      gainLow.connect(ctx.destination);

      oscLow.start(now);
      oscLow.stop(now + 0.35);

      // Resonant metallic clang
      const oscClang = ctx.createOscillator();
      const gainClang = ctx.createGain();

      oscClang.type = 'square';
      oscClang.frequency.setValueAtTime(280, now);
      oscClang.frequency.linearRampToValueAtTime(260, now + 0.25);

      gainClang.gain.setValueAtTime(0.2 * this.settings.volume, now);
      gainClang.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      oscClang.connect(gainClang);
      gainClang.connect(ctx.destination);

      oscClang.start(now);
      oscClang.stop(now + 0.25);
    } catch {
      // Safe fallback
    }
  }

  /**
   * Excited double-dice roll trill flourish
   */
  public playDoubleDiceSound(): void {
    if (!this.settings.sfxEnabled) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const notes = [
        { freq: 783.99, time: 0 },     // G5
        { freq: 1046.50, time: 0.06 }, // C6
        { freq: 1318.51, time: 0.12 }, // E6
        { freq: 1567.98, time: 0.18 }, // G6
      ];

      notes.forEach(({ freq, time }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = ctx.currentTime + time;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.3 * this.settings.volume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + 0.28);
      });
    } catch {
      // Safe fallback
    }
  }

  /**
   * Sad descending slide / game over tone
   */
  public playBankruptSound(): void {
    if (!this.settings.sfxEnabled) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const notes = [
        { freq: 349.23, time: 0, duration: 0.20 },    // F4
        { freq: 329.63, time: 0.20, duration: 0.20 }, // E4
        { freq: 311.13, time: 0.40, duration: 0.20 }, // Eb4
        { freq: 293.66, time: 0.60, duration: 0.45 }, // D4 with slide
      ];

      notes.forEach(({ freq, time, duration }, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = ctx.currentTime + time;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);

        if (idx === notes.length - 1) {
          // Slide down to C4 on last note
          osc.frequency.linearRampToValueAtTime(261.63, t + duration);
        }

        gain.gain.setValueAtTime(0.35 * this.settings.volume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + duration);
      });
    } catch {
      // Safe fallback
    }
  }

  /**
   * Grand victory fanfare
   */
  public playWinFanfare(): void {
    if (!this.settings.sfxEnabled) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const notes = [
        { freq: 523.25, time: 0, duration: 0.14 },    // C5
        { freq: 523.25, time: 0.14, duration: 0.14 }, // C5
        { freq: 523.25, time: 0.28, duration: 0.14 }, // C5
        { freq: 783.99, time: 0.42, duration: 0.35 }, // G5
        { freq: 659.25, time: 0.80, duration: 0.18 }, // E5
        { freq: 783.99, time: 1.00, duration: 0.18 }, // G5
        { freq: 1046.50, time: 1.20, duration: 0.70 },// C6 (Triumphant hold)
      ];

      notes.forEach(({ freq, time, duration }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = ctx.currentTime + time;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.4 * this.settings.volume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + duration);
      });
    } catch {
      // Safe fallback
    }
  }

  /**
   * Card draw paper swoosh / mystery chime
   */
  public playCardDrawSound(): void {
    if (!this.settings.sfxEnabled) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const chimes = [
        { freq: 587.33, time: 0, duration: 0.2 },      // D5
        { freq: 880.00, time: 0.08, duration: 0.3 },   // A5
      ];

      chimes.forEach(({ freq, time, duration }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = ctx.currentTime + time;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.25 * this.settings.volume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + duration);
      });
    } catch {
      // Safe fallback
    }
  }

  /**
   * Expressive emote reaction sound (bubble pop, heart chime, sandal thud, coin scatter)
   */
  public playEmoteSound(emoji?: string): void {
    if (!this.settings.sfxEnabled) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Money emoji: coin sound effect
      if (emoji === '💸' || emoji === '💰') {
        this.playCoinSound();
        return;
      }

      // Sandal / troll: comical pitch-down thud
      if (emoji === '🩴') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(340, now);
        osc.frequency.exponentialRampToValueAtTime(70, now + 0.16);

        gain.gain.setValueAtTime(0.25 * this.settings.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.16);
        return;
      }

      // Heart / Fire / Laugh / Clap / Default: gentle cheerful harmonic pop
      const freqs = emoji === '❤️' ? [523.25, 659.25, 783.99] : [440.0, 554.37, 659.25];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = now + idx * 0.05;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.2 * this.settings.volume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.12);
      });
    } catch {
      // Safe fallback
    }
  }

  // ==========================================
  // Vietnamese Pentatonic BGM Engine
  // ==========================================

  public startBgm(): void {
    if (!this.settings.bgmEnabled) return;
    this.isBgmPlaying = true;
    musicManager.start();
    this.scheduleNextBgmNote();
  }

  public stopBgm(): void {
    this.isBgmPlaying = false;
    musicManager.stop();
    if (this.bgmTimer !== null) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  private scheduleNextBgmNote(): void {
    if (!this.isBgmPlaying || !this.settings.bgmEnabled) {
      this.stopBgm();
      return;
    }

    const ctx = this.ensureAudioContext();
    if (!ctx) {
      // In SSR or uninitialized context, wait and check again
      this.bgmTimer = setTimeout(() => this.scheduleNextBgmNote(), 500);
      return;
    }

    const note = FOLK_MELODY[this.bgmStep];
    const stepDurationMs = note.duration * 1000;

    try {
      const now = ctx.currentTime;

      // Melody note (soft triangle with gentle filter)
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.freq, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, now);
      filter.Q.setValueAtTime(1, now);

      const duckFactor = this.isDucked ? 0.35 : 1.0;
      const noteVolume = 0.16 * this.settings.volume * duckFactor;
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(noteVolume, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + note.duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + note.duration);

      // Soft bass note on primary beats
      if (note.bassFreq) {
        const bassOsc = ctx.createOscillator();
        const bassGain = ctx.createGain();

        bassOsc.type = 'sine';
        bassOsc.frequency.setValueAtTime(note.bassFreq, now);

        const bassVol = 0.12 * this.settings.volume * duckFactor;
        bassGain.gain.setValueAtTime(bassVol, now);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + note.duration * 1.2);

        bassOsc.connect(bassGain);
        bassGain.connect(ctx.destination);

        bassOsc.start(now);
        bassOsc.stop(now + note.duration * 1.2);
      }
    } catch {
      // Safe fallback
    }

    this.bgmStep = (this.bgmStep + 1) % FOLK_MELODY.length;
    this.bgmTimer = setTimeout(() => {
      this.scheduleNextBgmNote();
    }, stepDurationMs);
  }
}

// Export singleton instance
export const soundManager = new SoundManager();
export default soundManager;

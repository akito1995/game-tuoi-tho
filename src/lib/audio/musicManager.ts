/**
 * Vietnamese Childhood Games Portal - Tropical Resort Arcade BGM Engine
 * 
 * Features:
 * - Ultra-rich Polyphonic Tropical Arcade Soundtrack (Meta World style)
 * - Layered Drums (Kick, Snare/Clap, Shaker/Hi-hats), Bouncy Funk Bassline,
 *   Tropical Marimba/Steel-Drum Chords, and Joyful Pentatonic Melody Lead.
 * - 100% Zero-Asset Web Audio API procedural synthesis.
 * - Dynamic BGM Ducking (~65% reduction) during Mascot voice & dialogue.
 * - Autoplay Unlock: Automatically unlocks and starts on first user click/touch.
 */

import { BgmTrackId } from './types';
import { audioSettings } from './audioSettings';

// 124 BPM -> 1 beat = 60 / 124 = 0.4838s -> 1 16th-note step = 0.1209s
const STEP_TIME = 0.121;
const TOTAL_STEPS = 64; // 4 measures of 16 steps (loop length ~ 7.74s)

// Chord progression: Cmaj (steps 0-15) -> Amin (steps 16-31) -> Fmaj (steps 32-47) -> Gdom (steps 48-63)
const CHORD_FREQS: Record<number, number[]> = {
  0: [261.63, 329.63, 392.00, 523.25], // Cmaj (C4, E4, G4, C5)
  1: [220.00, 261.63, 329.63, 440.00], // Amin (A3, C4, E4, A4)
  2: [174.61, 261.63, 349.23, 440.00], // Fmaj (F3, C4, F4, A4)
  3: [196.00, 246.94, 293.66, 392.00], // Gmaj (G3, B3, D4, G4)
};

// Bass notes per bar: Root, 5th, Octave syncopation
const BASS_PATTERNS: Record<number, number[]> = {
  0: [130.81, 196.00, 261.63, 196.00], // C3, G3, C4, G3
  1: [110.00, 164.81, 220.00, 164.81], // A2, E3, A3, E3
  2: [87.31, 130.81, 174.61, 130.81],  // F2, C3, F3, C3
  3: [98.00, 146.83, 196.00, 146.83],  // G2, D3, G3, D3
};

// Upbeat Pentatonic Folk-Pop Lead Melody across 64 steps (0 = rest)
const LEAD_MELODY_STEPS: number[] = [
  // Bar 1 (Cmaj)
  523.25, 0, 587.33, 0, 659.25, 0, 783.99, 659.25,
  0, 523.25, 587.33, 0, 523.25, 0, 0, 0,
  // Bar 2 (Amin)
  440.00, 0, 523.25, 0, 659.25, 0, 587.33, 0,
  523.25, 0, 440.00, 523.25, 440.00, 0, 0, 0,
  // Bar 3 (Fmaj)
  349.23, 0, 440.00, 0, 523.25, 0, 587.33, 0,
  659.25, 587.33, 523.25, 0, 587.33, 0, 0, 0,
  // Bar 4 (Gmaj -> Turnaround)
  783.99, 0, 659.25, 0, 587.33, 0, 523.25, 0,
  587.33, 0, 659.25, 0, 783.99, 0, 880.00, 0,
];

export class MusicManager {
  private ctx: AudioContext | null = null;
  private currentTrack: BgmTrackId = 'bgm.gameplay';
  private isPlaying = false;
  private isDucked = false;
  private bgmMasterGain: GainNode | null = null;
  private stepIndex = 0;
  private loopTimer: ReturnType<typeof setTimeout> | null = null;
  private autoplayUnlocked = false;

  constructor(customCtx?: AudioContext | null) {
    if (customCtx) this.ctx = customCtx;
    audioSettings.subscribe(() => {
      this.handleSettingsChange();
    });
    this.initAutoplayUnlock();
  }

  public setAudioContext(ctx: AudioContext): void {
    this.ctx = ctx;
  }

  public ensureContext(): AudioContext | null {
    if (this.ctx && this.ctx.state !== 'closed') {
      if (this.ctx.state === 'suspended' && this.autoplayUnlocked) {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    }
    if (typeof window === 'undefined') return null;

    try {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    } catch {
      this.ctx = null;
    }
    return this.ctx;
  }

  private getMasterGain(ctx: AudioContext): GainNode {
    if (!this.bgmMasterGain) {
      this.bgmMasterGain = ctx.createGain();
      const vol = audioSettings.getEffectiveVolume('bgm');
      this.bgmMasterGain.gain.setValueAtTime(vol * (this.isDucked ? 0.35 : 1.0), ctx.currentTime);
      this.bgmMasterGain.connect(ctx.destination);
    }
    return this.bgmMasterGain;
  }

  /**
   * Listens for first touch/click on the document to unlock audio and resume BGM
   */
  public initAutoplayUnlock(): void {
    if (typeof window === 'undefined' || this.autoplayUnlocked) return;

    const unlock = () => {
      this.autoplayUnlocked = true;
      const ctx = this.ensureContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      // If BGM is enabled in settings and not already playing, start it smoothly!
      const s = audioSettings.getSettings();
      if (!s.bgmMuted && !this.isPlaying) {
        this.start();
      }
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('click', unlock);
      window.removeEventListener('touchstart', unlock);
    };

    window.addEventListener('pointerdown', unlock, { once: true, passive: true });
    window.addEventListener('keydown', unlock, { once: true, passive: true });
    window.addEventListener('click', unlock, { once: true, passive: true });
    window.addEventListener('touchstart', unlock, { once: true, passive: true });
  }

  public playTrack(trackId: BgmTrackId = 'bgm.gameplay'): void {
    this.currentTrack = trackId;
    this.start();
  }

  public start(): void {
    if (this.isPlaying) return;
    const vol = audioSettings.getEffectiveVolume('bgm');
    if (vol <= 0 || audioSettings.getSettings().bgmMuted) return;

    const ctx = this.ensureContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    this.isPlaying = true;
    this.stepIndex = 0;
    this.scheduleStep();
  }

  public stop(): void {
    this.isPlaying = false;
    if (this.loopTimer) {
      clearTimeout(this.loopTimer);
      this.loopTimer = null;
    }
  }

  public pause(): void {
    this.stop();
  }

  public resume(): void {
    this.start();
  }

  public setDucking(ducked: boolean): void {
    this.isDucked = ducked;
    const ctx = this.ctx;
    if (ctx && this.bgmMasterGain) {
      try {
        const t = ctx.currentTime;
        const vol = audioSettings.getEffectiveVolume('bgm');
        const target = vol * (ducked ? 0.35 : 1.0);
        const rampTime = ducked ? 0.08 : 0.22;
        this.bgmMasterGain.gain.cancelScheduledValues(t);
        this.bgmMasterGain.gain.setTargetAtTime(Math.max(0.001, target), t, rampTime);
      } catch {
        // Safe fallback
      }
    }
  }

  private handleSettingsChange(): void {
    const vol = audioSettings.getEffectiveVolume('bgm');
    if (vol <= 0 || audioSettings.getSettings().bgmMuted) {
      if (this.isPlaying) this.stop();
    } else {
      if (!this.isPlaying) this.start();
      if (this.ctx && this.bgmMasterGain) {
        try {
          const t = this.ctx.currentTime;
          const target = vol * (this.isDucked ? 0.35 : 1.0);
          this.bgmMasterGain.gain.cancelScheduledValues(t);
          this.bgmMasterGain.gain.setTargetAtTime(target, t, 0.1);
        } catch {
          // Safe fallback
        }
      }
    }
  }

  /**
   * Polyphonic multi-track step sequencer
   */
  private scheduleStep(): void {
    if (!this.isPlaying) return;

    const ctx = this.ensureContext();
    if (!ctx) {
      this.loopTimer = setTimeout(() => this.scheduleStep(), 250);
      return;
    }

    const t = ctx.currentTime;
    const masterDest = this.getMasterGain(ctx);
    const step = this.stepIndex % TOTAL_STEPS;
    const bar = Math.floor(step / 16);
    const beatInBar = Math.floor((step % 16) / 4);
    const subStep = step % 4;

    try {
      // ----------------------------------------------------
      // 1. DRUMS: Kick, Snare/Clap & Shaker
      // ----------------------------------------------------
      // Soft Kick on beats 0 and 2 (steps 0 and 8 in bar)
      if (subStep === 0 && (beatInBar === 0 || beatInBar === 2)) {
        const kickOsc = ctx.createOscillator();
        const kickGain = ctx.createGain();
        kickOsc.frequency.setValueAtTime(115, t);
        kickOsc.frequency.exponentialRampToValueAtTime(42, t + 0.08);
        kickGain.gain.setValueAtTime(0.35, t);
        kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
        kickOsc.connect(kickGain);
        kickGain.connect(masterDest);
        kickOsc.start(t);
        kickOsc.stop(t + 0.15);
      }

      // Crisp Clap / Snare on beats 1 and 3 (steps 4 and 12 in bar)
      if (subStep === 0 && (beatInBar === 1 || beatInBar === 3)) {
        const bufferSize = ctx.sampleRate * 0.07;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1400, t);
        filter.Q.setValueAtTime(1.8, t);

        const snareGain = ctx.createGain();
        snareGain.gain.setValueAtTime(0.25, t);
        snareGain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

        noise.connect(filter);
        filter.connect(snareGain);
        snareGain.connect(masterDest);
        noise.start(t);
      }

      // Shaker / Hi-Hat on every 16th note step
      {
        const hSize = Math.floor(ctx.sampleRate * 0.035);
        const hBuffer = ctx.createBuffer(1, hSize, ctx.sampleRate);
        const hData = hBuffer.getChannelData(0);
        for (let i = 0; i < hSize; i++) {
          hData[i] = Math.random() * 2 - 1;
        }
        const hSource = ctx.createBufferSource();
        hSource.buffer = hBuffer;
        const hFilter = ctx.createBiquadFilter();
        hFilter.type = 'highpass';
        hFilter.frequency.setValueAtTime(8000, t);

        const hGain = ctx.createGain();
        const hatVol = subStep === 2 ? 0.14 : 0.08; // subtle groove accent
        hGain.gain.setValueAtTime(hatVol, t);
        hGain.gain.exponentialRampToValueAtTime(0.001, t + 0.032);

        hSource.connect(hFilter);
        hFilter.connect(hGain);
        hGain.connect(masterDest);
        hSource.start(t);
      }

      // ----------------------------------------------------
      // 2. FUNK / POP BASSLINE
      // ----------------------------------------------------
      if (subStep === 0 || subStep === 2) {
        const pattern = BASS_PATTERNS[bar] || BASS_PATTERNS[0];
        const bassNoteIdx = ((beatInBar * 2) + (subStep === 2 ? 1 : 0)) % pattern.length;
        const bassFreq = pattern[bassNoteIdx];

        const bassOsc = ctx.createOscillator();
        const bassGain = ctx.createGain();
        bassOsc.type = 'triangle';
        bassOsc.frequency.setValueAtTime(bassFreq, t);

        bassGain.gain.setValueAtTime(0.001, t);
        bassGain.gain.linearRampToValueAtTime(0.24, t + 0.02);
        bassGain.gain.exponentialRampToValueAtTime(0.001, t + STEP_TIME * 1.8);

        bassOsc.connect(bassGain);
        bassGain.connect(masterDest);
        bassOsc.start(t);
        bassOsc.stop(t + STEP_TIME * 1.85);
      }

      // ----------------------------------------------------
      // 3. TROPICAL MARIMBA CHORDS (Syncopated stabs)
      // ----------------------------------------------------
      if (subStep === 1 || subStep === 3) {
        const chord = CHORD_FREQS[bar] || CHORD_FREQS[0];
        chord.forEach((freq, idx) => {
          const mOsc = ctx.createOscillator();
          const mGain = ctx.createGain();
          mOsc.type = 'sine';
          mOsc.frequency.setValueAtTime(freq, t);

          mGain.gain.setValueAtTime(0.001, t);
          mGain.gain.linearRampToValueAtTime(0.08 / (idx + 1), t + 0.015);
          mGain.gain.exponentialRampToValueAtTime(0.001, t + STEP_TIME * 1.2);

          mOsc.connect(mGain);
          mGain.connect(masterDest);
          mOsc.start(t);
          mOsc.stop(t + STEP_TIME * 1.25);
        });
      }

      // ----------------------------------------------------
      // 4. CHEERFUL VIETNAMESE PENTATONIC LEAD MELODY
      // ----------------------------------------------------
      const leadFreq = LEAD_MELODY_STEPS[step];
      if (leadFreq > 0) {
        const leadOsc = ctx.createOscillator();
        const leadGain = ctx.createGain();
        leadOsc.type = 'sine';
        leadOsc.frequency.setValueAtTime(leadFreq, t);

        // Warm harmonic overtone
        const leadOvertone = ctx.createOscillator();
        leadOvertone.type = 'triangle';
        leadOvertone.frequency.setValueAtTime(leadFreq * 2, t);

        leadGain.gain.setValueAtTime(0.001, t);
        leadGain.gain.linearRampToValueAtTime(0.18, t + 0.03);
        leadGain.gain.exponentialRampToValueAtTime(0.001, t + STEP_TIME * 2.2);

        leadOsc.connect(leadGain);
        leadOvertone.connect(leadGain);
        leadGain.connect(masterDest);

        leadOsc.start(t);
        leadOvertone.start(t);
        leadOsc.stop(t + STEP_TIME * 2.25);
        leadOvertone.stop(t + STEP_TIME * 2.25);
      }
    } catch {
      // Safe audio catch
    }

    this.stepIndex++;
    this.loopTimer = setTimeout(() => {
      this.scheduleStep();
    }, STEP_TIME * 1000);
  }
}

export const musicManager = new MusicManager();
export default musicManager;

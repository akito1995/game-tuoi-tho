/**
 * Vietnamese Childhood Games Portal - SFX Manager
 * High-performance Web Audio API Sound Effects with Priority (P0-P3),
 * Cooldown throttling, and procedural synthesis.
 */

import { SfxId, AudioPriority } from './types';
import { SFX_PRIORITY_MAP } from './audioManifest';
import { audioSettings } from './audioSettings';

export class SfxManager {
  private ctx: AudioContext | null = null;
  private lastPlayTime: Map<SfxId, number> = new Map();
  private lastP0PlayTime = 0;
  private compressor: DynamicsCompressorNode | null = null;
  private cooldownMs: Record<SfxId, number> = {
    'ui.hover': 80,
    'ui.click': 60,
    'ui.confirm': 120,
    'token.step': 140,
    'dice.shake': 250,
    'dice.roll': 300,
    'dice.land': 200,
    'dice.double': 400,
    'coin.gain': 100,
    'coin.loss': 100,
    'property.buy': 300,
    'property.upgrade': 300,
    'card.draw': 250,
    'event.lucky': 400,
    'event.unlucky': 400,
    'event.jackpot': 800,
    'event.surprise': 400,
    'jail.enter': 500,
    'jail.escape': 400,
    'cash.low': 600,
    'bankruptcy': 1000,
    'player.eliminated': 800,
    'turn.start': 300,
    'game.victory': 1500,
    'game.defeat': 1200,
    'game.near_victory': 1000,
  };

  constructor(customCtx?: AudioContext | null) {
    if (customCtx) this.ctx = customCtx;
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

  private getDestination(ctx: AudioContext): AudioNode {
    if (!this.compressor) {
      try {
        const comp = ctx.createDynamicsCompressor();
        comp.threshold.setValueAtTime(-12, ctx.currentTime);
        comp.knee.setValueAtTime(30, ctx.currentTime);
        comp.ratio.setValueAtTime(12, ctx.currentTime);
        comp.attack.setValueAtTime(0.003, ctx.currentTime);
        comp.release.setValueAtTime(0.25, ctx.currentTime);
        comp.connect(ctx.destination);
        this.compressor = comp;
      } catch {
        return ctx.destination;
      }
    }
    return this.compressor || ctx.destination;
  }


  public play(id: SfxId, customVolume = 1.0): void {
    const effectiveVol = audioSettings.getEffectiveVolume('sfx') * customVolume;
    if (effectiveVol <= 0) return;

    const priority = SFX_PRIORITY_MAP[id] || 'P2';
    const now = Date.now();

    // Priority filter: Drop subtle P3 sounds (ui.hover, token.step) during climactic P0 events
    if (priority === 'P3' && now - this.lastP0PlayTime < 1200) {
      return;
    }
    if (priority === 'P0') {
      this.lastP0PlayTime = now;
    }

    // Cooldown check
    const last = this.lastPlayTime.get(id) || 0;
    const minInterval = this.cooldownMs[id] || 80;
    if (now - last < minInterval) return;
    this.lastPlayTime.set(id, now);

    const ctx = this.ensureContext();
    if (!ctx) return;

    try {
      this.synthesizeSfx(id, ctx, effectiveVol);
    } catch {
      // Safe fallback
    }
  }

  /**
   * Expressive Chibi Voice Emote Sound synthesizer (PIG, FOX, CAT, BUFFALO)
   * Guaranteed clear, delightful audio feedback regardless of OS TTS language packs.
   */
  public playChibiEmote(characterId: string, trigger: string): void {
    const effectiveVol = audioSettings.getEffectiveVolume('voice');
    if (effectiveVol <= 0) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const dest = this.getDestination(ctx);
    const t = ctx.currentTime;

    try {
      switch (characterId) {
        case 'CHAR_01': {
          // PIG (Đại ca tự tin): Joyful brass trumpet fanfare
          const notes = [523.25, 659.25, 783.99, 1046.5];
          notes.forEach((freq, idx) => {
            const st = t + idx * 0.07;
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, st);
            g.gain.setValueAtTime(0.001, st);
            g.gain.linearRampToValueAtTime(effectiveVol * 0.22, st + 0.015);
            g.gain.exponentialRampToValueAtTime(0.001, st + 0.18);
            osc.connect(g);
            g.connect(dest);
            osc.start(st);
            osc.stop(st + 0.19);
          });
          break;
        }
        case 'CHAR_02': {
          // FOX (Nữ hoàng cà khịa): Sparkling harp glissando
          const notes = [880.0, 1046.5, 1318.51, 1567.98];
          notes.forEach((freq, idx) => {
            const st = t + idx * 0.05;
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, st);
            g.gain.setValueAtTime(0.001, st);
            g.gain.linearRampToValueAtTime(effectiveVol * 0.26, st + 0.01);
            g.gain.exponentialRampToValueAtTime(0.001, st + 0.22);
            osc.connect(g);
            g.connect(dest);
            osc.start(st);
            osc.stop(st + 0.23);
          });
          break;
        }
        case 'CHAR_03': {
          // CAT (Thánh nhọ hài hước): Cartoon spring boing / wa-wa
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(392, t);
          osc.frequency.exponentialRampToValueAtTime(784, t + 0.14);
          osc.frequency.exponentialRampToValueAtTime(330, t + 0.28);
          g.gain.setValueAtTime(effectiveVol * 0.28, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
          osc.connect(g);
          g.connect(dest);
          osc.start(t);
          osc.stop(t + 0.33);
          break;
        }
        case 'CHAR_04': {
          // BUFFALO (Cao thủ lạnh lùng): Resonant bell of calm mastery
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(220, t);
          osc.frequency.exponentialRampToValueAtTime(110, t + 0.45);
          g.gain.setValueAtTime(effectiveVol * 0.35, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
          osc.connect(g);
          g.connect(dest);
          osc.start(t);
          osc.stop(t + 0.58);
          break;
        }
      }
    } catch {
      // Safe audio catch
    }
  }

  private synthesizeSfx(id: SfxId, ctx: AudioContext, vol: number): void {
    const t = ctx.currentTime;
    const dest = this.getDestination(ctx);

    switch (id) {
      case 'ui.click':
      case 'ui.hover': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(id === 'ui.hover' ? 440 : 800, t);
        osc.frequency.exponentialRampToValueAtTime(160, t + 0.035);
        gain.gain.setValueAtTime(vol * 0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);
        osc.connect(gain);
        gain.connect(dest);
        osc.start(t);
        osc.stop(t + 0.035);
        break;
      }

      case 'ui.confirm': {
        [523.25, 783.99].forEach((f, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const st = t + i * 0.06;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, st);
          gain.gain.setValueAtTime(vol * 0.35, st);
          gain.gain.exponentialRampToValueAtTime(0.001, st + 0.14);
          osc.connect(gain);
          gain.connect(dest);
          osc.start(st);
          osc.stop(st + 0.14);
        });
        break;
      }

      case 'dice.shake':
      case 'dice.roll': {
        const dur = id === 'dice.shake' ? 0.22 : 0.35;
        const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 1.8);
        }
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const flt = ctx.createBiquadFilter();
        flt.type = 'bandpass';
        flt.frequency.setValueAtTime(1100, t);
        flt.Q.setValueAtTime(2.5, t);
        const g = ctx.createGain();
        g.gain.setValueAtTime(vol * 0.4, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        src.connect(flt);
        flt.connect(g);
        g.connect(dest);
        src.start(t);
        break;
      }

      case 'dice.land': {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(240, t);
        osc.frequency.exponentialRampToValueAtTime(70, t + 0.08);
        g.gain.setValueAtTime(vol * 0.5, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        osc.connect(g);
        g.connect(dest);
        osc.start(t);
        osc.stop(t + 0.08);
        break;
      }

      case 'dice.double': {
        [783.99, 1046.5, 1318.51].forEach((f, i) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          const st = t + i * 0.06;
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(f, st);
          g.gain.setValueAtTime(vol * 0.4, st);
          g.gain.exponentialRampToValueAtTime(0.001, st + 0.2);
          osc.connect(g);
          g.connect(dest);
          osc.start(st);
          osc.stop(st + 0.2);
        });
        break;
      }

      case 'token.step': {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320 + Math.random() * 40, t);
        osc.frequency.exponentialRampToValueAtTime(120, t + 0.06);
        g.gain.setValueAtTime(vol * 0.22, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
        osc.connect(g);
        g.connect(dest);
        osc.start(t);
        osc.stop(t + 0.06);
        break;
      }

      case 'coin.gain': {
        [987.77, 1318.51].forEach((f, i) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          const st = t + i * 0.08;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, st);
          g.gain.setValueAtTime(vol * 0.35, st);
          g.gain.exponentialRampToValueAtTime(0.001, st + 0.2);
          osc.connect(g);
          g.connect(dest);
          osc.start(st);
          osc.stop(st + 0.2);
        });
        break;
      }

      case 'coin.loss': {
        [587.33, 440.0].forEach((f, i) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          const st = t + i * 0.08;
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(f, st);
          g.gain.setValueAtTime(vol * 0.3, st);
          g.gain.exponentialRampToValueAtTime(0.001, st + 0.22);
          osc.connect(g);
          g.connect(dest);
          osc.start(st);
          osc.stop(st + 0.22);
        });
        break;
      }

      case 'property.buy':
      case 'property.upgrade': {
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          const st = t + i * 0.07;
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(f, st);
          g.gain.setValueAtTime(vol * 0.35, st);
          g.gain.exponentialRampToValueAtTime(0.001, st + 0.28);
          osc.connect(g);
          g.connect(dest);
          osc.start(st);
          osc.stop(st + 0.28);
        });
        break;
      }

      case 'card.draw': {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, t);
        osc.frequency.exponentialRampToValueAtTime(900, t + 0.14);
        g.gain.setValueAtTime(vol * 0.28, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
        osc.connect(g);
        g.connect(dest);
        osc.start(t);
        osc.stop(t + 0.16);
        break;
      }

      case 'jail.enter': {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(140, t);
        osc.frequency.exponentialRampToValueAtTime(45, t + 0.4);
        g.gain.setValueAtTime(vol * 0.5, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
        osc.connect(g);
        g.connect(dest);
        osc.start(t);
        osc.stop(t + 0.4);
        break;
      }

      case 'jail.escape': {
        [440, 659.25, 880].forEach((f, i) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          const st = t + i * 0.08;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, st);
          g.gain.setValueAtTime(vol * 0.35, st);
          g.gain.exponentialRampToValueAtTime(0.001, st + 0.25);
          osc.connect(g);
          g.connect(dest);
          osc.start(st);
          osc.stop(st + 0.25);
        });
        break;
      }

      case 'event.jackpot': {
        [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98].forEach((f, i) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          const st = t + i * 0.07;
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(f, st);
          g.gain.setValueAtTime(vol * 0.45, st);
          g.gain.exponentialRampToValueAtTime(0.001, st + 0.45);
          osc.connect(g);
          g.connect(dest);
          osc.start(st);
          osc.stop(st + 0.45);
        });
        break;
      }

      case 'bankruptcy':
      case 'game.defeat': {
        [392, 349.23, 311.13, 261.63].forEach((f, i) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          const st = t + i * 0.16;
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(f, st);
          g.gain.setValueAtTime(vol * 0.35, st);
          g.gain.exponentialRampToValueAtTime(0.001, st + 0.35);
          osc.connect(g);
          g.connect(dest);
          osc.start(st);
          osc.stop(st + 0.35);
        });
        break;
      }

      case 'game.victory': {
        [523.25, 523.25, 523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          const st = t + i * 0.11;
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(f, st);
          g.gain.setValueAtTime(vol * 0.5, st);
          g.gain.exponentialRampToValueAtTime(0.001, st + 0.4);
          osc.connect(g);
          g.connect(dest);
          osc.start(st);
          osc.stop(st + 0.4);
        });
        break;
      }

      default: {
        // Generic fallback pleasant blip
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, t);
        g.gain.setValueAtTime(vol * 0.25, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        osc.connect(g);
        g.connect(dest);
        osc.start(t);
        osc.stop(t + 0.1);
        break;
      }
    }
  }
}

export const sfxManager = new SfxManager();
export default sfxManager;

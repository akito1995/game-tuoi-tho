/**
 * Vietnamese Childhood Games Portal - Audio Settings Manager
 * Independent volume & mute controls for Master, BGM, SFX, and Voice
 */

import { AudioSettingsState } from './types';

const STORAGE_KEY = 'co_ty_phu_audio_settings_v2';

export const DEFAULT_AUDIO_SETTINGS: AudioSettingsState = {
  masterVolume: 1.0,
  bgmVolume: 0.65,
  sfxVolume: 0.85,
  voiceVolume: 0.9,
  masterMuted: false,
  bgmMuted: false,
  sfxMuted: false,
  voiceMuted: false,
};

type SettingsListener = (settings: AudioSettingsState) => void;

export class AudioSettingsManager {
  private settings: AudioSettingsState = { ...DEFAULT_AUDIO_SETTINGS };
  private listeners: Set<SettingsListener> = new Set();

  constructor() {
    this.load();
  }

  public getSettings(): AudioSettingsState {
    return { ...this.settings };
  }

  public getEffectiveVolume(type: 'bgm' | 'sfx' | 'voice'): number {
    if (this.settings.masterMuted) return 0;
    const master = this.settings.masterVolume;
    switch (type) {
      case 'bgm':
        return this.settings.bgmMuted ? 0 : master * this.settings.bgmVolume;
      case 'sfx':
        return this.settings.sfxMuted ? 0 : master * this.settings.sfxVolume;
      case 'voice':
        return this.settings.voiceMuted ? 0 : master * this.settings.voiceVolume;
      default:
        return master;
    }
  }

  public setMasterVolume(val: number): void {
    this.settings.masterVolume = Math.max(0, Math.min(1, val));
    this.notify();
  }

  public setBgmVolume(val: number): void {
    this.settings.bgmVolume = Math.max(0, Math.min(1, val));
    this.notify();
  }

  public setSfxVolume(val: number): void {
    this.settings.sfxVolume = Math.max(0, Math.min(1, val));
    this.notify();
  }

  public setVoiceVolume(val: number): void {
    this.settings.voiceVolume = Math.max(0, Math.min(1, val));
    this.notify();
  }

  public toggleMasterMute(): boolean {
    this.settings.masterMuted = !this.settings.masterMuted;
    this.notify();
    return this.settings.masterMuted;
  }

  public toggleBgmMute(): boolean {
    this.settings.bgmMuted = !this.settings.bgmMuted;
    this.notify();
    return this.settings.bgmMuted;
  }

  public toggleSfxMute(): boolean {
    this.settings.sfxMuted = !this.settings.sfxMuted;
    this.notify();
    return this.settings.sfxMuted;
  }

  public toggleVoiceMute(): boolean {
    this.settings.voiceMuted = !this.settings.voiceMuted;
    this.notify();
    return this.settings.voiceMuted;
  }

  public subscribe(listener: SettingsListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.save();
    this.listeners.forEach((listener) => {
      try {
        listener(this.getSettings());
      } catch {
        // Safe listener failure isolation
      }
    });
  }

  private load(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          this.settings = {
            ...DEFAULT_AUDIO_SETTINGS,
            ...parsed,
          };
        }
      }
    } catch {
      // Safe fallback
    }
  }

  private save(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
      }
    } catch {
      // Safe fallback
    }
  }
}

export const audioSettings = new AudioSettingsManager();
export default audioSettings;

/**
 * Vietnamese Childhood Games Portal - Master Audio Manager Facade
 * Unified coordinator for SFX, Music, Voice, and Audio Settings
 */

import { SfxId, BgmTrackId, CharacterId, VoiceTriggerId, AudioSettingsState } from './types';
import { sfxManager, SfxManager } from './sfxManager';
import { musicManager, MusicManager } from './musicManager';
import { voiceManager, VoiceManager } from './voiceManager';
import { audioSettings, AudioSettingsManager } from './audioSettings';

export class AudioManager {
  public sfx: SfxManager = sfxManager;
  public music: MusicManager = musicManager;
  public voice: VoiceManager = voiceManager;
  public settings: AudioSettingsManager = audioSettings;

  private userInteracted = false;

  constructor() {
    this.setupAutoplayUnlock();
  }

  public playSfx(id: SfxId, volumeScale = 1.0): void {
    this.sfx.play(id, volumeScale);
  }

  public playMusic(trackId: BgmTrackId): void {
    this.music.playTrack(trackId);
  }

  public stopMusic(): void {
    this.music.stop();
  }

  public playVoice(characterId: CharacterId, trigger: VoiceTriggerId): boolean {
    return this.voice.playVoice(characterId, trigger);
  }

  public getSettings(): AudioSettingsState {
    return this.settings.getSettings();
  }

  public unlockAudio(): void {
    if (this.userInteracted) return;
    this.userInteracted = true;
    this.sfx.ensureContext();
    this.music.ensureContext();
  }

  private setupAutoplayUnlock(): void {
    if (typeof window === 'undefined') return;

    const unlockHandler = () => {
      this.unlockAudio();
      window.removeEventListener('pointerdown', unlockHandler);
      window.removeEventListener('keydown', unlockHandler);
    };

    window.addEventListener('pointerdown', unlockHandler, { passive: true });
    window.addEventListener('keydown', unlockHandler, { passive: true });
  }
}

export const audioManager = new AudioManager();
export default audioManager;

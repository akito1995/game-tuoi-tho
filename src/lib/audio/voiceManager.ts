/**
 * Vietnamese Childhood Games Portal - Voice Manager
 * Handles 4 character voice personalities with anti-spam cooldown,
 * priority queues, BGM ducking, and browser Web Speech API (vi-VN) synthesis fallback.
 */

import { CharacterId, VoiceTriggerId } from './types';
import { CHARACTER_PROFILES, VOICE_SCRIPT_BANK } from './audioManifest';
import { audioSettings } from './audioSettings';
import { musicManager } from './musicManager';

export class VoiceManager {
  private lastVoiceTime = 0;
  private minCooldownMs = 2800; // 2.8s minimum cooldown between voice lines
  private isSpeaking = false;

  public playVoice(characterId: CharacterId, trigger: VoiceTriggerId): boolean {
    const effectiveVol = audioSettings.getEffectiveVolume('voice');
    if (effectiveVol <= 0) return false;

    // Anti-spam cooldown check (unless P0 trigger like victory or bankruptcy)
    const now = Date.now();
    const isP0Trigger = trigger === 'victory' || trigger === 'bankruptcy' || trigger === 'jackpot';
    if (!isP0Trigger && now - this.lastVoiceTime < this.minCooldownMs) {
      return false;
    }

    // Find script line
    const match = VOICE_SCRIPT_BANK.find(
      (item) => item.characterId === characterId && item.trigger === trigger
    );
    if (!match) return false;

    this.lastVoiceTime = now;
    const profile = CHARACTER_PROFILES[characterId];

    // Trigger BGM ducking
    this.isSpeaking = true;
    musicManager.setDucking(true);

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel(); // Cancel any lingering speech

        const utterance = new SpeechSynthesisUtterance(match.textVi);
        utterance.lang = 'vi-VN';
        utterance.volume = effectiveVol;
        utterance.pitch = profile?.pitch || 1.0;
        utterance.rate = profile?.rate || 1.0;

        utterance.onend = () => {
          this.isSpeaking = false;
          musicManager.setDucking(false);
        };

        utterance.onerror = () => {
          this.isSpeaking = false;
          musicManager.setDucking(false);
        };

        window.speechSynthesis.speak(utterance);
        return true;
      } catch {
        this.isSpeaking = false;
        musicManager.setDucking(false);
      }
    } else {
      // Auto-restore ducking after estimated reading duration
      const estimatedDurationMs = Math.max(1500, match.textVi.length * 75);
      setTimeout(() => {
        this.isSpeaking = false;
        musicManager.setDucking(false);
      }, estimatedDurationMs);
    }

    return true;
  }

  public stopAll(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Safe fallback
      }
    }
    this.isSpeaking = false;
    musicManager.setDucking(false);
  }
}

export const voiceManager = new VoiceManager();
export default voiceManager;

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
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private duckingSafetyTimer: ReturnType<typeof setTimeout> | null = null;
  private duckingListeners: Set<(ducked: boolean) => void> = new Set();

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  public onDucking(listener: (ducked: boolean) => void): () => void {
    this.duckingListeners.add(listener);
    return () => this.duckingListeners.delete(listener);
  }

  private notifyDucking(ducked: boolean): void {
    musicManager.setDucking(ducked);
    this.duckingListeners.forEach((fn) => {
      try {
        fn(ducked);
      } catch {
        // Safe callback isolation
      }
    });
  }

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

    // Clear any pending ducking safety recovery timer
    if (this.duckingSafetyTimer) {
      clearTimeout(this.duckingSafetyTimer);
      this.duckingSafetyTimer = null;
    }

    // Trigger BGM ducking
    this.isSpeaking = true;
    this.notifyDucking(true);

    const onComplete = () => {
      if (this.duckingSafetyTimer) {
        clearTimeout(this.duckingSafetyTimer);
        this.duckingSafetyTimer = null;
      }
      this.isSpeaking = false;
      this.currentUtterance = null;
      this.notifyDucking(false);
    };

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel(); // Cancel any lingering speech

        const utterance = new SpeechSynthesisUtterance(match.textVi);
        utterance.lang = 'vi-VN';
        utterance.volume = effectiveVol;
        utterance.pitch = profile?.pitch || 1.0;
        utterance.rate = profile?.rate || 1.0;

        utterance.onend = onComplete;
        utterance.onerror = onComplete;

        // Keep persistent reference to prevent Chromium GC premature termination
        this.currentUtterance = utterance;

        // Fallback safety timeout (6.5s) to guarantee ducking restoration
        this.duckingSafetyTimer = setTimeout(onComplete, 6500);

        window.speechSynthesis.speak(utterance);
        return true;
      } catch {
        onComplete();
      }
    } else {
      // Auto-restore ducking after estimated reading duration
      const estimatedDurationMs = Math.max(1500, match.textVi.length * 75);
      this.duckingSafetyTimer = setTimeout(onComplete, estimatedDurationMs);
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
    if (this.duckingSafetyTimer) {
      clearTimeout(this.duckingSafetyTimer);
      this.duckingSafetyTimer = null;
    }
    this.isSpeaking = false;
    this.currentUtterance = null;
    this.notifyDucking(false);
  }
}

export const voiceManager = new VoiceManager();
export default voiceManager;

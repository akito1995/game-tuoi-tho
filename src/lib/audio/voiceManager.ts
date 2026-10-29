/**
 * Vietnamese Childhood Games Portal - Voice Manager
 * Handles 4 character voice personalities with anti-spam cooldown,
 * priority queues, BGM ducking, and browser Web Speech API (vi-VN) synthesis fallback.
 */

import { CharacterId, VoiceTriggerId } from './types';
import { CHARACTER_PROFILES, VOICE_SCRIPT_BANK } from './audioManifest';
import { audioSettings } from './audioSettings';
import { musicManager } from './musicManager';
import { sfxManager } from './sfxManager';

export interface DialogueEvent {
  characterId: CharacterId;
  trigger: VoiceTriggerId;
  textVi: string;
  timestamp: number;
}

export class VoiceManager {
  private lastVoiceTime = 0;
  private minCooldownMs = 2800; // 2.8s minimum cooldown between voice lines
  private isSpeaking = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private duckingSafetyTimer: ReturnType<typeof setTimeout> | null = null;
  private duckingListeners: Set<(ducked: boolean) => void> = new Set();
  private dialogueListeners: Set<(event: DialogueEvent) => void> = new Set();

  public onDialogue(listener: (event: DialogueEvent) => void): () => void {
    this.dialogueListeners.add(listener);
    return () => this.dialogueListeners.delete(listener);
  }

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

    // Broadcast dialogue event to UI subscribers (3D Speech Bubble & HUD Banner)
    const dialogueEvt: DialogueEvent = {
      characterId,
      trigger,
      textVi: match.textVi,
      timestamp: now,
    };
    this.dialogueListeners.forEach((fn) => {
      try {
        fn(dialogueEvt);
      } catch {
        // Safe callback isolation
      }
    });

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

    // Check if genuine Vietnamese speech synthesis is available
    let hasViVoice = false;
    let viVoice: SpeechSynthesisVoice | null = null;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        const voices = window.speechSynthesis.getVoices();
        viVoice = voices.find(
          (v) =>
            v.lang.toLowerCase().startsWith('vi') ||
            v.lang.toLowerCase().includes('vie') ||
            v.name.toLowerCase().includes('vietnam')
        ) || null;
        hasViVoice = viVoice !== null;
      } catch {
        hasViVoice = false;
      }
    }

    if (hasViVoice && viVoice && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(match.textVi);
        utterance.voice = viVoice;
        utterance.lang = viVoice.lang || 'vi-VN';
        utterance.volume = effectiveVol;
        utterance.pitch = profile?.pitch || 1.0;
        utterance.rate = profile?.rate || 1.0;

        utterance.onend = onComplete;
        utterance.onerror = onComplete;
        this.currentUtterance = utterance;
        this.duckingSafetyTimer = setTimeout(onComplete, 6500);

        window.speechSynthesis.speak(utterance);
        return true;
      } catch {
        onComplete();
      }
    } else {
      // If no genuine Vietnamese voice exists in the browser/OS:
      // NEVER allow English voice fallback (which produces unintelligible gibberish).
      // Instead, play delightful Chibi Emote audio and display Speech Bubble & Dialogue Banner!
      sfxManager.playChibiEmote(characterId, trigger);
      this.duckingSafetyTimer = setTimeout(onComplete, 1600);
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

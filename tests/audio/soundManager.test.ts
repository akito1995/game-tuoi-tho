import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { soundManager, SoundManager, type SoundSettings } from '@/lib/audio/soundManager';

class MockAudioParam {
  value: number;
  setValueAtTime = vi.fn((val: number) => { this.value = val; return this; });
  linearRampToValueAtTime = vi.fn((val: number) => { this.value = val; return this; });
  exponentialRampToValueAtTime = vi.fn((val: number) => { this.value = val; return this; });
  constructor(initial = 0) {
    this.value = initial;
  }
}

class MockGainNode {
  gain = new MockAudioParam(1);
  connect = vi.fn();
  disconnect = vi.fn();
}

class MockOscillatorNode {
  type = 'sine';
  frequency = new MockAudioParam(440);
  detune = new MockAudioParam(0);
  connect = vi.fn();
  disconnect = vi.fn();
  start = vi.fn();
  stop = vi.fn();
}

class MockBiquadFilterNode {
  type = 'lowpass';
  frequency = new MockAudioParam(1000);
  Q = new MockAudioParam(1);
  connect = vi.fn();
  disconnect = vi.fn();
}

class MockAudioBuffer {
  length: number;
  numberOfChannels: number;
  sampleRate: number;
  private channelData: Float32Array;
  constructor(channels: number, length: number, sampleRate: number) {
    this.numberOfChannels = channels;
    this.length = length;
    this.sampleRate = sampleRate;
    this.channelData = new Float32Array(length);
  }
  getChannelData() { return this.channelData; }
}

class MockAudioBufferSourceNode {
  buffer: MockAudioBuffer | null = null;
  loop = false;
  connect = vi.fn();
  disconnect = vi.fn();
  start = vi.fn();
  stop = vi.fn();
}

class MockAudioContext {
  state: 'suspended' | 'running' | 'closed' = 'running';
  currentTime = 0;
  destination = {};
  createGain = vi.fn(() => new MockGainNode());
  createOscillator = vi.fn(() => new MockOscillatorNode());
  createBiquadFilter = vi.fn(() => new MockBiquadFilterNode());
  createBuffer = vi.fn((channels: number, length: number, sampleRate: number) => new MockAudioBuffer(channels, length, sampleRate));
  createBufferSource = vi.fn(() => new MockAudioBufferSourceNode());
  resume = vi.fn().mockResolvedValue(undefined);
  close = vi.fn().mockResolvedValue(undefined);
}

describe('SoundManager', () => {
  let mockStorage: Record<string, string> = {};

  beforeEach(() => {
    mockStorage = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => mockStorage[key] ?? null),
      setItem: vi.fn((key: string, value: string) => { mockStorage[key] = value; }),
      removeItem: vi.fn((key: string) => { delete mockStorage[key]; }),
      clear: vi.fn(() => { mockStorage = {}; }),
    });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('SSR and Missing AudioContext Environment', () => {
    it('executes all sound effect methods without error when AudioContext is null', () => {
      const manager = new SoundManager({ audioContext: null });

      expect(() => manager.playDiceRoll()).not.toThrow();
      expect(() => manager.playCoinSound()).not.toThrow();
      expect(() => manager.playBuildSound()).not.toThrow();
      expect(() => manager.playJailSound()).not.toThrow();
      expect(() => manager.playDoubleDiceSound()).not.toThrow();
      expect(() => manager.playBankruptSound()).not.toThrow();
      expect(() => manager.playWinFanfare()).not.toThrow();
      expect(() => manager.playCardDrawSound()).not.toThrow();
      expect(() => manager.playClickSound()).not.toThrow();
    });

    it('executes BGM methods without error when AudioContext is null', () => {
      const manager = new SoundManager({ audioContext: null });

      expect(() => manager.startBgm()).not.toThrow();
      expect(() => manager.stopBgm()).not.toThrow();
      expect(() => manager.toggleBgm()).not.toThrow();
    });
  });

  describe('Settings and Persistence', () => {
    it('initializes with sensible default settings', () => {
      const manager = new SoundManager({ audioContext: null });
      const settings = manager.getSettings();

      expect(settings).toEqual({
        bgmEnabled: true,
        sfxEnabled: true,
        volume: 0.7,
      });
    });

    it('clamps volume between 0 and 1', () => {
      const manager = new SoundManager({ audioContext: null });

      manager.setVolume(0.5);
      expect(manager.getSettings().volume).toBe(0.5);

      manager.setVolume(-0.2);
      expect(manager.getSettings().volume).toBe(0);

      manager.setVolume(1.8);
      expect(manager.getSettings().volume).toBe(1);
    });

    it('toggles SFX and accepts explicit boolean value', () => {
      const manager = new SoundManager({ audioContext: null });

      expect(manager.getSettings().sfxEnabled).toBe(true);
      const res1 = manager.toggleSfx();
      expect(res1).toBe(false);
      expect(manager.getSettings().sfxEnabled).toBe(false);

      const res2 = manager.toggleSfx(true);
      expect(res2).toBe(true);
      expect(manager.getSettings().sfxEnabled).toBe(true);

      const res3 = manager.toggleSfx(true);
      expect(res3).toBe(true);
      expect(manager.getSettings().sfxEnabled).toBe(true);
    });

    it('toggles BGM and accepts explicit boolean value', () => {
      const manager = new SoundManager({ audioContext: null });

      expect(manager.getSettings().bgmEnabled).toBe(true);
      const res1 = manager.toggleBgm();
      expect(res1).toBe(false);
      expect(manager.getSettings().bgmEnabled).toBe(false);

      const res2 = manager.toggleBgm(true);
      expect(res2).toBe(true);
      expect(manager.getSettings().bgmEnabled).toBe(true);
    });

    it('persists settings to localStorage', () => {
      const manager = new SoundManager({ audioContext: null });

      manager.setVolume(0.4);
      manager.toggleBgm(false);
      manager.toggleSfx(false);

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'vietnam_monopoly_sound_settings',
        JSON.stringify({ bgmEnabled: false, sfxEnabled: false, volume: 0.4 })
      );
    });

    it('restores settings from localStorage on creation', () => {
      mockStorage['vietnam_monopoly_sound_settings'] = JSON.stringify({
        bgmEnabled: false,
        sfxEnabled: true,
        volume: 0.35,
      });

      const manager = new SoundManager({ audioContext: null });
      expect(manager.getSettings()).toEqual({
        bgmEnabled: false,
        sfxEnabled: true,
        volume: 0.35,
      });
    });

    it('handles corrupted localStorage data gracefully', () => {
      mockStorage['vietnam_monopoly_sound_settings'] = '{ invalid json }}}';

      const manager = new SoundManager({ audioContext: null });
      expect(manager.getSettings()).toEqual({
        bgmEnabled: true,
        sfxEnabled: true,
        volume: 0.7,
      });
    });

    it('handles localStorage throwing exceptions safely', () => {
      vi.stubGlobal('localStorage', {
        getItem: () => { throw new Error('Quota exceeded'); },
        setItem: () => { throw new Error('Quota exceeded'); },
      });

      expect(() => {
        const manager = new SoundManager({ audioContext: null });
        manager.setVolume(0.5);
      }).not.toThrow();
    });
  });

  describe('Procedural Web Audio Synthesis', () => {
    let mockCtx: MockAudioContext;
    let manager: SoundManager;

    beforeEach(() => {
      mockCtx = new MockAudioContext();
      manager = new SoundManager({ audioContext: mockCtx as unknown as AudioContext });
    });

    it('resumes suspended AudioContext on sound trigger', () => {
      mockCtx.state = 'suspended';
      manager.playClickSound();

      expect(mockCtx.resume).toHaveBeenCalled();
    });

    it('does not play sounds when SFX is disabled', () => {
      manager.toggleSfx(false);
      mockCtx.createOscillator.mockClear();
      mockCtx.createBufferSource.mockClear();

      manager.playCoinSound();
      manager.playDiceRoll();
      manager.playBuildSound();
      manager.playJailSound();

      expect(mockCtx.createOscillator).not.toHaveBeenCalled();
      expect(mockCtx.createBufferSource).not.toHaveBeenCalled();
    });

    it('playClickSound creates a quick subtle audio pulse', () => {
      manager.playClickSound();

      expect(mockCtx.createOscillator).toHaveBeenCalled();
      expect(mockCtx.createGain).toHaveBeenCalled();
    });

    it('playCoinSound creates high cheerful melodic coin tones', () => {
      manager.playCoinSound();

      expect(mockCtx.createOscillator).toHaveBeenCalled();
      expect(mockCtx.createGain).toHaveBeenCalled();
    });

    it('playDiceRoll creates noise buffer or rhythmic dice rattles', () => {
      manager.playDiceRoll();

      expect(mockCtx.createBuffer).toHaveBeenCalled();
      expect(mockCtx.createBufferSource).toHaveBeenCalled();
      expect(mockCtx.createBiquadFilter).toHaveBeenCalled();
    });

    it('playBuildSound creates ascending harmonic chimes', () => {
      manager.playBuildSound();

      expect(mockCtx.createOscillator).toHaveBeenCalled();
      expect(mockCtx.createGain).toHaveBeenCalled();
    });

    it('playJailSound synthesizes metallic heavy clank with resonant filter', () => {
      manager.playJailSound();

      expect(mockCtx.createOscillator).toHaveBeenCalled();
      expect(mockCtx.createGain).toHaveBeenCalled();
    });

    it('playDoubleDiceSound creates an excited fanfare flourish', () => {
      manager.playDoubleDiceSound();

      expect(mockCtx.createOscillator).toHaveBeenCalled();
      expect(mockCtx.createGain).toHaveBeenCalled();
    });

    it('playBankruptSound synthesizes descending minor tones', () => {
      manager.playBankruptSound();

      expect(mockCtx.createOscillator).toHaveBeenCalled();
      expect(mockCtx.createGain).toHaveBeenCalled();
    });

    it('playWinFanfare plays a victorious triumphant sequence', () => {
      manager.playWinFanfare();

      expect(mockCtx.createOscillator).toHaveBeenCalled();
      expect(mockCtx.createGain).toHaveBeenCalled();
    });

    it('playCardDrawSound creates paper swoosh or chime', () => {
      manager.playCardDrawSound();

      expect(mockCtx.createOscillator).toHaveBeenCalled();
      expect(mockCtx.createGain).toHaveBeenCalled();
    });
  });

  describe('Vietnamese Pentatonic BGM Engine', () => {
    let mockCtx: MockAudioContext;
    let manager: SoundManager;

    beforeEach(() => {
      mockCtx = new MockAudioContext();
      manager = new SoundManager({ audioContext: mockCtx as unknown as AudioContext });
    });

    it('starts BGM and schedules notes when BGM is enabled', () => {
      manager.startBgm();

      expect(mockCtx.createOscillator).toHaveBeenCalled();
      expect(mockCtx.createGain).toHaveBeenCalled();

      // Advancing timer schedules subsequent melody notes in pentatonic progression
      vi.advanceTimersByTime(2000);
      expect(mockCtx.createOscillator.mock.calls.length).toBeGreaterThan(1);
    });

    it('does not start BGM if bgmEnabled is false', () => {
      manager.toggleBgm(false);
      mockCtx.createOscillator.mockClear();

      manager.startBgm();
      expect(mockCtx.createOscillator).not.toHaveBeenCalled();
    });

    it('stops BGM cleanly and clears interval timers', () => {
      manager.startBgm();
      const initialCallCount = mockCtx.createOscillator.mock.calls.length;

      manager.stopBgm();

      // Advancing timer after stopping should not trigger new oscillators
      vi.advanceTimersByTime(3000);
      expect(mockCtx.createOscillator.mock.calls.length).toBe(initialCallCount);
    });

    it('stopping BGM when toggleBgm(false) is called', () => {
      manager.startBgm();
      const initialCount = mockCtx.createOscillator.mock.calls.length;

      manager.toggleBgm(false);
      vi.advanceTimersByTime(3000);
      expect(mockCtx.createOscillator.mock.calls.length).toBe(initialCount);
    });

    it('resuming BGM when toggleBgm(true) is called', () => {
      manager.toggleBgm(false);
      manager.toggleBgm(true);

      expect(mockCtx.createOscillator).toHaveBeenCalled();
    });
  });

  describe('Default singleton instance', () => {
    it('exports soundManager singleton instance', () => {
      expect(soundManager).toBeDefined();
      expect(typeof soundManager.playDiceRoll).toBe('function');
      expect(typeof soundManager.playEmoteSound).toBe('function');
      expect(typeof soundManager.getSettings).toBe('function');
    });

    it('plays emote sound effects without throwing', () => {
      expect(() => soundManager.playEmoteSound('❤️')).not.toThrow();
      expect(() => soundManager.playEmoteSound('🩴')).not.toThrow();
      expect(() => soundManager.playEmoteSound('💸')).not.toThrow();
      expect(() => soundManager.playEmoteSound('😂')).not.toThrow();
    });
  });
});

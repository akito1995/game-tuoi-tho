/**
 * Vietnamese Childhood Games Portal - Audio System Types
 * Based on Audio Design Brief v1.0
 */

export type AudioPriority = 'P0' | 'P1' | 'P2' | 'P3';

export type SfxId =
  | 'ui.hover'
  | 'ui.click'
  | 'ui.confirm'
  | 'dice.shake'
  | 'dice.roll'
  | 'dice.land'
  | 'dice.double'
  | 'token.step'
  | 'coin.gain'
  | 'coin.loss'
  | 'property.buy'
  | 'property.upgrade'
  | 'card.draw'
  | 'event.lucky'
  | 'event.unlucky'
  | 'event.jackpot'
  | 'event.surprise'
  | 'jail.enter'
  | 'jail.escape'
  | 'cash.low'
  | 'bankruptcy'
  | 'player.eliminated'
  | 'turn.start'
  | 'game.victory'
  | 'game.defeat'
  | 'game.near_victory';

export type BgmTrackId =
  | 'bgm.lobby'
  | 'bgm.gameplay'
  | 'bgm.climax'
  | 'bgm.victory_defeat';

export type CharacterId = 'CHAR_01' | 'CHAR_02' | 'CHAR_03' | 'CHAR_04';

export interface CharacterVoiceProfile {
  id: CharacterId;
  name: string;
  archetype: string;
  voiceDesc: string;
  actingStyle: string;
  pitch: number;
  rate: number;
}

export type VoiceTriggerId =
  | 'turn.start'
  | 'dice.roll'
  | 'property.buy'
  | 'money.gain'
  | 'money.loss'
  | 'rent.pay'
  | 'event.lucky'
  | 'event.unlucky'
  | 'jail.enter'
  | 'jail.escape'
  | 'jackpot'
  | 'opponent.win'
  | 'bankruptcy'
  | 'victory';

export interface AudioSettingsState {
  masterVolume: number; // 0..1
  bgmVolume: number; // 0..1
  sfxVolume: number; // 0..1
  voiceVolume: number; // 0..1
  masterMuted: boolean;
  bgmMuted: boolean;
  sfxMuted: boolean;
  voiceMuted: boolean;
}

export interface VoiceLineItem {
  id: string;
  characterId: CharacterId;
  trigger: VoiceTriggerId;
  textVi: string;
  audioPath?: string;
}

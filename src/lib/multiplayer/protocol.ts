/**
 * Vietnamese Childhood Games Portal - WebRTC P2P Multiplayer Protocol
 *
 * Defines typed message packets exchanged over WebRTC DataChannels between
 * Host and Peers, with JSON serialization/deserialization and packet validation.
 */

import { GameState } from '@/lib/game-engine/types';
import { MascotType } from '@/lib/game-engine/types';
import { ChatMessage, ActiveEmote } from '@/lib/multiplayer/chatStore';

export type GameMode = 'PASS_AND_PLAY' | 'BOT_AI' | 'ONLINE_P2P';

export type RoomStatus = 'IDLE' | 'LOBBY' | 'STARTING' | 'PLAYING' | 'ENDED';

export interface LobbyPlayer {
  id: string;
  name: string;
  mascot: MascotType;
  isHost: boolean;
  isReady: boolean;
  isBot: boolean;
  connected?: boolean;
}

export interface RoomState {
  roomId: string;
  mode: GameMode;
  players: LobbyPlayer[];
  hostId: string;
  status: RoomStatus;
  maxPlayers: number;
}

export type GameActionType =
  | 'ROLL_DICE'
  | 'BUY_PROPERTY'
  | 'UPGRADE_PROPERTY'
  | 'PAY_JAIL_BAIL'
  | 'USE_JAIL_FREE'
  | 'DRAW_CARD'
  | 'APPLY_CARD'
  | 'END_TURN';

export interface ActionRequestPayload {
  action: GameActionType;
  playerId: string;
  tileId?: number;
  deckType?: 'CHANCE' | 'FATE';
  diceOverride?: [number, number];
}

export type NetworkPacketType =
  | 'LOBBY_JOIN'
  | 'LOBBY_UPDATE'
  | 'PLAYER_READY'
  | 'MASCOT_CHANGE'
  | 'START_GAME'
  | 'STATE_SYNC'
  | 'ACTION_REQUEST'
  | 'CHAT_SYNC'
  | 'EMOTE_SYNC'
  | 'HEARTBEAT'
  | 'PONG';

export interface BasePacket {
  type: NetworkPacketType;
  senderId: string;
  timestamp: number;
}

export interface LobbyJoinPacket extends BasePacket {
  type: 'LOBBY_JOIN';
  payload: {
    player: LobbyPlayer;
  };
}

export interface LobbyUpdatePacket extends BasePacket {
  type: 'LOBBY_UPDATE';
  payload: {
    room: RoomState;
  };
}

export interface PlayerReadyPacket extends BasePacket {
  type: 'PLAYER_READY';
  payload: {
    playerId: string;
    isReady: boolean;
  };
}

export interface MascotChangePacket extends BasePacket {
  type: 'MASCOT_CHANGE';
  payload: {
    playerId: string;
    mascot: MascotType;
  };
}

export interface StartGamePacket extends BasePacket {
  type: 'START_GAME';
  payload: {
    roomId: string;
    players: LobbyPlayer[];
    initialGameState?: Partial<GameState>;
  };
}

export interface StateSyncPacket extends BasePacket {
  type: 'STATE_SYNC';
  payload: {
    gameState: GameState;
    actionTriggeredBy?: string;
  };
}

export interface ActionRequestPacket extends BasePacket {
  type: 'ACTION_REQUEST';
  payload: ActionRequestPayload;
}

export interface ChatSyncPacket extends BasePacket {
  type: 'CHAT_SYNC';
  payload: ChatMessage;
}

export interface EmoteSyncPacket extends BasePacket {
  type: 'EMOTE_SYNC';
  payload: ActiveEmote;
}

export interface HeartbeatPacket extends BasePacket {
  type: 'HEARTBEAT';
  payload: {
    seq: number;
  };
}

export interface PongPacket extends BasePacket {
  type: 'PONG';
  payload: {
    seq: number;
  };
}

export type NetworkPacket =
  | LobbyJoinPacket
  | LobbyUpdatePacket
  | PlayerReadyPacket
  | MascotChangePacket
  | StartGamePacket
  | StateSyncPacket
  | ActionRequestPacket
  | ChatSyncPacket
  | EmoteSyncPacket
  | HeartbeatPacket
  | PongPacket;

/**
 * Creates a strongly-typed network packet
 */
export function createPacket<T extends NetworkPacketType>(
  type: T,
  senderId: string,
  payload: Extract<NetworkPacket, { type: T }>['payload']
): Extract<NetworkPacket, { type: T }> {
  return {
    type,
    senderId,
    timestamp: Date.now(),
    payload,
  } as Extract<NetworkPacket, { type: T }>;
}

/**
 * Serializes a NetworkPacket to a JSON string for WebRTC transmission
 */
export function serializePacket(packet: NetworkPacket): string {
  return JSON.stringify(packet);
}

/**
 * Safely deserializes raw WebRTC DataChannel message (string or object) into a validated NetworkPacket
 */
export function deserializePacket(raw: unknown): NetworkPacket | null {
  try {
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!data || typeof data !== 'object') {
      return null;
    }

    const { type, senderId, timestamp, payload } = data as Record<string, unknown>;

    if (
      typeof type !== 'string' ||
      typeof senderId !== 'string' ||
      typeof timestamp !== 'number' ||
      payload === undefined
    ) {
      return null;
    }

    const validTypes: NetworkPacketType[] = [
      'LOBBY_JOIN',
      'LOBBY_UPDATE',
      'PLAYER_READY',
      'MASCOT_CHANGE',
      'START_GAME',
      'STATE_SYNC',
      'ACTION_REQUEST',
      'CHAT_SYNC',
      'EMOTE_SYNC',
      'HEARTBEAT',
      'PONG',
    ];

    if (!validTypes.includes(type as NetworkPacketType)) {
      return null;
    }

    return data as NetworkPacket;
  } catch {
    return null;
  }
}


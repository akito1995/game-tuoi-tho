import { describe, it, expect, beforeEach } from 'vitest';
import {
  useRoomStore,
  generateRoomPin,
  generateSimplePin,
  ALL_MASCOTS,
  MASCOT_INFO,
} from '@/lib/multiplayer/roomStore';
import {
  createPacket,
  serializePacket,
  deserializePacket,
  StateSyncPacket,
  LobbyUpdatePacket,
  ActionRequestPacket,
  ChatSyncPacket,
} from '@/lib/multiplayer/protocol';
import { GameState } from '@/lib/game-engine/types';
import { BOARD_TILES } from '@/lib/game-engine/boardData';

describe('Multiplayer RoomStore & Protocol', () => {
  beforeEach(() => {
    useRoomStore.getState().resetRoom();
  });

  describe('PIN Generation', () => {
    it('generates standard prefix room PIN like TYPHU-XXXX', () => {
      const pin = generateRoomPin('TYPHU');
      expect(pin).toMatch(/^TYPHU-[A-Z0-9]{4}$/);
    });

    it('generates unique PINs across multiple invocations', () => {
      const pin1 = generateRoomPin();
      const pin2 = generateRoomPin();
      expect(pin1).not.toBe(pin2);
    });

    it('generates a clean 6-character simple PIN', () => {
      const pin = generateSimplePin(6);
      expect(pin).toHaveLength(6);
      expect(pin).toMatch(/^[A-Z0-9]{6}$/);
    });
  });

  describe('Host Room Initialization', () => {
    it('initializes host room with default host player and mode', () => {
      const roomId = useRoomStore.getState().initHostRoom(undefined, 'Chủ Phòng', 'ONLINE_P2P', 'PIG');
      const state = useRoomStore.getState();

      expect(roomId).toBeTruthy();
      expect(state.roomId).toBe(roomId);
      expect(state.isHost).toBe(true);
      expect(state.mode).toBe('ONLINE_P2P');
      expect(state.status).toBe('LOBBY');
      expect(state.players).toHaveLength(1);

      const hostPlayer = state.players[0];
      expect(hostPlayer.name).toBe('Chủ Phòng');
      expect(hostPlayer.isHost).toBe(true);
      expect(hostPlayer.isReady).toBe(true);
      expect(hostPlayer.isBot).toBe(false);
      expect(hostPlayer.mascot).toBe('PIG');
    });

    it('supports Pass & Play and Bot AI mode initialization', () => {
      useRoomStore.getState().initHostRoom('TEST-PASS', 'Người Chơi 1', 'PASS_AND_PLAY');
      expect(useRoomStore.getState().mode).toBe('PASS_AND_PLAY');

      useRoomStore.getState().setMode('BOT_AI');
      expect(useRoomStore.getState().mode).toBe('BOT_AI');
    });
  });

  describe('Player Joining & Leaving', () => {
    it('allows players to join and preserves their unique IDs', () => {
      useRoomStore.getState().initHostRoom('ROOM-123', 'Host');

      const p2 = useRoomStore.getState().addPlayer({ name: 'Khách 1' });
      expect(p2).not.toBeNull();
      expect(useRoomStore.getState().players).toHaveLength(2);

      const p3 = useRoomStore.getState().addPlayer({ name: 'Khách 2' });
      expect(p3).not.toBeNull();
      expect(useRoomStore.getState().players).toHaveLength(3);

      expect(p2?.id).not.toBe(p3?.id);
    });

    it('removes players cleanly by ID', () => {
      useRoomStore.getState().initHostRoom('ROOM-123', 'Host');
      const p2 = useRoomStore.getState().addPlayer({ name: 'Khách 1' });
      expect(useRoomStore.getState().players).toHaveLength(2);

      if (p2) {
        useRoomStore.getState().removePlayer(p2.id);
      }
      expect(useRoomStore.getState().players).toHaveLength(1);
      expect(useRoomStore.getState().players[0].name).toBe('Host');
    });

    it('caps room at 4 players maximum', () => {
      useRoomStore.getState().initHostRoom('ROOM-123', 'Host');
      useRoomStore.getState().addPlayer({ name: 'P2' });
      useRoomStore.getState().addPlayer({ name: 'P3' });
      useRoomStore.getState().addPlayer({ name: 'P4' });
      expect(useRoomStore.getState().players).toHaveLength(4);

      const p5 = useRoomStore.getState().addPlayer({ name: 'P5' });
      expect(p5).toBeNull();
      expect(useRoomStore.getState().players).toHaveLength(4);
    });
  });

  describe('Mascot Uniqueness & Selection', () => {
    it('automatically assigns unused mascots to incoming players', () => {
      useRoomStore.getState().initHostRoom('ROOM-123', 'Host', 'ONLINE_P2P', 'PIG');
      const p2 = useRoomStore.getState().addPlayer({ name: 'Khách 1' });
      const p3 = useRoomStore.getState().addPlayer({ name: 'Khách 2' });
      const p4 = useRoomStore.getState().addPlayer({ name: 'Khách 3' });

      const allAssigned = [
        useRoomStore.getState().players[0].mascot,
        p2?.mascot,
        p3?.mascot,
        p4?.mascot,
      ];

      // All 4 mascots should be completely distinct
      const uniqueMascots = new Set(allAssigned);
      expect(uniqueMascots.size).toBe(4);
      expect(allAssigned).toContain('PIG');
      expect(allAssigned).toContain('FOX');
      expect(allAssigned).toContain('CAT');
      expect(allAssigned).toContain('BUFFALO');
    });

    it('rejects duplicate mascot selection if already claimed by another player', () => {
      useRoomStore.getState().initHostRoom('ROOM-123', 'Host', 'ONLINE_P2P', 'PIG');
      const p2 = useRoomStore.getState().addPlayer({ name: 'Khách 1', mascot: 'FOX' });
      expect(p2?.mascot).toBe('FOX');

      // Player 2 attempts to change to PIG (Host's mascot)
      const success = useRoomStore.getState().updatePlayerMascot(p2!.id, 'PIG');
      expect(success).toBe(false);

      // Player 2's mascot should remain FOX
      const updatedP2 = useRoomStore.getState().players.find((p) => p.id === p2!.id);
      expect(updatedP2?.mascot).toBe('FOX');
    });

    it('allows switching to an unclaimed mascot', () => {
      useRoomStore.getState().initHostRoom('ROOM-123', 'Host', 'ONLINE_P2P', 'PIG');
      const p2 = useRoomStore.getState().addPlayer({ name: 'Khách 1', mascot: 'FOX' });

      // Change to CAT (which is free)
      const success = useRoomStore.getState().updatePlayerMascot(p2!.id, 'CAT');
      expect(success).toBe(true);

      const updatedP2 = useRoomStore.getState().players.find((p) => p.id === p2!.id);
      expect(updatedP2?.mascot).toBe('CAT');
    });

    it('correctly tracks available mascots', () => {
      useRoomStore.getState().initHostRoom('ROOM-123', 'Host', 'ONLINE_P2P', 'PIG');
      let free = useRoomStore.getState().getAvailableMascots();
      expect(free).not.toContain('PIG');
      expect(free).toContain('FOX');
      expect(free).toContain('CAT');
      expect(free).toContain('BUFFALO');

      useRoomStore.getState().addPlayer({ name: 'Khách 1', mascot: 'FOX' });
      free = useRoomStore.getState().getAvailableMascots();
      expect(free).toEqual(['CAT', 'BUFFALO']);
    });
  });

  describe('Bot Filling', () => {
    it('fills all remaining slots with bots with ready state and unique mascots', () => {
      useRoomStore.getState().initHostRoom('ROOM-123', 'Host', 'BOT_AI', 'PIG');
      expect(useRoomStore.getState().players).toHaveLength(1);

      useRoomStore.getState().fillWithBots();

      const players = useRoomStore.getState().players;
      expect(players).toHaveLength(4);

      const bots = players.filter((p) => p.isBot);
      expect(bots).toHaveLength(3);
      bots.forEach((bot) => {
        expect(bot.isReady).toBe(true);
      });

      const allMascots = players.map((p) => p.mascot);
      expect(new Set(allMascots).size).toBe(4);
    });

    it('allows removing individual bots', () => {
      useRoomStore.getState().initHostRoom('ROOM-123', 'Host', 'BOT_AI', 'PIG');
      useRoomStore.getState().fillWithBots();

      const bot = useRoomStore.getState().players.find((p) => p.isBot);
      expect(bot).toBeDefined();

      useRoomStore.getState().removeBot(bot!.id);
      expect(useRoomStore.getState().players).toHaveLength(3);
      expect(useRoomStore.getState().players.some((p) => p.id === bot!.id)).toBe(false);
    });
  });

  describe('Ready Toggles & Game Start Readiness', () => {
    it('toggles player ready state correctly', () => {
      useRoomStore.getState().initHostRoom('ROOM-123', 'Host', 'ONLINE_P2P');
      const p2 = useRoomStore.getState().addPlayer({ name: 'Khách 1' });
      expect(p2?.isReady).toBe(false);

      useRoomStore.getState().toggleReady(p2!.id);
      let updatedP2 = useRoomStore.getState().players.find((p) => p.id === p2!.id);
      expect(updatedP2?.isReady).toBe(true);

      useRoomStore.getState().toggleReady(p2!.id, false);
      updatedP2 = useRoomStore.getState().players.find((p) => p.id === p2!.id);
      expect(updatedP2?.isReady).toBe(false);
    });

    it('requires at least 2 players and non-host players ready to start in ONLINE_P2P', () => {
      useRoomStore.getState().initHostRoom('ROOM-123', 'Host', 'ONLINE_P2P');
      // Only 1 player
      expect(useRoomStore.getState().canStartGame()).toBe(false);

      const p2 = useRoomStore.getState().addPlayer({ name: 'Khách 1' });
      // 2 players, but P2 is not ready
      expect(useRoomStore.getState().canStartGame()).toBe(false);

      useRoomStore.getState().toggleReady(p2!.id, true);
      // P2 ready!
      expect(useRoomStore.getState().canStartGame()).toBe(true);

      // Start game transitions state to PLAYING
      const started = useRoomStore.getState().startGame();
      expect(started).toBe(true);
      expect(useRoomStore.getState().status).toBe('PLAYING');
    });

    it('allows starting immediately in BOT_AI mode when bots are filled', () => {
      useRoomStore.getState().initHostRoom('ROOM-123', 'Host', 'BOT_AI');
      useRoomStore.getState().fillWithBots();

      expect(useRoomStore.getState().canStartGame()).toBe(true);
      expect(useRoomStore.getState().startGame()).toBe(true);
    });
  });

  describe('Network Packet Serialization & Deserialization', () => {
    it('serializes and deserializes LOBBY_UPDATE packet correctly', () => {
      const roomState = {
        roomId: 'TYPHU-99',
        mode: 'ONLINE_P2P' as const,
        players: [
          { id: 'p1', name: 'Host', mascot: 'PIG' as const, isHost: true, isReady: true, isBot: false },
          { id: 'p2', name: 'Khách', mascot: 'FOX' as const, isHost: false, isReady: true, isBot: false },
        ],
        hostId: 'p1',
        status: 'LOBBY' as const,
        maxPlayers: 4,
      };

      const packet: LobbyUpdatePacket = createPacket('LOBBY_UPDATE', 'p1', { room: roomState });
      const serialized = serializePacket(packet);
      const parsed = deserializePacket(serialized) as LobbyUpdatePacket;

      expect(parsed).not.toBeNull();
      expect(parsed.type).toBe('LOBBY_UPDATE');
      expect(parsed.senderId).toBe('p1');
      expect(parsed.payload.room.roomId).toBe('TYPHU-99');
      expect(parsed.payload.room.players).toHaveLength(2);
    });

    it('serializes and deserializes STATE_SYNC packet with full GameState', () => {
      const mockGameState: GameState = {
        players: [
          {
            id: 'player_1',
            name: 'Bé Heo',
            mascot: 'PIG',
            money: 2000000,
            position: 5,
            inJail: false,
            jailTurns: 0,
            properties: [1, 2],
            bankrupt: false,
            isBot: false,
          },
        ],
        activePlayerIndex: 0,
        dice: [3, 4],
        isDouble: false,
        doubleStreak: 0,
        gamePhase: 'WAITING',
        jackpotFund: 100000,
        tiles: BOARD_TILES.slice(0, 5),
        currentCard: null,
        winner: null,
        eventLogs: ['Trận đấu bắt đầu'],
        currentRound: 1,
      };

      const packet: StateSyncPacket = createPacket('STATE_SYNC', 'host_id', {
        gameState: mockGameState,
        actionTriggeredBy: 'player_1',
      });

      const serialized = serializePacket(packet);
      const parsed = deserializePacket(serialized) as StateSyncPacket;

      expect(parsed).not.toBeNull();
      expect(parsed.type).toBe('STATE_SYNC');
      expect(parsed.payload.gameState.activePlayerIndex).toBe(0);
      expect(parsed.payload.gameState.dice).toEqual([3, 4]);
      expect(parsed.payload.gameState.players[0].money).toBe(2000000);
      expect(parsed.payload.actionTriggeredBy).toBe('player_1');
    });

    it('serializes and deserializes ACTION_REQUEST packet', () => {
      const packet: ActionRequestPacket = createPacket('ACTION_REQUEST', 'guest_1', {
        action: 'BUY_PROPERTY',
        playerId: 'guest_1',
        tileId: 6,
      });

      const serialized = serializePacket(packet);
      const parsed = deserializePacket(serialized) as ActionRequestPacket;

      expect(parsed).not.toBeNull();
      expect(parsed.type).toBe('ACTION_REQUEST');
      expect(parsed.payload.action).toBe('BUY_PROPERTY');
      expect(parsed.payload.tileId).toBe(6);
    });

    it('serializes and deserializes CHAT_SYNC packet', () => {
      const packet: ChatSyncPacket = createPacket('CHAT_SYNC', 'p1', {
        id: 'msg_1',
        senderId: 'p1',
        senderName: 'Bé Heo',
        mascot: 'PIG',
        text: 'Cứu tui với bà con ơi! 🚑',
        timestamp: 123456789,
        isQuickChat: true,
      });

      const serialized = serializePacket(packet);
      const parsed = deserializePacket(serialized) as ChatSyncPacket;

      expect(parsed).not.toBeNull();
      expect(parsed.type).toBe('CHAT_SYNC');
      expect(parsed.payload.text).toBe('Cứu tui với bà con ơi! 🚑');
      expect(parsed.payload.isQuickChat).toBe(true);
    });

    it('safely rejects invalid or malformed packet data', () => {
      expect(deserializePacket('invalid json')).toBeNull();
      expect(deserializePacket(null)).toBeNull();
      expect(deserializePacket({})).toBeNull();
      expect(deserializePacket({ type: 'UNKNOWN_TYPE', senderId: 'abc' })).toBeNull();
    });
  });
});

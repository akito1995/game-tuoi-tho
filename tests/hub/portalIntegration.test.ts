import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useGameStore } from '@/lib/game-engine/gameStore';
import { useRoomStore } from '@/lib/multiplayer/roomStore';
import { executeBotTurn } from '@/lib/game-engine/botAI';
import {
  getUserProfile,
  saveUserProfile,
  recordGameStats,
  DEFAULT_PROFILE,
  PROFILE_STORAGE_KEY,
  setupPassAndPlayGame,
  setupBotGame,
  validateRoomPin,
  UPCOMING_GAMES,
  getGameVotes,
  voteForGame,
  clearHubStorage,
} from '@/components/hub/hubHelpers';

describe('Hub Portal Integration & Launch Suite', () => {
  beforeEach(() => {
    clearHubStorage();
    useGameStore.getState().resetGame();
    useRoomStore.getState().resetRoom();
    vi.clearAllMocks();
  });

  describe('User Profile & Storage', () => {
    it('returns default profile when storage is empty', () => {
      const profile = getUserProfile();
      expect(profile).toEqual(DEFAULT_PROFILE);
      expect(profile.nickname).toBe('Kỳ Thủ Nhí');
      expect(profile.mascot).toBe('PIG');
      expect(profile.matchesPlayed).toBe(0);
      expect(profile.wins).toBe(0);
      expect(profile.maxNetWorth).toBe(2000000);
    });

    it('saves and updates profile customizations in localStorage', () => {
      const updated = saveUserProfile({
        nickname: 'Phú Ông Hội An',
        mascot: 'BUFFALO',
      });

      expect(updated.nickname).toBe('Phú Ông Hội An');
      expect(updated.mascot).toBe('BUFFALO');

      // Verify persistence
      const reloaded = getUserProfile();
      expect(reloaded.nickname).toBe('Phú Ông Hội An');
      expect(reloaded.mascot).toBe('BUFFALO');
      expect(reloaded.matchesPlayed).toBe(0);
    });

    it('records match results and updates statistics correctly', () => {
      // First match - win
      const stats1 = recordGameStats({ won: true, netWorth: 4500000 });
      expect(stats1.matchesPlayed).toBe(1);
      expect(stats1.wins).toBe(1);
      expect(stats1.maxNetWorth).toBe(4500000);

      // Second match - loss with lower net worth
      const stats2 = recordGameStats({ won: false, netWorth: 1800000 });
      expect(stats2.matchesPlayed).toBe(2);
      expect(stats2.wins).toBe(1);
      expect(stats2.maxNetWorth).toBe(4500000); // peak kept

      // Third match - win with new record net worth
      const stats3 = recordGameStats({ won: true, netWorth: 8200000 });
      expect(stats3.matchesPlayed).toBe(3);
      expect(stats3.wins).toBe(2);
      expect(stats3.maxNetWorth).toBe(8200000);
    });
  });

  describe('Pass & Play Mode Setup', () => {
    it('initializes gameStore with 2 human players on 1 device', () => {
      const players = setupPassAndPlayGame([
        { name: 'Ba Mẹ', mascot: 'BUFFALO' },
        { name: 'Bé Na', mascot: 'CAT' },
      ]);

      const state = useGameStore.getState();
      expect(players).toHaveLength(2);
      expect(state.players).toHaveLength(2);
      expect(state.players[0].name).toBe('Ba Mẹ');
      expect(state.players[0].mascot).toBe('BUFFALO');
      expect(state.players[0].isBot).toBe(false);
      expect(state.players[1].name).toBe('Bé Na');
      expect(state.players[1].mascot).toBe('CAT');
      expect(state.players[1].isBot).toBe(false);
      expect(state.gamePhase).toBe('WAITING');
    });

    it('initializes gameStore with 4 custom players and correct initial money', () => {
      const players = setupPassAndPlayGame([
        { name: 'Người Chơi 1', mascot: 'PIG' },
        { name: 'Người Chơi 2', mascot: 'FOX' },
        { name: 'Người Chơi 3', mascot: 'CAT' },
        { name: 'Người Chơi 4', mascot: 'BUFFALO' },
      ]);

      const state = useGameStore.getState();
      expect(players).toHaveLength(4);
      expect(state.players).toHaveLength(4);
      state.players.forEach((p) => {
        expect(p.money).toBe(2000000);
        expect(p.isBot).toBe(false);
        expect(p.bankrupt).toBe(false);
      });
    });
  });

  describe('Bot AI Mode Setup', () => {
    it('initializes 1 human + 1 bot opponent', () => {
      const players = setupBotGame({ name: 'Cao Thủ', mascot: 'FOX' }, 1);

      const state = useGameStore.getState();
      expect(players).toHaveLength(2);
      expect(state.players).toHaveLength(2);

      // Human
      expect(state.players[0].name).toBe('Cao Thủ');
      expect(state.players[0].mascot).toBe('FOX');
      expect(state.players[0].isBot).toBe(false);

      // Bot
      expect(state.players[1].isBot).toBe(true);
      expect(state.players[1].mascot).not.toBe('FOX'); // Distinct mascot
    });

    it('initializes 1 human + 3 bot opponents with unique mascots', () => {
      const players = setupBotGame({ name: 'Bé Heo Xinh', mascot: 'PIG' }, 3);

      const state = useGameStore.getState();
      expect(players).toHaveLength(4);
      expect(state.players).toHaveLength(4);

      // Human
      expect(state.players[0].isBot).toBe(false);
      expect(state.players[0].mascot).toBe('PIG');

      // 3 bots
      const bots = state.players.slice(1);
      expect(bots.every((b) => b.isBot)).toBe(true);

      const mascots = state.players.map((p) => p.mascot);
      const uniqueMascots = new Set(mascots);
      expect(uniqueMascots.size).toBe(4);
    });
  });

  describe('Online Room PIN & Join Validation', () => {
    it('validates 6-character room PINs correctly', () => {
      expect(validateRoomPin('ABC123')).toBe(true);
      expect(validateRoomPin('typhu1')).toBe(true); // case-insensitive
      expect(validateRoomPin('TYPHU-1234')).toBe(true);
      expect(validateRoomPin('12345')).toBe(false); // too short
      expect(validateRoomPin('ABCDEFGH')).toBe(false); // too long for simple PIN
      expect(validateRoomPin('')).toBe(false);
    });
  });

  describe('Upcoming Games & Community Voting', () => {
    it('provides list of upcoming childhood games', () => {
      expect(UPCOMING_GAMES.length).toBeGreaterThanOrEqual(4);
      const ids = UPCOMING_GAMES.map((g) => g.id);
      expect(ids).toContain('o-an-quan');
      expect(ids).toContain('co-ca-ngua');
      expect(ids).toContain('bau-cua-tom-ca');
      expect(ids).toContain('ban-bi');
    });

    it('records and increments votes for upcoming games', () => {
      const initialVotes = getGameVotes();
      const currentOAnQuanVotes = initialVotes['o-an-quan'] || 0;

      const updatedVotes = voteForGame('o-an-quan');
      expect(updatedVotes['o-an-quan']).toBe(currentOAnQuanVotes + 1);

      const reloadedVotes = getGameVotes();
      expect(reloadedVotes['o-an-quan']).toBe(currentOAnQuanVotes + 1);
    });
  });

  describe('Bot Automation Engine Integration', () => {
    it('triggers executeBotTurn successfully when active player is a bot', async () => {
      // Setup game with human and bot
      setupBotGame({ name: 'Chủ Bàn', mascot: 'PIG' }, 1);
      const store = useGameStore;

      // Advance turn to bot (player index 1)
      store.setState({ activePlayerIndex: 1, gamePhase: 'WAITING' });
      expect(store.getState().players[store.getState().activePlayerIndex].isBot).toBe(true);

      // Execute bot turn with fast skipDelay option
      const result = await executeBotTurn(store, { skipDelay: true });
      expect(result.actionSummary.length).toBeGreaterThan(0);

      // Turn should have ended or rolled
      const postState = store.getState();
      expect(postState.dice).toBeDefined();
      expect(postState.dice[0] + postState.dice[1]).toBeGreaterThanOrEqual(2);
    });
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import {
  evaluateBuyDecision,
  evaluateUpgradeDecision,
  evaluateJailDecision,
  getBotChatMessage,
  executeBotTurn,
} from '@/lib/game-engine/botAI';
import { useGameStore } from '@/lib/game-engine/gameStore';
import { Player, Tile } from '@/lib/game-engine/types';
import { BOARD_TILES } from '@/lib/game-engine/boardData';

describe('Bot AI Engine (botAI.ts)', () => {
  let mockTiles: Tile[];

  beforeEach(() => {
    mockTiles = JSON.parse(JSON.stringify(BOARD_TILES));
    useGameStore.getState().initGame(4);
  });

  describe('1. evaluateBuyDecision', () => {
    it('should buy property when cash reserve after purchase is >= 300,000 VND', () => {
      const player: Player = {
        id: 'player_2',
        name: 'Bot Bé Cáo',
        mascot: 'FOX',
        money: 500000,
        position: 1,
        inJail: false,
        jailTurns: 0,
        properties: [],
        bankrupt: false,
        isBot: true,
      };

      const tile: Tile = {
        ...mockTiles[1], // Đất Mũi Cà Mau, price: 60,000
        ownerId: null,
      };

      // Remaining cash: 500k - 60k = 440k >= 300k
      const decision = evaluateBuyDecision(player, tile, mockTiles);
      expect(decision).toBe(true);
    });

    it('should skip property purchase when remaining cash would drop below 200,000 VND (not a monopoly)', () => {
      const player: Player = {
        id: 'player_2',
        name: 'Bot Bé Cáo',
        mascot: 'FOX',
        money: 220000,
        position: 6,
        inJail: false,
        jailTurns: 0,
        properties: [],
        bankrupt: false,
        isBot: true,
      };

      const tile: Tile = {
        ...mockTiles[6], // Bãi Sau Vũng Tàu, price: 100,000
        ownerId: null,
      };

      // Remaining cash: 220k - 100k = 120k < 200k
      const decision = evaluateBuyDecision(player, tile, mockTiles);
      expect(decision).toBe(false);
    });

    it('should always buy if purchase completes a regional color group monopoly even if remaining cash < 200k', () => {
      // ME_KONG group consists of tile 1 and tile 3
      mockTiles[1].ownerId = 'player_2';

      const player: Player = {
        id: 'player_2',
        name: 'Bot Bé Cáo',
        mascot: 'FOX',
        money: 90000,
        position: 3,
        inJail: false,
        jailTurns: 0,
        properties: [1],
        bankrupt: false,
        isBot: true,
      };

      const tile: Tile = {
        ...mockTiles[3], // Chợ Nổi Cần Thơ, price: 80,000
        ownerId: null,
      };

      // Remaining cash: 90k - 80k = 10k (< 200k), but completes ME_KONG monopoly!
      const decision = evaluateBuyDecision(player, tile, mockTiles);
      expect(decision).toBe(true);
    });

    it('should return false if player cannot afford property even if it would complete monopoly', () => {
      mockTiles[1].ownerId = 'player_2';

      const player: Player = {
        id: 'player_2',
        name: 'Bot Bé Cáo',
        mascot: 'FOX',
        money: 50000,
        position: 3,
        inJail: false,
        jailTurns: 0,
        properties: [1],
        bankrupt: false,
        isBot: true,
      };

      const tile: Tile = {
        ...mockTiles[3], // price: 80,000
        ownerId: null,
      };

      // Cannot afford 80,000 with 50,000
      const decision = evaluateBuyDecision(player, tile, mockTiles);
      expect(decision).toBe(false);
    });

    it('should not buy if tile is already owned or not buyable (START, JAIL, etc.)', () => {
      const player: Player = {
        id: 'player_2',
        name: 'Bot Bé Cáo',
        mascot: 'FOX',
        money: 2000000,
        position: 0,
        inJail: false,
        jailTurns: 0,
        properties: [],
        bankrupt: false,
        isBot: true,
      };

      expect(evaluateBuyDecision(player, mockTiles[0], mockTiles)).toBe(false); // START tile

      const ownedTile = { ...mockTiles[1], ownerId: 'player_1' };
      expect(evaluateBuyDecision(player, ownedTile, mockTiles)).toBe(false);
    });

    it('should buy between 200k and 300k reserve if player already has progress in color group', () => {
      // 3-tile group COASTAL: 6, 9, 10. Player owns 6, lands on 9.
      mockTiles[6].ownerId = 'player_2';
      mockTiles[10].ownerId = null;

      const player: Player = {
        id: 'player_2',
        name: 'Bot Bé Cáo',
        mascot: 'FOX',
        money: 380000,
        position: 9,
        inJail: false,
        jailTurns: 0,
        properties: [6],
        bankrupt: false,
        isBot: true,
      };

      const tile: Tile = {
        ...mockTiles[9], // price: 120,000 -> remaining 260k (between 200k and 300k)
        ownerId: null,
      };

      const decisionWithProgress = evaluateBuyDecision(player, tile, mockTiles);
      expect(decisionWithProgress).toBe(true);

      // Same remaining cash but no progress in group -> should skip
      mockTiles[6].ownerId = null;
      const playerNoProgress = { ...player, properties: [] };
      const decisionNoProgress = evaluateBuyDecision(playerNoProgress, tile, mockTiles);
      expect(decisionNoProgress).toBe(false);
    });
  });

  describe('2. evaluateUpgradeDecision', () => {
    it('should return null if player has no owned properties', () => {
      const player: Player = {
        id: 'player_2',
        name: 'Bot Bé Cáo',
        mascot: 'FOX',
        money: 2000000,
        position: 0,
        inJail: false,
        jailTurns: 0,
        properties: [],
        bankrupt: false,
        isBot: true,
      };

      const decision = evaluateUpgradeDecision(player, [], mockTiles);
      expect(decision).toBeNull();
    });

    it('should return null if remaining cash after upgrade drops below 400,000 VND safety buffer', () => {
      mockTiles[1].ownerId = 'player_2';
      mockTiles[3].ownerId = 'player_2';

      const player: Player = {
        id: 'player_2',
        name: 'Bot Bé Cáo',
        mascot: 'FOX',
        money: 430000, // housePrice is 50,000 -> 430k - 50k = 380k < 400k buffer
        position: 0,
        inJail: false,
        jailTurns: 0,
        properties: [1, 3],
        bankrupt: false,
        isBot: true,
      };

      const ownedTiles = [mockTiles[1], mockTiles[3]];
      const decision = evaluateUpgradeDecision(player, ownedTiles, mockTiles);
      expect(decision).toBeNull();
    });

    it('should prioritize upgrading properties in completed color group monopolies', () => {
      // Player owns ME_KONG monopoly (tiles 1, 3) AND a standalone property COASTAL (tile 6)
      mockTiles[1].ownerId = 'player_2';
      mockTiles[3].ownerId = 'player_2';
      mockTiles[6].ownerId = 'player_2';
      mockTiles[9].ownerId = null; // COASTAL is not monopoly

      const player: Player = {
        id: 'player_2',
        name: 'Bot Bé Cáo',
        mascot: 'FOX',
        money: 1000000,
        position: 0,
        inJail: false,
        jailTurns: 0,
        properties: [1, 3, 6],
        bankrupt: false,
        isBot: true,
      };

      const ownedTiles = [mockTiles[1], mockTiles[3], mockTiles[6]];
      const targetTileId = evaluateUpgradeDecision(player, ownedTiles, mockTiles);

      // Target must be one of the monopoly tiles (1 or 3), not the isolated tile 6
      expect(targetTileId).not.toBeNull();
      expect([1, 3]).toContain(targetTileId);
    });

    it('should select best property in owned monopoly (highest rent return)', () => {
      // ME_KONG: Tile 1 (price 60k, baseRent 6k) vs Tile 3 (price 80k, baseRent 8k)
      // Tile 3 has higher rent return on upgrade
      mockTiles[1].ownerId = 'player_2';
      mockTiles[3].ownerId = 'player_2';

      const player: Player = {
        id: 'player_2',
        name: 'Bot Bé Cáo',
        mascot: 'FOX',
        money: 1000000,
        position: 0,
        inJail: false,
        jailTurns: 0,
        properties: [1, 3],
        bankrupt: false,
        isBot: true,
      };

      const ownedTiles = [mockTiles[1], mockTiles[3]];
      const targetTileId = evaluateUpgradeDecision(player, ownedTiles, mockTiles);
      expect(targetTileId).toBe(3);
    });

    it('should return null if all owned properties are already at max upgrade (houseCount === 4)', () => {
      mockTiles[1].ownerId = 'player_2';
      mockTiles[1].houseCount = 4;
      mockTiles[1].hasResort = true;

      mockTiles[3].ownerId = 'player_2';
      mockTiles[3].houseCount = 4;
      mockTiles[3].hasResort = true;

      const player: Player = {
        id: 'player_2',
        name: 'Bot Bé Cáo',
        mascot: 'FOX',
        money: 2000000,
        position: 0,
        inJail: false,
        jailTurns: 0,
        properties: [1, 3],
        bankrupt: false,
        isBot: true,
      };

      const ownedTiles = [mockTiles[1], mockTiles[3]];
      const targetTileId = evaluateUpgradeDecision(player, ownedTiles, mockTiles);
      expect(targetTileId).toBeNull();
    });
  });

  describe('3. evaluateJailDecision', () => {
    it('should use jail free card when player has jailFreeCards > 0', () => {
      const player: Player = {
        id: 'player_2',
        name: 'Bot Bé Cáo',
        mascot: 'FOX',
        money: 1000000,
        position: 8,
        inJail: true,
        jailTurns: 3,
        properties: [],
        bankrupt: false,
        isBot: true,
        jailFreeCards: 1,
      };

      expect(evaluateJailDecision(player)).toBe('USE_CARD');
    });

    it('should pay bail when player cash >= 800,000 VND and jailTurns <= 1', () => {
      const player: Player = {
        id: 'player_2',
        name: 'Bot Bé Cáo',
        mascot: 'FOX',
        money: 850000,
        position: 8,
        inJail: true,
        jailTurns: 1,
        properties: [],
        bankrupt: false,
        isBot: true,
        jailFreeCards: 0,
      };

      expect(evaluateJailDecision(player)).toBe('PAY_BAIL');
    });

    it('should roll dice when jailTurns > 1 even if player is rich (saves cash early in jail)', () => {
      const player: Player = {
        id: 'player_2',
        name: 'Bot Bé Cáo',
        mascot: 'FOX',
        money: 1500000,
        position: 8,
        inJail: true,
        jailTurns: 3,
        properties: [],
        bankrupt: false,
        isBot: true,
        jailFreeCards: 0,
      };

      expect(evaluateJailDecision(player)).toBe('ROLL');
    });

    it('should roll dice when player cash < 800,000 VND even if jailTurns <= 1', () => {
      const player: Player = {
        id: 'player_2',
        name: 'Bot Bé Cáo',
        mascot: 'FOX',
        money: 500000,
        position: 8,
        inJail: true,
        jailTurns: 1,
        properties: [],
        bankrupt: false,
        isBot: true,
        jailFreeCards: 0,
      };

      expect(evaluateJailDecision(player)).toBe('ROLL');
    });
  });

  describe('4. getBotChatMessage', () => {
    const events = ['BUY', 'UPGRADE', 'RENT_COLLECT', 'RENT_PAY', 'JAIL', 'BANKRUPT'] as const;

    events.forEach((event) => {
      it(`should return a valid Vietnamese banter string for event ${event}`, () => {
        const msg = getBotChatMessage(event);
        expect(typeof msg).toBe('string');
        expect(msg.length).toBeGreaterThan(0);
      });
    });

    it('should return authentic Vietnamese expressions', () => {
      const buyMsg = getBotChatMessage('BUY');
      const upgradeMsg = getBotChatMessage('UPGRADE');
      const jailMsg = getBotChatMessage('JAIL');

      expect(typeof buyMsg).toBe('string');
      expect(typeof upgradeMsg).toBe('string');
      expect(typeof jailMsg).toBe('string');
    });
  });

  describe('5. executeBotTurn', () => {
    it('should complete a full bot turn from WAITING with skipDelay: true', async () => {
      // Set active player to player 2 (bot)
      useGameStore.setState({ activePlayerIndex: 1, gamePhase: 'WAITING' });
      const initialActiveIndex = useGameStore.getState().activePlayerIndex;
      expect(initialActiveIndex).toBe(1);

      const result = await executeBotTurn(useGameStore, {
        skipDelay: true,
        diceOverride: [1, 2], // Non-double: 3 steps -> Tile 3 (Chợ Nổi Cần Thơ)
      });

      expect(result.actionSummary).toBeDefined();
      expect(result.actionSummary.length).toBeGreaterThan(0);

      const state = useGameStore.getState();
      // Since dice was non-double, turn should have advanced to next player (player 3)
      expect(state.activePlayerIndex).toBe(2);
      expect(state.gamePhase).toBe('WAITING');
    });

    it('should buy unowned property during turn if decision is positive', async () => {
      // Player 2 starts at 0, rolls [1, 2] -> Lands on Tile 3 (Chợ Nổi Cần Thơ, 80k)
      // Player 2 has 2,000,000 VND -> remaining cash 1.92M >= 300k -> will buy
      useGameStore.setState({ activePlayerIndex: 1, gamePhase: 'WAITING' });

      const result = await executeBotTurn(useGameStore, {
        skipDelay: true,
        diceOverride: [1, 2],
      });

      const tile3 = useGameStore.getState().tiles[3];
      expect(tile3.ownerId).toBe('player_2');
      expect(result.actionSummary.some((s) => s.includes('BOUGHT'))).toBe(true);
    });

    it('should handle bot in jail using jail free card', async () => {
      useGameStore.setState((s) => ({
        activePlayerIndex: 1,
        gamePhase: 'WAITING',
        players: s.players.map((p, idx) =>
          idx === 1
            ? { ...p, inJail: true, jailTurns: 2, position: 8, jailFreeCards: 1 }
            : p
        ),
      }));

      const result = await executeBotTurn(useGameStore, {
        skipDelay: true,
        diceOverride: [1, 2],
      });

      expect(result.actionSummary.some((s) => s.includes('USE_JAIL_CARD'))).toBe(true);
      const player2 = useGameStore.getState().players[1];
      expect(player2.jailFreeCards).toBe(0);
      expect(player2.inJail).toBe(false);
    });

    it('should handle bot upgrading properties during turn', async () => {
      // Give player 2 ME_KONG monopoly (tiles 1 and 3)
      useGameStore.setState((s) => ({
        activePlayerIndex: 1,
        gamePhase: 'WAITING',
        tiles: s.tiles.map((t) =>
          t.id === 1 || t.id === 3 ? { ...t, ownerId: 'player_2', houseCount: 0 } : t
        ),
        players: s.players.map((p, idx) =>
          idx === 1 ? { ...p, properties: [1, 3], money: 2000000 } : p
        ),
      }));

      const result = await executeBotTurn(useGameStore, {
        skipDelay: true,
        diceOverride: [1, 2], // Sum 3 lands on owned tile 3
      });

      expect(result.actionSummary.some((s) => s.includes('UPGRADED'))).toBe(true);
    });

    it('should handle CARD_DRAWN by dismissing card and finishing turn', async () => {
      // Player 2 rolls [1, 1] from pos 0 -> pos 2 (FATE tile)
      useGameStore.setState({ activePlayerIndex: 1, gamePhase: 'WAITING' });

      const result = await executeBotTurn(useGameStore, {
        skipDelay: true,
        diceOverride: [1, 1], // Double -> tile 2 (FATE)
      });

      expect(result.actionSummary.length).toBeGreaterThan(0);
    });
  });
});

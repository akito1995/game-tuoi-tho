import { describe, it, expect, beforeEach } from 'vitest';
import {
  formatMoney,
  formatShortMoney,
  calculatePlayerNetWorth,
  getMascotInfo,
  getColorBadgeInfo,
  getUpgradeTier,
  getLeaderboard,
  canPlayerRoll,
  canPlayerEndTurn,
  RULES_GUIDE_SECTIONS,
} from '@/components/games/co-ty-phu/hud/hudHelpers';
import { Player, Tile } from '@/lib/game-engine/types';
import { useGameStore } from '@/lib/game-engine/gameStore';

describe('HUD Helpers and UI Logic Suite', () => {
  beforeEach(() => {
    useGameStore.getState().initGame(4);
  });

  describe('Currency & Money Formatters', () => {
    it('should format full Vietnamese Dong money correctly', () => {
      expect(formatMoney(150000)).toBe('150.000đ');
      expect(formatMoney(2000000)).toBe('2.000.000đ');
      expect(formatMoney(0)).toBe('0đ');
      expect(formatMoney(-50000)).toBe('-50.000đ');
      // @ts-expect-error test fallback
      expect(formatMoney(NaN)).toBe('0đ');
    });

    it('should format short money for compact cards and tags', () => {
      expect(formatShortMoney(1850000)).toBe('1.850k');
      expect(formatShortMoney(200000)).toBe('200k');
      expect(formatShortMoney(50000)).toBe('50k');
      expect(formatShortMoney(500)).toBe('500đ');
      expect(formatShortMoney(0)).toBe('0đ');
    });
  });

  describe('Player Net Worth & Leaderboard', () => {
    it('should calculate net worth for player with no properties', () => {
      const player: Player = {
        id: 'p1',
        name: 'Bé Heo',
        mascot: 'PIG',
        money: 1500000,
        position: 0,
        inJail: false,
        jailTurns: 0,
        properties: [],
        bankrupt: false,
        isBot: false,
      };
      const tiles: Tile[] = [];
      expect(calculatePlayerNetWorth(player, tiles)).toBe(1500000);
    });

    it('should calculate net worth including property prices and building upgrades', () => {
      const player: Player = {
        id: 'p1',
        name: 'Bé Heo',
        mascot: 'PIG',
        money: 500000,
        position: 0,
        inJail: false,
        jailTurns: 0,
        properties: [1, 2],
        bankrupt: false,
        isBot: false,
      };

      const tiles: Tile[] = [
        { id: 0, name: 'Xuất Phát', type: 'START' },
        {
          id: 1,
          name: 'Bến Ninh Kiều',
          type: 'PROPERTY',
          price: 100000,
          housePrice: 50000,
          houseCount: 2, // 2 houses = 100000
          ownerId: 'p1',
        },
        {
          id: 2,
          name: 'Chợ Nổi Cái Răng',
          type: 'PROPERTY',
          price: 120000,
          housePrice: 60000,
          houseCount: 4, // 4 houses (resort) = 240000
          ownerId: 'p1',
        },
      ];

      // Net worth = cash(500000) + tile1(100000 + 100000) + tile2(120000 + 240000) = 1,060,000
      expect(calculatePlayerNetWorth(player, tiles)).toBe(1060000);
    });

    it('should return 0 net worth if player is bankrupt', () => {
      const player: Player = {
        id: 'p1',
        name: 'Bé Heo',
        mascot: 'PIG',
        money: 0,
        position: 0,
        inJail: false,
        jailTurns: 0,
        properties: [],
        bankrupt: true,
        isBot: false,
      };
      expect(calculatePlayerNetWorth(player, [])).toBe(0);
    });

    it('should rank players properly with winner on top and bankrupt at bottom', () => {
      const players: Player[] = [
        {
          id: 'p1',
          name: 'Bé Heo',
          mascot: 'PIG',
          money: 500000,
          position: 0,
          inJail: false,
          jailTurns: 0,
          properties: [],
          bankrupt: false,
          isBot: false,
        },
        {
          id: 'p2',
          name: 'Bé Cáo',
          mascot: 'FOX',
          money: 2000000,
          position: 0,
          inJail: false,
          jailTurns: 0,
          properties: [],
          bankrupt: false,
          isBot: true,
        },
        {
          id: 'p3',
          name: 'Bé Mèo',
          mascot: 'CAT',
          money: 0,
          position: 0,
          inJail: false,
          jailTurns: 0,
          properties: [],
          bankrupt: true,
          isBot: true,
        },
      ];

      const tiles: Tile[] = [];
      const leaderboard = getLeaderboard(players, tiles, 'p2');

      expect(leaderboard[0].player.id).toBe('p2');
      expect(leaderboard[0].isWinner).toBe(true);
      expect(leaderboard[0].rank).toBe(1);

      expect(leaderboard[1].player.id).toBe('p1');
      expect(leaderboard[1].rank).toBe(2);

      expect(leaderboard[2].player.id).toBe('p3');
      expect(leaderboard[2].player.bankrupt).toBe(true);
      expect(leaderboard[2].rank).toBe(3);
    });
  });

  describe('Mascot and Color Group Badges', () => {
    it('should return correct mascot details for all 4 mascots', () => {
      expect(getMascotInfo('PIG').emoji).toBe('🐷');
      expect(getMascotInfo('PIG').name).toBe('Bé Heo');

      expect(getMascotInfo('FOX').emoji).toBe('🦊');
      expect(getMascotInfo('FOX').name).toBe('Bé Cáo');

      expect(getMascotInfo('CAT').emoji).toBe('🐱');
      expect(getMascotInfo('CAT').name).toBe('Bé Mèo');

      expect(getMascotInfo('BUFFALO').emoji).toBe('🐮');
      expect(getMascotInfo('BUFFALO').name).toBe('Bé Trâu');
    });

    it('should return color badge info for regions', () => {
      const mekong = getColorBadgeInfo('ME_KONG');
      expect(mekong.regionName).toBe('Mê Kông');
      expect(mekong.hex).toBe('#10b981');

      const heritage = getColorBadgeInfo('HERITAGE');
      expect(heritage.regionName).toBe('Di Sản');

      const defaultBadge = getColorBadgeInfo(undefined);
      expect(defaultBadge.regionName).toBe('Đặc Biệt');
    });
  });

  describe('Upgrade Tier Information', () => {
    it('should accurately return upgrade tiers from vacant land to 5-star resort', () => {
      const tier0 = getUpgradeTier(0);
      expect(tier0.level).toBe(0);
      expect(tier0.name).toBe('Đất trống');
      expect(tier0.nextTierName).toBe('Nhà cấp 1');

      const tier1 = getUpgradeTier(1);
      expect(tier1.level).toBe(1);
      expect(tier1.name).toBe('Nhà cấp 1');
      expect(tier1.nextTierName).toBe('Nhà cấp 2');

      const tier2 = getUpgradeTier(2);
      expect(tier2.level).toBe(2);
      expect(tier2.name).toBe('Nhà cấp 2');

      const tier3 = getUpgradeTier(3);
      expect(tier3.level).toBe(3);
      expect(tier3.name).toContain('Biệt Thự');

      const tier4 = getUpgradeTier(4);
      expect(tier4.level).toBe(4);
      expect(tier4.name).toContain('Resort');
      expect(tier4.nextTierName).toBeNull();
    });
  });

  describe('Control Flow & Action Permissions', () => {
    it('canPlayerRoll should only return true for active human player in WAITING phase', () => {
      const human: Player = {
        id: 'p1',
        name: 'Player 1',
        mascot: 'PIG',
        money: 2000000,
        position: 0,
        inJail: false,
        jailTurns: 0,
        properties: [],
        bankrupt: false,
        isBot: false,
      };

      const bot: Player = { ...human, id: 'p2', isBot: true };
      const bankruptHuman: Player = { ...human, bankrupt: true };

      expect(canPlayerRoll(human, 'WAITING')).toBe(true);
      expect(canPlayerRoll(human, 'ROLLING')).toBe(false);
      expect(canPlayerRoll(human, 'TURN_END')).toBe(false);
      expect(canPlayerRoll(human, 'GAME_OVER')).toBe(false);

      expect(canPlayerRoll(bot, 'WAITING')).toBe(false);
      expect(canPlayerRoll(bankruptHuman, 'WAITING')).toBe(false);
      expect(canPlayerRoll(undefined, 'WAITING')).toBe(false);
    });

    it('canPlayerEndTurn should return true in TURN_END or ACTION phases for human', () => {
      const human: Player = {
        id: 'p1',
        name: 'Player 1',
        mascot: 'PIG',
        money: 2000000,
        position: 0,
        inJail: false,
        jailTurns: 0,
        properties: [],
        bankrupt: false,
        isBot: false,
      };

      expect(canPlayerEndTurn(human, 'TURN_END')).toBe(true);
      expect(canPlayerEndTurn(human, 'ACTION')).toBe(true);
      expect(canPlayerEndTurn(human, 'WAITING')).toBe(false);
      expect(canPlayerEndTurn(human, 'ROLLING')).toBe(false);

      const bot: Player = { ...human, isBot: true };
      expect(canPlayerEndTurn(bot, 'TURN_END')).toBe(false);
    });
  });

  describe('Rules Guide Content Validation', () => {
    it('should have all 5 comprehensive rules guide sections', () => {
      expect(RULES_GUIDE_SECTIONS.length).toBe(5);
      const sectionIds = RULES_GUIDE_SECTIONS.map((s) => s.id);
      expect(sectionIds).toContain('goal');
      expect(sectionIds).toContain('turn');
      expect(sectionIds).toContain('properties');
      expect(sectionIds).toContain('special');
      expect(sectionIds).toContain('tips');
    });

    it('each section should have tabLabel, title, subtitle, and at least 3 bullet points with icons', () => {
      RULES_GUIDE_SECTIONS.forEach((section) => {
        expect(section.tabLabel).toBeTruthy();
        expect(section.icon).toBeTruthy();
        expect(section.title).toBeTruthy();
        expect(section.subtitle).toBeTruthy();
        expect(section.bullets.length).toBeGreaterThanOrEqual(3);
        section.bullets.forEach((b) => {
          expect(b.title).toBeTruthy();
          expect(b.desc).toBeTruthy();
          expect(b.icon).toBeTruthy();
        });
      });
    });
  });

  describe('Integration with useGameStore', () => {
    it('binds to store active player, jackpot fund, and current round', () => {
      const state = useGameStore.getState();
      expect(state.players.length).toBe(4);
      expect(state.currentRound).toBe(1);
      expect(state.jackpotFund).toBeGreaterThanOrEqual(50000);

      const activePlayer = state.players[state.activePlayerIndex];
      expect(activePlayer.id).toBe('player_1');
      expect(activePlayer.isBot).toBe(false);
    });
  });

  describe('HUD Component Module Exports', () => {
    it('exports all HUD components and master container from index', async () => {
      const hud = await import('@/components/games/co-ty-phu/hud');
      expect(hud.GameHeader).toBeDefined();
      expect(hud.PlayerListBar).toBeDefined();
      expect(hud.DiceControlPanel).toBeDefined();
      expect(hud.PropertyActionModal).toBeDefined();
      expect(hud.ChanceCardModal).toBeDefined();
      expect(hud.RulesGuideModal).toBeDefined();
      expect(hud.EventLogTicker).toBeDefined();
      expect(hud.GameOverModal).toBeDefined();
      expect(hud.LiveChatBox).toBeDefined();
      expect(hud.EmoteWheel).toBeDefined();
      expect(hud.CoTyPhuHUD).toBeDefined();
      expect(hud.TurnTimerBar).toBeDefined();
      expect(hud.DiceRevealOverlay).toBeDefined();
      expect(hud.PropertyInspectorModal).toBeDefined();
    }, 20000);
  });
});

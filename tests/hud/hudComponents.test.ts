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
import {
  PropertyActionModal,
  calculatePropertyTierDetails,
  calculateRemainingBalance,
} from '@/components/games/co-ty-phu/hud/PropertyActionModal';

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
      expect(formatShortMoney(1850000)).toBe('1.850.000đ');
      expect(formatShortMoney(200000)).toBe('200.000đ');
      expect(formatShortMoney(50000)).toBe('50.000đ');
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

  describe('PropertyActionModal & Land Deed Drawer Suite', () => {
    const samplePropertyTile: Tile = {
      id: 1,
      name: 'Bến Ninh Kiều',
      type: 'PROPERTY',
      colorGroup: 'ME_KONG',
      price: 100000,
      housePrice: 60000,
      baseRent: 10000,
      rentMultiplier: [10000, 50000, 150000, 300000, 600000],
      ownerId: null,
      houseCount: 0,
      hasResort: false,
      isMortgaged: false,
    };

    const sampleTransportTile: Tile = {
      id: 5,
      name: 'Ga Sài Gòn',
      type: 'TRANSPORT',
      price: 200000,
      baseRent: 25000,
      rentMultiplier: [25000, 50000, 100000, 200000],
      ownerId: null,
      houseCount: 0,
      hasResort: false,
      isMortgaged: false,
    };

    it('exports PropertyActionModal component and tier helper calculations', () => {
      expect(typeof PropertyActionModal).toBe('function');
      expect(typeof calculatePropertyTierDetails).toBe('function');
      expect(typeof calculateRemainingBalance).toBe('function');
    });

    it('calculates accurate construction tier costs for unowned property', () => {
      const tiers = calculatePropertyTierDetails({
        tile: samplePropertyTile,
        currentTier: -1,
        isUnowned: true,
        currentRound: 2,
        playerMoney: 500000,
      });

      expect(tiers.length).toBe(4);

      // Tier 0: Đất nền = tilePrice = 100000
      expect(tiers[0].tierIndex).toBe(0);
      expect(tiers[0].name).toBe('Đất nền');
      expect(tiers[0].cost).toBe(100000);
      expect(tiers[0].isBuilt).toBe(false);
      expect(tiers[0].isLocked).toBe(false);
      expect(tiers[0].canAfford).toBe(true);

      // Tier 1: Nhà phố = tilePrice + 1*housePrice = 160000
      expect(tiers[1].tierIndex).toBe(1);
      expect(tiers[1].name).toBe('Nhà phố');
      expect(tiers[1].cost).toBe(160000);
      expect(tiers[1].isBuilt).toBe(false);
      expect(tiers[1].canAfford).toBe(true);

      // Tier 2: Chung cư = tilePrice + 2*housePrice = 220000
      expect(tiers[2].tierIndex).toBe(2);
      expect(tiers[2].name).toBe('Chung cư');
      expect(tiers[2].cost).toBe(220000);
      expect(tiers[2].isBuilt).toBe(false);
      expect(tiers[2].canAfford).toBe(true);

      // Tier 3: Landmark 5 Sao = tilePrice + 3*housePrice = 280000
      expect(tiers[3].tierIndex).toBe(3);
      expect(tiers[3].name).toBe('Landmark 5 Sao');
      expect(tiers[3].cost).toBe(280000);
      expect(tiers[3].isBuilt).toBe(false);
      expect(tiers[3].isLocked).toBe(false);
      expect(tiers[3].canAfford).toBe(true);
    });

    it('calculates incremental upgrade costs for owned property across tiers', () => {
      // Player already owns Tier 0 (land)
      const tiersFromLand = calculatePropertyTierDetails({
        tile: { ...samplePropertyTile, ownerId: 'p1' },
        currentTier: 0,
        isUnowned: false,
        currentRound: 2,
        playerMoney: 200000,
      });

      expect(tiersFromLand[0].cost).toBe(0);
      expect(tiersFromLand[0].isBuilt).toBe(true);
      expect(tiersFromLand[1].cost).toBe(60000); // 1 housePrice
      expect(tiersFromLand[1].isBuilt).toBe(false);
      expect(tiersFromLand[2].cost).toBe(120000); // 2 housePrice
      expect(tiersFromLand[3].cost).toBe(180000); // 3 housePrice

      // Player already has 1 house (Tier 1)
      const tiersFromHouse1 = calculatePropertyTierDetails({
        tile: { ...samplePropertyTile, ownerId: 'p1', houseCount: 1 },
        currentTier: 1,
        isUnowned: false,
        currentRound: 2,
        playerMoney: 200000,
      });

      expect(tiersFromHouse1[0].isBuilt).toBe(true);
      expect(tiersFromHouse1[1].isBuilt).toBe(true);
      expect(tiersFromHouse1[1].cost).toBe(0);
      expect(tiersFromHouse1[2].cost).toBe(60000); // upgrade from 1 to 2
      expect(tiersFromHouse1[3].cost).toBe(120000); // upgrade from 1 to 3

      // Player already has Landmark (Tier 3)
      const tiersFromLandmark = calculatePropertyTierDetails({
        tile: { ...samplePropertyTile, ownerId: 'p1', houseCount: 3, hasResort: true },
        currentTier: 3,
        isUnowned: false,
        currentRound: 2,
        playerMoney: 200000,
      });

      expect(tiersFromLandmark.every((t) => t.isBuilt)).toBe(true);
      expect(tiersFromLandmark.every((t) => t.cost === 0)).toBe(true);
    });

    it('locks Landmark in Round 1 and locks building upgrades on Transport/Utility tiles', () => {
      // In Round 1, Landmark should be locked
      const round1Tiers = calculatePropertyTierDetails({
        tile: samplePropertyTile,
        currentTier: -1,
        isUnowned: true,
        currentRound: 1,
        playerMoney: 1000000,
      });

      expect(round1Tiers[3].isLocked).toBe(true);
      expect(round1Tiers[3].lockMessage).toContain('vòng 1');

      // In Round 2+, Landmark should be unlocked
      const round2Tiers = calculatePropertyTierDetails({
        tile: samplePropertyTile,
        currentTier: -1,
        isUnowned: true,
        currentRound: 2,
        playerMoney: 1000000,
      });
      expect(round2Tiers[3].isLocked).toBe(false);

      // Transport tiles should lock tiers 1-3
      const transportTiers = calculatePropertyTierDetails({
        tile: sampleTransportTile,
        currentTier: -1,
        isUnowned: true,
        currentRound: 2,
        playerMoney: 1000000,
      });

      expect(transportTiers[0].isLocked).toBe(false);
      expect(transportTiers[0].name).toBe('Sở hữu cơ bản');
      expect(transportTiers[1].isLocked).toBe(true);
      expect(transportTiers[2].isLocked).toBe(true);
      expect(transportTiers[3].isLocked).toBe(true);
    });

    it('calculates rent progression and incorporates regional monopoly 2x multiplier', () => {
      // Standard rent
      const standardTiers = calculatePropertyTierDetails({
        tile: samplePropertyTile,
        currentTier: 0,
        isUnowned: false,
        currentRound: 2,
        playerMoney: 500000,
        hasMonopoly: false,
      });

      expect(standardTiers[0].rent).toBe(10000);
      expect(standardTiers[1].rent).toBe(50000);
      expect(standardTiers[2].rent).toBe(150000);
      expect(standardTiers[3].rent).toBe(600000);

      // Monopoly active: rent doubled (2x)
      const monopolyTiers = calculatePropertyTierDetails({
        tile: samplePropertyTile,
        currentTier: 0,
        isUnowned: false,
        currentRound: 2,
        playerMoney: 500000,
        hasMonopoly: true,
      });

      expect(monopolyTiers[0].rent).toBe(20000);
      expect(monopolyTiers[1].rent).toBe(100000);
      expect(monopolyTiers[2].rent).toBe(300000);
      expect(monopolyTiers[3].rent).toBe(1200000);
    });

    it('accurately resolves player affordability and remaining balance calculations', () => {
      // Sufficient balance
      const res1 = calculateRemainingBalance(1500000, 280000);
      expect(res1.canAfford).toBe(true);
      expect(res1.remainingCash).toBe(1220000);

      // Exact balance
      const res2 = calculateRemainingBalance(280000, 280000);
      expect(res2.canAfford).toBe(true);
      expect(res2.remainingCash).toBe(0);

      // Insufficient balance
      const res3 = calculateRemainingBalance(100000, 280000);
      expect(res3.canAfford).toBe(false);
      expect(res3.remainingCash).toBe(-180000);

      // Cost 0 (already built tier)
      const res4 = calculateRemainingBalance(500000, 0);
      expect(res4.canAfford).toBe(false);
      expect(res4.remainingCash).toBe(500000);
    });
  });
});

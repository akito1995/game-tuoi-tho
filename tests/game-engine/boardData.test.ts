import { describe, it, expect } from 'vitest';
import { BOARD_TILES } from '@/lib/game-engine/boardData';
import { CHANCE_CARDS, FATE_CARDS } from '@/lib/game-engine/chanceCards';
import { TileType, ColorGroupType, CardActionType } from '@/lib/game-engine/types';

describe('Board Data & Core Engine Structures', () => {
  describe('BOARD_TILES integrity', () => {
    it('should have exactly 32 tiles with consecutive indices 0 to 31', () => {
      expect(BOARD_TILES).toHaveLength(32);
      BOARD_TILES.forEach((tile, index) => {
        expect(tile.id).toBe(index);
        expect(typeof tile.name).toBe('string');
        expect(tile.name.trim().length).toBeGreaterThan(0);
      });
    });

    it('should place the 4 strategic corners at exact indices', () => {
      // Index 0: START
      const startTile = BOARD_TILES[0];
      expect(startTile.type).toBe('START');
      expect(startTile.name).toMatch(/Xuất Phát/i);

      // Index 8: JAIL
      const jailTile = BOARD_TILES[8];
      expect(jailTile.type).toBe('JAIL');
      expect(jailTile.name).toMatch(/Trại Giam|Tạm Giữ|Tù/i);

      // Index 16: FESTIVAL
      const festivalTile = BOARD_TILES[16];
      expect(festivalTile.type).toBe('FESTIVAL');
      expect(festivalTile.name).toMatch(/Lễ Hội/i);

      // Index 24: GO_TO_JAIL
      const goToJailTile = BOARD_TILES[24];
      expect(goToJailTile.type).toBe('GO_TO_JAIL');
      expect(goToJailTile.name).toMatch(/Đi Vào Tù|Vào Tù|Bị Bắt/i);
    });

    it('should configure property tiles with valid financial attributes and 5-tier rents', () => {
      const propertyTiles = BOARD_TILES.filter((t) => t.type === 'PROPERTY');
      expect(propertyTiles.length).toBeGreaterThanOrEqual(16);

      propertyTiles.forEach((tile) => {
        expect(tile.price).toBeGreaterThan(0);
        expect(tile.baseRent).toBeGreaterThan(0);
        expect(tile.housePrice).toBeGreaterThan(0);
        expect(tile.rentMultiplier).toHaveLength(5);

        // 5-tier rent should strictly increase: base < h1 < h2 < villa < resort
        const rents = tile.rentMultiplier!;
        expect(rents[0]).toBe(tile.baseRent);
        for (let i = 1; i < rents.length; i++) {
          expect(rents[i]).toBeGreaterThan(rents[i - 1]);
        }

        // Default ownership and construction states
        expect(tile.ownerId).toBeNull();
        expect(tile.houseCount).toBe(0);
        expect(tile.hasResort).toBe(false);
        expect(tile.isMortgaged).toBe(false);
      });
    });

    it('should configure transport and utility tiles properly', () => {
      const transports = BOARD_TILES.filter((t) => t.type === 'TRANSPORT');
      expect(transports).toHaveLength(4);
      transports.forEach((tile) => {
        expect(tile.price).toBeGreaterThan(0);
        expect(tile.baseRent).toBeGreaterThan(0);
        expect(tile.colorGroup).toBe('TRANSPORT');
        expect(tile.rentMultiplier).toHaveLength(5);
        expect(tile.ownerId).toBeNull();
      });

      const utilities = BOARD_TILES.filter((t) => t.type === 'UTILITY');
      expect(utilities).toHaveLength(2);
      utilities.forEach((tile) => {
        expect(tile.price).toBeGreaterThan(0);
        expect(tile.baseRent).toBeGreaterThan(0);
        expect(tile.colorGroup).toBe('UTILITY');
        expect(tile.rentMultiplier).toHaveLength(5);
        expect(tile.ownerId).toBeNull();
      });
    });

    it('should cover all required Vietnamese regional color groups and landmarks', () => {
      const expectedLandmarks: Record<ColorGroupType, string[]> = {
        ME_KONG: ['Cà Mau', 'Cần Thơ'],
        COASTAL: ['Vũng Tàu', 'Nha Trang', 'Phú Quốc'],
        HIGHLANDS: ['Buôn Ma Thuột', 'Đà Lạt'],
        HERITAGE: ['Huế', 'Hội An', 'Đà Nẵng'],
        WONDERS: ['Sa Pa', 'Ninh Bình', 'Hạ Long'],
        METROPOLIS: ['Hải Phòng', 'Hà Nội', 'Hồ Chí Minh'],
        TRANSPORT: ['Tân Sơn Nhất', 'Nội Bài', 'Miền Đông', 'Mỹ Đình'],
        UTILITY: ['Điện', 'Nước'],
      };

      for (const [group, landmarks] of Object.entries(expectedLandmarks)) {
        const groupTiles = BOARD_TILES.filter((t) => t.colorGroup === group);
        expect(groupTiles.length).toBeGreaterThanOrEqual(landmarks.length);

        for (const landmark of landmarks) {
          const found = groupTiles.some((t) => t.name.includes(landmark));
          expect(found).toBe(true);
        }
      }
    });

    it('should contain Chance and Fate tiles distributed across the board', () => {
      const chanceTiles = BOARD_TILES.filter((t) => t.type === 'CHANCE');
      const fateTiles = BOARD_TILES.filter((t) => t.type === 'FATE');

      expect(chanceTiles.length).toBeGreaterThanOrEqual(3);
      expect(fateTiles.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Folklore Chance & Fate Cards', () => {
    const validCardTypes: CardActionType[] = [
      'CASH_GAIN',
      'CASH_LOSS',
      'TELEPORT',
      'JAIL_FREE',
      'PAY_EACH_PLAYER',
    ];

    it('should have at least 12 distinct Chance cards with valid types and content', () => {
      expect(CHANCE_CARDS.length).toBeGreaterThanOrEqual(12);

      const ids = new Set<string>();
      CHANCE_CARDS.forEach((card) => {
        expect(ids.has(card.id)).toBe(false);
        ids.add(card.id);

        expect(card.title.trim().length).toBeGreaterThan(0);
        expect(card.description.trim().length).toBeGreaterThan(0);
        expect(validCardTypes).toContain(card.type);

        if (['CASH_GAIN', 'CASH_LOSS', 'PAY_EACH_PLAYER'].includes(card.type)) {
          expect(card.amount).toBeDefined();
          expect(card.amount).toBeGreaterThan(0);
        }

        if (card.type === 'TELEPORT') {
          expect(card.targetTileId).toBeDefined();
          expect(card.targetTileId).toBeGreaterThanOrEqual(0);
          expect(card.targetTileId).toBeLessThan(32);
        }
      });
    });

    it('should have at least 12 distinct Fate cards with valid types and content', () => {
      expect(FATE_CARDS.length).toBeGreaterThanOrEqual(12);

      const ids = new Set<string>();
      FATE_CARDS.forEach((card) => {
        expect(ids.has(card.id)).toBe(false);
        ids.add(card.id);

        expect(card.title.trim().length).toBeGreaterThan(0);
        expect(card.description.trim().length).toBeGreaterThan(0);
        expect(validCardTypes).toContain(card.type);

        if (['CASH_GAIN', 'CASH_LOSS', 'PAY_EACH_PLAYER'].includes(card.type)) {
          expect(card.amount).toBeDefined();
          expect(card.amount).toBeGreaterThan(0);
        }

        if (card.type === 'TELEPORT') {
          expect(card.targetTileId).toBeDefined();
          expect(card.targetTileId).toBeGreaterThanOrEqual(0);
          expect(card.targetTileId).toBeLessThan(32);
        }
      });
    });
  });
});

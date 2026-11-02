import { describe, it, expect } from 'vitest';
import { BOARD_40_TILES } from '../../src/game/boardData';
import {
  calculateTileRent,
  getTileRentBreakdown,
  getTileBuildingCosts,
  getNextUpgradeCost,
} from '../../src/game/rulesV2Financials';
import { Tile } from '../../src/game/types';

describe('Rules-v2 Financials & Rent Calculations', () => {
  it('tính đúng toàn bộ các mốc tiền thuê cho ô Kon Tum (P = 140.000đ)', () => {
    const tile: Tile = {
      ...BOARD_40_TILES[11],
      price: 140000,
      houseCount: 0,
      hasLandmark: false,
      ownerId: 'player-1',
    };

    // Đất trống: 10% = 14.000đ
    expect(calculateTileRent(tile)).toBe(14000);

    // Đất trống khi độc quyền trọn nhóm Hồng: x2 = 28.000đ
    const fullPinkTiles: Tile[] = BOARD_40_TILES.map((t) =>
      t.colorGroup === 'PINK' ? { ...t, ownerId: 'player-1' } : t
    );
    expect(calculateTileRent(tile, fullPinkTiles)).toBe(28000);

    // Cấp 1: 50% = 70.000đ
    tile.houseCount = 1;
    expect(calculateTileRent(tile)).toBe(70000);

    // Cấp 2: 130% = 182.000đ
    tile.houseCount = 2;
    expect(calculateTileRent(tile)).toBe(182000);

    // Cấp 3: 250% = 350.000đ
    tile.houseCount = 3;
    expect(calculateTileRent(tile)).toBe(350000);

    // Cấp 4: 350% = 490.000đ
    tile.houseCount = 4;
    expect(calculateTileRent(tile)).toBe(490000);

    // Landmark: 500% = 700.000đ
    tile.hasLandmark = true;
    expect(calculateTileRent(tile)).toBe(700000);
  });

  it('tính đúng ví dụ kiểm tra trong docs/rules-v2.md cho Hà Nội (P = 400.000đ) và Cà Mau (P = 60.000đ)', () => {
    // Hà Nội: Đất trống 40K, Landmark 2.000K
    const haNoi: Tile = {
      ...BOARD_40_TILES[39],
      price: 400000,
      houseCount: 0,
      hasLandmark: false,
    };
    expect(calculateTileRent(haNoi)).toBe(40000);
    haNoi.hasLandmark = true;
    expect(calculateTileRent(haNoi)).toBe(2000000);

    // Cà Mau: Đất trống 6K, Landmark 300K
    const caMau: Tile = {
      ...BOARD_40_TILES[1],
      price: 60000,
      houseCount: 0,
      hasLandmark: false,
    };
    expect(calculateTileRent(caMau)).toBe(6000);
    caMau.hasLandmark = true;
    expect(calculateTileRent(caMau)).toBe(300000);
  });

  it('tính đúng tiền thuê cho 4 ô Giao thông theo số lượng sở hữu (25K -> 50K -> 100K -> 200K)', () => {
    const transportTile: Tile = {
      ...BOARD_40_TILES[5], // Bến Nhà Rồng
      ownerId: 'player-1',
    };

    // 1 ga
    const tiles1 = BOARD_40_TILES.map((t) => (t.id === 5 ? { ...t, ownerId: 'player-1' } : t));
    expect(calculateTileRent(transportTile, tiles1)).toBe(25000);

    // 2 ga
    const tiles2 = tiles1.map((t) => (t.id === 15 ? { ...t, ownerId: 'player-1' } : t));
    expect(calculateTileRent(transportTile, tiles2)).toBe(50000);

    // 3 ga
    const tiles3 = tiles2.map((t) => (t.id === 25 ? { ...t, ownerId: 'player-1' } : t));
    expect(calculateTileRent(transportTile, tiles3)).toBe(100000);

    // 4 ga
    const tiles4 = tiles3.map((t) => (t.id === 35 ? { ...t, ownerId: 'player-1' } : t));
    expect(calculateTileRent(transportTile, tiles4)).toBe(200000);
  });

  it('tính đúng tiền thuê tiện ích: xúc xắc × 10K (1 ô) hoặc × 25K (2 ô)', () => {
    const utilTile: Tile = {
      ...BOARD_40_TILES[12], // Thủy điện Hòa Bình
      ownerId: 'player-1',
    };

    // 1 ô, xúc xắc 8 -> 80.000đ
    const tiles1 = BOARD_40_TILES.map((t) => (t.id === 12 ? { ...t, ownerId: 'player-1' } : t));
    expect(calculateTileRent(utilTile, tiles1, 8)).toBe(80000);

    // 2 ô, xúc xắc 8 -> 200.000đ
    const tiles2 = tiles1.map((t) => (t.id === 28 ? { ...t, ownerId: 'player-1' } : t));
    expect(calculateTileRent(utilTile, tiles2, 8)).toBe(200000);
  });

  it('giá xây nhà và Landmark tuân thủ nghiêm ngặt bảng giá rules-v2', () => {
    // Nhóm Nâu: Nhà 50K, Landmark 100K
    const brownTile = BOARD_40_TILES[1];
    expect(getTileBuildingCosts(brownTile)).toEqual({
      houseCost: 50000,
      landmarkCost: 100000,
    });

    // Nhóm Hồng: Nhà 100K, Landmark 200K
    const pinkTile = BOARD_40_TILES[11];
    expect(getTileBuildingCosts(pinkTile)).toEqual({
      houseCost: 100000,
      landmarkCost: 200000,
    });

    // Nhóm Đỏ: Nhà 150K, Landmark 300K
    const redTile = BOARD_40_TILES[21];
    expect(getTileBuildingCosts(redTile)).toEqual({
      houseCost: 150000,
      landmarkCost: 300000,
    });

    // Nhóm Xanh đậm: Nhà 200K, Landmark 400K
    const darkBlueTile = BOARD_40_TILES[39];
    expect(getTileBuildingCosts(darkBlueTile)).toEqual({
      houseCost: 200000,
      landmarkCost: 400000,
    });

    // Kiểm tra chi phí bước tiếp theo
    const buildingTile = { ...pinkTile, houseCount: 3 };
    expect(getNextUpgradeCost(buildingTile)).toBe(100000);

    buildingTile.houseCount = 4;
    expect(getNextUpgradeCost(buildingTile)).toBe(200000); // Lên Landmark
  });

  it('bảng getTileRentBreakdown tạo đúng các dòng và định dạng số', () => {
    const pinkBreakdown = getTileRentBreakdown(BOARD_40_TILES[11], BOARD_40_TILES);
    expect(pinkBreakdown.rows.length).toBe(6);
    expect(pinkBreakdown.rows[0].valueDisplay).toBe('14.000đ');
    expect(pinkBreakdown.rows[1].valueDisplay).toBe('70.000đ');
    expect(pinkBreakdown.rows[2].valueDisplay).toBe('182.000đ');
    expect(pinkBreakdown.rows[3].valueDisplay).toBe('350.000đ');
    expect(pinkBreakdown.rows[4].valueDisplay).toBe('490.000đ');
    expect(pinkBreakdown.rows[5].valueDisplay).toBe('700.000đ');

    const transportBreakdown = getTileRentBreakdown(BOARD_40_TILES[5], BOARD_40_TILES);
    expect(transportBreakdown.rows.length).toBe(4);
    expect(transportBreakdown.rows[0].valueDisplay).toBe('25.000đ');
    expect(transportBreakdown.rows[3].valueDisplay).toBe('200.000đ');

    const utilBreakdown = getTileRentBreakdown(BOARD_40_TILES[12], BOARD_40_TILES);
    expect(utilBreakdown.rows.length).toBe(2);
    expect(utilBreakdown.rows[0].valueDisplay).toBe('Tổng xúc xắc × 10.000đ');
    expect(utilBreakdown.rows[1].valueDisplay).toBe('Tổng xúc xắc × 25.000đ');
  });
});

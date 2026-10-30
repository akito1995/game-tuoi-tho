import { describe, it, expect } from 'vitest';
import {
  getTile3DPosition,
  getTileLayoutInfo,
  CORNER_SIZE,
  TILE_WIDTH,
  TILE_DEPTH,
  TILE_THICKNESS,
  TILE_SURFACE_Y,
  TILE_CENTER_OFFSET,
} from '@/components/games/co-ty-phu/board-3d/tilePositions';
import { BOARD_TILES } from '@/lib/game-engine/boardData';
import {
  COLOR_GROUP_PALETTE,
  SPECIAL_TILE_COLORS,
  formatPrice,
  formatShortPrice,
  formatTileName,
  StartToriiGate,
  JailCornerProp,
  FestivalCornerProp,
  GoToJailPoliceProp,
  GoldenTreasureChestProp,
  FloatingLuckyWheel,
  SpecialTileProp,
} from '@/components/games/co-ty-phu/board-3d/BoardTiles3D';
import { ColorGroupType } from '@/lib/game-engine/types';

describe('3D Tile Positions & Perimeter Mapping', () => {
  it('should map all 32 tiles with valid numeric positions at TILE_SURFACE_Y', () => {
    for (let i = 0; i < 32; i++) {
      const [x, y, z] = getTile3DPosition(i);
      expect(typeof x).toBe('number');
      expect(typeof y).toBe('number');
      expect(typeof z).toBe('number');
      expect(Number.isFinite(x)).toBe(true);
      expect(Number.isFinite(y)).toBe(true);
      expect(Number.isFinite(z)).toBe(true);
      expect(y).toBe(TILE_SURFACE_Y);
    }
  });

  it('should place the 4 strategic corners at symmetric outer offsets', () => {
    // Corner 0: South-East (+X, +Z)
    const p0 = getTile3DPosition(0);
    expect(p0).toEqual([TILE_CENTER_OFFSET, TILE_SURFACE_Y, TILE_CENTER_OFFSET]);

    // Corner 8: South-West (-X, +Z)
    const p8 = getTile3DPosition(8);
    expect(p8).toEqual([-TILE_CENTER_OFFSET, TILE_SURFACE_Y, TILE_CENTER_OFFSET]);

    // Corner 16: North-West (-X, -Z)
    const p16 = getTile3DPosition(16);
    expect(p16).toEqual([-TILE_CENTER_OFFSET, TILE_SURFACE_Y, -TILE_CENTER_OFFSET]);

    // Corner 24: North-East (+X, -Z)
    const p24 = getTile3DPosition(24);
    expect(p24).toEqual([TILE_CENTER_OFFSET, TILE_SURFACE_Y, -TILE_CENTER_OFFSET]);
  });

  it('should layout South row (0..8) from Right (+X) to Left (-X) with constant Z = +6.8', () => {
    for (let i = 0; i <= 8; i++) {
      const [x, y, z] = getTile3DPosition(i);
      expect(z).toBeCloseTo(TILE_CENTER_OFFSET, 3);
      if (i > 0) {
        const [prevX] = getTile3DPosition(i - 1);
        expect(x).toBeLessThan(prevX); // Decreasing X
      }
    }
  });

  it('should layout West row (8..16) from Bottom (+Z) to Top (-Z) with constant X = -6.8', () => {
    for (let i = 8; i <= 16; i++) {
      const [x, y, z] = getTile3DPosition(i);
      expect(x).toBeCloseTo(-TILE_CENTER_OFFSET, 3);
      if (i > 8) {
        const [, , prevZ] = getTile3DPosition(i - 1);
        expect(z).toBeLessThan(prevZ); // Decreasing Z
      }
    }
  });

  it('should layout North row (16..24) from Left (-X) to Right (+X) with constant Z = -6.8', () => {
    for (let i = 16; i <= 24; i++) {
      const [x, y, z] = getTile3DPosition(i);
      expect(z).toBeCloseTo(-TILE_CENTER_OFFSET, 3);
      if (i > 16) {
        const [prevX] = getTile3DPosition(i - 1);
        expect(x).toBeGreaterThan(prevX); // Increasing X
      }
    }
  });

  it('should layout East row (24..31) from Top (-Z) to Bottom (+Z) with constant X = +6.8', () => {
    for (let i = 24; i < 32; i++) {
      const [x, y, z] = getTile3DPosition(i);
      expect(x).toBeCloseTo(TILE_CENTER_OFFSET, 3);
      if (i > 24) {
        const [, , prevZ] = getTile3DPosition(i - 1);
        expect(z).toBeGreaterThan(prevZ); // Increasing Z
      }
    }
  });

  it('should provide correct layout info (corners vs regular tiles)', () => {
    const c0 = getTileLayoutInfo(0);
    expect(c0.isCorner).toBe(true);
    expect(c0.width).toBe(CORNER_SIZE);
    expect(c0.depth).toBe(CORNER_SIZE);
    expect(c0.side).toBe('SOUTH');

    const reg1 = getTileLayoutInfo(1);
    expect(reg1.isCorner).toBe(false);
    expect(reg1.width).toBe(TILE_WIDTH);
    expect(reg1.depth).toBe(TILE_DEPTH);
    expect(reg1.side).toBe('SOUTH');

    const c8 = getTileLayoutInfo(8);
    expect(c8.isCorner).toBe(true);
    expect(c8.side).toBe('WEST');

    const reg9 = getTileLayoutInfo(9);
    expect(reg9.isCorner).toBe(false);
    expect(reg9.width).toBe(TILE_DEPTH);
    expect(reg9.depth).toBe(TILE_WIDTH);
    expect(reg9.side).toBe('WEST');
  });

  it('should verify Metropolis group tile IDs (28, 30, 31) and East side layout info', () => {
    const metropolisTileIds = [28, 30, 31];

    metropolisTileIds.forEach((id) => {
      const tile = BOARD_TILES[id];
      expect(tile).toBeDefined();
      expect(tile.colorGroup).toBe('METROPOLIS');

      const layout = getTileLayoutInfo(id);
      expect(layout.side).toBe('EAST');
      expect(layout.isCorner).toBe(false);
      expect(layout.rotationY).toBeCloseTo(Math.PI / 2);
      expect(layout.width).toBe(TILE_DEPTH);
      expect(layout.depth).toBe(TILE_WIDTH);
      expect(layout.height).toBe(TILE_THICKNESS);

      const [x, y, z] = layout.position;
      expect(x).toBeCloseTo(TILE_CENTER_OFFSET, 3);
      expect(y).toBe(TILE_SURFACE_Y);
      expect(Number.isFinite(z)).toBe(true);
    });

    expect(BOARD_TILES[28].name).toContain('Cảng Hải Phòng');
    expect(BOARD_TILES[30].name).toContain('Thủ Đô Hà Nội');
    expect(BOARD_TILES[31].name).toContain('TP. Hồ Chí Minh');
  });

  it('should handle modular arithmetic wrap-around gracefully', () => {
    expect(getTile3DPosition(32)).toEqual(getTile3DPosition(0));
    expect(getTile3DPosition(33)).toEqual(getTile3DPosition(1));
    expect(getTile3DPosition(-1)).toEqual(getTile3DPosition(31));
  });
});

describe('3D Board Tiles & Bespoke Corners (Stage 2 Upgrades)', () => {
  it('should define palette colors for all 8 color regions and represent the 32 tiles', () => {
    const requiredColorGroups: ColorGroupType[] = [
      'ME_KONG',
      'COASTAL',
      'HIGHLANDS',
      'HERITAGE',
      'WONDERS',
      'METROPOLIS',
      'TRANSPORT',
      'UTILITY',
    ];

    expect(Object.keys(COLOR_GROUP_PALETTE).length).toBe(8);
    for (const group of requiredColorGroups) {
      expect(COLOR_GROUP_PALETTE[group]).toBeDefined();
      expect(COLOR_GROUP_PALETTE[group]).toMatch(/^#[0-9a-fA-F]{6}$/);
    }

    // Verify all 32 tiles are accounted for
    expect(BOARD_TILES.length).toBe(32);
    const countedGroups: Record<string, number> = {};
    const specialTypes: Record<string, number> = {};

    for (const tile of BOARD_TILES) {
      if (tile.colorGroup) {
        expect(COLOR_GROUP_PALETTE[tile.colorGroup]).toBeDefined();
        countedGroups[tile.colorGroup] = (countedGroups[tile.colorGroup] || 0) + 1;
      } else {
        expect(['START', 'JAIL', 'FESTIVAL', 'GO_TO_JAIL', 'CHANCE', 'FATE']).toContain(tile.type);
        specialTypes[tile.type] = (specialTypes[tile.type] || 0) + 1;
      }
    }

    // 22 color group tiles (16 properties + 4 transport + 2 utility) + 4 corners + 3 chance + 3 fate = 32
    expect(Object.values(countedGroups).reduce((a, b) => a + b, 0)).toBe(22);
    expect(specialTypes['START']).toBe(1);
    expect(specialTypes['JAIL']).toBe(1);
    expect(specialTypes['FESTIVAL']).toBe(1);
    expect(specialTypes['GO_TO_JAIL']).toBe(1);
    expect(specialTypes['CHANCE']).toBe(3);
    expect(specialTypes['FATE']).toBe(3);
  });

  it('should verify all 4 corners (0, 8, 16, 24) have proper layout dimensions, positions, and special types', () => {
    const corners = [
      { id: 0, type: 'START', side: 'SOUTH', rot: 0, x: TILE_CENTER_OFFSET, z: TILE_CENTER_OFFSET },
      { id: 8, type: 'JAIL', side: 'WEST', rot: -Math.PI / 2, x: -TILE_CENTER_OFFSET, z: TILE_CENTER_OFFSET },
      { id: 16, type: 'FESTIVAL', side: 'NORTH', rot: Math.PI, x: -TILE_CENTER_OFFSET, z: -TILE_CENTER_OFFSET },
      { id: 24, type: 'GO_TO_JAIL', side: 'EAST', rot: Math.PI / 2, x: TILE_CENTER_OFFSET, z: -TILE_CENTER_OFFSET },
    ];

    corners.forEach((c) => {
      const tile = BOARD_TILES[c.id];
      expect(tile.type).toBe(c.type);

      const layout = getTileLayoutInfo(c.id);
      expect(layout.isCorner).toBe(true);
      expect(layout.width).toBe(CORNER_SIZE);
      expect(layout.depth).toBe(CORNER_SIZE);
      expect(layout.height).toBe(TILE_THICKNESS);
      expect(layout.side).toBe(c.side);
      expect(layout.rotationY).toBeCloseTo(c.rot);
      expect(layout.position[0]).toBeCloseTo(c.x, 3);
      expect(layout.position[1]).toBe(TILE_SURFACE_Y);
      expect(layout.position[2]).toBeCloseTo(c.z, 3);
    });
  });

  it('should verify non-corner tiles with price show valid price badge data', () => {
    const pricedTiles = BOARD_TILES.filter((t) => t.price !== undefined);
    expect(pricedTiles.length).toBe(22);

    for (const tile of pricedTiles) {
      expect(tile.id % 8 !== 0).toBe(true); // None are corners
      expect(tile.price).toBeGreaterThan(0);

      const shortPrice = formatShortPrice(tile.price);
      expect(shortPrice).toMatch(/^[0-9.]+[KM]$/);

      const fullPrice = formatPrice(tile.price);
      expect(fullPrice).toContain('đ');
    }

    // Verify 10 non-priced tiles (4 corners, 3 CHANCE, 3 FATE)
    const nonPricedTiles = BOARD_TILES.filter((t) => t.price === undefined);
    expect(nonPricedTiles.length).toBe(10);
    const nonPricedIds = nonPricedTiles.map((t) => t.id);
    expect(nonPricedIds).toEqual([0, 2, 7, 8, 14, 16, 18, 24, 26, 29]);
  });

  it('should verify bespoke 3D prop components for corners and special event tiles', () => {
    expect(typeof StartToriiGate).toBe('function');
    expect(typeof JailCornerProp).toBe('function');
    expect(typeof FestivalCornerProp).toBe('function');
    expect(typeof GoToJailPoliceProp).toBe('function');
    expect(typeof GoldenTreasureChestProp).toBe('function');
    expect(typeof FloatingLuckyWheel).toBe('function');
    expect(typeof SpecialTileProp).toBe('function');
  });

  it('should format tile names correctly for corners and regular tiles', () => {
    expect(formatTileName('Xuất Phát (Cổng Làng)', true)).toBe('XUẤT PHÁT');
    expect(formatTileName('Trại Giam / Tạm Giữ', true)).toBe('TRẠI GIAM');
    expect(formatTileName('Lễ Hội Dân Gian (Quỹ Heo Đất)', true)).toBe('LỄ HỘI');
    expect(formatTileName('Đi Vào Tù (Bị Bắt Đi Bão)', true)).toBe('VÀO TÙ');
    expect(formatTileName('Đất Mũi Cà Mau (Rừng Đước)', false)).toBe('Đất Mũi Cà Mau');
  });
});

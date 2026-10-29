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

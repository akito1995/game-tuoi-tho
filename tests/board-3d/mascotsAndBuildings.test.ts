import { describe, it, expect } from 'vitest';
import {
  getPlayerTileOffset,
  calculatePathTiles,
  calculateHopPosition,
  getTileBuildingPosition,
  getBuildingTier,
  getDiceFaceNormal,
  getDiceTargetEuler,
  rotateVectorByEuler,
  MASCOT_PALETTES,
} from '@/components/games/co-ty-phu/board-3d/board3dHelpers';
import { TILE_SURFACE_Y, TILE_CENTER_OFFSET } from '@/components/games/co-ty-phu/board-3d/tilePositions';

describe('Mascots and Buildings 3D Helpers', () => {
  describe('Player Tile Offsets', () => {
    it('should return [0, 0, 0] when 0 or 1 player on tile', () => {
      expect(getPlayerTileOffset(0, 1)).toEqual([0, 0, 0]);
      expect(getPlayerTileOffset(0, 0)).toEqual([0, 0, 0]);
    });

    it('should offset 2 players symmetrically to prevent pawn overlap', () => {
      const p1 = getPlayerTileOffset(0, 2);
      const p2 = getPlayerTileOffset(1, 2);
      expect(p1[0]).toBeLessThan(0);
      expect(p2[0]).toBeGreaterThan(0);
      expect(p1[0] + p2[0]).toBeCloseTo(0);
    });

    it('should offset 3 players in a stable triangular formation', () => {
      const p1 = getPlayerTileOffset(0, 3);
      const p2 = getPlayerTileOffset(1, 3);
      const p3 = getPlayerTileOffset(2, 3);

      expect(p1[0]).toBeLessThan(0);
      expect(p2[0]).toBeGreaterThan(0);
      expect(p3[0]).toBeCloseTo(0);
      expect(p3[2]).toBeGreaterThan(0);
    });

    it('should arrange 4 players in a 2x2 quadrant layout without overlap', () => {
      const offsets = [
        getPlayerTileOffset(0, 4),
        getPlayerTileOffset(1, 4),
        getPlayerTileOffset(2, 4),
        getPlayerTileOffset(3, 4),
      ];
      // All 4 pairs of (x, z) should be distinct
      const serialized = offsets.map((o) => `${o[0]},${o[2]}`);
      const unique = new Set(serialized);
      expect(unique.size).toBe(4);
    });
  });

  describe('Clockwise Path Calculation', () => {
    it('should calculate direct sequential path without wrap-around', () => {
      expect(calculatePathTiles(0, 3)).toEqual([0, 1, 2, 3]);
      expect(calculatePathTiles(10, 12)).toEqual([10, 11, 12]);
    });

    it('should calculate wrapped path across board boundary (31 -> 0)', () => {
      expect(calculatePathTiles(30, 2)).toEqual([30, 31, 0, 1, 2]);
      expect(calculatePathTiles(31, 1)).toEqual([31, 0, 1]);
    });

    it('should return single tile if start equals end', () => {
      expect(calculatePathTiles(5, 5)).toEqual([5]);
    });

    it('should correctly handle a full 12-step roll wrap around', () => {
      const path = calculatePathTiles(25, 5); // 25..31 (7 steps) + 0..5 (6 steps) = 13 tiles
      expect(path[0]).toBe(25);
      expect(path[path.length - 1]).toBe(5);
      expect(path.length).toBe(13);
      expect(path).toContain(0);
      expect(path).toContain(31);
    });
  });

  describe('Parabolic Hop Calculation', () => {
    it('should match start position at progress 0 and end position at progress 1', () => {
      const from: [number, number, number] = [0, 0, 0];
      const to: [number, number, number] = [2, 0, 0];
      const at0 = calculateHopPosition(from, to, 0, 0.6);
      const at1 = calculateHopPosition(from, to, 1, 0.6);

      expect(at0).toEqual([0, 0, 0]);
      expect(at1).toEqual([2, 0, 0]);
    });

    it('should reach peak apex height at midpoint progress 0.5', () => {
      const from: [number, number, number] = [0, 0, 0];
      const to: [number, number, number] = [2, 0, 0];
      const mid = calculateHopPosition(from, to, 0.5, 0.6);

      expect(mid[0]).toBe(1);
      expect(mid[1]).toBeCloseTo(0.6, 3); // sin(PI/2) * 0.6 = 0.6
      expect(mid[2]).toBe(0);
    });

    it('should safely clamp progress when < 0 or > 1', () => {
      const from: [number, number, number] = [1, 2, 3];
      const to: [number, number, number] = [4, 5, 6];

      const under = calculateHopPosition(from, to, -0.5, 0.5);
      const over = calculateHopPosition(from, to, 1.5, 0.5);

      expect(under).toEqual([1, 2, 3]);
      expect(over).toEqual([4, 5, 6]);
    });
  });

  describe('Building Tile Positions and Tiers', () => {
    it('should place buildings on inner board edge facing towards island center', () => {
      // South tile (e.g. tile 3): z is decreased inwards
      const southPos = getTileBuildingPosition(3, 0.65);
      expect(southPos[2]).toBeCloseTo(TILE_CENTER_OFFSET - 0.65, 3);

      // North tile (e.g. tile 19): z is increased inwards
      const northPos = getTileBuildingPosition(19, 0.65);
      expect(northPos[2]).toBeCloseTo(-TILE_CENTER_OFFSET + 0.65, 3);

      // West tile (e.g. tile 11): x is increased inwards
      const westPos = getTileBuildingPosition(11, 0.65);
      expect(westPos[0]).toBeCloseTo(-TILE_CENTER_OFFSET + 0.65, 3);

      // East tile (e.g. tile 27): x is decreased inwards
      const eastPos = getTileBuildingPosition(27, 0.65);
      expect(eastPos[0]).toBeCloseTo(TILE_CENTER_OFFSET - 0.65, 3);
    });

    it('should correctly map property states to 5 building tiers', () => {
      // Unowned -> -1
      expect(getBuildingTier({ ownerId: null })).toBe(-1);
      expect(getBuildingTier({})).toBe(-1);

      // Owned, 0 houses -> Tier 0 (Flag)
      expect(getBuildingTier({ ownerId: 'player_1', houseCount: 0 })).toBe(0);

      // Owned, 1 house -> Tier 1 (Village House 1)
      expect(getBuildingTier({ ownerId: 'player_1', houseCount: 1 })).toBe(1);

      // Owned, 2 houses -> Tier 2 (Village House 2)
      expect(getBuildingTier({ ownerId: 'player_1', houseCount: 2 })).toBe(2);

      // Owned, 3 houses -> Tier 3 (Luxury Villa)
      expect(getBuildingTier({ ownerId: 'player_1', houseCount: 3 })).toBe(3);

      // Owned, 4 houses or hasResort -> Tier 4 (Grand Resort)
      expect(getBuildingTier({ ownerId: 'player_1', houseCount: 4 })).toBe(4);
      expect(getBuildingTier({ ownerId: 'player_1', houseCount: 2, hasResort: true })).toBe(4);
    });
  });

  describe('Dice Rotations and Face Normals', () => {
    it('should have correct local face normal vectors for all 6 faces', () => {
      expect(getDiceFaceNormal(1)).toEqual([0, 1, 0]); // Top
      expect(getDiceFaceNormal(6)).toEqual([0, -1, 0]); // Bottom
      expect(getDiceFaceNormal(2)).toEqual([0, 0, 1]); // Front
      expect(getDiceFaceNormal(5)).toEqual([0, 0, -1]); // Back
      expect(getDiceFaceNormal(3)).toEqual([1, 0, 0]); // Right
      expect(getDiceFaceNormal(4)).toEqual([-1, 0, 0]); // Left
    });

    it('should rotate each die face to point UP [0, 1, 0] under its target Euler', () => {
      for (let value = 1; value <= 6; value++) {
        const normal = getDiceFaceNormal(value);
        const euler = getDiceTargetEuler(value, 0);
        const rotated = rotateVectorByEuler(normal, euler);

        // Rotated vector must point UP (+Y)
        expect(rotated[0]).toBeCloseTo(0, 3);
        expect(rotated[1]).toBeCloseTo(1, 3);
        expect(rotated[2]).toBeCloseTo(0, 3);
      }
    });

    it('should support yaw spinning around Y without affecting UP orientation', () => {
      const arbitraryYaw = 1.23;
      for (let value = 1; value <= 6; value++) {
        const normal = getDiceFaceNormal(value);
        const euler = getDiceTargetEuler(value, arbitraryYaw);
        const rotated = rotateVectorByEuler(normal, euler);

        // Y component remains 1.0 even with arbitrary yaw
        expect(rotated[1]).toBeCloseTo(1, 3);
      }
    });
  });

  describe('Mascot Palettes', () => {
    it('should define distinct color palettes for all 4 mascots', () => {
      const mascots = ['PIG', 'FOX', 'CAT', 'BUFFALO'] as const;
      for (const m of mascots) {
        const palette = MASCOT_PALETTES[m];
        expect(palette).toBeDefined();
        expect(palette.primary).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(palette.secondary).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(palette.name).toBeTruthy();
      }
    });
  });
});

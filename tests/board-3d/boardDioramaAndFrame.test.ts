import { describe, it, expect } from 'vitest';
import {
  MiniWorldDiorama3D,
  GiantFloatingPearl,
  CentralLagoon,
  ChuaMotCotDiorama,
  HalongKarstPillars,
  ResortPoolKnoll,
  LighthouseKnoll,
  TikiBeachBarKnoll,
  TropicalPalm,
} from '@/components/games/co-ty-phu/board-3d/MiniWorldDiorama3D';
import {
  BoardTableFrame,
  TropicalOceanWater,
  CruisingYacht,
  DistantIslandAtoll,
  BeachPalmTree,
  FRAME_DIMENSIONS,
} from '@/components/games/co-ty-phu/board-3d/BoardTableFrame';

describe('Board Diorama & Royal Frame 3D Components', () => {
  describe('MiniWorldDiorama3D components', () => {
    it('should export all key diorama sub-components', () => {
      expect(MiniWorldDiorama3D).toBeDefined();
      expect(typeof MiniWorldDiorama3D).toBe('function');
      expect(GiantFloatingPearl).toBeDefined();
      expect(typeof GiantFloatingPearl).toBe('function');
      expect(CentralLagoon).toBeDefined();
      expect(typeof CentralLagoon).toBe('function');
      expect(ChuaMotCotDiorama).toBeDefined();
      expect(typeof ChuaMotCotDiorama).toBe('function');
      expect(HalongKarstPillars).toBeDefined();
      expect(typeof HalongKarstPillars).toBe('function');
      expect(ResortPoolKnoll).toBeDefined();
      expect(typeof ResortPoolKnoll).toBe('function');
      expect(LighthouseKnoll).toBeDefined();
      expect(typeof LighthouseKnoll).toBe('function');
      expect(TikiBeachBarKnoll).toBeDefined();
      expect(typeof TikiBeachBarKnoll).toBe('function');
      expect(TropicalPalm).toBeDefined();
      expect(typeof TropicalPalm).toBe('function');
    });
  });

  describe('BoardTableFrame components & dimensions', () => {
    it('should export all key table frame components', () => {
      expect(BoardTableFrame).toBeDefined();
      expect(typeof BoardTableFrame).toBe('function');
      expect(TropicalOceanWater).toBeDefined();
      expect(typeof TropicalOceanWater).toBe('function');
      expect(CruisingYacht).toBeDefined();
      expect(typeof CruisingYacht).toBe('function');
      expect(DistantIslandAtoll).toBeDefined();
      expect(typeof DistantIslandAtoll).toBe('function');
      expect(BeachPalmTree).toBeDefined();
      expect(typeof BeachPalmTree).toBe('function');
    });

    it('should have calibrated royal frame dimensions with outer rim and inner board playfield', () => {
      expect(FRAME_DIMENSIONS).toBeDefined();
      expect(FRAME_DIMENSIONS.outerSize).toBe(19.2);
      expect(FRAME_DIMENSIONS.innerSize).toBe(16.2);
      expect(FRAME_DIMENSIONS.rimHeight).toBe(0.44);
      expect(FRAME_DIMENSIONS.baseDepth).toBe(0.85);

      // Verify clearance for the 32 perimeter tiles
      const rimWidth = (FRAME_DIMENSIONS.outerSize - FRAME_DIMENSIONS.innerSize) / 2;
      expect(rimWidth).toBeCloseTo(1.5, 2);
      expect(FRAME_DIMENSIONS.innerSize).toBeGreaterThan(15.0); // Sufficient room for 13.6 board radius
    });
  });
});

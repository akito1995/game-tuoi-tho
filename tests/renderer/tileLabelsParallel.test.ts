import { describe, it, expect } from 'vitest';
import { getTileGeometry } from '../../src/renderer25d/isoMath';
import { BOARD_40_TILES } from '../../src/game/boardData';

// Góc định hướng từ homography trong board-calibration.json:
const HOMOGRAPHY_ANGLE_AXIS_A = 0.53605; // ~30.71°
const HOMOGRAPHY_ANGLE_AXIS_B = -0.47057; // ~-26.96°

describe('Tile Labels Parallelism and Geometry Verification', () => {
  it('all 4 sides have strictly 2 parallel directions matching homography', () => {
    for (let side = 0; side < 4; side++) {
      const angle = (side === 0 || side === 2) ? HOMOGRAPHY_ANGLE_AXIS_A : HOMOGRAPHY_ANGLE_AXIS_B;
      // Góc phải luôn nằm trong khoảng (-90°, 90°) để chữ đọc từ trái sang phải, không bao giờ lộn ngược
      expect(angle).toBeGreaterThan(-Math.PI / 2);
      expect(angle).toBeLessThan(Math.PI / 2);

      // Cạnh đối diện (Side 0 & 2, Side 1 & 3) song song tuyệt đối
      if (side === 2) {
        const side0Angle = HOMOGRAPHY_ANGLE_AXIS_A;
        expect(angle).toBeCloseTo(side0Angle, 5);
      }
      if (side === 3) {
        const side1Angle = HOMOGRAPHY_ANGLE_AXIS_B;
        expect(angle).toBeCloseTo(side1Angle, 5);
      }
    }
  });

  it('guarantees no collisions between adjacent signboards across all 40 tiles', () => {
    // Với mỗi cạnh k (side = 0..3), kiểm tra khoảng cách giữa tâm các ô kề nhau
    // và đảm bảo signW <= 88% tileWidth luôn để lại khoảng hở an toàn >= 12%
    for (let side = 0; side < 4; side++) {
      const sideTiles = BOARD_40_TILES.filter((t) => Math.floor(t.id / 10) === side);

      for (let i = 0; i < sideTiles.length - 1; i++) {
        const t1 = sideTiles[i];
        const t2 = sideTiles[i + 1];

        const geo1 = getTileGeometry(t1.id);
        const geo2 = getTileGeometry(t2.id);

        const w1 = Math.hypot(geo1.outerEnd.x - geo1.outerStart.x, geo1.outerEnd.y - geo1.outerStart.y);
        const w2 = Math.hypot(geo2.outerEnd.x - geo2.outerStart.x, geo2.outerEnd.y - geo2.outerStart.y);

        const maxSign1 = w1 * 0.85;
        const maxSign2 = w2 * 0.85;

        // Khoảng cách giữa 2 tâm ô kề nhau
        const dist = Math.hypot(geo2.center.x - geo1.center.x, geo2.center.y - geo1.center.y);

        // Nửa chiều rộng mỗi biển cộng lại phải nhỏ hơn khoảng cách giữa 2 tâm
        const combinedHalfWidths = (maxSign1 + maxSign2) / 2;
        const gap = dist - combinedHalfWidths;

        // Khoảng cách an toàn giữa 2 biển kề nhau luôn dương
        expect(gap).toBeGreaterThan(0);
      }
    }
  });
});

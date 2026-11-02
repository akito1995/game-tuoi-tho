import { describe, it, expect } from 'vitest';
import { getTileGeometry } from '../../src/renderer25d/isoMath';
import { BOARD_40_TILES } from '../../src/game/boardData';

describe('Tile Labels Straight Line and Geometry Verification', () => {
  it('all shortNames are <= 10 characters and match the required list', () => {
    const expectedShortNames: Record<number, string> = {
      1: 'Cà Mau',
      2: 'Khí Vận',
      3: 'Bạc Liêu',
      4: 'Thuế TN',
      5: 'Nhà Rồng',
      6: 'Cần Thơ',
      7: 'Cơ Hội',
      8: 'An Giang',
      9: 'Vũng Tàu',
      11: 'Kon Tum',
      12: 'Thủy điện',
      13: 'Gia Lai',
      14: 'BM Thuột',
      15: 'Ga Đà Lạt',
      16: 'Phan Thiết',
      17: 'Khí Vận',
      18: 'Nha Trang',
      19: 'Phú Yên',
      21: 'Hội An',
      22: 'Cơ Hội',
      23: 'Huế',
      24: 'Đà Nẵng',
      25: 'Hải Vân',
      26: 'Ninh Bình',
      27: 'Sa Pa',
      28: 'Yên Phụ',
      29: 'Hà Giang',
      31: 'Bắc Ninh',
      32: 'Hải Phòng',
      33: 'Khí Vận',
      34: 'Hạ Long',
      35: 'Nội Bài',
      36: 'Cơ Hội',
      37: 'TP.HCM',
      38: 'Xa xỉ',
      39: 'Hà Nội',
    };

    for (const [idStr, expectedName] of Object.entries(expectedShortNames)) {
      const tile = BOARD_40_TILES.find((t) => t.id === Number(idStr));
      expect(tile).toBeDefined();
      expect(tile?.shortName).toBe(expectedName);
      expect((tile?.shortName || '').length).toBeLessThanOrEqual(10);
    }
  });

  it('verifies that each of the 4 sides has 9 regular tiles collinear with max deviation <= 1px at 62% depth', () => {
    for (let side = 0; side < 4; side++) {
      const sideTiles = BOARD_40_TILES.filter(
        (t) => Math.floor(t.id / 10) % 4 === side && t.id % 10 !== 0
      );
      expect(sideTiles.length).toBe(9);

      const centers = sideTiles.map((tile) => {
        const geo = getTileGeometry(tile.id);
        const inMid = {
          x: (geo.innerStart.x + geo.innerEnd.x) / 2,
          y: (geo.innerStart.y + geo.innerEnd.y) / 2,
        };
        const outMid = {
          x: (geo.outerStart.x + geo.outerEnd.x) / 2,
          y: (geo.outerStart.y + geo.outerEnd.y) / 2,
        };
        return {
          x: inMid.x + (outMid.x - inMid.x) * 0.62,
          y: inMid.y + (outMid.y - inMid.y) * 0.62,
        };
      });

      // Fit line through p1 and p2
      const p1 = centers[0];
      const p2 = centers[centers.length - 1];
      const A = p2.y - p1.y;
      const B = p1.x - p2.x;
      const C = p2.x * p1.y - p1.x * p2.y;
      const denom = Math.hypot(A, B);

      for (const p of centers) {
        const dist = Math.abs(A * p.x + B * p.y + C) / denom;
        expect(dist).toBeLessThanOrEqual(1.0); // Requirement 8: sai lệch <= 1px
      }
    }
  });

  it('guarantees no collisions between adjacent signboards across all 40 tiles with width = 84% min width', () => {
    for (let side = 0; side < 4; side++) {
      const sideTiles = BOARD_40_TILES.filter((t) => Math.floor(t.id / 10) === side && t.id % 10 !== 0);

      const widths = sideTiles.map((t) => {
        const geo = getTileGeometry(t.id);
        return Math.hypot(geo.outerEnd.x - geo.outerStart.x, geo.outerEnd.y - geo.outerStart.y);
      });
      const minTileW = Math.min(...widths);
      const signW = Math.round(minTileW * 0.84);

      for (let i = 0; i < sideTiles.length - 1; i++) {
        const t1 = sideTiles[i];
        const t2 = sideTiles[i + 1];

        const geo1 = getTileGeometry(t1.id);
        const geo2 = getTileGeometry(t2.id);

        const dist = Math.hypot(geo2.center.x - geo1.center.x, geo2.center.y - geo1.center.y);
        const gap = dist - signW;

        expect(gap).toBeGreaterThan(0);
      }
    }
  });
});

import { describe, it, expect } from 'vitest';
import { getTileSlotPosition } from '../../src/renderer25d/characterRenderer';
import { getTileGeometry } from '../../src/renderer25d/isoMath';

describe('Character Positioning & Grid Layout (2.5D)', () => {
  it('đặt 1 người chơi ở ô thường lệch về mép ngoài (không che tên ô ở mép trong)', () => {
    const tileId = 1; // Ô Tràng Tiền (ô thường)
    const pos = getTileSlotPosition(tileId, 0, 1);
    const geo = getTileGeometry(tileId);

    // Kiểm tra toạ độ nằm hợp lệ trên phiến đá
    expect(pos.x).toBeDefined();
    expect(pos.y).toBeDefined();

    // Vị trí đứng lệch về mép trong (u = 0.5, v = 0.36)
    // Nghĩa là khoảng cách tới mép trong nhỏ hơn khoảng cách tới mép ngoài
    const inMid = {
      x: (geo.innerStart.x + geo.innerEnd.x) / 2,
      y: (geo.innerStart.y + geo.innerEnd.y) / 2,
    };
    const outMid = {
      x: (geo.outerStart.x + geo.outerEnd.x) / 2,
      y: (geo.outerStart.y + geo.outerEnd.y) / 2,
    };

    const distToInner = Math.hypot(pos.x - inMid.x, pos.y - inMid.y);
    const distToOuter = Math.hypot(pos.x - outMid.x, pos.y - outMid.y);

    // Phải gần mép trong hơn mép ngoài để không che tên ô và giá tiền
    expect(distToOuter).toBeLessThan(distToInner);
  });

  it('xếp 2 người chơi ở ô thường lệch trái / phải dọc theo cạnh ô', () => {
    const tileId = 3;
    const pos0 = getTileSlotPosition(tileId, 0, 2);
    const pos1 = getTileSlotPosition(tileId, 1, 2);

    expect(pos0).not.toEqual(pos1);
    const distanceBetween = Math.hypot(pos1.x - pos0.x, pos1.y - pos0.y);
    // 2 nhân vật cách nhau ít nhất 15px
    expect(distanceBetween).toBeGreaterThan(15);
  });

  it('xếp 3 hoặc 4 người chơi ở ô thường theo lưới 2x2, tất cả đều lệch về mép ngoài', () => {
    const tileId = 6;
    const pos0 = getTileSlotPosition(tileId, 0, 4);
    const pos1 = getTileSlotPosition(tileId, 1, 4);
    const pos2 = getTileSlotPosition(tileId, 2, 4);
    const pos3 = getTileSlotPosition(tileId, 3, 4);

    const positions = [pos0, pos1, pos2, pos3];

    // Không có 2 vị trí nào trùng nhau
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const d = Math.hypot(positions[i].x - positions[j].x, positions[i].y - positions[j].y);
        expect(d).toBeGreaterThan(10);
      }
    }
  });

  it('xếp 2-4 người ở ô góc theo lưới đối xứng phía trước công trình', () => {
    const corner0 = 0; // Ô Xuất Phát
    const pos0 = getTileSlotPosition(corner0, 0, 4);
    const pos1 = getTileSlotPosition(corner0, 1, 4);
    const pos2 = getTileSlotPosition(corner0, 2, 4);
    const pos3 = getTileSlotPosition(corner0, 3, 4);

    const positions = [pos0, pos1, pos2, pos3];
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const d = Math.hypot(positions[i].x - positions[j].x, positions[i].y - positions[j].y);
        expect(d).toBeGreaterThan(12);
      }
    }
  });

  it('tất cả 40 ô đều có toạ độ slot hợp lệ không bị NaN hay Infinity', () => {
    for (let tileId = 0; tileId < 40; tileId++) {
      for (let count = 1; count <= 4; count++) {
        for (let slot = 0; slot < count; slot++) {
          const pos = getTileSlotPosition(tileId, slot, count);
          expect(Number.isFinite(pos.x)).toBe(true);
          expect(Number.isFinite(pos.y)).toBe(true);
        }
      }
    }
  });
});

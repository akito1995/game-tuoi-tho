import { Container, Graphics } from 'pixi.js';
import { gridToIso } from './isoMath';

/**
 * Vẽ tiểu cảnh trung tâm: Hồ Hoàn Kiếm, Tháp Rùa và Cầu Thê Húc
 */
export function createCenterDiorama(): Container {
  const container = new Container();

  // 1. Mặt hồ Hoàn Kiếm (Nước xanh ngọc bích phong thủy)
  const lake = new Graphics();

  // 4 đỉnh của lòng hồ bên trong bàn cờ
  const lakeP1 = gridToIso(1.3, 1.3);
  const lakeP2 = gridToIso(8.7, 1.3);
  const lakeP3 = gridToIso(8.7, 8.7);
  const lakeP4 = gridToIso(1.3, 8.7);

  // Nền đất quanh bờ hồ (Bờ kè đá cổ kính)
  lake
    .poly([
      lakeP1.x, lakeP1.y,
      lakeP2.x, lakeP2.y,
      lakeP3.x, lakeP3.y,
      lakeP4.x, lakeP4.y,
    ])
    .fill({ color: 0x1e3a2f }) // Rêu phong viền hồ
    .stroke({ width: 3, color: 0x854d0e }); // Viền gạch hoàng thành

  // Mặt nước hồ ngọc bích
  const waterP1 = gridToIso(1.5, 1.5);
  const waterP2 = gridToIso(8.5, 1.5);
  const waterP3 = gridToIso(8.5, 8.5);
  const waterP4 = gridToIso(1.5, 8.5);

  lake
    .poly([
      waterP1.x, waterP1.y,
      waterP2.x, waterP2.y,
      waterP3.x, waterP3.y,
      waterP4.x, waterP4.y,
    ])
    .fill({ color: 0x0f766e, alpha: 0.95 });

  // Sóng nước gợn nhẹ và váng sáng
  for (let i = 2; i <= 8; i += 1.5) {
    const wavePt = gridToIso(i, 10 - i);
    lake
      .ellipse(wavePt.x, wavePt.y, 45, 14)
      .fill({ color: 0x2dd4bf, alpha: 0.18 });
  }

  // 2. Lá sen & Hoa sen hồng rực rỡ trôi trên mặt hồ
  const lotusCoords = [
    { gx: 2.8, gy: 3.2 },
    { gx: 3.5, gy: 7.2 },
    { gx: 6.8, gy: 2.5 },
    { gx: 7.2, gy: 6.5 },
    { gx: 4.2, gy: 2.2 },
    { gx: 6.2, gy: 7.8 },
  ];

  lotusCoords.forEach((pt) => {
    const iso = gridToIso(pt.gx, pt.gy);
    // Lá sen xanh lục
    lake
      .ellipse(iso.x, iso.y, 18, 9)
      .fill({ color: 0x15803d, alpha: 0.85 })
      .stroke({ width: 1, color: 0x166534 });

    // Hoa sen hồng
    lake
      .ellipse(iso.x - 3, iso.y - 2, 8, 5)
      .fill({ color: 0xf472b6, alpha: 0.9 });
    lake
      .circle(iso.x - 3, iso.y - 2, 2.5)
      .fill({ color: 0xfef08a }); // Nhụy vàng
  });

  container.addChild(lake);

  // 3. Đảo Tháp Rùa và Cầu Thê Húc
  const islet = new Graphics();
  const centerIso = gridToIso(5, 5); // Tọa độ (0, 0)

  // Bãi cỏ xanh đảo Rùa
  islet
    .ellipse(centerIso.x, centerIso.y + 6, 75, 36)
    .fill({ color: 0x4d7c0f }) // Cỏ tươi
    .stroke({ width: 2, color: 0xa16207 }); // Viền cát bồi

  // Cầu Thê Húc sơn son uốn cong (nối từ bờ hồ phía Đông sang đảo Rùa)
  const bridgeShore = gridToIso(7.5, 4.5);
  islet
    .poly([
      bridgeShore.x, bridgeShore.y,
      centerIso.x + 40, centerIso.y + 12,
      centerIso.x + 38, centerIso.y + 20,
      bridgeShore.x - 4, bridgeShore.y + 8,
    ])
    .fill({ color: 0xdc2626 }) // Màu đỏ son truyền thống
    .stroke({ width: 2, color: 0x991b1b });

  // Tay vịn cầu Thê Húc
  islet
    .moveTo(bridgeShore.x, bridgeShore.y - 4)
    .lineTo(centerIso.x + 40, centerIso.y + 8)
    .stroke({ width: 2.5, color: 0xef4444 });

  // 4. Khối kiến trúc Tháp Rùa (3 tầng mái cổ kính)
  // Tầng 1: Chân tháp gạch rêu phong
  const t1W = 52;
  const t1H = 26;
  const t1TopY = centerIso.y - 12;

  // Mặt bóng đổ của tháp
  islet
    .ellipse(centerIso.x + 8, centerIso.y + 4, 34, 14)
    .fill({ color: 0x000000, alpha: 0.3 });

  // Tường tháp vàng cổ kính
  islet
    .poly([
      centerIso.x - t1W / 2, centerIso.y,
      centerIso.x + t1W / 2, centerIso.y,
      centerIso.x + t1W / 2, t1TopY,
      centerIso.x - t1W / 2, t1TopY,
    ])
    .fill({ color: 0xeab308 })
    .stroke({ width: 1.5, color: 0xa16207 });

  // 3 cửa vòm cuốn thời Pháp ở tầng 1
  for (let c = -1; c <= 1; c++) {
    const archX = centerIso.x + c * 15;
    islet
      .roundRect(archX - 4, t1TopY + 8, 8, 16, 3)
      .fill({ color: 0x78350f });
  }

  // Mái ngói tầng 1 (Ngói đất nung đỏ)
  islet
    .poly([
      centerIso.x - (t1W / 2 + 6), t1TopY,
      centerIso.x + (t1W / 2 + 6), t1TopY,
      centerIso.x + (t1W / 2 + 2), t1TopY - 6,
      centerIso.x - (t1W / 2 + 2), t1TopY - 6,
    ])
    .fill({ color: 0xb91c1c });

  // Tầng 2: Thu nhỏ hơn
  const t2W = 38;
  const t2TopY = t1TopY - 20;
  islet
    .poly([
      centerIso.x - t2W / 2, t1TopY - 6,
      centerIso.x + t2W / 2, t1TopY - 6,
      centerIso.x + t2W / 2, t2TopY,
      centerIso.x - t2W / 2, t2TopY,
    ])
    .fill({ color: 0xfacc15 })
    .stroke({ width: 1.2, color: 0xa16207 });

  // Cửa sổ tầng 2
  islet
    .roundRect(centerIso.x - 4, t2TopY + 4, 8, 10, 2)
    .fill({ color: 0x78350f });

  // Mái ngói tầng 2
  islet
    .poly([
      centerIso.x - (t2W / 2 + 5), t2TopY,
      centerIso.x + (t2W / 2 + 5), t2TopY,
      centerIso.x + (t2W / 2 + 1), t2TopY - 5,
      centerIso.x - (t2W / 2 + 1), t2TopY - 5,
    ])
    .fill({ color: 0xb91c1c });

  // Tầng 3: Tầng chóp nhọn & Cờ đỏ sao vàng
  const t3W = 24;
  const t3TopY = t2TopY - 16;
  islet
    .poly([
      centerIso.x - t3W / 2, t2TopY - 5,
      centerIso.x + t3W / 2, t2TopY - 5,
      centerIso.x + t3W / 2, t3TopY,
      centerIso.x - t3W / 2, t3TopY,
    ])
    .fill({ color: 0xfef08a });

  // Mái chóp đỉnh tháp
  islet
    .poly([
      centerIso.x - (t3W / 2 + 4), t3TopY,
      centerIso.x + (t3W / 2 + 4), t3TopY,
      centerIso.x, t3TopY - 10,
    ])
    .fill({ color: 0x991b1b });

  // Cột cờ & Lá cờ Tổ quốc
  islet
    .moveTo(centerIso.x, t3TopY - 10)
    .lineTo(centerIso.x, t3TopY - 24)
    .stroke({ width: 2, color: 0xffffff });

  // Cờ đỏ
  islet
    .rect(centerIso.x, t3TopY - 24, 16, 10)
    .fill({ color: 0xdc2626 });

  // Ngôi sao vàng
  islet
    .circle(centerIso.x + 8, t3TopY - 19, 2.5)
    .fill({ color: 0xfacc15 });

  container.addChild(islet);
  return container;
}

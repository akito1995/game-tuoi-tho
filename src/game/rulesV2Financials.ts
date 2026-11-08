import { RENT_RULES } from './gameConfig';
/**
 * CỜ TỶ PHÚ v2 - HÀNH TRÌNH XUYÊN VIỆT
 * Quy chuẩn tính Tiền thuê, Giá xây dựng & Bảng giá theo đúng docs/rules-v2.md
 */

import { Tile, ColorGroup, COLOR_GROUP_HEX } from './types';

export interface RentTableRow {
  id: number | string;
  label: string;
  valueDisplay: string;
  isNow: boolean;
}

export interface TileRentBreakdown {
  caption: string;
  rows: RentTableRow[];
  hint: string;
}

export interface BuildingCostInfo {
  houseCost: number;
  landmarkCost: number;
}

/**
 * Tra cứu thông tin hiển thị Eyebrow (Nhóm màu & Khu vực văn hóa)
 */
export function getTileEyebrowInfo(tile: Tile): {
  colorHex: string;
  eyebrowText: string;
  subtitle: string;
} {
  const group = tile.colorGroup;

  if (tile.type === 'TRANSPORT') {
    let transportType = 'Đầu mối';
    if (tile.id === 5) transportType = 'Cảng biển';
    else if (tile.id === 15) transportType = 'Đường sắt';
    else if (tile.id === 25) transportType = 'Đèo hiểm trở';
    else if (tile.id === 35) transportType = 'Hàng không';

    return {
      colorHex: '#8A8F98',
      eyebrowText: `Giao thông · ${transportType}`,
      subtitle: tile.ownerId ? 'Đã có chủ sở hữu' : 'Chưa có chủ',
    };
  }

  if (tile.type === 'UTILITY') {
    let utilType = 'Năng lượng';
    if (tile.id === 12) utilType = 'Thủy điện';
    else if (tile.id === 28) utilType = 'Cấp nước';

    return {
      colorHex: '#D69E2E',
      eyebrowText: `Tiện ích · ${utilType}`,
      subtitle: tile.ownerId ? 'Đã có chủ sở hữu' : 'Chưa có chủ',
    };
  }

  // Nhóm đất thường
  const groupHex = group && COLOR_GROUP_HEX[group] ? COLOR_GROUP_HEX[group] : '#EE5FA0';
  let regionName = 'Việt Nam';

  switch (group) {
    case 'BROWN':
      regionName = 'Mũi đất phương Nam';
      break;
    case 'LIGHT_BLUE':
      regionName = 'Miền Tây – Nam Bộ';
      break;
    case 'PINK':
      regionName = 'Tây Nguyên';
      break;
    case 'ORANGE':
      regionName = 'Duyên hải Nam Trung Bộ';
      break;
    case 'RED':
      regionName = 'Miền Trung di sản';
      break;
    case 'YELLOW':
      regionName = 'Tây Bắc – Đông Bắc';
      break;
    case 'GREEN':
      regionName = 'Đồng bằng Bắc Bộ';
      break;
    case 'DARK_BLUE':
      regionName = 'Hai đô thị lớn';
      break;
    default:
      regionName = 'Bất động sản';
  }

  const groupName =
    group === 'BROWN'
      ? 'Nhóm Nâu'
      : group === 'LIGHT_BLUE'
      ? 'Nhóm Xanh nhạt'
      : group === 'PINK'
      ? 'Nhóm Hồng'
      : group === 'ORANGE'
      ? 'Nhóm Cam'
      : group === 'RED'
      ? 'Nhóm Đỏ'
      : group === 'YELLOW'
      ? 'Nhóm Vàng'
      : group === 'GREEN'
      ? 'Nhóm Xanh lá'
      : group === 'DARK_BLUE'
      ? 'Nhóm Xanh đậm'
      : 'Bất động sản';

  let statusText = 'Đất chưa có chủ';
  if (tile.hasLandmark) {
    statusText = `Đã xây Landmark (${tile.landmarkName || 'Kỳ quan'})`;
  } else if ((tile.houseCount || 0) > 0) {
    statusText = `Hiện có ${tile.houseCount} nhà`;
  } else if (tile.ownerId) {
    statusText = 'Đất trống (đã có chủ)';
  }

  return {
    colorHex: groupHex,
    eyebrowText: `${groupName} · ${regionName}`,
    subtitle: statusText,
  };
}

/**
 * Tính chi phí xây dựng theo docs/rules-v2.md
 * Nâu, Xanh nhạt: 50K / 100K
 * Hồng, Cam: 100K / 200K
 * Đỏ, Vàng: 150K / 300K
 * Xanh lá, Xanh đậm: 200K / 400K
 */
export function getTileBuildingCosts(tile: Tile): BuildingCostInfo {
  const group = tile.colorGroup;
  let houseCost = 100000;

  switch (group) {
    case 'BROWN':
    case 'LIGHT_BLUE':
      houseCost = 50000;
      break;
    case 'PINK':
    case 'ORANGE':
      houseCost = 100000;
      break;
    case 'RED':
    case 'YELLOW':
      houseCost = 150000;
      break;
    case 'GREEN':
    case 'DARK_BLUE':
      houseCost = 200000;
      break;
    default:
      houseCost = tile.housePrice || 100000;
  }

  return {
    houseCost,
    landmarkCost: houseCost * 2,
  };
}

/**
 * Lấy chi phí nâng cấp cho bước tiếp theo (xây nhà tiếp theo hoặc landmark)
 */
export function getNextUpgradeCost(tile: Tile): number {
  const { houseCost, landmarkCost } = getTileBuildingCosts(tile);
  const currentHouse = tile.houseCount || 0;
  if (currentHouse >= 4) {
    return landmarkCost;
  }
  return houseCost;
}

/**
 * Kiểm tra người chơi có độc quyền cụm màu (Monopoly) hay không
 */
export function checkMonopoly(tiles: Tile[], colorGroup?: ColorGroup, ownerId?: string | null): boolean {
  if (!colorGroup || !ownerId) return false;
  const groupTiles = tiles.filter((t) => t.colorGroup === colorGroup);
  if (groupTiles.length === 0) return false;
  return groupTiles.every((t) => t.ownerId === ownerId);
}

/**
 * Hàm tính tiền thuê chuẩn xác dùng chung cho toàn bộ Game Engine, Bot AI và Thẻ mua/xây.
 * Theo đúng chuẩn docs/rules-v2.md:
 * - Đất trống: 10% P (nhân đôi nếu độc quyền cụm màu)
 * - Nhà cấp 1: 50% P
 * - Nhà cấp 2: 130% P
 * - Nhà cấp 3: 250% P
 * - Nhà cấp 4: 350% P
 * - Landmark: 500% P
 * - Giao thông (4 ô): 25K / 50K / 100K / 200K theo số ga sở hữu
 * - Tiện ích (2 ô): Tổng xúc xắc × 10.000đ (1 ô) hoặc × 25.000đ (cả 2 ô)
 */
export function calculateTileRent(tile: Tile, allTiles: Tile[] = [], diceSum?: number): number {
  if (tile.isMortgaged) return 0;

  // 1. Ô GIAO THÔNG (Đọc từ bảng RENT_RULES thống nhất)
  if (tile.type === 'TRANSPORT') {
    if (!tile.ownerId) return RENT_RULES.TRANSPORT_RATES[0];
    const ownedTransportCount = allTiles.filter(
      (t) => t.type === 'TRANSPORT' && t.ownerId === tile.ownerId
    ).length;
    const count = Math.max(1, Math.min(4, ownedTransportCount));
    return RENT_RULES.TRANSPORT_RATES[count - 1];
  }

  // 2. Ô TIỆN ÍCH (Đọc từ bảng RENT_RULES thống nhất)
  if (tile.type === 'UTILITY') {
    const ownedUtilityCount = tile.ownerId
      ? allTiles.filter((t) => t.type === 'UTILITY' && t.ownerId === tile.ownerId).length
      : 1;
    const multiplier = ownedUtilityCount >= 2 ? RENT_RULES.UTILITY_MULTIPLIER_BOTH : RENT_RULES.UTILITY_MULTIPLIER_SINGLE;
    const roll = diceSum && diceSum > 0 ? diceSum : 7;
    return roll * multiplier;
  }

  // 3. Ô ĐẤT BẤT ĐỘNG SẢN (Đọc từ bảng RENT_RULES thống nhất)
  const P = tile.price || 100000;

  if (tile.hasLandmark) {
    return Math.round(P * RENT_RULES.LANDMARK_RATIO);
  }

  const houseCount = tile.houseCount || 0;
  if (houseCount === 0) {
    let ratio = RENT_RULES.EMPTY_LAND_RATIO;
    if (tile.colorGroup && checkMonopoly(allTiles, tile.colorGroup, tile.ownerId)) {
      ratio = RENT_RULES.EMPTY_LAND_MONOPOLY_RATIO;
    }
    return Math.round(P * ratio);
  }
  if (houseCount === 1) return Math.round(P * RENT_RULES.HOUSE_1_RATIO);
  if (houseCount === 2) return Math.round(P * RENT_RULES.HOUSE_2_RATIO);
  if (houseCount === 3) return Math.round(P * RENT_RULES.HOUSE_3_RATIO);
  if (houseCount >= 4) return Math.round(P * RENT_RULES.HOUSE_4_RATIO);

  return Math.round(P * RENT_RULES.EMPTY_LAND_RATIO);
}

/**
 * Tạo bảng tiền thuê chi tiết cho 3 biến thể thẻ (Đất, Giao thông, Tiện ích)
 * Đúng từng con số và format theo docs/rules-v2.md và mockup-the-mua-dat.html
 */
export function getTileRentBreakdown(
  tile: Tile,
  allTiles: Tile[] = [],
  highlightNextLevel: boolean = false
): TileRentBreakdown {
  const P = tile.price || 100000;
  const currentHouse = tile.houseCount || 0;
  const isLandmark = !!tile.hasLandmark;

  // Xác định dòng nào đang là cấp độ hiện tại (hoặc cấp tiếp theo nếu đang xem mua/nâng cấp)
  const activeLevel = highlightNextLevel
    ? isLandmark
      ? 5
      : currentHouse + 1
    : isLandmark
    ? 5
    : currentHouse;

  // ================= 1. BIẾN THỂ Ô ĐẤT =================
  if (tile.type === 'PROPERTY') {
    const { houseCost, landmarkCost } = getTileBuildingCosts(tile);
    const rent0 = Math.round(P * 0.1);
    const rent1 = Math.round(P * 0.5);
    const rent2 = Math.round(P * 1.3);
    const rent3 = Math.round(P * 2.5);
    const rent4 = Math.round(P * 3.5);
    const rent5 = Math.round(P * 5.0);

    const landmarkLabel = tile.landmarkName
      ? `Landmark · ${tile.landmarkName}`
      : 'Landmark';

    const rows: RentTableRow[] = [
      {
        id: 0,
        label: 'Đất trống',
        valueDisplay: `${rent0.toLocaleString('vi-VN')}đ`,
        isNow: activeLevel === 0,
      },
      {
        id: 1,
        label: 'Nhà cấp 1',
        valueDisplay: `${rent1.toLocaleString('vi-VN')}đ`,
        isNow: activeLevel === 1,
      },
      {
        id: 2,
        label: 'Nhà cấp 2',
        valueDisplay: `${rent2.toLocaleString('vi-VN')}đ`,
        isNow: activeLevel === 2,
      },
      {
        id: 3,
        label: 'Nhà cấp 3',
        valueDisplay: `${rent3.toLocaleString('vi-VN')}đ`,
        isNow: activeLevel === 3,
      },
      {
        id: 4,
        label: 'Nhà cấp 4',
        valueDisplay: `${rent4.toLocaleString('vi-VN')}đ`,
        isNow: activeLevel === 4,
      },
      {
        id: 5,
        label: landmarkLabel,
        valueDisplay: `${rent5.toLocaleString('vi-VN')}đ`,
        isNow: activeLevel >= 5,
      },
    ];

    const hint = `Giá xây mỗi cấp ${houseCost.toLocaleString('vi-VN')}đ · Landmark ${landmarkCost.toLocaleString('vi-VN')}đ · Đất trống ×2 khi sở hữu trọn nhóm`;

    return {
      caption: 'Tiền thuê',
      rows,
      hint,
    };
  }

  // ================= 2. BIẾN THỂ Ô GIAO THÔNG =================
  if (tile.type === 'TRANSPORT') {
    const ownedCount = tile.ownerId
      ? allTiles.filter((t) => t.type === 'TRANSPORT' && t.ownerId === tile.ownerId).length
      : 1;

    const rows: RentTableRow[] = [
      {
        id: 1,
        label: 'Sở hữu 1 ga',
        valueDisplay: '25.000đ',
        isNow: ownedCount <= 1,
      },
      {
        id: 2,
        label: 'Sở hữu 2 ga',
        valueDisplay: '50.000đ',
        isNow: ownedCount === 2,
      },
      {
        id: 3,
        label: 'Sở hữu 3 ga',
        valueDisplay: '100.000đ',
        isNow: ownedCount === 3,
      },
      {
        id: 4,
        label: 'Sở hữu 4 ga',
        valueDisplay: '200.000đ',
        isNow: ownedCount >= 4,
      },
    ];

    const hint =
      'Dừng ở ga của mình: trả 50.000đ để đi thẳng tới ga khác · Độc quyền 4 ga = thắng';

    return {
      caption: 'Tiền thuê theo số ga sở hữu',
      rows,
      hint,
    };
  }

  // ================= 3. BIẾN THỂ Ô TIỆN ÍCH =================
  if (tile.type === 'UTILITY') {
    const ownedCount = tile.ownerId
      ? allTiles.filter((t) => t.type === 'UTILITY' && t.ownerId === tile.ownerId).length
      : 1;

    const rows: RentTableRow[] = [
      {
        id: 1,
        label: 'Sở hữu 1 ô tiện ích',
        valueDisplay: 'Tổng xúc xắc × 10.000đ',
        isNow: ownedCount <= 1,
      },
      {
        id: 2,
        label: 'Sở hữu cả 2 ô tiện ích',
        valueDisplay: 'Tổng xúc xắc × 25.000đ',
        isNow: ownedCount >= 2,
      },
    ];

    const hint =
      'Tiền thuê tính bằng điểm xúc xắc người đối thủ đổ được nhân với hệ số tương ứng';

    return {
      caption: 'Tiền thuê tiện ích',
      rows,
      hint,
    };
  }

  return {
    caption: 'Tiền thuê',
    rows: [],
    hint: '',
  };
}

/**
 * Lấy đường dẫn ảnh công trình chuẩn xác, không bao giờ để trống
 */
export function getTileBuildingAssetPath(tile: Tile, isUpgrade: boolean = false): string {
  if (tile.type === 'PROPERTY') {
    if (isUpgrade) {
      const nextLevel = (tile.houseCount || 0) + 1;
      if (nextLevel >= 5) {
        return tile.assetKey ? `/art/buildings/${tile.assetKey}.png` : '/art/buildings/house-4.png';
      }
      if (nextLevel === 4) return '/art/buildings/house-4.png';
      if (nextLevel === 3) return '/art/buildings/house-3.png';
      if (nextLevel === 2) return '/art/buildings/house-2.png';
      return '/art/buildings/house-1.png';
    }
    // Khi mua đất trống: Hiện ảnh house-1 theo yêu cầu 5
    return '/art/buildings/house-1.png';
  }

  if (tile.type === 'TRANSPORT') {
    if (tile.assetKey) return `/art/buildings/${tile.assetKey}.png`;
    if (tile.id === 5) return '/art/buildings/station-nha-rong.png';
    if (tile.id === 15) return '/art/buildings/station-ga-da-lat.png';
    if (tile.id === 25) return '/art/buildings/station-hai-van.png';
    if (tile.id === 35) return '/art/buildings/station-noi-bai.png';
    return '/art/buildings/ben-xe.png';
  }

  if (tile.type === 'UTILITY') {
    if (tile.assetKey) return `/art/buildings/${tile.assetKey}.png`;
    if (tile.id === 12) return '/art/buildings/util-thuy-dien.png';
    if (tile.id === 28) return '/art/buildings/util-nha-may-nuoc.png';
    return '/art/buildings/nha-may-dien.png';
  }

  return '/art/buildings/house-1.png';
}

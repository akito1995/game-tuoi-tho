import { IsoPoint } from './types';
import { CalibratedTile, DEFAULT_BOARD_CORNERS, autoSubdivideBoard, imageToStage } from './tileCalibration';

export const BOARD_PLATE_WIDTH = 1672;
export const BOARD_PLATE_HEIGHT = 940;

/**
 * Vành đai trong: Bám sát chính xác mép nước bờ kè Hồ Hoàn Kiếm
 * (Tọa độ stage = (toạ độ ảnh 3344x1880 - 1672/940) * 0.5)
 */
export const LAKE_RING: IsoPoint[] = [
  { x: -23.5, y: 339 },       // 0: Nam (1625, 1618)
  { x: -573.5, y: -70 },      // 1: Tây (525, 800)
  { x: -21, y: -292.5 },      // 2: Bắc (1630, 355)
  { x: 549, y: -10 },         // 3: Đông (2770, 920)
];

/**
 * Vành đai ngoài: Bám sát chính xác lan can ngoài và chân các dãy nhà phố cổ
 */
export const CURB_RING: IsoPoint[] = [
  { x: -23.5, y: 430 },       // 0: Nam (1625, 1800)
  { x: -733.5, y: -70 },      // 1: Tây (205, 800)
  { x: -21, y: -362.5 },      // 2: Bắc (1630, 215)
  { x: 704, y: -10 },         // 3: Đông (3080, 920)
];

/**
 * Điểm tâm của 4 góc bàn cờ (dùng cho đặt vị trí nhân vật khi đứng ở góc)
 */
export const CORNER_POINTS = {
  C0: { x: -23.5, y: 384 },       // Góc 0: Xuất Phát (Nam)
  C10: { x: -653.5, y: -70 },     // Góc 10: Trại Giam / Bến Xe (Tây)
  C20: { x: -21, y: -327.5 },     // Góc 20: Quán Trà Đá / Côn Đảo (Bắc)
  C30: { x: 626.5, y: -10 },      // Góc 30: Vào Tù (Đông)
};

export interface TileGeometry {
  id: number;
  center: IsoPoint;
  outerStart: IsoPoint;
  outerEnd: IsoPoint;
  innerEnd: IsoPoint;
  innerStart: IsoPoint;
  bannerP1: IsoPoint;
  bannerP2: IsoPoint;
  angle: number;
  isCorner: boolean;
  depthScale: number; // Tỉ lệ co giãn phối cảnh (1.0 ở gần, 0.75 ở xa)
  polygonPoints: IsoPoint[]; // Danh sách toàn bộ các đỉnh đa giác trên stage
}

// Bộ nhớ đệm toạ độ 40 ô đã căn chỉnh được chia sẻ toàn cục
let globalCalibratedTiles: CalibratedTile[] | null = null;
let defaultSubdividedTiles: CalibratedTile[] | null = null;

/**
 * Cập nhật toạ độ 40 ô đất toàn cục khi có thay đổi từ F2 hoặc khi nạp tiles.json
 */
export function setGlobalCalibratedTiles(tiles: CalibratedTile[] | null) {
  if (tiles && tiles.length === 40) {
    globalCalibratedTiles = tiles;
  } else {
    globalCalibratedTiles = null;
  }
}

/**
 * Lấy toạ độ 40 ô mặc định chuẩn
 */
function getDefaultSubdividedTiles(): CalibratedTile[] {
  if (!defaultSubdividedTiles) {
    defaultSubdividedTiles = autoSubdivideBoard(DEFAULT_BOARD_CORNERS);
  }
  return defaultSubdividedTiles;
}

/**
 * Tính toán hình học từng phiến đá chuẩn xác 100% theo dữ liệu 40 ô đã căn chỉnh
 */
export function getTileGeometry(tileId: number, customCalibratedTiles?: CalibratedTile[]): TileGeometry {
  const side = Math.floor(tileId / 10) % 4;
  const isCorner = tileId % 10 === 0;

  const tilesList =
    customCalibratedTiles && customCalibratedTiles.length === 40
      ? customCalibratedTiles
      : globalCalibratedTiles && globalCalibratedTiles.length === 40
      ? globalCalibratedTiles
      : getDefaultSubdividedTiles();

  const tileData = tilesList.find((t) => t.id === tileId) || tilesList[tileId];

  if (tileData && tileData.corners && tileData.corners.length >= 4) {
    const polygonPoints: IsoPoint[] = tileData.corners.map(imageToStage);
    let center: IsoPoint;
    if (tileData.corners.length >= 6) {
      // Tâm đúng nghĩa của ô góc trên mặt phẳng bàn cờ: trung điểm giữa đỉnh ngoài (outer apex) và đỉnh trong (inner apex)
      center = {
        x: (polygonPoints[1].x + polygonPoints[4].x) / 2,
        y: (polygonPoints[1].y + polygonPoints[4].y) / 2,
      };
    } else {
      center = imageToStage(tileData.center);
    }

    let outerStart: IsoPoint;
    let outerEnd: IsoPoint;
    let innerEnd: IsoPoint;
    let innerStart: IsoPoint;

    if (tileData.corners.length >= 6) {
      // Ô góc đa giác 6 đỉnh:
      // [p_out_prev, outer_apex, p_out_next, p_in_next, inner_apex, p_in_prev]
      outerStart = polygonPoints[0];
      outerEnd = polygonPoints[2];
      innerEnd = polygonPoints[3];
      innerStart = polygonPoints[5];
    } else {
      // 4 đỉnh thông thường:
      // [outerStart, outerEnd, innerEnd, innerStart]
      outerStart = polygonPoints[0];
      outerEnd = polygonPoints[1];
      innerEnd = polygonPoints[2];
      innerStart = polygonPoints[3];
    }

    const bannerP1 = outerStart;
    const bannerP2 = outerEnd;

    // Góc nghiêng theo luật phối cảnh 2.5D
    let tangentAngle: number;
    if (side === 0) {
      tangentAngle = 0.57; // Dốc Tây Nam lên Tây Bắc (~33 độ)
    } else if (side === 1) {
      tangentAngle = -0.34; // Dốc Tây Bắc lên Đông Bắc (~-20 độ)
    } else if (side === 2) {
      tangentAngle = 0.46; // Dốc Đông Bắc xuống Đông Nam (~26 độ)
    } else {
      tangentAngle = -0.46; // Dốc Đông Nam về Tây Nam (~-26 độ)
    }

    // Tỉ lệ phối cảnh gần to xa nhỏ:
    // y từ 400 (gần, Nam) đến -350 (xa, Bắc) -> depthScale từ 1.05 xuống 0.72
    const normalizedY = (center.y + 350) / 750;
    const depthScale = 0.72 + 0.33 * Math.max(0, Math.min(1, normalizedY));

    return {
      id: tileId,
      center,
      outerStart,
      outerEnd,
      innerEnd,
      innerStart,
      bannerP1,
      bannerP2,
      angle: tangentAngle,
      isCorner,
      depthScale,
      polygonPoints,
    };
  }

  // Dự phòng an toàn tuyệt đối nếu chưa có tileData
  const c0 = LAKE_RING[side];
  const c1 = CURB_RING[side];
  return {
    id: tileId,
    center: { x: (c0.x + c1.x) / 2, y: (c0.y + c1.y) / 2 },
    outerStart: c1,
    outerEnd: c1,
    innerEnd: c0,
    innerStart: c0,
    bannerP1: c1,
    bannerP2: c1,
    angle: 0,
    isCorner,
    depthScale: 1.0,
    polygonPoints: [c1, c1, c0, c0],
  };
}

/**
 * Hàm chuyển đổi tọa độ lưới sang không gian Isometric (tiểu cảnh bổ trợ)
 */
export function gridToIso(gx: number, gy: number): IsoPoint {
  const normX = gx / 10;
  const normY = gy / 10;
  const topX = LAKE_RING[1].x + (LAKE_RING[2].x - LAKE_RING[1].x) * normX;
  const topY = LAKE_RING[1].y + (LAKE_RING[2].y - LAKE_RING[1].y) * normX;
  const botX = LAKE_RING[0].x + (LAKE_RING[3].x - LAKE_RING[0].x) * normX;
  const botY = LAKE_RING[0].y + (LAKE_RING[3].y - LAKE_RING[0].y) * normX;
  return {
    x: topX + (botX - topX) * normY,
    y: topY + (botY - topY) * normY,
  };
}

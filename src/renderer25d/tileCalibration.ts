import { BOARD_40_TILES } from '../game/boardData';
import { BOARD_PLATE_WIDTH, BOARD_PLATE_HEIGHT } from './isoMath';

export interface Point2D {
  x: number;
  y: number;
  u?: number; // Toạ độ tương đối chuẩn hoá [0..1] theo chiều rộng ảnh
  v?: number; // Toạ độ tương đối chuẩn hoá [0..1] theo chiều cao ảnh
}

export interface CalibratedTile {
  id: number;
  name: string;
  type: 'corner' | 'regular';
  corners: Point2D[]; // 4 nốt cho ô thường, 6 nốt nối liền mạch cho ô góc
  center: Point2D;
}

export interface MarkerData {
  id: string;
  type: 'train_track' | 'lanterns' | 'point';
  label: string;
  points: Point2D[];
}

export interface OuterInnerRingCorners {
  outer: [Point2D, Point2D, Point2D, Point2D]; // [Nam, Tây, Bắc, Đông]
  inner: [Point2D, Point2D, Point2D, Point2D]; // [Nam, Tây, Bắc, Đông]
}

// Tâm ảnh gốc 3344 x 1880
export const IMAGE_WIDTH = 3344;
export const IMAGE_HEIGHT = 1880;
export const CX = 1672;
export const CY = 940;

// 4 Góc chuẩn theo ảnh gốc 3344 x 1880 (đo đạc chính xác khớp 100% từng phiến đá)
export const DEFAULT_BOARD_CORNERS: OuterInnerRingCorners = {
  outer: [
    { x: 1625, y: 1800 }, // 0: Nam (Góc Xuất Phát)
    { x: 205, y: 800 },   // 1: Tây (Góc Bến Xe / Trại Giam)
    { x: 1630, y: 215 },  // 2: Bắc (Góc Quán Trà Đá)
    { x: 3080, y: 920 }   // 3: Đông (Góc Vào Tù)
  ],
  inner: [
    { x: 1625, y: 1618 }, // 0: Nam (Mép nước lòng hồ)
    { x: 525, y: 800 },   // 1: Tây (Mép nước lòng hồ)
    { x: 1630, y: 355 },  // 2: Bắc (Mép nước lòng hồ)
    { x: 2770, y: 920 }   // 3: Đông (Mép nước lòng hồ)
  ]
};

/**
 * Quy đổi toạ độ ảnh (hoặc toạ độ tương đối u, v) sang toạ độ local của Pixi World (1672 x 940, tâm tại 0,0)
 */
export function imageToStage(p: Point2D): Point2D {
  if (p.u !== undefined && p.v !== undefined) {
    return {
      x: (p.u - 0.5) * BOARD_PLATE_WIDTH,
      y: (p.v - 0.5) * BOARD_PLATE_HEIGHT,
      u: p.u,
      v: p.v,
    };
  }
  return {
    x: (p.x - CX) * 0.5,
    y: (p.y - CY) * 0.5,
    u: Math.round((p.x / IMAGE_WIDTH) * 1000000) / 1000000,
    v: Math.round((p.y / IMAGE_HEIGHT) * 1000000) / 1000000,
  };
}

/**
 * Quy đổi toạ độ local của Pixi World sang toạ độ ảnh gốc và toạ độ tương đối u, v [0..1]
 */
export function stageToImage(p: Point2D): Point2D {
  const u = Math.min(1, Math.max(0, p.x / BOARD_PLATE_WIDTH + 0.5));
  const v = Math.min(1, Math.max(0, p.y / BOARD_PLATE_HEIGHT + 0.5));
  return {
    x: Math.round(p.x * 2 + CX),
    y: Math.round(p.y * 2 + CY),
    u: Math.round(u * 1000000) / 1000000,
    v: Math.round(v * 1000000) / 1000000,
  };
}

/**
 * Quy đổi toạ độ ảnh gốc sang toạ độ hiển thị trên màn hình trình duyệt (Screen Pixel)
 */
export function imageToScreen(
  p: Point2D,
  pan: Point2D,
  zoom: number,
  screenWidth: number,
  screenHeight: number
): Point2D {
  const stageP = imageToStage(p);
  const screenCX = screenWidth / 2;
  const screenCY = screenHeight / 2;
  return {
    x: screenCX + pan.x + stageP.x * zoom,
    y: screenCY + pan.y + stageP.y * zoom
  };
}

/**
 * Quy đổi toạ độ chuột trên màn hình về toạ độ ảnh gốc 3344 x 1880
 */
export function screenToImage(
  screenX: number,
  screenY: number,
  pan: Point2D,
  zoom: number,
  screenWidth: number,
  screenHeight: number
): Point2D {
  const screenCX = screenWidth / 2;
  const screenCY = screenHeight / 2;

  const stageX = (screenX - screenCX - pan.x) / zoom;
  const stageY = (screenY - screenCY - pan.y) / zoom;

  return stageToImage({ x: stageX, y: stageY });
}

function lerpPoint(p1: Point2D, p2: Point2D, t: number): Point2D {
  return {
    x: Math.round(p1.x + (p2.x - p1.x) * t),
    y: Math.round(p1.y + (p2.y - p1.y) * t)
  };
}

function computeCentroid(corners: Point2D[]): Point2D {
  let sumX = 0;
  let sumY = 0;
  for (const c of corners) {
    sumX += c.x;
    sumY += c.y;
  }
  return {
    x: Math.round(sumX / corners.length),
    y: Math.round(sumY / corners.length)
  };
}

/**
 * Thuật toán "Tự chia đều" 40 ô theo phối cảnh (Perspective Auto-subdivision):
 * - 4 ô góc (0, 10, 20, 30) là các ô vuông lớn chiếm 1.5 đơn vị tỉ lệ mỗi chiều.
 * - Mỗi cạnh còn lại gồm 9 ô thông thường chiếm 1.0 đơn vị tỉ lệ.
 * - Tổng chiều dài mỗi cạnh = 1.5 (góc đầu) + 9 x 1.0 + 1.5 (góc cuối) = 12 đơn vị.
 */
export function autoSubdivideBoard(ringCorners: OuterInnerRingCorners = DEFAULT_BOARD_CORNERS): CalibratedTile[] {
  const { outer, inner } = ringCorners;
  const tiles: CalibratedTile[] = [];

  const TOTAL_UNITS = 12.0;
  const CORNER_UNIT = 1.5;

  for (let side = 0; side < 4; side++) {
    const nextSide = (side + 1) % 4;
    const prevSide = (side + 3) % 4;

    // 1. Ô góc (0, 10, 20, 30) - đa giác 6 đỉnh khớp khít tuyệt đối với 2 ô kề bên
    const cornerId = side * 10;
    const tileDefCorner = BOARD_40_TILES[cornerId];

    const tPrev = (TOTAL_UNITS - CORNER_UNIT) / TOTAL_UNITS;
    const pOutPrev = lerpPoint(outer[prevSide], outer[side], tPrev);
    const pInPrev = lerpPoint(inner[prevSide], inner[side], tPrev);

    const tNext = CORNER_UNIT / TOTAL_UNITS;
    const pOutNext = lerpPoint(outer[side], outer[nextSide], tNext);
    const pInNext = lerpPoint(inner[side], inner[nextSide], tNext);

    const cornerPoints: Point2D[] = [
      pOutPrev,
      outer[side],
      pOutNext,
      pInNext,
      inner[side],
      pInPrev
    ];

    const cornerCenter = computeCentroid(cornerPoints);

    tiles.push({
      id: cornerId,
      name: tileDefCorner?.name || `Ô ${cornerId}`,
      type: 'corner',
      corners: cornerPoints,
      center: cornerCenter
    });

    // 2. 9 ô thông thường (side * 10 + 1 .. side * 10 + 9)
    const oStart = outer[side];
    const oEnd = outer[nextSide];
    const iStart = inner[side];
    const iEnd = inner[nextSide];

    for (let k = 0; k < 9; k++) {
      const tileId = side * 10 + 1 + k;
      const tileDefReg = BOARD_40_TILES[tileId];

      const t1 = (CORNER_UNIT + k) / TOTAL_UNITS;
      const t2 = (CORNER_UNIT + k + 1) / TOTAL_UNITS;

      const cOutStart = lerpPoint(oStart, oEnd, t1);
      const cOutEnd = lerpPoint(oStart, oEnd, t2);
      const cInEnd = lerpPoint(iStart, iEnd, t2);
      const cInStart = lerpPoint(iStart, iEnd, t1);

      const regPoints: Point2D[] = [cOutStart, cOutEnd, cInEnd, cInStart];
      const regCenter = computeCentroid(regPoints);

      tiles.push({
        id: tileId,
        name: tileDefReg?.name || `Ô ${tileId}`,
        type: 'regular',
        corners: regPoints,
        center: regCenter
      });
    }
  }

  // Sắp xếp thứ tự ô từ 0 -> 39
  tiles.sort((a, b) => a.id - b.id);
  return tiles;
}

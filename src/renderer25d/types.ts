/**
 * CỜ TỶ PHÚ v2 (2.5D) - HÀNH TRÌNH XUYÊN VIỆT
 * 2.5D Renderer Configuration & Types
 */

export interface IsoPoint {
  x: number;
  y: number;
}

export interface GridCoord {
  gx: number;
  gy: number;
}

export interface BoardDimensions {
  stepX: number; // Khoảng cách xiên trục X (px)
  stepY: number; // Khoảng cách xiên trục Y (px)
  tileLength: number; // Độ dài cạnh ô
  tileBreadth: number; // Độ rộng ô
  slabDepth: number; // Độ dày khối 2.5D (độ sâu 3D giả lập)
}

export const DEFAULT_BOARD_DIMENSIONS: BoardDimensions = {
  stepX: 96,
  stepY: 48,
  tileLength: 96,
  tileBreadth: 72,
  slabDepth: 22,
};

export interface CameraState {
  x: number;
  y: number;
  zoom: number;
  minZoom: number;
  maxZoom: number;
}

export const DEFAULT_CAMERA: CameraState = {
  x: 0,
  y: 0,
  zoom: 1.0,
  minZoom: 0.7,
  maxZoom: 2.0,
};

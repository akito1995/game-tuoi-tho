import { Texture } from 'pixi.js';
import ambientDataRaw from '../art/tile-ambient-colors.json';

interface AmbientColorData {
  farHaze: {
    rgb: number[];
    hex: string;
    r: number;
    g: number;
    b: number;
  };
  tiles: Record<
    string,
    {
      id: number;
      name: string;
      rgb: number[];
      hex: string;
      r: number;
      g: number;
      b: number;
    }
  >;
}

const ambientData = ambientDataRaw as unknown as AmbientColorData;

export interface HarmonizeOptions {
  tileId?: number;
  stageY?: number; // Tọa độ Y trên stage (-350 Bắc đến +400 Nam)
  isCharacter?: boolean;
  isCorner?: boolean;
  customAmbientHex?: string;
}

// Trạng thái bật/tắt toàn cục cho công tắc F3
let harmonizationEnabled = true;

// Bộ nhớ đệm texture đã nướng (Key: assetKey_t{tileId})
const harmonizedTextureCache = new Map<string, Texture>();

// Danh sách các listeners lắng nghe sự kiện đổi trạng thái Bật/Tắt
type HarmonizeChangeListener = (enabled: boolean) => void;
const changeListeners = new Set<HarmonizeChangeListener>();

export function isHarmonizationEnabled(): boolean {
  return harmonizationEnabled;
}

export function setHarmonizationEnabled(enabled: boolean) {
  if (harmonizationEnabled !== enabled) {
    harmonizationEnabled = enabled;
    changeListeners.forEach((fn) => fn(enabled));
  }
}

export function addHarmonizationListener(fn: HarmonizeChangeListener) {
  changeListeners.add(fn);
  return () => {
    changeListeners.delete(fn);
  };
}

export function clearHarmonizationCache() {
  harmonizedTextureCache.clear();
}

/**
 * Nướng texture hoà sắc với ánh sáng, màu sắc và không khí của ảnh nền board-plate.
 * Đảm bảo nướng một lần duy nhất (offline baking), lưu cache để đạt 60+ FPS.
 */
export async function getHarmonizedTexture(
  rawTexture: Texture,
  cacheKey: string,
  options: HarmonizeOptions = {}
): Promise<Texture> {
  if (!harmonizationEnabled) {
    return rawTexture;
  }

  const tileId = options.tileId ?? 0;
  const stageY = options.stageY ?? 0;
  const fullKey = `${cacheKey}_t${tileId}_y${Math.round(stageY / 100) * 100}`;

  if (harmonizedTextureCache.has(fullKey)) {
    return harmonizedTextureCache.get(fullKey)!;
  }

  try {
    const baked = await bakeTexture(rawTexture, options);
    harmonizedTextureCache.set(fullKey, baked);
    return baked;
  } catch (err) {
    console.warn(`Lỗi khi nướng texture hoà màu cho ${cacheKey}:`, err);
    return rawTexture;
  }
}

/**
 * Thuật toán nướng ảnh qua Canvas2D:
 * 1. Chỉnh màu tươi tắn: tăng bão hoà 5%, tăng tương phản 6%, ám ấm 4%.
 * 2. Ánh nắng & Rim Light: dải chuyển trên-trái (screen 8%), viền sáng 1-2px vàng nhạt (#FFEBAA).
 * 3. Phối cảnh không khí: chỉ giữ sương 4% cho hàng ô xa nhất (Bắc).
 * 4. Không làm mờ tilt-shift: sprite luôn sắc nét.
 * 5. Mép cắt: làm mềm mép silhouette 0.7px.
 * 6. Làm nét nhẹ (Unsharp Mask): giúp chi tiết kiến trúc, mái ngói, gạch đá sắc sảo, không bệt.
 */
async function bakeTexture(rawTexture: Texture, options: HarmonizeOptions): Promise<Texture> {
  if (typeof document === 'undefined') {
    return rawTexture;
  }

  // Lấy image source gốc từ Pixi Texture
  const sourceResource = (rawTexture.source as any)?.resource;
  let imgSource: CanvasImageSource | null = null;

  if (sourceResource instanceof HTMLImageElement || sourceResource instanceof ImageBitmap || sourceResource instanceof HTMLCanvasElement) {
    imgSource = sourceResource;
  } else if (rawTexture.source && (rawTexture.source as any).uploadMethodId) {
    imgSource = (rawTexture.source as any).resource;
  }

  const w = rawTexture.width;
  const h = rawTexture.height;

  if (!w || !h) {
    return rawTexture;
  }

  // Khởi tạo Canvas offscreen để xử lý
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return rawTexture;

  if (imgSource) {
    ctx.drawImage(imgSource, 0, 0, w, h);
  } else {
    return rawTexture;
  }

  // Lấy dữ liệu điểm ảnh (ImageData) để xử lý chính xác từng pixel
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  // Lấy màu môi trường của ô tương ứng (src/art/tile-ambient-colors.json)
  const tileId = options.tileId ?? 0;
  const tileInfo = ambientData.tiles[String(tileId)] || ambientData.tiles['0'];
  const ambR = tileInfo.rgb[0];
  const ambG = tileInfo.rgb[1];
  const ambB = tileInfo.rgb[2];

  // Màu sương mù xa (farHaze)
  const hazeR = ambientData.farHaze.rgb[0];
  const hazeG = ambientData.farHaze.rgb[1];
  const hazeB = ambientData.farHaze.rgb[2];

  // Hệ số phối cảnh không khí theo Y (-350 đến +400):
  // Chỉ áp dụng sương 4% cho hàng ô xa nhất (stageY < -240)
  const stageY = options.stageY ?? 0;
  let hazeRatio = 0;
  if (stageY < -240) {
    const tNorth = Math.min(1.0, (-240 - stageY) / 100);
    hazeRatio = 0.04 * tNorth; // Tối đa 4% cho hàng ô xa nhất
  }

  // Tạo mảng tạm cho kênh alpha để làm mềm mép (0.7px) và tính Rim Light
  const alphaBuffer = new Uint8Array(w * h);
  for (let i = 0; i < data.length; i += 4) {
    alphaBuffer[i >> 2] = data[i + 3];
  }

  // Quét toàn bộ điểm ảnh
  for (let y = 0; y < h; y++) {
    const yRatio = y / h;
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) << 2;
      const a = data[idx + 3];

      if (a < 5) continue; // Bỏ qua điểm ảnh hoàn toàn trong suốt

      let r = data[idx];
      let g = data[idx + 1];
      let b = data[idx + 2];

      // Làm mềm mép silhouette 0.7px (chỉ tác động vùng biên trong suốt, không làm mờ thân)
      if (a < 240) {
        let neighborSum = 0;
        let count = 0;
        for (let dy = -1; dy <= 1; dy++) {
          const ny = y + dy;
          if (ny < 0 || ny >= h) continue;
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx;
            if (nx < 0 || nx >= w) continue;
            neighborSum += alphaBuffer[ny * w + nx];
            count++;
          }
        }
        const avgA = neighborSum / count;
        data[idx + 3] = Math.round(a * 0.4 + avgA * 0.6);
      }

      // 1. Ám ấm 4%
      r = Math.min(255, r * 1.04);
      g = Math.min(255, g * 1.01);
      b = Math.max(0, b * 0.96);

      // 2. Tăng bão hoà 5%
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      r = lum + (r - lum) * 1.05;
      g = lum + (g - lum) * 1.05;
      b = lum + (b - lum) * 1.05;

      // 3. Tăng tương phản 6%
      r = (r - 128) * 1.06 + 128;
      g = (g - 128) * 1.06 + 128;
      b = (b - 128) * 1.06 + 128;

      // Pha 3% màu môi trường của ô nhẹ nhàng
      r = r * 0.97 + ambR * 0.03;
      g = g * 0.97 + ambG * 0.03;
      b = b * 0.97 + ambB * 0.03;

      // Ánh nắng: dải chuyển sáng nhẹ từ trên-trái (screen 8%)
      const xRatio = x / w;
      const diag = (xRatio + yRatio) * 0.5; // 0 ở góc trên-trái, 1 ở góc dưới-phải
      const sunStrength = Math.max(0, (1.0 - diag) * 0.08);
      r = 255 - (255 - r) * (1.0 - sunStrength);
      g = 255 - (255 - g) * (1.0 - sunStrength);
      b = 255 - (255 - b) * (1.0 - sunStrength * 0.80);

      // Viền sáng mảnh màu vàng nhạt ở mép trên-trái (Rim Light #FFEBAA)
      if (a > 60) {
        const topAlpha = y >= 2 ? alphaBuffer[(y - 2) * w + x] : 0;
        const leftAlpha = x >= 2 ? alphaBuffer[y * w + (x - 2)] : 0;
        if (topAlpha < 40 || leftAlpha < 40) {
          r = Math.min(255, r + 38);
          g = Math.min(255, g + 32);
          b = Math.min(255, b + 15);
        }
      }

      // Sương 4% cho hàng ô xa nhất
      if (hazeRatio > 0.001) {
        r = r * (1.0 - hazeRatio) + hazeR * hazeRatio;
        g = g * (1.0 - hazeRatio) + hazeG * hazeRatio;
        b = b * (1.0 - hazeRatio) + hazeB * hazeRatio;
      }

      data[idx] = Math.round(Math.max(0, Math.min(255, r)));
      data[idx + 1] = Math.round(Math.max(0, Math.min(255, g)));
      data[idx + 2] = Math.round(Math.max(0, Math.min(255, b)));
    }
  }

  // 6. Làm nét nhẹ (Unsharp Mask): tăng độ sắc nét cho kiến trúc, mái ngói
  const sharpenedData = new Uint8ClampedArray(data);
  const sharpenFactor = 0.28; // Cường độ làm nét vừa phải
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = (y * w + x) << 2;
      const a = data[idx + 3];
      if (a < 30) continue;

      const idxTop = ((y - 1) * w + x) << 2;
      const idxBottom = ((y + 1) * w + x) << 2;
      const idxLeft = (y * w + (x - 1)) << 2;
      const idxRight = (y * w + (x + 1)) << 2;

      for (let c = 0; c < 3; c++) {
        const center = data[idx + c];
        const avgNeighbor = (data[idxTop + c] + data[idxBottom + c] + data[idxLeft + c] + data[idxRight + c]) * 0.25;
        const diff = center - avgNeighbor;
        sharpenedData[idx + c] = Math.max(0, Math.min(255, center + diff * sharpenFactor));
      }
    }
  }

  // Đưa dữ liệu đã xử lý vào ImageData
  imgData.data.set(sharpenedData);
  ctx.putImageData(imgData, 0, 0);

  // Tạo Pixi Texture từ Canvas
  const bakedTexture = Texture.from(canvas);
  return bakedTexture;
}

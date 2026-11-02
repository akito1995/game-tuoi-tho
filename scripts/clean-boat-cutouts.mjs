import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const ROOT_DIR = process.cwd();
const SRC_DIR = path.join(ROOT_DIR, 'public', 'art', 'ambient');
const CLEAN_DIR = path.join(ROOT_DIR, 'public', 'art', '_clean', 'ambient');

fs.mkdirSync(CLEAN_DIR, { recursive: true });

async function defringeBoat(filename) {
  const srcPath = path.join(SRC_DIR, filename);
  const outPath = path.join(CLEAN_DIR, filename);

  const { data, info } = await sharp(srcPath).raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const out = Buffer.from(data);

  // 1. Khử quầng trắng (Unmatting từ nền trắng)
  for (let i = 0; i < out.length; i += 4) {
    const a = out[i + 3];
    if (a === 0) continue;

    // Các điểm cực mờ gần trắng ở rìa thì làm trong suốt hoàn toàn
    if (a < 40 && out[i] > 215 && out[i + 1] > 215 && out[i + 2] > 215) {
      out[i + 3] = 0;
      continue;
    }

    const alpha = a / 255;
    if (alpha < 0.98) {
      for (let c = 0; c < 3; c++) {
        const val = out[i + c];
        const unmat = (val - 255 * (1 - alpha)) / alpha;
        out[i + c] = Math.max(0, Math.min(255, Math.round(unmat)));
      }

      if (alpha < 0.30 && out[i] > 235 && out[i + 1] > 235 && out[i + 2] > 235) {
        out[i + 3] = 0;
      }
    }
  }

  // 2. Lan tỏa màu (Color bleed) từ các điểm đặc liền kề để xóa hoàn toàn vệt trắng
  const isOpaque = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      if (out[idx + 3] > 190 && !(out[idx] > 235 && out[idx + 1] > 235 && out[idx + 2] > 235)) {
        isOpaque[y * w + x] = 1;
      }
    }
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const a = out[idx + 3];
      if (a > 0 && a < 190) {
        let bestR = out[idx], bestG = out[idx + 1], bestB = out[idx + 2];
        let found = false;
        for (let r = 1; r <= 3 && !found; r++) {
          for (let dy = -r; dy <= r && !found; dy++) {
            for (let dx = -r; dx <= r && !found; dx++) {
              const ny = y + dy, nx = x + dx;
              if (ny >= 0 && ny < h && nx >= 0 && nx < w && isOpaque[ny * w + nx]) {
                const nidx = (ny * w + nx) * 4;
                bestR = out[nidx];
                bestG = out[nidx + 1];
                bestB = out[nidx + 2];
                found = true;
              }
            }
          }
        }
        if (found) {
          out[idx] = bestR;
          out[idx + 1] = bestG;
          out[idx + 2] = bestB;
        }
      }
    }
  }

  await sharp(out, { raw: { width: w, height: h, channels: 4 } })
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(outPath);

  // Đồng bộ sang cả thư mục public/art/ambient
  fs.copyFileSync(outPath, srcPath);
  console.log(`[Defringe Boat] Hoàn tất khử quầng trắng: ${filename} -> ${outPath}`);
}

(async () => {
  await defringeBoat('ambient-thuyen-1.png');
  await defringeBoat('ambient-thuyen-2.png');
})();

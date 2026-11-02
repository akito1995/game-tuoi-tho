import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const ROOT_DIR = process.cwd();
const SRC_DIR = path.join(ROOT_DIR, 'public', 'art', 'ambient');
const CLEAN_DIR = path.join(ROOT_DIR, 'public', 'art', '_clean', 'ambient');

fs.mkdirSync(CLEAN_DIR, { recursive: true });

/**
 * 1. Làm sạch TÀU ĐIỆN (ambient-tau-dien.png)
 * - Xóa sạch mảng đường/nền đất ở hai bên (x < 190 và x > 948)
 * - Xóa sạch quầng trắng (white halos) và mảng xanh lá thừa
 * - Unmatting viền và color bleed từ thân tàu đặc
 * - Trim sát viền + 8px lề trong suốt
 */
async function cleanTrain() {
  const filename = 'ambient-tau-dien.png';
  const srcPath = path.join(SRC_DIR, filename);
  const outPath = path.join(CLEAN_DIR, filename);

  const { data, info } = await sharp(srcPath).raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const out = Buffer.from(data);

  // A. Loại bỏ toàn bộ mảng nền đường/phố ở hai bên ngoài thân tàu
  // Thân tàu thực tế nằm trong khoảng x từ 190 đến 948
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      if (x < 190 || x > 948) {
        out[idx + 3] = 0; // Làm trong suốt hoàn toàn
      }
    }
  }

  // B. Khử quầng trắng (Unmatting) và xóa mảng xanh/trắng bám viền
  for (let i = 0; i < out.length; i += 4) {
    const a = out[i + 3];
    if (a === 0) continue;

    const r = out[i];
    const g = out[i + 1];
    const b = out[i + 2];

    // Xóa các điểm trắng mờ ở rìa
    if (r > 215 && g > 215 && b > 215) {
      if (a < 180) {
        out[i + 3] = 0;
        continue;
      }
    }

    // Xóa điểm ám xanh lá thừa từ nền tách chưa hết
    if (g > 80 && g > r * 1.15 && g > b * 1.15 && a < 200) {
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
    }
  }

  // C. Tìm Connected Components để chỉ giữ lại duy nhất thân tàu điện
  const visited = new Uint8Array(w * h);
  const comps = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      if (visited[idx] || out[idx * 4 + 3] < 30) continue;
      const queue = [idx];
      visited[idx] = 1;
      let count = 0;
      let head = 0;
      while (head < queue.length) {
        const cur = queue[head++];
        count++;
        const cy = Math.floor(cur / w);
        const cx = cur % w;
        const neighbors = [
          cur - 1, cur + 1, cur - w, cur + w,
          cur - w - 1, cur - w + 1, cur + w - 1, cur + w + 1
        ];
        for (const n of neighbors) {
          if (n >= 0 && n < w * h && !visited[n] && out[n * 4 + 3] >= 30) {
            visited[n] = 1;
            queue.push(n);
          }
        }
      }
      comps.push({ count, queue });
    }
  }

  // Giữ lại các cụm lớn thuộc thân tàu (> 500 điểm)
  const validPixels = new Uint8Array(w * h);
  comps.filter(c => c.count > 500).forEach(c => {
    c.queue.forEach(p => { validPixels[p] = 1; });
  });

  for (let idx = 0; idx < w * h; idx++) {
    if (!validPixels[idx]) {
      out[idx * 4 + 3] = 0;
    }
  }

  // D. Color bleed từ điểm đặc để triệt tiêu mọi viền trắng
  const isOpaque = new Uint8Array(w * h);
  for (let idx = 0; idx < w * h; idx++) {
    const p4 = idx * 4;
    if (out[p4 + 3] > 200 && !(out[p4] > 230 && out[p4 + 1] > 230 && out[p4 + 2] > 230)) {
      isOpaque[idx] = 1;
    }
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      const p4 = idx * 4;
      const a = out[p4 + 3];
      if (a > 0 && a <= 200) {
        let bestR = out[p4], bestG = out[p4 + 1], bestB = out[p4 + 2];
        let found = false;
        for (let r = 1; r <= 3 && !found; r++) {
          for (let dy = -r; dy <= r && !found; dy++) {
            for (let dx = -r; dx <= r && !found; dx++) {
              const ny = y + dy, nx = x + dx;
              if (ny >= 0 && ny < h && nx >= 0 && nx < w && isOpaque[ny * w + nx]) {
                const n4 = (ny * w + nx) * 4;
                bestR = out[n4];
                bestG = out[n4 + 1];
                bestB = out[n4 + 2];
                found = true;
              }
            }
          }
        }
        if (found) {
          out[p4] = bestR;
          out[p4 + 1] = bestG;
          out[p4 + 2] = bestB;
        }
      }
    }
  }

  // E. Trim sát viền và thêm 8px lề trong suốt
  const cleanedBuffer = await sharp(out, { raw: { width: w, height: h, channels: 4 } })
    .trim({ threshold: 10 })
    .extend({ top: 8, bottom: 8, left: 8, right: 8, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ quality: 100, compressionLevel: 9 })
    .toBuffer();

  fs.writeFileSync(outPath, cleanedBuffer);
  fs.writeFileSync(srcPath, cleanedBuffer);

  const finalMeta = await sharp(cleanedBuffer).metadata();
  console.log(`[Clean Train] Hoàn tất tách nền tàu điện: ${finalMeta.width}x${finalMeta.height} -> ${outPath}`);
}

/**
 * 2. Làm sạch THUYỀN (ambient-thuyen-1.png, ambient-thuyen-2.png)
 * - Xóa sạch 50.000+ điểm bán trong suốt mờ mịt quanh thuyền
 * - Unmatting và triệt tiêu quầng trắng
 * - Trim sát viền + 8px lề trong suốt
 */
async function cleanBoat(filename) {
  const srcPath = path.join(SRC_DIR, filename);
  const outPath = path.join(CLEAN_DIR, filename);

  const { data, info } = await sharp(srcPath).raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const out = Buffer.from(data);

  // A. Xóa mọi điểm nhiễu alpha < 45
  for (let i = 0; i < out.length; i += 4) {
    const a = out[i + 3];
    if (a < 45) {
      out[i + 3] = 0;
      continue;
    }

    const r = out[i];
    const g = out[i + 1];
    const b = out[i + 2];

    // Xóa các điểm gần trắng ở rìa
    if (a < 180 && r > 200 && g > 200 && b > 200) {
      out[i + 3] = 0;
      continue;
    }

    // Unmatting từ nền trắng
    const alpha = a / 255;
    if (alpha < 0.98) {
      for (let c = 0; c < 3; c++) {
        const val = out[i + c];
        const unmat = (val - 255 * (1 - alpha)) / alpha;
        out[i + c] = Math.max(0, Math.min(255, Math.round(unmat)));
      }
    }
  }

  // B. Giữ lại duy nhất cụm thân thuyền lớn
  const visited = new Uint8Array(w * h);
  const comps = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      if (visited[idx] || out[idx * 4 + 3] < 30) continue;
      const queue = [idx];
      visited[idx] = 1;
      let count = 0;
      let head = 0;
      while (head < queue.length) {
        const cur = queue[head++];
        count++;
        const cy = Math.floor(cur / w);
        const cx = cur % w;
        const neighbors = [
          cur - 1, cur + 1, cur - w, cur + w,
          cur - w - 1, cur - w + 1, cur + w - 1, cur + w + 1
        ];
        for (const n of neighbors) {
          if (n >= 0 && n < w * h && !visited[n] && out[n * 4 + 3] >= 30) {
            visited[n] = 1;
            queue.push(n);
          }
        }
      }
      comps.push({ count, queue });
    }
  }

  const validPixels = new Uint8Array(w * h);
  comps.filter(c => c.count > 500).forEach(c => {
    c.queue.forEach(p => { validPixels[p] = 1; });
  });

  for (let idx = 0; idx < w * h; idx++) {
    if (!validPixels[idx]) {
      out[idx * 4 + 3] = 0;
    }
  }

  // C. Color bleed từ gỗ đặc vào mép để hoàn toàn không còn viền trắng
  const isOpaque = new Uint8Array(w * h);
  for (let idx = 0; idx < w * h; idx++) {
    const p4 = idx * 4;
    if (out[p4 + 3] > 180 && !(out[p4] > 220 && out[p4 + 1] > 220 && out[p4 + 2] > 220)) {
      isOpaque[idx] = 1;
    }
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      const p4 = idx * 4;
      const a = out[p4 + 3];
      if (a > 0 && a <= 180) {
        let bestR = out[p4], bestG = out[p4 + 1], bestB = out[p4 + 2];
        let found = false;
        for (let r = 1; r <= 3 && !found; r++) {
          for (let dy = -r; dy <= r && !found; dy++) {
            for (let dx = -r; dx <= r && !found; dx++) {
              const ny = y + dy, nx = x + dx;
              if (ny >= 0 && ny < h && nx >= 0 && nx < w && isOpaque[ny * w + nx]) {
                const n4 = (ny * w + nx) * 4;
                bestR = out[n4];
                bestG = out[n4 + 1];
                bestB = out[n4 + 2];
                found = true;
              }
            }
          }
        }
        if (found) {
          out[p4] = bestR;
          out[p4 + 1] = bestG;
          out[p4 + 2] = bestB;
        }
      }
    }
  }

  // D. Trim sát viền + 8px padding trong suốt
  const cleanedBuffer = await sharp(out, { raw: { width: w, height: h, channels: 4 } })
    .trim({ threshold: 10 })
    .extend({ top: 8, bottom: 8, left: 8, right: 8, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ quality: 100, compressionLevel: 9 })
    .toBuffer();

  fs.writeFileSync(outPath, cleanedBuffer);
  fs.writeFileSync(srcPath, cleanedBuffer);

  const finalMeta = await sharp(cleanedBuffer).metadata();
  console.log(`[Clean Boat] Hoàn tất tách nền: ${filename} (${finalMeta.width}x${finalMeta.height}) -> ${outPath}`);
}

(async () => {
  await cleanTrain();
  await cleanBoat('ambient-thuyen-1.png');
  await cleanBoat('ambient-thuyen-2.png');
})();

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const ROOT_DIR = process.cwd();
const SHEETS_DIR = path.join(ROOT_DIR, 'public', 'art', '_sheets');
const CHARACTERS_DIR = path.join(ROOT_DIR, 'public', 'art', 'characters');
const AVATARS_DIR = path.join(ROOT_DIR, 'public', 'art', 'avatars');
const MANIFEST_PATH = path.join(ROOT_DIR, 'src', 'art', 'manifest.json');

// Ensure destination directories exist
fs.mkdirSync(CHARACTERS_DIR, { recursive: true });
fs.mkdirSync(AVATARS_DIR, { recursive: true });
fs.mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true });

/**
 * 1. Process sheet image:
 *    - Flood fill near-white pixels from borders to detect background
 *    - Apply soft edge alpha for anti-aliasing
 *    - Defringe: replace light semi-transparent edge pixels with interior solid neighbor color
 */
async function processSheetBackground(filePath) {
  const image = sharp(filePath);
  const metadata = await image.metadata();
  const { width: w, height: h } = metadata;

  const { data } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const totalPixels = w * h;

  // Check if image already had transparent background
  if (metadata.hasAlpha) {
    let hasTransparent = false;
    for (let i = 0; i < totalPixels; i++) {
      if (data[i * 4 + 3] < 200) {
        hasTransparent = true;
        break;
      }
    }
    if (hasTransparent) {
      return { data, width: w, height: h, hasAlpha: true };
    }
  }

  // Flood fill from borders to identify white background
  const isBgCandidate = (x, y) => {
    const idx = (y * w + x) * 4;
    return data[idx] >= 242 && data[idx + 1] >= 242 && data[idx + 2] >= 242;
  };

  const isBg = new Uint8Array(totalPixels);
  const queue = [];

  // Enqueue all border pixels meeting candidate condition
  for (let x = 0; x < w; x++) {
    if (isBgCandidate(x, 0)) {
      isBg[x] = 1;
      queue.push(x);
    }
    const bIdx = (h - 1) * w + x;
    if (isBgCandidate(x, h - 1)) {
      isBg[bIdx] = 1;
      queue.push(bIdx);
    }
  }
  for (let y = 0; y < h; y++) {
    const lIdx = y * w;
    if (!isBg[lIdx] && isBgCandidate(0, y)) {
      isBg[lIdx] = 1;
      queue.push(lIdx);
    }
    const rIdx = y * w + (w - 1);
    if (!isBg[rIdx] && isBgCandidate(w - 1, y)) {
      isBg[rIdx] = 1;
      queue.push(rIdx);
    }
  }

  // 4-way BFS expansion
  let head = 0;
  while (head < queue.length) {
    const curr = queue[head++];
    const cx = curr % w;
    const cy = Math.floor(curr / w);

    const neighbors = [
      cx > 0 ? curr - 1 : -1,
      cx < w - 1 ? curr + 1 : -1,
      cy > 0 ? curr - w : -1,
      cy < h - 1 ? curr + w : -1
    ];

    for (const n of neighbors) {
      if (n >= 0 && !isBg[n]) {
        const nx = n % w;
        const ny = Math.floor(n / w);
        if (isBgCandidate(nx, ny)) {
          isBg[n] = 1;
          queue.push(n);
        }
      }
    }
  }

  // Create processed RGBA buffer with soft alpha and defringing
  const outData = Buffer.from(data);

  // Set flooded background pixels to alpha = 0
  for (let i = 0; i < totalPixels; i++) {
    if (isBg[i]) {
      outData[i * 4 + 3] = 0;
    }
  }

  // Soft edge transition & Defringing (quầng trắng quanh viền)
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      if (!isBg[idx]) {
        let hasBgNeighbor = false;
        let solidNeighbor = -1;

        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nIdx = (y + dy) * w + (x + dx);
            if (isBg[nIdx]) {
              hasBgNeighbor = true;
            } else if (solidNeighbor === -1) {
              const nr = data[nIdx * 4];
              const ng = data[nIdx * 4 + 1];
              const nb = data[nIdx * 4 + 2];
              if (nr < 210 || ng < 210 || nb < 210) {
                solidNeighbor = nIdx;
              }
            }
          }
        }

        if (hasBgNeighbor) {
          const r = outData[idx * 4];
          const g = outData[idx * 4 + 1];
          const b = outData[idx * 4 + 2];
          const minC = Math.min(r, g, b);
          const distToWhite = 255 - minC;

          // Soft alpha for edge antialiasing
          if (distToWhite < 45) {
            const alphaFactor = Math.max(0, Math.min(1, distToWhite / 45));
            outData[idx * 4 + 3] = Math.round(alphaFactor * 255);
          }

          // Defringe: if pixel is light/near-white, adopt color of adjacent solid pixel
          if (solidNeighbor >= 0 && (r > 200 && g > 200 && b > 200)) {
            outData[idx * 4] = outData[solidNeighbor * 4];
            outData[idx * 4 + 1] = outData[solidNeighbor * 4 + 1];
            outData[idx * 4 + 2] = outData[solidNeighbor * 4 + 2];
          }
        }
      }
    }
  }

  return { data: outData, width: w, height: h, isBg };
}

/**
 * 2. Connected Components Labeling (8-way) with clustering
 */
function findConnectedComponents(data, w, h) {
  const totalPixels = w * h;
  const visited = new Uint8Array(totalPixels);
  const rawComponents = [];

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      const alpha = data[idx * 4 + 3];

      if (alpha > 0 && !visited[idx]) {
        const comp = {
          minX: x,
          maxX: x,
          minY: y,
          maxY: y,
          count: 0,
          pixels: []
        };
        const queue = [idx];
        visited[idx] = 1;
        let head = 0;

        while (head < queue.length) {
          const p = queue[head++];
          const px = p % w;
          const py = Math.floor(p / w);

          comp.count++;
          comp.pixels.push(p);

          if (px < comp.minX) comp.minX = px;
          if (px > comp.maxX) comp.maxX = px;
          if (py < comp.minY) comp.minY = py;
          if (py > comp.maxY) comp.maxY = py;

          const neighbors = [
            px > 0 ? p - 1 : -1,
            px < w - 1 ? p + 1 : -1,
            py > 0 ? p - w : -1,
            py < h - 1 ? p + w : -1,
            px > 0 && py > 0 ? p - w - 1 : -1,
            px < w - 1 && py > 0 ? p - w + 1 : -1,
            px > 0 && py < h - 1 ? p + w - 1 : -1,
            px < w - 1 && py < h - 1 ? p + w + 1 : -1
          ];

          for (const n of neighbors) {
            if (n >= 0 && !visited[n] && data[n * 4 + 3] > 0) {
              visited[n] = 1;
              queue.push(n);
            }
          }
        }

        rawComponents.push(comp);
      }
    }
  }

  // Filter out tiny dust / noise (< 0.2% of image or < 500 pixels) unless near a main component
  const minSignificantPixels = Math.max(500, Math.round(totalPixels * 0.005));
  let significant = rawComponents.filter((c) => c.count >= minSignificantPixels);
  const tiny = rawComponents.filter((c) => c.count < minSignificantPixels);

  // Proximity clustering: merge close fragments (e.g. conical hat separated from head)
  for (const fragment of tiny) {
    if (fragment.count < 30) continue; // ignore sub-30 pixel specs
    let closestComp = null;
    let closestDist = Infinity;

    for (const comp of significant) {
      const dx = Math.max(0, comp.minX - fragment.maxX, fragment.minX - comp.maxX);
      const dy = Math.max(0, comp.minY - fragment.maxY, fragment.minY - comp.maxY);
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < closestDist) {
        closestDist = dist;
        closestComp = comp;
      }
    }

    // If within 40px proximity, merge into significant component
    if (closestDist <= 40 && closestComp) {
      closestComp.pixels.push(...fragment.pixels);
      closestComp.count += fragment.count;
      closestComp.minX = Math.min(closestComp.minX, fragment.minX);
      closestComp.maxX = Math.max(closestComp.maxX, fragment.maxX);
      closestComp.minY = Math.min(closestComp.minY, fragment.minY);
      closestComp.maxY = Math.max(closestComp.maxY, fragment.maxY);
    }
  }

  return significant;
}

/**
 * 3. Extract tight component into isolated RGBA buffer
 */
function extractComponentPixels(sourceData, w, comp) {
  const width = comp.maxX - comp.minX + 1;
  const height = comp.maxY - comp.minY + 1;
  const buffer = Buffer.alloc(width * height * 4, 0);

  const pixelSet = new Set(comp.pixels);

  for (let y = comp.minY; y <= comp.maxY; y++) {
    for (let x = comp.minX; x <= comp.maxX; x++) {
      const srcIdx = y * w + x;
      if (pixelSet.has(srcIdx)) {
        const destIdx = ((y - comp.minY) * width + (x - comp.minX)) * 4;
        buffer[destIdx] = sourceData[srcIdx * 4];
        buffer[destIdx + 1] = sourceData[srcIdx * 4 + 1];
        buffer[destIdx + 2] = sourceData[srcIdx * 4 + 2];
        buffer[destIdx + 3] = sourceData[srcIdx * 4 + 3];
      }
    }
  }

  return { buffer, width, height };
}

/**
 * 4. Split Character Sheet:
 *    - 4 figures left to right
 *    - Normalized frame height (max height among 4 poses + 16px)
 *    - Feet aligned to bottom margin (8px)
 */
async function splitCharacterSheet(filename, id) {
  console.log(`\n▶ Đang xử lý nhân vật: [${id}] từ ${filename}...`);
  const filePath = path.join(SHEETS_DIR, filename);
  const { data, width: w, height: h } = await processSheetBackground(filePath);

  const components = findConnectedComponents(data, w, h);
  console.log(`  Tìm thấy ${components.length} vùng liên thông chính.`);

  // Sort left to right
  components.sort((a, b) => a.minX - b.minX);

  if (components.length !== 4) {
    console.warn(`  ⚠ Cảnh báo: Tìm thấy ${components.length} hình thay vì 4 hình. Sẽ lấy 4 hình lớn nhất.`);
    components.sort((a, b) => b.count - a.count);
    components.splice(4);
    components.sort((a, b) => a.minX - b.minX);
  }

  // Extract raw trimmed figures
  const figures = components.map((c) => extractComponentPixels(data, w, c));

  // Determine max height for height normalization
  const maxTrimmedHeight = Math.max(...figures.map((f) => f.height));
  const normalizedFrameHeight = maxTrimmedHeight + 16; // 8px top + 8px bottom

  const charDir = path.join(CHARACTERS_DIR, id);
  fs.mkdirSync(charDir, { recursive: true });

  const results = [];

  for (let i = 0; i < figures.length; i++) {
    const fig = figures[i];
    const frameWidth = fig.width + 16; // 8px left + 8px right
    const frameBuffer = Buffer.alloc(frameWidth * normalizedFrameHeight * 4, 0);

    // Place figure with feet aligned at bottom margin (8px from bottom)
    const destX = 8;
    const destY = normalizedFrameHeight - 8 - fig.height;

    for (let row = 0; row < fig.height; row++) {
      const srcOffset = row * fig.width * 4;
      const destOffset = ((destY + row) * frameWidth + destX) * 4;
      fig.buffer.copy(frameBuffer, destOffset, srcOffset, srcOffset + fig.width * 4);
    }

    const outFilename = `pose-${i + 1}.png`;
    const outPath = path.join(charDir, outFilename);

    await sharp(frameBuffer, {
      raw: {
        width: frameWidth,
        height: normalizedFrameHeight,
        channels: 4
      }
    })
      .png()
      .toFile(outPath);

    console.log(`  ✓ Lưu ${outFilename}: ${frameWidth}x${normalizedFrameHeight} (feet aligned at bottom)`);
    results.push({
      id,
      poseIndex: i + 1,
      filename: outFilename,
      path: `/art/characters/${id}/${outFilename}`,
      width: frameWidth,
      height: normalizedFrameHeight
    });
  }

  return results;
}

/**
 * 5. Split Avatars Sheet:
 *    - 2x2 grid: top-left (1), top-right (2), bottom-left (3), bottom-right (4)
 *    - 8px transparent margin
 */
async function splitAvatarsSheet(filename) {
  console.log(`\n▶ Đang xử lý avatar: từ ${filename}...`);
  const filePath = path.join(SHEETS_DIR, filename);
  const { data, width: w, height: h } = await processSheetBackground(filePath);

  const components = findConnectedComponents(data, w, h);
  console.log(`  Tìm thấy ${components.length} avatar.`);

  // Classify into 2x2 grid based on centroid
  const midX = w / 2;
  const midY = h / 2;

  const grid = {
    'avatar-1': null, // Top-Left
    'avatar-2': null, // Top-Right
    'avatar-3': null, // Bottom-Left
    'avatar-4': null  // Bottom-Right
  };

  for (const c of components) {
    const cx = (c.minX + c.maxX) / 2;
    const cy = (c.minY + c.maxY) / 2;

    if (cx < midX && cy < midY) grid['avatar-1'] = c;
    else if (cx >= midX && cy < midY) grid['avatar-2'] = c;
    else if (cx < midX && cy >= midY) grid['avatar-3'] = c;
    else if (cx >= midX && cy >= midY) grid['avatar-4'] = c;
  }

  const results = [];

  for (const [name, comp] of Object.entries(grid)) {
    if (!comp) {
      console.warn(`  ⚠ Không tìm thấy avatar cho góc ${name}`);
      continue;
    }

    const fig = extractComponentPixels(data, w, comp);
    const frameWidth = fig.width + 16;
    const frameHeight = fig.height + 16;
    const frameBuffer = Buffer.alloc(frameWidth * frameHeight * 4, 0);

    // Center in 8px padded frame
    const destX = 8;
    const destY = 8;

    for (let row = 0; row < fig.height; row++) {
      const srcOffset = row * fig.width * 4;
      const destOffset = ((destY + row) * frameWidth + destX) * 4;
      fig.buffer.copy(frameBuffer, destOffset, srcOffset, srcOffset + fig.width * 4);
    }

    const outFilename = `${name}.png`;
    const outPath = path.join(AVATARS_DIR, outFilename);

    await sharp(frameBuffer, {
      raw: {
        width: frameWidth,
        height: frameHeight,
        channels: 4
      }
    })
      .png()
      .toFile(outPath);

    console.log(`  ✓ Lưu ${outFilename}: ${frameWidth}x${frameHeight}`);
    results.push({
      name,
      filename: outFilename,
      path: `/art/avatars/${outFilename}`,
      width: frameWidth,
      height: frameHeight
    });
  }

  return results;
}

/**
 * Main execution routine
 */
async function main() {
  console.log('====================================================');
  console.log('🚀 Bắt đầu chạy split-sheets.mjs');
  console.log(`📂 Thư mục nguồn: ${SHEETS_DIR}`);
  console.log('====================================================');

  if (!fs.existsSync(SHEETS_DIR)) {
    console.error(`Không tìm thấy thư mục: ${SHEETS_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(SHEETS_DIR);
  const characterResults = {};
  let avatarResults = [];

  for (const file of files) {
    if (file.startsWith('ref-')) {
      console.log(`⏩ Bỏ qua file tham chiếu: ${file}`);
      continue;
    }

    if (file === 'avatars-sheet.png') {
      avatarResults = await splitAvatarsSheet(file);
    } else if (file.endsWith('-sheet.png')) {
      const charId = file.replace('-sheet.png', '');
      characterResults[charId] = await splitCharacterSheet(file, charId);
    }
  }

  // Generate / update manifest.json
  const manifest = {
    version: '1.0.0',
    updatedAt: new Date().toISOString(),
    characters: characterResults,
    avatars: avatarResults
  };

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log('\n====================================================');
  console.log(`✨ Đã hoàn thành! Đã ghi manifest tại: ${MANIFEST_PATH}`);
  console.log('====================================================');
}

main().catch((err) => {
  console.error('❌ Lỗi khi thực thi split-sheets:', err);
  process.exit(1);
});

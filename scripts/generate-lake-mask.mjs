import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const ROOT_DIR = process.cwd();
const BOARD_PLATE_PATH = path.join(ROOT_DIR, 'public', 'art', 'board', 'board-plate.png');
const OUTPUT_MASK_PATH = path.join(ROOT_DIR, 'public', 'art', 'board', 'lake-mask.png');

// Polygon bounding inner lake shoreline (LAKE_RING coordinates scaled to 3344 x 1880)
// Board center: cx = 1672, cy = 940
// LAKE_RING:
// Nam:   (1672, 940 + 335*2) = (1672, 1610)
// Tây:   (1672 - 581*2, 940 - 60*2) = (510, 820)
// Bắc:   (1672, 940 - 280*2) = (1672, 380)
// Đông:  (1672 + 504*2, 940 + 35*2) = (2680, 1010)
const LAKE_POLY = [
  { x: 1672, y: 1620 }, // South
  { x: 495, y: 820 },   // West
  { x: 1672, y: 365 },  // North
  { x: 2695, y: 1010 }  // East
];

function isInsidePoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y;
    const xj = poly[j].x, yj = poly[j].y;
    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, v = max;
  const d = max - min;
  s = max === 0 ? 0 : d / max;
  if (max === min) {
    h = 0;
  } else {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s, v };
}

/**
 * Determine if pixel is lake water (green/turquoise/deep water)
 * while excluding red bridge, stone island, lotus leaves, and boats
 */
function isWaterPixel(r, g, b) {
  // 1. Exclude Cầu Thê Húc (Bright crimson red: R >> G and R >> B)
  if (r > 130 && r > g * 1.25 && r > b * 1.3) {
    return false;
  }
  if (r > 170 && r > g + 30) {
    return false;
  }

  // 2. Exclude Lotus leaves / flowers (Vibrant yellow-green lime or bright pink)
  // Lotus leaf: very bright high green with yellow
  if (g > 150 && r > 90 && b < 80) {
    return false;
  }
  // Pink lotus flower
  if (r > 170 && b > 120 && r > g) {
    return false;
  }

  // 3. Exclude stone walls / warm terracotta roofs of Tháp Rùa / island rocks
  if (r > 160 && g > 130 && b < 100 && (r - b > 50)) {
    return false;
  }

  // 4. Check Hue & saturation in HSV
  const { h, s, v } = rgbToHsv(r, g, b);

  // Water hues: green to cyan/teal (approx 65° to 215°)
  const isWaterHue = (h >= 65 && h <= 215);

  // Deep shaded water (low brightness but G >= R and B >= R * 0.8)
  const isDeepWater = (v < 0.45 && g >= r * 0.95 && b >= r * 0.85);

  // Sunlit water (moderate/high brightness with greenish/cyan dominance)
  const isSunlitWater = (isWaterHue && s >= 0.10 && v >= 0.25 && g >= r * 0.88);

  // Water reflection on Eastern side (slightly paler green-gray)
  const isEastReflection = (h >= 55 && h <= 170 && s <= 0.45 && v >= 0.55 && g >= r && g >= b);

  return (isWaterHue && (isSunlitWater || isDeepWater || isEastReflection));
}

async function generateLakeMask() {
  console.log('Loading board plate from:', BOARD_PLATE_PATH);
  const image = sharp(BOARD_PLATE_PATH);
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels } = info;
  console.log(`Image dimensions: ${w} x ${h}, channels: ${channels}`);

  const totalPixels = w * h;
  const isWaterCandidate = new Uint8Array(totalPixels);

  // Step 1: Filter candidates within LAKE_POLY
  let candidateCount = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (isInsidePoly(x, y, LAKE_POLY)) {
        const idx = (y * w + x) * channels;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        if (isWaterPixel(r, g, b)) {
          isWaterCandidate[y * w + x] = 1;
          candidateCount++;
        }
      }
    }
  }
  console.log(`Initial water candidate pixels: ${candidateCount} (${((candidateCount / totalPixels) * 100).toFixed(2)}%)`);

  // Step 2: Flood-fill from seed water points to keep the single largest contiguous lake body
  const visited = new Uint8Array(totalPixels);
  const lakeMask = new Uint8Array(totalPixels);

  // Known seeds solidly located in the open water of Hoàn Kiếm lake
  const SEEDS = [
    { x: 1300, y: 950 },  // West
    { x: 2000, y: 950 },  // East
    { x: 1672, y: 1200 }, // South
    { x: 1672, y: 650 },  // North
    { x: 1100, y: 880 },  // Far west
    { x: 2200, y: 980 }   // Far east
  ];

  const queue = new Int32Array(totalPixels);
  let qHead = 0;
  let qTail = 0;

  for (const s of SEEDS) {
    const sIdx = s.y * w + s.x;
    if (isWaterCandidate[sIdx] && !visited[sIdx]) {
      visited[sIdx] = 1;
      queue[qTail++] = sIdx;
    }
  }

  // If seeds somehow missed candidate check, find nearest candidate
  if (qTail === 0) {
    console.warn('Seeds missed candidates, scanning first available candidate inside lake...');
    for (let y = 800; y < 1200; y++) {
      for (let x = 1200; x < 2100; x++) {
        const idx = y * w + x;
        if (isWaterCandidate[idx]) {
          visited[idx] = 1;
          queue[qTail++] = idx;
          break;
        }
      }
      if (qTail > 0) break;
    }
  }

  while (qHead < qTail) {
    const curr = queue[qHead++];
    lakeMask[curr] = 255;

    const cx = curr % w;
    const cy = Math.floor(curr / w);

    // 4-neighborhood
    if (cx > 0) {
      const left = curr - 1;
      if (!visited[left] && isWaterCandidate[left]) {
        visited[left] = 1;
        queue[qTail++] = left;
      }
    }
    if (cx < w - 1) {
      const right = curr + 1;
      if (!visited[right] && isWaterCandidate[right]) {
        visited[right] = 1;
        queue[qTail++] = right;
      }
    }
    if (cy > 0) {
      const up = curr - w;
      if (!visited[up] && isWaterCandidate[up]) {
        visited[up] = 1;
        queue[qTail++] = up;
      }
    }
    if (cy < h - 1) {
      const down = curr + w;
      if (!visited[down] && isWaterCandidate[down]) {
        visited[down] = 1;
        queue[qTail++] = down;
      }
    }
  }

  console.log(`Contiguous water body pixels found: ${qTail}`);

  // Step 3: Create RGBA Mask Buffer (White opaque for water, transparent for non-water)
  const maskRgba = Buffer.alloc(totalPixels * 4);
  for (let i = 0; i < totalPixels; i++) {
    if (lakeMask[i] === 255) {
      maskRgba[i * 4] = 255;     // R
      maskRgba[i * 4 + 1] = 255; // G
      maskRgba[i * 4 + 2] = 255; // B
      maskRgba[i * 4 + 3] = 255; // A (Opaque water)
    } else {
      maskRgba[i * 4] = 0;
      maskRgba[i * 4 + 1] = 0;
      maskRgba[i * 4 + 2] = 0;
      maskRgba[i * 4 + 3] = 0;   // Transparent non-water
    }
  }

  fs.mkdirSync(path.dirname(OUTPUT_MASK_PATH), { recursive: true });
  await sharp(maskRgba, {
    raw: {
      width: w,
      height: h,
      channels: 4
    }
  })
    .png({ compressionLevel: 9 })
    .toFile(OUTPUT_MASK_PATH);

  const stats = fs.statSync(OUTPUT_MASK_PATH);
  console.log(`Successfully generated lake mask at: ${OUTPUT_MASK_PATH} (${(stats.size / 1024).toFixed(1)} KB)`);
}

generateLakeMask().catch((err) => {
  console.error('Error generating lake mask:', err);
  process.exit(1);
});

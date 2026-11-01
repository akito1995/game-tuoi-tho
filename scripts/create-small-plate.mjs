import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const ROOT_DIR = process.cwd();
const INPUT_PATH = path.join(ROOT_DIR, 'public', 'art', 'board', 'board-plate.png');
const OUTPUT_WEBP_PATH = path.join(ROOT_DIR, 'public', 'art', 'board', 'board-plate-small.webp');
const OUTPUT_PNG_PATH = path.join(ROOT_DIR, 'public', 'art', 'board', 'board-plate-small.png');

async function createSmallPlate() {
  console.log('Generating small board-plate (width 1920px) from:', INPUT_PATH);
  const inputStat = fs.statSync(INPUT_PATH);
  console.log(`Original size: ${(inputStat.size / 1024 / 1024).toFixed(2)} MB`);

  const img = sharp(INPUT_PATH);
  const meta = await img.metadata();
  console.log(`Original dimensions: ${meta.width} x ${meta.height}`);

  const targetWidth = 1920;
  const targetHeight = Math.round((meta.height / meta.width) * targetWidth);
  console.log(`Target dimensions: ${targetWidth} x ${targetHeight}`);

  // 1. Export WebP version (quality 82, effort 6)
  await sharp(INPUT_PATH)
    .resize(targetWidth, targetHeight, { fit: 'fill' })
    .webp({ quality: 82, effort: 6 })
    .toFile(OUTPUT_WEBP_PATH);

  const webpStat = fs.statSync(OUTPUT_WEBP_PATH);
  console.log(`Exported WebP: ${OUTPUT_WEBP_PATH} (${(webpStat.size / 1024).toFixed(1)} KB)`);

  // 2. Export PNG version as fallback
  await sharp(INPUT_PATH)
    .resize(targetWidth, targetHeight, { fit: 'fill' })
    .png({ compressionLevel: 8 })
    .toFile(OUTPUT_PNG_PATH);

  const pngStat = fs.statSync(OUTPUT_PNG_PATH);
  console.log(`Exported PNG fallback: ${OUTPUT_PNG_PATH} (${(pngStat.size / 1024 / 1024).toFixed(2)} MB)`);
}

createSmallPlate().catch((err) => {
  console.error('Error generating small plate:', err);
  process.exit(1);
});

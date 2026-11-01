import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const ROOT_DIR = process.cwd();
const MASK_PATH = path.join(ROOT_DIR, 'public', 'art', 'board', 'lake-mask.png');
const EXPECTED_WIDTH = 3344;
const EXPECTED_HEIGHT = 1880;

export async function GET() {
  try {
    const exists = fs.existsSync(MASK_PATH);
    let size = 0;
    let width = EXPECTED_WIDTH;
    let height = EXPECTED_HEIGHT;

    if (exists) {
      const stat = fs.statSync(MASK_PATH);
      size = stat.size;
      const meta = await sharp(MASK_PATH).metadata();
      width = meta.width || EXPECTED_WIDTH;
      height = meta.height || EXPECTED_HEIGHT;
    }

    return NextResponse.json({
      success: true,
      exists,
      width,
      height,
      size,
      url: `/art/board/lake-mask.png?t=${Date.now()}`
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageBase64 } = body;

    if (!imageBase64) {
      return NextResponse.json({ success: false, error: 'Missing imageBase64 in request body' }, { status: 400 });
    }

    // Strip data URI prefix if present
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Load and normalize to exact 3344 x 1880 RGBA PNG
    const image = sharp(buffer);
    const meta = await image.metadata();

    let processedImage = image;
    if (meta.width !== EXPECTED_WIDTH || meta.height !== EXPECTED_HEIGHT) {
      console.log(`Resizing input mask from ${meta.width}x${meta.height} to ${EXPECTED_WIDTH}x${EXPECTED_HEIGHT}`);
      processedImage = processedImage.resize(EXPECTED_WIDTH, EXPECTED_HEIGHT, {
        fit: 'fill',
        kernel: 'nearest'
      });
    }

    fs.mkdirSync(path.dirname(MASK_PATH), { recursive: true });
    await processedImage.png({ compressionLevel: 9 }).toFile(MASK_PATH);

    const stat = fs.statSync(MASK_PATH);

    return NextResponse.json({
      success: true,
      message: 'Lưu lake-mask.png thành công!',
      width: EXPECTED_WIDTH,
      height: EXPECTED_HEIGHT,
      size: stat.size,
      savedAt: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('Error saving mask:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

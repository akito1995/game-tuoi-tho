import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { autoSubdivideBoard, DEFAULT_BOARD_CORNERS } from '../../../renderer25d/tileCalibration';

const ROOT_DIR = process.cwd();
const TILES_FILE_PATH = path.join(ROOT_DIR, 'tools', 'tiles.json');

/**
 * Tạo dữ liệu 40 ô mặc định theo kích thước ảnh gốc 3344 x 1880
 */
function generateDefaultTiles() {
  return autoSubdivideBoard(DEFAULT_BOARD_CORNERS);
}

export async function GET() {
  try {
    if (fs.existsSync(TILES_FILE_PATH)) {
      const data = fs.readFileSync(TILES_FILE_PATH, 'utf-8');
      const tiles = JSON.parse(data);
      return NextResponse.json({
        success: true,
        source: 'file',
        count: tiles.length,
        tiles
      });
    }

    // Chưa có file -> Sinh toạ độ mặc định từ isoMath và lưu vào file
    const defaultTiles = generateDefaultTiles();
    fs.mkdirSync(path.dirname(TILES_FILE_PATH), { recursive: true });
    fs.writeFileSync(TILES_FILE_PATH, JSON.stringify(defaultTiles, null, 2), 'utf-8');

    return NextResponse.json({
      success: true,
      source: 'generated',
      count: defaultTiles.length,
      tiles: defaultTiles
    });
  } catch (err: any) {
    console.error('Lỗi đọc tiles.json:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tiles } = body;

    if (!Array.isArray(tiles) || tiles.length !== 40) {
      return NextResponse.json(
        { success: false, error: 'Dữ liệu ô không hợp lệ: phải có đúng 40 ô' },
        { status: 400 }
      );
    }

    // Đảm bảo toạ độ tương đối u, v (0..1) luôn được cập nhật chính xác
    const normalizedTiles = tiles.map((t: any) => {
      const corners = (t.corners || []).map((c: any) => ({
        ...c,
        u: Math.round((c.x / 3344) * 1000000) / 1000000,
        v: Math.round((c.y / 1880) * 1000000) / 1000000,
      }));
      const center = {
        ...t.center,
        u: Math.round((t.center.x / 3344) * 1000000) / 1000000,
        v: Math.round((t.center.y / 1880) * 1000000) / 1000000,
      };
      return { ...t, corners, center };
    });

    fs.mkdirSync(path.dirname(TILES_FILE_PATH), { recursive: true });
    fs.writeFileSync(TILES_FILE_PATH, JSON.stringify(normalizedTiles, null, 2), 'utf-8');

    const stat = fs.statSync(TILES_FILE_PATH);

    return NextResponse.json({
      success: true,
      message: 'Đã lưu thành công tools/tiles.json!',
      count: tiles.length,
      size: stat.size,
      savedAt: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('Lỗi lưu tools/tiles.json:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

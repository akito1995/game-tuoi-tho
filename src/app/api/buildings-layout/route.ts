import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const ROOT_DIR = process.cwd();
const LAYOUT_FILE_PATH = path.join(ROOT_DIR, 'src', 'art', 'buildings-layout.json');

function generateDefaultLayout() {
  const layout: Record<number, any> = {};
  for (let i = 0; i < 40; i++) {
    const side = Math.floor(i / 10) % 4;
    // 2 cạnh xa của bàn cờ là cạnh Tây Bắc (11..19) và Đông Bắc (21..29)
    const isFarEdge = side === 1 || side === 2;
    layout[i] = {
      tileId: i,
      offsetX: 0,
      offsetY: 0,
      scalePercent: 100,
      flipX: isFarEdge,
    };
  }
  return layout;
}

export async function GET() {
  try {
    if (fs.existsSync(LAYOUT_FILE_PATH)) {
      const data = fs.readFileSync(LAYOUT_FILE_PATH, 'utf-8');
      const layout = JSON.parse(data);
      return NextResponse.json({
        success: true,
        source: 'file',
        layout,
      });
    }

    const defaultLayout = generateDefaultLayout();
    fs.mkdirSync(path.dirname(LAYOUT_FILE_PATH), { recursive: true });
    fs.writeFileSync(LAYOUT_FILE_PATH, JSON.stringify(defaultLayout, null, 2), 'utf-8');

    return NextResponse.json({
      success: true,
      source: 'generated',
      layout: defaultLayout,
    });
  } catch (err: any) {
    console.error('Lỗi đọc buildings-layout.json:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || !body.layout || typeof body.layout !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Dữ liệu layout không hợp lệ' },
        { status: 400 }
      );
    }

    fs.mkdirSync(path.dirname(LAYOUT_FILE_PATH), { recursive: true });
    fs.writeFileSync(LAYOUT_FILE_PATH, JSON.stringify(body.layout, null, 2), 'utf-8');

    return NextResponse.json({
      success: true,
      message: 'Đã lưu cấu hình vị trí công trình vào src/art/buildings-layout.json thành công',
      count: Object.keys(body.layout).length,
    });
  } catch (err: any) {
    console.error('Lỗi ghi buildings-layout.json:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

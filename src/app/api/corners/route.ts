import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const ROOT_DIR = process.cwd();
const CORNERS_FILE_PATH = path.join(ROOT_DIR, 'tools', 'corners.json');

const DEFAULT_CORNERS = [
  {
    id: 0,
    name: 'Xuất Phát',
    offsetX: 0,
    offsetY: -15,
    scale: 0.065,
    asset: '/art/corners/corner-xuat-phat-transparent.png',
  },
  {
    id: 10,
    name: 'Trại Giam / Thăm tù',
    offsetX: 0,
    offsetY: -15,
    scale: 0.065,
    asset: '/art/corners/corner-trai-giam-transparent.png',
  },
  {
    id: 20,
    name: 'Quán Trà Đá',
    offsetX: 0,
    offsetY: -15,
    scale: 0.065,
    asset: '/art/corners/corner-quan-tra-da-transparent.png',
  },
  {
    id: 30,
    name: 'Vào Tù',
    offsetX: 0,
    offsetY: -15,
    scale: 0.065,
    asset: '/art/corners/corner-vao-tu-transparent.png',
  },
];

export async function GET() {
  try {
    if (fs.existsSync(CORNERS_FILE_PATH)) {
      const data = fs.readFileSync(CORNERS_FILE_PATH, 'utf-8');
      const corners = JSON.parse(data);
      return NextResponse.json({
        success: true,
        source: 'file',
        corners,
      });
    }

    fs.mkdirSync(path.dirname(CORNERS_FILE_PATH), { recursive: true });
    fs.writeFileSync(CORNERS_FILE_PATH, JSON.stringify(DEFAULT_CORNERS, null, 2), 'utf-8');

    return NextResponse.json({
      success: true,
      source: 'generated',
      corners: DEFAULT_CORNERS,
    });
  } catch (err: any) {
    console.error('Lỗi đọc corners.json:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { corners } = body;

    if (!Array.isArray(corners)) {
      return NextResponse.json(
        { success: false, error: 'Dữ liệu không hợp lệ: corners phải là mảng' },
        { status: 400 }
      );
    }

    fs.mkdirSync(path.dirname(CORNERS_FILE_PATH), { recursive: true });
    fs.writeFileSync(CORNERS_FILE_PATH, JSON.stringify(corners, null, 2), 'utf-8');

    return NextResponse.json({
      success: true,
      message: 'Đã lưu thành công tools/corners.json!',
      corners,
    });
  } catch (err: any) {
    console.error('Lỗi lưu corners.json:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

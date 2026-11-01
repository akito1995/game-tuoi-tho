import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const ROOT_DIR = process.cwd();
const MARKERS_FILE_PATH = path.join(ROOT_DIR, 'tools', 'markers.json');

const DEFAULT_MARKERS = [
  {
    id: 'train_track_main',
    type: 'train_track',
    label: 'Đường ray tàu điện',
    points: [
      { x: 500, y: 350 },
      { x: 2800, y: 550 }
    ]
  },
  {
    id: 'lanterns_street',
    type: 'lanterns',
    label: 'Dãy đèn lồng phố cổ',
    points: []
  }
];

export async function GET() {
  try {
    if (fs.existsSync(MARKERS_FILE_PATH)) {
      const data = fs.readFileSync(MARKERS_FILE_PATH, 'utf-8');
      const markers = JSON.parse(data);
      return NextResponse.json({
        success: true,
        source: 'file',
        markers
      });
    }

    // Khởi tạo file mặc định
    fs.mkdirSync(path.dirname(MARKERS_FILE_PATH), { recursive: true });
    fs.writeFileSync(MARKERS_FILE_PATH, JSON.stringify(DEFAULT_MARKERS, null, 2), 'utf-8');

    return NextResponse.json({
      success: true,
      source: 'default',
      markers: DEFAULT_MARKERS
    });
  } catch (err: any) {
    console.error('Lỗi đọc markers.json:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { markers } = body;

    if (!Array.isArray(markers)) {
      return NextResponse.json(
        { success: false, error: 'Dữ liệu markers không hợp lệ: phải là mảng' },
        { status: 400 }
      );
    }

    fs.mkdirSync(path.dirname(MARKERS_FILE_PATH), { recursive: true });
    fs.writeFileSync(MARKERS_FILE_PATH, JSON.stringify(markers, null, 2), 'utf-8');

    const stat = fs.statSync(MARKERS_FILE_PATH);

    return NextResponse.json({
      success: true,
      message: 'Đã lưu thành công tools/markers.json!',
      count: markers.length,
      size: stat.size,
      savedAt: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('Lỗi lưu tools/markers.json:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

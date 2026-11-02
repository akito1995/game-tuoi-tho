'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Eye, Layers, Sparkles, Image as ImageIcon, Sun, Moon, Grid } from 'lucide-react';

interface AssetReviewItem {
  id: string;
  name: string;
  filename: string;
  category: 'tiles' | 'ui' | 'buildings' | 'cards' | 'corners' | 'ambient';
  originalPath: string;
  cleanPath: string;
  description: string;
  isCheckOnly?: boolean;
}

const REVIEW_ITEMS: AssetReviewItem[] = [
  // 1. TILES (Huy hiệu tròn ô đặc biệt)
  {
    id: 'tile-co-hoi',
    name: 'Ô Cơ Hội',
    filename: 'tile-co-hoi.png',
    category: 'tiles',
    originalPath: '/art/tiles/tile-co-hoi.png',
    cleanPath: '/art/_clean/tiles/tile-co-hoi.png',
    description: 'Huy hiệu tròn Cơ Hội - Cắt mặt nạ tròn tự động, viền mềm 1.2px, khử quầng trắng.',
  },
  {
    id: 'tile-khi-van',
    name: 'Ô Khí Vận',
    filename: 'tile-khi-van.png',
    category: 'tiles',
    originalPath: '/art/tiles/tile-khi-van.png',
    cleanPath: '/art/_clean/tiles/tile-khi-van.png',
    description: 'Huy hiệu tròn Khí Vận - Cắt mặt nạ tròn tự động, viền mềm 1.2px, khử quầng trắng.',
  },
  {
    id: 'tile-thue-thu-nhap',
    name: 'Ô Thuế Thu Nhập',
    filename: 'tile-thue-thu-nhap.png',
    category: 'tiles',
    originalPath: '/art/tiles/tile-thue-thu-nhap.png',
    cleanPath: '/art/_clean/tiles/tile-thue-thu-nhap.png',
    description: 'Huy hiệu tròn Thuế Thu Nhập (-200K) - Cắt mặt nạ tròn tự động viền mềm.',
  },
  {
    id: 'tile-thue-xa-xi',
    name: 'Ô Thuế Xa Xỉ',
    filename: 'tile-thue-xa-xi.png',
    category: 'tiles',
    originalPath: '/art/tiles/tile-thue-xa-xi.png',
    cleanPath: '/art/_clean/tiles/tile-thue-xa-xi.png',
    description: 'Huy hiệu tròn Thuế Xa Xỉ (-100K) - Cắt mặt nạ tròn tự động viền mềm.',
  },

  // 2. UI (Biểu tượng & Kỹ năng)
  {
    id: 'ui-logo',
    name: 'Logo Game Cờ Tỷ Phú',
    filename: 'ui-logo.png',
    category: 'ui',
    originalPath: '/art/ui/ui-logo.png',
    cleanPath: '/art/_clean/ui/ui-logo.png',
    description: 'Biểu trưng logo chính của trò chơi.',
  },
  {
    id: 'ui-dong-xu',
    name: 'Đồng Xu Vàng',
    filename: 'ui-dong-xu.png',
    category: 'ui',
    originalPath: '/art/ui/ui-dong-xu.png',
    cleanPath: '/art/_clean/ui/ui-dong-xu.png',
    description: 'Biểu tượng đồng xu giao diện tiền tệ.',
  },
  {
    id: 'ui-tien-giay',
    name: 'Tiền Giấy',
    filename: 'ui-tien-giay.png',
    category: 'ui',
    originalPath: '/art/ui/ui-tien-giay.png',
    cleanPath: '/art/_clean/ui/ui-tien-giay.png',
    description: 'Tập tiền giấy giao dịch kinh tế.',
  },
  {
    id: 'skill-doi',
    name: 'Kỹ Năng Đôi',
    filename: 'skill-doi.png',
    category: 'ui',
    originalPath: '/art/ui/skill-doi.png',
    cleanPath: '/art/_clean/ui/skill-doi.png',
    description: 'Biểu tượng thẻ bài kỹ năng xúc xắc đôi.',
  },
  {
    id: 'skill-nhay-ngan',
    name: 'Kỹ Năng Nhảy Ngắn',
    filename: 'skill-nhay-ngan.png',
    category: 'ui',
    originalPath: '/art/ui/skill-nhay-ngan.png',
    cleanPath: '/art/_clean/ui/skill-nhay-ngan.png',
    description: 'Biểu tượng thẻ bài kỹ năng di chuyển ngắn.',
  },
  {
    id: 'skill-nhay-xa',
    name: 'Kỹ Năng Nhảy Xa',
    filename: 'skill-nhay-xa.png',
    category: 'ui',
    originalPath: '/art/ui/skill-nhay-xa.png',
    cleanPath: '/art/_clean/ui/skill-nhay-xa.png',
    description: 'Biểu tượng thẻ bài kỹ năng di chuyển xa.',
  },

  // 3. BUILDINGS (Nhà & Landmark mẫu tiêu biểu)
  {
    id: 'house-1',
    name: 'Nhà cấp 1',
    filename: 'house-1.png',
    category: 'buildings',
    originalPath: '/art/buildings/house-1.png',
    cleanPath: '/art/_clean/buildings/house-1.png',
    description: 'Mô hình nhà cấp 1 truyền thống.',
  },
  {
    id: 'house-2',
    name: 'Nhà cấp 2',
    filename: 'house-2.png',
    category: 'buildings',
    originalPath: '/art/buildings/house-2.png',
    cleanPath: '/art/_clean/buildings/house-2.png',
    description: 'Mô hình nhà phố cấp 2.',
  },
  {
    id: 'house-3',
    name: 'Nhà cấp 3',
    filename: 'house-3.png',
    category: 'buildings',
    originalPath: '/art/buildings/house-3.png',
    cleanPath: '/art/_clean/buildings/house-3.png',
    description: 'Mô hình nhà phố cấp 3.',
  },
  {
    id: 'house-4',
    name: 'Nhà cấp 4',
    filename: 'house-4.png',
    category: 'buildings',
    originalPath: '/art/buildings/house-4.png',
    cleanPath: '/art/_clean/buildings/house-4.png',
    description: 'Mô hình khách sạn cấp 4 cao tầng.',
  },
  {
    id: 'landmark-ha-noi',
    name: 'Landmark Thủ Đô Hà Nội',
    filename: 'landmark-ha-noi.png',
    category: 'buildings',
    originalPath: '/art/buildings/landmark-ha-noi.png',
    cleanPath: '/art/_clean/buildings/landmark-ha-noi.png',
    description: 'Biểu tượng Cột Cờ / Khuê Văn Các Hà Nội (ô 39).',
  },
  {
    id: 'landmark-tp-hcm',
    name: 'Landmark TP. Hồ Chí Minh',
    filename: 'landmark-tp-hcm.png',
    category: 'buildings',
    originalPath: '/art/buildings/landmark-tp-hcm.png',
    cleanPath: '/art/_clean/buildings/landmark-tp-hcm.png',
    description: 'Biểu tượng Chợ Bến Thành / Landmark 81 (ô 37).',
  },
  {
    id: 'landmark-da-nang',
    name: 'Landmark Đà Nẵng',
    filename: 'landmark-da-nang.png',
    category: 'buildings',
    originalPath: '/art/buildings/landmark-da-nang.png',
    cleanPath: '/art/_clean/buildings/landmark-da-nang.png',
    description: 'Biểu tượng Cầu Rồng Đà Nẵng (ô 21).',
  },
  {
    id: 'landmark-hue',
    name: 'Landmark Cố Đô Huế',
    filename: 'landmark-hue.png',
    category: 'buildings',
    originalPath: '/art/buildings/landmark-hue.png',
    cleanPath: '/art/_clean/buildings/landmark-hue.png',
    description: 'Biểu tượng Ngọ Môn Đại Nội Huế (ô 19).',
  },
  {
    id: 'station-noi-bai',
    name: 'Sân Bay Quốc Tế Nội Bài',
    filename: 'station-noi-bai.png',
    category: 'buildings',
    originalPath: '/art/buildings/station-noi-bai.png',
    cleanPath: '/art/_clean/buildings/station-noi-bai.png',
    description: 'Công trình giao thông ô 35.',
  },
  {
    id: 'util-thuy-dien',
    name: 'Thủy Điện Hòa Bình',
    filename: 'util-thuy-dien.png',
    category: 'buildings',
    originalPath: '/art/buildings/util-thuy-dien.png',
    cleanPath: '/art/_clean/buildings/util-thuy-dien.png',
    description: 'Công trình tiện ích ô 12.',
  },

  // 4. CARDS (Thẻ bài - Chỉ kiểm tra chất lượng, không tách nền theo yêu cầu)
  {
    id: 'card-back-co-hoi',
    name: 'Mặt sau thẻ Cơ Hội',
    filename: 'card-back-co-hoi.png',
    category: 'cards',
    originalPath: '/art/cards/card-back-co-hoi.png',
    cleanPath: '/art/cards/card-back-co-hoi.png',
    description: 'Thẻ bài đầy đủ nền - Giữ nguyên không tách nền.',
    isCheckOnly: true,
  },
  {
    id: 'card-front-co-hoi',
    name: 'Mặt trước thẻ Cơ Hội',
    filename: 'card-front-co-hoi.png',
    category: 'cards',
    originalPath: '/art/cards/card-front-co-hoi.png',
    cleanPath: '/art/cards/card-front-co-hoi.png',
    description: 'Thẻ bài đầy đủ nền - Giữ nguyên không tách nền.',
    isCheckOnly: true,
  },
  {
    id: 'card-back-khi-van',
    name: 'Mặt sau thẻ Khí Vận',
    filename: 'card-back-khi-van.png',
    category: 'cards',
    originalPath: '/art/cards/card-back-khi-van.png',
    cleanPath: '/art/cards/card-back-khi-van.png',
    description: 'Thẻ bài đầy đủ nền - Giữ nguyên không tách nền.',
    isCheckOnly: true,
  },
  {
    id: 'card-front-khi-van',
    name: 'Mặt trước thẻ Khí Vận',
    filename: 'card-front-khi-van.png',
    category: 'cards',
    originalPath: '/art/cards/card-front-khi-van.png',
    cleanPath: '/art/cards/card-front-khi-van.png',
    description: 'Thẻ bài đầy đủ nền - Giữ nguyên không tách nền.',
    isCheckOnly: true,
  },
  // 5. CORNERS (Công trình góc)
  {
    id: 'corner-quan-tra-da',
    name: 'Quán Trà Đá (Ô 20)',
    filename: 'corner-quan-tra-da-transparent.png',
    category: 'corners',
    originalPath: '/art/corners/corner-quan-tra-da.png',
    cleanPath: '/art/corners/corner-quan-tra-da-transparent.png',
    description: 'Quán Trà Đá - Đã tách nền sạch sâu (BFS + lỗ hổng vòm cây). Lưu ý: Tán cây ở mép trên ảnh gốc (y=0) bị cụt do tràn khung AI.',
  },
  // 6. AMBIENT (Tàu điện & Thuyền hồ nước)
  {
    id: 'ambient-tau-dien',
    name: 'Tàu Điện Trên Cao',
    filename: 'ambient-tau-dien.png',
    category: 'ambient',
    originalPath: '/art/ambient/ambient-tau-dien.png',
    cleanPath: '/art/_clean/ambient/ambient-tau-dien.png',
    description: 'Tàu điện trên cao - Tách nền sạch sâu, xóa sạch mảng nền đường phố và quầng trắng, thân tàu sắc nét.',
  },
  {
    id: 'ambient-thuyen-1',
    name: 'Thuyền Gỗ 1 (Hồ Nước)',
    filename: 'ambient-thuyen-1.png',
    category: 'ambient',
    originalPath: '/art/ambient/ambient-thuyen-1.png',
    cleanPath: '/art/_clean/ambient/ambient-thuyen-1.png',
    description: 'Thuyền hồ nước - Khử sạch quầng trắng (defringing), unmatting viền tự nhiên, trong suốt 100% ngoài thân thuyền.',
  },
  {
    id: 'ambient-thuyen-2',
    name: 'Thuyền Gỗ 2 (Hồ Nước)',
    filename: 'ambient-thuyen-2.png',
    category: 'ambient',
    originalPath: '/art/ambient/ambient-thuyen-2.png',
    cleanPath: '/art/_clean/ambient/ambient-thuyen-2.png',
    description: 'Thuyền hồ nước - Khử sạch quầng trắng (defringing), unmatting viền tự nhiên, trong suốt 100% ngoài thân thuyền.',
  },
];

export default function CutoutReviewPage() {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'tiles' | 'ui' | 'buildings' | 'cards' | 'corners' | 'ambient'>('tiles');
  const [bgMode, setBgMode] = useState<'checkerboard' | 'dark' | 'light'>('checkerboard');
  const [viewMode, setViewMode] = useState<'comparison' | 'clean_only' | 'original_only'>('comparison');
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const filteredItems = useMemo(() => {
    if (selectedCategory === 'all') return REVIEW_ITEMS;
    return REVIEW_ITEMS.filter((item) => item.category === selectedCategory);
  }, [selectedCategory]);

  const bgStyle = useMemo(() => {
    if (bgMode === 'dark') return 'bg-slate-950 border-slate-800';
    if (bgMode === 'light') return 'bg-white border-slate-300';
    return 'bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] bg-slate-100 border-slate-300';
  }, [bgMode]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-6 pb-24">
      {/* Header */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/play-v2"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Về Bàn Cờ 2.5D</span>
            </Link>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30">
              Công Cụ Duyệt Tách Nền v2
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-2 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-amber-400" />
            Kiểm Tra & Duyệt Tài Nguyên Sau Tách Nền (_clean/)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            So sánh trực quan trước và sau khi xử lý nền trong suốt, viền mềm, khử răng cưa và tối ưu dung lượng.
          </p>
        </div>

        {/* Chuyển nền & chế độ hiển thị */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Nền */}
          <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700 text-xs">
            <button
              onClick={() => setBgMode('checkerboard')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition ${
                bgMode === 'checkerboard' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="Nền caro trong suốt"
            >
              <Grid className="h-3.5 w-3.5" />
              <span>Caro</span>
            </button>
            <button
              onClick={() => setBgMode('dark')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition ${
                bgMode === 'dark' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="Nền tối"
            >
              <Moon className="h-3.5 w-3.5" />
              <span>Tối</span>
            </button>
            <button
              onClick={() => setBgMode('light')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition ${
                bgMode === 'light' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="Nền sáng"
            >
              <Sun className="h-3.5 w-3.5" />
              <span>Sáng</span>
            </button>
          </div>

          {/* Chế độ xem */}
          <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700 text-xs">
            <button
              onClick={() => setViewMode('comparison')}
              className={`px-3 py-1.5 rounded-lg transition ${
                viewMode === 'comparison' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              So sánh đôi
            </button>
            <button
              onClick={() => setViewMode('clean_only')}
              className={`px-3 py-1.5 rounded-lg transition ${
                viewMode === 'clean_only' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Chỉ xem _clean/
            </button>
          </div>
        </div>
      </header>

      {/* Tabs Danh Mục */}
      <div className="max-w-7xl mx-auto mb-8 flex items-center gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCategory('tiles')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition border ${
            selectedCategory === 'tiles'
              ? 'bg-amber-500/20 border-amber-500 text-amber-300'
              : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Biểu Tượng Ô (Tiles - 4 ô đặc biệt)</span>
        </button>
        <button
          onClick={() => setSelectedCategory('ui')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition border ${
            selectedCategory === 'ui'
              ? 'bg-amber-500/20 border-amber-500 text-amber-300'
              : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          <span>Giao Diện & Kỹ Năng (UI)</span>
        </button>
        <button
          onClick={() => setSelectedCategory('buildings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition border ${
            selectedCategory === 'buildings'
              ? 'bg-amber-500/20 border-amber-500 text-amber-300'
              : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
          }`}
        >
          <ImageIcon className="h-4 w-4" />
          <span>Công Trình & Landmark (Buildings)</span>
        </button>
        <button
          onClick={() => setSelectedCategory('corners')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition border ${
            selectedCategory === 'corners'
              ? 'bg-amber-500/20 border-amber-500 text-amber-300'
              : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          <span>Công Trình Góc (Corners)</span>
        </button>
        <button
          onClick={() => setSelectedCategory('ambient')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition border ${
            selectedCategory === 'ambient'
              ? 'bg-amber-500/20 border-amber-500 text-amber-300'
              : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
          }`}
        >
          <ImageIcon className="h-4 w-4" />
          <span>Thuyền Hồ Nước (Ambient)</span>
        </button>
        <button
          onClick={() => setSelectedCategory('cards')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition border ${
            selectedCategory === 'cards'
              ? 'bg-amber-500/20 border-amber-500 text-amber-300'
              : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
          }`}
        >
          <Eye className="h-4 w-4" />
          <span>Thẻ Bài (Cards - Kiểm tra nền đủ)</span>
        </button>
        <button
          onClick={() => setSelectedCategory('all')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition border ${
            selectedCategory === 'all'
              ? 'bg-amber-500/20 border-amber-500 text-amber-300'
              : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
          }`}
        >
          <span>Tất cả ({REVIEW_ITEMS.length})</span>
        </button>
      </div>

      {/* Grid danh sách ảnh */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    {item.name}
                    {item.isCheckOnly && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        Chỉ kiểm tra
                      </span>
                    )}
                  </h3>
                  <p className="text-xs font-mono text-slate-400">{item.filename}</p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 font-mono">
                  {item.category}
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-4">{item.description}</p>
            </div>

            {/* Khung hiển thị ảnh */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Trước (Original) */}
              {(viewMode === 'comparison' || viewMode === 'original_only') && (
                <div className="flex flex-col items-center">
                  <span className="text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
                    Gốc (Trước xử lý)
                  </span>
                  <div
                    className={`w-full h-56 rounded-xl border flex items-center justify-center p-3 relative overflow-hidden ${bgStyle}`}
                  >
                    <img
                      src={item.originalPath}
                      alt={`Gốc: ${item.name}`}
                      className="max-h-full max-w-full object-contain filter drop-shadow-sm"
                      loading="lazy"
                    />
                  </div>
                </div>
              )}

              {/* Sau (_clean) */}
              {(viewMode === 'comparison' || viewMode === 'clean_only') && (
                <div className="flex flex-col items-center">
                  <span className="text-[11px] font-semibold text-amber-300 mb-1.5 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    Đã tách nền (_clean/)
                  </span>
                  <div
                    className={`w-full h-56 rounded-xl border flex items-center justify-center p-3 relative overflow-hidden ${bgStyle}`}
                  >
                    <img
                      src={item.cleanPath}
                      alt={`Sau tách: ${item.name}`}
                      className="max-h-full max-w-full object-contain filter drop-shadow-md"
                      loading="lazy"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Trophy,
  ArrowLeft,
  Play,
  Home,
  Building,
  DollarSign,
  Zap,
  Train,
  ShieldAlert,
  PiggyBank,
  Coffee,
  HelpCircle,
  Percent,
  TrendingUp,
  Sparkles,
  Flame,
  Award,
} from 'lucide-react';

export default function RulesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-stone-950 text-slate-100 font-sans pb-24">
      {/* ================= TOP NAV BAR ================= */}
      <header className="sticky top-0 z-40 bg-slate-950/95 border-b border-amber-500/30 px-4 sm:px-8 py-3 flex items-center justify-between shadow-xl">
        <Link
          href="/play"
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold text-sm transition-all border border-amber-500/20 min-h-[44px] min-w-[44px]"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Vào Bàn Chơi</span>
        </Link>

        <div className="flex items-center gap-2">
          <div className="w-9 h-9 relative">
            <Image
              src="/art/ui/ui-logo.png"
              alt="Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <span className="font-baloo text-base sm:text-lg font-bold text-amber-400 uppercase tracking-wide">
            Luật Chơi V2
          </span>
        </div>

        <Link
          href="/play"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-baloo font-bold text-sm shadow-md transition-all min-h-[44px]"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Chơi Ngay</span>
        </Link>
      </header>

      {/* ================= HERO BANNER ================= */}
      <div className="relative overflow-hidden bg-gradient-to-r from-amber-950/40 via-red-950/30 to-slate-950 py-10 px-4 sm:px-8 text-center border-b border-amber-500/20">
        <div className="max-w-4xl mx-auto space-y-3">
          <span className="inline-block px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold tracking-widest uppercase">
            Cẩm Nang Thi Đấu • Cờ Tỷ Phú v2.5D
          </span>
          <h1 className="font-baloo text-3xl sm:text-5xl font-black text-amber-300 drop-shadow-md">
            HÀNH TRÌNH XUYÊN VIỆT
          </h1>
          <p className="text-sm sm:text-base text-stone-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Nhịp chơi nhanh, đậm chất chiến thuật, nhiều cơ hội lật kèo ngoạn mục! 
            Mỗi ván 4 người kéo dài từ 15 đến 25 phút.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 space-y-12">
        {/* ================= SECTION 1: 5 CÁCH CHIẾN THẮNG ================= */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 border-b border-amber-500/30 pb-3">
            <Trophy className="w-7 h-7 text-amber-400" />
            <div>
              <h2 className="font-baloo text-2xl font-bold text-amber-400">
                5 Cách Giành Chiến Thắng
              </h2>
              <p className="text-xs text-stone-400">
                Kiểm tra liên tục sau mỗi lượt mua đất, mua lại, phá sản hoặc khi hết 25 vòng đấu.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Thắng Phá Sản */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-rose-500/40 hover:border-rose-500 transition-all shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-xs font-bold">
                    Cách 1 • Phổ biến
                  </span>
                  <ShieldAlert className="w-6 h-6 text-rose-400" />
                </div>
                <h3 className="font-baloo text-lg font-bold text-rose-300">
                  Hạ Đo ván (Phá Sản)
                </h3>
                <p className="text-xs text-stone-300 mt-2 leading-relaxed">
                  Khi tất cả các đối thủ khác đều hết sạch tiền và buộc phải tuyên bố phá sản, người chơi còn trụ lại cuối cùng lập tức chiến thắng!
                </p>
              </div>
            </div>

            {/* Thắng Độc Quyền 3 Màu */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-amber-500/40 hover:border-amber-500 transition-all shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold">
                    Cách 2 • Độc quyền
                  </span>
                  <Award className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="font-baloo text-lg font-bold text-amber-300">
                  Độc Quyền 3 Nhóm Màu
                </h3>
                <p className="text-xs text-stone-300 mt-2 leading-relaxed">
                  Sở hữu trọn vẹn toàn bộ các ô đất của 3 nhóm màu di sản khác nhau (ví dụ: Nâu + Cam + Xanh lá). Thắng ngay lập tức!
                </p>
              </div>
            </div>

            {/* Thắng Độc Quyền 1 Cạnh */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-emerald-500/40 hover:border-emerald-500 transition-all shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                    Cách 3 • Chặn đường
                  </span>
                  <Flame className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="font-baloo text-lg font-bold text-emerald-300">
                  Độc Quyền 1 Cạnh Bàn Cờ
                </h3>
                <p className="text-xs text-stone-300 mt-2 leading-relaxed">
                  Thâu tóm toàn bộ các ô bất động sản trên cùng 1 cạnh bàn cờ (từ góc này đến góc kia). Ai đi qua đều phải nộp tiền!
                </p>
              </div>
            </div>

            {/* Thắng Độc Quyền 4 Nhà Ga */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-sky-500/40 hover:border-sky-500 transition-all shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-400 text-xs font-bold">
                    Cách 4 • Trùm Vận Tải
                  </span>
                  <Train className="w-6 h-6 text-sky-400" />
                </div>
                <h3 className="font-baloo text-lg font-bold text-sky-300">
                  Thâu Tóm 4 Nhà Ga Giao Thông
                </h3>
                <p className="text-xs text-stone-300 mt-2 leading-relaxed">
                  Sở hữu toàn bộ 4 nhà ga: Bến Xe Miền Đông, Ga Hải Vân, Ga Đà Lạt và Sân Bay Nội Bài.
                </p>
              </div>
            </div>

            {/* Thắng Hết 25 Vòng */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-purple-500/40 hover:border-purple-500 transition-all shadow-lg flex flex-col justify-between md:col-span-2 lg:col-span-2">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-xs font-bold">
                    Cách 5 • Tính Tổng Tài Sản
                  </span>
                  <TrendingUp className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="font-baloo text-lg font-bold text-purple-300">
                  Hết 25 Vòng Đấu: Vua Tài Sản
                </h3>
                <p className="text-xs text-stone-300 mt-2 leading-relaxed">
                  Nếu sau 25 vòng vẫn chưa có ai thắng áp đảo, hệ thống tính tổng tài sản = Tiền mặt + Giá trị toàn bộ đất đai và công trình đã đầu tư. Người giàu nhất đăng quang!
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ================= SECTION 2: MUA & XÂY THEO TỪNG NẤC ================= */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 border-b border-amber-500/30 pb-3">
            <Building className="w-7 h-7 text-amber-400" />
            <div>
              <h2 className="font-baloo text-2xl font-bold text-amber-400">
                Luật Mua Đất & Nâng Cấp Từng Nấc
              </h2>
              <p className="text-xs text-stone-400">
                Không thể xây ồ ạt ngay lập tức; cần tích lũy và qua nhiều vòng đấu!
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-700 space-y-3">
              <div className="text-amber-400 font-baloo font-bold text-base flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-xs font-black">1</span>
                Vòng 1: Mua Đất Trống
              </div>
              <p className="text-xs text-stone-300 leading-relaxed">
                Khi dừng ở ô đất chưa có chủ tại vòng đầu tiên, bạn chỉ được quyền mua đất trống.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-700 space-y-3">
              <div className="text-amber-400 font-baloo font-bold text-base flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-xs font-black">2</span>
                Vòng 2+: Kèm 1 Nhà
              </div>
              <p className="text-xs text-stone-300 leading-relaxed">
                Từ vòng 2 trở đi, khi mua đất mới bạn có thể mua kèm thêm ngay 1 cấp nhà nếu có đủ tiền mặt.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-700 space-y-3">
              <div className="text-amber-400 font-baloo font-bold text-base flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-xs font-black">3</span>
                Dừng Ở Đất Mình: +1 Cấp
              </div>
              <p className="text-xs text-stone-300 leading-relaxed">
                Mỗi lần dừng chân lại ở bất động sản của chính mình, bạn được nâng cấp thêm tối đa 1 cấp nhà (Nhà 1 → Nhà 4).
              </p>
            </div>
          </div>

          {/* Quy Tắc Landmark */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/60 to-slate-900 border-2 border-amber-500/60 shadow-xl flex flex-col md:flex-row items-center gap-6">
            <div className="w-24 h-24 sm:w-32 sm:h-32 relative shrink-0">
              <Image
                src="/art/buildings/landmark-ha-noi.png"
                alt="Landmark Hà Nội"
                fill
                className="object-contain drop-shadow-xl"
              />
            </div>
            <div className="space-y-2">
              <span className="inline-block px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-black uppercase">
                Công Trình Bất Khả Xâm Phạm: LANDMARK
              </span>
              <h3 className="font-baloo text-xl font-bold text-amber-300">
                Điều Kiện Khánh Thành Landmark
              </h3>
              <ul className="text-xs sm:text-sm text-stone-200 space-y-1.5 list-disc list-inside">
                <li>Ô đất phải đã xây dựng đủ <strong className="text-amber-400">4 cấp nhà</strong>.</li>
                <li>Người chơi đã chạy qua ô Xuất Phát ít nhất <strong className="text-amber-400">2 lần (Vòng 2+)</strong>.</li>
                <li>Chi trả phí khánh thành Landmark tương ứng theo nhóm màu.</li>
                <li><strong className="text-emerald-400">Đặc quyền tối thượng:</strong> Landmark không bao giờ bị đối thủ mua lại!</li>
              </ul>
            </div>
          </div>
        </section>

        {/* ================= SECTION 3: MUA LẠI ĐẤT ĐỐI THỦ 1.5x ================= */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 border-b border-amber-500/30 pb-3">
            <Sparkles className="w-7 h-7 text-amber-400" />
            <div>
              <h2 className="font-baloo text-2xl font-bold text-amber-400">
                Cú Lật Kèo: Mua Lại Đất Đối Thủ (1.5×)
              </h2>
              <p className="text-xs text-stone-400">
                Chiến thuật phá vỡ thế độc quyền của đối phương!
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-amber-500/40 space-y-3">
            <p className="text-sm text-stone-200 leading-relaxed">
              Khi dừng chân ở ô đất thuộc quyền sở hữu của đối thủ (chưa lên Landmark):
            </p>
            <ol className="text-xs sm:text-sm text-stone-300 space-y-2 list-decimal list-inside">
              <li>Bạn phải trả tiền thuê đất hiện hành cho chủ sở hữu.</li>
              <li>
                Sau khi trả tiền thuê, bạn có quyền <strong className="text-amber-300">MUA LẠI</strong> bất động sản đó với mức giá bằng <strong className="text-amber-400">1.5 lần tổng vốn đầu tư</strong> (Giá đất + Tổng giá trị nhà hiện có).
              </li>
              <li>Chủ cũ bắt buộc phải bán, nhận toàn bộ số tiền 1.5× và quyền sở hữu chuyển sang cho bạn!</li>
            </ol>
            <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
              💡 <em>Mẹo chiến thuật:</em> Hãy chuẩn bị sẵn tiền dự phòng để mua lại ô đất trọng yếu khi đối thủ sắp hoàn thành bộ 3 màu!
            </div>
          </div>
        </section>

        {/* ================= SECTION 4: BẢNG GIÁ XÂY & TIỀN THUÊ ================= */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 border-b border-amber-500/30 pb-3">
            <Percent className="w-7 h-7 text-amber-400" />
            <div>
              <h2 className="font-baloo text-2xl font-bold text-amber-400">
                Bảng Giá Xây Dựng & Tỷ Lệ Tiền Thuê
              </h2>
              <p className="text-xs text-stone-400">
                Tiền thuê tính theo tỷ lệ phần trăm của giá mua đất gốc (P).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bảng giá xây theo nhóm */}
            <div className="rounded-2xl bg-slate-900 border border-slate-700 overflow-hidden shadow-lg">
              <div className="bg-slate-800 px-4 py-3 font-baloo font-bold text-sm text-amber-300">
                Chi Phí Xây Dựng Theo Nhóm Màu
              </div>
              <div className="p-4 overflow-x-auto">
                <table className="w-full text-xs text-stone-200">
                  <thead>
                    <tr className="border-b border-slate-700 text-stone-400 pb-2">
                      <th className="text-left py-2">Nhóm Màu</th>
                      <th className="text-right py-2">Giá Mỗi Nhà</th>
                      <th className="text-right py-2">Giá Landmark</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-mono">
                    <tr>
                      <td className="py-2.5 font-sans font-medium text-stone-300">Nâu, Xanh nhạt</td>
                      <td className="text-right text-amber-300">50K₫</td>
                      <td className="text-right text-amber-400 font-bold">100K₫</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-sans font-medium text-rose-300">Hồng, Cam</td>
                      <td className="text-right text-amber-300">100K₫</td>
                      <td className="text-right text-amber-400 font-bold">200K₫</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-sans font-medium text-red-400">Đỏ, Vàng</td>
                      <td className="text-right text-amber-300">150K₫</td>
                      <td className="text-right text-amber-400 font-bold">300K₫</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-sans font-medium text-emerald-400">Xanh lá, Xanh đậm</td>
                      <td className="text-right text-amber-300">200K₫</td>
                      <td className="text-right text-amber-400 font-bold">400K₫</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bảng tỷ lệ tiền thuê */}
            <div className="rounded-2xl bg-slate-900 border border-slate-700 overflow-hidden shadow-lg">
              <div className="bg-slate-800 px-4 py-3 font-baloo font-bold text-sm text-amber-300">
                Tỷ Lệ Tiền Thuê (% Giá Đất P)
              </div>
              <div className="p-4 overflow-x-auto">
                <table className="w-full text-xs text-stone-200">
                  <thead>
                    <tr className="border-b border-slate-700 text-stone-400 pb-2">
                      <th className="text-left py-2">Cấp Công Trình</th>
                      <th className="text-right py-2">Tỷ Lệ Thuê</th>
                      <th className="text-right py-2">Ví Dụ (P = 200K)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-mono">
                    <tr>
                      <td className="py-2.5 font-sans font-medium">Đất trống (Đơn lẻ)</td>
                      <td className="text-right text-amber-300">10% P</td>
                      <td className="text-right text-stone-300">20K₫</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-sans font-medium text-amber-200">Đất trống (Trọn bộ màu)</td>
                      <td className="text-right text-amber-300 font-bold">20% P (×2)</td>
                      <td className="text-right text-amber-300">40K₫</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-sans font-medium">1 Nhà / 2 Nhà</td>
                      <td className="text-right text-amber-300">50% / 130% P</td>
                      <td className="text-right text-stone-300">100K / 260K₫</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-sans font-medium">3 Nhà / 4 Nhà</td>
                      <td className="text-right text-amber-300">250% / 350% P</td>
                      <td className="text-right text-stone-300">500K / 700K₫</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-sans font-medium text-amber-400 font-bold">Landmark Kỳ Quan</td>
                      <td className="text-right text-amber-400 font-black">500% P (×5)</td>
                      <td className="text-right text-rose-400 font-bold">1.000K₫</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* ================= SECTION 5: Ô ĐẶC BIỆT & QUỸ HEO ĐẤT ================= */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 border-b border-amber-500/30 pb-3">
            <PiggyBank className="w-7 h-7 text-amber-400" />
            <div>
              <h2 className="font-baloo text-2xl font-bold text-amber-400">
                Các Ô Đặc Biệt & Quỹ Heo Đất
              </h2>
              <p className="text-xs text-stone-400">
                Hệ thống ô phụ trợ mang đến nhiều bất ngờ thú vị!
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Quỹ Heo Đất & Quán Trà Đá */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-700 flex items-start gap-4">
              <div className="w-16 h-16 relative shrink-0">
                <Image
                  src="/art/props/prop-heo-dat.png"
                  alt="Heo Đất"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="space-y-1">
                <h3 className="font-baloo text-base font-bold text-amber-300">
                  Quỹ Heo Đất & Quán Trà Đá
                </h3>
                <p className="text-xs text-stone-300 leading-relaxed">
                  Khi người chơi nộp Thuế (Thuế thu nhập 10% tổng tài sản ≤ 200K₫, Thuế xa xỉ 100K₫), toàn bộ số tiền nộp sẽ được tích luỹ vào <strong className="text-amber-400">Quỹ Heo Đất</strong>. Ai may mắn dừng đúng ô <strong className="text-amber-400">Quán Trà Đá (Ô 20)</strong> sẽ ẵm trọn toàn bộ số tiền trong Quỹ!
                </p>
              </div>
            </div>

            {/* 4 Nhà Ga Giao Thông */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-700 flex items-start gap-4">
              <div className="w-16 h-16 relative shrink-0">
                <Image
                  src="/art/buildings/station-noi-bai.png"
                  alt="Nhà Ga"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="space-y-1">
                <h3 className="font-baloo text-base font-bold text-amber-300">
                  4 Nhà Ga & Dịch Chuyển Tức Thời
                </h3>
                <p className="text-xs text-stone-300 leading-relaxed">
                  Tiền thuê tăng luỹ tiến: <strong className="text-amber-400">25K / 50K / 100K / 200K₫</strong> tuỳ theo số ga sở hữu. Khi dừng ở nhà ga của chính mình, bạn có thể trả <strong className="text-amber-400">50K₫</strong> để đi thẳng ngay tới một nhà ga khác! Sở hữu trọn bộ 4 ga sẽ giành chiến thắng áp đảo ngay lập tức!
                </p>
              </div>
            </div>

            {/* 2 Tiện Ích */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-700 flex items-start gap-4">
              <div className="w-16 h-16 relative shrink-0">
                <Image
                  src="/art/buildings/util-thuy-dien.png"
                  alt="Tiện ích Thủy điện"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="space-y-1">
                <h3 className="font-baloo text-base font-bold text-amber-300">
                  Thủy Điện Hòa Bình & Nhiệt Điện Yên Phụ
                </h3>
                <p className="text-xs text-stone-300 leading-relaxed">
                  Không xây nhà hay landmark. Tiền thuê = <strong className="text-amber-400">Tổng điểm xúc xắc × 10K₫</strong> (sở hữu 1 trạm) hoặc <strong className="text-amber-400">Tổng điểm xúc xắc × 25K₫</strong> (sở hữu cả 2 trạm). Ví dụ: Đổ được 7 điểm → Trả 70K₫ (hoặc 175K₫ nếu gom đủ cả 2 trạm).
                </p>
              </div>
            </div>

            {/* Côn Đảo / Trại Giam */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-700 flex items-start gap-4">
              <div className="w-16 h-16 relative shrink-0">
                <Image
                  src="/art/corners/corner-trai-giam-transparent.png"
                  alt="Trại Giam Côn Đảo"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="space-y-1">
                <h3 className="font-baloo text-base font-bold text-amber-300">
                  Trại Giam & Luật Đổ Đôi
                </h3>
                <p className="text-xs text-stone-300 leading-relaxed">
                  Bị giam giữ tối đa 3 lượt. Thoát khỏi trại giam bằng cách: đổ được xúc xắc đôi, nộp phạt bảo lãnh 50K₫, hoặc dùng Thẻ Ra Tù. Đổ đôi 3 lần liên tiếp trong 1 lượt cũng sẽ bị áp giải vào tù!
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ================= SECTION 6: CỨU VÃN TÀI CHÍNH & PHÁ SẢN ================= */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 border-b border-amber-500/30 pb-3">
            <DollarSign className="w-7 h-7 text-amber-400" />
            <div>
              <h2 className="font-baloo text-2xl font-bold text-amber-400">
                Cứu Vãn Tài Chính & Tránh Phá Sản
              </h2>
              <p className="text-xs text-stone-400">
                Khi không đủ tiền trả nợ hoặc nộp phạt, hãy bình tĩnh cơ cấu nợ!
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-700 space-y-2">
              <h3 className="font-baloo text-base font-bold text-amber-300">
                1. Bán Bớt Nhà Đang Sở Hữu
              </h3>
              <p className="text-xs text-stone-300 leading-relaxed">
                Người chơi có thể chọn bán bớt từng cấp nhà trên các ô đất của mình. Ngân hàng sẽ hoàn lại ngay <strong className="text-emerald-400">50% chi phí xây dựng</strong> của cấp nhà đó.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-700 space-y-2">
              <h3 className="font-baloo text-base font-bold text-amber-300">
                2. Cầm Cố Đất Cho Ngân Hàng
              </h3>
              <p className="text-xs text-stone-300 leading-relaxed">
                Đối với ô đất không có nhà, bạn có thể cầm cố cho Ngân hàng để nhận lại <strong className="text-emerald-400">50% giá mua đất gốc</strong>. Ô đất bị cầm cố sẽ hiện màu xám và tạm thời không thể thu tiền thuê của đối thủ cho đến khi được chuộc lại.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-700 space-y-2">
              <h3 className="font-baloo text-base font-bold text-amber-300">
                3. Chuộc Lại Đất Đã Cầm Cố
              </h3>
              <p className="text-xs text-stone-300 leading-relaxed">
                Người chơi có thể chuộc lại bất động sản bất kỳ lúc nào bằng cách thanh toán: <strong className="text-emerald-400">Giá cầm cố + 10% tiền lãi</strong> (tức 55% giá mua đất gốc). Sau khi chuộc, ô đất sẽ khôi phục màu sắc và tiếp tục thu tiền thuê bình thường.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-700 space-y-2">
              <h3 className="font-baloo text-base font-bold text-amber-300">
                4. Cơ Cấu Nợ Trước Khi Phá Sản
              </h3>
              <p className="text-xs text-stone-300 leading-relaxed">
                Khi thiếu tiền trả nợ (thuê, thuế, thẻ), game sẽ mở bảng cứu trợ để bạn chủ động bán nhà hoặc cầm cố đất. Chỉ khi đã thanh lý toàn bộ tài sản mà vẫn không đủ trả, bạn mới buộc phải tuyên bố Phá Sản!
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/40 text-xs text-rose-200">
            ⚠️ <strong>Tuyên Bố Phá Sản:</strong> Khi phá sản, toàn bộ bất động sản sẽ được hoàn trả về cho Ngân Hàng. Nếu người chơi thật phá sản hoặc trên bàn cờ chỉ còn 1 người sống sót, trận đấu sẽ lập tức khép lại với màn hình Game Over!
          </div>
        </section>

        {/* ================= SECTION 7: HẾT 25 VÒNG ĐẤU & XẾP HẠNG TÀI SẢN ================= */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 border-b border-amber-500/30 pb-3">
            <TrendingUp className="w-7 h-7 text-amber-400" />
            <div>
              <h2 className="font-baloo text-2xl font-bold text-amber-400">
                Hết 25 Vòng Đấu & Xếp Hạng Tài Sản
              </h2>
              <p className="text-xs text-stone-400">
                Quy tắc tính tổng tài sản và trao cúp chiến thắng khi trận đấu chạm mốc 25 vòng!
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-700 space-y-3">
              <div className="text-amber-400 font-baloo font-bold text-base flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                Tiền Mặt Tích Lũy
              </div>
              <p className="text-xs text-stone-300 leading-relaxed">
                Toàn bộ số dư tiền mặt hiện có trong ví của mỗi người chơi vào thời điểm kết thúc vòng đấu thứ 25.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-700 space-y-3">
              <div className="text-amber-400 font-baloo font-bold text-base flex items-center gap-2">
                <Building className="w-5 h-5 text-amber-400" />
                Giá Trị Đất & Nhà Cửa
              </div>
              <p className="text-xs text-stone-300 leading-relaxed">
                Tổng giá trị đất đai đã mua cộng với toàn bộ chi phí các cấp nhà và Landmark đã xây dựng (đất đang cầm cố tính 50% giá đất).
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-700 space-y-3">
              <div className="text-amber-400 font-baloo font-bold text-base flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                Vinh Danh 4 Hạng
              </div>
              <p className="text-xs text-stone-300 leading-relaxed">
                Người chơi có tổng tài sản cao nhất sẽ đăng quang Quán Quân! Màn hình kết quả hiển thị bảng xếp hạng 4 người kèm nút &quot;Chơi Lại&quot; và &quot;Về Sảnh&quot;.
              </p>
            </div>
          </div>
        </section>

        {/* ================= BOTTOM CTA ================= */}
        <div className="pt-6 pb-12 text-center">
          <Link
            href="/play"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-baloo text-xl font-black shadow-2xl transition-all transform hover:scale-105 active:scale-95 min-h-[44px]"
          >
            <Play className="w-6 h-6 fill-current" />
            <span>BẮT ĐẦU CHUYẾN XUYÊN VIỆT NGAY</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

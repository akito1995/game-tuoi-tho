'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Play,
  Sparkles,
  Users,
  Bot,
  Globe,
  MapPin,
  ShieldCheck,
  PiggyBank,
  BookOpen,
} from 'lucide-react';
import { ALL_MASCOTS, MASCOT_INFO } from '@/lib/multiplayer/roomStore';
import { soundManager } from '@/lib/audio/soundManager';
import { GameModeSelectModal } from '@/components/hub';
import { BOARD_TILES } from '@/lib/game-engine/boardData';

export default function CoTyPhuOverviewPage() {
  const [isModeSelectOpen, setIsModeSelectOpen] = useState(false);

  const handlePlayClick = () => {
    soundManager.playBuildSound();
    setIsModeSelectOpen(true);
  };

  const propertyTiles = BOARD_TILES.filter((t) => t.type === 'PROPERTY');

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-amber-500 selection:text-slate-950">
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link
            href="/"
            onClick={() => soundManager.playClickSound()}
            className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Về Cổng Game</span>
          </Link>

          <button
            onClick={handlePlayClick}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 hover:brightness-110 active:scale-95 transition-all"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>Chơi Ngay</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-5xl px-4 py-8 space-y-12">
        {/* Hero Banner */}
        <section className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-indigo-950/70 via-slate-900 to-amber-950/40 p-8 sm:p-12 shadow-2xl">
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-bold text-amber-300">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Phiên Bản Đảo Ngọc 3D Việt Nam</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              CỜ TỶ PHÚ 3D
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Trò chơi cờ triệu phú kinh điển được thiết kế hoàn toàn theo phong vị Việt Nam.
              Chu du qua 28 địa danh lịch sử và thắng cảnh tuyệt đẹp từ Hà Nội, Sa Pa, Hạ Long
              đến Đà Nẵng, Hội An, Sài Gòn, Phú Quốc trên một hòn đảo ngọc 3D bay bổng giữa đại ngàn.
            </p>

            <div className="pt-2 flex flex-wrap gap-4">
              <button
                onClick={handlePlayClick}
                className="flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 px-7 py-3 text-sm font-extrabold text-slate-950 shadow-lg shadow-amber-500/25 hover:brightness-110 active:scale-95 transition-all"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>CHƠI NGAY TRÊN TRÌNH DUYỆT</span>
              </button>
            </div>
          </div>
        </section>

        {/* 4 Mascots Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🐾</span>
            <h2 className="text-xl font-bold text-white">
              4 Linh Vật Hộ Mệnh Tuổi Thơ
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ALL_MASCOTS.map((m) => {
              const info = MASCOT_INFO[m];
              return (
                <div
                  key={m}
                  className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md flex flex-col items-center text-center"
                >
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-2xl text-4xl shadow-md border"
                    style={{
                      backgroundColor: `${info.color}20`,
                      borderColor: `${info.color}40`,
                    }}
                  >
                    {info.emoji}
                  </div>
                  <h3 className="mt-3 text-base font-bold text-white">
                    {info.name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">
                    {info.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* 28 Landmarks Highlight */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-amber-400" />
              <h2 className="text-xl font-bold text-white">
                28 Danh Lam Thắng Cảnh Việt Nam
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              Bắc • Trung • Nam • Biển Đảo
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {propertyTiles.map((tile) => (
              <div
                key={tile.id}
                className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Ô #{tile.id}</span>
                    <span className="font-semibold text-amber-300">
                      {(tile.price || 0) / 1000}k
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-bold text-white line-clamp-1">
                    {tile.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Special Rules & Highlights */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">
              Điểm Nhấn Luật Chơi Độc Đáo
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
            <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-4 space-y-2">
              <div className="flex items-center gap-2 font-bold text-pink-400">
                <PiggyBank className="h-4 w-4" />
                <span>Quỹ Heo Đất May Mắn</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Mỗi khi nộp thuế hay tiền phạt qua ô Quỹ Heo Đất, tiền sẽ tích lũy vào heo.
                Người chơi quay trúng ô Quỹ sẽ đập heo nhận toàn bộ số tiền thưởng!
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-4 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sky-400">
                <Globe className="h-4 w-4" />
                <span>P2P WebRTC Không Cần Đăng Nhập</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Chơi trực tuyến tức thì qua mã PIN 6 ký tự. Dữ liệu ván chơi được đồng bộ trực tiếp
                giữa các thiết bị của người chơi với độ trễ cực thấp.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-4 space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-400">
                <Bot className="h-4 w-4" />
                <span>Bot AI Tính Toán Độc Quyền</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Đối thủ máy tự động đưa ra quyết định mua đất, hoàn thiện khối màu và xây dựng
                khách sạn nhanh chóng, mượt mà.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Mode Select Modal */}
      <GameModeSelectModal
        isOpen={isModeSelectOpen}
        onClose={() => setIsModeSelectOpen(false)}
      />
    </div>
  );
}

'use client';

import React from 'react';
import { Play, Sparkles, Compass, ShieldCheck, Gamepad2 } from 'lucide-react';
import { soundManager } from '@/lib/audio/soundManager';

export interface GameHeroProps {
  onPlay: () => void;
  onExplore?: () => void;
}

export function GameHero({ onPlay, onExplore }: GameHeroProps) {
  const handlePlayClick = () => {
    soundManager.playBuildSound();
    onPlay();
  };

  const handleExploreClick = () => {
    soundManager.playClickSound();
    if (onExplore) {
      onExplore();
    } else {
      const el = document.getElementById('game-collection');
      el?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-br from-slate-900 via-indigo-950/70 to-slate-950 p-6 sm:p-10 lg:p-14 shadow-2xl shadow-amber-500/5">
      {/* Decorative Background Elements: Kites, Glows & Clouds */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-16 bottom-0 h-64 w-64 rounded-full bg-rose-500/10 blur-3xl" />

      {/* Floating Kites (Diều sáo tuổi thơ) Animation */}
      <div className="pointer-events-none absolute right-8 top-10 hidden md:block opacity-75 animate-bounce [animation-duration:5s]">
        <div className="relative">
          <span className="text-4xl filter drop-shadow">🪁</span>
          <div className="absolute -left-6 top-8 h-10 w-1 rounded-full bg-amber-400/30 rotate-45" />
        </div>
      </div>
      <div className="pointer-events-none absolute left-12 top-24 hidden lg:block opacity-60 animate-bounce [animation-duration:7s]">
        <span className="text-3xl filter drop-shadow">🪁</span>
      </div>

      <div className="relative z-10 max-w-3xl">
        {/* Nostalgic Pill Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3.5 py-1 text-xs font-bold text-amber-300 backdrop-blur-md">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          <span>Sống Lại Ký Ức Tuổi Thơ Việt Nam</span>
        </div>

        {/* Hero Title */}
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
          CỔNG TRÒ CHƠI <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-amber-400 via-orange-300 to-rose-400 bg-clip-text text-transparent drop-shadow-sm">
            DÂN GIAN & CỜ TỶ PHÚ 3D
          </span>
        </h1>

        {/* Hero Description */}
        <p className="mt-4 text-sm text-slate-300 sm:text-base lg:text-lg leading-relaxed">
          Đắm mình vào Đảo Ngọc 3D bay bổng cùng 28 danh lam thắng cảnh Việt Nam,
          gặp gỡ 4 linh vật đáng yêu (Heo Phượt, Cáo Tí, Mèo Ú, Trâu Vàng) và tận hưởng
          những ván cờ gay cấn qua mạng P2P WebRTC mượt mà không cần cài đặt.
        </p>

        {/* Call to Actions */}
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <button
            onClick={handlePlayClick}
            className="group flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 px-7 py-3.5 text-sm font-extrabold text-slate-950 shadow-xl shadow-amber-500/25 transition-all hover:scale-105 hover:brightness-110 active:scale-95"
          >
            <Play className="h-5 w-5 fill-current transition-transform group-hover:scale-110" />
            <span>CHƠI CỜ TỶ PHÚ 3D NGAY</span>
          </button>

          <button
            onClick={handleExploreClick}
            className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-800/80 px-5 py-3.5 text-sm font-bold text-slate-200 backdrop-blur-md transition-all hover:border-slate-500 hover:bg-slate-700/80 active:scale-95"
          >
            <Compass className="h-4 w-4 text-amber-400" />
            <span>Khám Phá Bộ Trò Chơi</span>
          </button>
        </div>

        {/* Feature Badges Bar */}
        <div className="mt-10 grid grid-cols-2 gap-3 border-t border-slate-800/80 pt-6 sm:grid-cols-4">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span className="text-base">🇻🇳</span>
            <span className="font-semibold">100% Thuần Việt</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span className="text-base">🏝️</span>
            <span className="font-semibold">Đồ Họa 3D Đảo Ngọc</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span className="text-base">🌐</span>
            <span className="font-semibold">P2P Không Cần Server</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span className="text-base">🤖</span>
            <span className="font-semibold">Bot AI Chiến Thuật</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default GameHero;

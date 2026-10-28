'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Play,
  Heart,
  Bell,
  Sparkles,
  Users,
  Bot,
  Globe,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { soundManager } from '@/lib/audio/soundManager';
import {
  UPCOMING_GAMES,
  getGameVotes,
  voteForGame,
} from './hubHelpers';

export interface GameGridProps {
  onPlayGame: (gameId: string) => void;
}

export function GameGrid({ onPlayGame }: GameGridProps) {
  const [votes, setVotes] = useState<Record<string, number>>(() => getGameVotes());
  const [notifiedGames, setNotifiedGames] = useState<Record<string, boolean>>({});

  const handleVote = (gameId: string) => {
    soundManager.playCoinSound();
    const updated = voteForGame(gameId);
    setVotes(updated);
  };

  const handleNotify = (gameId: string) => {
    soundManager.playClickSound();
    setNotifiedGames((prev) => ({
      ...prev,
      [gameId]: !prev[gameId],
    }));
  };

  return (
    <section id="game-collection" className="mt-12 space-y-8">
      {/* Section Title */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🎲</span>
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Kho Trò Chơi Tuổi Thơ
            </h2>
          </div>
          <p className="mt-1 text-xs text-slate-400 sm:text-sm">
            Khám phá trò chơi đã phát hành và bình chọn cho các tựa game tiếp theo được yêu thích
          </p>
        </div>
      </div>

      {/* Featured Game Card: CỜ TỶ PHÚ 3D */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/40 p-6 sm:p-8 shadow-2xl shadow-amber-500/10">
        {/* Glow effect */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-500/15 blur-3xl" />

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 px-3 py-1 text-xs font-black text-slate-950 shadow-md">
                <Sparkles className="h-3.5 w-3.5 fill-current" />
                HOT 3D • ĐÃ SẴN SÀNG
              </span>
              <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-300 border border-emerald-500/30">
                Chơi Ngay
              </span>
            </div>

            {/* Title */}
            <h3 className="text-2xl font-extrabold text-white sm:text-3xl">
              Cờ Tỷ Phú 3D: Đảo Ngọc Việt Nam
            </h3>

            {/* Description */}
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Trải nghiệm bàn cờ 3D lộng lẫy với 28 địa danh danh lam thắng cảnh Việt Nam:
              Hà Nội, Sapa, Hạ Long, Huế, Hội An, Sài Gòn, Phú Quốc... Tự do xây nhà phố, khách sạn,
              thu thuế du lịch và rinh quỹ Heo Đất may mắn!
            </p>

            {/* Tags */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-medium text-slate-300">
              <span className="flex items-center gap-1 rounded-lg bg-slate-800/80 px-2.5 py-1 border border-slate-700/60">
                <Users className="h-3.5 w-3.5 text-amber-400" />
                2 - 4 Người Chơi
              </span>
              <span className="flex items-center gap-1 rounded-lg bg-slate-800/80 px-2.5 py-1 border border-slate-700/60">
                <Globe className="h-3.5 w-3.5 text-sky-400" />
                Online P2P WebRTC
              </span>
              <span className="flex items-center gap-1 rounded-lg bg-slate-800/80 px-2.5 py-1 border border-slate-700/60">
                <Bot className="h-3.5 w-3.5 text-indigo-400" />
                Bot AI Thông Minh
              </span>
              <span className="rounded-lg bg-slate-800/80 px-2.5 py-1 border border-slate-700/60">
                🎮 Three.js WebGL 3D
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 min-w-[200px]">
            <button
              onClick={() => {
                soundManager.playBuildSound();
                onPlayGame('co-ty-phu');
              }}
              className="group flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 py-3.5 px-6 text-sm font-extrabold text-slate-950 shadow-lg shadow-amber-500/25 transition-all hover:brightness-110 active:scale-95"
            >
              <Play className="h-4 w-4 fill-current transition-transform group-hover:scale-110" />
              <span>CHƠI NGAY</span>
            </button>

            <Link
              href="/games/co-ty-phu"
              className="flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-800/80 py-3 px-6 text-xs font-bold text-slate-300 transition-all hover:bg-slate-700/80 hover:text-white"
            >
              <Info className="h-4 w-4" />
              <span>Xem Giới Thiệu & Luật</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Upcoming Games Grid */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">✨</span>
            <h3 className="text-lg font-bold text-slate-200">
              Trò Chơi Dân Gian Đang Phát Triển (Sắp Ra Mắt)
            </h3>
          </div>
          <span className="text-xs text-slate-400 hidden sm:inline">
            Bình chọn để ưu tiên ra mắt sớm nhất!
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {UPCOMING_GAMES.map((game) => {
            const voteCount = votes[game.id] || game.defaultVotes;
            const isNotified = notifiedGames[game.id] || false;

            return (
              <div
                key={game.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/70 p-5 backdrop-blur-md transition-all hover:border-slate-700 hover:bg-slate-900/90 hover:shadow-xl"
              >
                <div>
                  {/* Top: Icon & Badge */}
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-2xl border border-slate-700/60 shadow-inner">
                      {game.icon}
                    </div>
                    <span className="rounded-full bg-slate-800 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-400 border border-amber-400/20">
                      {game.releaseQuarter}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div className="mt-4">
                    <h4 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                      {game.title}
                    </h4>
                    <p className="mt-1 text-xs text-slate-400 line-clamp-2">
                      {game.description}
                    </p>
                  </div>

                  {/* Tags */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {game.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md bg-slate-800/80 px-2 py-0.5 text-[10px] font-medium text-slate-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer: Vote & Notify Pill */}
                <div className="mt-5 border-t border-slate-800/80 pt-4 flex items-center justify-between gap-2">
                  {/* Vote button */}
                  <button
                    type="button"
                    onClick={() => handleVote(game.id)}
                    className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-500/20 active:scale-95 transition-all"
                    title="Bình chọn cho game này"
                  >
                    <Heart className="h-3.5 w-3.5 fill-rose-500/40 text-rose-400" />
                    <span>{voteCount.toLocaleString('vi-VN')}</span>
                  </button>

                  {/* Notify pill */}
                  <button
                    type="button"
                    onClick={() => handleNotify(game.id)}
                    className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                      isNotified
                        ? 'border border-emerald-500/30 bg-emerald-500/20 text-emerald-300'
                        : 'border border-slate-700 bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    {isNotified ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Đã Đăng Ký</span>
                      </>
                    ) : (
                      <>
                        <Bell className="h-3.5 w-3.5" />
                        <span>Nhận Tin</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default GameGrid;

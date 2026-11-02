'use client';

import React, { useState } from 'react';
import { Menu, BookOpen, Volume2, VolumeX, X, HelpCircle, LogOut, Zap, FastForward } from 'lucide-react';
import { soundManager } from '@/lib/audio/soundManager';

interface TopLeftActionsProps {
  onOpenRules: () => void;
  onOpenMenu?: () => void;
  onSurrender?: () => void;
  gameSpeed?: 1 | 2 | 4;
  onToggleSpeed?: () => void;
  skipBotAnimations?: boolean;
  onToggleSkipBotAnimations?: () => void;
}

export const TopLeftActions: React.FC<TopLeftActionsProps> = ({
  onOpenRules,
  onOpenMenu,
  onSurrender,
  gameSpeed = 1,
  onToggleSpeed,
  skipBotAnimations = false,
  onToggleSkipBotAnimations,
}) => {
  const [isMuted, setIsMuted] = useState(() => {
    try {
      const s = soundManager.getSettings();
      return !s.sfxEnabled && !s.bgmEnabled;
    } catch {
      return false;
    }
  });

  const [showMenuModal, setShowMenuModal] = useState(false);

  const handleToggleSound = () => {
    try {
      const nextMuted = !isMuted;
      setIsMuted(nextMuted);
      soundManager.toggleBgm(!nextMuted);
      soundManager.toggleSfx(!nextMuted);
      if (!nextMuted) {
        soundManager.playClickSound();
      }
    } catch {
      setIsMuted(!isMuted);
    }
  };

  return (
    <>
      {/* 3 nút tròn cố định ở góc trái trên, bám theo cửa sổ cách mép tối thiểu 16px */}
      <div className="fixed top-4 left-4 z-30 pointer-events-auto select-none flex items-center gap-2.5">
        {/* Nút 1: Menu */}
        <button
          onClick={() => {
            if (onOpenMenu) onOpenMenu();
            else setShowMenuModal(true);
          }}
          className="h-11 w-11 min-h-[44px] min-w-[44px] rounded-full bg-slate-900/95 hover:bg-slate-800 border-2 border-slate-700 hover:border-amber-400 shadow-xl flex items-center justify-center text-slate-200 hover:text-amber-300 active:scale-95 transition-all cursor-pointer"
          title="Menu tùy chọn"
          aria-label="Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Nút 2: Luật chơi */}
        <button
          onClick={onOpenRules}
          className="h-11 w-11 min-h-[44px] min-w-[44px] rounded-full bg-slate-900/95 hover:bg-slate-800 border-2 border-slate-700 hover:border-amber-400 shadow-xl flex items-center justify-center text-slate-200 hover:text-amber-300 active:scale-95 transition-all cursor-pointer"
          title="Xem luật chơi"
          aria-label="Luật chơi"
        >
          <BookOpen className="h-5 w-5" />
        </button>

        {/* Nút 3: Âm thanh */}
        <button
          onClick={handleToggleSound}
          className={`h-11 w-11 min-h-[44px] min-w-[44px] rounded-full border-2 shadow-xl flex items-center justify-center active:scale-95 transition-all cursor-pointer ${
            isMuted
              ? 'bg-rose-950/90 border-rose-600 text-rose-300 hover:bg-rose-900'
              : 'bg-slate-900/95 border-slate-700 hover:border-amber-400 text-slate-200 hover:text-amber-300'
          }`}
          title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          aria-label="Âm thanh"
        >
          {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>

        {/* Nút 4: Tăng tốc 1x / 2x / 4x */}
        {onToggleSpeed && (
          <button
            onClick={onToggleSpeed}
            className={`h-11 px-3.5 min-h-[44px] rounded-full border-2 shadow-xl flex items-center justify-center gap-1.5 font-baloo font-bold text-xs active:scale-95 transition-all cursor-pointer ${
              gameSpeed >= 2
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 border-amber-300 text-slate-950 shadow-amber-500/30'
                : 'bg-slate-900/95 border-slate-700 hover:border-amber-400 text-slate-300 hover:text-amber-300'
            }`}
            title={`Tốc độ hiện tại: ${gameSpeed}x. Bấm để chuyển tốc độ`}
            aria-label="Tăng tốc độ"
          >
            <Zap className={`h-4 w-4 ${gameSpeed >= 2 ? 'fill-slate-950 text-slate-950' : 'text-amber-400'}`} />
            <span>{gameSpeed}x</span>
          </button>
        )}

        {/* Nút 5: Tuỳ chọn Bỏ qua hiệu ứng của bot */}
        {onToggleSkipBotAnimations && (
          <button
            onClick={onToggleSkipBotAnimations}
            className={`h-11 px-3 min-h-[44px] rounded-full border-2 shadow-xl flex items-center justify-center gap-1.5 font-baloo font-bold text-xs active:scale-95 transition-all cursor-pointer ${
              skipBotAnimations
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 border-cyan-300 text-white shadow-cyan-500/30'
                : 'bg-slate-900/95 border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-cyan-300'
            }`}
            title={
              skipBotAnimations
                ? 'Đang bật: Bỏ qua hiệu ứng của bot (chỉ hiện kết quả 1s). Bấm để tắt'
                : 'Đang tắt: Bỏ qua hiệu ứng của bot. Bấm để bật tua nhanh bot'
            }
            aria-label="Bỏ qua hiệu ứng bot"
          >
            <FastForward className="h-4 w-4" />
            <span className="hidden sm:inline">Tua bot</span>
          </button>
        )}
      </div>

      {/* Menu Modal dự phòng khi người dùng bấm Menu */}
      {showMenuModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-xs rounded-2xl bg-slate-950 border-2 border-amber-500/50 p-5 shadow-2xl text-center">
            <button
              onClick={() => setShowMenuModal(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="font-baloo text-lg font-bold text-amber-300 mb-4">MENU TRÒ CHƠI</h3>
            <div className="space-y-2.5">
              <button
                onClick={() => {
                  setShowMenuModal(false);
                  onOpenRules();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold transition active:scale-95"
              >
                <BookOpen className="h-4 w-4 text-amber-400" />
                <span>Hướng dẫn & Luật chơi</span>
              </button>
              {onSurrender && (
                <button
                  onClick={() => {
                    setShowMenuModal(false);
                    onSurrender();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-700 text-rose-200 text-xs font-bold transition active:scale-95"
                >
                  <LogOut className="h-4 w-4 text-rose-400" />
                  <span>Rời ván đấu / Đầu hàng</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

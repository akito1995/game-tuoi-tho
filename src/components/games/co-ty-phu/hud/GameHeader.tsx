'use client';

import React, { useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Music,
  PiggyBank,
  BookOpen,
  Sparkles,
  Home,
  Flame,
} from 'lucide-react';
import { useGameStore } from '@/lib/game-engine/gameStore';
import { soundManager } from '@/lib/audio/soundManager';
import { formatMoney } from './hudHelpers';

export interface GameHeaderProps {
  onOpenRules?: () => void;
  onQuit?: () => void;
  className?: string;
}

export function GameHeader({ onOpenRules, onQuit, className = '' }: GameHeaderProps) {
  const currentRound = useGameStore((state) => state.currentRound || 1);
  const jackpotFund = useGameStore((state) => state.jackpotFund || 0);

  // Sound settings state synced with soundManager
  const [bgmEnabled, setBgmEnabled] = useState(true);
  const [sfxEnabled, setSfxEnabled] = useState(true);

  useEffect(() => {
    const s = soundManager.getSettings();
    setBgmEnabled(s.bgmEnabled);
    setSfxEnabled(s.sfxEnabled);
  }, []);

  const handleToggleBgm = () => {
    const updated = soundManager.toggleBgm();
    setBgmEnabled(updated);
    if (sfxEnabled) soundManager.playClickSound();
  };

  const handleToggleSfx = () => {
    const updated = soundManager.toggleSfx();
    setSfxEnabled(updated);
    if (updated) soundManager.playClickSound();
  };

  const handleRulesClick = () => {
    if (sfxEnabled) soundManager.playClickSound();
    onOpenRules?.();
  };

  return (
    <header
      className={`relative z-30 flex flex-wrap items-center justify-between gap-3 border-b border-white/15 bg-slate-950/75 px-4 py-2.5 backdrop-blur-xl shadow-2xl shadow-indigo-950/40 ${className}`}
    >
      {/* Left: Branding & Meta World Styled Round Badge */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-400 via-yellow-500 to-amber-600 shadow-lg shadow-amber-500/30 ring-2 ring-yellow-300/60">
            <span className="text-xl filter drop-shadow">🎲</span>
            <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white shadow">
              3D
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base sm:text-lg font-black tracking-wider text-white drop-shadow">
                CỜ TỶ PHÚ <span className="text-amber-400">3D</span>
              </h1>
              <span className="rounded-full bg-gradient-to-r from-rose-500/20 to-amber-500/20 px-2 py-0.5 text-[9px] font-extrabold text-amber-300 border border-amber-400/40 shadow-sm">
                ĐẢO NGỌC
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium tracking-tight">Meta World Edition</p>
          </div>
        </div>

        {/* Round Badge - Luxury Gold Capsule */}
        <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-amber-400/60 bg-gradient-to-r from-amber-500/20 via-yellow-400/15 to-amber-500/20 px-3 py-1 text-xs font-black text-amber-300 shadow-md shadow-amber-500/10">
          <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-spin" />
          <span className="tracking-wide">VÒNG {currentRound}</span>
        </div>
      </div>

      {/* Center: Jackpot Heo Đất Fund - Glowing Pink & Gold Treasure Capsule */}
      <div className="relative group cursor-pointer flex items-center gap-2.5 rounded-full border-2 border-pink-400/50 bg-gradient-to-r from-rose-950/80 via-pink-900/70 to-rose-950/80 px-4 py-1.5 shadow-xl shadow-pink-500/25 ring-1 ring-white/20 transition-transform hover:scale-105 active:scale-95">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-pink-500 to-rose-600 text-white shadow-md shadow-pink-500/40 animate-bounce">
          <PiggyBank className="h-4 w-4" />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-pink-200">
            Quỹ Heo Đất:
          </span>
          <span className="font-black tracking-wide text-amber-300 text-sm sm:text-base text-glow-gold">
            {formatMoney(jackpotFund)}
          </span>
        </div>
        <div className="absolute -top-1.5 right-3 flex items-center gap-0.5 rounded-full bg-amber-400 px-1.5 py-0.2 text-[8px] font-black text-slate-950 shadow">
          <Flame className="h-2 w-2 fill-slate-950 text-slate-950" />
          <span>JACKPOT</span>
        </div>
      </div>

      {/* Right: Controls & Help */}
      <div className="flex items-center gap-2">
        {/* Rules Guide Button */}
        <button
          onClick={handleRulesClick}
          aria-label="Xem luật chơi"
          className="flex items-center gap-1.5 rounded-xl border border-sky-400/40 bg-sky-500/15 hover:bg-sky-500/25 px-3 py-1.5 text-xs font-bold text-sky-200 transition-all hover:scale-105 active:scale-95 shadow-md shadow-sky-500/20"
        >
          <BookOpen className="h-3.5 w-3.5 text-sky-300" />
          <span className="hidden sm:inline">Luật Chơi</span>
        </button>

        {/* Quit Button */}
        {onQuit && (
          <button
            onClick={() => {
              if (sfxEnabled) soundManager.playClickSound();
              onQuit();
            }}
            aria-label="Về Cổng Game"
            title="Về Cổng Game"
            className="flex items-center gap-1.5 rounded-xl border border-rose-400/40 bg-rose-500/15 hover:bg-rose-500/25 px-3 py-1.5 text-xs font-bold text-rose-200 transition-all hover:scale-105 active:scale-95 shadow-md shadow-rose-500/20"
          >
            <Home className="h-3.5 w-3.5 text-rose-300" />
            <span className="hidden sm:inline">Rời Bàn</span>
          </button>
        )}

        {/* Sound Toggles */}
        <div className="flex items-center rounded-xl border border-white/15 bg-slate-900/90 p-1 shadow-inner">
          {/* BGM Toggle */}
          <button
            onClick={handleToggleBgm}
            title={bgmEnabled ? 'Tắt nhạc nền (BGM)' : 'Bật nhạc nền (BGM)'}
            aria-label="Chuyển đổi nhạc nền"
            className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all ${
              bgmEnabled
                ? 'bg-gradient-to-tr from-amber-400 to-yellow-500 text-slate-950 font-bold shadow-md shadow-amber-500/30'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Music className="h-3.5 w-3.5" />
          </button>

          {/* SFX Toggle */}
          <button
            onClick={handleToggleSfx}
            title={sfxEnabled ? 'Tắt hiệu ứng âm thanh' : 'Bật hiệu ứng âm thanh'}
            aria-label="Chuyển đổi âm thanh"
            className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all ${
              sfxEnabled
                ? 'bg-gradient-to-tr from-amber-400 to-yellow-500 text-slate-950 font-bold shadow-md shadow-amber-500/30'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {sfxEnabled ? (
              <Volume2 className="h-3.5 w-3.5" />
            ) : (
              <VolumeX className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

export default GameHeader;

'use client';

import React, { useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Music,
  PiggyBank,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { useGameStore } from '@/lib/game-engine/gameStore';
import { soundManager } from '@/lib/audio/soundManager';
import { formatMoney } from './hudHelpers';

export interface GameHeaderProps {
  onOpenRules?: () => void;
  className?: string;
}

export function GameHeader({ onOpenRules, className = '' }: GameHeaderProps) {
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
      className={`relative z-30 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-slate-950/80 px-4 py-2.5 backdrop-blur-md shadow-lg shadow-black/20 ${className}`}
    >
      {/* Left: Branding & Round Badge */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 shadow-md shadow-amber-500/20">
            <span className="text-lg">🎲</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-extrabold tracking-tight text-white drop-shadow-sm">
                CỜ TỶ PHÚ 3D
              </h1>
              <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-semibold text-rose-300 border border-rose-500/30">
                Việt Nam
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Đảo Ngọc Du Ký</p>
          </div>
        </div>

        {/* Round Badge */}
        <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-300">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          <span>Vòng {currentRound}</span>
        </div>
      </div>

      {/* Center: Jackpot Heo Đất Fund */}
      <div className="flex items-center gap-2 rounded-full border border-pink-500/30 bg-gradient-to-r from-pink-950/70 via-rose-950/60 to-pink-950/70 px-3.5 py-1.5 shadow-inner shadow-pink-500/10">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-pink-500/20 text-pink-400">
          <PiggyBank className="h-3.5 w-3.5" />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-medium text-pink-200/90 sm:text-xs">
            Quỹ Heo Đất:
          </span>
          <span className="font-extrabold tracking-wide text-amber-300 drop-shadow-sm text-xs sm:text-sm">
            {formatMoney(jackpotFund)}
          </span>
        </div>
      </div>

      {/* Right: Controls & Help */}
      <div className="flex items-center gap-2">
        {/* Rules Guide Button */}
        <button
          onClick={handleRulesClick}
          aria-label="Xem luật chơi"
          className="flex items-center gap-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 px-2.5 py-1.5 text-xs font-semibold text-sky-300 transition-all hover:bg-sky-500/20 active:scale-95 shadow-sm"
        >
          <BookOpen className="h-3.5 w-3.5 text-sky-400" />
          <span className="hidden sm:inline">📖 Luật Chơi</span>
          <span className="sm:hidden">Luật</span>
        </button>

        {/* Sound toggles */}
        <div className="flex items-center rounded-lg border border-slate-700/60 bg-slate-800/60 p-0.5">
          {/* BGM Toggle */}
          <button
            onClick={handleToggleBgm}
            title={bgmEnabled ? 'Tắt nhạc nền (BGM)' : 'Bật nhạc nền (BGM)'}
            aria-label="Chuyển đổi nhạc nền"
            className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
              bgmEnabled
                ? 'bg-amber-500/20 text-amber-300'
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
            className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
              sfxEnabled
                ? 'bg-amber-500/20 text-amber-300'
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

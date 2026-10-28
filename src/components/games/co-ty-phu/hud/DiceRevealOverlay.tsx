'use client';

import React, { useEffect, useState } from 'react';
import { useGameStore } from '@/lib/game-engine/gameStore';
import { soundManager } from '@/lib/audio/soundManager';
import { Sparkles } from 'lucide-react';

interface DiceFaceProps {
  value: number;
}

/**
 * High-definition 3D styled dice face with dots
 */
function BigDiceFace({ value }: DiceFaceProps) {
  const pipPositions: Record<number, number[]> = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8],
  };

  const activePips = pipPositions[value] || [4];

  return (
    <div className="relative flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-white via-slate-50 to-slate-200 p-2 shadow-2xl ring-4 ring-slate-300/80 transition-all duration-300">
      {/* 3D Inner Bevel Highlight */}
      <div className="absolute inset-1 rounded-xl border border-white/80 pointer-events-none" />

      {/* 3x3 Pip Grid */}
      <div className="grid h-full w-full grid-cols-3 grid-rows-3 gap-1 p-1">
        {Array.from({ length: 9 }).map((_, idx) => {
          const isPip = activePips.includes(idx);
          const isCenterPip = idx === 4 && (value === 1 || value === 3 || value === 5);
          return (
            <div key={idx} className="flex items-center justify-center">
              {isPip && (
                <div
                  className={`rounded-full shadow-inner ${
                    isCenterPip && value === 1
                      ? 'h-5 w-5 bg-red-600 sm:h-6 sm:w-6'
                      : 'h-3.5 w-3.5 bg-slate-900 sm:h-4 sm:w-4'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function DiceRevealOverlay() {
  const dice = useGameStore((s) => s.dice);
  const isDouble = useGameStore((s) => s.isDouble);
  const gamePhase = useGameStore((s) => s.gamePhase);
  const activePlayerIndex = useGameStore((s) => s.activePlayerIndex);
  const players = useGameStore((s) => s.players);

  const [visible, setVisible] = useState(false);
  const [displayedDice, setDisplayedDice] = useState<[number, number]>([1, 1]);
  const [showDoubleAura, setShowDoubleAura] = useState(false);

  const activePlayer = players[activePlayerIndex];

  useEffect(() => {
    // Trigger when dice values update or game phase indicates an active roll
    if (dice && dice[0] > 0 && dice[1] > 0) {
      setDisplayedDice(dice);
      setVisible(true);

      const isCurrentDouble = dice[0] === dice[1];
      setShowDoubleAura(isCurrentDouble);

      if (isCurrentDouble) {
        soundManager.playDoubleDiceSound();
        if (typeof window !== 'undefined') {
          import('canvas-confetti')
            .then((mod) => {
              const runConfetti = mod.default || mod;
              runConfetti({
                particleCount: 40,
                spread: 60,
                origin: { y: 0.5 },
                colors: ['#fbbf24', '#f59e0b', '#ef4444', '#10b981'],
              });
            })
            .catch(() => {});
        }
      } else {
        soundManager.playDiceRoll();
      }

      // Auto-hide after 1.8 seconds to allow player to clearly appreciate the roll
      const timer = setTimeout(() => {
        setVisible(false);
      }, 1800);

      return () => clearTimeout(timer);
    }
  }, [dice, isDouble, gamePhase]);

  if (!visible) return null;

  const sum = displayedDice[0] + displayedDice[1];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-4 animate-fade-in">
      {/* Soft dark backdrop */}
      <div className="absolute inset-0 bg-slate-950/30 backdrop-blur-sm transition-opacity duration-300" />

      {/* Central Announcement Card */}
      <div className="relative flex flex-col items-center justify-center rounded-3xl bg-slate-900/90 p-6 sm:p-8 text-center text-white shadow-2xl ring-2 ring-white/20 backdrop-blur-md animate-scale-up max-w-sm sm:max-w-md w-full">
        {/* Glow halo if double */}
        {showDoubleAura && (
          <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 opacity-60 blur-xl animate-pulse" />
        )}

        {/* Player Name and Header */}
        <p className="text-xs sm:text-sm font-semibold tracking-wider text-amber-300 uppercase">
          {activePlayer?.name || 'Người Chơi'} Đã Đổ
        </p>

        {/* 2 Big Rolling Dice Side-by-Side */}
        <div className="my-5 flex items-center justify-center gap-4 sm:gap-6">
          <div className="transform -rotate-6 transition-transform hover:rotate-0">
            <BigDiceFace value={displayedDice[0]} />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-400">+</div>
          <div className="transform rotate-6 transition-transform hover:rotate-0">
            <BigDiceFace value={displayedDice[1]} />
          </div>
        </div>

        {/* Total Sum Display */}
        <div className="flex items-center gap-2">
          <span className="text-sm sm:text-base font-medium text-slate-300">Tổng Số Nút:</span>
          <span className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight">
            {sum}
          </span>
        </div>

        {/* Double Celebration Banner */}
        {showDoubleAura && (
          <div className="mt-4 flex flex-col items-center rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-400/30 to-amber-500/20 px-4 py-2 ring-1 ring-amber-400/50 animate-bounce">
            <div className="flex items-center gap-1.5 text-base sm:text-lg font-black text-yellow-300">
              <Sparkles className="h-5 w-5 text-yellow-300 animate-spin" />
              <span>SỐ ĐÔI {displayedDice[0]} - {displayedDice[1]}!</span>
              <Sparkles className="h-5 w-5 text-yellow-300 animate-spin" />
            </div>
            <p className="text-xs font-semibold text-yellow-200">
              +50.000đ Thưởng & Được Đổ Thêm Lượt!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default DiceRevealOverlay;

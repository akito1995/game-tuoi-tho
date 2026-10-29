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
    <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-white via-slate-50 to-slate-200 p-2 shadow-xl ring-2 ring-slate-300/80 transition-all duration-300">
      {/* 3D Inner Bevel Highlight */}
      <div className="absolute inset-1 rounded-xl border border-white/80 pointer-events-none" />

      {/* 3x3 Pip Grid */}
      <div className="grid h-full w-full grid-cols-3 grid-rows-3 gap-0.5 p-0.5">
        {Array.from({ length: 9 }).map((_, idx) => {
          const isPip = activePips.includes(idx);
          const isCenterPip = idx === 4 && (value === 1 || value === 3 || value === 5);
          return (
            <div key={idx} className="flex items-center justify-center">
              {isPip && (
                <div
                  className={`rounded-full shadow-inner ${
                    isCenterPip && value === 1
                      ? 'h-4 w-4 bg-red-600 sm:h-5 sm:w-5'
                      : 'h-3 w-3 bg-slate-900 sm:h-3.5 sm:w-3.5'
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
  const [rollerName, setRollerName] = useState('');

  const activePlayer = players[activePlayerIndex];

  useEffect(() => {
    // Trigger when dice values update or game phase indicates an active roll
    if (dice && dice[0] > 0 && dice[1] > 0) {
      setDisplayedDice(dice);
      setRollerName(players[activePlayerIndex]?.name || 'Người Chơi');
      setVisible(true);

      const isCurrentDouble = dice[0] === dice[1];
      setShowDoubleAura(isCurrentDouble);

      if (isCurrentDouble) {
        soundManager.playDoubleDiceSound();
      } else {
        soundManager.playDiceRoll();
      }

      // Auto-hide after 1.5 seconds (board is never dimmed or obscured)
      const timer = setTimeout(() => {
        setVisible(false);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [dice, isDouble, gamePhase]);

  if (!visible) return null;

  const sum = displayedDice[0] + displayedDice[1];

  return (
    <div className="fixed top-16 inset-x-0 z-40 flex items-center justify-center pointer-events-none p-3 animate-in fade-in slide-in-from-top-4 duration-200">
      {/* Floating Announcement Card: Clean, transparent, never dims or blurs the 3D board */}
      <div className="relative flex flex-col items-center justify-center rounded-2xl bg-slate-950/85 px-6 py-4 text-center text-white shadow-2xl ring-2 ring-white/20 backdrop-blur-md max-w-sm w-full">
        {/* Glow halo if double */}
        {showDoubleAura && (
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 opacity-60 blur-md animate-pulse" />
        )}

        {/* Player Name and Header */}
        <p className="text-xs font-bold tracking-wider text-amber-300 uppercase">
          {rollerName || activePlayer?.name || 'Người Chơi'} Đã Đổ
        </p>

        {/* 2 Big Rolling Dice Side-by-Side */}
        <div className="my-2 flex items-center justify-center gap-3 sm:gap-4">
          <div className="transform -rotate-3">
            <BigDiceFace value={displayedDice[0]} />
          </div>
          <div className="text-xl font-black text-amber-400">+</div>
          <div className="transform rotate-3">
            <BigDiceFace value={displayedDice[1]} />
          </div>
          <div className="ml-2 flex flex-col items-start">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Tổng số</span>
            <span className="text-2xl font-black text-yellow-300 drop-shadow">{sum}</span>
          </div>
        </div>

        {/* Doubles Celebration Banner (No confetti here per user rule) */}
        {showDoubleAura && (
          <div className="mt-1 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500/30 to-yellow-500/30 px-3 py-0.5 border border-amber-400/50">
            <Sparkles className="h-3.5 w-3.5 text-yellow-300 animate-spin" />
            <span className="text-xs font-black text-yellow-200 uppercase tracking-wide">
              SỐ ĐÔI! ĐƯỢC ĐỔ THÊM LƯỢT
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default DiceRevealOverlay;

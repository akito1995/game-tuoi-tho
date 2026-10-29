'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useGameStore } from '@/lib/game-engine/gameStore';
import { soundManager } from '@/lib/audio/soundManager';
import { Sparkles, Dices } from 'lucide-react';

interface DiceFaceProps {
  value: number;
}

/**
 * High-definition 3D styled dice face with dots (Asian ivory style with red 1 & red 4)
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
    <div className="relative flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-white via-slate-50 to-slate-200 p-2.5 shadow-2xl ring-4 ring-amber-400/80 transition-all duration-200">
      {/* 3D Inner Bevel Highlight */}
      <div className="absolute inset-1 rounded-xl border-2 border-white/90 pointer-events-none" />

      {/* 3x3 Pip Grid */}
      <div className="grid h-full w-full grid-cols-3 grid-rows-3 gap-1 p-0.5">
        {Array.from({ length: 9 }).map((_, idx) => {
          const isPip = activePips.includes(idx);
          const isCenterPip = idx === 4 && (value === 1 || value === 3 || value === 5);
          const isRed = (value === 1 && isCenterPip) || (value === 4 && isPip);
          return (
            <div key={idx} className="flex items-center justify-center">
              {isPip && (
                <div
                  className={`rounded-full shadow-inner transition-transform duration-100 ${
                    isRed
                      ? 'h-4 w-4 sm:h-5 sm:w-5 bg-red-600 ring-1 ring-red-400'
                      : 'h-3.5 w-3.5 sm:h-4 sm:w-4 bg-slate-900'
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

/**
 * Tumbling 3D Die Component with tumbling rotation and physics bounce
 */
function TumblingDie({
  finalValue,
  isTumbling,
  delayMs = 0,
}: {
  finalValue: number;
  isTumbling: boolean;
  delayMs?: number;
}) {
  const [tempValue, setTempValue] = useState(finalValue);
  const [tumbleStyle, setTumbleStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (isTumbling) {
      let frame = 0;
      const interval = setInterval(() => {
        frame++;
        setTempValue(Math.floor(Math.random() * 6) + 1);
      }, 70);

      // Tumbling keyframes simulated via transform
      const rotX = (Math.random() - 0.5) * 720 + 360;
      const rotY = (Math.random() - 0.5) * 720 + 360;
      const rotZ = (Math.random() - 0.5) * 360;

      setTumbleStyle({
        transform: `perspective(600px) rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg) scale(1.15)`,
        transition: 'transform 1.1s cubic-bezier(0.17, 0.67, 0.35, 1.2)',
      });

      const timer = setTimeout(() => {
        clearInterval(interval);
        setTempValue(finalValue);
        setTumbleStyle({
          transform: 'perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg) scale(1.0)',
          transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
        });
      }, 1100 + delayMs);

      return () => {
        clearInterval(interval);
        clearTimeout(timer);
      };
    } else {
      setTempValue(finalValue);
      setTumbleStyle({
        transform: 'perspective(600px) rotateX(0deg) rotateY(0deg) rotateZ(0deg) scale(1.0)',
      });
    }
  }, [isTumbling, finalValue, delayMs]);

  return (
    <div style={tumbleStyle} className="inline-block transition-transform duration-200">
      <BigDiceFace value={tempValue} />
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
  const [isTumbling, setIsTumbling] = useState(false);
  const [settled, setSettled] = useState(false);
  const [displayedDice, setDisplayedDice] = useState<[number, number]>([1, 1]);
  const [showDoubleAura, setShowDoubleAura] = useState(false);
  const [rollerName, setRollerName] = useState('');
  const lastRollKeyRef = useRef<string>('');

  const activePlayer = players[activePlayerIndex];

  useEffect(() => {
    if (dice && dice[0] > 0 && dice[1] > 0) {
      const rollKey = `${activePlayerIndex}-${dice[0]}-${dice[1]}-${Date.now()}`;
      lastRollKeyRef.current = rollKey;

      setDisplayedDice(dice);
      const isBot = activePlayer?.isBot || false;
      const name = activePlayer?.name || 'Người Chơi';
      setRollerName(isBot ? `${name} (Máy)` : `${name} (Bạn)`);

      setVisible(true);
      setIsTumbling(true);
      setSettled(false);

      soundManager.playDiceRoll();

      // After 1.2s tumbling, dice hit the ground and settle
      const settleTimer = setTimeout(() => {
        setIsTumbling(false);
        setSettled(true);

        const isCurrentDouble = dice[0] === dice[1];
        setShowDoubleAura(isCurrentDouble);

        if (isCurrentDouble) {
          soundManager.playDoubleDiceSound();
        } else {
          soundManager.playClickSound();
        }
      }, 1200);

      // Auto-hide after 3.2s total (generous time to appreciate the roll and sum)
      const hideTimer = setTimeout(() => {
        setVisible(false);
      }, 3400);

      return () => {
        clearTimeout(settleTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [dice, isDouble, gamePhase, activePlayerIndex]);

  if (!visible) return null;

  const sum = displayedDice[0] + displayedDice[1];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-4 animate-in fade-in zoom-in-95 duration-200">
      {/* Background Soft Dimmer during rolling */}
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] transition-opacity duration-300" />

      {/* Floating Announcement Card: Meta World Luxury Stadium */}
      <div className="relative flex flex-col items-center justify-center rounded-3xl bg-slate-950/90 border-2 border-amber-400/80 px-8 py-6 text-center text-white shadow-2xl ring-4 ring-yellow-400/30 backdrop-blur-2xl max-w-md w-full animate-in slide-in-from-top-6 duration-300">
        {/* Glow halo if double */}
        {showDoubleAura && settled && (
          <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 opacity-70 blur-xl animate-pulse" />
        )}

        {/* Roller Status Pill */}
        <div className="flex items-center gap-2 rounded-full bg-slate-900/90 px-4 py-1.5 border border-white/20 shadow-md">
          <Dices className="h-4 w-4 text-amber-400 animate-spin" />
          <span className="text-xs font-black tracking-wider text-amber-300 uppercase">
            {rollerName} {isTumbling ? 'Đang Lăn Xí Ngầu...' : 'Đã Đổ Xong!'}
          </span>
        </div>

        {/* 2 Big Rolling Tumbling Dice Side-by-Side */}
        <div className="my-6 flex items-center justify-center gap-6 sm:gap-8">
          <TumblingDie finalValue={displayedDice[0]} isTumbling={isTumbling} delayMs={0} />
          <div className="text-2xl font-black text-amber-400 drop-shadow animate-pulse">+</div>
          <TumblingDie finalValue={displayedDice[1]} isTumbling={isTumbling} delayMs={80} />
        </div>

        {/* Sum & Impact Banner */}
        {settled ? (
          <div className="flex flex-col items-center gap-1.5 animate-in zoom-in-75 duration-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-slate-300 uppercase tracking-widest">
                Tổng Số Bước Đi:
              </span>
              <span className="text-4xl font-black text-amber-300 drop-shadow text-glow-gold">
                {sum}
              </span>
            </div>

            {/* Doubles Celebration Banner */}
            {showDoubleAura ? (
              <div className="mt-2 flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 px-4 py-1 text-slate-950 font-black shadow-lg ring-2 ring-yellow-200 animate-bounce">
                <Sparkles className="h-4 w-4 fill-slate-950" />
                <span className="text-xs tracking-wider uppercase">
                  SỐ ĐÔI! ĐƯỢC ĐỔ THÊM LƯỢT!
                </span>
              </div>
            ) : (
              <p className="text-[11px] font-semibold text-sky-200">
                Đang di chuyển {sum} ô trên Đảo Ngọc...
              </p>
            )}
          </div>
        ) : (
          <p className="text-xs font-bold text-amber-200/80 animate-pulse">
            🎲 Xí ngầu đang lăn long lóc...
          </p>
        )}
      </div>
    </div>
  );
}

export default DiceRevealOverlay;

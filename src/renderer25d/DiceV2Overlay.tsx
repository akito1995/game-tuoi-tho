'use client';

import React, { useEffect, useState } from 'react';
import { Sparkles, Dices } from 'lucide-react';

interface DiceFaceProps {
  value: number;
}

/**
 * Mặt xúc xắc phong cách ngà voi truyền thống (Chấm 1 và 4 màu đỏ son)
 */
function IvoryDiceFace({ value }: DiceFaceProps) {
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
    <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-50 via-stone-100 to-amber-100 p-2 shadow-2xl ring-2 ring-amber-500/80 transition-all duration-200">
      {/* Khung viền vát sáng ánh kim */}
      <div className="absolute inset-1 rounded-xl border border-white/90 pointer-events-none" />

      {/* Lưới 3x3 điểm chấm */}
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
                      ? 'h-3.5 w-3.5 sm:h-4 sm:w-4 bg-red-600 ring-1 ring-red-400'
                      : 'h-3 w-3 sm:h-3.5 sm:w-3.5 bg-slate-900'
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
 * Hiệu ứng lăn xoay 3D dứt khoát
 */
function RollingDie({
  finalValue,
  isRolling,
}: {
  finalValue: number;
  isRolling: boolean;
}) {
  const [displayValue, setDisplayValue] = useState(finalValue);
  const [transform, setTransform] = useState<string>('scale(1.0)');

  useEffect(() => {
    if (isRolling) {
      const interval = setInterval(() => {
        setDisplayValue(Math.floor(Math.random() * 6) + 1);
      }, 70);

      const rotX = (Math.random() - 0.5) * 720;
      const rotY = (Math.random() - 0.5) * 720;
      setTransform(`perspective(600px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.15)`);

      const timer = setTimeout(() => {
        clearInterval(interval);
        setDisplayValue(finalValue);
        setTransform('perspective(600px) rotateX(0deg) rotateY(0deg) scale(1.0)');
      }, 650);

      return () => {
        clearInterval(interval);
        clearTimeout(timer);
      };
    } else {
      setDisplayValue(finalValue);
      setTransform('perspective(600px) rotateX(0deg) rotateY(0deg) scale(1.0)');
    }
  }, [isRolling, finalValue]);

  return (
    <div
      style={{
        transform,
        transition: isRolling
          ? 'transform 0.65s cubic-bezier(0.17, 0.67, 0.35, 1.2)'
          : 'transform 0.3s ease-out',
      }}
      className="filter drop-shadow-2xl"
    >
      <IvoryDiceFace value={displayValue} />
    </div>
  );
}

export interface DiceV2OverlayProps {
  dice: [number, number];
  isRolling: boolean;
  isDouble: boolean;
  playerName?: string;
  onClose?: () => void;
}

export function DiceV2Overlay({
  dice,
  isRolling,
  isDouble,
  playerName,
}: DiceV2OverlayProps) {
  const sum = dice[0] + dice[1];

  return (
    <div className="pointer-events-none fixed bottom-28 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center">
      {/* Khay sơn mài đựng xúc xắc */}
      <div className="relative flex flex-col items-center gap-3 rounded-3xl border-2 border-amber-500/50 bg-gradient-to-b from-slate-950/95 via-stone-950/95 to-slate-950/95 px-6 py-4 shadow-2xl shadow-black/80 backdrop-blur-md">
        {/* Banner người đổ */}
        {playerName && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300 uppercase tracking-wider">
            <Dices className="h-4 w-4 text-amber-400" />
            <span>{playerName} đổ xúc xắc</span>
          </div>
        )}

        {/* Cặp xúc xắc */}
        <div className="flex items-center gap-4 sm:gap-6 py-1">
          <RollingDie finalValue={dice[0]} isRolling={isRolling} />
          <RollingDie finalValue={dice[1]} isRolling={isRolling} />
        </div>

        {/* Kết quả tổng & Thưởng đổ đôi */}
        {!isRolling && (
          <div className="flex flex-col items-center gap-1 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-black font-baloo text-amber-300">
                {sum} bước
              </span>
              {isDouble && (
                <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-red-600 to-amber-500 px-2.5 py-0.5 text-xs font-bold text-white shadow-md animate-pulse">
                  <Sparkles className="h-3 w-3" />
                  ĐỔ ĐÔI!
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

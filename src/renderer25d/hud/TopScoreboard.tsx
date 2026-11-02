'use client';

import React from 'react';
import Image from 'next/image';
import { Player } from '../../game/types';

interface TopScoreboardProps {
  players: Player[];
  activePlayer: Player;
  roundCount: number;
  timeLeft?: number; // Countdown seconds (0..15)
  maxTime?: number;
}

const CHARACTER_COLORS: Record<string, { border: string; bg: string; text: string; hex: string }> = {
  'be-ti': { border: 'border-[#E5484D]', bg: 'bg-[#E5484D]', text: 'text-[#E5484D]', hex: '#E5484D' },
  'co-hoa': { border: 'border-[#19B8A6]', bg: 'bg-[#19B8A6]', text: 'text-[#19B8A6]', hex: '#19B8A6' },
  'ong-bay': { border: 'border-[#F5B83D]', bg: 'bg-[#F5B83D]', text: 'text-[#F5B83D]', hex: '#F5B83D' },
  'chi-may': { border: 'border-[#8B6CF0]', bg: 'bg-[#8B6CF0]', text: 'text-[#8B6CF0]', hex: '#8B6CF0' },
};

export const TopScoreboard: React.FC<TopScoreboardProps> = ({
  players,
  activePlayer,
  roundCount,
  timeLeft,
  maxTime = 60,
}) => {
  // Tính chu vi vòng tròn đếm giờ (bán kính r=20)
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const progress = timeLeft !== undefined ? Math.max(0, Math.min(1, timeLeft / maxTime)) : 1;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto select-none max-w-[98vw]">
      <div className="flex items-center gap-1.5 sm:gap-2.5 rounded-2xl bg-slate-950/95 border-2 border-amber-500/40 px-2 sm:px-3 py-1 sm:py-1.5 shadow-2xl backdrop-blur-none">
        {/* Huy hiệu VÒNG x/25 */}
        <div className="flex flex-col items-center justify-center px-2 py-0.5 rounded-xl bg-slate-900 border border-amber-500/60 shadow-inner min-w-[58px] sm:min-w-[68px]">
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-amber-400/90 leading-none">
            VÒNG
          </span>
          <span className="font-baloo text-xs sm:text-sm font-black text-amber-300 leading-tight">
            {roundCount}/25
          </span>
        </div>

        {/* Danh sách 4 người chơi */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {players.map((p) => {
            const isActive = p.id === activePlayer.id && !p.bankrupt;
            const colorTheme = CHARACTER_COLORS[p.character] || {
              border: 'border-amber-400',
              bg: 'bg-amber-400',
              text: 'text-amber-400',
              hex: '#F5B83D',
            };

            return (
              <div
                key={p.id}
                className={`relative flex items-center gap-1 sm:gap-2 rounded-xl transition-all duration-200 ${
                  p.bankrupt
                    ? 'opacity-35 grayscale bg-slate-900/40 p-1 border border-transparent'
                    : isActive
                    ? 'bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-400 px-2 py-1 shadow-[0_0_16px_rgba(245,158,11,0.55)] scale-110 sm:scale-[1.20] z-10'
                    : 'bg-slate-900/60 border border-slate-800/80 px-1.5 py-0.5 hover:border-slate-700'
                }`}
              >
                {/* Avatar tròn với viền màu nhận diện & vòng đếm giờ khi đến lượt */}
                <div className="relative shrink-0 flex items-center justify-center">
                  {isActive && (
                    <svg className="absolute -inset-1.5 h-11 w-11 -rotate-90 pointer-events-none">
                      <circle
                        cx="22"
                        cy="22"
                        r={radius}
                        stroke="#334155"
                        strokeWidth="2.5"
                        fill="transparent"
                      />
                      <circle
                        cx="22"
                        cy="22"
                        r={radius}
                        stroke={colorTheme.hex}
                        strokeWidth="3.2"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        fill="transparent"
                        className="transition-all duration-300"
                      />
                    </svg>
                  )}

                  <div
                    className={`relative rounded-full overflow-hidden border-2 bg-slate-900 shrink-0 ${
                      isActive ? 'h-8 w-8 sm:h-9 sm:w-9 border-amber-300' : 'h-7 w-7 sm:h-8 sm:w-8 ' + colorTheme.border
                    }`}
                  >
                    <Image
                      src={`/art/avatars/${p.character}.png`}
                      alt={p.name}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        (e.target as any).src = '/art/avatars/avatar-1.png';
                      }}
                    />
                  </div>
                </div>

                {/* Tên & Tiền (Thu gọn trên điện thoại chỉ còn avatar + tiền) */}
                <div className="text-left leading-tight pr-0.5">
                  <div className="hidden sm:flex items-center gap-1 text-[11px] font-bold">
                    <span
                      className="h-1.5 w-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: colorTheme.hex }}
                    />
                    <span className={isActive ? 'text-white font-black' : 'text-slate-300 truncate max-w-[65px]'}>
                      {p.name.replace(' 🤖', '')}
                    </span>
                  </div>
                  <div className="font-baloo text-[11px] sm:text-xs font-bold text-amber-300">
                    {p.bankrupt ? (
                      <span className="text-rose-400 font-sans text-[9px] sm:text-[10px]">Phá sản</span>
                    ) : p.inJail ? (
                      <span className="text-amber-400 font-sans text-[9px] sm:text-[10px]">Tù ({p.jailTurns})</span>
                    ) : (
                      // Định dạng tiền đầy đủ "150.000đ" theo chuẩn yêu cầu
                      `${p.money.toLocaleString('vi-VN')}đ`
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

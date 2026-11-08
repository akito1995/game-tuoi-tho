'use client';

import React from 'react';
import Image from 'next/image';
import { Player } from '../../game/types';
import { formatMoney } from '../utils/formatMoney';

interface TopScoreboardProps {
  players: Player[];
  activePlayer: Player;
  roundCount: number;
  piggyBank?: number;
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
  piggyBank = 0,
  timeLeft = 15,
  maxTime = 15,
}) => {
  const isTwoPlayers = players.length === 2;

  // Tính chu vi vòng tròn đếm giờ (bán kính r=22)
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(1, timeLeft / maxTime));
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-30 pointer-events-auto select-none max-w-[96vw]">
      {isTwoPlayers ? (
        /* ================= 2 NGƯỜI CHƠI ================= */
        <div className="flex items-center gap-1.5 sm:gap-2.5 rounded-2xl bg-[#2A170C]/95 border-2 border-[#C9A227]/60 shadow-amber-950/40 px-3 py-1.5 shadow-2xl">
          {/* Khối Đỏ (Player 1) */}
          {(() => {
            const p1 = players[0];
            const isActive = p1.id === activePlayer.id && !p1.bankrupt;
            return (
              <div
                className={`flex items-center gap-2 px-3 py-1 rounded-xl transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-red-600/90 to-rose-700/90 border-2 border-amber-300 shadow-[0_0_12px_rgba(229,72,77,0.5)]'
                    : 'bg-red-950/70 border border-red-800/80 opacity-80'
                }`}
              >
                <div className="relative h-9 w-9 rounded-full overflow-hidden border-2 border-white/80 bg-[#3D2211] shrink-0">
                  <Image
                    src={`/art/avatars/${p1.character}.png`}
                    alt={p1.name}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      (e.target as any).src = '/art/avatars/avatar-1.png';
                    }}
                  />
                </div>
                <div className="text-left leading-tight">
                  <div className="text-xs font-bold text-white flex items-center gap-1">
                    <span>{p1.name}</span>
                    {isActive && <span className="h-2 w-2 rounded-full bg-amber-300 animate-ping" />}
                  </div>
                  <div className="flex items-center gap-1 font-baloo text-sm font-bold text-amber-200">
                    <span>{formatMoney(p1.money)}</span>
                    {p1.inJail && (
                      <span className="inline-flex items-center px-1 py-0.2 rounded bg-rose-500/20 text-rose-300 font-sans text-[9px] border border-rose-400/40 font-bold whitespace-nowrap">
                        🔒 {p1.jailTurns} lượt
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Huy hiệu LƯỢT Ở GIỮA */}
          <div className="flex flex-col items-center justify-center px-2 py-0.5 rounded-xl bg-[#3D2211] border border-amber-500/60 shadow-inner min-w-[70px]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90">
              VÒNG ĐẤU
            </span>
            <span className="font-baloo text-base font-black text-amber-300 leading-tight">
              LƯỢT {roundCount}
            </span>
          </div>

          {/* Quỹ Heo Đất 2 người */}
          {piggyBank > 0 && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-xl bg-amber-500/20 border border-amber-400/50 shadow animate-pulse">
              <span className="text-sm">🐷</span>
              <span className="font-baloo text-xs font-black text-amber-400">{formatMoney(piggyBank)}</span>
            </div>
          )}

          {/* Khối Xanh (Player 2) */}
          {(() => {
            const p2 = players[1];
            const isActive = p2.id === activePlayer.id && !p2.bankrupt;
            return (
              <div
                className={`flex items-center gap-2 px-3 py-1 rounded-xl transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-700/90 to-cyan-600/90 border-2 border-amber-300 shadow-[0_0_12px_rgba(61,90,214,0.5)]'
                    : 'bg-blue-950/70 border border-blue-800/80 opacity-80'
                }`}
              >
                <div className="text-right leading-tight">
                  <div className="text-xs font-bold text-white flex items-center justify-end gap-1">
                    {isActive && <span className="h-2 w-2 rounded-full bg-amber-300 animate-ping" />}
                    <span>{p2.name}</span>
                  </div>
                  <div className="flex items-center justify-end gap-1 font-baloo text-sm font-bold text-cyan-200">
                    {p2.inJail && (
                      <span className="inline-flex items-center px-1 py-0.2 rounded bg-rose-500/20 text-rose-300 font-sans text-[9px] border border-rose-400/40 font-bold whitespace-nowrap">
                        🔒 {p2.jailTurns} lượt
                      </span>
                    )}
                    <span>{formatMoney(p2.money)}</span>
                  </div>
                </div>
                <div className="relative h-9 w-9 rounded-full overflow-hidden border-2 border-white/80 bg-[#3D2211] shrink-0">
                  <Image
                    src={`/art/avatars/${p2.character}.png`}
                    alt={p2.name}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      (e.target as any).src = '/art/avatars/avatar-2.png';
                    }}
                  />
                </div>
              </div>
            );
          })()}
        </div>
      ) : (
        /* ================= 3–4 NGƯỜI CHƠI ================= */
        <div className="flex items-center gap-1 sm:gap-2 rounded-2xl bg-[#2A170C]/95 border-2 border-[#C9A227]/60 shadow-amber-950/40 p-1 sm:p-1.5 shadow-2xl overflow-x-auto max-w-[96vw]">
          {/* Huy hiệu VÒNG / LƯỢT */}
          <div className="flex flex-col items-center justify-center px-2 py-1 rounded-xl bg-[#3D2211] border border-[#C9A227]/60 min-w-[62px]">
            <span className="text-[9px] font-bold uppercase text-[#C9A227]">VÒNG</span>
            <span className="font-baloo text-sm font-black text-[#F3E6C8] leading-none">
              LƯỢT {roundCount}
            </span>
          </div>

          {/* Huy hiệu Quỹ Heo Đất */}
          {piggyBank > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-amber-500/20 border border-amber-400/50 shadow animate-pulse">
              <span className="text-sm">🐷</span>
              <div className="flex flex-col leading-none">
                <span className="text-[8px] text-amber-300 font-bold uppercase">Quỹ Heo</span>
                <span className="font-baloo text-xs font-black text-amber-400">
                  {formatMoney(piggyBank)}₫
                </span>
              </div>
            </div>
          )}

          {/* Dải avatar các người chơi */}
          <div className="flex items-center gap-1.5 sm:gap-2">
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
                  className={`relative flex items-center gap-1.5 rounded-xl transition-all duration-200 ${
                    p.bankrupt
                      ? 'opacity-30 grayscale bg-[#3D2211]/40 p-1'
                      : isActive
                      ? 'bg-[#4A2E1B] border-2 border-[#C9A227] pl-1.5 pr-2.5 py-1 shadow-[0_0_14px_rgba(201,162,39,0.5)] scale-105'
                      : 'bg-[#3D2211]/80 border border-[#6B4226] p-1 hover:border-slate-700'
                  }`}
                >
                  {/* Khung Avatar tròn có viền màu nhận diện & vòng đếm giờ khi đến lượt */}
                  <div className="relative shrink-0 flex items-center justify-center">
                    {/* SVG Circular countdown ring khi đang là lượt của người này */}
                    {isActive && (
                      <svg className="absolute -inset-1 h-11 w-11 -rotate-90 pointer-events-none">
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
                          strokeWidth="3"
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                          strokeLinecap="round"
                          fill="transparent"
                          className="transition-all duration-300"
                        />
                      </svg>
                    )}

                    <div
                      className={`relative rounded-full overflow-hidden border-2 bg-[#3D2211] ${
                        isActive ? 'h-9 w-9 border-amber-300' : 'h-8 w-8 ' + colorTheme.border
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

                  {/* Tên & Tiền */}
                  <div className="text-left leading-tight pr-1">
                    <div className="flex items-center gap-1 text-[11px] font-bold">
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: colorTheme.hex }}
                      />
                      <span className={(isActive ? 'text-white' : 'text-slate-300') + ' truncate max-w-[45px] sm:max-w-none'}>
                        {p.name.replace(' 🤖', '')}
                      </span>
                    </div>
                    <div className="font-baloo text-xs font-bold text-amber-300">
                      {p.bankrupt ? (
                        <span className="text-rose-400 font-sans text-[10px]">Phá sản</span>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span>{formatMoney(p.money)}</span>
                          {p.inJail && (
                            <span className="inline-flex items-center px-1 py-0.2 rounded bg-rose-500/20 text-rose-300 font-sans text-[9px] border border-rose-400/40 font-bold whitespace-nowrap">
                              🔒 {p.jailTurns} lượt
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

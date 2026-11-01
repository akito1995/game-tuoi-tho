'use client';

import React from 'react';
import { Player } from '../game/types';
import { Trophy, RotateCcw, Award } from 'lucide-react';
import Image from 'next/image';

export interface GameOverV2ModalProps {
  winner: Player;
  rounds: number;
  onRestart: () => void;
}

export function GameOverV2Modal({ winner, rounds, onRestart }: GameOverV2ModalProps) {
  let avatarSrc = '/art/characters/be-ti/pose-1.png';
  if (winner.character === 'co-hoa') avatarSrc = '/art/characters/co-hoa/pose-1.png';
  else if (winner.character === 'ong-bay') avatarSrc = '/art/characters/ong-bay/pose-1.png';
  else if (winner.character === 'chi-may') avatarSrc = '/art/characters/chi-may/pose-1.png';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-md rounded-3xl border-2 border-amber-400 bg-gradient-to-b from-amber-950/90 via-slate-950 to-stone-950 p-6 text-center shadow-2xl shadow-amber-500/30">
        {/* Biểu tượng cúp vàng */}
        <div className="mx-auto -mt-12 flex h-20 w-20 items-center justify-center rounded-full border-4 border-amber-400 bg-gradient-to-br from-amber-300 via-amber-500 to-yellow-600 text-slate-950 shadow-xl shadow-amber-500/50">
          <Trophy className="h-10 w-10 animate-bounce" />
        </div>

        <h2 className="mt-4 text-2xl font-black font-baloo text-amber-300 uppercase tracking-wider">
          Vua Địa Ốc Việt Nam!
        </h2>
        <p className="text-xs text-slate-300 mt-1">
          Ván đấu kết thúc sau <span className="font-bold text-amber-400">{rounds} vòng</span> tranh tài sôi nổi!
        </p>

        {/* Chân dung người thắng */}
        <div className="my-5 flex flex-col items-center justify-center">
          <div className="relative h-28 w-28 rounded-2xl border-2 border-amber-400/80 bg-slate-900/90 p-2 shadow-inner">
            <div className="relative h-full w-full">
              <Image
                src={avatarSrc}
                alt={winner.name}
                fill
                className="object-contain"
              />
            </div>
          </div>
          <span className="mt-2 text-lg font-bold font-baloo text-amber-200">
            {winner.name}
          </span>
          <span className="text-xs font-mono font-bold text-emerald-400">
            Tổng tài sản: {winner.money.toLocaleString('vi-VN')}đ
          </span>
        </div>

        {/* Nút chơi lại */}
        <button
          onClick={onRestart}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/30 hover:brightness-110 active:scale-95 transition"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Bắt Đầu Ván Mới</span>
        </button>
      </div>
    </div>
  );
}

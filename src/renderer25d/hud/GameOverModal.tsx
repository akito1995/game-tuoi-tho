'use client';

import React from 'react';
import Image from 'next/image';
import { Player } from '../../game/types';
import { Trophy, RotateCcw, Home, Sparkles, Frown } from 'lucide-react';

interface GameOverModalProps {
  winner: Player | null;
  rounds: number;
  isBankruptMode?: boolean; // Nếu là màn hình thua cuộc/phá sản của người chơi
  onRestart: () => void;
  onBackToLobby: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  winner,
  rounds,
  isBankruptMode = false,
  onRestart,
  onBackToLobby,
}) => {
  // Xác định xem người thắng là ai
  const winnerChar = winner ? winner.character : 'be-ti';
  const winnerPose = `/art/characters/${winnerChar}/pose-4.png`; // Pose 4 là waving / celebration!

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 p-3 sm:p-6 overflow-y-auto select-none pointer-events-auto">
      <div className="relative w-full max-w-2xl rounded-3xl overflow-hidden border-2 border-amber-500/60 shadow-2xl bg-slate-950 my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* ================= BACKGROUND IMAGE ================= */}
        <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-slate-900">
          <Image
            src={isBankruptMode ? '/art/ui/ui-pha-san.png' : '/art/ui/ui-chien-thang.png'}
            alt={isBankruptMode ? 'Phá Sản' : 'Chiến Thắng'}
            fill
            priority
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

          {/* ================= ĐẶT NHÂN VẬT THẮNG LÊN BỤC Ở TƯ THẾ WAVE ================= */}
          {!isBankruptMode && winner && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center">
              {/* Vương miện vàng */}
              <div className="text-2xl animate-bounce mb-1">👑</div>

              {/* Nhân vật đang vẫy tay chào (pose-4.png / wave.png) */}
              <div className="relative h-44 sm:h-52 w-32 sm:w-40 drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]">
                <Image
                  src={winnerPose}
                  alt={winner.name}
                  fill
                  className="object-contain"
                  onError={(e) => {
                    (e.target as any).src = `/art/characters/${winnerChar}/pose-1.png`;
                  }}
                />
              </div>

              {/* Bục vinh quang vàng hoàng kim */}
              <div className="relative -mt-3 px-6 py-1 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 border-2 border-amber-200 shadow-xl">
                <span className="font-baloo text-xs sm:text-sm font-black text-slate-950 tracking-wider uppercase">
                  BỤC VINH QUANG #1
                </span>
              </div>
            </div>
          )}

          {isBankruptMode && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600/30 border-2 border-red-500 text-red-400 mb-2">
                <Frown className="h-9 w-9" />
              </div>
              <h2 className="font-baloo text-2xl sm:text-3xl font-black text-rose-400 tracking-wider uppercase drop-shadow">
                TẠM BIỆT THƯƠNG TRƯỜNG!
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-sm">
                Bạn đã cạn kiệt ngân lượng và không thể hoàn trả tiền thuê đất. Hãy thử lại để phục thù!
              </p>
            </div>
          )}
        </div>

        {/* ================= THÔNG BÁO KẾT QUẢ & THÔNG SỐ ================= */}
        <div className="p-4 sm:p-6 text-center">
          {!isBankruptMode && winner && (
            <>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold mb-2">
                <Sparkles className="h-3.5 w-3.5" />
                <span>VUA ĐỊA ỐC VIỆT NAM</span>
              </div>

              <h2 className="font-baloo text-2xl sm:text-3xl font-black text-amber-400 tracking-wide uppercase drop-shadow">
                CHÚC MỪNG {winner.name}!
              </h2>

              <p className="mt-1 text-xs text-slate-300">
                Đã xuất sắc chinh phục bản đồ Hành trình xuyên Việt và làm chủ các công trình biểu tượng đất nước!
              </p>

              {/* Khối thống kê tài sản */}
              <div className="mt-4 grid grid-cols-2 gap-3 max-w-md mx-auto">
                <div className="rounded-xl bg-slate-900 border border-slate-800 p-2.5">
                  <span className="text-[11px] text-slate-400">Tổng tài sản chung cuộc:</span>
                  <div className="font-baloo text-lg font-black text-emerald-400">
                    {(winner.money / 1000).toLocaleString('vi-VN')}K₫
                  </div>
                </div>

                <div className="rounded-xl bg-slate-900 border border-slate-800 p-2.5">
                  <span className="text-[11px] text-slate-400">Tổng số vòng đấu:</span>
                  <div className="font-baloo text-lg font-black text-amber-400">
                    {rounds} VÒNG
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ================= 2 NÚT HÀNH ĐỘNG (TỐI THIỂU 44px) ================= */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onBackToLobby}
              className="w-full sm:w-auto min-h-[48px] px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Home className="h-4 w-4" />
              <span>VỀ SẢNH CHÍNH</span>
            </button>

            <button
              onClick={onRestart}
              className="w-full sm:w-auto min-h-[48px] px-8 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 hover:brightness-110 active:scale-95 transition text-slate-950 font-baloo text-sm sm:text-base font-black tracking-wider uppercase flex items-center justify-center gap-2 border-2 border-amber-200 shadow-xl shadow-amber-500/30 cursor-pointer"
            >
              <RotateCcw className="h-4 w-4 stroke-[2.5]" />
              <span>CHƠI LẠI VÁN MỚI</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

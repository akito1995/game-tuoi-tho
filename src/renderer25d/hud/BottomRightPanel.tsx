'use client';

import React from 'react';
import Image from 'next/image';
import { Dices, Sparkles, Zap, Bot, CheckCircle } from 'lucide-react';
import { Player } from '../../game/types';

export type SkillType = 'SHORT' | 'LONG' | 'DOUBLE';

interface BottomRightPanelProps {
  activePlayer: Player;
  isMyTurn: boolean;
  isRolling: boolean;
  gamePhase: string;
  onRoll: () => void;
  onUseSkill: (skill: SkillType) => void;
  selectedSkill: SkillType | null;
  skillCharges: {
    short: number;
    long: number;
    double: number;
  };
  isAutoBotMatch: boolean;
}

export const BottomRightPanel: React.FC<BottomRightPanelProps> = ({
  activePlayer,
  isMyTurn,
  isRolling,
  gamePhase,
  onRoll,
  onUseSkill,
  selectedSkill,
  skillCharges,
  isAutoBotMatch,
}) => {
  const canRoll = isMyTurn && !isAutoBotMatch && (gamePhase === 'AWAIT_ROLL' || gamePhase === 'ACTION_COMPLETED') && !isRolling;

  // Xác định nhãn nút Đổ Xúc Xắc theo trạng thái
  let rollButtonLabel = 'ĐỔ XÚC XẮC';
  let rollSubLabel = 'Phím Space';
  let buttonDisabled = !canRoll;

  if (isRolling) {
    rollButtonLabel = 'ĐANG ĐỔ...';
    rollSubLabel = 'Đợi kết quả';
  } else if (gamePhase === 'GAME_OVER') {
    rollButtonLabel = 'KẾT THÚC';
    rollSubLabel = 'Ván đã xong';
  } else if (gamePhase === 'AWAIT_DECISION') {
    rollButtonLabel = 'CHỌN MUA';
    rollSubLabel = 'Xem quyết định';
  } else if (gamePhase === 'CARD_DRAWN') {
    rollButtonLabel = 'XEM THẺ';
    rollSubLabel = 'Cơ hội / Khí vận';
  } else if (!isMyTurn || isAutoBotMatch) {
    rollButtonLabel = 'CHỜ BOT...';
    rollSubLabel = activePlayer.name;
  }

  return (
    <div className="fixed bottom-3 right-3 sm:bottom-4 sm:right-4 z-30 pointer-events-auto select-none">
      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-3 rounded-2xl bg-slate-950/95 border-2 border-amber-500/40 p-2 sm:p-2.5 shadow-2xl">
        {/* ================= 3 THẺ KỸ NĂNG ================= */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Kỹ năng 1: Nhảy 2~4 */}
          <button
            onClick={() => onUseSkill('SHORT')}
            disabled={!canRoll || skillCharges.short <= 0}
            className={`relative flex flex-col items-center justify-between rounded-xl p-1 w-14 h-[72px] sm:w-16 sm:h-[82px] border-2 transition-all cursor-pointer ${
              selectedSkill === 'SHORT'
                ? 'border-amber-300 bg-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.6)] scale-105'
                : skillCharges.short > 0 && canRoll
                ? 'border-amber-500/50 bg-slate-900/90 hover:border-amber-400 hover:bg-slate-800 active:scale-95'
                : 'border-slate-800 bg-slate-950/60 opacity-40 grayscale cursor-not-allowed'
            }`}
            title="Thẻ kỹ năng: Đổ xúc xắc ra tổng 2~4 bước"
            aria-label="Kỹ năng Nhảy 2 đến 4"
          >
            {/* Ảnh nền thẻ skill-nhay-ngan.png với chiều cao cố định */}
            <div className="relative w-full h-10 sm:h-12 overflow-hidden rounded-lg shrink-0 bg-slate-900">
              <Image
                src="/art/ui/skill-nhay-ngan.png"
                alt="Nhảy 2~4"
                fill
                sizes="64px"
                className="object-cover"
                onError={(e) => {
                  (e.target as any).style.display = 'none';
                }}
              />
              {/* Badge số lần còn lại */}
              <div className="absolute top-0.5 right-0.5 px-1 py-0.2 rounded-full bg-slate-950/90 border border-amber-400/80 text-[8px] font-mono font-bold text-amber-300">
                x{skillCharges.short}
              </div>
            </div>
            {/* Chữ do code vẽ theo luật GEMINI.md */}
            <span className="font-baloo text-[10px] sm:text-[11px] font-black text-amber-300 tracking-tight leading-tight mt-0.5 text-center">
              NHẢY 2~4
            </span>
          </button>

          {/* Kỹ năng 2: Nhảy 10~12 */}
          <button
            onClick={() => onUseSkill('LONG')}
            disabled={!canRoll || skillCharges.long <= 0}
            className={`relative flex flex-col items-center justify-between rounded-xl p-1 w-14 h-[72px] sm:w-16 sm:h-[82px] border-2 transition-all cursor-pointer ${
              selectedSkill === 'LONG'
                ? 'border-amber-300 bg-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.6)] scale-105'
                : skillCharges.long > 0 && canRoll
                ? 'border-amber-500/50 bg-slate-900/90 hover:border-amber-400 hover:bg-slate-800 active:scale-95'
                : 'border-slate-800 bg-slate-950/60 opacity-40 grayscale cursor-not-allowed'
            }`}
            title="Thẻ kỹ năng: Đổ xúc xắc ra tổng 10~12 bước"
            aria-label="Kỹ năng Nhảy 10 đến 12"
          >
            {/* Ảnh nền thẻ skill-nhay-xa.png với chiều cao cố định */}
            <div className="relative w-full h-10 sm:h-12 overflow-hidden rounded-lg shrink-0 bg-slate-900">
              <Image
                src="/art/ui/skill-nhay-xa.png"
                alt="Nhảy 10~12"
                fill
                sizes="64px"
                className="object-cover"
                onError={(e) => {
                  (e.target as any).style.display = 'none';
                }}
              />
              <div className="absolute top-0.5 right-0.5 px-1 py-0.2 rounded-full bg-slate-950/90 border border-amber-400/80 text-[8px] font-mono font-bold text-amber-300">
                x{skillCharges.long}
              </div>
            </div>
            <span className="font-baloo text-[10px] sm:text-[11px] font-black text-amber-300 tracking-tight leading-tight mt-0.5 text-center">
              NHẢY 10~12
            </span>
          </button>

          {/* Kỹ năng 3: Đôi x6 */}
          <button
            onClick={() => onUseSkill('DOUBLE')}
            disabled={!canRoll || skillCharges.double <= 0}
            className={`relative flex flex-col items-center justify-between rounded-xl p-1 w-14 h-[72px] sm:w-16 sm:h-[82px] border-2 transition-all cursor-pointer ${
              selectedSkill === 'DOUBLE'
                ? 'border-amber-300 bg-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.6)] scale-105'
                : skillCharges.double > 0 && canRoll
                ? 'border-amber-500/50 bg-slate-900/90 hover:border-amber-400 hover:bg-slate-800 active:scale-95'
                : 'border-slate-800 bg-slate-950/60 opacity-40 grayscale cursor-not-allowed'
            }`}
            title="Thẻ kỹ năng: Đổ xúc xắc đôi 6-6 (12 bước và đi tiếp!)"
            aria-label="Kỹ năng Đôi nhân 6"
          >
            {/* Ảnh nền thẻ skill-doi.png với chiều cao cố định */}
            <div className="relative w-full h-10 sm:h-12 overflow-hidden rounded-lg shrink-0 bg-slate-900">
              <Image
                src="/art/ui/skill-doi.png"
                alt="Đôi x6"
                fill
                sizes="64px"
                className="object-cover"
                onError={(e) => {
                  (e.target as any).style.display = 'none';
                }}
              />
              <div className="absolute top-0.5 right-0.5 px-1 py-0.2 rounded-full bg-slate-950/90 border border-amber-400/80 text-[8px] font-mono font-bold text-amber-300">
                x{skillCharges.double}
              </div>
            </div>
            <span className="font-baloo text-[10px] sm:text-[11px] font-black text-amber-300 tracking-tight leading-tight mt-0.5 text-center">
              ĐÔI ×6
            </span>
          </button>
        </div>

        {/* ================= NÚT TRÒN VÀNG LỚN: ĐỔ XÚC XẮC ================= */}
        <button
          onClick={onRoll}
          disabled={buttonDisabled}
          className={`relative h-[80px] w-[80px] sm:h-[86px] sm:w-[86px] min-h-[44px] min-w-[44px] rounded-full flex flex-col items-center justify-center p-1.5 transition-all duration-200 select-none cursor-pointer ${
            canRoll
              ? 'bg-gradient-to-b from-amber-300 via-amber-500 to-orange-600 border-4 border-amber-200 shadow-[0_0_24px_rgba(245,158,11,0.65)] hover:brightness-110 active:scale-95 ring-4 ring-amber-500/30'
              : isRolling
              ? 'bg-gradient-to-b from-amber-600 to-orange-700 border-4 border-amber-400/60 shadow-lg animate-pulse'
              : 'bg-slate-800 border-4 border-slate-700 opacity-60 cursor-not-allowed'
          }`}
          title={canRoll ? 'Đổ xúc xắc (Nhấn Space)' : rollButtonLabel}
          aria-label={rollButtonLabel}
        >
          {/* Biểu tượng xúc xắc 3D xoay */}
          <Dices
            className={`h-7 w-7 text-slate-950 drop-shadow-sm ${
              isRolling ? 'animate-spin' : canRoll ? 'animate-bounce' : 'opacity-60'
            }`}
          />

          {/* Nhãn chữ chính */}
          <span className="font-baloo text-xs sm:text-[13px] font-black tracking-tight text-slate-950 leading-none mt-0.5 text-center px-1">
            {rollButtonLabel}
          </span>

          {/* Nhãn phụ (Phím tắt hoặc tên bot) */}
          <span className="text-[9px] font-bold text-slate-900/80 leading-none mt-0.5 truncate max-w-[70px]">
            {rollSubLabel}
          </span>
        </button>
      </div>
    </div>
  );
};

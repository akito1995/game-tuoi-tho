'use client';

import React from 'react';
import Image from 'next/image';
import { Dices, Check } from 'lucide-react';
import { Player } from '../../game/types';
import { audioManager } from '../../lib/audio/audioManager';

export type SkillType = 'SHORT' | 'LONG' | 'DOUBLE';

export interface BottomRightPanelProps {
  activePlayer: Player;
  isMyTurn: boolean;
  isRolling: boolean;
  gamePhase: string;
  onRoll: () => void;
  onSelectSkill: (skill: SkillType) => void;
  selectedSkill: SkillType | null;
  skillCharges: {
    short: number;
    long: number;
    double: number;
  };
  isAutoBotMatch: boolean;
  lastRoll?: {
    dice: [number, number];
    isDouble: boolean;
    sum: number;
  } | null;
}

export const BottomRightPanel: React.FC<BottomRightPanelProps> = ({
  activePlayer,
  isMyTurn,
  isRolling,
  gamePhase,
  onRoll,
  onSelectSkill,
  selectedSkill,
  skillCharges,
  isAutoBotMatch,
  lastRoll,
}) => {
  const isInteractiveBlocked =
    gamePhase === 'AWAIT_DECISION' ||
    gamePhase === 'CARD_DRAWN' ||
    gamePhase === 'AWAIT_TAKEOVER' ||
    gamePhase === 'DEBT_RELIEF';

  const canRoll =
    isMyTurn &&
    !isAutoBotMatch &&
    !isInteractiveBlocked &&
    (gamePhase === 'AWAIT_ROLL' || gamePhase === 'ACTION_COMPLETED') &&
    !isRolling;

  // Xác định nhãn nút Đổ Xúc Xắc theo trạng thái
  let rollButtonLabel = 'ĐỔ XÚC XẮC';
  let rollSubLabel = 'Phím Space';
  let buttonDisabled = !canRoll || isInteractiveBlocked;

  if (isRolling) {
    rollButtonLabel = 'ĐANG ĐỔ...';
    rollSubLabel = 'Đợi kết quả';
  } else if (gamePhase === 'GAME_OVER') {
    rollButtonLabel = 'KẾT THÚC';
    rollSubLabel = 'Ván đã xong';
  } else if (gamePhase === 'AWAIT_DECISION') {
    rollButtonLabel = 'CHỌN MUA';
    rollSubLabel = 'Đang mở popup';
    buttonDisabled = true;
  } else if (gamePhase === 'CARD_DRAWN') {
    rollButtonLabel = 'XEM THẺ';
    rollSubLabel = 'Đang mở thẻ';
    buttonDisabled = true;
  } else if (gamePhase === 'AWAIT_TAKEOVER') {
    rollButtonLabel = 'MUA LẠI';
    rollSubLabel = 'Đang mở popup';
    buttonDisabled = true;
  } else if (gamePhase === 'DEBT_RELIEF') {
    rollButtonLabel = 'CỨU VIỆN';
    rollSubLabel = 'Đang cơ cấu nợ';
    buttonDisabled = true;
  } else if (selectedSkill) {
    rollButtonLabel = selectedSkill === 'SHORT' ? 'NHẢY 2~4' : selectedSkill === 'LONG' ? 'NHẢY 10~12' : 'ĐÔI ×6';
    rollSubLabel = 'Kỹ năng đã chọn';
  } else if (!isMyTurn || isAutoBotMatch) {
    rollButtonLabel = 'CHỜ BOT...';
    rollSubLabel = activePlayer.name;
  }

  const renderSkillButton = (
    skill: SkillType,
    title: string,
    imgSrc: string,
    chargeCount: number
  ) => {
    const isSelected = selectedSkill === skill;
    const isSkillDisabled = !canRoll || isInteractiveBlocked || chargeCount <= 0;

    return (
      <button
        key={skill}
        type="button"
        disabled={isSkillDisabled}
        onClick={() => {
          if (!isSkillDisabled) {
            onSelectSkill(skill);
          }
        }}
        className={`relative flex flex-col items-center justify-between rounded-xl p-1 w-14 h-[76px] sm:w-16 sm:h-[84px] border-2 transition-all select-none ${
          isSelected
            ? 'border-amber-300 bg-amber-500/25 ring-4 ring-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.85)] scale-105 cursor-pointer z-10'
            : !isSkillDisabled
            ? 'border-amber-500/50 bg-slate-900/90 hover:border-amber-400 hover:bg-slate-800 active:scale-95 cursor-pointer shadow-md'
            : 'border-slate-800 bg-slate-950/60 opacity-40 grayscale cursor-not-allowed pointer-events-none'
        }`}
        title={
          isInteractiveBlocked
            ? 'Đang mở hộp thoại tương tác'
            : isSelected
            ? `Đang chọn: ${title}. Bấm lần nữa để bỏ chọn.`
            : `Thẻ kỹ năng: ${title} (còn ${chargeCount} lần)`
        }
        aria-label={`Kỹ năng ${title}`}
      >
        {/* Nhãn "Đã chọn" nổi bật khi được kích hoạt */}
        {isSelected && (
          <div className="absolute -top-2 inset-x-0 mx-auto w-fit flex items-center gap-0.5 px-1 py-0.2 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 font-black text-[8px] uppercase tracking-wider shadow-md animate-pulse">
            <Check className="h-2.5 w-2.5 stroke-[3]" />
            <span>Đã chọn</span>
          </div>
        )}

        {/* Khung ảnh thẻ kỹ năng */}
        <div className="relative w-full h-10 sm:h-12 overflow-hidden rounded-lg shrink-0 bg-slate-900 mt-0.5">
          <Image
            src={imgSrc}
            alt={title}
            fill
            sizes="64px"
            className="object-cover"
            onError={(e) => {
              (e.target as any).style.display = 'none';
            }}
          />
          {/* Badge số lần sử dụng còn lại */}
          <div className="absolute top-0.5 right-0.5 px-1 py-0.2 rounded-full bg-slate-950/90 border border-amber-400/80 text-[8px] font-mono font-bold text-amber-300">
            x{chargeCount}
          </div>
        </div>

        {/* Nhãn tên kỹ năng */}
        <span className={`font-baloo text-[9px] sm:text-[10px] font-black tracking-tight leading-tight mt-0.5 text-center ${
          isSelected ? 'text-amber-200 drop-shadow' : 'text-amber-300'
        }`}>
          {title}
        </span>
      </button>
    );
  };

  return (
    <div className="fixed bottom-3 right-3 sm:bottom-4 sm:right-4 z-30 pointer-events-auto select-none flex flex-col items-end gap-1.5">
      {/* Chỉ báo xúc xắc mới nhất (Đồng bộ tức thì từ bàn cờ, không bao giờ bị trễ) */}
      {lastRoll && (
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/95 border border-amber-500/60 shadow-xl backdrop-blur-sm animate-in fade-in slide-in-from-bottom-1 duration-150">
          <Dices className="h-3.5 w-3.5 text-amber-400" />
          <span className="font-mono text-xs font-black text-amber-300">
            {lastRoll.dice[0]} + {lastRoll.dice[1]} = {lastRoll.sum}
          </span>
          {lastRoll.isDouble && (
            <span className="text-[9px] font-black uppercase text-white bg-rose-600 px-1.5 py-0.2 rounded-full shadow-sm animate-pulse">
              ĐÔI
            </span>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-3 rounded-2xl bg-slate-950/95 border-2 border-amber-500/40 p-2 sm:p-2.5 shadow-2xl">
        {/* ================= 3 THẺ KỸ NĂNG XÚC XẮC ================= */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {renderSkillButton('SHORT', 'NHẢY 2~4', '/art/ui/skill-nhay-ngan.png', skillCharges.short)}
          {renderSkillButton('LONG', 'NHẢY 10~12', '/art/ui/skill-nhay-xa.png', skillCharges.long)}
          {renderSkillButton('DOUBLE', 'ĐÔI ×6', '/art/ui/skill-doi.png', skillCharges.double)}
        </div>

        {/* ================= NÚT TRÒN VÀNG LỚN: ĐỔ XÚC XẮC ================= */}
        <button
          onPointerDown={() => {
            audioManager.unlockAudio();
          }}
          onClick={() => {
            audioManager.unlockAudio();
            if (!buttonDisabled && canRoll) onRoll();
          }}
          disabled={buttonDisabled}
          className={`relative h-[80px] w-[80px] sm:h-[86px] sm:w-[86px] min-h-[44px] min-w-[44px] rounded-full flex flex-col items-center justify-center p-1.5 transition-all duration-200 select-none ${
            canRoll
              ? selectedSkill
                ? 'bg-gradient-to-b from-amber-200 via-amber-400 to-yellow-600 border-4 border-white shadow-[0_0_32px_rgba(250,204,21,0.9)] hover:brightness-110 active:scale-95 ring-4 ring-amber-400 cursor-pointer animate-pulse'
                : 'bg-gradient-to-b from-amber-300 via-amber-500 to-orange-600 border-4 border-amber-200 shadow-[0_0_28px_rgba(245,158,11,0.7)] hover:brightness-110 active:scale-95 ring-4 ring-amber-500/30 cursor-pointer'
              : isRolling
              ? 'bg-gradient-to-b from-amber-600 to-orange-700 border-4 border-amber-400/60 shadow-lg animate-pulse cursor-wait'
              : isInteractiveBlocked
              ? 'bg-slate-900 border-4 border-slate-700 opacity-40 grayscale pointer-events-none cursor-not-allowed shadow-none'
              : 'bg-slate-800 border-4 border-slate-700 opacity-60 cursor-not-allowed'
          }`}
          title={
            isInteractiveBlocked
              ? 'Vui lòng đưa ra quyết định trên bảng trước khi tiếp tục'
              : canRoll
              ? selectedSkill
                ? `Đổ với kỹ năng ${selectedSkill === 'SHORT' ? 'Nhảy 2~4' : selectedSkill === 'LONG' ? 'Nhảy 10~12' : 'Đôi ×6'}`
                : 'Đổ xúc xắc (Nhấn Space)'
              : rollButtonLabel
          }
          aria-label={rollButtonLabel}
        >
          {/* Biểu tượng xúc xắc 3D */}
          <Dices
            className={`h-7 w-7 text-slate-950 drop-shadow-sm ${
              isRolling ? 'animate-spin' : canRoll ? 'animate-bounce' : 'opacity-60'
            }`}
          />

          {/* Nhãn chữ chính */}
          <span className="font-baloo text-xs sm:text-[13px] font-black tracking-tight text-slate-950 leading-tight mt-0.5 text-center px-1">
            {rollButtonLabel}
          </span>

          {/* Nhãn phụ (Phím tắt hoặc tên bot) */}
          <span className="text-[9px] font-bold text-slate-900/80 leading-none mt-0.5 truncate max-w-[72px]">
            {rollSubLabel}
          </span>
        </button>
      </div>
    </div>
  );
};

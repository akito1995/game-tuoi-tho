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
  skillCharges?: {
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
  onPayBail?: () => void;
  onUseJailFreeCard?: () => void;
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
  onPayBail,
  onUseJailFreeCard,
}) => {
  // Đọc số lượng thẻ kỹ năng trực tiếp từ activePlayer.skillCards (Single Source of Truth)
  const actualCharges = {
    short: activePlayer.skillCards ? activePlayer.skillCards.filter((s) => s === 'SHORT').length : 0,
    long: activePlayer.skillCards ? activePlayer.skillCards.filter((s) => s === 'LONG').length : 0,
    double: activePlayer.skillCards ? activePlayer.skillCards.filter((s) => s === 'DOUBLE').length : 0,
  };

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
    const isDoubleInJail = skill === 'DOUBLE' && activePlayer.inJail;
    const isSkillDisabled = !canRoll || isInteractiveBlocked || chargeCount <= 0 || isDoubleInJail;

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
            ? 'border-amber-500/50 bg-[#3D2211]/90 hover:border-amber-400 hover:bg-slate-800 active:scale-95 cursor-pointer shadow-md'
            : 'border-slate-800 bg-slate-950/60 opacity-40 grayscale cursor-not-allowed pointer-events-none'
        }`}
        title={
          isDoubleInJail
            ? 'Không thể dùng thẻ ĐÔI ×6 khi đang ở trong tù'
            : isInteractiveBlocked
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
        <div className="relative w-full h-10 sm:h-12 overflow-hidden rounded-lg shrink-0 bg-[#3D2211] mt-0.5">
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
          <div className="absolute top-0.5 right-0.5 px-1 py-0.2 rounded-full bg-slate-950/90 border border-amber-400/80 text-[8px] font-mono font-bold text-[#F3E6C8]">
            x{chargeCount}
          </div>
        </div>

        {/* Nhãn tên kỹ năng */}
        <span className={`font-baloo text-[9px] sm:text-[10px] font-black tracking-tight leading-tight mt-0.5 text-center whitespace-nowrap px-0.5 ${
          isSelected ? 'text-amber-200 drop-shadow' : 'text-amber-300'
        }`}>
          {title}
        </span>
      </button>
    );
  };

  return (
    <div className="fixed bottom-3 right-3 sm:bottom-4 sm:right-4 z-30 pointer-events-auto select-none flex flex-col items-end gap-1.5">
      {/* Panel 3 lựa chọn Ra Tù (P0 - Mục 3) */}
      {activePlayer.inJail && isMyTurn && !isAutoBotMatch && (
        <div className="w-full max-w-xs sm:max-w-sm rounded-2xl bg-gradient-to-r from-red-950/95 via-[#2A170C]/95 to-slate-900/95 border-2 border-red-500/70 p-2.5 sm:p-3 shadow-2xl flex flex-col gap-2 animate-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-base">⚖️</span>
              <span className="font-baloo text-xs font-black text-amber-300 uppercase tracking-wide">
                BẠN ĐANG Ở TRẠI GIAM
              </span>
            </div>
            <span className="text-[10px] font-bold text-red-300 bg-red-950/80 px-2 py-0.5 rounded-full border border-red-500/40">
              Lượt {activePlayer.jailTurns ? 4 - activePlayer.jailTurns : 1}/3
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
            {/* Lựa chọn 1: Đổ đôi */}
            <button
              onClick={() => {
                audioManager.unlockAudio();
                if (!isRolling) onRoll();
              }}
              disabled={isRolling}
              className="flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-baloo font-bold text-xs shadow-md transition active:scale-95 cursor-pointer disabled:opacity-40 min-h-[44px]"
              title="Thử vận may đổ đôi để ra tù miễn phí"
            >
              <Dices className="h-3.5 w-3.5" />
              <span>Đổ Đôi</span>
            </button>

            {/* Lựa chọn 2: Nộp 50.000đ */}
            <button
              onClick={() => {
                audioManager.unlockAudio();
                if (onPayBail && activePlayer.money >= 50_000 && !isRolling) onPayBail();
              }}
              disabled={activePlayer.money < 50_000 || isRolling}
              className="flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-baloo font-bold text-xs shadow-md transition active:scale-95 cursor-pointer min-h-[44px]"
              title={activePlayer.money < 50_000 ? 'Không đủ 50.000đ để nộp phạt' : 'Nộp 50.000đ để ra tù ngay lập tức'}
            >
              <span>💰 Nộp 50K</span>
            </button>

            {/* Lựa chọn 3: Dùng Thẻ Miễn Phạt (chỉ hiện khi có thẻ) */}
            {(activePlayer.jailFreeCards ?? 0) > 0 && (
              <button
                onClick={() => {
                  audioManager.unlockAudio();
                  if (onUseJailFreeCard && !isRolling) onUseJailFreeCard();
                }}
                disabled={isRolling}
                className="flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-baloo font-bold text-xs shadow-md transition active:scale-95 cursor-pointer min-h-[44px]"
                title={`Sử dụng thẻ Miễn Phạt Tù (bạn đang có ${activePlayer.jailFreeCards} thẻ)`}
              >
                <span>🛡️ Dùng Thẻ ({activePlayer.jailFreeCards})</span>
              </button>
            )}
          </div>
        </div>
      )}
      {/* Chỉ báo xúc xắc mới nhất (Đồng bộ tức thì từ bàn cờ, không bao giờ bị trễ) */}
      {lastRoll && (
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2A170C]/95 border border-[#C9A227]/70 shadow-xl animate-in fade-in slide-in-from-bottom-1 duration-150">
          <Dices className="h-3.5 w-3.5 text-amber-400" />
          <span className="font-mono text-xs font-black text-[#F3E6C8]">
            {lastRoll.dice[0]} + {lastRoll.dice[1]} = {lastRoll.sum}
          </span>
          {lastRoll.isDouble && (
            <span className="text-[9px] font-black uppercase text-white bg-rose-600 px-1.5 py-0.2 rounded-full shadow-sm animate-pulse">
              ĐÔI
            </span>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-3 rounded-2xl bg-[#2A170C]/95 border-2 border-[#C9A227]/60 p-2 sm:p-2.5 shadow-2xl shadow-amber-950/40">
        {/* ================= 3 THẺ KỸ NĂNG XÚC XẮC ================= */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {renderSkillButton('SHORT', 'NHẢY 2~4', '/art/ui/skill-nhay-ngan.webp', actualCharges.short)}
          {renderSkillButton('LONG', 'NHẢY 10~12', '/art/ui/skill-nhay-xa.webp', actualCharges.long)}
          {renderSkillButton('DOUBLE', 'ĐÔI ×6', '/art/ui/skill-doi.webp', actualCharges.double)}
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
              ? 'bg-[#3D2211] border-4 border-slate-700 opacity-40 grayscale pointer-events-none cursor-not-allowed shadow-none'
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
          <span className="font-baloo text-xs sm:text-[13px] font-black tracking-tight text-slate-950 leading-tight mt-0.5 text-center px-1 line-clamp-2 max-w-[80px] break-words">
            {rollButtonLabel}
          </span>

          {/* Nhãn phụ (Phím tắt hoặc tên bot) */}
          <span className="text-[9px] font-bold text-slate-900/90 leading-none mt-0.5 whitespace-nowrap px-1">
            {rollSubLabel}
          </span>
        </button>
      </div>
    </div>
  );
};

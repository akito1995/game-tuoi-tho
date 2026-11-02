'use client';

import React from 'react';
import Image from 'next/image';
import { Dices, Sparkles } from 'lucide-react';
import { Player } from '../../game/types';

export type SkillType = 'SHORT' | 'LONG' | 'DOUBLE';

interface BottomRightPanelProps {
  activePlayer: Player;
  isMyTurn: boolean;
  isRolling: boolean;
  isMoving?: boolean;
  canRollAgain?: boolean;
  lastDice?: [number, number] | null;
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
  isMoving = false,
  canRollAgain = false,
  lastDice = null,
  gamePhase,
  onRoll,
  onUseSkill,
  selectedSkill,
  skillCharges,
  isAutoBotMatch,
}) => {
  const canRoll =
    isMyTurn &&
    !isAutoBotMatch &&
    (gamePhase === 'AWAIT_ROLL' || gamePhase === 'ACTION_COMPLETED' || canRollAgain) &&
    !isRolling &&
    !isMoving;

  const isBotActing = !isMyTurn || isAutoBotMatch || Boolean(activePlayer?.isBot);

  // Xác định nhãn nút và trạng thái
  let rollButtonLabel = 'Đổ xúc xắc';
  let buttonDisabled = !canRoll;

  if (isBotActing) {
    const rawName = activePlayer?.name ? activePlayer.name.replace(' 🤖', '') : 'Đối thủ';
    rollButtonLabel = `Lượt của ${rawName}`;
    buttonDisabled = true;
  } else if (isRolling || isMoving) {
    rollButtonLabel = 'Đang đi...';
    buttonDisabled = true;
  } else if (canRollAgain && isMyTurn) {
    rollButtonLabel = 'Đổ tiếp (đôi)';
    buttonDisabled = false;
  }

  return (
    <div className="fixed bottom-4 right-4 z-30 pointer-events-auto select-none flex flex-col items-end gap-2">
      {/* ================= KHỐI PHÍA TRÊN: KẾT QUẢ XÚC XẮC & HÀNG THẺ KỸ NĂNG ================= */}
      <div className="flex flex-col items-end gap-1.5">
        {/* Kết quả xúc xắc gần nhất (nếu có) */}
        {lastDice && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950/90 border border-amber-500/50 shadow-lg text-xs font-bold text-amber-300 animate-in fade-in zoom-in-95">
            <Dices className="h-4 w-4 text-amber-400" />
            <span className="font-mono">{lastDice[0]} + {lastDice[1]} = {lastDice[0] + lastDice[1]}</span>
            {lastDice[0] === lastDice[1] && (
              <span className="px-1 py-0.2 rounded bg-amber-500 text-slate-950 text-[10px] font-black">
                ĐÔI
              </span>
            )}
          </div>
        )}

        {/* Hàng thẻ kỹ năng đang giữ (tối đa 3) */}
        <div className="flex items-center gap-1.5 bg-slate-950/90 border border-amber-500/40 rounded-2xl p-1 shadow-xl">
          {/* Kỹ năng 1: Nhảy 2~4 */}
          <button
            onClick={() => onUseSkill('SHORT')}
            disabled={!canRoll || skillCharges.short <= 0}
            className={`relative flex flex-col items-center justify-between rounded-xl p-1 w-13 h-[68px] sm:w-14 sm:h-[72px] border transition-all cursor-pointer ${
              selectedSkill === 'SHORT'
                ? 'border-amber-300 bg-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.6)] scale-105'
                : skillCharges.short > 0 && canRoll
                ? 'border-amber-500/50 bg-slate-900/90 hover:border-amber-300 hover:bg-slate-800 active:scale-95'
                : 'border-slate-800 bg-slate-950/60 opacity-35 grayscale cursor-not-allowed'
            }`}
            title="Thẻ kỹ năng: Đổ xúc xắc ra tổng 2~4 bước"
            aria-label="Kỹ năng Nhảy 2 đến 4"
          >
            <div className="relative w-full h-9 sm:h-10 overflow-hidden rounded-lg shrink-0 bg-slate-900">
              <Image
                src="/art/ui/skill-nhay-ngan.png"
                alt="Nhảy 2~4"
                fill
                sizes="56px"
                className="object-cover"
                onError={(e) => {
                  (e.target as any).style.display = 'none';
                }}
              />
              <div className="absolute top-0.5 right-0.5 px-1 py-0.2 rounded-full bg-slate-950/90 border border-amber-400 text-[8px] font-mono font-bold text-amber-300">
                x{skillCharges.short}
              </div>
            </div>
            <span className="font-baloo text-[9px] sm:text-[10px] font-black text-amber-300 leading-tight mt-0.5 text-center">
              NHẢY 2~4
            </span>
          </button>

          {/* Kỹ năng 2: Nhảy 10~12 */}
          <button
            onClick={() => onUseSkill('LONG')}
            disabled={!canRoll || skillCharges.long <= 0}
            className={`relative flex flex-col items-center justify-between rounded-xl p-1 w-13 h-[68px] sm:w-14 sm:h-[72px] border transition-all cursor-pointer ${
              selectedSkill === 'LONG'
                ? 'border-amber-300 bg-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.6)] scale-105'
                : skillCharges.long > 0 && canRoll
                ? 'border-amber-500/50 bg-slate-900/90 hover:border-amber-300 hover:bg-slate-800 active:scale-95'
                : 'border-slate-800 bg-slate-950/60 opacity-35 grayscale cursor-not-allowed'
            }`}
            title="Thẻ kỹ năng: Đổ xúc xắc ra tổng 10~12 bước"
            aria-label="Kỹ năng Nhảy 10 đến 12"
          >
            <div className="relative w-full h-9 sm:h-10 overflow-hidden rounded-lg shrink-0 bg-slate-900">
              <Image
                src="/art/ui/skill-nhay-xa.png"
                alt="Nhảy 10~12"
                fill
                sizes="56px"
                className="object-cover"
                onError={(e) => {
                  (e.target as any).style.display = 'none';
                }}
              />
              <div className="absolute top-0.5 right-0.5 px-1 py-0.2 rounded-full bg-slate-950/90 border border-amber-400 text-[8px] font-mono font-bold text-amber-300">
                x{skillCharges.long}
              </div>
            </div>
            <span className="font-baloo text-[9px] sm:text-[10px] font-black text-amber-300 leading-tight mt-0.5 text-center">
              NHẢY 10~12
            </span>
          </button>

          {/* Kỹ năng 3: Đôi x6 */}
          <button
            onClick={() => onUseSkill('DOUBLE')}
            disabled={!canRoll || skillCharges.double <= 0}
            className={`relative flex flex-col items-center justify-between rounded-xl p-1 w-13 h-[68px] sm:w-14 sm:h-[72px] border transition-all cursor-pointer ${
              selectedSkill === 'DOUBLE'
                ? 'border-amber-300 bg-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.6)] scale-105'
                : skillCharges.double > 0 && canRoll
                ? 'border-amber-500/50 bg-slate-900/90 hover:border-amber-300 hover:bg-slate-800 active:scale-95'
                : 'border-slate-800 bg-slate-950/60 opacity-35 grayscale cursor-not-allowed'
            }`}
            title="Thẻ kỹ năng: Đổ xúc xắc đôi 6-6 (12 bước và đi tiếp!)"
            aria-label="Kỹ năng Đôi nhân 6"
          >
            <div className="relative w-full h-9 sm:h-10 overflow-hidden rounded-lg shrink-0 bg-slate-900">
              <Image
                src="/art/ui/skill-doi.png"
                alt="Đôi x6"
                fill
                sizes="56px"
                className="object-cover"
                onError={(e) => {
                  (e.target as any).style.display = 'none';
                }}
              />
              <div className="absolute top-0.5 right-0.5 px-1 py-0.2 rounded-full bg-slate-950/90 border border-amber-400 text-[8px] font-mono font-bold text-amber-300">
                x{skillCharges.double}
              </div>
            </div>
            <span className="font-baloo text-[9px] sm:text-[10px] font-black text-amber-300 leading-tight mt-0.5 text-center">
              ĐÔI ×6
            </span>
          </button>
        </div>
      </div>

      {/* ================= NÚT TRÒN VÀNG LỚN 96px "ĐỔ XÚC XẮC" ================= */}
      <button
        onClick={onRoll}
        disabled={buttonDisabled}
        className={`relative h-24 w-24 min-h-[96px] min-w-[96px] rounded-full flex flex-col items-center justify-center p-2 transition-all duration-200 select-none cursor-pointer ${
          canRoll
            ? 'bg-gradient-to-b from-amber-300 via-amber-400 to-amber-500 border-4 border-amber-100 shadow-[0_0_35px_rgba(245,158,11,0.85)] hover:brightness-110 active:scale-95 ring-4 ring-amber-400/50 animate-bounce'
            : isRolling || isMoving
            ? 'bg-gradient-to-b from-amber-500 to-orange-600 border-4 border-amber-300/80 shadow-lg animate-pulse'
            : 'bg-slate-800 border-4 border-slate-700 opacity-60 cursor-not-allowed'
        }`}
        title={canRoll ? `${rollButtonLabel} (Phím Space)` : rollButtonLabel}
        aria-label={rollButtonLabel}
      >
        <Dices
          className={`h-8 w-8 text-amber-950 drop-shadow-sm ${
            isRolling || isMoving ? 'animate-spin' : canRoll ? 'scale-110' : 'opacity-60 text-slate-400'
          }`}
        />
        <span className={`font-baloo font-black uppercase tracking-tight leading-tight mt-1 text-center px-1 ${
          canRoll ? 'text-amber-950 text-[12px]' : 'text-slate-300 text-[10px]'
        }`}>
          {rollButtonLabel}
        </span>
      </button>
    </div>
  );
};

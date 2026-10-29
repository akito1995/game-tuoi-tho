'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/lib/game-engine/gameStore';
import { Shield, Zap, Sparkles, Check } from 'lucide-react';

export function TacticalSkillBar() {
  const activePlayerIndex = useGameStore((s) => s.activePlayerIndex);
  const players = useGameStore((s) => s.players);
  const gamePhase = useGameStore((s) => s.gamePhase);
  const useEvenOddCard = useGameStore((s) => s.useEvenOddCard);
  const useRentShield = useGameStore((s) => s.useRentShield);
  const useDoubleStep = useGameStore((s) => s.useDoubleStep);

  const activePlayer = players[activePlayerIndex];
  const isHumanTurn = activePlayer && !activePlayer.isBot && (gamePhase === 'WAITING' || gamePhase === 'AWAIT_ROLL');

  const [showEvenOddSelect, setShowEvenOddSelect] = useState(false);

  if (!activePlayer) return null;

  const inventory = activePlayer.tacticalCards || { evenOdd: 0, rentShield: 0, doubleStep: 0 };
  const hasShieldActive = activePlayer.hasActiveShield;
  const activeModifier = activePlayer.activeDiceModifier;

  return (
    <div className="relative mb-2 flex flex-col items-end gap-1.5 pointer-events-auto">
      {/* Even/Odd Selector Mini-Menu */}
      {showEvenOddSelect && isHumanTurn && (
        <div className="flex items-center gap-1.5 rounded-2xl bg-slate-900/90 border border-amber-400/50 p-1.5 shadow-2xl backdrop-blur-xl animate-in zoom-in-95">
          <span className="text-[10px] font-bold text-amber-300 px-1">Chọn:</span>
          <button
            onClick={() => {
              useEvenOddCard('EVEN');
              setShowEvenOddSelect(false);
            }}
            className="rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 px-2.5 py-1 text-[11px] font-black text-slate-950 shadow hover:brightness-110 active:scale-95"
          >
            Số CHẴN (2,4,6...)
          </button>
          <button
            onClick={() => {
              useEvenOddCard('ODD');
              setShowEvenOddSelect(false);
            }}
            className="rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 px-2.5 py-1 text-[11px] font-black text-slate-950 shadow hover:brightness-110 active:scale-95"
          >
            Số LẺ (3,5,7...)
          </button>
          <button
            onClick={() => setShowEvenOddSelect(false)}
            className="rounded-xl bg-slate-800 px-2 py-1 text-[11px] font-bold text-slate-400 hover:text-white"
          >
            Hủy
          </button>
        </div>
      )}

      {/* Badges Bar */}
      <div className="flex items-center gap-1.5">
        {/* Even/Odd Dice Card */}
        <button
          disabled={!isHumanTurn || (inventory.evenOdd || 0) <= 0 || Boolean(activeModifier)}
          onClick={() => setShowEvenOddSelect(!showEvenOddSelect)}
          className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold transition-all shadow-md border ${
            activeModifier
              ? 'bg-amber-500 text-slate-950 border-yellow-300 ring-2 ring-yellow-400 animate-pulse'
              : (inventory.evenOdd || 0) > 0 && isHumanTurn
              ? 'bg-slate-900/80 text-amber-300 border-amber-400/40 hover:bg-slate-850 hover:border-amber-400 active:scale-95'
              : 'bg-slate-900/40 text-slate-500 border-white/5 opacity-60'
          }`}
          title="Thẻ Xúc Xắc Chẵn/Lẻ: Chọn trước tổng số đổ ra Chẵn hoặc Lẻ"
        >
          <Sparkles className="h-3 w-3" />
          <span>
            {activeModifier ? `Đã chọn ${activeModifier === 'EVEN' ? 'CHẴN' : 'LẺ'}` : `Chẵn/Lẻ (${inventory.evenOdd || 0})`}
          </span>
        </button>

        {/* Rent Shield Card */}
        <button
          disabled={!isHumanTurn || (inventory.rentShield || 0) <= 0 || hasShieldActive}
          onClick={() => useRentShield()}
          className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold transition-all shadow-md border ${
            hasShieldActive
              ? 'bg-blue-600 text-white border-cyan-300 ring-2 ring-cyan-400 animate-pulse'
              : (inventory.rentShield || 0) > 0 && isHumanTurn
              ? 'bg-slate-900/80 text-cyan-300 border-cyan-400/40 hover:bg-slate-850 hover:border-cyan-400 active:scale-95'
              : 'bg-slate-900/40 text-slate-500 border-white/5 opacity-60'
          }`}
          title="Khiên Bảo Hộ: Miễn phí 1 lần trả tiền thuê nhà cho đối thủ"
        >
          <Shield className="h-3 w-3" />
          <span>{hasShieldActive ? 'Khiên BẬT' : `Khiên (${inventory.rentShield || 0})`}</span>
        </button>

        {/* Double Step Card */}
        <button
          disabled={!isHumanTurn || (inventory.doubleStep || 0) <= 0}
          onClick={() => useDoubleStep()}
          className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold transition-all shadow-md border ${
            (inventory.doubleStep || 0) > 0 && isHumanTurn
              ? 'bg-slate-900/80 text-purple-300 border-purple-400/40 hover:bg-slate-850 hover:border-purple-400 active:scale-95'
              : 'bg-slate-900/40 text-slate-500 border-white/5 opacity-60'
          }`}
          title="Thẻ Tăng Tốc: Cộng ngay +2 bước di chuyển"
        >
          <Zap className="h-3 w-3" />
          <span>+2 Bước ({inventory.doubleStep || 0})</span>
        </button>
      </div>
    </div>
  );
}

export default TacticalSkillBar;

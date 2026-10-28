'use client';

import React from 'react';
import { Dices, ArrowRight, Sparkles, Lock, Key } from 'lucide-react';
import { useGameStore } from '@/lib/game-engine/gameStore';
import { soundManager } from '@/lib/audio/soundManager';
import { canPlayerRoll, canPlayerEndTurn, formatMoney } from './hudHelpers';

export interface DiceControlPanelProps {
  className?: string;
}

/**
 * Visual Die Face rendering 1 to 6 pips
 */
function DieFace({ value }: { value: number }) {
  const clamped = Math.max(1, Math.min(6, value || 1));

  // Pip positions for a 3x3 grid
  const pipMap: Record<number, number[]> = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8],
  };

  const activePips = pipMap[clamped] || [4];

  return (
    <div className="relative flex h-12 w-12 items-center justify-center rounded-xl border-2 border-amber-200/50 bg-gradient-to-b from-white to-amber-50 shadow-md shadow-black/30">
      <div className="grid h-8 w-8 grid-cols-3 grid-rows-3 gap-0.5 p-0.5">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((idx) => (
          <div key={idx} className="flex items-center justify-center">
            {activePips.includes(idx) && (
              <span className="h-2 w-2 rounded-full bg-slate-900 shadow-inner" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function DiceControlPanel({ className = '' }: DiceControlPanelProps) {
  const dice = useGameStore((state) => state.dice || [1, 1]);
  const isDouble = useGameStore((state) => state.isDouble);
  const doubleStreak = useGameStore((state) => state.doubleStreak || 0);
  const gamePhase = useGameStore((state) => state.gamePhase);
  const players = useGameStore((state) => state.players || []);
  const activePlayerIndex = useGameStore((state) => state.activePlayerIndex);
  const rollDice = useGameStore((state) => state.rollDice);
  const endTurn = useGameStore((state) => state.endTurn);
  const payJailBail = useGameStore((state) => state.payJailBail);
  const useJailFreeCard = useGameStore((state) => state.useJailFreeCard);
  const settings = useGameStore((state) => state.settings);

  const activePlayer = players[activePlayerIndex];
  const canRoll = canPlayerRoll(activePlayer, gamePhase);
  const canEnd = canPlayerEndTurn(activePlayer, gamePhase);
  const isHumanTurn = activePlayer && !activePlayer.isBot;
  const inJail = activePlayer?.inJail;
  const jailFreeCards = activePlayer?.jailFreeCards || 0;
  const jailBailPrice = settings?.jailBailPrice || 100000;
  const canAffordBail = (activePlayer?.money || 0) >= jailBailPrice;

  const handleRollDice = () => {
    if (!canRoll) return;
    soundManager.playDiceRoll();

    const result = rollDice();
    if (result[0] === result[1]) {
      setTimeout(() => {
        soundManager.playDoubleDiceSound();
      }, 350);
    }
  };

  const handleEndTurn = () => {
    if (!canEnd) return;
    soundManager.playClickSound();
    endTurn();
  };

  const handlePayBail = () => {
    if (!inJail || !canAffordBail || gamePhase !== 'WAITING') return;
    soundManager.playCoinSound();
    payJailBail();
  };

  const handleUseJailCard = () => {
    if (!inJail || jailFreeCards <= 0 || gamePhase !== 'WAITING') return;
    soundManager.playClickSound();
    useJailFreeCard();
  };

  return (
    <div
      className={`relative z-20 flex flex-col items-center gap-3 rounded-2xl border border-white/15 bg-slate-950/85 p-3.5 backdrop-blur-md shadow-2xl ${className}`}
    >
      {/* Dice Faces & Double callout */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-3">
          <DieFace value={dice[0]} />
          <span className="text-xl font-black text-amber-400">+</span>
          <DieFace value={dice[1]} />
          <div className="ml-1 text-center">
            <div className="text-[10px] uppercase font-bold text-slate-400">
              Tổng số
            </div>
            <div className="text-xl font-extrabold text-amber-300 drop-shadow">
              {dice[0] + dice[1]}
            </div>
          </div>
        </div>

        {/* Double Bonus Badge */}
        {isDouble && (
          <div className="flex items-center gap-1.5 rounded-full border border-amber-400 bg-amber-400/20 px-3 py-0.5 text-xs font-extrabold text-amber-300 animate-pulse">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>ĐỔI ĐÔI! +50k & Thêm 1 Lượt</span>
            {doubleStreak > 1 && (
              <span className="text-[10px] text-amber-200">
                ({doubleStreak}/3 lần)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Jail Bail Actions (If active human player is in Jail) */}
      {inJail && isHumanTurn && gamePhase === 'WAITING' && (
        <div className="flex flex-col w-full gap-1.5 pt-1 border-t border-white/10">
          <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-red-300">
            <Lock className="h-3 w-3 text-red-400" />
            <span>Đang ở Trại Giam (còn {activePlayer.jailTurns} lượt)</span>
          </div>

          <div className="flex gap-2 w-full">
            <button
              onClick={handlePayBail}
              disabled={!canAffordBail}
              className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-bold transition-all ${
                canAffordBail
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-md active:scale-95'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              Nộp phạt {formatMoney(jailBailPrice)}
            </button>

            {jailFreeCards > 0 && (
              <button
                onClick={handleUseJailCard}
                className="flex items-center justify-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1.5 text-xs font-bold shadow-md active:scale-95 transition-all"
              >
                <Key className="h-3.5 w-3.5" />
                <span>Dùng Thẻ ({jailFreeCards})</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Primary Action Buttons */}
      <div className="flex w-full items-center gap-2">
        {/* Roll Dice Button */}
        {canRoll ? (
          <button
            onClick={handleRollDice}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 px-4 py-3 text-sm font-extrabold uppercase tracking-wider text-slate-950 shadow-lg shadow-amber-500/30 transition-all hover:scale-102 hover:brightness-110 active:scale-95 animate-pulse"
          >
            <Dices className="h-5 w-5" />
            <span>ĐỔ XÚC XẮC</span>
          </button>
        ) : canEnd ? (
          <button
            onClick={handleEndTurn}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 text-sm font-extrabold uppercase tracking-wider text-slate-950 shadow-lg shadow-emerald-500/30 transition-all hover:scale-102 hover:brightness-110 active:scale-95"
          >
            <span>KẾT THÚC LƯỢT</span>
            <ArrowRight className="h-5 w-5" />
          </button>
        ) : (
          <div className="flex flex-1 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-xs font-semibold text-slate-400">
            {activePlayer?.isBot
              ? `🤖 ${activePlayer.name} đang suy nghĩ...`
              : gamePhase === 'ROLLING' || gamePhase === 'MOVING'
              ? 'Đang di chuyển...'
              : 'Chờ lượt...'}
          </div>
        )}
      </div>
    </div>
  );
}

export default DiceControlPanel;

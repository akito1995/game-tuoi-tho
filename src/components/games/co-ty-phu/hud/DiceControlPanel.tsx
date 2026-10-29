'use client';

import React from 'react';
import { Dices, ArrowRight, Sparkles, Lock, Key, Zap } from 'lucide-react';
import { useGameStore } from '@/lib/game-engine/gameStore';
import { soundManager } from '@/lib/audio/soundManager';
import { canPlayerRoll, canPlayerEndTurn, formatMoney } from './hudHelpers';
import { TacticalSkillBar } from './TacticalSkillBar';

export interface DiceControlPanelProps {
  className?: string;
}

/**
 * 3D High-Gloss Tactile Die Face rendering 1 to 6 pips
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
    <div className="relative flex h-13 w-13 sm:h-14 sm:w-14 items-center justify-center rounded-2xl border-2 border-white/80 bg-gradient-to-b from-white via-amber-50 to-amber-200 p-1.5 shadow-xl shadow-black/50 ring-2 ring-amber-300/60 transform hover:scale-105 transition-transform">
      {/* 3D Gloss Sheen */}
      <div className="absolute inset-1 rounded-xl border border-white/90 pointer-events-none" />
      <div className="grid h-full w-full grid-cols-3 grid-rows-3 gap-0.5 p-0.5">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((idx) => {
          const isPip = activePips.includes(idx);
          const isCenterPip = idx === 4 && (clamped === 1 || clamped === 3 || clamped === 5);
          return (
            <div key={idx} className="flex items-center justify-center">
              {isPip && (
                <span
                  className={`rounded-full shadow-inner ${
                    isCenterPip && clamped === 1
                      ? 'h-3 w-3 sm:h-3.5 sm:w-3.5 bg-rose-600 ring-1 ring-rose-400'
                      : 'h-2.5 w-2.5 sm:h-3 sm:w-3 bg-slate-950 ring-1 ring-slate-800'
                  }`}
                />
              )}
            </div>
          );
        })}
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
  const inJail = activePlayer?.inJail;
  const jailFreeCards = activePlayer?.jailFreeCards || 0;
  const jailBailPrice = settings?.jailBailPrice || 100000;
  const canAffordBail = (activePlayer?.money || 0) >= jailBailPrice;

  const handleRollDice = () => {
    if (!canRoll) return;
    soundManager.playDiceRoll();
    if (activePlayer?.mascot) {
      soundManager.playMascotVoice(activePlayer.mascot, 'dice.roll');
    }

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

  const sum = (dice[0] || 1) + (dice[1] || 1);

  return (
    <div className="flex flex-col items-end">
      <TacticalSkillBar />
      <div
        className={`relative z-20 flex flex-col items-center gap-3.5 rounded-3xl glass-hud p-4 backdrop-blur-2xl shadow-2xl ring-1 ring-white/20 ${className}`}
      >
      {/* Dice Face Visuals & Double Indicator */}
      <div className="flex items-center gap-3">
        <DieFace value={dice[0]} />
        <div className="flex flex-col items-center">
          <span className="text-xl font-black text-amber-400 drop-shadow">+</span>
          <span className="text-[11px] font-black uppercase text-slate-300">= {sum}</span>
        </div>
        <DieFace value={dice[1]} />
      </div>

      {/* Double Streak Badge */}
      {doubleStreak > 0 && (
        <div className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500/20 via-orange-500/25 to-amber-500/20 px-3 py-0.5 border border-amber-400/50 shadow-md animate-pulse">
          <Zap className="h-3.5 w-3.5 text-yellow-300 fill-yellow-300" />
          <span className="text-xs font-black text-yellow-300 uppercase tracking-wide">
            ĐỔ ĐÔI LIÊN TIẾP: {doubleStreak}/3
          </span>
        </div>
      )}

      {/* Jail Escape Options Overlay */}
      {inJail && !activePlayer?.bankrupt && (
        <div className="flex w-full flex-col gap-2 rounded-2xl border border-rose-500/40 bg-rose-950/60 p-3 shadow-lg">
          <div className="flex items-center gap-1.5 text-rose-300 text-xs font-extrabold">
            <Lock className="h-4 w-4" />
            <span>Đang ở Trại Giam ({activePlayer?.jailTurns || 0} lượt)</span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handlePayBail}
              disabled={!canAffordBail || gamePhase !== 'WAITING'}
              className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 px-3 py-2 text-xs font-black uppercase tracking-wider shadow-md active:scale-95 transition-all disabled:opacity-40"
            >
              Nộp phạt {formatMoney(jailBailPrice)}
            </button>

            {jailFreeCards > 0 && (
              <button
                onClick={handleUseJailCard}
                disabled={gamePhase !== 'WAITING'}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 px-3 py-2 text-xs font-black uppercase tracking-wider shadow-md active:scale-95 transition-all disabled:opacity-40"
              >
                <Key className="h-3.5 w-3.5 fill-current" />
                <span>Thẻ ({jailFreeCards})</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Primary 3D Meta World Action Buttons */}
      <div className="flex w-full items-center gap-2">
        {canRoll ? (
          <button
            onClick={handleRollDice}
            className={`flex flex-1 items-center justify-center gap-2.5 rounded-2xl px-5 py-3.5 text-base font-black uppercase tracking-wider text-slate-950 ${
              isDouble ? 'btn-meta-double' : 'btn-meta-roll'
            }`}
          >
            <Dices className="h-6 w-6 fill-slate-950" />
            <span>{isDouble ? 'ĐỔ TIẾP (SỐ ĐÔI)' : 'ĐỔ XÚC XẮC'}</span>
            <Sparkles className="h-5 w-5 fill-slate-950 animate-spin" />
          </button>
        ) : canEnd ? (
          <button
            onClick={handleEndTurn}
            className={`flex flex-1 items-center justify-center gap-2.5 rounded-2xl px-5 py-3.5 text-base font-black uppercase tracking-wider text-slate-950 ${
              isDouble && !activePlayer?.inJail ? 'btn-meta-double' : 'btn-meta-end'
            }`}
          >
            {isDouble && !activePlayer?.inJail ? (
              <>
                <Dices className="h-6 w-6 fill-slate-950" />
                <span>ĐỔ TIẾP (SỐ ĐÔI)</span>
                <Sparkles className="h-5 w-5 fill-slate-950" />
              </>
            ) : (
              <>
                <span>KẾT THÚC LƯỢT</span>
                <ArrowRight className="h-6 w-6" />
              </>
            )}
          </button>
        ) : (
          <div className="flex flex-1 items-center justify-center rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-xs font-bold text-slate-400 shadow-inner">
            {activePlayer?.isBot
              ? `🤖 ${activePlayer.name} đang suy nghĩ...`
              : gamePhase === 'ROLLING' || gamePhase === 'MOVING'
              ? 'Đang di chuyển quân cờ...'
              : 'Chờ đến lượt của bạn...'}
          </div>
        )}
      </div>
    </div>
    </div>
  );
}

export default DiceControlPanel;

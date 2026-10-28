'use client';

import React, { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Medal, Coins, Building } from 'lucide-react';
import { useGameStore } from '@/lib/game-engine/gameStore';
import { soundManager } from '@/lib/audio/soundManager';
import {
  getLeaderboard,
  getMascotInfo,
  formatMoney,
  formatShortMoney,
} from './hudHelpers';

export interface GameOverModalProps {
  onRestart?: () => void;
}

export function GameOverModal({ onRestart }: GameOverModalProps) {
  const gamePhase = useGameStore((state) => state.gamePhase);
  const winner = useGameStore((state) => state.winner);
  const players = useGameStore((state) => state.players || []);
  const tiles = useGameStore((state) => state.tiles || []);
  const resetGame = useGameStore((state) => state.resetGame);

  const isOpen = gamePhase === 'GAME_OVER' || Boolean(winner);
  const fanfarePlayed = useRef(false);

  useEffect(() => {
    if (isOpen && !fanfarePlayed.current) {
      fanfarePlayed.current = true;
      soundManager.playWinFanfare();

      // Fire celebratory confetti sequence
      if (typeof window !== 'undefined') {
        try {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.6 },
          });

          setTimeout(() => {
            confetti({
              particleCount: 100,
              angle: 60,
              spread: 55,
              origin: { x: 0 },
            });
            confetti({
              particleCount: 100,
              angle: 120,
              spread: 55,
              origin: { x: 1 },
            });
          }, 300);
        } catch {
          // Safe fallback if canvas context is unavailable
        }
      }
    } else if (!isOpen) {
      fanfarePlayed.current = false;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const leaderboard = getLeaderboard(players, tiles, winner?.id);
  const declaredWinner = winner || (leaderboard[0] ? leaderboard[0].player : null);
  const winnerMascot = declaredWinner ? getMascotInfo(declaredWinner.mascot) : null;

  const handleRestart = () => {
    soundManager.playClickSound();
    resetGame();
    onRestart?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity" />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="game-over-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border-2 border-amber-400 bg-slate-950 text-white shadow-2xl shadow-amber-500/20"
      >
        {/* Glow Effects */}
        <div className="absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-amber-500/30 blur-3xl pointer-events-none" />

        {/* Celebratory Winner Banner */}
        <div className="relative flex flex-col items-center border-b border-white/10 bg-gradient-to-b from-amber-500/20 via-slate-900 to-slate-950 px-6 pt-6 pb-5 text-center">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-amber-400 via-orange-500 to-rose-500 text-4xl shadow-xl shadow-amber-500/40 animate-bounce">
              {winnerMascot?.emoji || '🏆'}
            </div>
            <div className="absolute -top-3 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 text-slate-950 shadow-md">
              <Trophy className="h-4 w-4" />
            </div>
          </div>

          <span className="mt-3 text-xs font-black uppercase tracking-widest text-amber-400">
            TÂN TỶ PHÚ ĐẢO NGỌC
          </span>

          <h2
            id="game-over-title"
            className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl drop-shadow"
          >
            {declaredWinner?.name || 'Chiến Thắng!'}
          </h2>

          <p className="mt-1 text-xs text-slate-300">
            Đã xuất sắc thâu tóm thị trường bất động sản và trở thành người giàu nhất!
          </p>
        </div>

        {/* Leaderboard Table */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-2 pb-1 border-b border-white/5">
            <span>BẢNG XẾP HẠNG</span>
            <span>TỔNG TÀI SẢN</span>
          </div>

          {leaderboard.map((item) => {
            const mascot = getMascotInfo(item.player.mascot);
            const isWinnerItem = item.isWinner || item.rank === 1;

            return (
              <div
                key={item.player.id}
                className={`flex items-center justify-between rounded-xl border p-3 transition-all ${
                  isWinnerItem
                    ? 'border-amber-400/80 bg-amber-500/10 ring-1 ring-amber-400/50'
                    : item.player.bankrupt
                    ? 'border-red-900/30 bg-red-950/20 opacity-60'
                    : 'border-white/5 bg-slate-900/60'
                }`}
              >
                {/* Left: Rank & Avatar & Name */}
                <div className="flex items-center gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full font-black text-xs">
                    {item.rank === 1 ? (
                      <span className="text-xl">🥇</span>
                    ) : item.rank === 2 ? (
                      <span className="text-xl">🥈</span>
                    ) : item.rank === 3 ? (
                      <span className="text-xl">🥉</span>
                    ) : (
                      <span className="text-slate-500 font-bold">{item.rank}</span>
                    )}
                  </div>

                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr ${mascot.avatarBg} text-lg shadow`}
                  >
                    {mascot.emoji}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white">
                        {item.player.name}
                      </span>
                      {item.player.bankrupt && (
                        <span className="rounded bg-red-600/30 px-1 py-0.2 text-[9px] font-bold text-red-400">
                          Phá sản
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span className="flex items-center gap-0.5">
                        <Building className="h-2.5 w-2.5" />
                        {item.propertyCount} ô đất
                      </span>
                      <span>•</span>
                      <span>Tiền: {formatShortMoney(item.player.money)}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Net Worth */}
                <div className="text-right">
                  <div
                    className={`font-black text-xs sm:text-sm ${
                      isWinnerItem ? 'text-amber-300' : 'text-slate-200'
                    }`}
                  >
                    {formatMoney(item.netWorth)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer: Restart Button */}
        <div className="border-t border-white/10 bg-slate-950/90 p-4">
          <button
            onClick={handleRestart}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 py-3.5 text-sm font-black uppercase tracking-wider text-slate-950 shadow-lg shadow-amber-500/30 transition-all hover:brightness-110 active:scale-95"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Chơi Ván Mới</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default GameOverModal;

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '@/lib/game-engine/gameStore';
import { soundManager } from '@/lib/audio/soundManager';
import { Sparkles, Trophy, Gift, Dice5, CheckCircle } from 'lucide-react';

export const BAU_CUA_MASCOTS = [
  { id: 0, name: 'Nai', emoji: '🦌', color: 'from-amber-700 to-amber-900', border: 'border-amber-600' },
  { id: 1, name: 'Bầu', emoji: '🎃', color: 'from-emerald-600 to-emerald-800', border: 'border-emerald-500' },
  { id: 2, name: 'Gà', emoji: '🐓', color: 'from-red-600 to-red-800', border: 'border-red-500' },
  { id: 3, name: 'Cá', emoji: '🐟', color: 'from-sky-600 to-sky-800', border: 'border-sky-500' },
  { id: 4, name: 'Cua', emoji: '🦀', color: 'from-rose-600 to-rose-800', border: 'border-rose-500' },
  { id: 5, name: 'Tôm', emoji: '🦐', color: 'from-orange-600 to-orange-800', border: 'border-orange-500' },
];

export function BauCuaMiniGameModal() {
  const gamePhase = useGameStore((s) => s.gamePhase);
  const activePlayerIndex = useGameStore((s) => s.activePlayerIndex);
  const players = useGameStore((s) => s.players);
  const jackpotFund = useGameStore((s) => s.jackpotFund);
  const playBauCua = useGameStore((s) => s.playBauCua);
  const dismissMiniGame = useGameStore((s) => s.dismissMiniGame);
  const bauCuaResult = useGameStore((s) => s.bauCuaResult);

  const activePlayer = players[activePlayerIndex];
  const isBot = activePlayer?.isBot || false;

  const [selectedMascot, setSelectedMascot] = useState<number>(1); // Default: Bầu
  const [betAmount, setBetAmount] = useState<number>(30000);
  const [isShaking, setIsShaking] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [diceFaces, setDiceFaces] = useState<[number, number, number]>([1, 3, 4]);

  const botHandledRef = useRef(false);

  const isOpen = gamePhase === 'FESTIVAL_GAME';

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setSelectedMascot(Math.floor(Math.random() * 6));
      setBetAmount(Math.min(50000, Math.max(20000, Math.floor((activePlayer?.money || 100000) * 0.1))));
      setIsShaking(false);
      setIsRevealed(false);
      botHandledRef.current = false;
    }
  }, [isOpen, activePlayer]);

  // Handle Bot AI Auto Play
  useEffect(() => {
    if (!isOpen || !isBot || botHandledRef.current) return;
    botHandledRef.current = true;

    // Bot picks random mascot and starts shaking
    const t1 = setTimeout(() => {
      const randomPick = Math.floor(Math.random() * 6);
      setSelectedMascot(randomPick);
      handleRoll(randomPick, betAmount);
    }, 1200);

    return () => clearTimeout(t1);
  }, [isOpen, isBot, betAmount]);

  if (!isOpen || !activePlayer) return null;

  const handleRoll = (mascotId: number = selectedMascot, bet: number = betAmount) => {
    if (isShaking || isRevealed) return;
    setIsShaking(true);
    soundManager.playDiceRoll();

    setTimeout(() => {
      // Execute the roll in store
      const res = playBauCua(mascotId, bet);
      setDiceFaces(res.dice);
      setIsShaking(false);
      setIsRevealed(true);

      if (res.isJackpot) {
        soundManager.playWinFanfare();
        if (activePlayer?.mascot) {
          soundManager.playMascotVoice(activePlayer.mascot, 'jackpot');
        }
      } else if (res.matches >= 2) {
        soundManager.playWinFanfare();
      } else {
        soundManager.playCashSound();
      }

      if (isBot) {
        setTimeout(() => {
          handleFinish();
        }, 2200);
      }
    }, 1800);
  };

  const handleFinish = () => {
    dismissMiniGame();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3 sm:p-4 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg rounded-3xl border border-amber-500/40 bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-amber-950/50 p-5 sm:p-6 text-white shadow-2xl backdrop-blur-2xl">
        {/* Glow Halo */}
        <div className="absolute -inset-1 -z-10 rounded-3xl bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-amber-500/20 blur-xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-amber-500/30 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 shadow-md">
              <span className="text-2xl">🎲</span>
            </div>
            <div>
              <h2 className="text-lg font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 drop-shadow">
                HỘI CHỢ BẦU CUA TÔM CÁ
              </h2>
              <p className="text-xs font-semibold text-amber-200/80">
                Lễ Hội Đảo Ngọc • Quỹ Heo Đất:{' '}
                <span className="font-bold text-yellow-300">
                  {jackpotFund.toLocaleString('vi-VN')}đ
                </span>
              </p>
            </div>
          </div>
          <div className="rounded-full bg-amber-500/20 px-3 py-1 border border-amber-400/40 text-[11px] font-black text-amber-300 uppercase">
            {activePlayer.name}
          </div>
        </div>

        {/* ================= 3D SHAKING BOWL & DICE ARENA ================= */}
        <div className="my-4 flex flex-col items-center justify-center rounded-2xl border border-amber-500/30 bg-slate-950/70 p-4 relative overflow-hidden shadow-inner">
          <div className="text-center mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {isRevealed
                ? 'KẾT QUẢ MỞ BÁT'
                : isShaking
                ? 'ĐANG LẮC BÁT ĐỒNG...'
                : 'CHỌN LINH VẬT MAY MẮN & LẮC BÁT'}
            </span>
          </div>

          {/* Shaking Bowl / Revealed Dice */}
          <div className="relative flex h-28 w-full items-center justify-center">
            {isShaking ? (
              <div className="flex flex-col items-center justify-center animate-bounce">
                <div className="h-20 w-28 rounded-t-full bg-gradient-to-b from-amber-300 via-yellow-500 to-amber-700 shadow-2xl border-2 border-yellow-200 flex items-center justify-center">
                  <span className="text-3xl animate-spin">✨</span>
                </div>
                <div className="h-3 w-32 rounded-full bg-amber-900 border border-amber-500/60 shadow-lg" />
                <span className="mt-1 text-xs font-black text-yellow-300 animate-pulse">
                  Rộn Rã Tiếng Lắc...
                </span>
              </div>
            ) : isRevealed ? (
              <div className="flex items-center gap-3 animate-in zoom-in-90 duration-300">
                {diceFaces.map((faceId, idx) => {
                  const mascot = BAU_CUA_MASCOTS[faceId];
                  const isMatch = faceId === selectedMascot;
                  return (
                    <div
                      key={idx}
                      className={`relative flex h-16 w-16 sm:h-20 sm:w-20 flex-col items-center justify-center rounded-2xl bg-gradient-to-br ${
                        mascot.color
                      } p-2 shadow-2xl border-2 ${
                        isMatch ? 'border-yellow-300 ring-4 ring-yellow-400/50 scale-105' : 'border-white/20'
                      } transition-all duration-300`}
                    >
                      <span className="text-2xl sm:text-3xl drop-shadow">{mascot.emoji}</span>
                      <span className="mt-0.5 text-[10px] font-black uppercase text-white drop-shadow">
                        {mascot.name}
                      </span>
                      {isMatch && (
                        <div className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-400 text-slate-900 font-black text-[10px] shadow">
                          ✓
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-slate-400">
                <div className="h-16 w-16 rounded-2xl bg-slate-800/80 border border-white/10 flex items-center justify-center text-2xl">
                  ❓
                </div>
                <div className="h-16 w-16 rounded-2xl bg-slate-800/80 border border-white/10 flex items-center justify-center text-2xl">
                  ❓
                </div>
                <div className="h-16 w-16 rounded-2xl bg-slate-800/80 border border-white/10 flex items-center justify-center text-2xl">
                  ❓
                </div>
              </div>
            )}
          </div>

          {/* Outcome Banner if Revealed */}
          {isRevealed && bauCuaResult && (
            <div className="mt-3 w-full rounded-xl bg-amber-500/20 border border-amber-400/50 p-2.5 text-center animate-in fade-in slide-in-from-bottom-2">
              {bauCuaResult.isJackpot ? (
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1.5 text-yellow-300 font-black text-sm">
                    <Trophy className="h-4 w-4 animate-bounce text-yellow-300" />
                    <span>TRÚNG BÃO TAM HOA! ẴM TRỌN QUỸ HEO ĐẤT!</span>
                  </div>
                  <span className="text-lg font-black text-emerald-400">
                    +{bauCuaResult.winnings.toLocaleString('vi-VN')}đ
                  </span>
                </div>
              ) : bauCuaResult.matches > 0 ? (
                <div className="flex flex-col items-center">
                  <span className="text-xs font-bold text-yellow-200">
                    Trúng {bauCuaResult.matches} Mặt Linh Vật!
                  </span>
                  <span className="text-base font-black text-emerald-400">
                    +{bauCuaResult.winnings.toLocaleString('vi-VN')}đ
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <span className="text-xs font-medium text-slate-300">
                    Chưa trúng linh vật nhưng nhận quà Lễ Hội!
                  </span>
                  <span className="text-sm font-bold text-amber-300">+20.000đ</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ================= 6 MASCOT BETTING CARDS ================= */}
        {!isRevealed && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300">Chọn 1 linh vật đặt cược:</span>
              <div className="flex items-center gap-1.5">
                {[20000, 50000, 100000].map((amt) => (
                  <button
                    key={amt}
                    disabled={isShaking || amt > activePlayer.money}
                    onClick={() => setBetAmount(amt)}
                    className={`rounded-lg px-2 py-1 text-[10px] font-bold transition-all ${
                      betAmount === amt
                        ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-yellow-300'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {amt / 1000}k
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {BAU_CUA_MASCOTS.map((m) => {
                const isSelected = selectedMascot === m.id;
                return (
                  <button
                    key={m.id}
                    disabled={isShaking}
                    onClick={() => setSelectedMascot(m.id)}
                    className={`relative flex items-center gap-2 rounded-xl p-2.5 text-left transition-all duration-200 border ${
                      isSelected
                        ? 'bg-amber-500/25 border-amber-400 ring-2 ring-yellow-400 shadow-lg scale-102'
                        : 'bg-slate-800/80 border-white/10 hover:bg-slate-800 hover:border-white/20'
                    }`}
                  >
                    <span className="text-2xl drop-shadow">{m.emoji}</span>
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-white">{m.name}</span>
                      <span className="text-[10px] font-semibold text-amber-300">
                        x{isSelected ? '1-3' : '1'}
                      </span>
                    </div>
                    {isSelected && (
                      <CheckCircle className="ml-auto h-4 w-4 text-amber-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="mt-5 flex items-center justify-end gap-3 pt-3 border-t border-white/10">
          {isRevealed ? (
            <button
              onClick={handleFinish}
              className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 py-3 text-center text-sm font-black text-slate-950 uppercase tracking-wide shadow-xl hover:brightness-110 active:scale-98 transition-all"
            >
              Thu Tiền & Tiếp Tục
            </button>
          ) : (
            <button
              disabled={isShaking}
              onClick={() => handleRoll()}
              className="w-full rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 py-3 text-center text-sm font-black text-slate-950 uppercase tracking-wide shadow-xl hover:brightness-110 active:scale-98 transition-all disabled:opacity-50"
            >
              {isShaking ? 'Đang Lắc Bát...' : '🎲 LẮC BẦU CUA LỄ HỘI'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default BauCuaMiniGameModal;

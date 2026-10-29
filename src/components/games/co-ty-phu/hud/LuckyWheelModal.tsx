'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '@/lib/game-engine/gameStore';
import { soundManager } from '@/lib/audio/soundManager';
import { Sparkles, Trophy, ArrowDown } from 'lucide-react';

export const WHEEL_PRIZES = [
  { id: 0, title: 'HEO ĐẤT JACKPOT', color: '#ec4899', desc: 'Ẵm trọn Quỹ Heo Đất!' },
  { id: 1, title: '+150.000đ TIỀN MẶT', color: '#10b981', desc: 'Thưởng nóng từ Ngân hàng' },
  { id: 2, title: 'KHIÊN BẢO HỘ', color: '#3b82f6', desc: 'Miễn phí 1 lần trả tiền thuê' },
  { id: 3, title: 'XÚC XẮC CHẴN/LẺ', color: '#f59e0b', desc: 'Thẻ chọn Chẵn hoặc Lẻ' },
  { id: 4, title: 'BAY ĐẾN PHÚ QUỐC', color: '#06b6d4', desc: 'Dịch chuyển đến Đảo Ngọc' },
  { id: 5, title: 'TĂNG TỐC +2 BƯỚC', color: '#8b5cf6', desc: 'Thẻ tăng tốc độ di chuyển' },
  { id: 6, title: 'LÌ XÌ +80.000đ', color: '#eab308', desc: 'Lộc lá đầu xuân may mắn' },
  { id: 7, title: 'ĐỔ TIẾP LẬP TỨC', color: '#f43f5e', desc: 'Tặng thêm 1 lượt đổ xúc xắc' },
];

export function LuckyWheelModal() {
  const gamePhase = useGameStore((s) => s.gamePhase);
  const activePlayerIndex = useGameStore((s) => s.activePlayerIndex);
  const players = useGameStore((s) => s.players);
  const spinLuckyWheel = useGameStore((s) => s.spinLuckyWheel);
  const dismissMiniGame = useGameStore((s) => s.dismissMiniGame);
  const luckyWheelResult = useGameStore((s) => s.luckyWheelResult);

  const activePlayer = players[activePlayerIndex];
  const isBot = activePlayer?.isBot || false;

  const [isSpinning, setIsSpinning] = useState(false);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const botHandledRef = useRef(false);

  const isOpen = gamePhase === 'LUCKY_WHEEL';

  useEffect(() => {
    if (isOpen) {
      setIsSpinning(false);
      setIsFinished(false);
      botHandledRef.current = false;
    }
  }, [isOpen]);

  // Handle Bot Auto Spin
  useEffect(() => {
    if (!isOpen || !isBot || botHandledRef.current) return;
    botHandledRef.current = true;

    const t = setTimeout(() => {
      handleSpin();
    }, 1200);

    return () => clearTimeout(t);
  }, [isOpen, isBot]);

  if (!isOpen || !activePlayer) return null;

  const handleSpin = () => {
    if (isSpinning || isFinished) return;
    setIsSpinning(true);
    soundManager.playDiceRoll();

    // Determine target prize via store
    const res = spinLuckyWheel();
    const targetPrizeIndex = res.prizeIndex;

    // Calculate rotation: 8 sectors, each is 45deg (360/8).
    // Pointer is at the top (angle 0).
    // Target sector needs to stop under pointer at the top:
    // prize index i is centered at i * 45 deg.
    const baseSpins = 360 * 5; // 5 full rotations
    const targetAngle = baseSpins + (360 - targetPrizeIndex * 45);

    setRotationAngle(targetAngle);

    setTimeout(() => {
      setIsSpinning(false);
      setIsFinished(true);
      soundManager.playWinFanfare();
      if (isBot) {
        setTimeout(() => {
          handleFinish();
        }, 2200);
      }
    }, 4000);
  };

  const handleFinish = () => {
    dismissMiniGame();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3 sm:p-4 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-md rounded-3xl border border-amber-500/40 bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-amber-950/50 p-5 sm:p-6 text-white shadow-2xl backdrop-blur-2xl flex flex-col items-center">
        {/* Glow Halo */}
        <div className="absolute -inset-1 -z-10 rounded-3xl bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-amber-500/20 blur-xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex w-full items-center justify-between border-b border-amber-500/30 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-300" />
            <h2 className="text-base font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400">
              VÒNG QUAY MAY MẮN
            </h2>
          </div>
          <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 border border-amber-400/40 text-[10px] font-black text-amber-300 uppercase">
            {activePlayer.name}
          </span>
        </div>

        {/* ================= WHEEL CONTAINER ================= */}
        <div className="relative my-6 flex h-64 w-64 items-center justify-center">
          {/* Top Indicator Arrow */}
          <div className="absolute -top-3 z-20 flex flex-col items-center text-amber-400 drop-shadow-lg">
            <div className="h-6 w-5 bg-gradient-to-b from-amber-400 to-yellow-500 clip-triangle shadow" />
          </div>

          {/* Outer Gilded Wheel Rim */}
          <div className="absolute inset-0 rounded-full border-4 border-amber-400/80 shadow-2xl ring-4 ring-yellow-400/30" />

          {/* Rotating Wheel Disk */}
          <div
            className="relative h-60 w-60 rounded-full overflow-hidden shadow-inner"
            style={{
              transform: `rotate(${rotationAngle}deg)`,
              transition: isSpinning ? 'transform 4s cubic-bezier(0.15, 0.95, 0.35, 1)' : 'none',
            }}
          >
            {WHEEL_PRIZES.map((prize, idx) => {
              const rotation = idx * 45;
              return (
                <div
                  key={idx}
                  className="absolute inset-0 origin-center"
                  style={{
                    transform: `rotate(${rotation}deg)`,
                  }}
                >
                  {/* Slice Wedge */}
                  <div
                    className="absolute top-0 left-1/2 -ml-16 h-30 w-32 origin-bottom clip-wedge"
                    style={{
                      backgroundColor: prize.color,
                      opacity: 0.92,
                    }}
                  />
                  {/* Slice Text */}
                  <div
                    className="absolute top-3 left-1/2 -translate-x-1/2 text-center text-[9px] font-black uppercase text-white drop-shadow max-w-[50px] leading-tight"
                    style={{
                      transform: 'rotate(0deg)',
                    }}
                  >
                    {prize.title.split(' ')[0]}
                  </div>
                </div>
              );
            })}

            {/* Central Wheel Hub Cap */}
            <div className="absolute inset-0 m-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 shadow-xl border-2 border-white/80">
              <span className="text-xl">🌟</span>
            </div>
          </div>
        </div>

        {/* Prize Outcome Box */}
        {isFinished && luckyWheelResult && (
          <div className="w-full rounded-2xl bg-amber-500/20 border border-amber-400/50 p-3 text-center animate-in zoom-in-95">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-300 uppercase">
              <Trophy className="h-4 w-4 text-yellow-300" />
              <span>CHÚC MỪNG BẠN ĐÃ TRÚNG</span>
            </div>
            <p className="mt-1 text-base font-black text-white text-glow-gold">
              {luckyWheelResult.title}
            </p>
            <p className="text-xs font-semibold text-emerald-300">
              {luckyWheelResult.rewardText}
            </p>
          </div>
        )}

        {/* Modal Actions */}
        <div className="mt-4 w-full pt-3 border-t border-white/10">
          {isFinished ? (
            <button
              onClick={handleFinish}
              className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 py-3 text-center text-sm font-black text-slate-950 uppercase tracking-wide shadow-xl hover:brightness-110 active:scale-98 transition-all"
            >
              Nhận Quà & Tiếp Tục
            </button>
          ) : (
            <button
              disabled={isSpinning}
              onClick={handleSpin}
              className="w-full rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 py-3 text-center text-sm font-black text-slate-950 uppercase tracking-wide shadow-xl hover:brightness-110 active:scale-98 transition-all disabled:opacity-50"
            >
              {isSpinning ? 'Đang Quay May Mắn...' : '🎡 QUAY NGAY'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default LuckyWheelModal;

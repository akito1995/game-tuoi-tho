'use client';

import React from 'react';
import {
  Sparkles,
  Coins,
  TrendingDown,
  Navigation,
  Key,
  Users,
  Star,
  CheckCircle,
} from 'lucide-react';
import { useGameStore } from '@/lib/game-engine/gameStore';
import { soundManager } from '@/lib/audio/soundManager';
import { formatMoney } from './hudHelpers';

export interface ChanceCardModalProps {
  onClose?: () => void;
}

export function ChanceCardModal({ onClose }: ChanceCardModalProps) {
  const currentCard = useGameStore((state) => state.currentCard);
  const gamePhase = useGameStore((state) => state.gamePhase);
  const applyAndDismissCurrentCard = useGameStore(
    (state) => state.applyAndDismissCurrentCard
  );

  const isOpen = Boolean(currentCard) || gamePhase === 'CARD_DRAWN';
  if (!isOpen || !currentCard) return null;

  const handleConfirm = () => {
    if (currentCard.type === 'CASH_GAIN') {
      soundManager.playCoinSound();
    } else {
      soundManager.playClickSound();
    }
    applyAndDismissCurrentCard();
    onClose?.();
  };

  // Category Configuration matching Screenshot 2
  const getCategoryDetails = () => {
    switch (currentCard.type) {
      case 'CASH_GAIN':
        return {
          pillLabel: '[Thẻ May Mắn]',
          pillClass: 'bg-emerald-600 text-white',
          badgeText: `Thưởng nóng +${formatMoney(currentCard.amount || 0)}`,
          artIcon: '💰',
          artGradient: 'from-amber-100 via-emerald-100 to-emerald-200',
        };
      case 'CASH_LOSS':
        return {
          pillLabel: '[Thẻ Nộp Phạt]',
          pillClass: 'bg-rose-600 text-white',
          badgeText: `Chi phí -${formatMoney(currentCard.amount || 0)}`,
          artIcon: '💸',
          artGradient: 'from-amber-100 via-rose-100 to-rose-200',
        };
      case 'TELEPORT':
        return {
          pillLabel: '[Thẻ Di Chuyển]',
          pillClass: 'bg-sky-600 text-white',
          badgeText: `Bay thẳng tới ô #${currentCard.targetTileId ?? 0}`,
          artIcon: '✈️',
          artGradient: 'from-sky-100 via-sky-200 to-indigo-200',
        };
      case 'JAIL_FREE':
        return {
          pillLabel: '[Thẻ Bảo Bối]',
          pillClass: 'bg-amber-600 text-white',
          badgeText: 'Kim Bài Thoát Tù Miễn Phí',
          artIcon: '🗝️',
          artGradient: 'from-yellow-100 via-amber-200 to-yellow-300',
        };
      case 'PAY_EACH_PLAYER':
        return {
          pillLabel: '[Thẻ Thử Thách]',
          pillClass: 'bg-orange-600 text-white',
          badgeText: `Khao tiệc ${formatMoney(currentCard.amount || 0)}/người`,
          artIcon: '🍻',
          artGradient: 'from-amber-100 via-orange-100 to-yellow-200',
        };
      default:
        return {
          pillLabel: '[Thẻ Đặc Biệt]',
          pillClass: 'bg-purple-600 text-white',
          badgeText: 'Sự kiện ngẫu nhiên',
          artIcon: '✨',
          artGradient: 'from-purple-100 via-pink-100 to-amber-100',
        };
    }
  };

  const meta = getCategoryDetails();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 select-none pointer-events-auto">
      {/* Soft dark backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={handleConfirm}
      />

      {/* Ornate Fortune Card Window (Inspired by Screenshot 2) */}
      <div className="relative z-10 w-full max-w-[340px] sm:max-w-[380px] overflow-hidden rounded-3xl border-4 border-slate-200 bg-gradient-to-b from-white via-slate-50 to-slate-100 p-5 shadow-2xl shadow-black/70 text-slate-800 animate-in fade-in zoom-in-95 duration-200">
        {/* Silver / White Arch Header with Decorative Ribbon */}
        <div className="relative flex flex-col items-center text-center">
          {/* Ribbon Title Container */}
          <div className="relative w-full py-1">
            <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-[1px] bg-slate-300" />
            <h3 className="relative inline-block bg-white px-4 text-xl sm:text-2xl font-black tracking-wide text-slate-800 drop-shadow-sm">
              {currentCard.title}
            </h3>
          </div>
        </div>

        {/* Center Artwork Viewport with Golden Frame */}
        <div className="relative my-3.5 flex h-36 sm:h-40 w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-amber-300/80 bg-gradient-to-b shadow-inner shadow-black/10">
          <div className={`absolute inset-0 bg-gradient-to-b ${meta.artGradient} opacity-90`} />

          {/* Decorative Arch Border */}
          <div className="absolute inset-1.5 rounded-xl border border-white/80 pointer-events-none" />

          {/* Large Thematic Emoticon Art */}
          <div className="relative z-10 flex flex-col items-center justify-center">
            <span className="text-6xl drop-shadow-md animate-bounce">{meta.artIcon}</span>
          </div>

          {/* Card Confirm Sub-Banner */}
          <div className="absolute bottom-2 inset-x-3 rounded-lg bg-yellow-400/95 py-1 px-2 text-center shadow-md">
            <span className="flex items-center justify-center gap-1.5 text-xs font-black text-amber-950">
              <Star className="h-3.5 w-3.5 fill-amber-950 text-amber-950" />
              {meta.badgeText}
            </span>
          </div>
        </div>

        {/* Action Category Pill ([Thẻ May Mắn] / [Thẻ Tấn Công]) */}
        <div className="flex justify-center my-2">
          <span className={`rounded-md px-3 py-1 text-xs font-black uppercase tracking-wider shadow-sm ${meta.pillClass}`}>
            {meta.pillLabel}
          </span>
        </div>

        {/* Card Vietnamese Description Body */}
        <div className="my-3 min-h-[52px] rounded-xl bg-slate-100/90 p-3 text-center border border-slate-200">
          <p className="text-xs sm:text-sm font-semibold text-slate-700 leading-relaxed">
            {currentCard.description}
          </p>
        </div>

        {/* Confirm Action Button (Teal / Cyan Button as in Screenshot 2) */}
        <button
          onClick={handleConfirm}
          className="relative flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-500 to-cyan-600 hover:from-cyan-400 hover:to-teal-500 py-3 text-base sm:text-lg font-black text-white shadow-lg shadow-teal-500/30 transition-transform active:scale-95 ring-2 ring-cyan-200/50"
        >
          <CheckCircle className="h-5 w-5" />
          <span>Xác Nhận</span>
        </button>
      </div>
    </div>
  );
}

export default ChanceCardModal;

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

  // Category Configuration for Meta World style card presentation
  const getCategoryDetails = () => {
    switch (currentCard.type) {
      case 'CASH_GAIN':
        return {
          pillLabel: '✨ THẺ TÀI LỘC',
          pillClass: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950',
          badgeText: `Thưởng nóng +${formatMoney(currentCard.amount || 0)}`,
          artIcon: '💰',
          artGradient: 'from-amber-950/60 via-emerald-950/60 to-slate-950',
          ringColor: 'border-emerald-400/80',
        };
      case 'CASH_LOSS':
        return {
          pillLabel: '⚠️ THẺ NỘP PHẠT',
          pillClass: 'bg-gradient-to-r from-rose-500 to-red-600 text-white',
          badgeText: `Chi phí -${formatMoney(currentCard.amount || 0)}`,
          artIcon: '💸',
          artGradient: 'from-slate-950 via-rose-950/60 to-slate-950',
          ringColor: 'border-rose-400/80',
        };
      case 'TELEPORT':
        return {
          pillLabel: '🚀 THẺ DI CHUYỂN',
          pillClass: 'bg-gradient-to-r from-sky-400 to-blue-500 text-slate-950',
          badgeText: `Bay thẳng tới ô #${currentCard.targetTileId ?? 0}`,
          artIcon: '✈️',
          artGradient: 'from-slate-950 via-sky-950/60 to-indigo-950/80',
          ringColor: 'border-sky-400/80',
        };
      case 'JAIL_FREE':
        return {
          pillLabel: '👑 THẺ BẢO BỐI',
          pillClass: 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950',
          badgeText: 'Kim Bài Thoát Tù Miễn Phí',
          artIcon: '🗝️',
          artGradient: 'from-slate-950 via-amber-950/60 to-yellow-950/80',
          ringColor: 'border-amber-400/80',
        };
      case 'PAY_EACH_PLAYER':
        return {
          pillLabel: '🍻 THẺ KHAO TIỆC',
          pillClass: 'bg-gradient-to-r from-orange-400 to-amber-500 text-slate-950',
          badgeText: `Khao tiệc ${formatMoney(currentCard.amount || 0)}/người`,
          artIcon: '🍻',
          artGradient: 'from-slate-950 via-orange-950/60 to-slate-950',
          ringColor: 'border-orange-400/80',
        };
      default:
        return {
          pillLabel: '🔮 THẺ ĐẶC BIỆT',
          pillClass: 'bg-gradient-to-r from-purple-400 to-pink-500 text-slate-950',
          badgeText: 'Sự kiện ngẫu nhiên',
          artIcon: '✨',
          artGradient: 'from-slate-950 via-purple-950/60 to-slate-950',
          ringColor: 'border-purple-400/80',
        };
    }
  };

  const meta = getCategoryDetails();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 select-none pointer-events-auto">
      {/* Dim backdrop with blur */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity"
        onClick={handleConfirm}
      />

      {/* Meta World Fortune Card Window */}
      <div className={`relative z-10 w-full max-w-[340px] sm:max-w-[380px] overflow-hidden rounded-3xl border-2 ${meta.ringColor} bg-slate-950/95 p-5 shadow-2xl shadow-black/90 text-white animate-in fade-in zoom-in-95 duration-200 ring-1 ring-white/20`}>
        {/* Ribbon Title Header */}
        <div className="relative flex flex-col items-center text-center">
          <div className="flex justify-center mb-1.5">
            <span className={`rounded-full px-3 py-0.5 text-[10px] font-black uppercase tracking-wider shadow-md ${meta.pillClass}`}>
              {meta.pillLabel}
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black tracking-wide text-white drop-shadow">
            {currentCard.title}
          </h3>
        </div>

        {/* Center Artwork Viewport with Metallic Frame */}
        <div className={`relative my-3.5 flex h-36 sm:h-40 w-full items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b ${meta.artGradient} shadow-inner`}>
          {/* Large Thematic Emoticon Art */}
          <div className="relative z-10 flex flex-col items-center justify-center">
            <span className="text-6xl drop-shadow-lg animate-bounce">{meta.artIcon}</span>
          </div>

          {/* Card Confirm Sub-Banner */}
          <div className="absolute bottom-2.5 inset-x-3 rounded-xl bg-slate-900/90 border border-white/10 py-1 px-2.5 text-center shadow-lg backdrop-blur-sm">
            <span className="flex items-center justify-center gap-1.5 text-xs font-black text-amber-300">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {meta.badgeText}
            </span>
          </div>
        </div>

        {/* Card Vietnamese Description Body */}
        <div className="my-3 min-h-[52px] rounded-2xl bg-slate-900/80 p-3.5 text-center border border-white/5">
          <p className="text-xs sm:text-sm font-semibold text-slate-200 leading-relaxed">
            {currentCard.description}
          </p>
        </div>

        {/* Confirm Action Button */}
        <button
          onClick={handleConfirm}
          className="relative flex w-full items-center justify-center gap-2 rounded-2xl btn-meta-roll py-3.5 text-base sm:text-lg font-black text-slate-950 uppercase tracking-wider"
        >
          <CheckCircle className="h-5 w-5 fill-slate-950 text-amber-300" />
          <span>Xác Nhận</span>
        </button>
      </div>
    </div>
  );
}

export default ChanceCardModal;

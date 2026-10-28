'use client';

import React from 'react';
import {
  Sparkles,
  Coins,
  TrendingDown,
  Navigation,
  Key,
  Users,
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

  // Card Type Visual Config
  const getTypeBadge = () => {
    switch (currentCard.type) {
      case 'CASH_GAIN':
        return {
          label: `Nhận Thưởng: +${formatMoney(currentCard.amount || 0)}`,
          colorClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          icon: <Coins className="h-4 w-4 text-emerald-400" />,
        };
      case 'CASH_LOSS':
        return {
          label: `Nộp Phạt: -${formatMoney(currentCard.amount || 0)}`,
          colorClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          icon: <TrendingDown className="h-4 w-4 text-rose-400" />,
        };
      case 'TELEPORT':
        return {
          label: `Dịch Chuyển Tới Ô #${currentCard.targetTileId ?? 0}`,
          colorClass: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
          icon: <Navigation className="h-4 w-4 text-sky-400" />,
        };
      case 'JAIL_FREE':
        return {
          label: 'Kim Bài Thoát Tù Miễn Phí',
          colorClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          icon: <Key className="h-4 w-4 text-amber-400" />,
        };
      case 'PAY_EACH_PLAYER':
        return {
          label: `Mời Tiệc: Trả ${formatMoney(currentCard.amount || 0)}/người`,
          colorClass: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
          icon: <Users className="h-4 w-4 text-orange-400" />,
        };
      default:
        return {
          label: 'Sự Kiện Đặc Biệt',
          colorClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
          icon: <Sparkles className="h-4 w-4 text-purple-400" />,
        };
    }
  };

  const badge = getTypeBadge();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={handleConfirm}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="chance-card-title"
        className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl border-2 border-amber-400/50 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-6 text-white shadow-2xl shadow-amber-500/20 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Glow Accent */}
        <div className="absolute -top-12 -left-12 h-32 w-32 rounded-full bg-amber-500/20 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 h-32 w-32 rounded-full bg-rose-500/20 blur-2xl pointer-events-none" />

        {/* Content */}
        <div className="relative flex flex-col items-center text-center">
          {/* Card Icon */}
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-400 to-rose-500 text-3xl shadow-lg shadow-amber-500/30">
            🃏
          </div>

          <span className="mt-3 text-[11px] font-extrabold uppercase tracking-widest text-amber-400">
            Thẻ Cơ Hội & Khí Vận
          </span>

          <h3
            id="chance-card-title"
            className="mt-1 text-lg font-black text-white drop-shadow-sm"
          >
            {currentCard.title}
          </h3>

          <p className="mt-3 text-xs leading-relaxed text-slate-300 px-2 italic">
            &ldquo;{currentCard.description}&rdquo;
          </p>

          {/* Reward / Penalty Tag */}
          <div
            className={`mt-4 flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-bold ${badge.colorClass}`}
          >
            {badge.icon}
            <span>{badge.label}</span>
          </div>

          {/* Confirm Button */}
          <button
            onClick={handleConfirm}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 px-4 py-3 text-sm font-extrabold text-slate-950 shadow-lg shadow-amber-500/30 transition-all hover:brightness-110 active:scale-95"
          >
            <CheckCircle className="h-4 w-4" />
            <span>Xác Nhận & Tiếp Tục</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChanceCardModal;

'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Coins,
  TrendingDown,
  Navigation,
  Key,
  Users,
  Star,
  CheckCircle,
  HelpCircle,
  Compass,
} from 'lucide-react';
import { useGameStore } from '@/lib/game-engine/gameStore';
import { soundManager } from '@/lib/audio/soundManager';
import { formatMoney } from './hudHelpers';

export interface ChanceCardModalProps {
  onClose?: () => void;
}

// Category Configuration for Luxury Collector Card
export function getChanceCardCategoryDetails(card: {
  type?: string;
  title?: string;
  amount?: number;
  targetTileId?: number;
}) {
  const isFateCard =
    card.type === 'CASH_LOSS' ||
    card.type === 'PAY_EACH_PLAYER' ||
    (card.title || '').toLowerCase().includes('khí vận');

  if (isFateCard) {
    switch (card.type) {
      case 'CASH_LOSS':
        return {
          isFate: true,
          categoryName: 'KHÍ VẬN ĐỊNH MỆNH',
          pillClass: 'bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 text-white',
          badgeText: `Chi phí tổn thất -${formatMoney(card.amount || 0)}`,
          artIcon: '⚖️',
          artGradient: 'from-purple-950 via-slate-950 to-indigo-950',
          borderColor: 'border-purple-400',
          shadowColor: 'shadow-[0_0_50px_rgba(168,85,247,0.45)]',
          accentColor: 'text-purple-300',
          glowPill: 'from-purple-500 to-indigo-600',
        };
      case 'PAY_EACH_PLAYER':
        return {
          isFate: true,
          categoryName: 'KHÍ VẬN ĐÃI TIỆC',
          pillClass: 'bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 text-white',
          badgeText: `Khao tiệc bạn bè ${formatMoney(card.amount || 0)}/người`,
          artIcon: '🏮',
          artGradient: 'from-slate-950 via-purple-950/80 to-slate-950',
          borderColor: 'border-fuchsia-400',
          shadowColor: 'shadow-[0_0_50px_rgba(192,132,252,0.45)]',
          accentColor: 'text-fuchsia-300',
          glowPill: 'from-violet-500 to-purple-600',
        };
      default:
        return {
          isFate: true,
          categoryName: 'KHÍ VẬN BẤT NGỜ',
          pillClass: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
          badgeText: 'Thử thách định mệnh',
          artIcon: '🔮',
          artGradient: 'from-purple-950/80 via-slate-950 to-purple-950/80',
          borderColor: 'border-purple-400',
          shadowColor: 'shadow-[0_0_50px_rgba(168,85,247,0.4)]',
          accentColor: 'text-purple-300',
          glowPill: 'from-purple-500 to-pink-600',
        };
    }
  } else {
    switch (card.type) {
      case 'CASH_GAIN':
        return {
          isFate: false,
          categoryName: 'CƠ HỘI PHÁT TÀI',
          pillClass: 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950',
          badgeText: `Thưởng tài lộc +${formatMoney(card.amount || 0)}`,
          artIcon: '💰',
          artGradient: 'from-amber-950/80 via-slate-950 to-emerald-950/80',
          borderColor: 'border-amber-400',
          shadowColor: 'shadow-[0_0_55px_rgba(245,158,11,0.55)]',
          accentColor: 'text-amber-300',
          glowPill: 'from-amber-400 to-yellow-500',
        };
      case 'TELEPORT':
        return {
          isFate: false,
          categoryName: 'CƠ HỘI DU HÀNH',
          pillClass: 'bg-gradient-to-r from-sky-400 via-cyan-400 to-blue-500 text-slate-950',
          badgeText: `Chuyến bay tới ô #${card.targetTileId ?? 0}`,
          artIcon: '🚀',
          artGradient: 'from-sky-950/80 via-slate-950 to-blue-950/80',
          borderColor: 'border-sky-400',
          shadowColor: 'shadow-[0_0_50px_rgba(56,189,248,0.45)]',
          accentColor: 'text-sky-300',
          glowPill: 'from-sky-400 to-blue-500',
        };
      case 'JAIL_FREE':
        return {
          isFate: false,
          categoryName: 'CƠ HỘI HOÀNG GIA',
          pillClass: 'bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 text-slate-950',
          badgeText: 'Kim Bài Miễn Phạt Tù Vĩnh Viễn',
          artIcon: '🗝️',
          artGradient: 'from-yellow-950/90 via-slate-950 to-amber-950/90',
          borderColor: 'border-yellow-300',
          shadowColor: 'shadow-[0_0_55px_rgba(253,224,71,0.55)]',
          accentColor: 'text-yellow-300',
          glowPill: 'from-yellow-400 to-amber-500',
        };
      default:
        return {
          isFate: false,
          categoryName: 'CƠ HỘI MAY MẮN',
          pillClass: 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950',
          badgeText: 'Phúc lộc tràn đầy',
          artIcon: '⭐',
          artGradient: 'from-amber-950/70 via-slate-950 to-amber-950/70',
          borderColor: 'border-amber-400',
          shadowColor: 'shadow-[0_0_50px_rgba(245,158,11,0.45)]',
          accentColor: 'text-amber-300',
          glowPill: 'from-amber-400 to-orange-500',
        };
    }
  }
}

export function ChanceCardModal({ onClose }: ChanceCardModalProps) {
  const currentCard = useGameStore((state) => state.currentCard);
  const gamePhase = useGameStore((state) => state.gamePhase);
  const applyAndDismissCurrentCard = useGameStore(
    (state) => state.applyAndDismissCurrentCard
  );

  const [sparkleBurst, setSparkleBurst] = useState(true);

  useEffect(() => {
    if (currentCard) {
      setSparkleBurst(true);
      const timer = setTimeout(() => setSparkleBurst(false), 2400);
      return () => clearTimeout(timer);
    }
  }, [currentCard]);

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

  const meta = getChanceCardCategoryDetails(currentCard);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 select-none pointer-events-auto">
      {/* Dim backdrop with blur */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={handleConfirm}
      />

      {/* Golden Confetti & Coin Sparkle Burst */}
      {sparkleBurst && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center overflow-hidden">
          <div className="relative h-96 w-96">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
              const angle = (i * Math.PI) / 4;
              const tx = Math.cos(angle) * 140;
              const ty = Math.sin(angle) * 140;
              return (
                <div
                  key={`coin-burst-${i}`}
                  className="absolute left-1/2 top-1/2 text-2xl transition-all duration-700 ease-out"
                  style={{
                    transform: `translate(${tx}px, ${ty}px) scale(0)`,
                    animation: `burstOut 1.2s forwards ${i * 0.05}s`,
                  }}
                >
                  🪙
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Luxury Gold Foil Framed Card Container */}
      <div
        className={`relative z-20 w-full max-w-[340px] sm:max-w-[390px] overflow-hidden rounded-3xl border-2 ${meta.borderColor} ${meta.shadowColor} bg-slate-950/95 p-5 sm:p-6 text-white animate-in zoom-in-95 duration-250 ring-1 ring-white/20`}
      >
        {/* Ornate Gold Filigree Corner Accents */}
        <div className="pointer-events-none absolute top-2 left-2 text-xs text-amber-400/80">✦</div>
        <div className="pointer-events-none absolute top-2 right-2 text-xs text-amber-400/80">✦</div>
        <div className="pointer-events-none absolute bottom-2 left-2 text-xs text-amber-400/80">✦</div>
        <div className="pointer-events-none absolute bottom-2 right-2 text-xs text-amber-400/80">✦</div>

        {/* Card Category Ribbon Banner */}
        <div className="relative flex flex-col items-center text-center">
          <div className="flex justify-center mb-2">
            <span
              className={`rounded-full px-3.5 py-0.5 text-[11px] font-black uppercase tracking-wider shadow-lg ${meta.pillClass}`}
            >
              {meta.categoryName}
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black tracking-wide text-white drop-shadow">
            {currentCard.title}
          </h3>
        </div>

        {/* Center Artwork Viewport with Metallic Bevel */}
        <div
          className={`relative my-4 flex h-36 sm:h-44 w-full items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b ${meta.artGradient} shadow-inner`}
        >
          {/* Pulsing Aura Ring */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="h-28 w-28 rounded-full bg-white/5 blur-xl animate-pulse" />
          </div>

          {/* Large Thematic Emoticon Art */}
          <div className="relative z-10 flex flex-col items-center justify-center">
            <span className="text-6xl sm:text-7xl drop-shadow-2xl animate-bounce">
              {meta.artIcon}
            </span>
          </div>

          {/* Card Confirm Sub-Banner with Gold Star */}
          <div className="absolute bottom-2.5 inset-x-3 rounded-xl bg-slate-900/90 border border-white/10 py-1.5 px-3 text-center shadow-lg backdrop-blur-sm">
            <span className={`flex items-center justify-center gap-1.5 text-xs font-black ${meta.accentColor}`}>
              <Star className="h-3.5 w-3.5 fill-current" />
              {meta.badgeText}
            </span>
          </div>
        </div>

        {/* Card Vietnamese Story Description Body */}
        <div className="my-3 min-h-[56px] rounded-2xl bg-slate-900/85 p-3.5 text-center border border-white/10 shadow-inner">
          <p className="text-xs sm:text-sm font-semibold text-slate-100 leading-relaxed">
            {currentCard.description}
          </p>
        </div>

        {/* Tactile Action Button */}
        <button
          onClick={handleConfirm}
          className="relative flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 py-3.5 sm:py-4 text-base sm:text-lg font-black text-slate-950 uppercase tracking-wider shadow-xl shadow-amber-500/30 hover:brightness-110 active:scale-98 transition-all"
        >
          <CheckCircle className="h-5 w-5 fill-slate-950 text-amber-300" />
          <span>Đồng Ý & Tiếp Tục</span>
        </button>
      </div>
    </div>
  );
}

export default ChanceCardModal;

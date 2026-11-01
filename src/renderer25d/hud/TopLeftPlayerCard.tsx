'use client';

import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { Player, ChanceCard } from '../../game/types';
import { Shield, Sparkles, CreditCard } from 'lucide-react';

interface TopLeftPlayerCardProps {
  player: Player;
  heldCards?: ChanceCard[];
}

export const TopLeftPlayerCard: React.FC<TopLeftPlayerCardProps> = ({
  player,
  heldCards = [],
}) => {
  // Rolling number counter cho số tiền
  const [displayMoney, setDisplayMoney] = useState(player.money);
  const prevMoneyRef = useRef(player.money);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    const startVal = prevMoneyRef.current;
    const endVal = player.money;

    if (startVal === endVal) {
      setDisplayMoney(endVal);
      return;
    }

    const duration = 600; // ms
    const startTime = performance.now();

    const animateNumber = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startVal + (endVal - startVal) * ease);

      setDisplayMoney(current);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animateNumber);
      } else {
        prevMoneyRef.current = endVal;
        setDisplayMoney(endVal);
      }
    };

    animRef.current = requestAnimationFrame(animateNumber);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [player.money]);

  const characterBorderColor =
    player.character === 'be-ti'
      ? '#E5484D'
      : player.character === 'co-hoa'
      ? '#19B8A6'
      : player.character === 'ong-bay'
      ? '#F5B83D'
      : '#8B6CF0';

  // Tổng hợp các thẻ đang có: Thẻ miễn tù + Thẻ Cơ Hội / Khí Vận giữ lại
  const totalSlots = 4;
  const cardsList: Array<{ id: string; label: string; icon: string; bg: string }> = [];

  if (player.jailFreeCards > 0) {
    for (let i = 0; i < player.jailFreeCards; i++) {
      cardsList.push({
        id: `jail-free-${i}`,
        label: 'Miễn Phạt Tù',
        icon: '🛡️',
        bg: 'from-amber-600 to-amber-800',
      });
    }
  }

  heldCards.forEach((c, idx) => {
    cardsList.push({
      id: `card-${c.id || idx}`,
      label: c.title,
      icon: '📜',
      bg: 'from-purple-600 to-indigo-800',
    });
  });

  return (
    <div className="fixed top-3 left-3 z-30 pointer-events-auto select-none">
      <div className="flex flex-col gap-1.5 rounded-2xl bg-slate-950/95 border-2 border-amber-500/40 p-2.5 shadow-2xl min-w-[210px] max-w-[260px]">
        {/* Hàng trên: Avatar tròn + Thông tin & Tiền */}
        <div className="flex items-center gap-2.5">
          {/* Avatar có vòng nhận diện & huy hiệu VIP/Level */}
          <div className="relative shrink-0">
            <div
              className="relative h-12 w-12 rounded-full overflow-hidden border-2 bg-slate-900 shadow-md"
              style={{ borderColor: characterBorderColor }}
            >
              <Image
                src={`/art/avatars/${player.character}.png`}
                alt={player.name}
                fill
                className="object-cover"
                onError={(e) => {
                  (e.target as any).src = '/art/avatars/avatar-1.png';
                }}
              />
            </div>
            {/* Huy hiệu Level sao vàng */}
            <div className="absolute -bottom-1 -right-1 flex items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-orange-500 border border-amber-200 px-1 py-0.2 shadow-sm text-[9px] font-black text-slate-950">
              ⭐ 1
            </div>
          </div>

          {/* Tên & Số tiền chạy Baloo 2 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-white truncate max-w-[120px]">
                {player.name}
              </span>
              <span className="text-[10px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                TÔI
              </span>
            </div>

            {/* Khung số tiền viền vàng có icon xu */}
            <div className="mt-0.5 flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-900/90 border border-amber-500/50 shadow-inner">
              <div className="relative h-4 w-4 shrink-0">
                <Image
                  src="/art/ui/ui-dong-xu.png"
                  alt="Xu"
                  fill
                  className="object-contain"
                  onError={(e) => {
                    (e.target as any).style.display = 'none';
                  }}
                />
              </div>
              <span className="font-baloo text-base font-extrabold text-amber-300 tracking-wide leading-none truncate">
                {(displayMoney / 1000).toLocaleString('vi-VN')}K
                <span className="text-[11px] font-sans font-medium text-amber-400/80 ml-0.5">₫</span>
              </span>
            </div>
          </div>
        </div>

        {/* Hàng dưới: 4 Ô thẻ đang giữ */}
        <div className="pt-1 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1 px-0.5">
            <span>THẺ NẮM GIỮ</span>
            <span className="text-amber-400 font-mono">
              {cardsList.length}/{totalSlots}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1">
            {Array.from({ length: totalSlots }).map((_, idx) => {
              const card = cardsList[idx];
              if (card) {
                return (
                  <div
                    key={card.id}
                    title={card.label}
                    className={`relative h-9 rounded-lg bg-gradient-to-b ${card.bg} border border-amber-300/80 flex flex-col items-center justify-center p-0.5 shadow cursor-pointer hover:scale-105 active:scale-95 transition-transform`}
                  >
                    <span className="text-xs">{card.icon}</span>
                    <span className="text-[8px] font-bold text-white truncate max-w-[42px] leading-tight">
                      {card.label}
                    </span>
                  </div>
                );
              }

              // Ô trống nét đứt
              return (
                <div
                  key={`empty-${idx}`}
                  title="Ô thẻ trống"
                  className="h-9 rounded-lg border border-dashed border-slate-700 bg-slate-900/40 flex items-center justify-center"
                >
                  <CreditCard className="h-3.5 w-3.5 text-slate-600/70" />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

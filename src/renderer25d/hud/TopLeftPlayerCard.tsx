'use client';

import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { Player, ChanceCard } from '../../game/types';
import { WealthTitleTier, getWealthTitle, CHARACTER_ABILITIES } from '../../game/gameConfig';
import { Shield, Sparkles, CreditCard, Building2 } from 'lucide-react';
import { formatMoney } from '../utils/formatMoney';

interface TopLeftPlayerCardProps {
  player: Player;
  heldCards?: ChanceCard[];
  propertyCount?: number;
  houseCount?: number;
  netWorth?: number;
  wealthTitle?: WealthTitleTier;
  onOpenProperties?: () => void;
  onUseJailCard?: () => void;
}

export const TopLeftPlayerCard: React.FC<TopLeftPlayerCardProps> = ({
  player,
  heldCards = [],
  propertyCount = 0,
  houseCount = 0,
  netWorth,
  wealthTitle,
  onOpenProperties,
  onUseJailCard,
}) => {
  // Rolling number counter cho số tiền
  const currentTitle = wealthTitle || getWealthTitle(netWorth ?? player.money);
  const ability = CHARACTER_ABILITIES[player.character as keyof typeof CHARACTER_ABILITIES];
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
      <div className="flex flex-col gap-1.5 rounded-2xl bg-[#2A170C]/95 border-2 border-[#C9A227]/60 shadow-amber-950/40 p-2.5 shadow-2xl min-w-[210px] max-w-[270px]">
        {/* Hàng trên: Avatar tròn + Thông tin & Tiền */}
        <div className="flex items-center gap-2.5">
          {/* Avatar có vòng nhận diện & huy hiệu VIP/Level */}
          <div className="relative shrink-0">
            <div
              className="relative h-12 w-12 rounded-full overflow-hidden border-2 bg-slate-900 shadow-md cursor-help"
              style={{ borderColor: characterBorderColor }}
              title={ability ? `Năng lực ${ability.name} (${ability.title}): ${ability.description}` : undefined}
            >
              <Image
                src={`/art/avatars/${player.character}.webp`}
                alt={player.name}
                fill
                className="object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement; if (target.src.endsWith('.webp')) { target.src = target.src.replace(/\.webp$/, '.png'); } else { target.src = '/art/avatars/avatar-1.webp'; }
                }}
              />
            </div>
            {/* Huy hiệu Level sao vàng */}
            <div className="absolute -bottom-1 -right-1 flex items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-orange-500 border border-amber-200 px-1 py-0.2 shadow-sm text-[9px] font-black text-slate-950">
              ⭐ 1
            </div>
          </div>

          {/* Tên & Danh hiệu & Số tiền */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-xs font-bold text-[#F3E6C8] truncate max-w-[85px]">
                {player.name}
              </span>
              <span className="text-[10px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                TÔI
              </span>
              {ability && (
                <span
                  className="text-[9px] px-1.5 py-0.2 rounded font-bold border border-amber-400/50 bg-amber-500/20 text-amber-200 cursor-help flex items-center gap-0.5"
                  title={`Năng lực ${ability.name} (${ability.title}): ${ability.description}`}
                >
                  <span>⚡</span>
                  <span>{ability.title}</span>
                </span>
              )}
              {player.inJail && (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/25 text-rose-300 font-bold border border-rose-500/40 whitespace-nowrap">
                  🔒 {player.jailTurns} lượt
                </span>
              )}
              <span
                className="text-[9px] px-1 py-0.2 rounded font-bold border truncate"
                style={{
                  color: currentTitle.color,
                  borderColor: `${currentTitle.color}55`,
                  backgroundColor: `${currentTitle.color}15`,
                }}
                title={`Danh hiệu tài sản: ${currentTitle.title}`}
              >
                {currentTitle.badge} {currentTitle.title}
              </span>
            </div>

            {/* Khung số tiền viền vàng có icon xu */}
            <div className="mt-0.5 flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-[#3D2211]/95 border border-[#C9A227]/70 shadow-inner shadow-inner">
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
                {formatMoney(displayMoney)}
                <span className="text-[11px] font-sans font-medium text-amber-400/80 ml-0.5">₫</span>
              </span>
            </div>
          </div>
        </div>

        {/* Nút xem danh sách Bất động sản với bộ đếm đất + nhà */}
        {onOpenProperties && (
          <button
            onClick={onOpenProperties}
            className="flex items-center justify-between gap-2 px-2.5 py-1 rounded-xl bg-[#3D2211]/90 hover:bg-[#4A2E1B] border border-[#6B4226] hover:border-[#C9A227]/50 text-[#F3E6C8] hover:text-amber-300 transition text-[11px] font-bold cursor-pointer"
            title="Xem danh sách bất động sản đang sở hữu"
          >
            <div className="flex items-center gap-1.5 shrink-0">
              <Building2 className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span>BĐS</span>
            </div>
            <span className="font-mono text-amber-400 font-bold shrink-0">
              {propertyCount || 0} đất · {houseCount || 0} nhà
            </span>
          </button>
        )}

        {/* Hàng dưới: 4 Ô thẻ đang giữ (ẩn trên mobile hẹp để không che bảng điểm) */}
        <div className="pt-1 border-t border-[#6B4226]/80 hidden sm:block">
          <div className="flex items-center justify-between text-[10px] font-bold text-[#F3E6C8]/80 mb-1 px-0.5">
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
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => {
                      if (card.id.startsWith('jail-free')) {
                        if (player.inJail && onUseJailCard) {
                          onUseJailCard();
                        }
                      }
                    }}
                    title={
                      card.id.startsWith('jail-free')
                        ? player.inJail
                          ? '🛡️ Thẻ Miễn Phạt Tù: Bấm để thoát khỏi trại giam ngay lập tức!'
                          : '🛡️ Thẻ Miễn Phạt Tù: Giúp bạn ra tù miễn phí khi bị bắt.'
                        : card.label
                    }
                    className={`relative h-9 rounded-lg bg-gradient-to-b ${card.bg} border border-amber-300/80 flex flex-col items-center justify-center p-0.5 shadow cursor-pointer hover:scale-105 active:scale-95 transition-transform ${
                      card.id.startsWith('jail-free') && player.inJail ? 'ring-2 ring-emerald-400 animate-pulse' : ''
                    }`}
                  >
                    <span className="text-xs">{card.icon}</span>
                    <span className="text-[8px] font-bold text-[#F3E6C8] truncate max-w-[42px] leading-tight">
                      {card.label}
                    </span>
                  </button>
                );
              }

              // Ô trống nét đứt
              return (
                <div
                  key={`empty-${idx}`}
                  title="Ô thẻ trống"
                  className="h-9 rounded-lg border border-dashed border-[#6B4226] bg-[#3D2211]/40 flex items-center justify-center"
                >
                  <CreditCard className="h-3.5 w-3.5 text-[#C9A227]/40" />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

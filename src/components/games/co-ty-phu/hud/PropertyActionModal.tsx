'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  MapPin,
  Flag,
  Home,
  Building,
  Building2,
  Sparkles,
  Lock,
  ArrowRight,
  ShieldAlert,
  RotateCcw,
} from 'lucide-react';
import { useGameStore, calculateRent } from '@/lib/game-engine/gameStore';
import { soundManager } from '@/lib/audio/soundManager';
import { formatMoney, getColorBadgeInfo } from './hudHelpers';

export interface PropertyActionModalProps {
  tileIdOverride?: number | null;
  onClose?: () => void;
}

export function PropertyActionModal({
  tileIdOverride,
  onClose,
}: PropertyActionModalProps) {
  const players = useGameStore((state) => state.players || []);
  const activePlayerIndex = useGameStore((state) => state.activePlayerIndex);
  const tiles = useGameStore((state) => state.tiles || []);
  const gamePhase = useGameStore((state) => state.gamePhase);
  const currentRound = useGameStore((state) => state.currentRound || 1);
  const buyOrUpgradeProperty = useGameStore((state) => state.buyOrUpgradeProperty);
  const mortgageProperty = useGameStore((state) => state.mortgageProperty);
  const unmortgageProperty = useGameStore((state) => state.unmortgageProperty);
  const sellBuilding = useGameStore((state) => state.sellBuilding);
  const setGamePhase = useGameStore((state) => state.setGamePhase);

  const activePlayer = players[activePlayerIndex];

  // Determine target tile
  const currentTileId =
    tileIdOverride !== undefined && tileIdOverride !== null
      ? tileIdOverride
      : activePlayer?.position ?? 0;

  const tile = tiles[currentTileId];

  // Is modal open?
  const isUnowned = tile && !tile.ownerId;
  const isOwn = tile && activePlayer && tile.ownerId === activePlayer.id;

  const isOpen =
    tile &&
    (tile.type === 'PROPERTY' || tile.type === 'TRANSPORT' || tile.type === 'UTILITY') &&
    (tileIdOverride !== undefined && tileIdOverride !== null
      ? true
      : isUnowned
      ? gamePhase === 'ACTION_REQUIRED'
      : isOwn
      ? gamePhase === 'ACTION'
      : false);

  // Current tier of property: -1 (unowned), 0 (land), 1 (townhouse), 2 (apartment), 3 (landmark)
  const currentTier = useMemo(() => {
    if (!tile || !tile.ownerId) return -1;
    if (tile.hasResort) return 3;
    return Math.min(3, tile.houseCount || 0);
  }, [tile]);

  // Selected target tier (default to next highest tier player can afford)
  const [selectedTier, setSelectedTier] = useState<0 | 1 | 2 | 3>(() => {
    return (Math.min(3, Math.max(0, currentTier + 1)) as 0 | 1 | 2 | 3);
  });

  // BUG-01/02: Synchronize selectedTier whenever current tile changes
  useEffect(() => {
    if (tile && (tile.type === 'TRANSPORT' || tile.type === 'UTILITY')) {
      setSelectedTier(0);
    } else {
      setSelectedTier((Math.min(3, Math.max(0, currentTier + 1)) as 0 | 1 | 2 | 3));
    }
  }, [currentTileId, currentTier, tile?.type]);

  const [activeTab, setActiveTab] = useState<'BUY' | 'MANAGE'>('BUY');

  if (!isOpen || !tile || !activePlayer || activePlayer.isBot) return null;

  const isTransportOrUtility = tile.type === 'TRANSPORT' || tile.type === 'UTILITY';
  const colorBadge = getColorBadgeInfo(tile.colorGroup);
  const tilePrice = tile.price || 0;
  const housePrice = tile.housePrice || Math.round(tilePrice * 0.75);

  // 4 Tier definitions
  const tiers = [
    {
      tierIndex: 0 as const,
      name: isTransportOrUtility ? 'Sở hữu cơ bản' : 'Đất nền',
      icon: Flag,
      cost: isUnowned ? tilePrice : 0,
      rent: tile.rentMultiplier?.[0] || tile.baseRent || Math.round(tilePrice * 0.1),
      isLocked: false,
      lockMessage: '',
    },
    {
      tierIndex: 1 as const,
      name: 'Nhà phố',
      icon: Home,
      cost: isUnowned ? tilePrice + housePrice : housePrice * Math.max(0, 1 - currentTier),
      rent: tile.rentMultiplier?.[1] || Math.round(tilePrice * 0.5),
      isLocked: isTransportOrUtility,
      lockMessage: 'Không áp dụng',
    },
    {
      tierIndex: 2 as const,
      name: 'Chung cư',
      icon: Building,
      cost: isUnowned ? tilePrice + 2 * housePrice : housePrice * Math.max(0, 2 - currentTier),
      rent: tile.rentMultiplier?.[2] || Math.round(tilePrice * 1.5),
      isLocked: isTransportOrUtility,
      lockMessage: 'Không áp dụng',
    },
    {
      tierIndex: 3 as const,
      name: 'Khách sạn / Landmark',
      icon: Building2,
      cost: isUnowned ? tilePrice + 3 * housePrice : housePrice * Math.max(0, 3 - currentTier),
      rent: tile.rentMultiplier?.[4] || Math.round(tilePrice * 4.5),
      isLocked: isTransportOrUtility || currentRound <= 1,
      lockMessage: currentRound <= 1 ? 'Giới hạn vòng đầu chưa được xây' : 'Không áp dụng',
    },
  ];

  const selectedTierData = tiers[selectedTier];
  const totalCost = selectedTierData ? selectedTierData.cost : tilePrice;
  const targetRent = selectedTierData ? selectedTierData.rent : tile.baseRent || 0;
  const canAfford = activePlayer.money >= totalCost && totalCost > 0;

  const handleConfirm = () => {
    if (!canAfford) return;
    soundManager.playCoinSound();
    const targetTier = isTransportOrUtility ? 0 : selectedTier;
    const success = buyOrUpgradeProperty(tile.id, targetTier);
    if (success) {
      soundManager.playBuildSound();
    }
    onClose?.();
  };

  const handleSkip = () => {
    soundManager.playClickSound();
    if (gamePhase === 'ACTION_REQUIRED' || gamePhase === 'ACTION') {
      setGamePhase('TURN_END');
    }
    onClose?.();
  };

  const handleMortgage = () => {
    soundManager.playCoinSound();
    mortgageProperty(tile.id);
  };

  const handleUnmortgage = () => {
    soundManager.playCoinSound();
    unmortgageProperty(tile.id);
  };

  const handleSellBuilding = () => {
    soundManager.playCoinSound();
    sellBuilding(tile.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 select-none pointer-events-auto">
      {/* Dim overlay with subtle blur */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={handleSkip}
      />

      {/* Main Dialog Box inspired by Screenshot 1 */}
      <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-3xl border-4 border-amber-300/80 bg-gradient-to-b from-amber-50 to-amber-100/95 shadow-2xl shadow-black/60 text-slate-900 animate-in fade-in zoom-in-95 duration-200">
        {/* ================= HEADER BAR ================= */}
        <div className="relative flex items-center justify-between bg-gradient-to-r from-lime-600 via-green-600 to-emerald-600 px-5 py-3.5 shadow-md">
          {/* Location Pin & Title */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-400 text-amber-950 shadow-inner">
              <MapPin className="h-5 w-5 fill-amber-950" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-wide text-white drop-shadow-md">
                {tile.name}
              </h2>
              <span className="text-xs font-semibold text-lime-100">
                {colorBadge.regionName}
              </span>
            </div>
          </div>

          {/* Close & Skip Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSkip}
              className="flex items-center gap-1 rounded-xl bg-orange-500 hover:bg-orange-600 px-3 py-1.5 text-xs font-black text-white shadow-md transition-transform active:scale-95"
            >
              Bỏ Qua
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleSkip}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-md transition-transform active:scale-95"
            >
              <X className="h-5 w-5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Tab Toggle for Buy vs Manage */}
        {isOwn && (
          <div className="flex border-b border-amber-200 bg-amber-200/50 px-4 pt-2">
            <button
              onClick={() => setActiveTab('BUY')}
              className={`rounded-t-xl px-4 py-1.5 text-sm font-bold transition-all ${
                activeTab === 'BUY'
                  ? 'bg-amber-50 text-emerald-800 shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Nâng cấp công trình
            </button>
            <button
              onClick={() => setActiveTab('MANAGE')}
              className={`rounded-t-xl px-4 py-1.5 text-sm font-bold transition-all ${
                activeTab === 'MANAGE'
                  ? 'bg-amber-50 text-amber-900 shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Thế chấp / Bán nhà
            </button>
          </div>
        )}

        {activeTab === 'BUY' ? (
          <div className="p-4 sm:p-6 space-y-5">
            {/* ================= 4 CONSTRUCTION TIER CARDS ================= */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {tiers.map((t) => {
                const IconComponent = t.icon;
                const isSelected = selectedTier === t.tierIndex;
                const isBuilt = currentTier >= t.tierIndex;
                const isNextTier = currentTier + 1 === t.tierIndex;

                return (
                  <button
                    key={t.tierIndex}
                    type="button"
                    disabled={t.isLocked || isBuilt}
                    onClick={() => setSelectedTier(t.tierIndex)}
                    className={`relative flex flex-col items-center justify-between rounded-2xl border-2 p-2.5 transition-all duration-200 ${
                      isSelected
                        ? 'border-emerald-600 bg-white ring-4 ring-emerald-500/30 shadow-lg scale-[1.02]'
                        : isBuilt
                        ? 'border-amber-300 bg-amber-100/60 opacity-80 cursor-default'
                        : t.isLocked
                        ? 'border-stone-300 bg-stone-200/80 cursor-not-allowed opacity-60'
                        : 'border-amber-200 bg-white/90 hover:border-amber-400 hover:bg-white shadow-sm'
                    }`}
                  >
                    {/* Header Pill */}
                    <div
                      className={`w-full py-1 text-center rounded-lg text-xs font-black ${
                        isSelected
                          ? 'bg-emerald-600 text-white'
                          : isBuilt
                          ? 'bg-amber-600 text-white'
                          : 'bg-amber-700 text-amber-50'
                      }`}
                    >
                      {t.name}
                    </div>

                    {/* Miniature Graphic Box */}
                    <div className="relative my-2 flex h-16 w-full items-center justify-center rounded-xl bg-gradient-to-b from-stone-100 to-amber-100/70 overflow-hidden">
                      {t.isLocked ? (
                        <div className="flex flex-col items-center justify-center p-1 text-center">
                          <Lock className="h-5 w-5 text-stone-500 mb-1" />
                          <span className="text-[10px] leading-tight font-bold text-stone-600">
                            {t.lockMessage}
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center">
                          <IconComponent
                            className={`h-8 w-8 ${
                              t.tierIndex === 0
                                ? 'text-red-600 fill-red-600'
                                : t.tierIndex === 1
                                ? 'text-amber-700'
                                : t.tierIndex === 2
                                ? 'text-sky-700'
                                : 'text-amber-500 fill-amber-500 animate-pulse'
                            }`}
                          />
                        </div>
                      )}

                      {/* Built Checkmark Badge */}
                      {isBuilt && (
                        <div className="absolute inset-0 flex items-center justify-center bg-emerald-950/20 backdrop-blur-[1px]">
                          <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-black text-white shadow">
                            ĐÃ XÂY
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Cost Badge */}
                    <div className="text-center">
                      <span className="text-xs sm:text-sm font-black text-stone-900">
                        {isBuilt
                          ? 'Sở hữu'
                          : t.isLocked
                          ? '---'
                          : formatMoney(t.cost)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* ================= SUMMARY & CONFIRMATION BOX ================= */}
            <div className="rounded-2xl border border-amber-300 bg-white/95 p-4 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-stone-600 flex items-center gap-1.5">
                  Phí Xây Dựng ➡️
                </span>
                <span className="font-black text-base text-stone-900">
                  {formatMoney(totalCost)}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-stone-600 flex items-center gap-1.5">
                  Giảm Phí ➡️
                </span>
                <span className="font-black text-sm text-emerald-600">0đ</span>
              </div>

              <div className="flex items-center justify-between text-sm pt-1 border-t border-amber-100">
                <span className="font-bold text-stone-600 flex items-center gap-1.5">
                  Phí Du Lịch Thu Về ➡️
                </span>
                <span className="font-black text-base text-emerald-700">
                  {formatMoney(targetRent)}
                </span>
              </div>
            </div>

            {/* Big Shiny Yellow Buy Button */}
            <button
              onClick={handleConfirm}
              disabled={!canAfford}
              className={`relative flex w-full items-center justify-center gap-3 rounded-2xl py-3.5 text-lg font-black uppercase tracking-wide shadow-xl transition-all ${
                canAfford
                  ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-amber-950 hover:brightness-105 active:scale-[0.98] ring-4 ring-yellow-300/50'
                  : 'bg-stone-300 text-stone-500 cursor-not-allowed'
              }`}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-950 text-yellow-300 shadow">
                💵
              </div>
              <span>
                {isUnowned ? 'Mua Đất & Xây Dựng' : 'Nâng Cấp Công Trình'}
              </span>
              <Sparkles className="h-5 w-5 fill-amber-950" />
            </button>
          </div>
        ) : (
          /* ================= MANAGE / MORTGAGE / SELL TAB ================= */
          <div className="p-4 sm:p-6 space-y-4">
            <div className="rounded-2xl border border-amber-300 bg-white p-4 space-y-3">
              <h3 className="font-black text-stone-800 text-base flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-amber-600" />
                Quản lý tài sản & Giải cứu nợ
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Khi cần gấp tiền mặt để trả nợ hoặc tránh phá sản, bạn có thể bán bớt nhà
                hoặc thế chấp đất cho Ngân hàng để nhận 50% giá trị.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {/* Sell House Button */}
                <button
                  type="button"
                  disabled={!tile.hasResort && (tile.houseCount || 0) <= 0}
                  onClick={handleSellBuilding}
                  className="flex flex-col items-center justify-center rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 p-3 text-center transition-all disabled:opacity-50"
                >
                  <Home className="h-6 w-6 text-amber-700 mb-1" />
                  <span className="font-bold text-xs text-stone-800">Bán bớt 1 nhà</span>
                  <span className="text-[11px] font-semibold text-emerald-700">
                    +{formatMoney(Math.round(housePrice * 0.5))}
                  </span>
                </button>

                {/* Mortgage / Unmortgage Button */}
                {!tile.isMortgaged ? (
                  <button
                    type="button"
                    disabled={(tile.houseCount || 0) > 0 || tile.hasResort}
                    onClick={handleMortgage}
                    className="flex flex-col items-center justify-center rounded-xl border border-red-300 bg-red-50 hover:bg-red-100 p-3 text-center transition-all disabled:opacity-50"
                  >
                    <ShieldAlert className="h-6 w-6 text-red-600 mb-1" />
                    <span className="font-bold text-xs text-red-800">Thế chấp đất (50%)</span>
                    <span className="text-[11px] font-semibold text-emerald-700">
                      +{formatMoney(Math.round(tilePrice * 0.5))}
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleUnmortgage}
                    className="flex flex-col items-center justify-center rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 p-3 text-center transition-all"
                  >
                    <RotateCcw className="h-6 w-6 text-emerald-600 mb-1" />
                    <span className="font-bold text-xs text-emerald-800">Chuộc lại đất (55%)</span>
                    <span className="text-[11px] font-semibold text-red-700">
                      -{formatMoney(Math.round(tilePrice * 0.55))}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PropertyActionModal;

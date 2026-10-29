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
  Coins,
  TrendingUp,
  Wallet,
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

  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    setIsDismissed(false);
  }, [activePlayerIndex, activePlayer?.position]);

  useEffect(() => {
    const onReopen = () => setIsDismissed(false);
    window.addEventListener('reopen-property-modal', onReopen);
    return () => window.removeEventListener('reopen-property-modal', onReopen);
  }, []);

  // Is modal open?
  const isUnowned = tile && !tile.ownerId;
  const isOwn = tile && activePlayer && tile.ownerId === activePlayer.id;

  const isDecisionPhase =
    gamePhase === 'ACTION_REQUIRED' ||
    gamePhase === 'ACTION' ||
    gamePhase === 'AWAIT_DECISION';

  const isOpen =
    tile &&
    !isDismissed &&
    (tile.type === 'PROPERTY' || tile.type === 'TRANSPORT' || tile.type === 'UTILITY') &&
    (tileIdOverride !== undefined && tileIdOverride !== null
      ? true
      : (isUnowned || isOwn) && isDecisionPhase);

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

  const isTransportOrUtility = tile?.type === 'TRANSPORT' || tile?.type === 'UTILITY';

  // Synchronize selectedTier whenever current tile changes
  useEffect(() => {
    if (tile && (tile.type === 'TRANSPORT' || tile.type === 'UTILITY')) {
      setSelectedTier(0);
    } else {
      setSelectedTier((Math.min(3, Math.max(0, currentTier + 1)) as 0 | 1 | 2 | 3));
    }
  }, [currentTileId, currentTier, tile?.type]);

  const [activeTab, setActiveTab] = useState<'BUY' | 'MANAGE'>('BUY');

  if (!isOpen || !tile || !activePlayer || activePlayer.isBot) return null;

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
      colorClass: 'text-emerald-400',
    },
    {
      tierIndex: 1 as const,
      name: 'Nhà phố',
      icon: Home,
      cost: isUnowned ? tilePrice + housePrice : housePrice * Math.max(0, 1 - currentTier),
      rent: tile.rentMultiplier?.[1] || Math.round(tilePrice * 0.5),
      isLocked: isTransportOrUtility,
      lockMessage: 'Không áp dụng',
      colorClass: 'text-amber-400',
    },
    {
      tierIndex: 2 as const,
      name: 'Chung cư',
      icon: Building,
      cost: isUnowned ? tilePrice + 2 * housePrice : housePrice * Math.max(0, 2 - currentTier),
      rent: tile.rentMultiplier?.[2] || Math.round(tilePrice * 1.5),
      isLocked: isTransportOrUtility,
      lockMessage: 'Không áp dụng',
      colorClass: 'text-sky-400',
    },
    {
      tierIndex: 3 as const,
      name: 'Landmark 5 Sao',
      icon: Building2,
      cost: isUnowned ? tilePrice + 3 * housePrice : housePrice * Math.max(0, 3 - currentTier),
      rent: tile.rentMultiplier?.[4] || Math.round(tilePrice * 4.5),
      isLocked: isTransportOrUtility || currentRound <= 1,
      lockMessage: currentRound <= 1 ? 'Giới hạn vòng đầu' : 'Không áp dụng',
      colorClass: 'text-yellow-300',
    },
  ];

  const selectedTierData = tiers[selectedTier];
  const totalCost = selectedTierData ? selectedTierData.cost : tilePrice;
  const targetRent = selectedTierData ? selectedTierData.rent : tile.baseRent || 0;
  const canAfford = activePlayer.money >= totalCost && totalCost > 0;
  const remainingCash = activePlayer.money - totalCost;

  const handleConfirm = () => {
    if (!canAfford) return;
    soundManager.playCoinSound();
    const targetTier = isTransportOrUtility ? 0 : selectedTier;
    const success = buyOrUpgradeProperty(tile.id, targetTier);
    if (success) {
      soundManager.playBuildSound();
      if (activePlayer?.mascot) {
        soundManager.playMascotVoice(activePlayer.mascot, 'property.buy');
      }
    }
    onClose?.();
  };

  const handleClose = () => {
    soundManager.playClickSound();
    setIsDismissed(true);
    onClose?.();
  };

  const handleSkip = () => {
    soundManager.playClickSound();
    setIsDismissed(true);
    if (gamePhase === 'ACTION_REQUIRED' || gamePhase === 'ACTION' || gamePhase === 'AWAIT_DECISION') {
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
    <div className="fixed top-0 right-0 bottom-0 z-50 flex pointer-events-auto w-full max-w-md animate-in slide-in-from-right duration-300 select-none">
      {/* Transparent backdrop for outside tap (board remains completely visible) */}
      <div
        className="fixed inset-0 bg-black/20"
        onClick={handleClose}
      />

      {/* Meta World Luxury Slide-Over Panel */}
      <div className="relative z-10 flex flex-col h-full w-full overflow-y-auto border-l-2 border-amber-400/80 bg-slate-950/95 shadow-2xl shadow-black/90 text-white ring-1 ring-white/20">
        {/* ================= HEADER BAR ================= */}
        <div className="relative flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-4 border-b border-white/10 shadow-lg">
          {/* Location Pin & Title */}
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-500 text-slate-950 shadow-lg shadow-amber-500/30 ring-2 ring-yellow-200">
              <MapPin className="h-6 w-6 fill-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black tracking-wide text-white drop-shadow">
                  {tile.name}
                </h2>
                <span className="rounded-full bg-amber-400/20 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-300 border border-amber-400/40">
                  Ô #{tile.id}
                </span>
              </div>
              <span className="text-xs font-bold text-sky-300 tracking-tight">
                Khu vực: {colorBadge.regionName}
              </span>
            </div>
          </div>

          {/* Close & Skip Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSkip}
              className="flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-white shadow transition-all active:scale-95"
            >
              <span>Bỏ Qua</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleSkip}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white border border-slate-700 transition-all active:scale-95"
            >
              <X className="h-4 w-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Tab Toggle for Buy vs Manage */}
        {isOwn && (
          <div className="flex border-b border-white/10 bg-slate-900/60 px-5 pt-3">
            <button
              onClick={() => setActiveTab('BUY')}
              className={`rounded-t-2xl px-5 py-2 text-xs font-black uppercase tracking-wider transition-all ${
                activeTab === 'BUY'
                  ? 'bg-amber-500 text-slate-950 shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Nâng cấp công trình
            </button>
            <button
              onClick={() => setActiveTab('MANAGE')}
              className={`rounded-t-2xl px-5 py-2 text-xs font-black uppercase tracking-wider transition-all ${
                activeTab === 'MANAGE'
                  ? 'bg-amber-500 text-slate-950 shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Thế chấp / Bán nhà
            </button>
          </div>
        )}

        {activeTab === 'BUY' ? (
          <div className="p-5 sm:p-6 space-y-5">
            {/* ================= 4 CONSTRUCTION TIER CARDS ================= */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {tiers.map((t) => {
                const IconComponent = t.icon;
                const isSelected = selectedTier === t.tierIndex;
                const isBuilt = currentTier >= t.tierIndex;

                return (
                  <button
                    key={t.tierIndex}
                    type="button"
                    disabled={t.isLocked || isBuilt}
                    onClick={() => setSelectedTier(t.tierIndex)}
                    className={`relative flex flex-col items-center justify-between rounded-2xl p-3 transition-all duration-200 border ${
                      isSelected
                        ? 'border-amber-400 bg-gradient-to-b from-amber-500/20 via-yellow-500/15 to-transparent ring-2 ring-amber-400 shadow-xl shadow-amber-500/20 scale-[1.03]'
                        : isBuilt
                        ? 'border-emerald-500/40 bg-emerald-950/20 opacity-70 cursor-default'
                        : t.isLocked
                        ? 'border-slate-800 bg-slate-900/40 cursor-not-allowed opacity-40'
                        : 'border-white/10 bg-slate-900/60 hover:border-amber-400/50 hover:bg-slate-900 shadow-md'
                    }`}
                  >
                    {/* Header Pill */}
                    <div
                      className={`w-full py-1 text-center rounded-lg text-xs font-black uppercase tracking-wider ${
                        isSelected
                          ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 shadow-sm'
                          : isBuilt
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {t.name}
                    </div>

                    {/* Miniature Graphic Box */}
                    <div className="relative my-3 flex h-16 w-full items-center justify-center rounded-xl bg-slate-950/60 border border-white/5 overflow-hidden">
                      {t.isLocked ? (
                        <div className="flex flex-col items-center justify-center p-1 text-center">
                          <Lock className="h-5 w-5 text-slate-500 mb-1" />
                          <span className="text-[9px] leading-tight font-bold text-slate-500">
                            {t.lockMessage}
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center">
                          <IconComponent
                            className={`h-8 w-8 ${t.colorClass} ${
                              isSelected ? 'animate-bounce drop-shadow' : ''
                            }`}
                          />
                        </div>
                      )}

                      {/* Built Checkmark Badge */}
                      {isBuilt && (
                        <div className="absolute inset-0 flex items-center justify-center bg-emerald-950/50 backdrop-blur-[1px]">
                          <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[9px] font-black text-slate-950 shadow">
                            ĐÃ XÂY
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Cost Badge */}
                    <div className="text-center">
                      <span className="text-xs sm:text-sm font-black text-amber-300">
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

            {/* ================= FINANCIAL METRICS BOX ================= */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 shadow-inner space-y-2.5">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Coins className="h-4 w-4 text-amber-400" />
                  Giá Đầu Tư
                </span>
                <span className="font-black text-sm sm:text-base text-amber-300">
                  {formatMoney(totalCost)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  Tiền Thuê Thu Về
                </span>
                <span className="font-black text-sm sm:text-base text-emerald-400">
                  {formatMoney(targetRent)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs sm:text-sm pt-2 border-t border-white/10">
                <span className="font-bold text-slate-400 flex items-center gap-1.5">
                  <Wallet className="h-4 w-4 text-sky-400" />
                  Số Dư Còn Lại
                </span>
                <span
                  className={`font-black text-sm ${
                    remainingCash >= 0 ? 'text-sky-300' : 'text-rose-400'
                  }`}
                >
                  {formatMoney(Math.max(0, remainingCash))}
                </span>
              </div>
            </div>

            {/* Big Tactile Meta World Purchase Button */}
            <button
              onClick={handleConfirm}
              disabled={!canAfford}
              className={`relative flex w-full items-center justify-center gap-3 rounded-2xl py-4 text-base sm:text-lg font-black uppercase tracking-wider text-slate-950 transition-all ${
                canAfford
                  ? 'btn-meta-roll'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              }`}
            >
              <span>
                {isUnowned ? 'MUA & XÁC LẬP CHỦ QUYỀN' : 'NÂNG CẤP CÔNG TRÌNH'}
              </span>
              <Sparkles className="h-5 w-5 fill-slate-950 animate-spin" />
            </button>
          </div>
        ) : (
          /* ================= MANAGE / MORTGAGE / SELL TAB ================= */
          <div className="p-5 sm:p-6 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-5 space-y-3">
              <h3 className="font-black text-white text-base flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-amber-400" />
                Quản lý tài sản & Giải cứu nợ
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Khi cần gấp tiền mặt để tránh phá sản, bạn có thể bán bớt nhà
                hoặc thế chấp đất cho Ngân hàng để nhận 50% giá trị.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {/* Sell House Button */}
                <button
                  type="button"
                  disabled={!tile.hasResort && (tile.houseCount || 0) <= 0}
                  onClick={handleSellBuilding}
                  className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-slate-800/80 hover:bg-slate-800 p-3.5 text-center transition-all disabled:opacity-40"
                >
                  <Home className="h-6 w-6 text-amber-400 mb-1" />
                  <span className="font-bold text-xs text-white">Bán bớt 1 nhà</span>
                  <span className="text-[11px] font-black text-emerald-400 mt-0.5">
                    +{formatMoney(Math.round(housePrice * 0.5))}
                  </span>
                </button>

                {/* Mortgage / Unmortgage Button */}
                {!tile.isMortgaged ? (
                  <button
                    type="button"
                    disabled={(tile.houseCount || 0) > 0 || tile.hasResort}
                    onClick={handleMortgage}
                    className="flex flex-col items-center justify-center rounded-xl border border-rose-500/30 bg-rose-950/30 hover:bg-rose-950/50 p-3.5 text-center transition-all disabled:opacity-40"
                  >
                    <ShieldAlert className="h-6 w-6 text-rose-400 mb-1" />
                    <span className="font-bold text-xs text-rose-200">Thế chấp đất (50%)</span>
                    <span className="text-[11px] font-black text-emerald-400 mt-0.5">
                      +{formatMoney(Math.round(tilePrice * 0.5))}
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleUnmortgage}
                    className="flex flex-col items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-950/30 hover:bg-emerald-950/50 p-3.5 text-center transition-all"
                  >
                    <RotateCcw className="h-6 w-6 text-emerald-400 mb-1" />
                    <span className="font-bold text-xs text-emerald-200">Chuộc lại đất (55%)</span>
                    <span className="text-[11px] font-black text-rose-400 mt-0.5">
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

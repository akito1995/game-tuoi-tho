'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
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
  Award,
  Check,
} from 'lucide-react';
import { useGameStore, checkColorMonopoly } from '@/lib/game-engine/gameStore';
import { soundManager } from '@/lib/audio/soundManager';
import { Tile } from '@/lib/game-engine/types';
import { formatMoney, getColorBadgeInfo } from './hudHelpers';

export interface TierOptionData {
  tierIndex: 0 | 1 | 2 | 3;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  cost: number;
  rent: number;
  isLocked: boolean;
  lockMessage: string;
  colorClass: string;
  isBuilt: boolean;
  canAfford: boolean;
}

export function calculatePropertyTierDetails(params: {
  tile: Tile;
  currentTier: number;
  isUnowned: boolean;
  currentRound: number;
  playerMoney: number;
  hasMonopoly?: boolean;
}): TierOptionData[] {
  const { tile, currentTier, isUnowned, currentRound, playerMoney, hasMonopoly = false } = params;
  const isTransportOrUtility = tile.type === 'TRANSPORT' || tile.type === 'UTILITY';
  const tilePrice = tile.price || 0;
  const housePrice = tile.housePrice || Math.round(tilePrice * 0.75);

  const rawTiers: Array<{
    tierIndex: 0 | 1 | 2 | 3;
    name: string;
    icon: React.ComponentType<{ className?: string }>;
    cost: number;
    baseRent: number;
    isLocked: boolean;
    lockMessage: string;
    colorClass: string;
  }> = [
    {
      tierIndex: 0,
      name: isTransportOrUtility ? 'Sở hữu cơ bản' : 'Đất nền',
      icon: Flag,
      cost: isUnowned ? tilePrice : 0,
      baseRent: tile.rentMultiplier?.[0] || tile.baseRent || Math.round(tilePrice * 0.1),
      isLocked: false,
      lockMessage: '',
      colorClass: 'text-emerald-400',
    },
    {
      tierIndex: 1,
      name: 'Nhà phố',
      icon: Home,
      cost: isUnowned ? tilePrice + housePrice : housePrice * Math.max(0, 1 - currentTier),
      baseRent: tile.rentMultiplier?.[1] || Math.round(tilePrice * 0.5),
      isLocked: isTransportOrUtility,
      lockMessage: 'Không áp dụng',
      colorClass: 'text-amber-400',
    },
    {
      tierIndex: 2,
      name: 'Chung cư',
      icon: Building,
      cost: isUnowned ? tilePrice + 2 * housePrice : housePrice * Math.max(0, 2 - currentTier),
      baseRent: tile.rentMultiplier?.[2] || Math.round(tilePrice * 1.5),
      isLocked: isTransportOrUtility,
      lockMessage: 'Không áp dụng',
      colorClass: 'text-sky-400',
    },
    {
      tierIndex: 3,
      name: 'Landmark 5 Sao',
      icon: Building2,
      cost: isUnowned ? tilePrice + 3 * housePrice : housePrice * Math.max(0, 3 - currentTier),
      baseRent: tile.rentMultiplier?.[4] || tile.rentMultiplier?.[3] || Math.round(tilePrice * 4.5),
      isLocked: isTransportOrUtility || currentRound <= 1,
      lockMessage: currentRound <= 1 ? 'Giới hạn vòng 1' : 'Không áp dụng',
      colorClass: 'text-yellow-300',
    },
  ];

  return rawTiers.map((t) => {
    const isBuilt = currentTier >= t.tierIndex;
    const rent = hasMonopoly ? t.baseRent * 2 : t.baseRent;
    const canAfford = playerMoney >= t.cost && t.cost > 0;
    return {
      tierIndex: t.tierIndex,
      name: t.name,
      icon: t.icon,
      cost: t.cost,
      rent,
      isLocked: t.isLocked,
      lockMessage: t.lockMessage,
      colorClass: t.colorClass,
      isBuilt,
      canAfford,
    };
  });
}

export function calculateRemainingBalance(playerMoney: number, cost: number): {
  remainingCash: number;
  canAfford: boolean;
} {
  const remainingCash = playerMoney - cost;
  const canAfford = playerMoney >= cost && cost > 0;
  return { remainingCash, canAfford };
}

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

  // Target tile ID
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

  // Current tier: -1 (unowned), 0 (land), 1 (house), 2 (apartment), 3 (landmark)
  const currentTier = useMemo(() => {
    if (!tile || !tile.ownerId) return -1;
    if (tile.hasResort) return 3;
    return Math.min(3, tile.houseCount || 0);
  }, [tile]);

  // Selected target tier
  const [selectedTier, setSelectedTier] = useState<0 | 1 | 2 | 3>(0);

  const isTransportOrUtility = tile?.type === 'TRANSPORT' || tile?.type === 'UTILITY';

  useEffect(() => {
    if (tile && (tile.type === 'TRANSPORT' || tile.type === 'UTILITY')) {
      setSelectedTier(0);
    } else {
      let nextTier = Math.min(3, Math.max(0, currentTier + 1)) as 0 | 1 | 2 | 3;
      if (nextTier === 3 && currentRound <= 1) {
        nextTier = Math.min(2, Math.max(0, currentTier)) as 0 | 1 | 2 | 3;
      }
      setSelectedTier(nextTier);
    }
  }, [currentTileId, currentTier, tile?.type, currentRound]);

  const [activeTab, setActiveTab] = useState<'BUY' | 'MANAGE'>('BUY');

  // Check monopoly boost
  const willCompleteMonopoly = useMemo(() => {
    if (!tile?.colorGroup || !activePlayer) return false;
    const groupTiles = tiles.filter((t) => t.colorGroup === tile.colorGroup);
    if (groupTiles.length <= 1) return false;
    return groupTiles.every((t) => t.id === tile.id || t.ownerId === activePlayer.id);
  }, [tiles, tile?.colorGroup, tile?.id, activePlayer]);

  const hasMonopoly = useMemo(() => {
    if (!tile || !activePlayer) return false;
    return checkColorMonopoly(tiles, tile.colorGroup, activePlayer.id) || willCompleteMonopoly;
  }, [tiles, tile, activePlayer, willCompleteMonopoly]);

  if (!isOpen || !tile || !activePlayer || activePlayer.isBot) return null;

  const colorBadge = getColorBadgeInfo(tile.colorGroup);
  const tilePrice = tile.price || 0;
  const housePrice = tile.housePrice || Math.round(tilePrice * 0.75);

  const tiers = calculatePropertyTierDetails({
    tile,
    currentTier,
    isUnowned: Boolean(isUnowned),
    currentRound,
    playerMoney: activePlayer.money,
    hasMonopoly,
  });

  const selectedTierData = tiers[selectedTier] || tiers[0];
  const totalCost = selectedTierData ? selectedTierData.cost : tilePrice;
  const { remainingCash, canAfford } = calculateRemainingBalance(activePlayer.money, totalCost);

  const handleConfirm = () => {
    if (!canAfford || totalCost === 0) return;
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
    <div className="fixed inset-0 z-50 pointer-events-none select-none flex sm:justify-end sm:items-stretch max-sm:items-end">
      {/* Non-blocking light backdrop (keeps 3D board crisp & visible) */}
      <div
        className="fixed inset-0 bg-black/20 pointer-events-auto transition-opacity duration-300"
        onClick={handleClose}
        aria-label="Đóng bảng"
      />

      {/* Land Deed Certificate Slide-Over Drawer */}
      <div className="relative z-10 flex flex-col w-full pointer-events-auto overflow-y-auto bg-slate-950/95 text-white shadow-2xl shadow-black/90 ring-1 ring-white/20 sm:max-w-md md:max-w-lg sm:h-full max-sm:max-h-[88vh] max-sm:rounded-t-3xl sm:rounded-none border-amber-400/80 sm:border-l-2 max-sm:border-t-2 animate-in max-sm:slide-in-from-bottom sm:slide-in-from-right duration-300">
        {/* Mobile drag handle indicator */}
        <div className="sm:hidden flex justify-center pt-2 pb-1">
          <div className="h-1.5 w-12 rounded-full bg-white/25" />
        </div>

        {/* ================= HEADER: GIẤY CHỨNG NHẬN QUYỀN SỞ HỮU ================= */}
        <div className="relative bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-5 sm:px-6 py-4 border-b border-amber-400/30 shadow-lg">
          <div className="flex items-center justify-between gap-3">
            {/* Wax Seal Badge & Deed Info */}
            <div className="flex items-center gap-3.5 min-w-0">
              {/* Golden Wax Seal Emblem with Intricate Border */}
              <div className="relative flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-700 p-0.5 shadow-lg shadow-amber-500/40 ring-2 ring-yellow-300/70" />
                <div className="absolute inset-1 rounded-full border border-amber-200/40 border-dashed" />
                <div className="relative flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-800 border border-amber-300/80 shadow-inner">
                  <Award className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-100 drop-shadow" />
                </div>
              </div>

              {/* Title, Certificate Tag & Region */}
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-black tracking-widest text-amber-300 uppercase">
                  <Sparkles className="h-3 w-3 text-amber-400 shrink-0" />
                  <span className="truncate">Giấy Chứng Nhận Quyền Sở Hữu</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-black tracking-wide text-white drop-shadow truncate">
                    {tile.name}
                  </h2>
                  <span className="shrink-0 rounded-md bg-amber-400/20 px-2 py-0.5 text-[10px] font-black text-amber-300 border border-amber-400/40">
                    #{tile.id}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold border border-white/10 bg-slate-800/90 text-slate-200 shadow-sm">
                    <span
                      className="inline-block h-2 w-2 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: colorBadge.hex || '#38bdf8' }}
                    />
                    <span className="truncate">{colorBadge.regionName}</span>
                  </span>
                  {hasMonopoly && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-400/40">
                      <Sparkles className="h-2.5 w-2.5 text-amber-400" />
                      <span>X2 Độc Quyền</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Close (X) & Skip Turn Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleSkip}
                className="flex items-center gap-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-white shadow transition-all active:scale-95"
                title="Bỏ qua lượt này"
              >
                <span className="hidden sm:inline">Bỏ Qua</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800/90 hover:bg-rose-600 text-slate-400 hover:text-white border border-slate-700 transition-all active:scale-95"
                title="Đóng bảng"
              >
                <X className="h-4 w-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>

        {/* Tab Toggle for Buy vs Manage */}
        {isOwn && (
          <div className="flex border-b border-white/10 bg-slate-900/70 px-5 pt-3">
            <button
              type="button"
              onClick={() => setActiveTab('BUY')}
              className={`rounded-t-2xl px-5 py-2 text-xs font-black uppercase tracking-wider transition-all ${
                activeTab === 'BUY'
                  ? 'bg-amber-500 text-slate-950 shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Nâng Cấp Công Trình
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('MANAGE')}
              className={`rounded-t-2xl px-5 py-2 text-xs font-black uppercase tracking-wider transition-all ${
                activeTab === 'MANAGE'
                  ? 'bg-amber-500 text-slate-950 shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Thế Chấp / Bán Nhà
            </button>
          </div>
        )}

        {/* Tab Body */}
        {activeTab === 'BUY' ? (
          <div className="p-5 sm:p-6 space-y-5">
            {/* ================= 4 CONSTRUCTION TIER CARDS ================= */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  Chọn cấp độ xây dựng
                </span>
                <span className="text-[11px] text-slate-400 font-semibold">
                  {currentTier >= 0 ? `Hiện có: Cấp ${currentTier}` : 'Chưa có chủ'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {tiers.map((t) => {
                  const IconComponent = t.icon;
                  const isSelected = selectedTier === t.tierIndex;
                  const isBuilt = t.isBuilt;
                  const isClickable = !t.isLocked && !isBuilt;

                  return (
                    <button
                      key={t.tierIndex}
                      type="button"
                      disabled={!isClickable}
                      onClick={() => {
                        soundManager.playClickSound();
                        setSelectedTier(t.tierIndex);
                      }}
                      className={`relative flex flex-col items-center justify-between rounded-2xl p-2.5 sm:p-3 transition-all duration-200 border text-left select-none ${
                        isSelected
                          ? 'border-amber-400 bg-gradient-to-b from-amber-500/25 via-yellow-500/15 to-transparent ring-2 ring-amber-400 shadow-xl shadow-amber-500/25 scale-[1.03] z-10'
                          : isBuilt
                          ? 'border-emerald-500/40 bg-emerald-950/20 opacity-75 cursor-default ring-1 ring-emerald-500/20'
                          : t.isLocked
                          ? 'border-slate-800 bg-slate-900/40 cursor-not-allowed opacity-45'
                          : 'border-white/10 bg-slate-900/60 hover:border-amber-400/50 hover:bg-slate-900 hover:scale-[1.02] active:scale-95 shadow-md'
                      }`}
                    >
                      {/* Header Pill */}
                      <div
                        className={`w-full py-1 px-1 text-center rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider truncate ${
                          isSelected
                            ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 shadow-sm font-extrabold'
                            : isBuilt
                            ? 'bg-emerald-600/90 text-white'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {t.name}
                      </div>

                      {/* Miniature Graphic Box */}
                      <div className="relative my-2.5 flex h-14 sm:h-16 w-full items-center justify-center rounded-xl bg-slate-950/70 border border-white/5 overflow-hidden">
                        {t.isLocked ? (
                          <div className="flex flex-col items-center justify-center p-1 text-center">
                            <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 mb-1" />
                            <span className="text-[8px] sm:text-[9px] leading-tight font-bold text-slate-500 px-1">
                              {t.lockMessage}
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center">
                            <IconComponent
                              className={`h-7 w-7 sm:h-8 sm:w-8 ${t.colorClass} ${
                                isSelected ? 'animate-bounce drop-shadow-[0_2px_8px_rgba(245,158,11,0.6)]' : ''
                              }`}
                            />
                          </div>
                        )}

                        {/* Built Checkmark Badge */}
                        {isBuilt && (
                          <div className="absolute inset-0 flex items-center justify-center bg-emerald-950/60 backdrop-blur-[1px]">
                            <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[9px] font-black text-slate-950 shadow flex items-center gap-1">
                              <Check className="h-2.5 w-2.5 stroke-[3]" />
                              ĐÃ XÂY
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Pricing Badge */}
                      <div className="w-full text-center">
                        {isBuilt ? (
                          <span className="text-[10px] sm:text-xs font-black text-emerald-400">
                            ĐÃ SỞ HỮU
                          </span>
                        ) : t.isLocked ? (
                          <span className="text-[10px] sm:text-xs font-medium text-slate-500">
                            ---
                          </span>
                        ) : (
                          <div className="flex flex-col items-center">
                            <span
                              className={`text-[11px] sm:text-xs font-black ${
                                t.canAfford ? 'text-amber-300' : 'text-rose-400'
                              }`}
                            >
                              {formatMoney(t.cost)}
                            </span>
                            {!t.canAfford && (
                              <span className="text-[8px] font-bold text-rose-400/90 leading-none">
                                Chưa đủ tiền
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ================= RENT PROGRESSION & FINANCIAL BREAKDOWN ================= */}
            <div className="space-y-3">
              {/* Rent Progression Steps */}
              <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-3.5 shadow-md space-y-2">
                <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-amber-300">
                  <span className="flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-amber-400" />
                    Tiến Trình Tiền Thuê & Thu Nhập
                  </span>
                  {hasMonopoly && (
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/30">
                      X2 Độc Quyền
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-1.5 items-center pt-1">
                  {tiers.map((t) => {
                    const isCur = currentTier === t.tierIndex;
                    const isSel = selectedTier === t.tierIndex;
                    return (
                      <div
                        key={t.tierIndex}
                        className={`flex flex-col items-center p-2 rounded-xl text-center transition-all ${
                          isSel
                            ? 'bg-amber-500/20 border border-amber-400/70 ring-1 ring-amber-400/50 text-amber-300 shadow-md scale-[1.02]'
                            : isCur
                            ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300'
                            : 'bg-slate-950/40 border border-white/5 text-slate-400'
                        }`}
                      >
                        <span className="text-[9px] font-bold truncate w-full">{t.name}</span>
                        <span className="text-[10px] sm:text-[11px] font-black mt-0.5">
                          {formatMoney(t.rent)}
                        </span>
                        <span className="text-[8px] font-bold mt-0.5 uppercase tracking-tight">
                          {isCur ? 'Hiện Tại' : isSel ? 'Dự Kiến' : ''}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Multi-Tier Detailed Comparison Table */}
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 shadow-md">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 bg-slate-800/60 text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-2.5 px-3">Cấp Bậc</th>
                      <th className="py-2.5 px-3 text-right">Chi Phí</th>
                      <th className="py-2.5 px-3 text-right">Tiền Thuê / Lượt</th>
                      <th className="py-2.5 px-3 text-center">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs">
                    {tiers.map((t) => {
                      const isSelected = selectedTier === t.tierIndex;
                      const isCurrent = currentTier === t.tierIndex;
                      const isBuilt = t.isBuilt;

                      return (
                        <tr
                          key={t.tierIndex}
                          className={`transition-colors ${
                            isSelected
                              ? 'bg-amber-500/15 font-bold text-amber-200'
                              : isCurrent
                              ? 'bg-emerald-500/10 text-emerald-200 font-semibold'
                              : 'text-slate-300 hover:bg-white/5'
                          }`}
                        >
                          <td className="py-2 px-3 flex items-center gap-1.5">
                            <t.icon className="h-3.5 w-3.5 shrink-0" />
                            <span className="font-medium">{t.name}</span>
                          </td>
                          <td className="py-2 px-3 text-right font-semibold">
                            {isBuilt ? '-' : t.isLocked ? '---' : formatMoney(t.cost)}
                          </td>
                          <td className="py-2 px-3 text-right font-black">
                            {formatMoney(t.rent)}
                          </td>
                          <td className="py-2 px-3 text-center">
                            {isCurrent ? (
                              <span className="inline-block rounded px-1.5 py-0.5 text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                HIỆN TẠI
                              </span>
                            ) : isSelected ? (
                              <span className="inline-block rounded px-1.5 py-0.5 text-[9px] font-black bg-amber-500/25 text-amber-300 border border-amber-500/50 animate-pulse">
                                MỤC TIÊU
                              </span>
                            ) : isBuilt ? (
                              <span className="inline-block rounded px-1.5 py-0.5 text-[9px] font-medium bg-slate-800 text-slate-400">
                                ĐÃ QUA
                              </span>
                            ) : t.isLocked ? (
                              <span className="inline-block rounded px-1.5 py-0.5 text-[9px] font-medium bg-slate-900 text-slate-500">
                                KHÓA
                              </span>
                            ) : (
                              <span className="inline-block rounded px-1.5 py-0.5 text-[9px] font-medium text-slate-400">
                                KHẢ DỤNG
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Wallet Balance Comparison Box */}
              <div className="rounded-2xl border border-white/10 bg-slate-900/90 p-4 space-y-2.5 shadow-inner">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="font-bold text-slate-400 flex items-center gap-1.5">
                    <Wallet className="h-4 w-4 text-sky-400" />
                    Số Dư Hiện Tại
                  </span>
                  <span className="font-black text-white">
                    {formatMoney(activePlayer.money)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <Coins className="h-4 w-4 text-amber-400" />
                    Chi Phí Đầu Tư
                  </span>
                  <span className="font-black text-amber-300 text-sm sm:text-base">
                    {formatMoney(totalCost)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs sm:text-sm pt-2 border-t border-white/10">
                  <span className="font-bold text-slate-400 flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                    Số Dư Sau Đầu Tư
                  </span>
                  <span
                    className={`font-black text-sm sm:text-base ${
                      remainingCash >= 0 ? 'text-emerald-300' : 'text-rose-400'
                    }`}
                  >
                    {formatMoney(remainingCash)}
                  </span>
                </div>
              </div>
            </div>

            {/* ================= TACTILE 3D GOLDEN CTA BUTTON ================= */}
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!canAfford || totalCost === 0}
              className={`relative flex w-full items-center justify-center gap-3 rounded-2xl py-4 text-base sm:text-lg font-black uppercase tracking-wider text-slate-950 transition-all select-none ${
                canAfford && totalCost > 0
                  ? 'btn-meta-roll shadow-[0_6px_0_#92400e,0_12px_24px_rgba(245,158,11,0.5)] active:shadow-[0_2px_0_#92400e] active:translate-y-1 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60 shadow-none'
              }`}
            >
              <span>
                {isUnowned ? 'MUA & XÁC LẬP CHỦ QUYỀN' : 'XÁC NHẬN ĐẦU TƯ'}
              </span>
              <Sparkles
                className={`h-5 w-5 fill-slate-950 ${
                  canAfford && totalCost > 0 ? 'animate-spin' : ''
                }`}
              />
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
                Khi cần gấp tiền mặt để tránh phá sản hoặc tái cơ cấu danh mục, bạn có thể bán bớt nhà
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

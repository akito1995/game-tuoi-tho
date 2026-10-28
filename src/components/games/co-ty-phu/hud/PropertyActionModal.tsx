'use client';

import React from 'react';
import {
  Building2,
  Coins,
  CheckCircle,
  X,
  TrendingUp,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { useGameStore, calculateRent } from '@/lib/game-engine/gameStore';
import { soundManager } from '@/lib/audio/soundManager';
import {
  formatMoney,
  getColorBadgeInfo,
  getUpgradeTier,
} from './hudHelpers';

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
  const buyProperty = useGameStore((state) => state.buyProperty);
  const upgradeProperty = useGameStore((state) => state.upgradeProperty);
  const setGamePhase = useGameStore((state) => state.setGamePhase);

  const activePlayer = players[activePlayerIndex];
  if (!activePlayer || activePlayer.isBot) return null;

  // Determine current tile
  const currentTileId =
    tileIdOverride !== undefined && tileIdOverride !== null
      ? tileIdOverride
      : activePlayer.position;

  const tile = tiles[currentTileId];
  if (!tile) return null;

  // Only open modal for purchaseable types
  const isPurchaseableType =
    tile.type === 'PROPERTY' || tile.type === 'TRANSPORT' || tile.type === 'UTILITY';

  if (!isPurchaseableType) return null;

  // Determine if modal should be open:
  // 1. Unowned tile and phase is ACTION_REQUIRED
  // 2. Own tile and phase is ACTION (can upgrade)
  const isUnowned = !tile.ownerId;
  const isOwn = tile.ownerId === activePlayer.id;

  const isOpen =
    tileIdOverride !== undefined && tileIdOverride !== null
      ? true
      : isUnowned
      ? gamePhase === 'ACTION_REQUIRED'
      : isOwn
      ? gamePhase === 'ACTION'
      : false;

  if (!isOpen) return null;

  const colorBadge = getColorBadgeInfo(tile.colorGroup);
  const currentTier = getUpgradeTier(tile.houseCount || 0);
  const currentRent = calculateRent(tile, tiles);

  // Buy scenario
  const buyPrice = tile.price || 0;
  const canAffordBuy = activePlayer.money >= buyPrice;

  // Upgrade scenario
  const houseCount = tile.houseCount || 0;
  const canUpgradeTier = isOwn && tile.type === 'PROPERTY' && houseCount < 4;
  const upgradeCost = tile.housePrice || 0;
  const canAffordUpgrade = activePlayer.money >= upgradeCost;

  // Projected rent calculation for upgrade
  const simulatedUpgradedTile = {
    ...tile,
    houseCount: houseCount + 1,
  };
  const nextRent = calculateRent(simulatedUpgradedTile, tiles);

  const handleBuy = () => {
    if (!canAffordBuy) return;
    soundManager.playCoinSound();
    const success = buyProperty(tile.id);
    if (success) {
      soundManager.playBuildSound();
    }
    onClose?.();
  };

  const handleUpgrade = () => {
    if (!canAffordUpgrade || !canUpgradeTier) return;
    soundManager.playBuildSound();
    upgradeProperty(tile.id);
    setGamePhase('TURN_END');
    onClose?.();
  };

  const handleDismiss = () => {
    soundManager.playClickSound();
    setGamePhase('TURN_END');
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={handleDismiss}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-white/20 bg-slate-900 text-white shadow-2xl shadow-black/60"
      >
        {/* Color Group Header Banner */}
        <div
          className={`flex items-center justify-between px-5 py-3.5 border-b ${colorBadge.bgClass} ${colorBadge.borderClass}`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`h-3.5 w-3.5 rounded-full ${colorBadge.dotClass} shadow-md`}
            />
            <span className={`text-xs font-extrabold uppercase tracking-wider ${colorBadge.textClass}`}>
              {colorBadge.regionName}
            </span>
          </div>

          <button
            onClick={handleDismiss}
            aria-label="Đóng bảng"
            className="rounded-lg p-1 text-slate-400 hover:bg-black/20 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Property Identity */}
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-amber-400">
                <MapPin className="h-3.5 w-3.5" />
                <span>Ô số #{tile.id}</span>
              </div>
              <h2 className="mt-0.5 text-xl font-extrabold tracking-tight text-white">
                {tile.name}
              </h2>
            </div>

            {/* Current Building Badge */}
            <div
              className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-bold ${currentTier.badgeBg}`}
            >
              <span>{currentTier.icon}</span>
              <span>{currentTier.name}</span>
            </div>
          </div>

          {/* Scenario A: Unowned Property (Buying Land) */}
          {isUnowned && (
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-white/10 bg-slate-800/60 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Giá mua đất:</span>
                  <span className="font-extrabold text-amber-300 text-sm">
                    {formatMoney(buyPrice)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Tiền thuê khởi điểm:</span>
                  <span className="font-bold text-slate-200">
                    {formatMoney(tile.baseRent || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
                  <span className="text-slate-400">Tiền mặt hiện có:</span>
                  <span
                    className={`font-semibold ${
                      canAffordBuy ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {formatMoney(activePlayer.money)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={handleDismiss}
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2.5 text-xs font-bold text-slate-300 transition-colors hover:bg-slate-700 active:scale-95"
                >
                  Bỏ Qua
                </button>
                <button
                  onClick={handleBuy}
                  disabled={!canAffordBuy}
                  className={`flex flex-2 items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-extrabold tracking-wide uppercase transition-all ${
                    canAffordBuy
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-lg shadow-amber-500/30 hover:scale-102 hover:brightness-110 active:scale-95'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  }`}
                >
                  <Coins className="h-4 w-4" />
                  <span>
                    {canAffordBuy
                      ? `Mua Đất [${formatMoney(buyPrice)}]`
                      : 'Không Đủ Tiền Mua'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Scenario B: Own Property (Upgrading House / Resort) */}
          {isOwn && canUpgradeTier && (
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-white/10 bg-slate-800/60 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Nâng cấp lên:</span>
                  <span className="font-extrabold text-amber-300 text-sm flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                    {currentTier.nextTierName}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Chi phí xây dựng:</span>
                  <span className="font-extrabold text-amber-300">
                    {formatMoney(upgradeCost)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Tiền thuê tăng lên:</span>
                  <div className="flex items-center gap-1 text-emerald-400 font-bold">
                    <span>{formatMoney(currentRent)}</span>
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span>{formatMoney(nextRent)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
                  <span className="text-slate-400">Tiền mặt hiện có:</span>
                  <span
                    className={`font-semibold ${
                      canAffordUpgrade ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {formatMoney(activePlayer.money)}
                  </span>
                </div>
              </div>

              {/* Upgrade Buttons */}
              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={handleDismiss}
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2.5 text-xs font-bold text-slate-300 transition-colors hover:bg-slate-700 active:scale-95"
                >
                  Không Nâng Cấp
                </button>
                <button
                  onClick={handleUpgrade}
                  disabled={!canAffordUpgrade}
                  className={`flex flex-2 items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-extrabold tracking-wide uppercase transition-all ${
                    canAffordUpgrade
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/30 hover:scale-102 hover:brightness-110 active:scale-95'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  }`}
                >
                  <Building2 className="h-4 w-4" />
                  <span>
                    {canAffordUpgrade
                      ? `Xây [${formatMoney(upgradeCost)}]`
                      : 'Không Đủ Tiền Xây'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Scenario C: Max Level Property */}
          {isOwn && !canUpgradeTier && (
            <div className="mt-4 text-center py-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
              <span className="text-3xl">👑</span>
              <h3 className="mt-2 text-sm font-bold text-amber-300">
                Đã Đạt Cấp Siêu Resort Tối Thượng!
              </h3>
              <p className="mt-1 text-xs text-slate-300">
                Bất động sản này đã đạt cấp cao nhất. Tiền thuê hiện tại:{' '}
                <strong className="text-emerald-400">{formatMoney(currentRent)}</strong>.
              </p>
              <button
                onClick={handleDismiss}
                className="mt-4 rounded-xl bg-amber-500 px-5 py-2 text-xs font-bold text-slate-950 shadow-md hover:bg-amber-400 active:scale-95"
              >
                Đã Hiểu
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PropertyActionModal;

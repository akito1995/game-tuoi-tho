'use client';

import React from 'react';
import { Player, Tile, BUILDING_COSTS } from '../../game/types';
import { AlertTriangle, Home, Building, DollarSign, XCircle } from 'lucide-react';

interface DebtReliefModalProps {
  player: Player;
  debtAmount: number;
  tiles: Tile[];
  onSellHouse: (tileId: number) => void;
  onMortgage: (tileId: number) => void;
  onDeclareBankruptcy: () => void;
}

export const DebtReliefModal: React.FC<DebtReliefModalProps> = ({
  player,
  debtAmount,
  tiles,
  onSellHouse,
  onMortgage,
  onDeclareBankruptcy,
}) => {
  const ownedTiles = tiles.filter((t) => t.ownerId === player.id);
  const tilesWithHouses = ownedTiles.filter((t) => (t.houseCount || 0) > 0);
  const mortgageableTiles = ownedTiles.filter(
    (t) => !t.isMortgaged && (t.houseCount || 0) === 0 && !t.hasLandmark
  );

  const deficit = Math.max(0, debtAmount - player.money);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 select-none pointer-events-auto">
      <div className="relative w-full max-w-xl rounded-3xl bg-slate-900 border-2 border-rose-500/80 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-white">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-rose-700 px-5 py-3.5 flex items-center justify-between border-b border-red-400/40">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-amber-300 animate-bounce" />
            <h2 className="font-baloo text-lg sm:text-xl font-black tracking-wide drop-shadow uppercase">
              XOAY TIỀN / CỨU VÃN TÀI CHÍNH
            </h2>
          </div>
          <span className="text-xs font-bold bg-slate-950/40 px-3 py-1 rounded-full text-amber-300">
            Còn thiếu: {Math.round(deficit / 1000).toLocaleString('vi-VN')}K₫
          </span>
        </div>

        <div className="p-4 sm:p-5 max-h-[75vh] overflow-y-auto space-y-4">
          <p className="text-xs sm:text-sm text-slate-300">
            Bạn đang có khoản nợ <span className="font-bold text-rose-400">{Math.round(debtAmount / 1000).toLocaleString('vi-VN')}K₫</span> (Hiện có: {Math.round(player.money / 1000).toLocaleString('vi-VN')}K₫). Hãy bán nhà hoặc cầm cố đất để gom đủ số tiền trên trước khi bị phá sản!
          </p>

          {/* Section 1: Bán nhà */}
          <div className="rounded-2xl bg-slate-950/80 border border-slate-800 p-3.5">
            <div className="flex items-center gap-2 mb-2.5">
              <Building className="h-4 w-4 text-emerald-400" />
              <h3 className="font-baloo text-sm font-bold text-slate-200">
                1. BÁN BỚT NHÀ (Hoàn 50% chi phí xây)
              </h3>
            </div>

            {tilesWithHouses.length === 0 ? (
              <p className="text-xs text-slate-500 italic">Bạn không có ngôi nhà nào để bán.</p>
            ) : (
              <div className="space-y-2">
                {tilesWithHouses.map((t) => {
                  const costs = t.colorGroup ? BUILDING_COSTS[t.colorGroup] : { houseCost: 50000 };
                  const refund = Math.round((costs?.houseCost || 50000) * 0.5);
                  return (
                    <div
                      key={t.id}
                      className="flex items-center justify-between rounded-xl bg-slate-900 px-3 py-2 border border-slate-800 text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-200">{t.name}</span>
                        <span className="text-[11px] text-amber-400 ml-2">({t.houseCount} nhà)</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-emerald-400 font-bold">
                          +{Math.round(refund / 1000)}K₫
                        </span>
                        <button
                          onClick={() => onSellHouse(t.id)}
                          className="min-h-[36px] px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs cursor-pointer transition shadow"
                        >
                          Bán 1 nhà
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: Cầm cố đất */}
          <div className="rounded-2xl bg-slate-950/80 border border-slate-800 p-3.5">
            <div className="flex items-center gap-2 mb-2.5">
              <DollarSign className="h-4 w-4 text-amber-400" />
              <h3 className="font-baloo text-sm font-bold text-slate-200">
                2. CẦM CỐ ĐẤT (Nhận 50% giá đất gốc)
              </h3>
            </div>

            {mortgageableTiles.length === 0 ? (
              <p className="text-xs text-slate-500 italic">
                Không có ô đất trống hợp lệ (cần bán hết nhà trên ô trước khi cầm cố).
              </p>
            ) : (
              <div className="space-y-2">
                {mortgageableTiles.map((t) => {
                  const mortgageVal = Math.round((t.price || 100000) * 0.5);
                  return (
                    <div
                      key={t.id}
                      className="flex items-center justify-between rounded-xl bg-slate-900 px-3 py-2 border border-slate-800 text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-200">{t.name}</span>
                        <span className="text-[11px] text-slate-400 ml-2">
                          (Giá gốc: {Math.round((t.price || 100000) / 1000)}K)
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-amber-400 font-bold">
                          +{Math.round(mortgageVal / 1000)}K₫
                        </span>
                        <button
                          onClick={() => onMortgage(t.id)}
                          className="min-h-[36px] px-3 rounded-lg bg-amber-600 hover:bg-amber-500 active:scale-95 text-slate-950 font-bold text-xs cursor-pointer transition shadow"
                        >
                          Cầm cố
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-5 py-3 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Nếu không thể gom đủ tiền, bạn buộc phải phá sản.
          </span>
          <button
            onClick={onDeclareBankruptcy}
            className="min-h-[44px] px-4 rounded-xl bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-700/60 font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
          >
            <XCircle className="h-4 w-4" />
            <span>CHẤP NHẬN PHÁ SẢN</span>
          </button>
        </div>
      </div>
    </div>
  );
};

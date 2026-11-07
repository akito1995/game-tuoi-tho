'use client';

import React from 'react';
import { Tile, COLOR_GROUP_HEX } from '../game/types';
import { Building, Coins, X, Check, ArrowUpRight } from 'lucide-react';

export interface ActionDecisionModalProps {
  type: 'BUY' | 'UPGRADE';
  tile: Tile;
  playerMoney: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ActionDecisionModal({
  type,
  tile,
  playerMoney,
  onConfirm,
  onCancel,
}: ActionDecisionModalProps) {
  const isBuy = type === 'BUY';
  const cost = isBuy ? (tile.price || 0) : (tile.housePrice || 50000);
  const canAfford = playerMoney >= cost;
  const groupColor = tile.colorGroup ? COLOR_GROUP_HEX[tile.colorGroup] : '#64748B';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-3xl border-2 border-amber-500/60 bg-gradient-to-b from-slate-900 via-stone-950 to-slate-950 p-6 shadow-2xl shadow-black/80">
        {/* Dải màu nhóm đất */}
        <div
          className="mx-auto mb-3 h-2.5 w-24 rounded-full shadow-md"
          style={{ backgroundColor: groupColor }}
        />

        <div className="text-center">
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest">
            {isBuy ? 'Cơ Hội Đầu Tư' : 'Nâng Cấp Bất Động Sản'}
          </span>
          <h3 className="text-xl font-bold font-baloo text-amber-200 mt-0.5">
            {tile.name}
          </h3>
          {tile.landmarkName && (
            <p className="text-[11px] text-slate-400 italic">
              Biểu tượng: {tile.landmarkName}
            </p>
          )}
        </div>

        {/* Bảng chi phí & Giá thuê */}
        <div className="my-4 space-y-2 rounded-2xl border border-slate-800 bg-slate-950/80 p-3.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">{isBuy ? 'Giá mua đất:' : 'Chi phí nâng cấp:'}</span>
            <span className="font-mono font-bold text-amber-300">
              {cost.toLocaleString('vi-VN')}đ
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">Tiền thuê cơ bản:</span>
            <span className="font-mono text-slate-300">
              {(tile.baseRent || 0).toLocaleString('vi-VN')}đ
            </span>
          </div>

          {tile.rentMultiplier && tile.rentMultiplier.length > 0 && (
            <div className="flex items-center justify-between border-t border-slate-800/80 pt-1.5 text-[11px]">
              <span className="text-slate-400">Tiền thuê tối đa (Landmark):</span>
              <span className="font-mono font-bold text-emerald-400">
                {(tile.rentMultiplier[tile.rentMultiplier.length - 1] || 0).toLocaleString('vi-VN')}đ
              </span>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-slate-800/80 pt-1.5 text-[11px]">
            <span className="text-slate-400">Số dư hiện tại của bạn:</span>
            <span
              className={`font-mono font-bold ${
                canAfford ? 'text-slate-200' : 'text-rose-400'
              }`}
            >
              {playerMoney.toLocaleString('vi-VN')}đ
            </span>
          </div>
        </div>

        {!canAfford && (
          <p className="mb-3 text-center text-xs text-rose-400 font-semibold">
            ⚠️ Bạn không đủ tiền để thực hiện giao dịch này!
          </p>
        )}

        {/* Nút thao tác */}
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-slate-700 bg-slate-800/80 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 active:scale-95 transition"
          >
            Bỏ Qua
          </button>

          <button
            onClick={onConfirm}
            disabled={!canAfford}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold text-slate-950 shadow-lg transition active:scale-95 ${
              canAfford
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 shadow-amber-500/25'
                : 'bg-slate-700 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Check className="h-4 w-4" />
            <span>{isBuy ? 'Mua Ngay' : 'Xây Nâng Cấp'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

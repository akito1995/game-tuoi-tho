'use client';

import React from 'react';
import Image from 'next/image';
import { Tile, COLOR_GROUP_HEX, COLOR_GROUP_VIETNAMESE } from '../../game/types';
import { Building, Coins, ShieldCheck, X, Train, Zap } from 'lucide-react';

interface TilePurchaseCardProps {
  tile: Tile;
  playerMoney: number;
  onBuy: () => void;
  onSkip: () => void;
  isUpgrade?: boolean;
}

export const TilePurchaseCard: React.FC<TilePurchaseCardProps> = ({
  tile,
  playerMoney,
  onBuy,
  onSkip,
  isUpgrade = false,
}) => {
  const colorHex = tile.colorGroup ? COLOR_GROUP_HEX[tile.colorGroup] || '#A0673F' : '#A0673F';
  const colorName = tile.colorGroup ? COLOR_GROUP_VIETNAMESE[tile.colorGroup] || 'Di sản văn hoá' : 'Đất công';
  const price = isUpgrade ? tile.housePrice || 50000 : tile.price || 100000;
  const canAfford = playerMoney >= price;

  const isUtility = tile.type === 'UTILITY';
  const isTransport = tile.type === 'TRANSPORT';

  const rentList = tile.rentMultiplier || [
    tile.baseRent || 10000,
    (tile.baseRent || 10000) * 5,
    (tile.baseRent || 10000) * 15,
    (tile.baseRent || 10000) * 45,
    (tile.baseRent || 10000) * 80,
    (tile.baseRent || 10000) * 120,
  ];

  return (
    <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 w-[94vw] max-w-lg select-none pointer-events-auto animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="relative rounded-2xl bg-slate-950/98 border-2 border-amber-500/60 shadow-2xl overflow-hidden">
        {/* Banner màu nhóm di sản trên cùng */}
        <div
          className="flex items-center justify-between px-4 py-2 border-b-2 border-amber-400/40"
          style={{ backgroundColor: colorHex }}
        >
          <div className="flex items-center gap-2">
            <span className="rounded bg-slate-950/40 px-2 py-0.5 text-xs font-mono font-bold text-white">
              Ô #{tile.id}
            </span>
            <h3 className="font-baloo text-base sm:text-lg font-black text-white tracking-wide drop-shadow">
              {tile.name}
            </h3>
          </div>
          <span className="text-[11px] font-bold text-white/90 bg-slate-950/40 px-2.5 py-0.5 rounded-full">
            {isUpgrade ? 'NÂNG CẤP CÔNG TRÌNH' : colorName}
          </span>
        </div>

        {/* Thân thẻ: Chia 2 cột */}
        <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Cột trái: Ảnh Landmark / Biểu tượng */}
          <div className="sm:col-span-5 flex flex-col items-center justify-center rounded-xl bg-slate-900/90 border border-slate-800 p-2 text-center">
            <div className="relative h-24 sm:h-28 w-full rounded-lg overflow-hidden bg-slate-950 flex items-center justify-center">
              <Image
                src={`/art/buildings/${tile.assetKey || 'house-cap-1'}.png`}
                alt={tile.name}
                fill
                sizes="160px"
                className="object-contain p-1"
                onError={(e) => {
                  (e.target as any).src = '/art/buildings/landmark-hoan-kiem.png';
                }}
              />
            </div>
            <div className="mt-1.5 text-[11px] font-bold text-amber-300 leading-tight">
              {tile.landmarkName || (isUtility ? 'Công trình năng lượng' : isTransport ? 'Đầu mối giao thông' : 'Công trình tiêu biểu')}
            </div>
            <span className="text-[9px] text-slate-400 mt-0.5">
              {isUtility ? 'Hạ tầng Quốc gia' : isTransport ? 'Mạng lưới Giao thông' : 'Cấp tối đa: Landmark'}
            </span>
          </div>

          {/* Cột phải: Giá mua & Bảng tiền thuê các cấp */}
          <div className="sm:col-span-7 flex flex-col justify-between">
            {/* Giá mua */}
            <div className="flex items-center justify-between rounded-xl bg-slate-900 px-3 py-1.5 border border-amber-500/40">
              <span className="text-xs font-bold text-slate-300">
                {isUpgrade ? 'Phí nâng cấp:' : 'Giá mua đất:'}
              </span>
              <span className="font-baloo text-base font-extrabold text-amber-400">
                {Math.round((price || 0) / 1000).toLocaleString('vi-VN')}K
                <span className="text-xs font-sans text-amber-300 ml-0.5">₫</span>
              </span>
            </div>

            {/* BẢNG TIỀN THUÊ THEO LOẠI Ô */}
            <div className="mt-2 space-y-1 rounded-xl bg-slate-900/60 p-2 border border-slate-800 text-[11px]">
              {isUtility ? (
                <>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>• Sở hữu 1 Nhà máy:</span>
                    <span className="font-mono font-bold text-slate-200">
                      {Math.round((rentList[0] || 20000) / 1000).toLocaleString('vi-VN')}K₫
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-800 pt-1 font-bold text-amber-300">
                    <span>⚡ Sở hữu trọn bộ 2 Nhà máy:</span>
                    <span className="font-mono text-amber-400 font-extrabold">
                      {Math.round((rentList[1] || 50000) / 1000).toLocaleString('vi-VN')}K₫
                    </span>
                  </div>
                </>
              ) : isTransport ? (
                <>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>• 1 Bến / Ga:</span>
                    <span className="font-mono text-slate-200">
                      {Math.round((rentList[0] || 25000) / 1000).toLocaleString('vi-VN')}K₫
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>• 2 Bến ~ 3 Bến:</span>
                    <span className="font-mono text-emerald-400">
                      {Math.round((rentList[1] || 50000) / 1000).toLocaleString('vi-VN')}K ~ {Math.round((rentList[2] || 100000) / 1000).toLocaleString('vi-VN')}K₫
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-800 pt-1 font-bold text-amber-300">
                    <span>🚂 Trọn bộ 4 Bến Giao Thông:</span>
                    <span className="font-mono text-amber-400 font-extrabold">
                      {Math.round((rentList[3] || 200000) / 1000).toLocaleString('vi-VN')}K₫
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>• Đất trống:</span>
                    <span className="font-mono font-bold text-slate-200">
                      {Math.round((rentList[0] || 10000) / 1000).toLocaleString('vi-VN')}K₫
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>• 1 Nhà ~ 2 Nhà:</span>
                    <span className="font-mono text-emerald-400">
                      {Math.round((rentList[1] || 50000) / 1000).toLocaleString('vi-VN')}K ~ {Math.round((rentList[2] || 150000) / 1000).toLocaleString('vi-VN')}K₫
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>• 3 Nhà ~ 4 Nhà:</span>
                    <span className="font-mono text-emerald-300">
                      {Math.round((rentList[3] || 450000) / 1000).toLocaleString('vi-VN')}K ~ {Math.round((rentList[4] || 800000) / 1000).toLocaleString('vi-VN')}K₫
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-800 pt-1 font-bold text-amber-300">
                    <span>👑 Landmark tối đa:</span>
                    <span className="font-mono text-amber-400 font-extrabold">
                      {Math.round((rentList[5] || 1200000) / 1000).toLocaleString('vi-VN')}K₫
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Hàng 2 Nút hành động: Mua Ngay & Bỏ Qua (Tối thiểu 44px) */}
        <div className="flex items-center gap-2 p-3 bg-slate-900/80 border-t border-slate-800">
          <button
            onClick={onSkip}
            className="flex-1 min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <X className="h-4 w-4" />
            <span>BỎ QUA</span>
          </button>

          <button
            onClick={onBuy}
            disabled={!canAfford}
            className={`flex-1 min-h-[44px] rounded-xl font-baloo text-sm font-black transition active:scale-95 cursor-pointer flex items-center justify-center gap-2 shadow-lg ${
              canAfford
                ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 hover:brightness-110 text-slate-950 border-2 border-amber-300 shadow-amber-500/30'
                : 'bg-slate-800 border border-slate-700 text-slate-500 cursor-not-allowed opacity-60'
            }`}
          >
            <Coins className="h-4 w-4" />
            <span>{isUpgrade ? 'NÂNG CẤP NGAY' : 'MUA NGAY'}</span>
            {!canAfford && <span className="text-[10px] font-sans font-normal">(Không đủ tiền)</span>}
          </button>
        </div>
      </div>
    </div>
  );
};

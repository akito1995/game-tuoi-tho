'use client';

import React from 'react';
import Image from 'next/image';
import { Tile, COLOR_GROUP_HEX, COLOR_GROUP_VIETNAMESE, BUILDING_COSTS, RENT_RATES } from '../../game/types';
import { Building, Coins, ShieldCheck, X, Train, Zap, Flame } from 'lucide-react';
import { formatMoney } from '../utils/formatMoney';

interface TilePurchaseCardProps {
  tile: Tile;
  playerMoney: number;
  onBuy: () => void;
  onSkip: () => void;
  isUpgrade?: boolean;
  isTakeover?: boolean;
  sellerName?: string;
  roundCount?: number;
}

export const TilePurchaseCard: React.FC<TilePurchaseCardProps> = ({
  tile,
  playerMoney,
  onBuy,
  onSkip,
  isUpgrade = false,
  isTakeover = false,
  sellerName,
  roundCount = 1,
}) => {
  const colorHex = tile.colorGroup ? COLOR_GROUP_HEX[tile.colorGroup] || '#A0673F' : '#A0673F';
  const colorName = tile.colorGroup ? COLOR_GROUP_VIETNAMESE[tile.colorGroup] || 'Di sản văn hoá' : 'Đất công';

  const costs = tile.colorGroup ? BUILDING_COSTS[tile.colorGroup] : { houseCost: 50000, landmarkCost: 100000 };
  const houseCost = costs?.houseCost || 50000;
  const landmarkCost = costs?.landmarkCost || 100000;

  // Giá tính toán
  let displayPrice = tile.price || 100000;
  let actionTitle = 'MUA NGAY';
  let bannerTitle = colorName;

  if (isTakeover) {
    const totalInv = tile.investmentCost || (tile.price || 100000);
    displayPrice = Math.round(1.5 * totalInv);
    actionTitle = 'MUA LẠI (1.5×)';
    bannerTitle = `CƯỚP ĐẤT TỪ ${sellerName || 'ĐỐI THỦ'}`;
  } else if (isUpgrade) {
    displayPrice = (tile.houseCount || 0) >= 4 ? landmarkCost : houseCost;
    actionTitle = (tile.houseCount || 0) >= 4 ? 'KHÁNH THÀNH LANDMARK' : 'NÂNG CẤP NHÀ';
    bannerTitle = 'NÂNG CẤP CÔNG TRÌNH';
  } else {
    // Mua ô mới: Vòng 1 chỉ mua đất; Từ vòng 2 mua kèm 1 nhà nếu đủ tiền
    if (roundCount >= 2 && tile.type === 'PROPERTY') {
      displayPrice = (tile.price || 100000) + houseCost;
      actionTitle = 'MUA ĐẤT + 1 NHÀ';
    } else {
      displayPrice = tile.price || 100000;
      actionTitle = 'MUA ĐẤT TRỐNG';
    }
  }

  const canAfford = playerMoney >= displayPrice;
  const isUtility = tile.type === 'UTILITY';
  const isTransport = tile.type === 'TRANSPORT';
  const P = tile.price || 100000;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center sm:items-end sm:pb-6 p-4 bg-slate-950/70 backdrop-blur-md pointer-events-auto select-none animate-in fade-in duration-200">
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-2xl bg-slate-950 border-2 border-amber-500/70 shadow-[0_25px_60px_rgba(0,0,0,0.95)] overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Banner màu nhóm di sản trên cùng */}
        <div
          className="flex items-center justify-between px-4 py-2 border-b-2 border-amber-400/40"
          style={{ backgroundColor: isTakeover ? '#DC2626' : colorHex }}
        >
          <div className="flex items-center gap-2">
            <span className="rounded bg-slate-950/40 px-2 py-0.5 text-xs font-mono font-bold text-white">
              Ô #{tile.id}
            </span>
            <h3 className="font-baloo text-base sm:text-lg font-black text-white tracking-wide drop-shadow">
              {tile.name}
            </h3>
          </div>
          <span className="text-[11px] font-bold text-white/90 bg-slate-950/40 px-2.5 py-0.5 rounded-full flex items-center gap-1">
            {isTakeover && <Flame className="h-3 w-3 text-amber-300 animate-pulse" />}
            <span>{bannerTitle}</span>
          </span>
        </div>

        {/* Thân thẻ: Chia 2 cột */}
        <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Cột trái: Ảnh Landmark / Biểu tượng */}
          <div className="sm:col-span-5 flex flex-col items-center justify-center rounded-xl bg-slate-900 border border-slate-800 p-2 text-center">
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
                {isTakeover ? 'Giá mua lại (1.5×):' : isUpgrade ? 'Phí nâng cấp:' : 'Chi phí:'}
              </span>
              <span className="font-baloo text-base font-extrabold text-amber-400">
                {formatMoney(displayPrice)}
                <span className="text-xs font-sans text-amber-300 ml-0.5">₫</span>
              </span>
            </div>

            {/* BẢNG TIỀN THUÊ THEO LOẠI Ô */}
            <div className="mt-2 space-y-1 rounded-xl bg-slate-900 p-2 border border-slate-800 text-[11px]">
              {isUtility ? (
                <>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1 font-medium">
                      <Zap className="h-3 w-3 text-amber-400" /> Sở hữu 1 trạm:
                    </span>
                    <span className="font-mono font-bold text-emerald-400">Tổng xúc xắc × 10.000₫</span>
                  </div>
                  <div className="flex items-center justify-between font-bold text-amber-300 border-t border-slate-800 pt-1">
                    <span className="flex items-center gap-1">
                      <Zap className="h-3 w-3 text-amber-400" /> Trọn bộ 2 trạm:
                    </span>
                    <span className="font-mono font-extrabold text-amber-400">Tổng xúc xắc × 25.000₫</span>
                  </div>
                  <div className="text-[10px] text-stone-300 pt-1 border-t border-slate-800 leading-tight">
                    💡 <em>Ví dụ:</em> Đổ 7 điểm → Tiền thuê 70K₫ (hoặc 175K₫ nếu đủ cả 2 trạm Thủy điện & Nhiệt điện).
                  </div>
                </>
              ) : isTransport ? (
                <>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>• 1 ga / 2 ga:</span>
                    <span className="font-mono text-emerald-400">25K ~ 50K₫</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>• 3 ga / 4 ga:</span>
                    <span className="font-mono text-emerald-300">100K ~ 200K₫</span>
                  </div>
                  <div className="text-[10px] text-amber-400/90 pt-1 border-t border-slate-800">
                    ✈️ Dừng ở ga của mình: trả 50K bay tới ga khác
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>• Đất trống (10% P):</span>
                    <span className="font-mono font-bold text-slate-200">
                      {formatMoney(P * RENT_RATES.EMPTY)}₫
                      <span className="text-[9px] text-amber-400 ml-1">(đủ màu {formatMoney(P * RENT_RATES.EMPTY_MONOPOLY)})</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>• 1 Nhà ~ 2 Nhà (50% ~ 130%):</span>
                    <span className="font-mono text-emerald-400">
                      {formatMoney(P * RENT_RATES.HOUSE_1)} ~ {formatMoney(P * RENT_RATES.HOUSE_2)}₫
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>• 3 Nhà ~ 4 Nhà (250% ~ 350%):</span>
                    <span className="font-mono text-emerald-300">
                      {formatMoney(P * RENT_RATES.HOUSE_3)} ~ {formatMoney(P * RENT_RATES.HOUSE_4)}₫
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-800 pt-1 font-bold text-amber-300">
                    <span>👑 Landmark (500% P):</span>
                    <span className="font-mono text-amber-400 font-extrabold">
                      {formatMoney(P * RENT_RATES.LANDMARK)}₫
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Hàng 2 Nút hành động (Tối thiểu 44px) */}
        <div className="flex items-center gap-2 p-3 bg-slate-900 border-t border-slate-800">
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
                ? isTakeover
                  ? 'bg-gradient-to-r from-red-500 via-rose-600 to-amber-500 hover:brightness-110 text-white border-2 border-red-300 shadow-red-500/30'
                  : 'bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 hover:brightness-110 text-slate-950 border-2 border-amber-300 shadow-amber-500/30'
                : 'bg-slate-800 border border-slate-700 text-slate-500 cursor-not-allowed opacity-60'
            }`}
          >
            <Coins className="h-4 w-4" />
            <span>{actionTitle}</span>
            {!canAfford && <span className="text-[10px] font-sans font-normal">(Không đủ tiền)</span>}
          </button>
        </div>
      </div>
    </div>
  );
};

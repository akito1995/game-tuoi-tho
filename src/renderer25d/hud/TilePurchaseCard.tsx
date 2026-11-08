'use client';

import React from 'react';
import Image from 'next/image';
import { Tile, COLOR_GROUP_HEX, COLOR_GROUP_VIETNAMESE, BUILDING_COSTS } from '../../game/types';
import { RENT_RULES } from '../../game/gameConfig';
import { Building, Coins, X, Zap, Flame, ShieldAlert } from 'lucide-react';
import { formatMoney } from '../utils/formatMoney';

interface TilePurchaseCardProps {
  tile: Tile;
  playerMoney: number;
  onBuy: (withHouse?: boolean) => void;
  onSkip: () => void;
  isUpgrade?: boolean;
  isTakeover?: boolean;
  sellerName?: string;
  roundCount?: number;
  lastRentAmount?: number;
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
  lastRentAmount,
}) => {
  const colorHex = tile.colorGroup ? COLOR_GROUP_HEX[tile.colorGroup] || '#A0673F' : '#A0673F';
  const colorName = tile.colorGroup ? COLOR_GROUP_VIETNAMESE[tile.colorGroup] || 'Di sản văn hoá' : 'Đất công';

  const costs = tile.colorGroup ? BUILDING_COSTS[tile.colorGroup] : { houseCost: 50000, landmarkCost: 100000 };
  const houseCost = costs?.houseCost || 50000;
  const landmarkCost = costs?.landmarkCost || 100000;

  const P = tile.price || 100000;
  const landPrice = P;
  const withHousePrice = landPrice + houseCost;

  let takeoverPrice = 0;
  if (isTakeover) {
    const totalInv = tile.investmentCost || P;
    takeoverPrice = Math.round(1.5 * totalInv);
  }
  const upgradePrice = (tile.houseCount || 0) >= 4 ? landmarkCost : houseCost;

  const isUtility = tile.type === 'UTILITY';
  const isTransport = tile.type === 'TRANSPORT';
  const isRegularProperty = tile.type === 'PROPERTY' && !isUpgrade && !isTakeover;

  const canAffordLand = playerMoney >= landPrice;
  const canAffordHouse = playerMoney >= withHousePrice;
  const canAffordUpgrade = playerMoney >= upgradePrice;
  const canAffordTakeover = playerMoney >= takeoverPrice;

  let bannerTitle = colorName;
  if (isTakeover) {
    bannerTitle = `CƯỚP ĐẤT TỪ ${sellerName || 'ĐỐI THỦ'}`;
  } else if (isUpgrade) {
    bannerTitle = (tile.houseCount || 0) >= 4 ? 'KHÁNH THÀNH LANDMARK' : 'NÂNG CẤP NHÀ';
  }

  return (
    // Lớp nền đen 40% không blur để người chơi vẫn nhìn rõ bàn cờ và quân cờ
    <div className="fixed inset-0 z-50 flex items-center justify-center sm:items-end sm:pb-6 p-4 bg-black/40 pointer-events-auto select-none animate-in fade-in duration-150">
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-2xl bg-[#24140a] border-2 border-[#C9A227] shadow-[0_20px_50px_rgba(0,0,0,0.9)] overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Banner màu nhóm di sản trên cùng */}
        <div
          className="flex items-center justify-between px-4 py-2 border-b-2 border-amber-400/40"
          style={{ backgroundColor: isTakeover ? '#DC2626' : colorHex }}
        >
          <div className="flex items-center gap-2">
            <span className="rounded bg-black/40 px-2 py-0.5 text-xs font-mono font-bold text-white">
              Ô #{tile.id}
            </span>
            <h3 className="font-baloo text-base sm:text-lg font-black text-white tracking-wide drop-shadow">
              {tile.name}
            </h3>
          </div>
          <span className="text-[11px] font-bold text-white/90 bg-black/40 px-2.5 py-0.5 rounded-full flex items-center gap-1">
            {isTakeover && <Flame className="h-3 w-3 text-amber-300 animate-pulse" />}
            <span>{bannerTitle}</span>
          </span>
        </div>

        {/* Thân thẻ: Chia 2 cột */}
        <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Cột trái: Ảnh Landmark / Biểu tượng */}
          <div className="sm:col-span-5 flex flex-col items-center justify-center rounded-xl bg-[#2A170C] border border-[#6B4226] p-2 text-center">
            <div className="relative h-24 sm:h-28 w-full rounded-lg overflow-hidden bg-black/30 flex items-center justify-center">
              <Image
                src={`/art/buildings/${tile.assetKey || 'house-1'}.png`}
                alt={tile.name}
                fill
                sizes="160px"
                className="object-contain p-1"
                onError={(e) => {
                  (e.target as any).src = '/art/buildings/landmark-ha-noi.png';
                }}
              />
            </div>
            <div className="mt-1.5 text-[11px] font-bold text-amber-300 leading-tight">
              {tile.landmarkName || (isUtility ? 'Công trình năng lượng' : isTransport ? 'Đầu mối giao thông' : 'Công trình tiêu biểu')}
            </div>
            <span className="text-[9px] text-[#F3E6C8]/70 mt-0.5">
              {isUtility ? 'Hạ tầng Quốc gia' : isTransport ? 'Mạng lưới Giao thông' : 'Cấp tối đa: Landmark'}
            </span>
          </div>

          {/* Cột phải: Thông tin giá & Bảng tiền thuê theo RENT_RULES */}
          <div className="sm:col-span-7 flex flex-col justify-between">
            {/* THÔNG TIN CƯỚP ĐẤT / TRẢ THUÊ */}
            {isTakeover ? (
              <div className="rounded-xl bg-red-950/80 border border-red-500/60 p-2.5 mb-1.5 text-xs">
                <div className="flex items-center justify-between text-rose-300 font-bold mb-1">
                  <span className="flex items-center gap-1">
                    <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
                    Đã trả thuê:
                  </span>
                  <span className="font-mono text-rose-200 font-black">
                    -{formatMoney(lastRentAmount ?? Math.round(P * RENT_RULES.EMPTY_LAND_RATIO))}₫
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-300 border-t border-red-900/80 pt-1 text-[11px]">
                  <span>Số dư: <strong className="text-white font-mono">{formatMoney(playerMoney)}₫</strong></span>
                  <span className="text-amber-300 font-bold">
                    → sau mua: <strong className="font-mono text-amber-200">{formatMoney(playerMoney - takeoverPrice)}₫</strong>
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-xl bg-[#2A170C] px-3 py-1.5 border border-[#C9A227]/50">
                <span className="text-xs font-bold text-[#F3E6C8]">
                  {isUpgrade ? 'Phí nâng cấp:' : 'Giá mua đất (P):'}
                </span>
                <span className="font-baloo text-base font-extrabold text-amber-300">
                  {formatMoney(isUpgrade ? upgradePrice : landPrice)}
                  <span className="text-xs font-sans text-amber-400 ml-0.5">₫</span>
                </span>
              </div>
            )}

            {/* BẢNG TIỀN THUÊ QUY CHUẨN (RENT_RULES) */}
            <div className="mt-1.5 space-y-1 rounded-xl bg-[#2A170C] p-2 border border-[#6B4226] text-[11px]">
              {isUtility ? (
                <>
                  <div className="flex items-center justify-between text-[#F3E6C8]">
                    <span className="flex items-center gap-1 font-medium">
                      <Zap className="h-3 w-3 text-amber-400" /> Sở hữu 1 trạm:
                    </span>
                    <span className="font-mono font-bold text-emerald-300">Xúc xắc × 10.000₫</span>
                  </div>
                  <div className="flex items-center justify-between font-bold text-amber-300 border-t border-[#6B4226] pt-1">
                    <span className="flex items-center gap-1">
                      <Zap className="h-3 w-3 text-amber-400" /> Trọn bộ 2 trạm:
                    </span>
                    <span className="font-mono font-extrabold text-amber-300">Xúc xắc × 25.000₫</span>
                  </div>
                  <div className="text-[10px] text-[#F3E6C8]/70 pt-1 border-t border-[#6B4226] leading-tight">
                    💡 <em>Ví dụ:</em> Đổ 7 điểm → Trả 70K₫ (hoặc 175K₫ nếu đủ cả 2 trạm).
                  </div>
                </>
              ) : isTransport ? (
                <>
                  <div className="flex items-center justify-between text-[#F3E6C8]/80">
                    <span>• 1 ga / 2 ga:</span>
                    <span className="font-mono text-emerald-300">25K ~ 50K₫</span>
                  </div>
                  <div className="flex items-center justify-between text-[#F3E6C8]/80">
                    <span>• 3 ga / 4 ga:</span>
                    <span className="font-mono text-emerald-300">100K ~ 200K₫</span>
                  </div>
                  <div className="text-[10px] text-amber-300/90 pt-1 border-t border-[#6B4226]">
                    ✈️ Dừng ở ga của mình: trả 50K bay thẳng tới ga khác
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between text-[#F3E6C8]">
                    <span>• Đất trống (10% P):</span>
                    <span className="font-mono font-bold text-[#F3E6C8]">
                      {formatMoney(P * RENT_RULES.EMPTY_LAND_RATIO)}₫
                      <span className="text-[9px] text-amber-400 ml-1">(đủ màu {formatMoney(P * RENT_RULES.EMPTY_LAND_MONOPOLY_RATIO)}₫)</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[#F3E6C8]/80">
                    <span>• 1 Nhà ~ 2 Nhà:</span>
                    <span className="font-mono text-emerald-300">
                      {formatMoney(P * RENT_RULES.HOUSE_1_RATIO)} ~ {formatMoney(P * RENT_RULES.HOUSE_2_RATIO)}₫
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[#F3E6C8]/80">
                    <span>• 3 Nhà ~ 4 Nhà:</span>
                    <span className="font-mono text-emerald-300">
                      {formatMoney(P * RENT_RULES.HOUSE_3_RATIO)} ~ {formatMoney(P * RENT_RULES.HOUSE_4_RATIO)}₫
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-[#6B4226] pt-1 font-bold text-amber-300">
                    <span>👑 Landmark (500% P):</span>
                    <span className="font-mono text-amber-300 font-extrabold">
                      {formatMoney(P * RENT_RULES.LANDMARK_RATIO)}₫
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* HÀNG NÚT HÀNH ĐỘNG (TỐI THIỂU 44PX) */}
        <div className="p-3 bg-[#2A170C] border-t border-[#6B4226]">
          {isTakeover ? (
            /* ================= NÚT MUA LẠI / CƯỚP ĐẤT ================= */
            <div className="flex items-center gap-2">
              <button
                onClick={onSkip}
                className="min-h-[44px] px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <X className="h-4 w-4" />
                <span>BỎ QUA</span>
              </button>
              <button
                onClick={() => onBuy()}
                disabled={!canAffordTakeover}
                className={`flex-1 min-h-[44px] rounded-xl font-baloo text-sm font-black transition active:scale-95 flex items-center justify-center gap-2 shadow-lg ${
                  canAffordTakeover
                    ? 'bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:brightness-110 text-white border-2 border-red-300 cursor-pointer shadow-red-900/50'
                    : 'bg-slate-800 border border-slate-700 text-slate-500 cursor-not-allowed opacity-60'
                }`}
              >
                <Flame className="h-4 w-4" />
                <span>MUA LẠI 1.5× ({formatMoney(takeoverPrice)}₫)</span>
                {!canAffordTakeover && <span className="text-[10px] font-sans font-normal">(Thiếu tiền)</span>}
              </button>
            </div>
          ) : isUpgrade ? (
            /* ================= NÚT NÂNG CẤP / LANDMARK ================= */
            <div className="flex items-center gap-2">
              <button
                onClick={onSkip}
                className="min-h-[44px] px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <X className="h-4 w-4" />
                <span>BỎ QUA</span>
              </button>
              <button
                onClick={() => onBuy()}
                disabled={!canAffordUpgrade}
                className={`flex-1 min-h-[44px] rounded-xl font-baloo text-sm font-black transition active:scale-95 flex items-center justify-center gap-2 shadow-lg ${
                  canAffordUpgrade
                    ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 hover:brightness-110 text-slate-950 border-2 border-amber-300 cursor-pointer shadow-amber-500/30'
                    : 'bg-slate-800 border border-slate-700 text-slate-500 cursor-not-allowed opacity-60'
                }`}
              >
                <Building className="h-4 w-4" />
                <span>
                  {(tile.houseCount || 0) >= 4 ? 'KHÁNH THÀNH LANDMARK' : 'NÂNG CẤP NHÀ'} ({formatMoney(upgradePrice)}₫)
                </span>
                {!canAffordUpgrade && <span className="text-[10px] font-sans font-normal">(Thiếu tiền)</span>}
              </button>
            </div>
          ) : isRegularProperty && roundCount >= 2 ? (
            /* ================= TIÊU CHÍ P0 #1: 2 NÚT RIÊNG BIỆT CHO ĐẤT TRỐNG ================= */
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <button
                onClick={onSkip}
                className="w-full sm:w-auto min-h-[44px] px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <X className="h-4 w-4" />
                <span>BỎ QUA</span>
              </button>

              {/* Nút 1: Mua chỉ đất – Giá P */}
              <button
                onClick={() => onBuy(false)}
                disabled={!canAffordLand}
                className={`flex-1 w-full min-h-[44px] rounded-xl font-baloo text-xs sm:text-sm font-black transition active:scale-95 flex items-center justify-center gap-1.5 shadow-md ${
                  canAffordLand
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 text-slate-950 border border-amber-300 cursor-pointer'
                    : 'bg-slate-800 border border-slate-700 text-slate-500 cursor-not-allowed opacity-60'
                }`}
              >
                <Coins className="h-4 w-4 shrink-0" />
                <span>MUA ĐẤT – {formatMoney(landPrice)}₫</span>
                {!canAffordLand && <span className="text-[10px] font-sans font-normal">(Thiếu)</span>}
              </button>

              {/* Nút 2: Mua đất + 1 nhà – Giá P + Giá nhà */}
              <button
                onClick={() => onBuy(true)}
                disabled={!canAffordHouse}
                className={`flex-1 w-full min-h-[44px] rounded-xl font-baloo text-xs sm:text-sm font-black transition active:scale-95 flex items-center justify-center gap-1.5 shadow-md ${
                  canAffordHouse
                    ? 'bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-600 hover:brightness-110 text-slate-950 border border-emerald-300 cursor-pointer shadow-emerald-900/30'
                    : 'bg-slate-800 border border-slate-700 text-slate-500 cursor-not-allowed opacity-60'
                }`}
              >
                <Building className="h-4 w-4 shrink-0" />
                <span>MUA ĐẤT + 1 NHÀ – {formatMoney(withHousePrice)}₫</span>
                {!canAffordHouse && <span className="text-[10px] font-sans font-normal">(Thiếu)</span>}
              </button>
            </div>
          ) : (
            /* ================= MUA Ô ĐẦU TIÊN (VÒNG 1 HOẶC GA / TIỆN ÍCH) ================= */
            <div className="flex items-center gap-2">
              <button
                onClick={onSkip}
                className="min-h-[44px] px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <X className="h-4 w-4" />
                <span>BỎ QUA</span>
              </button>
              <button
                onClick={() => onBuy(false)}
                disabled={!canAffordLand}
                className={`flex-1 min-h-[44px] rounded-xl font-baloo text-sm font-black transition active:scale-95 flex items-center justify-center gap-2 shadow-lg ${
                  canAffordLand
                    ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 hover:brightness-110 text-slate-950 border-2 border-amber-300 cursor-pointer shadow-amber-500/30'
                    : 'bg-slate-800 border border-slate-700 text-slate-500 cursor-not-allowed opacity-60'
                }`}
              >
                <Coins className="h-4 w-4" />
                <span>MUA {isTransport ? 'GA' : isUtility ? 'TIỆN ÍCH' : 'ĐẤT'} ({formatMoney(landPrice)}₫)</span>
                {!canAffordLand && <span className="text-[10px] font-sans font-normal">(Không đủ tiền)</span>}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

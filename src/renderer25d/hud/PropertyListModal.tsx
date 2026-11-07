'use client';

import React, { useEffect } from 'react';
import { Player, Tile, COLOR_GROUP_HEX, BUILDING_COSTS, ColorGroup } from '../../game/types';
import { calculateTileRent } from '../../game/engine';
import { Building2, X, DollarSign, Home, RotateCcw, ShieldCheck, Tag } from 'lucide-react';

interface PropertyListModalProps {
  player: Player;
  tiles: Tile[];
  onClose: () => void;
  onSellHouse?: (tileId: number) => void;
  onMortgage?: (tileId: number) => void;
  onUnmortgage?: (tileId: number) => void;
  isOwner?: boolean;
}

const COLOR_GROUP_NAMES: Record<string, string> = {
  BROWN: 'Nâu',
  LIGHT_BLUE: 'Xanh nhạt',
  PINK: 'Hồng',
  ORANGE: 'Cam',
  RED: 'Đỏ',
  YELLOW: 'Vàng',
  GREEN: 'Xanh lá',
  DARK_BLUE: 'Xanh đậm',
  TRANSPORT: 'Giao thông (Bến xe / Sân bay)',
  UTILITY: 'Tiện ích (Điện / Nước)',
};

export const PropertyListModal: React.FC<PropertyListModalProps> = ({
  player,
  tiles,
  onClose,
  onSellHouse,
  onMortgage,
  onUnmortgage,
  isOwner = true,
}) => {
  // Lắng nghe phím Escape để đóng modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const ownedTiles = tiles.filter((t) => t.ownerId === player.id);

  // Phân nhóm bất động sản theo nhóm màu / loại
  const groupsOrder: string[] = [
    'BROWN',
    'LIGHT_BLUE',
    'PINK',
    'ORANGE',
    'RED',
    'YELLOW',
    'GREEN',
    'DARK_BLUE',
    'TRANSPORT',
    'UTILITY',
  ];

  // Gom nhóm
  const groupedProperties = groupsOrder
    .map((groupKey) => {
      let groupTiles: Tile[];
      if (groupKey === 'TRANSPORT') {
        groupTiles = tiles.filter((t) => t.type === 'TRANSPORT');
      } else if (groupKey === 'UTILITY') {
        groupTiles = tiles.filter((t) => t.type === 'UTILITY');
      } else {
        groupTiles = tiles.filter((t) => t.colorGroup === groupKey);
      }

      const ownedInGroup = groupTiles.filter((t) => t.ownerId === player.id);
      if (ownedInGroup.length === 0) return null;

      const groupName = COLOR_GROUP_NAMES[groupKey] || groupKey;
      const hexColor = (groupKey in COLOR_GROUP_HEX)
        ? COLOR_GROUP_HEX[groupKey as ColorGroup]
        : groupKey === 'TRANSPORT'
        ? '#0284c7'
        : '#eab308';

      const isMonopoly = ownedInGroup.length === groupTiles.length && groupTiles.length > 0;

      return {
        groupKey,
        groupName,
        hexColor,
        totalInBoard: groupTiles.length,
        ownedCount: ownedInGroup.length,
        isMonopoly,
        tiles: ownedInGroup,
      };
    })
    .filter((g): g is NonNullable<typeof g> => g !== null);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-3 sm:p-4 select-none pointer-events-auto backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl rounded-3xl bg-slate-900 border-2 border-amber-500/50 shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-5 py-3.5 flex items-center justify-between border-b border-amber-500/30">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-400 shadow">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-baloo text-base sm:text-lg font-black text-amber-400 uppercase tracking-wide">
                BẢNG QUẢN LÝ BẤT ĐỘNG SẢN
              </h2>
              <div className="text-[11px] text-slate-400 flex items-center gap-2">
                <span>Chủ sở hữu: <b className="text-slate-200">{player.name}</b></span>
                <span>•</span>
                <span>Đang sở hữu: <b className="text-amber-300">{ownedTiles.length}</b> ô đất</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-full bg-slate-800 p-2 text-slate-400 hover:text-white hover:bg-slate-700 transition cursor-pointer"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {ownedTiles.length === 0 ? (
            <div className="py-14 text-center text-slate-500 text-xs sm:text-sm">
              <Building2 className="h-12 w-12 mx-auto text-slate-600 mb-3 opacity-40" />
              <p className="font-bold text-slate-400">Bạn chưa sở hữu bất động sản nào.</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Hãy đổ xúc xắc và mua đất khi dừng chân trên các ô đất trống!
              </p>
            </div>
          ) : (
            groupedProperties.map((group) => (
              <div
                key={group.groupKey}
                className="rounded-2xl border border-slate-800 bg-slate-950/60 overflow-hidden shadow-sm"
              >
                {/* Tiêu đề nhóm màu & Tiến độ sở hữu nhóm */}
                <div className="px-3.5 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3.5 w-3.5 rounded-full shadow-sm"
                      style={{ backgroundColor: group.hexColor }}
                    />
                    <span className="font-baloo text-xs sm:text-sm font-bold text-white">
                      Nhóm {group.groupName}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {group.isMonopoly && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-400/50 text-amber-300 text-[10px] font-bold flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3" />
                        <span>ĐỘC QUYỀN (x2 Thuê)</span>
                      </span>
                    )}
                    <span
                      className="px-2 py-0.5 rounded-md font-mono text-[11px] font-bold border"
                      style={{
                        color: group.hexColor,
                        borderColor: `${group.hexColor}66`,
                        backgroundColor: `${group.hexColor}15`,
                      }}
                    >
                      {group.groupName} {group.ownedCount}/{group.totalInBoard}
                    </span>
                  </div>
                </div>

                {/* Danh sách các ô trong nhóm */}
                <div className="p-2 space-y-2">
                  {group.tiles.map((t) => {
                    const P = t.price || 100000;
                    const mortgageVal = Math.round(P * 0.5); // 50% giá đất
                    const unmortgageCost = Math.round(mortgageVal * 1.1); // 55% giá đất
                    const houseCost = t.colorGroup ? (BUILDING_COSTS[t.colorGroup]?.houseCost || 50000) : 50000;
                    const sellHouseRefund = Math.round(houseCost * 0.5);

                    // Tiền thuê hiện tại
                    const currentRent = t.isMortgaged ? 0 : calculateTileRent(t, tiles, 7);

                    const canSellHouse = (t.houseCount || 0) > 0 && !t.hasLandmark && isOwner && Boolean(onSellHouse);
                    const canMortgage = !t.isMortgaged && (t.houseCount || 0) === 0 && !t.hasLandmark && isOwner && Boolean(onMortgage);
                    const canUnmortgage = t.isMortgaged && isOwner && Boolean(onUnmortgage);

                    return (
                      <div
                        key={t.id}
                        className={`rounded-xl border p-2.5 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 ${
                          t.isMortgaged
                            ? 'bg-slate-950/40 border-slate-800/60 opacity-70'
                            : 'bg-slate-900/80 border-slate-800 hover:border-amber-500/30'
                        }`}
                      >
                        {/* Cột trái: Tên ô + Cấp nhà + Tiền thuê hiện tại */}
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="h-8 w-2 rounded-full shrink-0 shadow-sm"
                            style={{ backgroundColor: group.hexColor }}
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-100 text-xs sm:text-sm truncate">
                                {t.name}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">#{t.id}</span>

                              {/* Cấp nhà */}
                              {t.isMortgaged ? (
                                <span className="text-[10px] font-bold text-amber-500 bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-800/50">
                                  🏛️ Đã cầm cố
                                </span>
                              ) : t.hasLandmark ? (
                                <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-1.5 py-0.2 rounded border border-amber-500/40">
                                  🏰 Landmark
                                </span>
                              ) : (t.houseCount || 0) > 0 ? (
                                <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-1.5 py-0.2 rounded border border-emerald-500/40">
                                  🏠 Cấp {t.houseCount}
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded border border-slate-700">
                                  Đất trống
                                </span>
                              )}
                            </div>

                            {/* Tiền thuê & Giá gốc */}
                            <div className="flex items-center gap-2 mt-1 text-[11px]">
                              <span className="text-amber-300 font-mono font-bold">
                                Tiền thuê: {currentRent > 0 ? `${Math.round(currentRent / 1000).toLocaleString('vi-VN')}K₫` : '0₫'}
                              </span>
                              <span className="text-slate-500">•</span>
                              <span className="text-slate-400">
                                Giá đất: {Math.round(P / 1000)}K₫
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Cột phải: 3 Nút hành động */}
                        {isOwner && (
                          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                            {/* Nút Bán Nhà */}
                            {canSellHouse && (
                              <button
                                onClick={() => onSellHouse && onSellHouse(t.id)}
                                className="min-h-[34px] px-2.5 py-1 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 active:scale-95 text-white font-bold text-[11px] transition cursor-pointer flex items-center gap-1 shadow"
                                title={`Bán 1 nhà thu về +${Math.round(sellHouseRefund / 1000)}K₫ (50% giá xây)`}
                              >
                                <Home className="h-3 w-3" />
                                <span>Bán nhà (+{Math.round(sellHouseRefund / 1000)}K)</span>
                              </button>
                            )}

                            {/* Nút Cầm Cố Đất */}
                            {canMortgage && (
                              <button
                                onClick={() => onMortgage && onMortgage(t.id)}
                                className="min-h-[34px] px-2.5 py-1 rounded-xl bg-amber-600/90 hover:bg-amber-500 active:scale-95 text-slate-950 font-bold text-[11px] transition cursor-pointer flex items-center gap-1 shadow"
                                title={`Cầm cố nhận ngay +${Math.round(mortgageVal / 1000)}K₫ (50% giá đất)`}
                              >
                                <DollarSign className="h-3 w-3" />
                                <span>Cầm cố (+{Math.round(mortgageVal / 1000)}K)</span>
                              </button>
                            )}

                            {/* Nút Chuộc Đất */}
                            {canUnmortgage && (
                              <button
                                onClick={() => onUnmortgage && onUnmortgage(t.id)}
                                disabled={player.money < unmortgageCost}
                                className={`min-h-[34px] px-2.5 py-1 rounded-xl font-bold text-[11px] transition flex items-center gap-1 shadow ${
                                  player.money >= unmortgageCost
                                    ? 'bg-sky-600 hover:bg-sky-500 active:scale-95 text-white cursor-pointer'
                                    : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                                }`}
                                title={`Chuộc lại với chi phí ${Math.round(unmortgageCost / 1000)}K₫ (giá cầm cố + 10%)`}
                              >
                                <RotateCcw className="h-3 w-3" />
                                <span>Chuộc lại (-{Math.round(unmortgageCost / 1000)}K)</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-5 py-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>
            * Cầm cố nhận 50% giá đất (ngưng thu tiền thuê). Chuộc lại = Giá cầm cố + 10% tiền lãi.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold cursor-pointer transition active:scale-95"
          >
            ĐÓNG (ESC)
          </button>
        </div>
      </div>
    </div>
  );
};

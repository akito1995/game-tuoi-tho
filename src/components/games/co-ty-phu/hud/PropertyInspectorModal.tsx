'use client';

import React from 'react';
import { useGameStore } from '@/lib/game-engine/gameStore';
import { COLOR_GROUP_PALETTE } from '../board-3d/BoardTiles3D';
import { X, MapPin, Building2, User, Sparkles, ShieldCheck } from 'lucide-react';

interface PropertyInspectorModalProps {
  tileId: number | null;
  onClose: () => void;
}

export function PropertyInspectorModal({ tileId, onClose }: PropertyInspectorModalProps) {
  const tiles = useGameStore((s) => s.tiles);
  const players = useGameStore((s) => s.players);

  if (tileId === null) return null;
  const tile = tiles[tileId];
  if (!tile) return null;

  const owner = tile.ownerId ? players.find((p) => p.id === tile.ownerId) : null;
  const colorHex = tile.colorGroup ? COLOR_GROUP_PALETTE[tile.colorGroup] : '#64748b';
  const isSpecial = tile.type !== 'PROPERTY';

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/40 backdrop-blur-sm animate-fade-in pointer-events-auto">
      {/* Tap backdrop to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Slide-Up Inspector Card */}
      <div className="relative w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-slate-900 border border-slate-700/80 p-5 sm:p-6 text-white shadow-2xl animate-slide-up overflow-hidden">
        {/* Color Group Header Bar */}
        <div
          className="absolute top-0 inset-x-0 h-3.5 shadow-md"
          style={{ backgroundColor: colorHex }}
        />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full bg-slate-800 p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Title & Region */}
        <div className="mt-1 flex items-start gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-inner text-xl"
            style={{ backgroundColor: `${colorHex}25`, color: colorHex }}
          >
            <MapPin className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                Ô số {tile.id}
              </span>
              {tile.colorGroup && (
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: `${colorHex}30`, color: colorHex }}
                >
                  {tile.colorGroup}
                </span>
              )}
            </div>
            <h3 className="text-lg sm:text-xl font-black text-slate-100 tracking-tight mt-0.5">
              {tile.name}
            </h3>
          </div>
        </div>

        {/* Pricing & Owner Bar */}
        <div className="my-4 grid grid-cols-2 gap-3 rounded-2xl bg-slate-800/60 p-3.5 border border-slate-700/50">
          <div>
            <p className="text-xs text-slate-400">Giá mua đất:</p>
            <p className="text-base sm:text-lg font-black text-amber-400">
              {tile.price ? `${tile.price.toLocaleString('vi-VN')}đ` : 'Không bán'}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Chủ sở hữu:</p>
            <div className="flex items-center gap-1.5 text-slate-200 mt-0.5">
              <User className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-bold truncate">
                {owner ? owner.name : 'Đang trống'}
              </span>
            </div>
          </div>
        </div>

        {/* Rent Hierarchy Table */}
        {tile.type === 'PROPERTY' && tile.rentMultiplier && (
          <div className="rounded-2xl bg-slate-950/60 p-3 border border-slate-800 space-y-1.5 text-xs sm:text-sm">
            <div className="flex justify-between text-slate-400 font-semibold border-b border-slate-800 pb-1">
              <span>Cấp độ bất động sản</span>
              <span>Tiền thuê thu về</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span>Đất trống</span>
              <span className="font-bold text-amber-300">
                {(tile.baseRent || 0).toLocaleString('vi-VN')}đ
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span>🏠 Nhà cấp 1</span>
              <span className="font-bold text-amber-300">
                {(tile.rentMultiplier[1] || 0).toLocaleString('vi-VN')}đ
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span>🏡 Nhà cấp 2</span>
              <span className="font-bold text-amber-300">
                {(tile.rentMultiplier[2] || 0).toLocaleString('vi-VN')}đ
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span>🏰 Biệt thự mini</span>
              <span className="font-bold text-amber-300">
                {(tile.rentMultiplier[3] || 0).toLocaleString('vi-VN')}đ
              </span>
            </div>
            <div className="flex justify-between items-center text-emerald-300 font-bold bg-emerald-950/40 px-1.5 py-0.5 rounded">
              <span>🏖️ Siêu Resort nghỉ dưỡng</span>
              <span>{(tile.rentMultiplier[4] || 0).toLocaleString('vi-VN')}đ</span>
            </div>
          </div>
        )}

        {/* Monopoly x2 Note */}
        {tile.type === 'PROPERTY' && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-amber-500/10 px-3 py-2 text-xs text-amber-300 border border-amber-500/20">
            <Sparkles className="h-4 w-4 shrink-0 text-amber-400" />
            <span>
              <strong>Hiệu ứng độc quyền:</strong> Sở hữu trọn bộ vùng {tile.colorGroup} sẽ được <strong>nhân đôi (x2)</strong> tiền thuê đất!
            </span>
          </div>
        )}

        {/* Special Tile Details */}
        {isSpecial && (
          <div className="mt-3 rounded-2xl bg-slate-800/60 p-3 text-xs sm:text-sm text-slate-300 space-y-1">
            <p className="font-semibold text-amber-300 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4" /> Ô Sự Kiện Đặc Biệt
            </p>
            <p className="text-slate-400">
              {tile.id === 0 && 'Nhận ngay +200.000đ lương thưởng mỗi khi đi qua hoặc dừng tại đây!'}
              {tile.id === 8 && 'Khu tạm giữ. Nộp 100k bảo lãnh hoặc đổ đôi để được thả tự do.'}
              {tile.id === 16 && 'Khu nghỉ chân an toàn. Người chơi đến đây sẽ ẵm trọn Quỹ Heo Đất Jackpot!'}
              {tile.id === 24 && 'Bị bắt vì đi bão vi phạm giao thông! Lập tức bị áp giải về Trại giam.'}
              {(tile.type === 'CHANCE' || tile.type === 'FATE') && 'Rút 1 lá bài may rủi với nhiều phần thưởng hoặc thử thách tuổi thơ hài hước!'}
              {tile.type === 'TRANSPORT' && 'Bến xe & Sân bay kết nối giao thương. Sở hữu càng nhiều trạm tiền vé càng cao!'}
              {tile.type === 'UTILITY' && 'Nhà máy điện nước cung cấp tiện ích cho toàn bàn cờ.'}
            </p>
          </div>
        )}

        {/* Close CTA */}
        <button
          onClick={onClose}
          className="mt-4 w-full rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 py-2.5 text-center font-bold text-slate-950 hover:from-amber-400 hover:to-amber-500 active:scale-95 transition shadow-lg"
        >
          Đóng Thông Tin
        </button>
      </div>
    </div>
  );
}

export default PropertyInspectorModal;

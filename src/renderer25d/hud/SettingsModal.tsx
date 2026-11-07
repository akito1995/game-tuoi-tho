'use client';

import React, { useEffect } from 'react';
import { GameSpeed } from '../gameV2Bridge';
import { Settings, X, Zap, Sliders, Bot, Monitor, Camera, RotateCcw, Gavel } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameSpeed: GameSpeed;
  onChangeSpeed: (speed: GameSpeed) => void;
  graphicsQuality: 'LOW' | 'MEDIUM' | 'HIGH';
  onChangeQuality: (q: 'LOW' | 'MEDIUM' | 'HIGH') => void;
  isAutoBot: boolean;
  onToggleAutoBot: () => void;
  auctionOnSkip?: boolean;
  onToggleAuctionOnSkip?: () => void;
  cameraMode?: 'OVERVIEW' | 'FOLLOW';
  onChangeCameraMode?: (mode: 'OVERVIEW' | 'FOLLOW') => void;
  onOpenCalibration?: () => void;
  onOpenLobby?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  gameSpeed,
  onChangeSpeed,
  graphicsQuality,
  onChangeQuality,
  isAutoBot,
  onToggleAutoBot,
  auctionOnSkip = false,
  onToggleAuctionOnSkip,
  cameraMode = 'OVERVIEW',
  onChangeCameraMode,
  onOpenCalibration,
  onOpenLobby,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 select-none pointer-events-auto backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-3xl bg-slate-950 border-2 border-amber-500/50 p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Nút đóng */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 h-11 w-11 min-h-[44px] min-w-[44px] rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition flex items-center justify-center cursor-pointer"
          aria-label="Đóng cài đặt"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Tiêu đề */}
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
          <Settings className="h-5 w-5 text-amber-400" />
          <h2 className="font-baloo text-lg font-bold text-white tracking-wide uppercase">
            CÀI ĐẶT TRÒ CHƠI
          </h2>
        </div>

        <div className="space-y-4 text-xs">
          {/* Tốc độ ván đấu */}
          <div className="rounded-2xl bg-slate-900/80 p-3 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-amber-400" />
                <span>Tốc độ di chuyển & ván đấu:</span>
              </span>
              <span className="font-mono font-bold text-amber-400">{gameSpeed}x</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {([1, 2, 4] as const).map((spd) => (
                <button
                  key={spd}
                  onClick={() => onChangeSpeed(spd)}
                  className={`min-h-[44px] rounded-xl font-baloo text-sm font-bold transition flex items-center justify-center cursor-pointer ${
                    gameSpeed === spd
                      ? 'bg-amber-500 text-slate-950 border-2 border-amber-300 shadow-md shadow-amber-500/20'
                      : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
                  }`}
                >
                  {spd}x {spd === 1 ? '(Chuẩn)' : spd === 2 ? '(Nhanh)' : '(Siêu tốc)'}
                </button>
              ))}
            </div>
          </div>

          {/* Chất lượng đồ họa */}
          <div className="rounded-2xl bg-slate-900/80 p-3 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Monitor className="h-4 w-4 text-cyan-400" />
                <span>Chất lượng hình ảnh & hiệu ứng:</span>
              </span>
              <span className="font-mono font-bold text-cyan-400">{graphicsQuality}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { key: 'LOW', label: 'Thấp (60 FPS)' },
                  { key: 'MEDIUM', label: 'TB' },
                  { key: 'HIGH', label: 'Cao (Đẹp)' },
                ] as const
              ).map((q) => (
                <button
                  key={q.key}
                  onClick={() => onChangeQuality(q.key)}
                  className={`min-h-[44px] rounded-xl font-baloo text-xs sm:text-sm font-bold transition flex items-center justify-center cursor-pointer ${
                    graphicsQuality === q.key
                      ? 'bg-cyan-600 text-white border-2 border-cyan-300 shadow-md shadow-cyan-600/30'
                      : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
                  }`}
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chế độ Camera */}
          <div className="rounded-2xl bg-slate-900/80 p-3 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Camera className="h-4 w-4 text-emerald-400" />
                <span>Góc quay Camera:</span>
              </span>
              <span className="font-mono font-bold text-emerald-400">
                {cameraMode === 'OVERVIEW' ? 'Toàn cảnh' : 'Theo quân cờ'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onChangeCameraMode?.('OVERVIEW')}
                className={`min-h-[44px] rounded-xl font-baloo text-xs sm:text-sm font-bold transition flex items-center justify-center cursor-pointer ${
                  cameraMode === 'OVERVIEW'
                    ? 'bg-emerald-600 text-white border-2 border-emerald-300 shadow-md shadow-emerald-600/30'
                    : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
                }`}
              >
                Toàn cảnh (Mặc định)
              </button>
              <button
                onClick={() => onChangeCameraMode?.('FOLLOW')}
                className={`min-h-[44px] rounded-xl font-baloo text-xs sm:text-sm font-bold transition flex items-center justify-center cursor-pointer ${
                  cameraMode === 'FOLLOW'
                    ? 'bg-emerald-600 text-white border-2 border-emerald-300 shadow-md shadow-emerald-600/30'
                    : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
                }`}
              >
                Theo quân cờ
              </button>
            </div>
          </div>

          {/* Bot tự đấu */}
          <div className="rounded-2xl bg-slate-900/80 p-3 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-200 flex items-center gap-1.5">
                <Bot className="h-4 w-4 text-sky-400" />
                <span>Chế độ Bot tự động đấu:</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Bot sẽ tự động đổ xúc xắc và mua đất thay bạn
              </p>
            </div>
            <button
              onClick={onToggleAutoBot}
              className={`min-h-[44px] px-4 rounded-xl font-bold transition cursor-pointer border ${
                isAutoBot
                  ? 'bg-sky-600 text-white border-sky-400 shadow-md shadow-sky-600/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              {isAutoBot ? 'ĐANG BẬT' : 'ĐANG TẮT'}
            </button>
          </div>

          {/* Đấu giá khi bỏ qua mua đất */}
          {onToggleAuctionOnSkip && (
            <div className="rounded-2xl bg-slate-900/80 p-3 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Gavel className="h-4 w-4 text-amber-400" />
                  <span>Đấu giá khi bỏ qua:</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Mở đấu giá 10s giữa các người chơi khi chọn bỏ qua
                </p>
              </div>
              <button
                onClick={onToggleAuctionOnSkip}
                className={`min-h-[44px] px-4 rounded-xl font-bold transition cursor-pointer border ${
                  auctionOnSkip
                    ? 'bg-amber-600 text-white border-amber-400 shadow-md shadow-amber-600/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                {auctionOnSkip ? 'ĐANG BẬT' : 'ĐANG TẮT'}
              </button>
            </div>
          )}

          {/* Phím F2 hoặc mở lại Sảnh */}
          <div className="flex items-center gap-2 pt-2">
            {onOpenCalibration && (
              <button
                onClick={() => {
                  onClose();
                  onOpenCalibration();
                }}
                className="flex-1 min-h-[44px] rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 font-bold transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer text-xs"
              >
                <Sliders className="h-4 w-4 text-purple-400" />
                <span>Hiệu chỉnh (F2)</span>
              </button>
            )}

            {onOpenLobby && (
              <button
                onClick={() => {
                  onClose();
                  onOpenLobby();
                }}
                className="flex-1 min-h-[44px] rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer text-xs"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Mở Sảnh Trận Mới</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

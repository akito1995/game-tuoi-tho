'use client';

import React, { useState } from 'react';
import { Flag, Settings, AlertTriangle, X } from 'lucide-react';

interface TopRightActionsProps {
  onSurrender: () => void;
  onOpenSettings: () => void;
}

export const TopRightActions: React.FC<TopRightActionsProps> = ({
  onSurrender,
  onOpenSettings,
}) => {
  const [showConfirmSurrender, setShowConfirmSurrender] = useState(false);

  return (
    <>
      <div className="fixed top-3 right-3 z-30 pointer-events-auto select-none flex items-center gap-2">
        {/* Nút Cờ (Đầu hàng): Nút tròn đỏ cờ trắng, tối thiểu 44px */}
        <button
          onClick={() => setShowConfirmSurrender(true)}
          className="h-11 w-11 min-h-[44px] min-w-[44px] rounded-full bg-gradient-to-b from-rose-500 to-red-700 hover:from-rose-400 hover:to-red-600 border-2 border-red-300 shadow-xl shadow-red-900/40 flex items-center justify-center text-white active:scale-95 transition-all cursor-pointer"
          title="Đầu hàng (Rời trận)"
          aria-label="Đầu hàng"
        >
          <Flag className="h-5 w-5 fill-white stroke-red-800" />
        </button>

        {/* Nút Cài đặt: Nút tròn xám bánh răng, tối thiểu 44px */}
        <button
          onClick={onOpenSettings}
          className="h-11 w-11 min-h-[44px] min-w-[44px] rounded-full bg-slate-900/95 hover:bg-slate-800 border-2 border-slate-700 hover:border-amber-500/60 shadow-xl flex items-center justify-center text-slate-200 hover:text-amber-400 active:scale-95 transition-all cursor-pointer"
          title="Cài đặt trò chơi"
          aria-label="Cài đặt"
        >
          <Settings className="h-5 w-5" />
        </button>
      </div>

      {/* Hộp thoại xác nhận Đầu Hàng */}
      {showConfirmSurrender && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="relative w-full max-w-sm rounded-2xl bg-slate-950 border-2 border-red-500/60 p-5 shadow-2xl text-center animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowConfirmSurrender(false)}
              className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/20 border-2 border-red-500 text-red-400">
              <AlertTriangle className="h-7 w-7" />
            </div>

            <h3 className="font-baloo text-xl font-bold text-white">XÁC NHẬN ĐẦU HÀNG?</h3>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              Bạn có chắc chắn muốn bỏ cuộc? Toàn bộ đất đai và tài sản sẽ bị thanh lý và bạn sẽ tính là phá sản.
            </p>

            <div className="mt-5 flex items-center gap-3">
              <button
                onClick={() => setShowConfirmSurrender(false)}
                className="flex-1 min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition active:scale-95"
              >
                TIẾP TỤC CHƠI
              </button>
              <button
                onClick={() => {
                  setShowConfirmSurrender(false);
                  onSurrender();
                }}
                className="flex-1 min-h-[44px] rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white text-xs font-bold shadow-lg shadow-red-700/40 transition active:scale-95"
              >
                ĐẦU HÀNG
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

'use client';

import React, { useEffect, useState } from 'react';

export interface EventToastItem {
  id: string;
  message: string;
  type?: 'info' | 'success' | 'warn' | 'danger';
}

interface EventToastQueueProps {
  toasts: EventToastItem[];
  onDismiss: (id: string) => void;
}

export const EventToastQueue: React.FC<EventToastQueueProps> = ({ toasts, onDismiss }) => {
  useEffect(() => {
    if (toasts.length === 0) return;

    // Tự ẩn toast đầu hàng sau 2.5 giây
    const firstToast = toasts[0];
    const timer = setTimeout(() => {
      onDismiss(firstToast.id);
    }, 2500);

    return () => clearTimeout(timer);
  }, [toasts, onDismiss]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-16 sm:top-18 left-1/2 -translate-x-1/2 z-40 pointer-events-none flex flex-col items-center gap-1.5 max-w-[92vw]">
      {toasts.slice(0, 3).map((toast, index) => {
        let borderClass = 'border-amber-400/60 text-amber-200';
        let bgClass = 'bg-slate-950/95';

        if (toast.type === 'danger') {
          borderClass = 'border-rose-500/80 text-rose-200';
          bgClass = 'bg-rose-950/90';
        } else if (toast.type === 'success') {
          borderClass = 'border-emerald-500/80 text-emerald-200';
          bgClass = 'bg-emerald-950/90';
        }

        return (
          <div
            key={toast.id}
            className={`px-4 py-1.5 rounded-full border shadow-2xl backdrop-blur-none text-xs sm:text-sm font-bold tracking-tight text-center animate-in fade-in slide-in-from-top-2 duration-200 ${borderClass} ${bgClass}`}
            style={{
              opacity: index === 0 ? 1 : index === 1 ? 0.75 : 0.5,
              transform: `scale(${1 - index * 0.05})`,
            }}
          >
            {toast.message}
          </div>
        );
      })}
    </div>
  );
};

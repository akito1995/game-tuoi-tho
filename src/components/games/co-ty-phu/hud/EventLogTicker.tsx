'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronUp, ChevronDown, Bell } from 'lucide-react';
import { useGameStore } from '@/lib/game-engine/gameStore';

export interface EventLogTickerProps {
  className?: string;
  maxRecent?: number;
}

export function EventLogTicker({ className = '', maxRecent = 5 }: EventLogTickerProps) {
  const eventLogs = useGameStore((state) => state.eventLogs || []);
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest log
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [eventLogs, isExpanded]);

  const displayedLogs = isExpanded ? eventLogs : eventLogs.slice(-maxRecent);

  return (
    <aside
      aria-label="Nhật ký sự kiện ván đấu"
      className={`relative z-20 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-white/10 bg-slate-950/85 p-2.5 backdrop-blur-md shadow-xl transition-all duration-300 ${
        isExpanded ? 'h-64' : 'h-32'
      } ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-1.5 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-amber-300">
          <Bell className="h-3.5 w-3.5 text-amber-400" />
          <span>Nhật Ký Đảo Ngọc</span>
          <span className="rounded-full bg-slate-800 px-1.5 py-0.2 text-[10px] text-slate-400">
            {eventLogs.length}
          </span>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          title={isExpanded ? 'Thu gọn nhật ký' : 'Mở rộng toàn bộ nhật ký'}
          aria-label={isExpanded ? 'Thu gọn' : 'Mở rộng'}
          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <span>{isExpanded ? 'Thu gọn' : 'Chi tiết'}</span>
          {isExpanded ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronUp className="h-3 w-3" />
          )}
        </button>
      </div>

      {/* Log Feed */}
      <div
        ref={scrollRef}
        className="mt-2 h-[calc(100%-2rem)] overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-slate-700"
      >
        {displayedLogs.length === 0 ? (
          <p className="text-[11px] italic text-slate-500">Chưa có sự kiện nào...</p>
        ) : (
          displayedLogs.map((log, index) => {
            const isLatest = index === displayedLogs.length - 1;
            return (
              <div
                key={index}
                className={`flex items-start gap-1.5 text-[11px] leading-tight transition-all duration-200 ${
                  isLatest
                    ? 'font-medium text-amber-100 animate-pulse'
                    : 'text-slate-300 opacity-90'
                }`}
              >
                <span className="text-amber-400/70 select-none">›</span>
                <span className="flex-1 break-words">{log}</span>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}

export default EventLogTicker;

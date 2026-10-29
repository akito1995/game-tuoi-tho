'use client';

import React, { useState, useEffect } from 'react';
import { X, Trophy, Flame, Coins, Medal, Users, RotateCcw } from 'lucide-react';
import { MascotType } from '@/lib/game-engine/types';
import { MASCOT_INFO } from '@/lib/multiplayer/roomStore';
import { soundManager } from '@/lib/audio/soundManager';
import { formatMoney } from '@/components/games/co-ty-phu/hud/hudHelpers';
import { getLocalLeaderboard, LeaderboardEntry } from './hubHelpers';

export interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SortKey = 'netWorth' | 'wins' | 'winRate';

const SORT_OPTIONS: { key: SortKey; label: string; icon: React.ReactNode }[] = [
  { key: 'netWorth', label: 'Tài Sản', icon: <Coins className="h-3.5 w-3.5" /> },
  { key: 'wins',     label: 'Thắng Nhiều', icon: <Trophy className="h-3.5 w-3.5" /> },
  { key: 'winRate',  label: 'Tỷ Lệ %', icon: <Flame className="h-3.5 w-3.5" /> },
];

const RANK_MEDALS = ['🥇', '🥈', '🥉'];

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function LeaderboardModal({ isOpen, onClose }: LeaderboardModalProps) {
  const [sortKey, setSortKey] = useState<SortKey>('netWorth');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    if (isOpen) {
      setEntries(getLocalLeaderboard());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const sorted = [...entries].sort((a, b) => {
    if (sortKey === 'netWorth') return b.netWorth - a.netWorth;
    if (sortKey === 'wins')     return b.wins - a.wins;
    return b.winRate - a.winRate;
  });

  const handleClose = () => {
    soundManager.playClickSound();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in-up">
      <div
        className="relative w-full max-w-lg rounded-2xl border border-amber-500/30 bg-slate-900/98 shadow-2xl shadow-amber-500/10 text-white overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-amber-950/40 to-slate-900 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-xl border border-amber-500/30">
              🏆
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight text-amber-300">
                Bảng Danh Vọng
              </h2>
              <p className="text-[11px] text-slate-400">
                Top kỳ thủ – lưu trên máy này
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            aria-label="Đóng bảng xếp hạng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sort Tabs */}
        <div className="flex items-center gap-1 border-b border-white/5 bg-slate-950/50 px-4 py-2.5">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => { soundManager.playClickSound(); setSortKey(opt.key); }}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                sortKey === opt.key
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>

        {/* Table Body */}
        <div className="max-h-[55vh] overflow-y-auto px-4 py-3 space-y-2 custom-scrollbar">
          {sorted.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800/80 text-3xl">
                🎲
              </div>
              <p className="text-sm font-semibold text-slate-300">Chưa có ai lên bảng!</p>
              <p className="mt-1 text-xs text-slate-500">
                Hoàn thành một ván Cờ Tỷ Phú để ghi danh.
              </p>
            </div>
          ) : (
            sorted.map((entry, idx) => {
              const mascotInfo = MASCOT_INFO[entry.mascot as MascotType] || MASCOT_INFO['PIG'];
              const medal = RANK_MEDALS[idx];

              return (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between rounded-xl border p-3 transition-all animate-fade-in-up ${
                    idx === 0
                      ? 'border-amber-400/60 bg-amber-500/10 ring-1 ring-amber-400/30'
                      : idx === 1
                      ? 'border-slate-500/40 bg-slate-800/60'
                      : idx === 2
                      ? 'border-amber-900/40 bg-amber-950/20'
                      : 'border-white/5 bg-slate-900/50'
                  }`}
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  {/* Left: Rank + Avatar + Name */}
                  <div className="flex items-center gap-3">
                    {/* Rank */}
                    <div className="w-8 text-center">
                      {medal ? (
                        <span className={`text-xl animate-rank-pop`} style={{ animationDelay: `${idx * 60}ms` }}>
                          {medal}
                        </span>
                      ) : (
                        <span className="text-sm font-black text-slate-500">#{idx + 1}</span>
                      )}
                    </div>

                    {/* Mascot avatar */}
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 border border-slate-700 text-xl">
                      {mascotInfo.emoji}
                    </div>

                    {/* Name + stats */}
                    <div>
                      <div className="text-sm font-bold text-white leading-tight truncate max-w-[130px]">
                        {entry.nickname}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <span className="flex items-center gap-0.5">
                          <Users className="h-2.5 w-2.5" />
                          {entry.matchesPlayed} trận
                        </span>
                        <span>•</span>
                        <span className="text-emerald-400 font-semibold">{entry.wins} thắng</span>
                        <span>•</span>
                        <span className="text-orange-400 font-semibold">{entry.winRate}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Net Worth + date */}
                  <div className="text-right flex-shrink-0 ml-2">
                    <div className={`text-sm font-black ${idx === 0 ? 'text-amber-300' : 'text-slate-200'}`}>
                      {formatMoney(entry.netWorth)}
                    </div>
                    <div className="text-[9px] text-slate-500 mt-0.5">
                      {formatTimestamp(entry.timestamp)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 bg-slate-950/80 px-5 py-3 flex items-center justify-between">
          <p className="text-[10px] text-slate-500">
            💾 Lưu cục bộ trên trình duyệt này
          </p>
          <button
            onClick={handleClose}
            className="rounded-xl bg-amber-500 px-4 py-1.5 text-xs font-bold text-slate-950 hover:brightness-110 active:scale-95 transition-all"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

export default LeaderboardModal;

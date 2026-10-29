'use client';

import React from 'react';
import { Skull, Lock, Bot, User, Coins, Gem, Crown, Eye, ChevronDown } from 'lucide-react';
import { useGameStore } from '@/lib/game-engine/gameStore';
import {
  getMascotInfo,
  formatMetaWorldMoney,
  formatShortMoney,
  calculatePlayerNetWorth,
  getColorBadgeInfo,
} from './hudHelpers';

export interface PlayerListBarProps {
  className?: string;
}

export function PlayerListBar({ className = '' }: PlayerListBarProps) {
  const players = useGameStore((state) => state.players || []);
  const activePlayerIndex = useGameStore((state) => state.activePlayerIndex);
  const tiles = useGameStore((state) => state.tiles || []);
  const currentRound = useGameStore((state) => state.currentRound || 1);

  if (!players || players.length === 0) return null;

  return (
    <div className={`flex items-center justify-between w-full max-w-5xl px-2 py-1 select-none ${className}`}>
      {/* ================= PLAYER A (RED TEAM / LEFT) ================= */}
      {players[0] && (
        <div className="flex items-center gap-2">
          {/* Avatar Portrait */}
          <div className="relative">
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-600 via-amber-500 to-orange-400 text-3xl shadow-xl ring-2 ring-white/40">
              {players[0].bankrupt ? <Skull className="h-6 w-6 text-white" /> : '👦'}
            </div>
            {/* Red Team Ribbon */}
            <div className="absolute -bottom-1.5 -right-1 rounded-full bg-rose-600 px-2 py-0.2 text-[8px] font-black text-white shadow border border-white/40 uppercase">
              Player A
            </div>
          </div>

          <div className="flex flex-col">
            {/* Cash in bold Meta World format */}
            <div className="text-base sm:text-xl font-black text-white tracking-wide drop-shadow leading-none">
              {formatMetaWorldMoney(players[0].money)}
            </div>
            {/* Inventory / Skill Slots */}
            <div className="flex items-center gap-1 mt-1">
              {[0, 1, 2, 3].map((slot) => (
                <div
                  key={`slot-a-${slot}`}
                  className="flex h-5 w-5 items-center justify-center rounded-md border border-white/20 bg-slate-900/80 text-[10px] font-bold text-amber-300 shadow-inner"
                >
                  {slot === 0 ? '?' : '?'}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= CENTER: TURN COUNTER & SCORE PILLS ================= */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Red Player A Score Pill */}
        <div className="flex items-center justify-center px-3 py-1 rounded-l-xl bg-gradient-to-r from-rose-700 to-rose-600 text-white font-black text-sm sm:text-base shadow-md border-y border-l border-rose-400/50">
          <span className="hidden sm:inline mr-1 text-xs opacity-80">Player A</span>
          <span>{players[0]?.properties?.length || 7}</span>
        </div>

        {/* Center Dark Turn Pill with Dropdown */}
        <div className="flex flex-col items-center justify-center px-3 py-0.5 bg-slate-950/90 text-white border border-white/20 shadow-xl">
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400">TURN</span>
          <div className="flex items-center gap-0.5 text-xs sm:text-sm font-black text-amber-300">
            <span>{currentRound * 2 - (activePlayerIndex === 0 ? 1 : 0)}</span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </div>
        </div>

        {/* Blue Player B Score Pill */}
        <div className="flex items-center justify-center px-3 py-1 rounded-r-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-black text-sm sm:text-base shadow-md border-y border-r border-blue-400/50">
          <span>{players[1]?.properties?.length || 8}</span>
          <span className="hidden sm:inline ml-1 text-xs opacity-80">Player B</span>
        </div>
      </div>

      {/* ================= PLAYER B (BLUE TEAM / RIGHT) ================= */}
      {players[1] && (
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-end">
            {/* Cash in bold Meta World format */}
            <div className="text-base sm:text-xl font-black text-cyan-300 tracking-wide drop-shadow leading-none">
              {formatMetaWorldMoney(players[1].money)}
            </div>
            {/* Inventory / Skill Slots */}
            <div className="flex items-center gap-1 mt-1">
              {[0, 1, 2, 3].map((slot) => (
                <div
                  key={`slot-b-${slot}`}
                  className="flex h-5 w-5 items-center justify-center rounded-md border border-white/20 bg-slate-900/80 text-[10px] font-bold text-cyan-300 shadow-inner"
                >
                  ?
                </div>
              ))}
            </div>
          </div>

          {/* Avatar Portrait */}
          <div className="relative">
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-600 via-blue-500 to-indigo-600 text-3xl shadow-xl ring-2 ring-white/40">
              {players[1].bankrupt ? <Skull className="h-6 w-6 text-white" /> : '👧'}
            </div>
            {/* Blue Team Ribbon */}
            <div className="absolute -bottom-1.5 -left-1 rounded-full bg-blue-600 px-2 py-0.2 text-[8px] font-black text-white shadow border border-white/40 uppercase">
              Player B
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlayerListBar;

'use client';

import React from 'react';
import { Skull, Lock, Bot, User, Coins } from 'lucide-react';
import { useGameStore } from '@/lib/game-engine/gameStore';
import {
  getMascotInfo,
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

  if (!players || players.length === 0) return null;

  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-2.5 p-2 sm:gap-3.5 ${className}`}
    >
      {players.map((player, index) => {
        const isActive = index === activePlayerIndex;
        const mascot = getMascotInfo(player.mascot);
        const netWorth = calculatePlayerNetWorth(player, tiles);
        const isBankrupt = player.bankrupt;

        // Group owned property tiles by color group for miniature badge row
        const ownedColorGroups = (player.properties || [])
          .map((id) => tiles[id]?.colorGroup)
          .filter(Boolean);

        return (
          <div
            key={player.id}
            className={`relative flex items-center gap-2.5 rounded-xl border px-3 py-2 transition-all duration-300 backdrop-blur-md ${
              isBankrupt
                ? 'border-red-900/40 bg-red-950/20 opacity-55 grayscale'
                : isActive
                ? `border-amber-400 bg-slate-900/90 ring-2 ring-amber-400/80 shadow-lg shadow-amber-500/20 scale-102`
                : 'border-white/10 bg-slate-950/70 hover:border-white/20'
            }`}
          >
            {/* Active Turn Pulsing Tag */}
            {isActive && !isBankrupt && (
              <div className="absolute -top-2.5 left-3 flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.2 text-[10px] font-extrabold text-slate-950 shadow-md animate-bounce">
                <span>LƯỢT ĐI</span>
              </div>
            )}

            {/* Avatar & Mascot */}
            <div className="relative">
              <div
                className={`flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-gradient-to-tr ${mascot.avatarBg} text-xl shadow-md`}
              >
                {isBankrupt ? <Skull className="h-6 w-6 text-white" /> : mascot.emoji}
              </div>

              {/* Bot vs Human pill */}
              <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 text-[10px] text-slate-300 border border-slate-700">
                {player.isBot ? (
                  <Bot className="h-2.5 w-2.5 text-cyan-400" />
                ) : (
                  <User className="h-2.5 w-2.5 text-emerald-400" />
                )}
              </div>
            </div>

            {/* Info details */}
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white max-w-[100px] sm:max-w-[120px] truncate">
                  {player.name}
                </span>

                {/* Jail status */}
                {player.inJail && !isBankrupt && (
                  <span className="flex items-center gap-0.5 rounded bg-red-500/20 px-1 py-0.2 text-[9px] font-bold text-red-300 border border-red-500/30">
                    <Lock className="h-2.5 w-2.5" />
                    <span>Tù</span>
                  </span>
                )}

                {/* Bankrupt tag */}
                {isBankrupt && (
                  <span className="rounded bg-red-600/30 px-1 py-0.2 text-[9px] font-bold text-red-400 border border-red-500/40">
                    Phá Sản
                  </span>
                )}
              </div>

              {/* Money and Net Worth */}
              <div className="flex items-center gap-2 mt-0.5">
                <div className="flex items-center gap-0.5 text-xs font-extrabold text-amber-300">
                  <Coins className="h-3 w-3 text-amber-400" />
                  <span>{formatShortMoney(player.money)}</span>
                </div>
                <div className="text-[10px] text-slate-400">
                  (TS: {formatShortMoney(netWorth)})
                </div>
              </div>

              {/* Owned Properties Miniature Dots */}
              {ownedColorGroups.length > 0 && !isBankrupt && (
                <div className="flex items-center gap-1 mt-1">
                  {ownedColorGroups.slice(0, 6).map((group, gIdx) => {
                    const badge = getColorBadgeInfo(group);
                    return (
                      <span
                        key={gIdx}
                        title={`Sở hữu ô thuộc vùng ${badge.regionName}`}
                        className={`h-2 w-2 rounded-full ${badge.dotClass} ring-1 ring-black/40`}
                      />
                    );
                  })}
                  {ownedColorGroups.length > 6 && (
                    <span className="text-[9px] text-slate-400">
                      +{ownedColorGroups.length - 6}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default PlayerListBar;

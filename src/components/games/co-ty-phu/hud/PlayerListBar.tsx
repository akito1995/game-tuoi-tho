'use client';

import React from 'react';
import { Skull, Lock, Bot, User, Coins, Gem, Crown, Eye } from 'lucide-react';
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

        // Group owned property tiles by color group for miniature gem pips
        const ownedColorGroups = (player.properties || [])
          .map((id) => tiles[id]?.colorGroup)
          .filter(Boolean);

        return (
          <div
            key={player.id}
            className={`relative flex items-center gap-2.5 rounded-2xl p-2.5 sm:p-3 transition-all duration-300 backdrop-blur-xl ${
              isBankrupt
                ? 'border border-red-900/40 bg-red-950/20 opacity-50 grayscale shadow-inner'
                : isActive
                ? 'glass-hud-active scale-105 z-10'
                : 'glass-hud hover:border-white/30 hover:scale-102'
            }`}
          >
            {/* Active Turn Floating Crown Tag */}
            {isActive && !isBankrupt && (
              <div className="absolute -top-3 left-4 flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 px-2.5 py-0.5 text-[9px] font-black text-slate-950 shadow-lg shadow-amber-500/40 animate-bounce ring-2 ring-yellow-200">
                <Crown className="h-3 w-3 fill-slate-950 text-slate-950" />
                <span>LƯỢT ĐI</span>
              </div>
            )}

            {/* Avatar & 3D Glow Ring */}
            <div className="relative">
              <div
                className={`relative flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-gradient-to-tr ${mascot.avatarBg} text-2xl shadow-xl ring-2 ${
                  isActive ? 'ring-amber-300 shadow-amber-400/50' : 'ring-white/30'
                }`}
              >
                {isBankrupt ? <Skull className="h-6 w-6 text-white" /> : mascot.emoji}
              </div>

              {/* Bot vs Human Identifier */}
              <div
                className={`absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold shadow-md border ${
                  player.isBot
                    ? 'bg-sky-950 text-sky-300 border-sky-400'
                    : 'bg-emerald-950 text-emerald-300 border-emerald-400'
                }`}
              >
                {player.isBot ? (
                  <Bot className="h-2.5 w-2.5 text-sky-400" />
                ) : (
                  <User className="h-2.5 w-2.5 text-emerald-400" />
                )}
              </div>
            </div>

            {/* Info details */}
            <div className="flex flex-col min-w-[100px] sm:min-w-[115px]">
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-black text-white truncate max-w-[95px] sm:max-w-[115px] drop-shadow">
                  {player.name}
                </span>

                {/* Jail status */}
                {player.inJail && !isBankrupt && (
                  <span className="flex items-center gap-0.5 rounded-full bg-rose-500/30 px-1.5 py-0.2 text-[8px] font-black text-rose-300 border border-rose-400/50 shadow">
                    <Lock className="h-2 w-2" />
                    <span>TÙ</span>
                  </span>
                )}

                {/* Bankrupt / Spectator tag */}
                {isBankrupt && (
                  <span className="flex items-center gap-1 rounded-full bg-slate-800/90 px-1.5 py-0.5 text-[8px] font-bold text-slate-300 border border-slate-600">
                    <Eye className="h-2 w-2 text-cyan-400" />
                    <span>XEM</span>
                  </span>
                )}
              </div>

              {/* Cash & Net Worth Badges */}
              <div className="flex items-center gap-2 mt-0.5">
                <div className="flex items-center gap-1 text-xs font-black text-amber-300 drop-shadow">
                  <Coins className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                  <span className="text-glow-gold">{formatShortMoney(player.money)}</span>
                </div>
                <div className="flex items-center gap-0.5 text-[10px] font-bold text-sky-300" title="Tổng giá trị tài sản">
                  <Gem className="h-2.5 w-2.5 text-sky-400" />
                  <span>{formatShortMoney(netWorth)}</span>
                </div>
              </div>

              {/* Owned Properties Miniature Gem Pips */}
              {ownedColorGroups.length > 0 && !isBankrupt && (
                <div className="flex items-center gap-1 mt-1">
                  {ownedColorGroups.slice(0, 6).map((group, gIdx) => {
                    const badge = getColorBadgeInfo(group);
                    return (
                      <span
                        key={gIdx}
                        title={`Sở hữu ô thuộc vùng ${badge.regionName}`}
                        className={`h-2.5 w-2.5 rounded-full ${badge.dotClass} shadow-md ring-1 ring-white/40`}
                      />
                    );
                  })}
                  {ownedColorGroups.length > 6 && (
                    <span className="text-[8px] font-extrabold text-amber-300">
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

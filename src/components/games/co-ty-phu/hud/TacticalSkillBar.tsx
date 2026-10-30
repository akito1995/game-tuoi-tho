'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/lib/game-engine/gameStore';
import { Dices, Sparkles, Smile, Shield, Footprints } from 'lucide-react';

const ANIME_HERO_CARDS = [
  { id: 'c1', name: 'Megan', emoji: '🔮', bg: 'from-purple-900 to-indigo-950', ring: 'ring-amber-400' },
  { id: 'c2', name: 'Sophie', emoji: '⭐', bg: 'from-amber-700 to-yellow-950', ring: 'ring-amber-300' },
  { id: 'c3', name: 'Luna', emoji: '🌙', bg: 'from-rose-900 to-purple-950', ring: 'ring-pink-400' },
  { id: 'c4', name: 'Elena', emoji: '👑', bg: 'from-yellow-800 to-amber-950', ring: 'ring-yellow-300' },
];

export function TacticalSkillBar() {
  const activePlayerIndex = useGameStore((s) => s.activePlayerIndex);
  const players = useGameStore((s) => s.players);
  const gamePhase = useGameStore((s) => s.gamePhase);
  const useEvenOddCard = useGameStore((s) => s.useEvenOddCard);
  const useRentShield = useGameStore((s) => s.useRentShield);
  const useDoubleStep = useGameStore((s) => s.useDoubleStep);

  const activePlayer = players[activePlayerIndex];
  const isHumanTurn = activePlayer && !activePlayer.isBot && (gamePhase === 'WAITING' || gamePhase === 'AWAIT_ROLL');

  const [activeDeckCard, setActiveDeckCard] = useState<string | null>(null);

  if (!activePlayer) return null;

  const hasShieldActive = activePlayer.hasActiveShield;
  const activeModifier = activePlayer.activeDiceModifier;

  return (
    <div className="relative mb-2 flex flex-col items-end gap-2 pointer-events-auto">
      {/* ================= 1. ANIME HEROINE CHARACTER DECK (TOP ROW) ================= */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-950/80 border-2 border-amber-500/40 backdrop-blur-xl shadow-[0_12px_30px_rgba(0,0,0,0.6),inset_0_1px_2px_rgba(255,255,255,0.2)]">
        {ANIME_HERO_CARDS.map((hero) => (
          <div
            key={hero.id}
            onClick={() => setActiveDeckCard(hero.id === activeDeckCard ? null : hero.id)}
            className={`group relative flex flex-col items-center justify-center w-12 h-16 sm:w-14 sm:h-20 rounded-xl border-2 border-amber-400 bg-gradient-to-b ${hero.bg} shadow-xl ring-2 ${hero.ring} cursor-pointer transition-all duration-200 hover:-translate-y-2 hover:scale-105 active:scale-95 ${
              activeDeckCard === hero.id ? 'ring-4 ring-yellow-300 scale-105 shadow-[0_0_20px_rgba(250,204,21,0.6)]' : ''
            }`}
            title={`Thẻ nhân vật: ${hero.name}`}
          >
            {/* 24K Gold Corner Foil Accents */}
            <div className="absolute top-1 left-1 text-[8px] text-amber-300 drop-shadow">✦</div>
            <div className="absolute top-1 right-1 text-[8px] text-amber-300 drop-shadow">✦</div>
            <div className="text-2xl sm:text-3xl filter drop-shadow-md transition-transform group-hover:scale-110">{hero.emoji}</div>
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950 via-slate-900/90 to-transparent text-[9px] font-black uppercase tracking-wider text-amber-200 text-center py-0.5 rounded-b-lg border-t border-amber-400/50 shadow-inner">
              {hero.name}
            </div>
          </div>
        ))}
      </div>

      {/* ================= 2. TACTICAL ACTION / JUMP CARDS (BOTTOM ROW) ================= */}
      <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-950/70 border border-white/10 backdrop-blur-md shadow-xl">
        {/* Quick Emote Shortcut */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('toggle-emote-wheel'))}
          className="flex h-13 w-11 sm:h-16 sm:w-12 items-center justify-center rounded-xl border-2 border-sky-400/60 bg-gradient-to-b from-sky-900 to-slate-950 text-sky-200 shadow-md hover:from-sky-800 hover:to-slate-900 active:scale-95 transition-all hover:scale-105 cursor-pointer"
          title="Bày tỏ cảm xúc"
        >
          <Smile className="h-5 w-5 drop-shadow" />
        </button>

        {/* Golden Shield Card */}
        <button
          onClick={() => useRentShield()}
          className={`flex flex-col items-center justify-center w-12 h-14 sm:w-14 sm:h-16 rounded-xl border-2 border-amber-400 bg-gradient-to-b from-amber-500 via-amber-600 to-yellow-900 text-slate-950 shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer ${
            hasShieldActive ? 'ring-4 ring-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.8)]' : ''
          }`}
          title="Khiên bảo vệ miễn trả tiền thuê"
        >
          <Shield className="h-5 w-5 text-white fill-white drop-shadow" />
          <span className="text-[8px] font-black uppercase tracking-wider text-amber-100 mt-0.5">KHIÊN</span>
        </button>

        {/* Dice Card 1: 2 ~ 4 JUMP */}
        <button
          onClick={() => useEvenOddCard('EVEN')}
          disabled={!isHumanTurn}
          className={`relative flex flex-col items-center justify-between w-13 h-15 sm:w-15 sm:h-17 rounded-xl border-2 border-blue-400/90 bg-gradient-to-b from-blue-600 via-indigo-900 to-slate-950 p-1.5 shadow-2xl transition-all hover:-translate-y-1.5 hover:scale-105 active:scale-95 cursor-pointer ${
            activeModifier === 'EVEN' ? 'ring-4 ring-yellow-300 scale-105 shadow-[0_0_20px_rgba(59,130,246,0.8)]' : ''
          }`}
          title="Thẻ Nhảy Cự Ly Ngắn (2~4 Bước)"
        >
          <div className="flex items-center gap-0.5 text-blue-300">
            <Footprints className="h-3.5 w-3.5 drop-shadow" />
          </div>
          <div className="text-base sm:text-lg font-black text-white leading-none tracking-tight drop-shadow">
            2<span className="text-xs text-blue-300">~</span>4
          </div>
          <div className="w-full text-[8px] font-black uppercase tracking-wider text-amber-300 text-center bg-blue-950/90 border border-blue-400/40 rounded py-0.5 shadow-inner">
            JUMP
          </div>
        </button>

        {/* Dice Card 2: 10 ~ 12 JUMP */}
        <button
          onClick={() => useDoubleStep()}
          disabled={!isHumanTurn}
          className="relative flex flex-col items-center justify-between w-13 h-15 sm:w-15 sm:h-17 rounded-xl border-2 border-purple-400/90 bg-gradient-to-b from-purple-700 via-indigo-950 to-slate-950 p-1.5 shadow-2xl transition-all hover:-translate-y-1.5 hover:scale-105 active:scale-95 cursor-pointer"
          title="Thẻ Nhảy Cự Ly Xa (10~12 Bước)"
        >
          <div className="flex items-center gap-0.5 text-purple-300">
            <Footprints className="h-3.5 w-3.5 drop-shadow" />
          </div>
          <div className="text-base sm:text-lg font-black text-white leading-none tracking-tight drop-shadow">
            10<span className="text-xs text-purple-300">~</span>12
          </div>
          <div className="w-full text-[8px] font-black uppercase tracking-wider text-amber-300 text-center bg-purple-950/90 border border-purple-400/40 rounded py-0.5 shadow-inner">
            JUMP
          </div>
        </button>

        {/* Dice Card 3: 6 DOUBLE (Guaranteed Lucky Double) */}
        <button
          onClick={() => useEvenOddCard('ODD')}
          disabled={!isHumanTurn}
          className="relative flex flex-col items-center justify-between w-13 h-15 sm:w-15 sm:h-17 rounded-xl border-2 border-amber-400 bg-gradient-to-b from-blue-600 via-indigo-900 to-slate-950 p-1.5 shadow-2xl ring-2 ring-yellow-400/80 shadow-[0_0_20px_rgba(250,204,21,0.5)] transition-all hover:-translate-y-1.5 hover:scale-105 active:scale-95 cursor-pointer"
          title="Thẻ Đổ Đôi (DOUBLE 6)"
        >
          <div className="flex items-center gap-0.5 text-amber-300">
            <Dices className="h-4 w-4 drop-shadow animate-pulse" />
          </div>
          <div className="text-lg sm:text-xl font-black text-amber-300 leading-none drop-shadow">
            6
          </div>
          {/* Crimson Red DOUBLE Banner Ribbon */}
          <div className="w-full text-[8px] font-black uppercase tracking-wider text-white text-center bg-gradient-to-r from-rose-600 to-red-600 rounded py-0.5 shadow-md border border-rose-300/40">
            DOUBLE
          </div>
        </button>
      </div>
    </div>
  );
}

export default TacticalSkillBar;

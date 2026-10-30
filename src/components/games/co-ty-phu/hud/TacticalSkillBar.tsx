'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/lib/game-engine/gameStore';
import { Dices, Sparkles, Smile, Ticket, Footprints, Shield, Zap } from 'lucide-react';

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

  const inventory = activePlayer.tacticalCards || { evenOdd: 0, rentShield: 0, doubleStep: 0 };
  const hasShieldActive = activePlayer.hasActiveShield;
  const activeModifier = activePlayer.activeDiceModifier;

  return (
    <div className="relative mb-2 flex flex-col items-end gap-2 pointer-events-auto">
      {/* ================= 1. ANIME HEROINE CHARACTER DECK (TOP ROW) ================= */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-950/70 border border-white/10 backdrop-blur-md shadow-2xl">
        {ANIME_HERO_CARDS.map((hero, i) => (
          <div
            key={hero.id}
            onClick={() => setActiveDeckCard(hero.id === activeDeckCard ? null : hero.id)}
            className={`group relative flex flex-col items-center justify-center w-11 h-14 sm:w-12 sm:h-16 rounded-xl border-2 border-amber-400/80 bg-gradient-to-b ${hero.bg} shadow-lg ring-1 ${hero.ring} cursor-pointer transition-all hover:-translate-y-1 hover:scale-105 active:scale-95 ${
              activeDeckCard === hero.id ? 'ring-4 ring-yellow-300 scale-105' : ''
            }`}
            title={`Thẻ nhân vật: ${hero.name}`}
          >
            {/* Gold Corner Foil Accents */}
            <div className="absolute top-0.5 left-0.5 text-[7px] text-amber-300">✦</div>
            <div className="absolute top-0.5 right-0.5 text-[7px] text-amber-300">✦</div>
            <div className="text-xl sm:text-2xl filter drop-shadow">{hero.emoji}</div>
            <div className="absolute bottom-0 inset-x-0 bg-slate-950/80 text-[8px] font-black text-amber-200 text-center py-0.2 rounded-b-lg border-t border-amber-400/40">
              {hero.name}
            </div>
          </div>
        ))}
      </div>

      {/* ================= 2. TACTICAL ACTION / JUMP CARDS (BOTTOM ROW) ================= */}
      <div className="flex items-center gap-1.5">
        {/* Quick Emote Shortcut */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('toggle-emote-wheel'))}
          className="flex h-12 w-10 sm:h-14 sm:w-11 items-center justify-center rounded-xl border border-sky-400/50 bg-sky-950/80 text-sky-300 shadow-md hover:bg-sky-900 active:scale-95 transition-transform"
          title="Bày tỏ cảm xúc"
        >
          <Smile className="h-5 w-5" />
        </button>

        {/* Golden Ticket / Chance Shortcut */}
        <button
          onClick={() => useRentShield()}
          className={`flex flex-col items-center justify-center w-11 h-12 sm:w-12 sm:h-14 rounded-xl border-2 border-amber-400 bg-gradient-to-b from-amber-600 to-yellow-800 text-slate-950 shadow-md transition-transform hover:scale-105 active:scale-95 ${
            hasShieldActive ? 'ring-2 ring-cyan-300' : ''
          }`}
          title="Khiên bảo vệ miễn trả tiền thuê"
        >
          <Shield className="h-4 w-4 text-white fill-white" />
          <span className="text-[8px] font-black uppercase text-amber-200">KHIÊN</span>
        </button>

        {/* Dice Card 1: 2 ~ 4 JUMP */}
        <button
          onClick={() => useEvenOddCard('EVEN')}
          disabled={!isHumanTurn}
          className={`relative flex flex-col items-center justify-between w-12 h-14 sm:w-14 sm:h-16 rounded-xl border-2 border-blue-400/80 bg-gradient-to-b from-blue-700 to-sky-950 p-1 shadow-xl transition-all hover:-translate-y-1 hover:scale-105 active:scale-95 ${
            activeModifier === 'EVEN' ? 'ring-4 ring-yellow-300 scale-105' : ''
          }`}
          title="Thẻ Nhảy Cự Ly Ngắn (2~4 Bước)"
        >
          <div className="flex items-center gap-0.5 text-blue-200">
            <Footprints className="h-3 w-3" />
          </div>
          <div className="text-sm sm:text-base font-black text-white leading-none">
            2<span className="text-[10px] text-blue-200">~</span>4
          </div>
          <div className="w-full text-[8px] font-black uppercase tracking-tighter text-amber-300 text-center bg-blue-900/80 rounded py-0.2">
            JUMP
          </div>
        </button>

        {/* Dice Card 2: 10 ~ 12 JUMP */}
        <button
          onClick={() => useDoubleStep()}
          disabled={!isHumanTurn}
          className="relative flex flex-col items-center justify-between w-12 h-14 sm:w-14 sm:h-16 rounded-xl border-2 border-indigo-400/80 bg-gradient-to-b from-indigo-800 to-slate-950 p-1 shadow-xl transition-all hover:-translate-y-1 hover:scale-105 active:scale-95"
          title="Thẻ Nhảy Cự Ly Xa (10~12 Bước)"
        >
          <div className="flex items-center gap-0.5 text-indigo-200">
            <Footprints className="h-3 w-3" />
          </div>
          <div className="text-sm sm:text-base font-black text-white leading-none">
            10<span className="text-[10px] text-indigo-200">~</span>12
          </div>
          <div className="w-full text-[8px] font-black uppercase tracking-tighter text-amber-300 text-center bg-indigo-950/90 rounded py-0.2">
            JUMP
          </div>
        </button>

        {/* Dice Card 3: 6 DOUBLE (Guaranteed Lucky Double) */}
        <button
          onClick={() => useEvenOddCard('ODD')}
          disabled={!isHumanTurn}
          className="relative flex flex-col items-center justify-between w-12 h-14 sm:w-14 sm:h-16 rounded-xl border-2 border-amber-400 bg-gradient-to-b from-blue-700 via-indigo-900 to-slate-950 p-1 shadow-2xl ring-2 ring-yellow-400/60 transition-all hover:-translate-y-1 hover:scale-105 active:scale-95"
          title="Thẻ Đổ Đôi (DOUBLE 6)"
        >
          <div className="flex items-center gap-0.5 text-amber-300">
            <Dices className="h-3.5 w-3.5" />
          </div>
          <div className="text-base sm:text-lg font-black text-white leading-none text-glow-gold">
            6
          </div>
          {/* Red DOUBLE Banner Ribbon */}
          <div className="w-full text-[8px] font-black uppercase tracking-tight text-white text-center bg-rose-600 rounded py-0.2 shadow">
            DOUBLE
          </div>
        </button>
      </div>
    </div>
  );
}

export default TacticalSkillBar;

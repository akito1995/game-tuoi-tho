'use client';

import React, { useState, useEffect } from 'react';
import { voiceManager, DialogueEvent } from '@/lib/audio/voiceManager';
import { CHARACTER_PROFILES } from '@/lib/audio/audioManifest';
import { CharacterId } from '@/lib/audio/types';

const MASCOT_EMOJIS: Record<CharacterId, { emoji: string; avatarBg: string; border: string; glow: string }> = {
  CHAR_01: {
    emoji: '🐷',
    avatarBg: 'from-amber-400 via-rose-400 to-pink-500',
    border: 'border-amber-400',
    glow: 'shadow-amber-500/40',
  },
  CHAR_02: {
    emoji: '🦊',
    avatarBg: 'from-orange-400 via-amber-500 to-rose-500',
    border: 'border-orange-400',
    glow: 'shadow-orange-500/40',
  },
  CHAR_03: {
    emoji: '🐱',
    avatarBg: 'from-cyan-400 via-blue-500 to-indigo-500',
    border: 'border-cyan-400',
    glow: 'shadow-cyan-500/40',
  },
  CHAR_04: {
    emoji: '🐃',
    avatarBg: 'from-emerald-400 via-teal-500 to-slate-700',
    border: 'border-emerald-400',
    glow: 'shadow-emerald-500/40',
  },
};

export function MascotDialogueBanner() {
  const [currentDialogue, setCurrentDialogue] = useState<DialogueEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const unsub = voiceManager.onDialogue((event) => {
      setCurrentDialogue(event);
      setIsVisible(true);

      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 2500);

      return () => clearTimeout(timer);
    });

    return unsub;
  }, []);

  if (!currentDialogue || !isVisible) return null;

  const profile = CHARACTER_PROFILES[currentDialogue.characterId];
  const mascotVisual = MASCOT_EMOJIS[currentDialogue.characterId] || MASCOT_EMOJIS.CHAR_01;

  return (
    <div className="fixed top-24 left-4 z-40 pointer-events-none w-[88%] max-w-sm animate-in fade-in slide-in-from-left-4 duration-300">
      <div
        className={`relative flex items-center gap-3.5 rounded-2xl border-2 ${mascotVisual.border} bg-slate-950/90 p-3 shadow-2xl ${mascotVisual.glow} backdrop-blur-xl`}
      >
        {/* Chibi Mascot Avatar with animated bounce */}
        <div
          className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr ${mascotVisual.avatarBg} text-3xl shadow-lg ring-2 ring-white/40 animate-bounce`}
        >
          <span>{mascotVisual.emoji}</span>
          <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-black text-slate-900 shadow">
            💬
          </div>
        </div>

        {/* Dialogue Bubble Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-black tracking-wider text-amber-300 uppercase">
              {profile?.name || 'Mascot'}
            </h4>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-bold text-slate-300">
              {profile?.archetype || 'Đại ca'}
            </span>
          </div>
          <p className="mt-1 text-sm font-extrabold leading-snug text-white drop-shadow">
            &ldquo;{currentDialogue.textVi}&rdquo;
          </p>
        </div>

        {/* Comic triangle tail pointing towards board */}
        <div className="absolute -bottom-2.5 left-10 h-0 w-0 border-x-8 border-x-transparent border-t-8 border-t-slate-950/90" />
      </div>
    </div>
  );
}

export default MascotDialogueBanner;

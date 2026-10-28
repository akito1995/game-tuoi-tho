'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Smile, Sparkles, X } from 'lucide-react';
import {
  useChatStore,
  EMOTE_DEFINITIONS,
  ActiveEmote,
} from '@/lib/multiplayer/chatStore';
import { useGameStore } from '@/lib/game-engine/gameStore';
import { getMascotInfo } from './hudHelpers';
import { soundManager } from '@/lib/audio/soundManager';

export interface EmoteWheelProps {
  className?: string;
}

/**
 * Floating Emote Item rendered with upward float & fade CSS animation
 */
function FloatingEmoteBubble({
  emote,
  onExpire,
}: {
  emote: ActiveEmote;
  onExpire: (id: string) => void;
}) {
  const mascotInfo = getMascotInfo(emote.mascot);

  useEffect(() => {
    const timer = setTimeout(() => {
      onExpire(emote.id);
    }, 2800);
    return () => clearTimeout(timer);
  }, [emote.id, onExpire]);

  return (
    <div
      className="pointer-events-none absolute -translate-x-1/2 flex flex-col items-center animate-emote-float"
      style={{
        left: `${emote.xPercent}%`,
        top: `${emote.yPercent}%`,
      }}
    >
      <div className="select-none text-4xl sm:text-5xl filter drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] transform hover:scale-110 transition-transform">
        {emote.emoji}
      </div>
      <div className="mt-1.5 flex items-center gap-1 rounded-full border border-white/20 bg-slate-950/85 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-xl backdrop-blur-md">
        <span>{mascotInfo.emoji}</span>
        <span className="text-amber-300">{emote.senderName}</span>
        <span className="text-slate-400">•</span>
        <span className="text-slate-200">{emote.label}</span>
      </div>
    </div>
  );
}

/**
 * Floating Emotes Screen Overlay
 * Renders all active animated emote reactions across the game screen
 */
export function FloatingEmotesOverlay() {
  const activeEmotes = useChatStore((state) => state.activeEmotes);
  const clearOldEmotes = useChatStore((state) => state.clearOldEmotes);
  const removeEmote = useChatStore((state) => state.removeEmote);

  // Periodically clean up older emotes
  useEffect(() => {
    const interval = setInterval(() => {
      clearOldEmotes(3000);
    }, 1000);
    return () => clearInterval(interval);
  }, [clearOldEmotes]);

  if (!activeEmotes || activeEmotes.length === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
    >
      <style jsx global>{`
        @keyframes emoteFloatUp {
          0% {
            opacity: 0;
            transform: translate(-50%, 25px) scale(0.65);
          }
          15% {
            opacity: 1;
            transform: translate(-50%, 0px) scale(1.15);
          }
          30% {
            transform: translate(-50%, -15px) scale(1);
          }
          75% {
            opacity: 0.95;
            transform: translate(-50%, -85px) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -140px) scale(0.8);
          }
        }
        .animate-emote-float {
          animation: emoteFloatUp 2.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
      `}</style>
      {activeEmotes.map((emote) => (
        <FloatingEmoteBubble
          key={emote.id}
          emote={emote}
          onExpire={removeEmote}
        />
      ))}
    </div>
  );
}

/**
 * EmoteWheel Component
 * Provides a popover wheel of 7 expressive Vietnamese game emotes
 * and triggers buoyant screen reactions with procedural audio effects.
 */
export function EmoteWheel({ className = '' }: EmoteWheelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerEmote = useChatStore((state) => state.triggerEmote);
  const popoverRef = useRef<HTMLDivElement>(null);

  const players = useGameStore((state) => state.players) || [];
  const activePlayerIndex = useGameStore((state) => state.activePlayerIndex) || 0;
  const currentSender =
    players.find((p) => !p.isBot) || players[activePlayerIndex] || players[0];

  const senderId = currentSender?.id || 'player_1';
  const senderName = currentSender?.name || 'Bạn';
  const senderMascot = currentSender?.mascot || 'PIG';

  // Close wheel if clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    soundManager.playClickSound();
    setIsOpen(!isOpen);
  };

  const handleSelectEmote = (emoji: string, label: string) => {
    soundManager.playEmoteSound(emoji);
    triggerEmote(senderId, senderName, senderMascot, emoji, label);
    setIsOpen(false);
  };

  return (
    <div ref={popoverRef} className={`relative ${className}`}>
      {/* Emote Wheel Toggle Button */}
      <button
        onClick={handleToggle}
        title="Thả cảm xúc & Tương tác"
        aria-label="Mở bảng cảm xúc"
        className="group relative flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-white/20 bg-slate-900/90 text-white shadow-xl backdrop-blur-md transition-all duration-200 hover:scale-105 hover:border-amber-400 hover:bg-slate-800 active:scale-95"
      >
        <Smile className="h-5 w-5 text-amber-400 transition-transform group-hover:rotate-12 group-hover:scale-110" />
      </button>

      {/* Emote Selector Popover Dial */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Chọn cảm xúc tương tác"
          className="absolute bottom-14 left-0 z-50 flex w-72 flex-col overflow-hidden rounded-2xl border border-white/15 bg-slate-950/95 p-3 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 sm:left-auto sm:right-0"
        >
          {/* Header */}
          <div className="mb-2.5 flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>Cảm Xúc Tương Tác</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* 7 Expressive Emotes Grid */}
          <div className="grid grid-cols-4 gap-2">
            {EMOTE_DEFINITIONS.map((def) => (
              <button
                key={def.id}
                onClick={() => handleSelectEmote(def.emoji, def.label)}
                title={`${def.label} (${def.desc})`}
                className="group flex flex-col items-center justify-center rounded-xl border border-white/10 bg-slate-900/80 p-2 transition-all hover:scale-110 hover:border-amber-400 hover:bg-slate-800 active:scale-90 shadow-sm"
              >
                <span className="text-2xl transition-transform group-hover:scale-125">
                  {def.emoji}
                </span>
                <span className="mt-1 text-[10px] font-semibold text-slate-300 group-hover:text-amber-300">
                  {def.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Floating Reactions Global Overlay */}
      <FloatingEmotesOverlay />
    </div>
  );
}

export default EmoteWheel;

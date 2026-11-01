'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { MessageSquare, Smile, X, Send } from 'lucide-react';

interface BottomLeftSocialProps {
  onSendChatMessage?: (msg: string) => void;
  onSendEmote?: (emoteKey: string) => void;
}

const QUICK_MESSAGES = [
  'Chào bạn! Chúc may mắn! 👋',
  'Đất này đẹp quá, tôi mua nhé! 🏰',
  'May mắn quá đi thôi! 🍀',
  'Ối dồi ôi, né được ô thuế rồi! 😅',
  'Cố lên nào, đừng nản chí! 🔥',
  'Hẹn gặp lại ở vòng sau nhé! ✈️',
];

const EMOTE_LIST = [
  { id: 'ong-bay', label: 'Ông Bảy 👍', src: '/art/emotes/ong-bay.png' },
  { id: 'be-ti', label: 'Bé Tí 😄', src: '/art/avatars/be-ti.png' },
  { id: 'co-hoa', label: 'Cô Hoa 🌸', src: '/art/avatars/co-hoa.png' },
  { id: 'chi-may', label: 'Chị Mây ✨', src: '/art/avatars/chi-may.png' },
  { id: 'heo-dat', label: 'Heo Đất 🐷', src: '/art/props/prop-heo-dat.png' },
  { id: 'dong-xu', label: 'Đồng Xu 💰', src: '/art/ui/ui-dong-xu.png' },
];

export const BottomLeftSocial: React.FC<BottomLeftSocialProps> = ({
  onSendChatMessage,
  onSendEmote,
}) => {
  const [activeTab, setActiveTab] = useState<'NONE' | 'CHAT' | 'EMOTE'>('NONE');
  const [floatingEmote, setFloatingEmote] = useState<{ id: string; src: string } | null>(null);

  const handleSelectEmote = (emote: { id: string; src: string }) => {
    setActiveTab('NONE');
    setFloatingEmote(emote);
    if (onSendEmote) onSendEmote(emote.id);

    setTimeout(() => {
      setFloatingEmote(null);
    }, 2200);
  };

  const handleSelectMessage = (msg: string) => {
    setActiveTab('NONE');
    if (onSendChatMessage) onSendChatMessage(msg);
  };

  return (
    <>
      {/* Hiệu ứng bóng emote bay lên góc màn hình */}
      {floatingEmote && (
        <div className="fixed bottom-20 left-6 z-50 pointer-events-none animate-bounce">
          <div className="relative h-16 w-16 rounded-2xl bg-slate-900 border-2 border-amber-400 p-1.5 shadow-[0_0_20px_rgba(245,158,11,0.6)]">
            <Image
              src={floatingEmote.src}
              alt="Emote"
              fill
              className="object-contain p-1"
            />
          </div>
        </div>
      )}

      {/* 2 Nút chính góc dưới bên trái */}
      <div className="fixed bottom-3 left-3 sm:bottom-4 sm:left-4 z-30 pointer-events-auto select-none flex items-center gap-2">
        {/* Nút Chat (💬) */}
        <button
          onClick={() => setActiveTab(activeTab === 'CHAT' ? 'NONE' : 'CHAT')}
          className={`h-11 w-11 min-h-[44px] min-w-[44px] rounded-full border-2 flex items-center justify-center transition-all cursor-pointer shadow-xl ${
            activeTab === 'CHAT'
              ? 'bg-sky-600 border-sky-300 text-white scale-105 shadow-sky-600/40'
              : 'bg-slate-900/95 border-slate-700 hover:border-sky-400 text-slate-200 hover:text-sky-300 active:scale-95'
          }`}
          title="Tin nhắn nhanh"
          aria-label="Mở khung chat"
        >
          <MessageSquare className="h-5 w-5" />
        </button>

        {/* Nút Biểu cảm (😊) */}
        <button
          onClick={() => setActiveTab(activeTab === 'EMOTE' ? 'NONE' : 'EMOTE')}
          className={`h-11 w-11 min-h-[44px] min-w-[44px] rounded-full border-2 flex items-center justify-center transition-all cursor-pointer shadow-xl ${
            activeTab === 'EMOTE'
              ? 'bg-amber-500 border-amber-300 text-slate-950 scale-105 shadow-amber-500/40'
              : 'bg-slate-900/95 border-slate-700 hover:border-amber-400 text-slate-200 hover:text-amber-300 active:scale-95'
          }`}
          title="Gửi biểu cảm (Emotes)"
          aria-label="Mở khay biểu cảm"
        >
          <Smile className="h-5 w-5" />
        </button>
      </div>

      {/* Popover Khay Chat Nhanh */}
      {activeTab === 'CHAT' && (
        <div className="fixed bottom-16 left-3 sm:left-4 z-40 w-72 rounded-2xl bg-slate-950 border-2 border-sky-500/50 p-3 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4" />
              <span>Tin nhắn nhanh</span>
            </span>
            <button
              onClick={() => setActiveTab('NONE')}
              className="text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-2 space-y-1.5">
            {QUICK_MESSAGES.map((msg, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectMessage(msg)}
                className="w-full text-left text-xs px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-sky-950 hover:text-sky-200 text-slate-300 border border-slate-800/80 transition active:scale-98 min-h-[36px] flex items-center"
              >
                {msg}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Popover Khay Biểu Cảm (Emotes) */}
      {activeTab === 'EMOTE' && (
        <div className="fixed bottom-16 left-3 sm:left-4 z-40 w-72 rounded-2xl bg-slate-950 border-2 border-amber-500/50 p-3 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <Smile className="h-4 w-4" />
              <span>Biểu cảm chibi</span>
            </span>
            <button
              onClick={() => setActiveTab('NONE')}
              className="text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-2.5 grid grid-cols-3 gap-2">
            {EMOTE_LIST.map((emote) => (
              <button
                key={emote.id}
                onClick={() => handleSelectEmote(emote)}
                className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-900 hover:bg-amber-500/20 border border-slate-800 hover:border-amber-400 transition active:scale-95 group min-h-[44px]"
                title={emote.label}
              >
                <div className="relative h-11 w-11 rounded-lg overflow-hidden bg-slate-950">
                  <Image
                    src={emote.src}
                    alt={emote.label}
                    fill
                    className="object-contain p-0.5 group-hover:scale-110 transition-transform"
                    onError={(e) => {
                      (e.target as any).src = '/art/avatars/avatar-1.png';
                    }}
                  />
                </div>
                <span className="mt-1 text-[10px] font-bold text-slate-300 group-hover:text-amber-300 truncate max-w-[64px]">
                  {emote.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

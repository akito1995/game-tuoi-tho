'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { MessageSquare, Smile, X, Building, ChevronUp, ChevronDown, ListFilter } from 'lucide-react';
import { Player } from '../../game/types';

interface BottomLeftSocialProps {
  player?: Player;
  ownedTilesCount?: number;
  ownedHousesCount?: number;
  onViewAssets?: () => void;
  logs?: string[];
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
  player,
  ownedTilesCount = 0,
  ownedHousesCount = 0,
  onViewAssets,
  logs = [],
  onSendChatMessage,
  onSendEmote,
}) => {
  const [activeTab, setActiveTab] = useState<'NONE' | 'CHAT' | 'EMOTE'>('NONE');
  const [floatingEmote, setFloatingEmote] = useState<{ id: string; src: string } | null>(null);
  const [isLogExpanded, setIsLogExpanded] = useState(false);

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

  const latestLog = logs.length > 0 ? logs[logs.length - 1] : 'Trò chơi Cờ Tỷ Phú bắt đầu!';

  return (
    <>
      {/* Hiệu ứng bóng emote bay lên */}
      {floatingEmote && (
        <div className="fixed bottom-24 left-6 z-50 pointer-events-none animate-bounce">
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

      {/* Cụm góc trái dưới: Nhật ký 1 dòng thu gọn + Ví của tôi + 2 Nút Chat/Emote (cách mép tối thiểu 16px, không che ô bàn cờ) */}
      <div className="fixed bottom-4 left-4 z-30 pointer-events-auto select-none flex flex-col items-start gap-1.5 max-w-[94vw] sm:max-w-[340px]">
        {/* ================= NHẬT KÝ VÁN ĐẤU THU GỌN THÀNH 1 DÒNG ================= */}
        <div className="w-full">
          <button
            onClick={() => setIsLogExpanded(!isLogExpanded)}
            className="w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-slate-950/90 hover:bg-slate-900 border border-slate-800 text-[11px] text-slate-300 shadow-lg cursor-pointer transition active:scale-98"
            title="Nhấn để mở / thu gọn nhật ký"
          >
            <div className="flex items-center gap-1.5 overflow-hidden">
              <span className="font-bold text-amber-400 shrink-0">Nhật ký:</span>
              <span className="truncate text-slate-200">{latestLog}</span>
            </div>
            {isLogExpanded ? (
              <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
            ) : (
              <ChevronUp className="h-4 w-4 shrink-0 text-slate-400" />
            )}
          </button>

          {/* Hộp mở rộng danh sách nhật ký */}
          {isLogExpanded && (
            <div className="mt-1 max-h-36 overflow-y-auto space-y-1 rounded-xl bg-slate-950/95 border border-slate-800 p-2 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-150">
              {logs.slice(-8).map((log, idx) => (
                <div
                  key={idx}
                  className="rounded-lg bg-slate-900/80 px-2 py-1 text-[10px] text-slate-300 border border-slate-800/60"
                >
                  {log}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ================= VÍ CỦA TÔI + NÚT CHAT & BIỂU CẢM ================= */}
        <div className="flex items-center gap-2">
          {/* Ví của tôi */}
          {player && (
            <div className="flex items-center gap-2.5 rounded-2xl bg-slate-950/95 border-2 border-amber-500/40 px-2.5 py-1.5 shadow-2xl">
              <div className="relative h-9 w-9 rounded-full overflow-hidden border-2 border-amber-400 bg-slate-900 shrink-0">
                <Image
                  src={`/art/avatars/${player.character}.png`}
                  alt={player.name}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    (e.target as any).src = '/art/avatars/avatar-1.png';
                  }}
                />
              </div>

              <div className="text-left leading-tight">
                <div className="font-baloo text-sm font-black text-amber-300">
                  {player.money.toLocaleString('vi-VN')}đ
                </div>
                <div className="text-[10px] font-semibold text-slate-400 flex items-center gap-1.5">
                  <span>{ownedTilesCount} đất</span>
                  <span>•</span>
                  <span>{ownedHousesCount} nhà</span>
                </div>
              </div>

              {/* Nút xem danh sách tài sản */}
              {onViewAssets && (
                <button
                  onClick={onViewAssets}
                  className="ml-1 p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-amber-500/40 text-amber-300 hover:text-white transition active:scale-95"
                  title="Xem danh sách tài sản đã sở hữu"
                  aria-label="Danh sách tài sản"
                >
                  <ListFilter className="h-4 w-4" />
                </button>
              )}
            </div>
          )}

          {/* Nút Chat (💬) */}
          <button
            onClick={() => setActiveTab(activeTab === 'CHAT' ? 'NONE' : 'CHAT')}
            className={`h-10 w-10 sm:h-11 sm:w-11 min-h-[44px] min-w-[44px] rounded-full border-2 flex items-center justify-center transition-all cursor-pointer shadow-xl ${
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
            className={`h-10 w-10 sm:h-11 sm:w-11 min-h-[44px] min-w-[44px] rounded-full border-2 flex items-center justify-center transition-all cursor-pointer shadow-xl ${
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
      </div>

      {/* Popover Khay Chat Nhanh */}
      {activeTab === 'CHAT' && (
        <div className="fixed bottom-20 left-3 sm:left-4 z-40 w-72 rounded-2xl bg-slate-950 border-2 border-sky-500/50 p-3 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-150">
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
        <div className="fixed bottom-20 left-3 sm:left-4 z-40 w-72 rounded-2xl bg-slate-950 border-2 border-amber-500/50 p-3 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-150">
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

'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  MessageCircle,
  X,
  Send,
  Sparkles,
  ChevronRight,
  Flame,
} from 'lucide-react';
import {
  useChatStore,
  QUICK_CHAT_PHRASES,
  ChatMessage,
} from '@/lib/multiplayer/chatStore';
import { useGameStore } from '@/lib/game-engine/gameStore';
import { getMascotInfo } from './hudHelpers';
import { soundManager } from '@/lib/audio/soundManager';

export interface LiveChatBoxProps {
  className?: string;
}

/**
 * LiveChatBox Component
 * Provides a responsive, sleek live interaction panel with custom messaging
 * and one-tap authentic Vietnamese banter quick-chat chips.
 */
export function LiveChatBox({ className = '' }: LiveChatBoxProps) {
  const messages = useChatStore((state) => state.messages);
  const isChatOpen = useChatStore((state) => state.isChatOpen);
  const unreadCount = useChatStore((state) => state.unreadCount);
  const toggleChat = useChatStore((state) => state.toggleChat);
  const setChatOpen = useChatStore((state) => state.setChatOpen);
  const sendMessage = useChatStore((state) => state.sendMessage);
  const sendQuickChat = useChatStore((state) => state.sendQuickChat);

  const players = useGameStore((state) => state.players) || [];
  const activePlayerIndex = useGameStore((state) => state.activePlayerIndex) || 0;

  // Determine current acting player (first human player, or current turn player)
  const currentSender =
    players.find((p) => !p.isBot) || players[activePlayerIndex] || players[0];

  const senderId = currentSender?.id || 'player_1';
  const senderName = currentSender?.name || 'Bạn';
  const senderMascot = currentSender?.mascot || 'PIG';

  const [inputVal, setInputVal] = useState('');
  const [showQuickPhrases, setShowQuickPhrases] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom whenever messages update or chat is toggled open
  useEffect(() => {
    if (isChatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isChatOpen]);

  // Focus input when chat opens
  useEffect(() => {
    if (isChatOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isChatOpen]);

  const handleToggle = () => {
    soundManager.playClickSound();
    toggleChat();
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputVal.trim();
    if (!trimmed) return;

    soundManager.playClickSound();
    sendMessage(senderId, senderName, senderMascot, trimmed);
    setInputVal('');
  };

  const handleQuickChat = (phrase: string) => {
    soundManager.playClickSound();
    sendQuickChat(senderId, senderName, senderMascot, phrase);
  };

  const senderMascotInfo = getMascotInfo(senderMascot);

  return (
    <div className={`relative ${className}`}>
      {/* Floating Chat Toggle Button */}
      {!isChatOpen && (
        <button
          onClick={handleToggle}
          title="Mở trò chuyện trực tiếp"
          aria-label="Mở khung trò chuyện"
          className="group relative flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-white/20 bg-slate-900/90 text-white shadow-xl backdrop-blur-md transition-all duration-200 hover:scale-105 hover:border-amber-400 hover:bg-slate-800 active:scale-95"
        >
          <MessageCircle className="h-5 w-5 text-amber-400 transition-transform group-hover:scale-110" />

          {/* Unread Counter Badge */}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-black text-white ring-2 ring-slate-950 animate-bounce shadow-md">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Expanded Live Chat Box Panel */}
      {isChatOpen && (
        <div
          role="region"
          aria-label="Khung trò chuyện trực tiếp"
          className="relative flex h-[380px] w-80 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-white/15 bg-slate-950/95 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 bg-slate-900/80 px-3.5 py-2.5">
            <div className="flex items-center gap-2">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br ${senderMascotInfo.avatarBg} text-sm shadow`}
              >
                {senderMascotInfo.emoji}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white leading-tight">
                  Phòng Chat Sôi Nổi
                </span>
                <span className="text-[10px] text-amber-300">
                  {senderName} ({senderMascotInfo.name})
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                soundManager.playClickSound();
                setChatOpen(false);
              }}
              title="Đóng trò chuyện"
              aria-label="Đóng khung chat"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin scrollbar-thumb-slate-700">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center p-4 text-slate-400">
                <Sparkles className="h-8 w-8 text-amber-400/60 mb-2 animate-pulse" />
                <p className="text-xs font-medium text-slate-300">
                  Chưa có tin nhắn nào
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Hãy gửi lời chào hoặc chọn câu banter bên dưới để khuấy động ván cờ!
                </p>
              </div>
            ) : (
              messages.map((msg: ChatMessage) => {
                const isSelf = msg.senderId === senderId;
                const mascot = getMascotInfo(msg.mascot);

                if (msg.isSystem) {
                  return (
                    <div
                      key={msg.id}
                      className="my-1.5 flex justify-center text-center"
                    >
                      <span className="inline-block rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-0.5 text-[10px] font-semibold text-amber-300">
                        🔔 {msg.text}
                      </span>
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
                  >
                    {/* Sender Meta */}
                    <div className="flex items-center gap-1.5 mb-0.5 px-1 text-[10px] text-slate-400">
                      <span>{mascot.emoji}</span>
                      <span className="font-semibold text-slate-300">
                        {msg.senderName}
                      </span>
                      <span>•</span>
                      <span>
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {msg.isQuickChat && (
                        <span className="ml-1 inline-flex items-center gap-0.5 text-amber-400 font-bold">
                          <Flame className="h-2.5 w-2.5" />
                          Banter
                        </span>
                      )}
                    </div>

                    {/* Speech Bubble */}
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-1.5 text-xs font-medium leading-relaxed shadow-sm break-words ${
                        isSelf
                          ? 'rounded-br-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                          : 'rounded-bl-sm border border-white/10 bg-slate-800 text-slate-100'
                      } ${msg.isQuickChat ? 'border border-amber-400/40 ring-1 ring-amber-400/20' : ''}`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Chat Banter Carousel */}
          <div className="border-t border-white/10 bg-slate-900/60 p-2">
            <div className="mb-1.5 flex items-center justify-between text-[10px] text-slate-400">
              <span className="flex items-center gap-1 font-semibold text-amber-400">
                <Sparkles className="h-3 w-3" />
                Câu nói nhanh (Banter):
              </span>
              <button
                type="button"
                onClick={() => setShowQuickPhrases(!showQuickPhrases)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                {showQuickPhrases ? 'Thu gọn' : 'Mở'}
              </button>
            </div>

            {showQuickPhrases && (
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none scrollbar-thin scrollbar-thumb-slate-700">
                {QUICK_CHAT_PHRASES.map((phrase, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleQuickChat(phrase)}
                    className="shrink-0 rounded-lg border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-200 transition-all hover:scale-105 hover:border-amber-400 hover:bg-amber-500/20 active:scale-95"
                  >
                    {phrase}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Message Input Form */}
          <form
            onSubmit={handleSend}
            className="flex items-center gap-2 border-t border-white/10 bg-slate-900 p-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Nhập tin nhắn giao lưu..."
              maxLength={120}
              className="flex-1 rounded-xl border border-white/10 bg-slate-950 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
            <button
              type="submit"
              disabled={!inputVal.trim()}
              title="Gửi tin nhắn"
              aria-label="Gửi tin nhắn"
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-400 text-slate-950 transition-all hover:bg-amber-300 disabled:opacity-40 disabled:hover:bg-amber-400 active:scale-95 shadow-md"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default LiveChatBox;

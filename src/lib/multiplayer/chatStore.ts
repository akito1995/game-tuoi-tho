import { create } from 'zustand';
import { MascotType } from '@/lib/game-engine/types';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  mascot: MascotType;
  text: string;
  timestamp: number;
  isQuickChat?: boolean;
  isSystem?: boolean;
}

export interface ActiveEmote {
  id: string;
  senderId: string;
  senderName: string;
  mascot: MascotType;
  emoji: string;
  label: string;
  timestamp: number;
  xPercent: number; // 0 - 100% of viewport width
  yPercent: number; // 0 - 100% of viewport height
}

export interface EmoteDefinition {
  id: string;
  emoji: string;
  label: string;
  desc: string;
}

/**
 * 8 authentic Vietnamese banter phrases for live quick chat
 */
export const QUICK_CHAT_PHRASES: readonly string[] = [
  'Cứu tui với bà con ơi! 🚑',
  'Cay thế nhờ! 😂',
  'Đại gia nào cho vay 100k đi! 💸',
  'Vào tù vui vẻ nhé bạn hiền! 🚔',
  'Trúng quả đậm rồi kaka! 💰',
  'May mắn thôi con gà ạ! 🐔',
  'Đừng giẫm vào resort của tui nha! 🏖️',
  'Chào cả nhà, cùng chơi vui vẻ nhé! 👋',
] as const;

/**
 * 7 expressive emotes for interactive in-game reactions
 */
export const EMOTE_DEFINITIONS: readonly EmoteDefinition[] = [
  { id: 'heart', emoji: '❤️', label: 'Thả tim', desc: 'Yêu thương' },
  { id: 'laugh', emoji: '😂', label: 'Cười lăn', desc: 'Haha' },
  { id: 'cry', emoji: '😭', label: 'Khóc ròng', desc: 'Cay đắng' },
  { id: 'sandal', emoji: '🩴', label: 'Ném dép', desc: 'Troll bạn' },
  { id: 'clap', emoji: '👏', label: 'Vỗ tay', desc: 'Đỉnh chóp' },
  { id: 'fire', emoji: '🔥', label: 'Quyết chiến', desc: 'Cháy lên' },
  { id: 'money', emoji: '💸', label: 'Rải tiền', desc: 'Đại gia' },
] as const;

const MAX_CHAT_MESSAGES = 50;
const DEFAULT_EMOTE_LIFETIME_MS = 3000;

export interface ChatStore {
  messages: ChatMessage[];
  activeEmotes: ActiveEmote[];
  isChatOpen: boolean;
  unreadCount: number;

  sendMessage: (
    senderId: string,
    senderName: string,
    mascot: MascotType,
    text: string
  ) => void;
  sendQuickChat: (
    senderId: string,
    senderName: string,
    mascot: MascotType,
    phrase: string
  ) => void;
  sendSystemMessage: (text: string) => void;
  triggerEmote: (
    senderId: string,
    senderName: string,
    mascot: MascotType,
    emoji: string,
    label: string,
    coords?: { xPercent?: number; yPercent?: number }
  ) => ActiveEmote;
  clearOldEmotes: (maxAgeMs?: number) => void;
  removeEmote: (id: string) => void;
  toggleChat: (open?: boolean) => void;
  setChatOpen: (open: boolean) => void;
  clearUnread: () => void;
  clearMessages: () => void;
  resetChat: () => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  activeEmotes: [],
  isChatOpen: false,
  unreadCount: 0,

  sendMessage: (senderId, senderName, mascot, text) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      senderId,
      senderName,
      mascot,
      text: trimmed,
      timestamp: Date.now(),
      isQuickChat: false,
    };

    set((state) => {
      const nextMessages = [...state.messages, newMessage];
      const boundedMessages =
        nextMessages.length > MAX_CHAT_MESSAGES
          ? nextMessages.slice(nextMessages.length - MAX_CHAT_MESSAGES)
          : nextMessages;

      return {
        messages: boundedMessages,
        unreadCount: state.isChatOpen ? 0 : state.unreadCount + 1,
      };
    });
  },

  sendQuickChat: (senderId, senderName, mascot, phrase) => {
    const trimmed = phrase.trim();
    if (!trimmed) return;

    const newMessage: ChatMessage = {
      id: `msg_quick_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      senderId,
      senderName,
      mascot,
      text: trimmed,
      timestamp: Date.now(),
      isQuickChat: true,
    };

    set((state) => {
      const nextMessages = [...state.messages, newMessage];
      const boundedMessages =
        nextMessages.length > MAX_CHAT_MESSAGES
          ? nextMessages.slice(nextMessages.length - MAX_CHAT_MESSAGES)
          : nextMessages;

      return {
        messages: boundedMessages,
        unreadCount: state.isChatOpen ? 0 : state.unreadCount + 1,
      };
    });
  },

  sendSystemMessage: (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const systemMsg: ChatMessage = {
      id: `msg_sys_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      senderId: 'system',
      senderName: 'Hệ thống',
      mascot: 'BUFFALO',
      text: trimmed,
      timestamp: Date.now(),
      isSystem: true,
    };

    set((state) => {
      const nextMessages = [...state.messages, systemMsg];
      const boundedMessages =
        nextMessages.length > MAX_CHAT_MESSAGES
          ? nextMessages.slice(nextMessages.length - MAX_CHAT_MESSAGES)
          : nextMessages;

      return {
        messages: boundedMessages,
        unreadCount: state.isChatOpen ? 0 : state.unreadCount + 1,
      };
    });
  },

  triggerEmote: (senderId, senderName, mascot, emoji, label, coords) => {
    // Generate random default position around bottom/center of the screen
    // xPercent between 20% and 80%, yPercent between 50% and 75%
    const defaultX = Math.round(20 + Math.random() * 60);
    const defaultY = Math.round(50 + Math.random() * 25);

    const newEmote: ActiveEmote = {
      id: `emote_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      senderId,
      senderName,
      mascot,
      emoji,
      label,
      timestamp: Date.now(),
      xPercent: coords?.xPercent ?? defaultX,
      yPercent: coords?.yPercent ?? defaultY,
    };

    set((state) => ({
      activeEmotes: [...state.activeEmotes, newEmote],
    }));

    return newEmote;
  },

  clearOldEmotes: (maxAgeMs = DEFAULT_EMOTE_LIFETIME_MS) => {
    const now = Date.now();
    set((state) => ({
      activeEmotes: state.activeEmotes.filter((e) => now - e.timestamp <= maxAgeMs),
    }));
  },

  removeEmote: (id) => {
    set((state) => ({
      activeEmotes: state.activeEmotes.filter((e) => e.id !== id),
    }));
  },

  toggleChat: (open) => {
    set((state) => {
      const nextOpen = open !== undefined ? open : !state.isChatOpen;
      return {
        isChatOpen: nextOpen,
        unreadCount: nextOpen ? 0 : state.unreadCount,
      };
    });
  },

  setChatOpen: (open) => {
    set((state) => ({
      isChatOpen: open,
      unreadCount: open ? 0 : state.unreadCount,
    }));
  },

  clearUnread: () => {
    set({ unreadCount: 0 });
  },

  clearMessages: () => {
    set({ messages: [] });
  },

  resetChat: () => {
    set({
      messages: [],
      activeEmotes: [],
      isChatOpen: false,
      unreadCount: 0,
    });
  },
}));

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  useChatStore,
  QUICK_CHAT_PHRASES,
  EMOTE_DEFINITIONS,
  ChatMessage,
  ActiveEmote,
} from '@/lib/multiplayer/chatStore';

describe('chatStore (Multiplayer Live Chat & Emotes)', () => {
  beforeEach(() => {
    useChatStore.getState().resetChat();
    vi.useRealTimers();
  });

  describe('Initial State & Definitions', () => {
    it('initializes with empty messages and closed state', () => {
      const state = useChatStore.getState();
      expect(state.messages).toEqual([]);
      expect(state.activeEmotes).toEqual([]);
      expect(state.isChatOpen).toBe(false);
      expect(state.unreadCount).toBe(0);
    });

    it('exports all 8 authentic Vietnamese quick chat banter phrases', () => {
      expect(QUICK_CHAT_PHRASES).toHaveLength(8);
      expect(QUICK_CHAT_PHRASES).toContain('Cứu tui với bà con ơi! 🚑');
      expect(QUICK_CHAT_PHRASES).toContain('Cay thế nhờ! 😂');
      expect(QUICK_CHAT_PHRASES).toContain('Đại gia nào cho vay 100k đi! 💸');
      expect(QUICK_CHAT_PHRASES).toContain('Vào tù vui vẻ nhé bạn hiền! 🚔');
      expect(QUICK_CHAT_PHRASES).toContain('Trúng quả đậm rồi kaka! 💰');
      expect(QUICK_CHAT_PHRASES).toContain('May mắn thôi con gà ạ! 🐔');
      expect(QUICK_CHAT_PHRASES).toContain('Đừng giẫm vào resort của tui nha! 🏖️');
      expect(QUICK_CHAT_PHRASES).toContain('Chào cả nhà, cùng chơi vui vẻ nhé! 👋');
    });

    it('exports the 7 required expressive emotes with Vietnamese labels', () => {
      expect(EMOTE_DEFINITIONS).toHaveLength(7);
      const emojis = EMOTE_DEFINITIONS.map((e) => e.emoji);
      expect(emojis).toEqual(
        expect.arrayContaining(['❤️', '😂', '😭', '🩴', '👏', '🔥', '💸'])
      );
    });
  });

  describe('Live Text Chat', () => {
    it('sends a chat message and updates messages list', () => {
      useChatStore.getState().sendMessage('p1', 'Bé Heo', 'PIG', 'Hello anh em!');
      const messages = useChatStore.getState().messages;

      expect(messages).toHaveLength(1);
      expect(messages[0].senderId).toBe('p1');
      expect(messages[0].senderName).toBe('Bé Heo');
      expect(messages[0].mascot).toBe('PIG');
      expect(messages[0].text).toBe('Hello anh em!');
      expect(typeof messages[0].id).toBe('string');
      expect(typeof messages[0].timestamp).toBe('number');
    });

    it('ignores empty and whitespace-only messages', () => {
      useChatStore.getState().sendMessage('p1', 'Bé Heo', 'PIG', '');
      useChatStore.getState().sendMessage('p1', 'Bé Heo', 'PIG', '    ');
      expect(useChatStore.getState().messages).toHaveLength(0);
    });

    it('retains maximum of 50 messages to prevent unbounded memory growth', () => {
      for (let i = 1; i <= 60; i++) {
        useChatStore
          .getState()
          .sendMessage('p1', 'Bé Heo', 'PIG', `Message #${i}`);
      }

      const messages = useChatStore.getState().messages;
      expect(messages).toHaveLength(50);
      expect(messages[0].text).toBe('Message #11');
      expect(messages[49].text).toBe('Message #60');
    });

    it('sends quick chat banter phrases with isQuickChat flag', () => {
      useChatStore
        .getState()
        .sendQuickChat('p2', 'Bé Cáo', 'FOX', 'Cay thế nhờ! 😂');

      const messages = useChatStore.getState().messages;
      expect(messages).toHaveLength(1);
      expect(messages[0].isQuickChat).toBe(true);
      expect(messages[0].text).toBe('Cay thế nhờ! 😂');
    });

    it('sends system announcements with isSystem flag', () => {
      useChatStore.getState().sendSystemMessage('Trò chơi bắt đầu!');
      const messages = useChatStore.getState().messages;

      expect(messages).toHaveLength(1);
      expect(messages[0].isSystem).toBe(true);
      expect(messages[0].text).toBe('Trò chơi bắt đầu!');
      expect(messages[0].senderName).toBe('Hệ thống');
    });
  });

  describe('Unread Badge Tracking & Panel Toggling', () => {
    it('increments unreadCount when message arrives while chat is closed', () => {
      expect(useChatStore.getState().isChatOpen).toBe(false);
      expect(useChatStore.getState().unreadCount).toBe(0);

      useChatStore.getState().sendMessage('p1', 'Bé Heo', 'PIG', 'Tin 1');
      expect(useChatStore.getState().unreadCount).toBe(1);

      useChatStore.getState().sendMessage('p2', 'Bé Cáo', 'FOX', 'Tin 2');
      expect(useChatStore.getState().unreadCount).toBe(2);
    });

    it('does not increment unreadCount when message arrives while chat is open', () => {
      useChatStore.getState().setChatOpen(true);
      useChatStore.getState().sendMessage('p1', 'Bé Heo', 'PIG', 'Tin 1');
      expect(useChatStore.getState().unreadCount).toBe(0);
    });

    it('resets unreadCount when chat is opened', () => {
      useChatStore.getState().sendMessage('p1', 'Bé Heo', 'PIG', 'Tin 1');
      useChatStore.getState().sendMessage('p2', 'Bé Cáo', 'FOX', 'Tin 2');
      expect(useChatStore.getState().unreadCount).toBe(2);

      useChatStore.getState().setChatOpen(true);
      expect(useChatStore.getState().unreadCount).toBe(0);
    });

    it('toggles chat open/close properly', () => {
      useChatStore.getState().toggleChat();
      expect(useChatStore.getState().isChatOpen).toBe(true);

      useChatStore.getState().toggleChat();
      expect(useChatStore.getState().isChatOpen).toBe(false);

      useChatStore.getState().toggleChat(true);
      expect(useChatStore.getState().isChatOpen).toBe(true);
    });
  });

  describe('Floating Emote Reactions', () => {
    it('triggers an active emote with coordinate attributes', () => {
      const emote = useChatStore
        .getState()
        .triggerEmote('p1', 'Bé Heo', 'PIG', '🩴', 'Ném dép', {
          xPercent: 45,
          yPercent: 70,
        });

      const active = useChatStore.getState().activeEmotes;
      expect(active).toHaveLength(1);
      expect(active[0].emoji).toBe('🩴');
      expect(active[0].label).toBe('Ném dép');
      expect(active[0].senderName).toBe('Bé Heo');
      expect(active[0].xPercent).toBe(45);
      expect(active[0].yPercent).toBe(70);
      expect(typeof emote.id).toBe('string');
    });

    it('assigns random default coordinates if coords omitted', () => {
      useChatStore.getState().triggerEmote('p1', 'Bé Heo', 'PIG', '🔥', 'Quyết chiến');
      const emote = useChatStore.getState().activeEmotes[0];

      expect(emote.xPercent).toBeGreaterThanOrEqual(15);
      expect(emote.xPercent).toBeLessThanOrEqual(85);
      expect(emote.yPercent).toBeGreaterThanOrEqual(45);
      expect(emote.yPercent).toBeLessThanOrEqual(80);
    });

    it('removes specific emote by id', () => {
      const e1 = useChatStore
        .getState()
        .triggerEmote('p1', 'Bé Heo', 'PIG', '❤️', 'Thả tim');
      const e2 = useChatStore
        .getState()
        .triggerEmote('p2', 'Bé Cáo', 'FOX', '👏', 'Vỗ tay');

      expect(useChatStore.getState().activeEmotes).toHaveLength(2);

      useChatStore.getState().removeEmote(e1.id);
      const remaining = useChatStore.getState().activeEmotes;
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe(e2.id);
    });

    it('clears expired emotes after maxAgeMs', () => {
      vi.useFakeTimers();
      const baseTime = 10000;
      vi.setSystemTime(baseTime);

      useChatStore
        .getState()
        .triggerEmote('p1', 'Bé Heo', 'PIG', '😂', 'Cười lăn');

      // 2 seconds later, trigger second emote
      vi.setSystemTime(baseTime + 2000);
      useChatStore
        .getState()
        .triggerEmote('p2', 'Bé Cáo', 'FOX', '💸', 'Rải tiền');

      expect(useChatStore.getState().activeEmotes).toHaveLength(2);

      // Advance to baseTime + 3500ms (first is 3500ms old, second is 1500ms old)
      vi.setSystemTime(baseTime + 3500);
      useChatStore.getState().clearOldEmotes(3000);

      const active = useChatStore.getState().activeEmotes;
      expect(active).toHaveLength(1);
      expect(active[0].emoji).toBe('💸');

      // Advance to baseTime + 5500ms (second is also >3000ms old)
      vi.setSystemTime(baseTime + 5500);
      useChatStore.getState().clearOldEmotes(3000);
      expect(useChatStore.getState().activeEmotes).toHaveLength(0);
    });
  });
});

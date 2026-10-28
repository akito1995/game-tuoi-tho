/**
 * Vietnamese Childhood Games Portal - Room & Lobby Store
 *
 * Manages multiplayer room lifecycle, player roster, mascot selection with uniqueness checks,
 * bot fillers, ready states, and game launch conditions.
 */

import { create } from 'zustand';
import { MascotType } from '@/lib/game-engine/types';
import {
  GameMode,
  RoomStatus,
  LobbyPlayer,
  RoomState,
} from './protocol';

export const ALL_MASCOTS: MascotType[] = ['PIG', 'FOX', 'CAT', 'BUFFALO'];

export interface MascotInfo {
  name: string;
  emoji: string;
  title: string;
  color: string;
  desc: string;
}

export const MASCOT_INFO: Record<MascotType, MascotInfo> = {
  PIG: {
    name: 'Heo Phượt',
    emoji: '🐷',
    title: 'Heo Phượt 🐷',
    color: '#f472b6',
    desc: 'Du lịch muôn nơi, thu tiền rủng rỉnh',
  },
  FOX: {
    name: 'Cáo Tí',
    emoji: '🦊',
    title: 'Cáo Tí 🦊',
    color: '#fb923c',
    desc: 'Nhanh nhẹn, mưu lược, đàm phán cừ khôi',
  },
  CAT: {
    name: 'Mèo Ú',
    emoji: '🐱',
    title: 'Mèo Ú 🐱',
    color: '#facc15',
    desc: 'May mắn vẫy gọi, hút tiền tài lộc',
  },
  BUFFALO: {
    name: 'Trâu Vàng',
    emoji: '🐂',
    title: 'Trâu Vàng 🐂',
    color: '#ca8a04',
    desc: 'Chăm chỉ bền bỉ, tích lũy điền trang',
  },
};

const BOT_NAMES = ['Bot Tí Nị 🤖', 'Bot Thần Tài 💰', 'Bot Thần Tốc ⚡', 'Bot Siêu Trí 🧠'];

/**
 * Generates standard room PIN like TYPHU-A89K or with custom prefix
 */
export function generateRoomPin(prefix = 'TYPHU'): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return prefix ? `${prefix}-${code}` : code;
}

/**
 * Generates simple clean alphanumeric room PIN with specified length
 */
export function generateSimplePin(length = 6): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let pin = '';
  for (let i = 0; i < length; i++) {
    pin += chars[Math.floor(Math.random() * chars.length)];
  }
  return pin;
}

export interface RoomStore {
  roomId: string | null;
  mode: GameMode;
  players: LobbyPlayer[];
  myPlayerId: string;
  isHost: boolean;
  status: RoomStatus;
  maxPlayers: number;

  // Actions
  initHostRoom: (
    roomId?: string,
    hostName?: string,
    mode?: GameMode,
    mascot?: MascotType
  ) => string;
  joinRoom: (
    roomId: string,
    playerName: string,
    preferredMascot?: MascotType
  ) => LobbyPlayer | null;
  setMode: (mode: GameMode) => void;
  addPlayer: (params: {
    name: string;
    isBot?: boolean;
    mascot?: MascotType;
    id?: string;
    isReady?: boolean;
  }) => LobbyPlayer | null;
  removePlayer: (playerId: string) => void;
  updatePlayerMascot: (playerId: string, mascot: MascotType) => boolean;
  toggleReady: (playerId: string, isReady?: boolean) => void;
  fillWithBots: () => void;
  removeBot: (botId: string) => void;
  setPlayers: (players: LobbyPlayer[]) => void;
  setRoomState: (room: Partial<RoomState>) => void;
  canStartGame: () => boolean;
  startGame: () => boolean;
  resetRoom: () => void;
  getAvailableMascots: () => MascotType[];
  isMascotAvailable: (mascot: MascotType) => boolean;
}

export const useRoomStore = create<RoomStore>((set, get) => ({
  roomId: null,
  mode: 'ONLINE_P2P',
  players: [],
  myPlayerId: '',
  isHost: false,
  status: 'IDLE',
  maxPlayers: 4,

  initHostRoom: (roomId, hostName = 'Chủ Phòng', mode = 'ONLINE_P2P', mascot = 'PIG') => {
    const finalRoomId = roomId || generateRoomPin('TYPHU');
    const hostId = `host_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const hostPlayer: LobbyPlayer = {
      id: hostId,
      name: hostName,
      mascot,
      isHost: true,
      isReady: true,
      isBot: false,
      connected: true,
    };

    set({
      roomId: finalRoomId,
      mode,
      players: [hostPlayer],
      myPlayerId: hostId,
      isHost: true,
      status: 'LOBBY',
      maxPlayers: 4,
    });

    return finalRoomId;
  },

  joinRoom: (roomId, playerName, preferredMascot) => {
    const state = get();
    if (state.players.length >= state.maxPlayers) {
      return null;
    }

    const availableMascots = get().getAvailableMascots();
    const chosenMascot =
      preferredMascot && availableMascots.includes(preferredMascot)
        ? preferredMascot
        : availableMascots[0] || 'FOX';

    const guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const guestPlayer: LobbyPlayer = {
      id: guestId,
      name: playerName,
      mascot: chosenMascot,
      isHost: false,
      isReady: false,
      isBot: false,
      connected: true,
    };

    set({
      roomId,
      myPlayerId: guestId,
      isHost: false,
      status: 'LOBBY',
      players: [...state.players, guestPlayer],
    });

    return guestPlayer;
  },

  setMode: (mode) => {
    set({ mode });
  },

  addPlayer: ({ name, isBot = false, mascot, id, isReady = false }) => {
    const state = get();
    if (state.players.length >= state.maxPlayers) {
      return null;
    }

    const availableMascots = get().getAvailableMascots();
    const assignedMascot =
      mascot && availableMascots.includes(mascot)
        ? mascot
        : availableMascots[0] || 'BUFFALO';

    const playerId = id || `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newPlayer: LobbyPlayer = {
      id: playerId,
      name,
      mascot: assignedMascot,
      isHost: false,
      isReady: isBot ? true : isReady,
      isBot,
      connected: true,
    };

    set((s) => ({
      players: [...s.players, newPlayer],
    }));

    return newPlayer;
  },

  removePlayer: (playerId) => {
    set((state) => ({
      players: state.players.filter((p) => p.id !== playerId),
    }));
  },

  updatePlayerMascot: (playerId, mascot) => {
    const state = get();
    // Check if another player already claimed this mascot
    const alreadyTaken = state.players.some(
      (p) => p.id !== playerId && p.mascot === mascot
    );

    if (alreadyTaken) {
      return false;
    }

    set((s) => ({
      players: s.players.map((p) =>
        p.id === playerId ? { ...p, mascot } : p
      ),
    }));

    return true;
  },

  toggleReady: (playerId, isReady) => {
    set((state) => ({
      players: state.players.map((p) => {
        if (p.id === playerId) {
          const nextReady = isReady !== undefined ? isReady : !p.isReady;
          return { ...p, isReady: nextReady };
        }
        return p;
      }),
    }));
  },

  fillWithBots: () => {
    const state = get();
    const needed = state.maxPlayers - state.players.length;
    if (needed <= 0) return;

    let availableMascots = get().getAvailableMascots();
    const newBots: LobbyPlayer[] = [];

    for (let i = 0; i < needed; i++) {
      if (availableMascots.length === 0) break;
      const botMascot = availableMascots[0];
      availableMascots = availableMascots.slice(1);

      const botName = BOT_NAMES[i % BOT_NAMES.length] || `Bot AI ${i + 1} 🤖`;
      const botId = `bot_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 5)}`;

      newBots.push({
        id: botId,
        name: botName,
        mascot: botMascot,
        isHost: false,
        isReady: true,
        isBot: true,
        connected: true,
      });
    }

    set((s) => ({
      players: [...s.players, ...newBots],
    }));
  },

  removeBot: (botId) => {
    set((state) => ({
      players: state.players.filter((p) => !(p.isBot && p.id === botId)),
    }));
  },

  setPlayers: (players) => {
    set({ players });
  },

  setRoomState: (room) => {
    set((state) => ({
      ...state,
      ...room,
    }));
  },

  getAvailableMascots: () => {
    const state = get();
    const usedMascots = new Set(state.players.map((p) => p.mascot));
    return ALL_MASCOTS.filter((m) => !usedMascots.has(m));
  },

  isMascotAvailable: (mascot) => {
    const state = get();
    return !state.players.some((p) => p.mascot === mascot);
  },

  canStartGame: () => {
    const state = get();
    if (state.players.length < 2) {
      return false;
    }

    if (state.mode === 'ONLINE_P2P') {
      // In online mode, all non-host players must be ready
      const nonHostPlayers = state.players.filter((p) => !p.isHost);
      return nonHostPlayers.every((p) => p.isReady);
    }

    // In BOT_AI or PASS_AND_PLAY, game can start whenever >= 2 players
    return true;
  },

  startGame: () => {
    if (!get().canStartGame()) {
      return false;
    }

    set({ status: 'PLAYING' });
    return true;
  },

  resetRoom: () => {
    set({
      roomId: null,
      mode: 'ONLINE_P2P',
      players: [],
      myPlayerId: '',
      isHost: false,
      status: 'IDLE',
      maxPlayers: 4,
    });
  },
}));

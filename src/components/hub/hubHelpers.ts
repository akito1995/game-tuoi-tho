import { MascotType, Player } from '@/lib/game-engine/types';
import { useGameStore } from '@/lib/game-engine/gameStore';
import { ALL_MASCOTS } from '@/lib/multiplayer/roomStore';

export interface UserProfile {
  nickname: string;
  mascot: MascotType;
  matchesPlayed: number;
  wins: number;
  maxNetWorth: number;
}

export const DEFAULT_PROFILE: UserProfile = {
  nickname: 'Kỳ Thủ Nhí',
  mascot: 'PIG',
  matchesPlayed: 0,
  wins: 0,
  maxNetWorth: 2000000,
};

export const PROFILE_STORAGE_KEY = 'vietnamese_childhood_games_user_profile';
export const VOTES_STORAGE_KEY = 'vietnamese_childhood_games_votes';

class MemoryStorage {
  private store: Record<string, string> = {};
  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }
  setItem(key: string, val: string): void {
    this.store[key] = String(val);
  }
  removeItem(key: string): void {
    delete this.store[key];
  }
  clear(): void {
    this.store = {};
  }
}

const memoryStorage = new MemoryStorage();

export function getSafeStorage() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const testKey = '__storage_test__';
      window.localStorage.setItem(testKey, '1');
      window.localStorage.removeItem(testKey);
      return window.localStorage;
    }
  } catch {
    // Ignore and fallback
  }
  return memoryStorage;
}

export function clearHubStorage() {
  const storage = getSafeStorage();
  try {
    storage.removeItem(PROFILE_STORAGE_KEY);
    storage.removeItem(VOTES_STORAGE_KEY);
  } catch {}
}

/**
 * Retrieves the current user profile from storage or fallback default.
 */
export function getUserProfile(): UserProfile {
  const storage = getSafeStorage();
  try {
    const raw = storage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PROFILE };
    const parsed = JSON.parse(raw);
    return {
      nickname: parsed.nickname || DEFAULT_PROFILE.nickname,
      mascot: parsed.mascot || DEFAULT_PROFILE.mascot,
      matchesPlayed: typeof parsed.matchesPlayed === 'number' ? parsed.matchesPlayed : 0,
      wins: typeof parsed.wins === 'number' ? parsed.wins : 0,
      maxNetWorth: typeof parsed.maxNetWorth === 'number' ? parsed.maxNetWorth : DEFAULT_PROFILE.maxNetWorth,
    };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

/**
 * Updates user profile fields and commits to storage.
 */
export function saveUserProfile(profileUpdate: Partial<UserProfile>): UserProfile {
  const current = getUserProfile();
  const updated: UserProfile = {
    ...current,
    ...profileUpdate,
  };

  const storage = getSafeStorage();
  try {
    storage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save profile', e);
  }

  return updated;
}

/**
 * Records match completion statistics (matches played, wins, max net worth).
 */
export function recordGameStats(stats: { won?: boolean; netWorth?: number }): UserProfile {
  const current = getUserProfile();
  const updated: UserProfile = {
    ...current,
    matchesPlayed: current.matchesPlayed + 1,
    wins: stats.won ? current.wins + 1 : current.wins,
    maxNetWorth:
      typeof stats.netWorth === 'number'
        ? Math.max(current.maxNetWorth, stats.netWorth)
        : current.maxNetWorth,
  };

  const storage = getSafeStorage();
  try {
    storage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save profile stats', e);
  }

  return updated;
}

/**
 * Pass & Play Launcher Setup
 */
export interface PassAndPlayPlayerConfig {
  name: string;
  mascot: MascotType;
}

export function setupPassAndPlayGame(
  playersConfig: PassAndPlayPlayerConfig[]
): Partial<Player>[] {
  const playersInput: Partial<Player>[] = playersConfig.map((p, idx) => ({
    id: `player_${idx + 1}`,
    name: p.name.trim() || `Người Chơi ${idx + 1}`,
    mascot: p.mascot,
    isBot: false,
    money: 2000000,
  }));

  useGameStore.getState().initGame(playersInput);
  return playersInput;
}

/**
 * Bot AI Launcher Setup
 */
const BOT_NAMES = ['Bot Tí Nị 🤖', 'Bot Thần Tài 💰', 'Bot Thần Tốc ⚡'];

export function setupBotGame(
  humanPlayer: { name: string; mascot: MascotType },
  botCount: number
): Partial<Player>[] {
  const humanConfig: Partial<Player> = {
    id: 'player_human',
    name: humanPlayer.name.trim() || 'Kỳ Thủ',
    mascot: humanPlayer.mascot,
    isBot: false,
    money: 2000000,
  };

  // Available mascots excluding human's chosen mascot
  const remainingMascots = ALL_MASCOTS.filter((m) => m !== humanPlayer.mascot);

  const botPlayers: Partial<Player>[] = [];
  const count = Math.max(1, Math.min(3, botCount));

  for (let i = 0; i < count; i++) {
    const mascot = remainingMascots[i % remainingMascots.length];
    const name = BOT_NAMES[i % BOT_NAMES.length];
    botPlayers.push({
      id: `player_bot_${i + 1}`,
      name,
      mascot,
      isBot: true,
      money: 2000000,
    });
  }

  const allPlayers = [humanConfig, ...botPlayers];
  useGameStore.getState().initGame(allPlayers);
  return allPlayers;
}

/**
 * Room PIN validation (6-character code or TYPHU-XXXX)
 */
export function validateRoomPin(pin: string): boolean {
  if (!pin) return false;
  const cleaned = pin.trim().toUpperCase();
  // 6-alphanumeric PIN or TYPHU-XXXX format
  const isSixAlphanumeric = /^[A-Z0-9]{6}$/.test(cleaned);
  const isPrefixPin = /^TYPHU-[A-Z0-9]{4}$/.test(cleaned);
  return isSixAlphanumeric || isPrefixPin;
}

/**
 * Upcoming Childhood Games List
 */
export interface UpcomingGame {
  id: string;
  title: string;
  vietnameseTitle: string;
  icon: string;
  description: string;
  tags: string[];
  defaultVotes: number;
  releaseQuarter: string;
  color: string;
}

export const UPCOMING_GAMES: UpcomingGame[] = [
  {
    id: 'o-an-quan',
    title: 'Ô Ăn Quan',
    vietnameseTitle: 'Ô Ăn Quan Dân Gian',
    icon: '🪨',
    description: 'Trò chơi rải sỏi tính toán nước đi thần kỳ của tuổi thơ, ăn quan rải dân.',
    tags: ['2 Người', 'Chiến Thuật', 'Dân Gian'],
    defaultVotes: 1240,
    releaseQuarter: 'Q2/2026',
    color: 'from-amber-600 to-yellow-500',
  },
  {
    id: 'co-ca-ngua',
    title: 'Cờ Cá Ngựa',
    vietnameseTitle: 'Cờ Cá Ngựa Sắc Màu',
    icon: '🐎',
    description: 'Đường đua ngựa bốn màu vui nhộn, đá ngựa đối thủ về chuồng để chiến thắng.',
    tags: ['2-4 Người', 'Gia Đình', 'Đua Tốc Độ'],
    defaultVotes: 980,
    releaseQuarter: 'Q2/2026',
    color: 'from-rose-600 to-orange-500',
  },
  {
    id: 'bau-cua-tom-ca',
    title: 'Bầu Cua Tôm Cá',
    vietnameseTitle: 'Bầu Cua Tôm Cá Lễ Hội',
    icon: '🦀',
    description: 'Chiếc bát, chiếc đĩa và 3 viên xúc xắc linh vật rộn rã không khí ngày Tết.',
    tags: ['Nhiều Người', 'Lễ Hội', 'Vui Nhộn'],
    defaultVotes: 856,
    releaseQuarter: 'Q3/2026',
    color: 'from-emerald-600 to-teal-500',
  },
  {
    id: 'ban-bi',
    title: 'Bắn Bi',
    vietnameseTitle: 'Bắn Bi Đất Tuổi Thơ',
    icon: '🔮',
    description: 'Gẩy bi chuẩn xác, đo lỗ, ăn bi bè bạn mô phỏng vật lý 3D chân thực.',
    tags: ['1-2 Người', 'Vật Lý 3D', 'Kỹ Năng'],
    defaultVotes: 732,
    releaseQuarter: 'Q3/2026',
    color: 'from-blue-600 to-indigo-500',
  },
];

/**
 * Retrieve votes dictionary from storage
 */
export function getGameVotes(): Record<string, number> {
  const result: Record<string, number> = {};
  UPCOMING_GAMES.forEach((g) => {
    result[g.id] = g.defaultVotes;
  });

  const storage = getSafeStorage();
  try {
    const raw = storage.getItem(VOTES_STORAGE_KEY);
    if (!raw) return result;
    const parsed = JSON.parse(raw);
    Object.keys(parsed).forEach((k) => {
      if (typeof parsed[k] === 'number') {
        result[k] = parsed[k];
      }
    });
    return result;
  } catch {
    return result;
  }
}

/**
 * Vote for an upcoming game
 */
export function voteForGame(gameId: string): Record<string, number> {
  const current = getGameVotes();
  const currentVal = current[gameId] ?? 0;
  const updated = {
    ...current,
    [gameId]: currentVal + 1,
  };

  const storage = getSafeStorage();
  try {
    storage.setItem(VOTES_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save game votes', e);
  }

  return updated;
}

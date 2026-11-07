/**
 * CỜ TỶ PHÚ v2 (2.5D) - HÀNH TRÌNH XUYÊN VIỆT
 * Game Core Types (Bộ não trò chơi theo rules-v2.md)
 */

export type CharacterId = 'be-ti' | 'co-hoa' | 'ong-bay' | 'chi-may';

export interface CharacterDef {
  id: CharacterId;
  name: string;
  color: string;
  description: string;
  avatarPath: string;
}

export const CHARACTERS: Record<CharacterId, CharacterDef> = {
  'be-ti': {
    id: 'be-ti',
    name: 'Bé Tí',
    color: '#E5484D',
    description: 'Nhanh nhẹn, lém lỉnh, tràn đầy nhiệt huyết',
    avatarPath: '/art/avatars/avatar-1.png',
  },
  'co-hoa': {
    id: 'co-hoa',
    name: 'Cô Hoa',
    color: '#19B8A6',
    description: 'Dịu dàng, kinh doanh khéo léo, chu đáo',
    avatarPath: '/art/avatars/avatar-2.png',
  },
  'ong-bay': {
    id: 'ong-bay',
    name: 'Ông Bảy',
    color: '#F5B83D',
    description: 'Vui vẻ, từng trải, hào sảng Nam Bộ',
    avatarPath: '/art/avatars/avatar-3.png',
  },
  'chi-may': {
    id: 'chi-may',
    name: 'Chị Mây',
    color: '#8B6CF0',
    description: 'Hiện đại, thông minh, tính toán sắc sảo',
    avatarPath: '/art/avatars/avatar-4.png',
  },
};

export type TileType =
  | 'START'
  | 'PROPERTY'
  | 'CHANCE'
  | 'FATE'
  | 'TAX'
  | 'TRANSPORT'
  | 'UTILITY'
  | 'JAIL'
  | 'REST'
  | 'GO_TO_JAIL';

export type ColorGroup =
  | 'BROWN'
  | 'LIGHT_BLUE'
  | 'PINK'
  | 'ORANGE'
  | 'RED'
  | 'YELLOW'
  | 'GREEN'
  | 'DARK_BLUE'
  | 'TRANSPORT'
  | 'UTILITY';

export const COLOR_GROUP_HEX: Record<ColorGroup, string> = {
  BROWN: '#A0673F',
  LIGHT_BLUE: '#4FB6E8',
  PINK: '#EE5FA0',
  ORANGE: '#F7923A',
  RED: '#E5484D',
  YELLOW: '#F2C230',
  GREEN: '#34B36E',
  DARK_BLUE: '#3D5AD6',
  TRANSPORT: '#718096',
  UTILITY: '#D69E2E',
};

export const COLOR_GROUP_VIETNAMESE: Record<ColorGroup, string> = {
  BROWN: 'Nâu Cà Mau',
  LIGHT_BLUE: 'Xanh Lam Nam Bộ',
  PINK: 'Hồng Tây Nguyên',
  ORANGE: 'Cam Duyên Hải',
  RED: 'Đỏ Cố Đô',
  YELLOW: 'Vàng Miền Trung',
  GREEN: 'Xanh Lá Đồng Bằng',
  DARK_BLUE: 'Xanh Đậm Thủ Đô',
  TRANSPORT: 'Giao Thông Xuyên Việt',
  UTILITY: 'Tiện Ích Quốc Gia',
};

export interface BuildingCostDef {
  houseCost: number;
  landmarkCost: number;
}

export const BUILDING_COSTS: Record<ColorGroup, BuildingCostDef> = {
  BROWN: { houseCost: 50000, landmarkCost: 100000 },
  LIGHT_BLUE: { houseCost: 50000, landmarkCost: 100000 },
  PINK: { houseCost: 100000, landmarkCost: 200000 },
  ORANGE: { houseCost: 100000, landmarkCost: 200000 },
  RED: { houseCost: 150000, landmarkCost: 300000 },
  YELLOW: { houseCost: 150000, landmarkCost: 300000 },
  GREEN: { houseCost: 200000, landmarkCost: 400000 },
  DARK_BLUE: { houseCost: 200000, landmarkCost: 400000 },
  TRANSPORT: { houseCost: 0, landmarkCost: 0 },
  UTILITY: { houseCost: 0, landmarkCost: 0 },
};

export const RENT_RATES = {
  EMPTY: 0.10,          // 10% P
  EMPTY_MONOPOLY: 0.20, // 20% P
  HOUSE_1: 0.50,        // 50% P
  HOUSE_2: 1.30,        // 130% P
  HOUSE_3: 2.50,        // 250% P
  HOUSE_4: 3.50,        // 350% P
  LANDMARK: 5.00,       // 500% P
};

export interface Tile {
  id: number;
  name: string;
  shortName?: string;
  type: TileType;
  colorGroup?: ColorGroup;
  price?: number;
  baseRent?: number;
  housePrice?: number;
  landmarkPrice?: number;
  rentMultiplier?: number[];
  taxAmount?: number;
  landmarkName?: string;
  assetKey?: string;
  ownerId?: string | null;
  houseCount?: number;
  hasLandmark?: boolean;
  isMortgaged?: boolean;
  investmentCost?: number; // Tổng vốn đầu tư: giá đất + chi phí nhà/landmark
}

export type SkillType = 'SHORT' | 'LONG' | 'DOUBLE';

export type BotDifficulty = 'EASY' | 'NORMAL' | 'HARD';

export interface Player {
  id: string;
  name: string;
  character: CharacterId;
  color: string;
  money: number;
  position: number;
  inJail: boolean;
  jailTurns: number;
  properties: number[];
  bankrupt: boolean;
  isBot: boolean;
  botDifficulty?: BotDifficulty;
  jailFreeCards: number;
  lapsCompleted: number; // Số lần đi qua hoặc dừng tại Xuất Phát
  skillCards: SkillType[]; // Tối đa 3 thẻ kỹ năng
}

export type CardActionType =
  | 'CASH_GAIN'
  | 'CASH_LOSS'
  | 'TELEPORT'
  | 'JAIL_FREE'
  | 'PAY_EACH_PLAYER';

export interface ChanceCard {
  id: string;
  title: string;
  description: string;
  type: CardActionType;
  amount?: number;
  targetTileId?: number;
  image?: string;
}

export type GamePhase =
  | 'WAITING'
  | 'AWAIT_ROLL'
  | 'ROLLING'
  | 'MOVING'
  | 'RESOLVE_TILE'
  | 'AWAIT_DECISION'
  | 'AWAIT_TAKEOVER'
  | 'DEBT_RELIEF'
  | 'CARD_DRAWN'
  | 'ACTION_COMPLETED'
  | 'NEXT_TURN'
  | 'TURN_END'
  | 'GAME_OVER';

export type VictoryType =
  | 'BANKRUPTCY'
  | 'TRIPLE_MONOPOLY'
  | 'LINE_MONOPOLY'
  | 'TRANSPORT_MONOPOLY'
  | 'TIMEOUT_NET_WORTH';

export const VICTORY_NAMES: Record<VictoryType, string> = {
  BANKRUPTCY: 'Độc Chiếm Thương Trường (Đối thủ phá sản)',
  TRIPLE_MONOPOLY: 'Độc Quyền 3 Nhóm Màu',
  LINE_MONOPOLY: 'Bá Chủ Một Cạnh Bàn Cờ',
  TRANSPORT_MONOPOLY: 'Thống Trị 4 Tuyến Giao Thông',
  TIMEOUT_NET_WORTH: 'Vua Địa Ốc Sau 25 Vòng Đấu',
};

import { GAME_CONFIG } from './gameConfig';

export interface GameSettings {
  initialMoney: number;
  passGoReward: number;
  exactGoReward: number;
  jailBailPrice: number;
  maxJailTurns: number;
  boardTileCount: number;
  maxRounds: number;
}

export const DEFAULT_SETTINGS: GameSettings = {
  initialMoney: GAME_CONFIG.STARTING_MONEY,
  passGoReward: GAME_CONFIG.PASS_START_SALARY,
  exactGoReward: GAME_CONFIG.EXACT_START_REWARD,
  jailBailPrice: GAME_CONFIG.JAIL_BAIL_PRICE,
  maxJailTurns: GAME_CONFIG.MAX_JAIL_TURNS,
  boardTileCount: 40,
  maxRounds: GAME_CONFIG.MAX_ROUNDS,
};

export interface PendingDebt {
  debtorId: string;
  creditorId: string | null;
  amountOwed: number;
  tile?: Tile;
  reason: 'RENT' | 'TAX' | 'BAIL' | 'CARD';
}

export interface GameState {
  players: Player[];
  activePlayerIndex: number;
  dice: [number, number];
  isDouble: boolean;
  doubleStreak: number;
  gamePhase: GamePhase;
  tiles: Tile[];
  currentCard: ChanceCard | null;
  piggyBank: number; // Quỹ Heo Đất
  winner: Player | null;
  victoryType: VictoryType | null;
  victoryReason: string | null;
  eventLogs: string[];
  turnCount: number;
  roundCount: number;
  pendingDebt?: PendingDebt | null;
  netWorthHistory?: Record<string, number[]>; // Lịch sử tài sản theo từng vòng (vẽ biểu đồ)
}

export interface PlayerRankingItem {
  player: Player;
  rank: number;
  netWorth: number;
  cash: number;
  propertyValue: number;
  propertyCount: number;
  isBankrupt: boolean;
}


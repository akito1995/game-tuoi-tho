/**
 * CỜ TỶ PHÚ v2 (2.5D) - HÀNH TRÌNH XUYÊN VIỆT
 * Game Core Types (Bộ não trò chơi)
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
  UTILITY: 'Hạ Tầng Năng Lượng',
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
  rentMultiplier?: number[];
  taxAmount?: number;
  landmarkName?: string;
  assetKey?: string;
  ownerId?: string | null;
  houseCount?: number;
  hasLandmark?: boolean;
  isMortgaged?: boolean;
}

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
  jailFreeCards: number;
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
  | 'CARD_DRAWN'
  | 'ACTION_COMPLETED'
  | 'NEXT_TURN'
  | 'TURN_END'
  | 'GAME_OVER';

export interface GameSettings {
  initialMoney: number;
  passGoReward: number;
  jailBailPrice: number;
  maxJailTurns: number;
  boardTileCount: number;
}

export const DEFAULT_SETTINGS: GameSettings = {
  initialMoney: 2000000,
  passGoReward: 200000,
  jailBailPrice: 100000,
  maxJailTurns: 3,
  boardTileCount: 40,
};

export interface GameState {
  players: Player[];
  activePlayerIndex: number;
  dice: [number, number];
  isDouble: boolean;
  doubleStreak: number;
  gamePhase: GamePhase;
  tiles: Tile[];
  currentCard: ChanceCard | null;
  winner: Player | null;
  eventLogs: string[];
  turnCount: number;
  roundCount: number;
}

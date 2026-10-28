/**
 * Vietnamese Childhood Games Portal - Cờ Tỷ Phú 3D Game Engine Types
 */

export type TileType =
  | 'START'
  | 'PROPERTY'
  | 'SPECIAL'
  | 'CHANCE'
  | 'FATE'
  | 'JAIL'
  | 'FESTIVAL'
  | 'GO_TO_JAIL'
  | 'TRANSPORT'
  | 'UTILITY';

export type ColorGroupType =
  | 'ME_KONG'
  | 'COASTAL'
  | 'HIGHLANDS'
  | 'HERITAGE'
  | 'WONDERS'
  | 'METROPOLIS'
  | 'TRANSPORT'
  | 'UTILITY';

export type MascotType = 'PIG' | 'FOX' | 'CAT' | 'BUFFALO';

export interface Tile {
  id: number;
  name: string;
  type: TileType;
  colorGroup?: ColorGroupType;
  price?: number;
  baseRent?: number;
  housePrice?: number;
  rentMultiplier?: number[];
  ownerId?: string | null;
  houseCount?: number;
  hasResort?: boolean;
  isMortgaged?: boolean;
  description?: string;
}

export interface Player {
  id: string;
  name: string;
  mascot: MascotType;
  money: number;
  position: number;
  inJail: boolean;
  jailTurns: number;
  properties: number[];
  bankrupt: boolean;
  isBot: boolean;
  jailFreeCards?: number;
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
}

export type FateCard = ChanceCard;

export type GamePhase =
  | 'WAITING'
  | 'ROLLING'
  | 'MOVING'
  | 'ACTION'
  | 'CARD_DRAWN'
  | 'TURN_END'
  | 'GAME_OVER';

export interface GameSettings {
  initialMoney: number;
  passGoReward: number;
  jailBailPrice: number;
  maxJailTurns: number;
}

export interface GameState {
  players: Player[];
  activePlayerIndex: number;
  dice: [number, number];
  isDouble: boolean;
  doubleStreak: number;
  gamePhase: GamePhase;
  jackpotFund: number;
  tiles: Tile[];
  currentCard: ChanceCard | null;
  winner: Player | null;
  eventLogs: string[];
}

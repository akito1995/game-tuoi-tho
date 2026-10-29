import { create } from 'zustand';
import {
  GameState,
  GameSettings,
  Player,
  Tile,
  ChanceCard,
  GamePhase,
  ColorGroupType,
  MascotType,
  BauCuaResult,
  LuckyWheelResult,
  TacticalCardInventory,
} from './types';
import { BOARD_TILES } from './boardData';
import { CHANCE_CARDS, FATE_CARDS } from './chanceCards';

export const DEFAULT_SETTINGS: GameSettings = {
  initialMoney: 2000000,
  passGoReward: 200000,
  jailBailPrice: 100000,
  maxJailTurns: 3,
};

const DEFAULT_MASCOTS: MascotType[] = ['PIG', 'FOX', 'CAT', 'BUFFALO'];
const DEFAULT_NAMES = ['Bé Heo', 'Bé Cáo', 'Bé Mèo', 'Bé Trâu'];

export interface GameStore extends GameState {
  settings: GameSettings;

  // Actions
  initGame: (
    playersInput?: number | Array<string | Partial<Player>>,
    customSettings?: Partial<GameSettings>
  ) => void;
  rollDice: (diceOverride?: [number, number]) => [number, number];
  buyProperty: (tileId?: number) => boolean;
  upgradeProperty: (tileId: number) => boolean;
  buyOrUpgradeProperty: (tileId: number, targetTier: 0 | 1 | 2 | 3) => boolean;
  mortgageProperty: (tileId: number) => boolean;
  unmortgageProperty: (tileId: number) => boolean;
  sellBuilding: (tileId: number) => boolean;
  declareBankruptcy: () => void;
  payJailBail: () => boolean;
  useJailFreeCard: () => boolean;
  drawCard: (deckType: 'CHANCE' | 'FATE', cardId?: string) => ChanceCard;
  applyCardEffect: (card: ChanceCard) => void;
  applyAndDismissCurrentCard: () => void;
  dismissCard: () => void;
  endTurn: () => void;
  resetGame: () => void;
  setGamePhase: (phase: GamePhase) => void;
  playBauCua: (betMascot: number, betAmount: number) => BauCuaResult;
  spinLuckyWheel: () => LuckyWheelResult;
  useEvenOddCard: (modifier: 'EVEN' | 'ODD') => void;
  useRentShield: () => void;
  useDoubleStep: () => void;
  dismissMiniGame: () => void;
}

/**
 * Checks if a player owns all properties within a color group (Monopoly).
 */
export function checkColorMonopoly(
  tiles: Tile[],
  colorGroup?: ColorGroupType,
  ownerId?: string | null
): boolean {
  if (!colorGroup || !ownerId) return false;
  const groupTiles = tiles.filter((t) => t.colorGroup === colorGroup);
  if (groupTiles.length === 0) return false;
  return groupTiles.every((t) => t.ownerId === ownerId);
}

/**
 * Calculates current rent for a tile, accounting for house tiers and full color group monopoly (x2).
 */
export function calculateRent(tile: Tile, tiles: Tile[]): number {
  if (tile.isMortgaged) return 0;

  // For Transport tiles: rent scales with number of transport tiles owned by same player
  if (tile.type === 'TRANSPORT' && tile.ownerId) {
    const ownedTransportCount = tiles.filter(
      (t) => t.type === 'TRANSPORT' && t.ownerId === tile.ownerId
    ).length;
    const tierIdx = Math.max(0, Math.min(ownedTransportCount - 1, (tile.rentMultiplier?.length || 1) - 1));
    return tile.rentMultiplier?.[tierIdx] || tile.baseRent || 25000;
  }

  // For Utility tiles: rent scales with number of utility tiles owned by same player
  if (tile.type === 'UTILITY' && tile.ownerId) {
    const ownedUtilityCount = tiles.filter(
      (t) => t.type === 'UTILITY' && t.ownerId === tile.ownerId
    ).length;
    const tierIdx = Math.max(0, Math.min(ownedUtilityCount - 1, (tile.rentMultiplier?.length || 1) - 1));
    return tile.rentMultiplier?.[tierIdx] || tile.baseRent || 20000;
  }

  const tier = tile.hasResort ? 4 : Math.min(3, tile.houseCount || 0);
  let rent = 0;
  if (tile.rentMultiplier && tile.rentMultiplier.length > tier) {
    rent = tile.rentMultiplier[tier];
  } else {
    rent = tile.baseRent || 0;
  }

  // Monopoly doubles rent across the group
  if (tile.colorGroup && checkColorMonopoly(tiles, tile.colorGroup, tile.ownerId)) {
    rent = rent * 2;
  }

  return rent;
}

/**
 * Handles bankruptcy when a debtor player cannot pay their debt to a creditor (or the bank).
 */
function processBankruptcy(
  players: Player[],
  tiles: Tile[],
  debtorIndex: number,
  creditorId?: string | null
): { players: Player[]; tiles: Tile[]; winner: Player | null; gameOver: boolean } {
  const debtor = players[debtorIndex];
  const cashRemaining = debtor.money;

  const updatedPlayers = players.map((p, idx) => {
    if (idx === debtorIndex) {
      return {
        ...p,
        money: 0,
        bankrupt: true,
        properties: [],
      };
    }
    if (creditorId && p.id === creditorId) {
      const debtorPropertyIds = debtor.properties || [];
      return {
        ...p,
        money: p.money + cashRemaining,
        properties: [...p.properties, ...debtorPropertyIds],
      };
    }
    return p;
  });

  // Reclaim all properties owned by debtor to the bank
  const updatedTiles = tiles.map((t) => {
    if (t.ownerId === debtor.id) {
      return {
        ...t,
        ownerId: null,
        houseCount: 0,
        hasResort: false,
        isMortgaged: false,
      };
    }
    return t;
  });

  const activePlayers = updatedPlayers.filter((p) => !p.bankrupt);
  const gameOver = activePlayers.length <= 1;
  const winner = gameOver ? activePlayers[0] || null : null;

  return {
    players: updatedPlayers,
    tiles: updatedTiles,
    winner,
    gameOver,
  };
}


export interface TurnOutcome {
  d1: number;
  d2: number;
  sum: number;
  isDouble: boolean;
  newDoubleStreak: number;
  stayedInJail: boolean;
  speedingToJail: boolean;
  passedGo: boolean;
  oldPos: number;
  newPos: number;
  updatedPlayers: Player[];
  updatedTiles: Tile[];
  updatedJackpot: number;
  currentCard: ChanceCard | null;
  nextPhase: GamePhase;
  logs: string[];
  winner: Player | null;
  gameOver: boolean;
}

export function calculateTurnOutcome(
  state: GameState & { settings: GameSettings },
  inputD1: number,
  inputD2: number,
  diceOverride?: [number, number]
): TurnOutcome {
  let d1 = inputD1;
  let d2 = inputD2;
  let activePlayer = { ...state.players[state.activePlayerIndex] };

  if (diceOverride === undefined && activePlayer.activeDiceModifier) {
    const mod = activePlayer.activeDiceModifier;
    if (mod === 'EVEN' && (d1 + d2) % 2 !== 0) {
      d2 = (d2 % 6) + 1;
    } else if (mod === 'ODD' && (d1 + d2) % 2 === 0) {
      d2 = (d2 % 6) + 1;
    }
    activePlayer.activeDiceModifier = undefined;
  }

  const sum = d1 + d2;
  let isDouble = d1 === d2;
  let newDoubleStreak = isDouble ? state.doubleStreak + 1 : 0;
  let currentJackpot = state.jackpotFund;
  const logs = [...state.eventLogs];

  logs.push(
    `${activePlayer.name} đổ xúc xắc: [${d1}, ${d2}] (Tổng: ${sum})${
      isDouble ? ' - ĐỔI ĐÔI!' : ''
    }`
  );

  let stayedInJail = false;
  let speedingToJail = false;
  let passedGo = false;
  let oldPos = activePlayer.position;
  let newPos = oldPos;
  let tiles = [...state.tiles];
  let currentCard: ChanceCard | null = null;
  let nextPhase: GamePhase = 'TURN_END';
  let winner: Player | null = state.winner;
  let gameOver = false;

  // 1. Jail handling
  if (activePlayer.inJail) {
    if (isDouble) {
      logs.push(`${activePlayer.name} đổ đôi thành công và được thả tự do!`);
      activePlayer.inJail = false;
      activePlayer.jailTurns = 0;
      newDoubleStreak = 0;
    } else {
      const remainingTurns = activePlayer.jailTurns - 1;
      if (remainingTurns <= 0) {
        if (activePlayer.money >= state.settings.jailBailPrice) {
          activePlayer.money -= state.settings.jailBailPrice;
          currentJackpot += state.settings.jailBailPrice;
          activePlayer.inJail = false;
          activePlayer.jailTurns = 0;
          logs.push(
            `${activePlayer.name} hết thời hạn tạm giam, nộp phạt ${state.settings.jailBailPrice.toLocaleString(
              'vi-VN'
            )}đ vào Quỹ Heo Đất để ra tù.`
          );
        } else {
          logs.push(`${activePlayer.name} không đủ tiền nộp phạt tại trại giam và bị phá sản!`);
          const bk = processBankruptcy(state.players, state.tiles, state.activePlayerIndex, null);
          return {
            d1, d2, sum, isDouble: false, newDoubleStreak: 0,
            stayedInJail: true, speedingToJail: false, passedGo: false,
            oldPos, newPos, updatedPlayers: bk.players, updatedTiles: bk.tiles,
            updatedJackpot: currentJackpot, currentCard: null,
            nextPhase: bk.gameOver ? 'GAME_OVER' : 'TURN_END',
            logs, winner: bk.winner, gameOver: bk.gameOver,
          };
        }
      } else {
        activePlayer.jailTurns = remainingTurns;
        logs.push(
          `${activePlayer.name} không đổ được đôi, tiếp tục ở lại trại giam (còn ${remainingTurns} lượt).`
        );
        const updatedPlayers = [...state.players];
        updatedPlayers[state.activePlayerIndex] = activePlayer;
        return {
          d1, d2, sum, isDouble: false, newDoubleStreak: 0,
          stayedInJail: true, speedingToJail: false, passedGo: false,
          oldPos, newPos, updatedPlayers, updatedTiles: tiles,
          updatedJackpot: currentJackpot, currentCard: null,
          nextPhase: 'TURN_END', logs, winner, gameOver,
        };
      }
    }
  }

  // 2. Double bonus & speed check
  if (isDouble && !activePlayer.inJail) {
    logs.push(`${activePlayer.name} đổ xúc xắc đôi [${d1}, ${d2}]! Được đổ thêm lượt nữa!`);
    if (newDoubleStreak >= 3) {
      logs.push(`${activePlayer.name} đổ đôi 3 lần liên tiếp! Bị phạt đi bão và tống thẳng vào Trại Giam!`);
      activePlayer.position = 8;
      activePlayer.inJail = true;
      activePlayer.jailTurns = state.settings.maxJailTurns;
      const updatedPlayers = [...state.players];
      updatedPlayers[state.activePlayerIndex] = activePlayer;
      return {
        d1, d2, sum, isDouble: false, newDoubleStreak: 0,
        stayedInJail: false, speedingToJail: true, passedGo: false,
        oldPos, newPos: 8, updatedPlayers, updatedTiles: tiles,
        updatedJackpot: currentJackpot, currentCard: null,
        nextPhase: 'TURN_END', logs, winner, gameOver,
      };
    }
  }

  // 3. Movement & Passing Go
  const rawPos = oldPos + sum;
  newPos = rawPos % 32;

  if (rawPos >= 32) {
    passedGo = true;
    activePlayer.money += state.settings.passGoReward;
    logs.push(
      `${activePlayer.name} vượt qua hoặc dừng tại Xuất Phát (Cổng Làng), nhận ${state.settings.passGoReward.toLocaleString(
        'vi-VN'
      )}đ.`
    );
  }

  activePlayer.position = newPos;

  // 4. Tile Landing
  const landedTile = tiles[newPos];
  logs.push(`${activePlayer.name} dừng chân tại ô [${newPos}] ${landedTile.name}.`);

  if (landedTile.type === 'GO_TO_JAIL') {
    logs.push(`${activePlayer.name} bị bắt đi bão! Áp giải thẳng về Trại Giam! Huỷ lượt đổ tiếp.`);
    activePlayer.position = 8;
    activePlayer.inJail = true;
    activePlayer.jailTurns = state.settings.maxJailTurns;
    isDouble = false;
    newDoubleStreak = 0;
    nextPhase = 'TURN_END';
  } else if (landedTile.type === 'FESTIVAL') {
    logs.push(
      `🏮 ${activePlayer.name} tham gia Lễ Hội Dân Gian tại Sới Bầu Cua Đảo Ngọc và nhận thưởng Quỹ Heo Đất ${currentJackpot.toLocaleString('vi-VN')}đ!`
    );
    activePlayer.money += currentJackpot;
    currentJackpot = 20000;
    nextPhase = 'FESTIVAL_GAME';
  } else if (landedTile.type === 'CHANCE' || landedTile.type === 'FATE') {
    const deck = landedTile.type === 'CHANCE' ? CHANCE_CARDS : FATE_CARDS;
    const drawn = deck[Math.floor(Math.random() * deck.length)];
    currentCard = drawn;
    nextPhase = 'CARD_DRAWN';
    logs.push(
      `${activePlayer.name} rút thẻ ${
        landedTile.type === 'CHANCE' ? 'Cơ Hội' : 'Khí Vận'
      }: "${drawn.title}".`
    );

    if (drawn.type === 'CASH_GAIN' && drawn.amount) {
      activePlayer.money += drawn.amount;
    } else if (drawn.type === 'CASH_LOSS' && drawn.amount) {
      if (activePlayer.money < drawn.amount) {
        logs.push(`${activePlayer.name} không đủ tiền nộp phạt và bị phá sản!`);
        currentJackpot += activePlayer.money;
        const bk = processBankruptcy(state.players, tiles, state.activePlayerIndex, null);
        return {
          d1, d2, sum, isDouble: false, newDoubleStreak: 0,
          stayedInJail: false, speedingToJail: false, passedGo,
          oldPos, newPos, updatedPlayers: bk.players, updatedTiles: bk.tiles,
          updatedJackpot: currentJackpot, currentCard,
          nextPhase: bk.gameOver ? 'GAME_OVER' : 'TURN_END',
          logs, winner: bk.winner, gameOver: bk.gameOver,
        };
      } else {
        activePlayer.money -= drawn.amount;
        currentJackpot = Math.min(300000, currentJackpot + drawn.amount);
      }
    } else if (drawn.type === 'TELEPORT' && drawn.targetTileId !== undefined) {
      const oldP = activePlayer.position;
      const target = drawn.targetTileId;
      if (oldP > target && target !== 8) {
        activePlayer.money += state.settings.passGoReward;
        logs.push(
          `${activePlayer.name} vượt qua Cổng Làng nhận ${state.settings.passGoReward.toLocaleString(
            'vi-VN'
          )}đ.`
        );
      }
      activePlayer.position = target;
      if (target === 16) {
        activePlayer.money += currentJackpot;
        currentJackpot = 20000;
      } else if (target === 8) {
        activePlayer.inJail = true;
        activePlayer.jailTurns = state.settings.maxJailTurns;
      } else {
        const destTile = tiles[target];
        if (destTile) {
          logs.push(`${activePlayer.name} bay thẳng tới ô [${target}] ${destTile.name}.`);
          if (destTile.ownerId && destTile.ownerId !== activePlayer.id) {
            const rent = calculateRent(destTile, tiles);
            if (activePlayer.hasActiveShield) {
              activePlayer.hasActiveShield = false;
              logs.push(`🛡️ ${activePlayer.name} kích hoạt Khiên Bảo Hộ! Miễn phí tiền thuê ${rent.toLocaleString('vi-VN')}đ.`);
            } else {
              logs.push(`${activePlayer.name} phải trả tiền thuê ${rent.toLocaleString('vi-VN')}đ cho chủ sở hữu.`);
              if (activePlayer.money >= rent) {
                activePlayer.money -= rent;
                const ownerIdx = state.players.findIndex((p) => p.id === destTile.ownerId);
                if (ownerIdx !== -1) {
                  state.players[ownerIdx].money += rent;
                }
              } else {
                logs.push(`${activePlayer.name} không đủ tiền trả thuê và bị phá sản!`);
                const bk = processBankruptcy(state.players, tiles, state.activePlayerIndex, destTile.ownerId);
                return {
                  d1, d2, sum, isDouble: false, newDoubleStreak: 0,
                  stayedInJail: false, speedingToJail: false, passedGo,
                  oldPos, newPos: target, updatedPlayers: bk.players, updatedTiles: bk.tiles,
                  updatedJackpot: currentJackpot, currentCard,
                  nextPhase: bk.gameOver ? 'GAME_OVER' : 'TURN_END',
                  logs, winner: bk.winner, gameOver: bk.gameOver,
                };
              }
            }
          }
        }
      }
    } else if (drawn.type === 'JAIL_FREE') {
      activePlayer.jailFreeCards = (activePlayer.jailFreeCards || 0) + 1;
    } else if (drawn.type === 'PAY_EACH_PLAYER' && drawn.amount) {
      const others = state.players.filter(
        (p, idx) => idx !== state.activePlayerIndex && !p.bankrupt
      );
      const totalDebt = drawn.amount * others.length;
      if (activePlayer.money < totalDebt) {
        logs.push(`${activePlayer.name} không đủ tiền trả cho người chơi khác và bị phá sản!`);
        const bk = processBankruptcy(state.players, tiles, state.activePlayerIndex, null);
        return {
          d1, d2, sum, isDouble: false, newDoubleStreak: 0,
          stayedInJail: false, speedingToJail: false, passedGo,
          oldPos, newPos, updatedPlayers: bk.players, updatedTiles: bk.tiles,
          updatedJackpot: currentJackpot, currentCard,
          nextPhase: bk.gameOver ? 'GAME_OVER' : 'TURN_END',
          logs, winner: bk.winner, gameOver: bk.gameOver,
        };
      } else {
        activePlayer.money -= totalDebt;
        const updatedPlayers = state.players.map((p, idx) => {
          if (idx === state.activePlayerIndex) return activePlayer;
          if (!p.bankrupt) return { ...p, money: p.money + drawn.amount! };
          return p;
        });
        return {
          d1, d2, sum, isDouble, newDoubleStreak,
          stayedInJail: false, speedingToJail: false, passedGo,
          oldPos, newPos, updatedPlayers, updatedTiles: tiles,
          updatedJackpot: currentJackpot, currentCard,
          nextPhase, logs, winner, gameOver,
        };
      }
    }
  } else if (
    landedTile.type === 'PROPERTY' ||
    landedTile.type === 'TRANSPORT' ||
    landedTile.type === 'UTILITY'
  ) {
    if (!landedTile.ownerId) {
      nextPhase = 'ACTION_REQUIRED';
      logs.push(
        `Ô ${landedTile.name} chưa có chủ sở hữu. Giá bán: ${(
          landedTile.price || 0
        ).toLocaleString('vi-VN')}đ.`
      );
    } else if (landedTile.ownerId === activePlayer.id) {
      nextPhase = 'ACTION';
    } else {
      const rent = calculateRent(landedTile, tiles);
      if (activePlayer.hasActiveShield) {
        activePlayer.hasActiveShield = false;
        logs.push(
          `🛡️ ${activePlayer.name} kích hoạt Khiên Bảo Hộ! Miễn phí hoàn toàn tiền thuê ${rent.toLocaleString(
            'vi-VN'
          )}đ.`
        );
        nextPhase = isDouble && newDoubleStreak < 3 ? 'WAITING' : 'TURN_END';
        const updatedPlayers = state.players.map((p, idx) =>
          idx === state.activePlayerIndex ? activePlayer : p
        );
        return {
          d1, d2, sum, isDouble, newDoubleStreak,
          stayedInJail: false, speedingToJail: false, passedGo,
          oldPos, newPos, updatedPlayers, updatedTiles: tiles,
          updatedJackpot: currentJackpot, currentCard,
          nextPhase, logs, winner, gameOver,
        };
      }

      logs.push(
        `${activePlayer.name} phải trả tiền thuê ${rent.toLocaleString(
          'vi-VN'
        )}đ cho chủ nhà.`
      );

      if (activePlayer.money >= rent) {
        activePlayer.money -= rent;
        const ownerIndex = state.players.findIndex(
          (p) => p.id === landedTile.ownerId
        );
        const updatedPlayers = state.players.map((p, idx) => {
          if (idx === state.activePlayerIndex) return activePlayer;
          if (idx === ownerIndex) return { ...p, money: p.money + rent };
          return p;
        });

        nextPhase = isDouble && newDoubleStreak < 3 ? 'WAITING' : 'TURN_END';
        return {
          d1, d2, sum, isDouble, newDoubleStreak,
          stayedInJail: false, speedingToJail: false, passedGo,
          oldPos, newPos, updatedPlayers, updatedTiles: tiles,
          updatedJackpot: currentJackpot, currentCard,
          nextPhase, logs, winner, gameOver,
        };
      } else {
        logs.push(`${activePlayer.name} không đủ tiền trả thuê và bị phá sản!`);
        const bk = processBankruptcy(
          state.players.map((p, idx) =>
            idx === state.activePlayerIndex ? activePlayer : p
          ),
          tiles,
          state.activePlayerIndex,
          landedTile.ownerId
        );
        return {
          d1, d2, sum, isDouble: false, newDoubleStreak: 0,
          stayedInJail: false, speedingToJail: false, passedGo,
          oldPos, newPos, updatedPlayers: bk.players, updatedTiles: bk.tiles,
          updatedJackpot: currentJackpot, currentCard,
          nextPhase: bk.gameOver ? 'GAME_OVER' : 'TURN_END',
          logs, winner: bk.winner, gameOver: bk.gameOver,
        };
      }
    }
  }

  const updatedPlayers = [...state.players];
  updatedPlayers[state.activePlayerIndex] = activePlayer;

  return {
    d1, d2, sum, isDouble, newDoubleStreak,
    stayedInJail, speedingToJail, passedGo,
    oldPos, newPos, updatedPlayers, updatedTiles: tiles,
    updatedJackpot: currentJackpot, currentCard,
    nextPhase, logs, winner, gameOver,
  };
}

export const useGameStore = create<GameStore>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  players: [],
  activePlayerIndex: 0,
  dice: [1, 1],
  isDouble: false,
  doubleStreak: 0,
  consecutiveDoubles: 0,
  gamePhase: 'WAITING',
  jackpotFund: 50000,
  tiles: JSON.parse(JSON.stringify(BOARD_TILES)),
  currentCard: null,
  winner: null,
  eventLogs: [],
  currentRound: 1,

  initGame: (playersInput = 4, customSettings = {}) => {
    const settings: GameSettings = { ...DEFAULT_SETTINGS, ...customSettings };

    let count = 4;
    let playerConfigs: Array<string | Partial<Player>> = [];

    if (typeof playersInput === 'number') {
      count = Math.max(2, Math.min(4, playersInput));
    } else if (Array.isArray(playersInput)) {
      count = Math.max(2, Math.min(4, playersInput.length));
      playerConfigs = playersInput;
    }

    const players: Player[] = [];
    for (let i = 0; i < count; i++) {
      const config = playerConfigs[i];
      const name =
        typeof config === 'string'
          ? config
          : config?.name || DEFAULT_NAMES[i] || `Người chơi ${i + 1}`;
      const mascot =
        typeof config === 'object' && config.mascot
          ? config.mascot
          : DEFAULT_MASCOTS[i % DEFAULT_MASCOTS.length];
      const isBot =
        typeof config === 'object' && config.isBot !== undefined
          ? config.isBot
          : i > 0;

      players.push({
        id: `player_${i + 1}`,
        name,
        mascot,
        money: settings.initialMoney,
        position: 0,
        inJail: false,
        jailTurns: 0,
        properties: [],
        bankrupt: false,
        isBot,
        jailFreeCards: 0,
        hasActiveShield: false,
        activeDiceModifier: null,
        tacticalCards: {
          evenOdd: 2,
          rentShield: 1,
          doubleStep: 1,
        },
      });
    }

    // Always deep clone BOARD_TILES so state is completely isolated
    const tiles: Tile[] = JSON.parse(JSON.stringify(BOARD_TILES));

    set({
      settings,
      players,
      activePlayerIndex: 0,
      dice: [1, 1],
      isDouble: false,
      doubleStreak: 0,
      consecutiveDoubles: 0,
      gamePhase: 'WAITING',
      jackpotFund: 50000,
      tiles,
      currentCard: null,
      winner: null,
      eventLogs: ['Trò chơi Cờ Tỷ Phú bắt đầu! Chúc các bạn may mắn.'],
      currentRound: 1,
    });
  },

  rollDice: (diceOverride) => {
    const state = get();
    if (state.gamePhase === 'GAME_OVER') return [1, 1];

    let d1 = diceOverride !== undefined ? diceOverride[0] : Math.floor(Math.random() * 6) + 1;
    let d2 = diceOverride !== undefined ? diceOverride[1] : Math.floor(Math.random() * 6) + 1;

    const outcome = calculateTurnOutcome(state as any, d1, d2, diceOverride);
    const activePlayer = state.players[state.activePlayerIndex];
    const rollSessionId = `roll_${activePlayer.id}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    const isTestMode = typeof window === 'undefined' || process.env.NODE_ENV === 'test';

    if (isTestMode) {
      set({
        players: outcome.updatedPlayers,
        tiles: outcome.updatedTiles,
        dice: [outcome.d1, outcome.d2],
        isDouble: outcome.isDouble,
        doubleStreak: outcome.newDoubleStreak,
        consecutiveDoubles: outcome.newDoubleStreak,
        jackpotFund: outcome.updatedJackpot,
        currentCard: outcome.currentCard,
        gamePhase: outcome.nextPhase,
        winner: outcome.winner,
        eventLogs: outcome.logs,
        rollSessionId,
        activeRollerId: activePlayer.id,
        targetTileIndex: outcome.newPos,
      });
      return [outcome.d1, outcome.d2];
    }

    // In browser: Run cinematic state machine
    set({
      dice: [outcome.d1, outcome.d2],
      isDouble: outcome.isDouble,
      doubleStreak: outcome.newDoubleStreak,
      consecutiveDoubles: outcome.newDoubleStreak,
      rollSessionId,
      activeRollerId: activePlayer.id,
      targetTileIndex: outcome.newPos,
      gamePhase: 'DICE_ROLLING',
    });

    (async () => {
      const speed = get().isFastForward ? 0.5 : 1.0;
      const wait = (ms: number) => new Promise((res) => setTimeout(res, ms * speed));

      // Phase 1: DICE_ROLLING (dice tumble)
      await wait(1200);

      // Phase 2: DICE_RESULT (number declared, destination highlighted)
      set({ gamePhase: 'DICE_RESULT' });
      await wait(600);

      if (outcome.stayedInJail || outcome.speedingToJail) {
        set({
          players: outcome.updatedPlayers,
          tiles: outcome.updatedTiles,
          jackpotFund: outcome.updatedJackpot,
          gamePhase: outcome.nextPhase,
          eventLogs: outcome.logs,
        });
        return;
      }

      // Phase 3: TOKEN_MOVING (pawn hops tile by tile)
      const movingPlayers = [...get().players];
      movingPlayers[state.activePlayerIndex] = {
        ...movingPlayers[state.activePlayerIndex],
        position: outcome.newPos,
      };
      set({
        gamePhase: 'TOKEN_MOVING',
        players: movingPlayers,
      });

      const hopDuration = Math.max(650, outcome.sum * 280);
      await wait(hopDuration);

      // Phase 4: PASS_GO_BONUS (if passed Go)
      if (outcome.passedGo) {
        set({ gamePhase: 'PASS_GO_BONUS' });
        await wait(600);
      }

      // Phase 5: LANDING_REVEAL (camera focus on landed tile)
      set({ gamePhase: 'LANDING_REVEAL' });
      await wait(700);

      // Phase 6: RESOLVE_TILE (apply rent, chance card, festival fund, or bankruptcy)
      set({
        gamePhase: 'RESOLVE_TILE',
        jackpotFund: outcome.updatedJackpot,
        currentCard: outcome.currentCard,
        eventLogs: outcome.logs,
      });
      await wait(600);

      // Phase 7: Final Phase (AWAIT_DECISION / TURN_END / etc.)
      const finalPhase =
        outcome.nextPhase === 'ACTION_REQUIRED' || outcome.nextPhase === 'ACTION'
          ? 'AWAIT_DECISION'
          : outcome.nextPhase;

      set({
        players: outcome.updatedPlayers,
        tiles: outcome.updatedTiles,
        winner: outcome.winner,
        gamePhase: finalPhase,
      });
    })();

    return [outcome.d1, outcome.d2];
  },

  buyProperty: (tileId) => {
    const state = get();
    const activePlayer = state.players[state.activePlayerIndex];
    if (!activePlayer || activePlayer.bankrupt) return false;

    const targetId = tileId !== undefined ? tileId : activePlayer.position;
    const tile = state.tiles[targetId];

    if (!tile) return false;
    if (
      tile.type !== 'PROPERTY' &&
      tile.type !== 'TRANSPORT' &&
      tile.type !== 'UTILITY'
    ) {
      return false;
    }
    if (tile.ownerId != null) return false;
    if (!tile.price || activePlayer.money < tile.price) return false;

    const newMoney = activePlayer.money - tile.price;
    const updatedPlayer: Player = {
      ...activePlayer,
      money: newMoney,
      properties: [...activePlayer.properties, targetId],
    };

    const updatedTiles = state.tiles.map((t) =>
      t.id === targetId ? { ...t, ownerId: activePlayer.id } : t
    );

    const updatedPlayers = [...state.players];
    updatedPlayers[state.activePlayerIndex] = updatedPlayer;

    set({
      players: updatedPlayers,
      tiles: updatedTiles,
      gamePhase: 'TURN_END',
      eventLogs: [
        ...state.eventLogs,
        `${activePlayer.name} đã mua thành công bất động sản ${
          tile.name
        } với giá ${tile.price.toLocaleString('vi-VN')}đ.`,
      ],
    });

    return true;
  },

  buyOrUpgradeProperty: (tileId, targetTier) => {
    const state = get();
    const activePlayer = state.players[state.activePlayerIndex];
    if (!activePlayer || activePlayer.bankrupt) return false;

    const tile = state.tiles[tileId];
    if (
      !tile ||
      (tile.type !== 'PROPERTY' && tile.type !== 'TRANSPORT' && tile.type !== 'UTILITY')
    ) {
      return false;
    }

    const isOwnedByMe = tile.ownerId === activePlayer.id;
    const isUnowned = !tile.ownerId;

    if (!isOwnedByMe && !isUnowned) return false;

    // BUG-01: Transport and Utility tiles purchase (Tier 0 only, cannot build houses)
    if (tile.type === 'TRANSPORT' || tile.type === 'UTILITY') {
      if (!isUnowned) return false;
      const cost = tile.price || 0;
      if (activePlayer.money < cost) return false;

      const newMoney = activePlayer.money - cost;
      const updatedPlayer: Player = {
        ...activePlayer,
        money: newMoney,
        properties: [...activePlayer.properties, tileId],
      };

      const updatedTiles = state.tiles.map((t) =>
        t.id === tileId
          ? {
              ...t,
              ownerId: activePlayer.id,
              houseCount: 0,
              hasResort: false,
              isMortgaged: false,
            }
          : t
      );

      const updatedPlayers = [...state.players];
      updatedPlayers[state.activePlayerIndex] = updatedPlayer;

      set({
        players: updatedPlayers,
        tiles: updatedTiles,
        gamePhase: 'TURN_END',
        eventLogs: [
          ...state.eventLogs,
          `${activePlayer.name} đã mua thành công ${tile.name} với giá ${cost.toLocaleString('vi-VN')}đ.`,
        ],
      });
      return true;
    }

    // Check round 1 restriction for Landmark
    if (targetTier === 3 && (state.currentRound || 1) <= 1) {
      return false;
    }

    const currentTier = isUnowned
      ? -1
      : tile.hasResort
      ? 3
      : Math.min(3, tile.houseCount || 0);

    if (targetTier <= currentTier) return false;

    const tilePrice = tile.price || 0;
    const housePrice = tile.housePrice || Math.round(tilePrice * 0.75);

    let cost = 0;
    if (isUnowned) {
      cost = tilePrice + targetTier * housePrice;
    } else {
      cost = (targetTier - currentTier) * housePrice;
    }

    if (activePlayer.money < cost) return false;

    const newMoney = activePlayer.money - cost;
    const newCount = targetTier === 3 ? 3 : targetTier;
    const hasResort = targetTier === 3;

    const updatedPlayer: Player = {
      ...activePlayer,
      money: newMoney,
      properties: isUnowned
        ? [...activePlayer.properties, tileId]
        : activePlayer.properties,
    };

    const updatedTiles = state.tiles.map((t) =>
      t.id === tileId
        ? {
            ...t,
            ownerId: activePlayer.id,
            houseCount: newCount,
            hasResort,
            isMortgaged: false,
          }
        : t
    );

    const updatedPlayers = [...state.players];
    updatedPlayers[state.activePlayerIndex] = updatedPlayer;

    const tierNames = ['Đất nền', 'Nhà phố', 'Chung cư', 'Biểu tượng Landmark'];
    const chosenName = tierNames[targetTier] || `Cấp ${targetTier}`;

    set({
      players: updatedPlayers,
      tiles: updatedTiles,
      gamePhase: 'TURN_END',
      eventLogs: [
        ...state.eventLogs,
        `${activePlayer.name} đã đầu tư thành công ${tile.name} lên [${chosenName}] (-${cost.toLocaleString('vi-VN')}đ).`,
      ],
    });

    return true;
  },

  mortgageProperty: (tileId) => {
    const state = get();
    const activePlayer = state.players[state.activePlayerIndex];
    if (!activePlayer || activePlayer.bankrupt) return false;

    const tile = state.tiles[tileId];
    if (!tile || tile.ownerId !== activePlayer.id || tile.isMortgaged) return false;
    if ((tile.houseCount || 0) > 0 || tile.hasResort) return false;

    const mortgageValue = Math.round((tile.price || 0) * 0.5);
    const updatedPlayer = {
      ...activePlayer,
      money: activePlayer.money + mortgageValue,
    };

    const updatedTiles = state.tiles.map((t) =>
      t.id === tileId ? { ...t, isMortgaged: true } : t
    );

    const updatedPlayers = [...state.players];
    updatedPlayers[state.activePlayerIndex] = updatedPlayer;

    set({
      players: updatedPlayers,
      tiles: updatedTiles,
      eventLogs: [
        ...state.eventLogs,
        `${activePlayer.name} đã thế chấp ${tile.name} nhận +${mortgageValue.toLocaleString('vi-VN')}đ.`,
      ],
    });
    return true;
  },

  unmortgageProperty: (tileId) => {
    const state = get();
    const activePlayer = state.players[state.activePlayerIndex];
    if (!activePlayer || activePlayer.bankrupt) return false;

    const tile = state.tiles[tileId];
    if (!tile || tile.ownerId !== activePlayer.id || !tile.isMortgaged) return false;

    const unmortgageCost = Math.round((tile.price || 0) * 0.55);
    if (activePlayer.money < unmortgageCost) return false;

    const updatedPlayer = {
      ...activePlayer,
      money: activePlayer.money - unmortgageCost,
    };

    const updatedTiles = state.tiles.map((t) =>
      t.id === tileId ? { ...t, isMortgaged: false } : t
    );

    const updatedPlayers = [...state.players];
    updatedPlayers[state.activePlayerIndex] = updatedPlayer;

    set({
      players: updatedPlayers,
      tiles: updatedTiles,
      eventLogs: [
        ...state.eventLogs,
        `${activePlayer.name} đã chuộc lại ${tile.name} (-${unmortgageCost.toLocaleString('vi-VN')}đ).`,
      ],
    });
    return true;
  },

  sellBuilding: (tileId) => {
    const state = get();
    const activePlayer = state.players[state.activePlayerIndex];
    if (!activePlayer || activePlayer.bankrupt) return false;

    const tile = state.tiles[tileId];
    if (!tile || tile.ownerId !== activePlayer.id) return false;
    if (!tile.hasResort && (tile.houseCount || 0) <= 0) return false;

    const housePrice = tile.housePrice || Math.round((tile.price || 0) * 0.75);
    const refund = Math.round(housePrice * 0.5);

    let newCount = tile.houseCount || 0;
    let hasResort = false;

    if (tile.hasResort) {
      hasResort = false;
      newCount = 2;
    } else if (newCount > 0) {
      newCount -= 1;
    }

    const updatedPlayer = {
      ...activePlayer,
      money: activePlayer.money + refund,
    };

    const updatedTiles = state.tiles.map((t) =>
      t.id === tileId ? { ...t, houseCount: newCount, hasResort } : t
    );

    const updatedPlayers = [...state.players];
    updatedPlayers[state.activePlayerIndex] = updatedPlayer;

    set({
      players: updatedPlayers,
      tiles: updatedTiles,
      eventLogs: [
        ...state.eventLogs,
        `${activePlayer.name} đã bán bớt công trình tại ${tile.name} thu hồi +${refund.toLocaleString('vi-VN')}đ.`,
      ],
    });
    return true;
  },

  declareBankruptcy: () => {
    const state = get();
    const debtorIndex = state.activePlayerIndex;
    const bk = processBankruptcy(state.players, state.tiles, debtorIndex, null);
    set({
      players: bk.players,
      tiles: bk.tiles,
      winner: bk.winner,
      gamePhase: bk.gameOver ? 'GAME_OVER' : 'TURN_END',
      eventLogs: [
        ...state.eventLogs,
        `${state.players[debtorIndex].name} đã tuyên bố phá sản và chuyển sang chế độ xem!`,
      ],
    });
  },

  upgradeProperty: (tileId) => {
    const state = get();
    const activePlayer = state.players[state.activePlayerIndex];
    if (!activePlayer || activePlayer.bankrupt) return false;

    const tile = state.tiles[tileId];
    if (!tile || tile.type !== 'PROPERTY') return false;
    if (tile.ownerId !== activePlayer.id) return false;

    const currentCount = tile.houseCount || 0;
    if (currentCount >= 4) return false;

    const housePrice = tile.housePrice || 0;
    if (housePrice <= 0 || activePlayer.money < housePrice) return false;

    const newCount = currentCount + 1;
    const hasResort = newCount === 4;

    const updatedPlayer: Player = {
      ...activePlayer,
      money: activePlayer.money - housePrice,
    };

    const updatedTiles = state.tiles.map((t) =>
      t.id === tileId ? { ...t, houseCount: newCount, hasResort } : t
    );

    const updatedPlayers = [...state.players];
    updatedPlayers[state.activePlayerIndex] = updatedPlayer;

    const upgradeLabel =
      newCount === 4
        ? 'Khu Nghỉ Dưỡng (Resort)'
        : newCount === 3
        ? 'Biệt Thự (Villa)'
        : `Nhà cấp ${newCount}`;

    set({
      players: updatedPlayers,
      tiles: updatedTiles,
      eventLogs: [
        ...state.eventLogs,
        `${activePlayer.name} nâng cấp ${tile.name} lên ${upgradeLabel} (-${housePrice.toLocaleString(
          'vi-VN'
        )}đ).`,
      ],
    });

    return true;
  },

  payJailBail: () => {
    const state = get();
    if (state.gamePhase !== 'WAITING') return false;
    const activePlayer = state.players[state.activePlayerIndex];
    if (!activePlayer || !activePlayer.inJail) return false;

    const bail = state.settings.jailBailPrice;
    if (activePlayer.money < bail) return false;

    const updatedPlayer: Player = {
      ...activePlayer,
      money: activePlayer.money - bail,
      inJail: false,
      jailTurns: 0,
    };

    const updatedPlayers = [...state.players];
    updatedPlayers[state.activePlayerIndex] = updatedPlayer;

    set({
      players: updatedPlayers,
      jackpotFund: state.jackpotFund + bail,
      gamePhase: 'WAITING',
      eventLogs: [
        ...state.eventLogs,
        `${activePlayer.name} đã nộp tiền bảo lãnh ${bail.toLocaleString(
          'vi-VN'
        )}đ vào Quỹ Heo Đất và được tự do!`,
      ],
    });

    return true;
  },

  useJailFreeCard: () => {
    const state = get();
    if (state.gamePhase !== 'WAITING') return false;
    const activePlayer = state.players[state.activePlayerIndex];
    if (!activePlayer || !activePlayer.inJail) return false;
    if (!activePlayer.jailFreeCards || activePlayer.jailFreeCards <= 0) return false;

    const updatedPlayer: Player = {
      ...activePlayer,
      jailFreeCards: activePlayer.jailFreeCards - 1,
      inJail: false,
      jailTurns: 0,
    };

    const updatedPlayers = [...state.players];
    updatedPlayers[state.activePlayerIndex] = updatedPlayer;

    set({
      players: updatedPlayers,
      gamePhase: 'WAITING',
      eventLogs: [
        ...state.eventLogs,
        `${activePlayer.name} sử dụng Kim Bài Thoát Tù và được tự do ngay lập tức!`,
      ],
    });

    return true;
  },

  drawCard: (deckType, cardId) => {
    const deck = deckType === 'CHANCE' ? CHANCE_CARDS : FATE_CARDS;
    let card = deck[Math.floor(Math.random() * deck.length)];
    if (cardId) {
      const found = deck.find((c) => c.id === cardId);
      if (found) card = found;
    }

    set({ currentCard: card, gamePhase: 'CARD_DRAWN' });
    get().applyCardEffect(card);
    return card;
  },

  applyCardEffect: (card) => {
    const state = get();
    const activePlayerIndex = state.activePlayerIndex;
    let activePlayer = { ...state.players[activePlayerIndex] };
    const logs = [...state.eventLogs];
    const tiles = [...state.tiles];
    let currentJackpot = state.jackpotFund;

    logs.push(`Áp dụng hiệu ứng thẻ: ${card.title} - ${card.description}`);

    switch (card.type) {
      case 'CASH_GAIN':
        if (card.amount) {
          activePlayer.money += card.amount;
        }
        break;

      case 'CASH_LOSS':
        if (card.amount) {
          if (activePlayer.money < card.amount) {
            logs.push(`${activePlayer.name} không đủ tiền nộp phạt và bị phá sản!`);
            currentJackpot += activePlayer.money;
            const bk = processBankruptcy(state.players, tiles, activePlayerIndex, null);
            set({
              players: bk.players,
              tiles: bk.tiles,
              jackpotFund: currentJackpot,
              winner: bk.winner,
              gamePhase: bk.gameOver ? 'GAME_OVER' : 'TURN_END',
              eventLogs: logs,
            });
            return;
          } else {
            activePlayer.money -= card.amount;
            currentJackpot += card.amount;
          }
        }
        break;

      case 'TELEPORT':
        if (card.targetTileId !== undefined) {
          const oldPos = activePlayer.position;
          const target = card.targetTileId;

          // If looping past start (and not sent to jail)
          if (oldPos > target && target !== 8) {
            activePlayer.money += state.settings.passGoReward;
            logs.push(
              `${activePlayer.name} vượt qua Cổng Làng nhận ${state.settings.passGoReward.toLocaleString(
                'vi-VN'
              )}đ.`
            );
          }
          activePlayer.position = target;

          if (target === 16) {
            // Festival jackpot
            activePlayer.money += currentJackpot;
            currentJackpot = 20000;
          } else if (target === 8) {
            activePlayer.inJail = true;
            activePlayer.jailTurns = state.settings.maxJailTurns;
          }
        }
        break;

      case 'JAIL_FREE':
        activePlayer.jailFreeCards = (activePlayer.jailFreeCards || 0) + 1;
        break;

      case 'PAY_EACH_PLAYER':
        if (card.amount) {
          const others = state.players.filter(
            (p, idx) => idx !== activePlayerIndex && !p.bankrupt
          );
          const totalDebt = card.amount * others.length;
          if (activePlayer.money < totalDebt) {
            logs.push(
              `${activePlayer.name} không đủ tiền trả cho người chơi khác và bị phá sản!`
            );
            const bk = processBankruptcy(state.players, tiles, activePlayerIndex, null);
            set({
              players: bk.players,
              tiles: bk.tiles,
              winner: bk.winner,
              gamePhase: bk.gameOver ? 'GAME_OVER' : 'TURN_END',
              eventLogs: logs,
            });
            return;
          } else {
            activePlayer.money -= totalDebt;
            const updatedPlayers = state.players.map((p, idx) => {
              if (idx === activePlayerIndex) return activePlayer;
              if (!p.bankrupt) return { ...p, money: p.money + card.amount! };
              return p;
            });

            set({
              players: updatedPlayers,
              tiles,
              jackpotFund: currentJackpot,
              gamePhase: 'TURN_END',
              eventLogs: logs,
            });
            return;
          }
        }
        break;
    }

    const updatedPlayers = [...state.players];
    updatedPlayers[activePlayerIndex] = activePlayer;

    set({
      players: updatedPlayers,
      tiles,
      jackpotFund: currentJackpot,
      gamePhase: 'TURN_END',
      eventLogs: logs,
    });
  },

  applyAndDismissCurrentCard: () => {
    get().dismissCard();
  },

  dismissCard: () => {
    const state = get();
    if (state.currentCard?.type === 'LUCKY_WHEEL') {
      set({ currentCard: null, gamePhase: 'LUCKY_WHEEL' });
      return;
    }
    const activePlayer = state.players[state.activePlayerIndex];
    let nextPhase: GamePhase = 'TURN_END';

    // BUG-03: If player was teleported to an unowned tile or own tile, allow action
    if (activePlayer && !activePlayer.bankrupt && !activePlayer.inJail) {
      const currentTile = state.tiles[activePlayer.position];
      if (
        currentTile &&
        (currentTile.type === 'PROPERTY' || currentTile.type === 'TRANSPORT' || currentTile.type === 'UTILITY')
      ) {
        if (!currentTile.ownerId) {
          nextPhase = 'ACTION_REQUIRED';
        } else if (currentTile.ownerId === activePlayer.id) {
          nextPhase = 'ACTION';
        }
      }
    }

    set({ currentCard: null, gamePhase: nextPhase });
  },

  endTurn: () => {
    const state = get();
    if (state.gamePhase === 'GAME_OVER') return;

    const activePlayer = state.players[state.activePlayerIndex];

    // Double bonus extra turn (if player is not in jail or bankrupt)
    if (state.isDouble && !activePlayer.inJail && !activePlayer.bankrupt) {
      set({
        gamePhase: 'WAITING',
        isDouble: false,
        rollSessionId: null,
        activeRollerId: null,
        targetTileIndex: null,
        eventLogs: [
          ...state.eventLogs,
          `${activePlayer.name} tiếp tục lượt đổ xúc xắc vì đổ đôi!`,
        ],
      });
      return;
    }

    // Advance to next active player
    const players = state.players;
    let nextIndex = (state.activePlayerIndex + 1) % players.length;
    let attempts = 0;
    while (players[nextIndex].bankrupt && attempts < players.length) {
      nextIndex = (nextIndex + 1) % players.length;
      attempts++;
    }

    let nextRound = state.currentRound || 1;
    if (nextIndex <= state.activePlayerIndex) {
      nextRound += 1;
    }

    const alivePlayers = players.filter((p) => !p.bankrupt);
    if (alivePlayers.length <= 1) {
      set({
        gamePhase: 'GAME_OVER',
        winner: alivePlayers[0] || null,
        doubleStreak: 0,
        consecutiveDoubles: 0,
        isDouble: false,
        currentCard: null,
      });
      return;
    }

    set({
      activePlayerIndex: nextIndex,
      doubleStreak: 0,
      consecutiveDoubles: 0,
      isDouble: false,
      currentRound: nextRound,
      currentCard: null,
      rollSessionId: null,
      activeRollerId: null,
      targetTileIndex: null,
      gamePhase: 'WAITING',
      eventLogs: [...state.eventLogs, `Đến lượt của ${players[nextIndex].name}.`],
    });
  },

  resetGame: () => {
    get().initGame();
  },

  setGamePhase: (phase) => {
    set({ gamePhase: phase });
  },
  playBauCua: (betMascot: number, betAmount: number): BauCuaResult => {
    const state = get();
    const activePlayer = { ...state.players[state.activePlayerIndex] };
    const logs = [...state.eventLogs];

    // Deduct bet amount from active player balance
    activePlayer.money -= betAmount;

    // Roll 3 dice (0 to 5 for the 6 mascots)
    const d1 = Math.floor(Math.random() * 6);
    const d2 = Math.floor(Math.random() * 6);
    const d3 = Math.floor(Math.random() * 6);
    const dice: [number, number, number] = [d1, d2, d3];

    const matches = dice.filter((d) => d === betMascot).length;
    let winnings = 0;
    let isJackpot = false;
    let newJackpot = state.jackpotFund;

    const mascotNames = ['Nai', 'Bầu', 'Gà', 'Cá', 'Cua', 'Tôm'];

    if (matches === 3) {
      isJackpot = true;
      winnings = betAmount * 3 + state.jackpotFund;
      newJackpot = 20000;
      activePlayer.money += (betAmount + winnings);
      logs.push(
        `🎉 TAM HOA BÃO LỚN! ${activePlayer.name} đổ trúng 3 con ${mascotNames[betMascot]}, ẴM TRỌN QUỸ HEO ĐẤT và nhận +${(betAmount + winnings).toLocaleString('vi-VN')}đ!`
      );
    } else if (matches > 0) {
      winnings = betAmount * matches;
      activePlayer.money += (betAmount + winnings);
      logs.push(
        `🎲 ${activePlayer.name} trúng ${matches} con ${mascotNames[betMascot]} tại Hội Chợ Bầu Cua, nhận +${(betAmount + winnings).toLocaleString('vi-VN')}đ!`
      );
    } else {
      winnings = 20000; // Festival consolation
      activePlayer.money += winnings;
      logs.push(
        `🎁 ${activePlayer.name} nhận quà lưu niệm Lễ Hội Dân Gian +20.000đ!`
      );
    }

    const updatedPlayers = state.players.map((p, idx) =>
      idx === state.activePlayerIndex ? activePlayer : p
    );

    const result: BauCuaResult = {
      dice,
      betMascot,
      matches,
      winnings,
      isJackpot,
    };

    set({
      players: updatedPlayers,
      jackpotFund: newJackpot,
      bauCuaResult: result,
      eventLogs: logs,
    });

    return result;
  },

  spinLuckyWheel: (): LuckyWheelResult => {
    const state = get();
    const activePlayer = { ...state.players[state.activePlayerIndex] };
    const logs = [...state.eventLogs];

    // 8 prizes
    const prizeIndex = Math.floor(Math.random() * 8);
    let title = '';
    let rewardText = '';
    let newJackpot = state.jackpotFund;

    if (!activePlayer.tacticalCards) {
      activePlayer.tacticalCards = { evenOdd: 0, rentShield: 0, doubleStep: 0 };
    }

    switch (prizeIndex) {
      case 0: // Jackpot
        title = 'HEO ĐẤT JACKPOT';
        rewardText = `+${state.jackpotFund.toLocaleString('vi-VN')}đ`;
        activePlayer.money += state.jackpotFund;
        newJackpot = 20000;
        logs.push(`🐷 ${activePlayer.name} QUAY TRÚNG HEO ĐẤT JACKPOT! Ẵm trọn ${state.jackpotFund.toLocaleString('vi-VN')}đ!`);
        break;
      case 1: // Cash 150k
        title = 'THƯỞNG NÓNG';
        rewardText = '+150.000đ tiền mặt';
        activePlayer.money += 150000;
        logs.push(`💰 ${activePlayer.name} quay trúng Thưởng Nóng +150.000đ!`);
        break;
      case 2: // Shield
        title = 'KHIÊN BẢO HỘ';
        rewardText = '+1 Thẻ Khiên Chắn tiền thuê';
        activePlayer.tacticalCards.rentShield = (activePlayer.tacticalCards.rentShield || 0) + 1;
        logs.push(`🛡️ ${activePlayer.name} quay trúng 1 Thẻ Khiên Bảo Hộ!`);
        break;
      case 3: // Even/Odd
        title = 'XÚC XẮC CHẴN/LẺ';
        rewardText = '+2 Thẻ Xúc Xắc Chẵn/Lẻ';
        activePlayer.tacticalCards.evenOdd = (activePlayer.tacticalCards.evenOdd || 0) + 2;
        logs.push(`✨ ${activePlayer.name} quay trúng 2 Thẻ Xúc Xắc Chẵn/Lẻ!`);
        break;
      case 4: // Teleport Phu Quoc
        title = 'BAY ĐẾN PHÚ QUỐC';
        rewardText = 'Dịch chuyển đến Đảo Ngọc Phú Quốc';
        activePlayer.position = 10;
        logs.push(`✈️ ${activePlayer.name} quay trúng chuyến bay thẳng ra Phú Quốc!`);
        break;
      case 5: // Double Step
        title = 'TĂNG TỐC +2 BƯỚC';
        rewardText = '+2 Thẻ Tăng Tốc';
        activePlayer.tacticalCards.doubleStep = (activePlayer.tacticalCards.doubleStep || 0) + 2;
        logs.push(`⚡ ${activePlayer.name} quay trúng 2 Thẻ Tăng Tốc!`);
        break;
      case 6: // Lucky Money 80k
        title = 'LÌ XÌ MAY MẮN';
        rewardText = '+80.000đ lì xì';
        activePlayer.money += 80000;
        logs.push(`🧧 ${activePlayer.name} quay trúng Lì Xì May Mắn +80.000đ!`);
        break;
      case 7: // Extra Roll
        title = 'ĐỔ TIẾP LẬP TỨC';
        rewardText = 'Tặng thêm 1 lượt đổ tự do';
        logs.push(`🎲 ${activePlayer.name} quay trúng thêm 1 Lượt Đổ Tự Do!`);
        break;
    }

    const updatedPlayers = state.players.map((p, idx) =>
      idx === state.activePlayerIndex ? activePlayer : p
    );

    const result: LuckyWheelResult = {
      prizeIndex,
      title,
      rewardText,
    };

    set({
      players: updatedPlayers,
      jackpotFund: newJackpot,
      luckyWheelResult: result,
      eventLogs: logs,
    });

    return result;
  },

  useEvenOddCard: (modifier: 'EVEN' | 'ODD') => {
    const state = get();
    const activePlayer = { ...state.players[state.activePlayerIndex] };
    if (!activePlayer.tacticalCards?.evenOdd || activePlayer.tacticalCards.evenOdd <= 0) return;

    activePlayer.tacticalCards.evenOdd -= 1;
    activePlayer.activeDiceModifier = modifier;

    const logs = [
      ...state.eventLogs,
      `✨ ${activePlayer.name} kích hoạt Thẻ Xúc Xắc ${modifier === 'EVEN' ? 'Chẵn' : 'Lẻ'}!`,
    ];

    set({
      players: state.players.map((p, idx) => (idx === state.activePlayerIndex ? activePlayer : p)),
      eventLogs: logs,
    });
  },

  useRentShield: () => {
    const state = get();
    const activePlayer = { ...state.players[state.activePlayerIndex] };
    if (!activePlayer.tacticalCards?.rentShield || activePlayer.tacticalCards.rentShield <= 0) return;

    activePlayer.tacticalCards.rentShield -= 1;
    activePlayer.hasActiveShield = true;

    const logs = [
      ...state.eventLogs,
      `🛡️ ${activePlayer.name} kích hoạt Khiên Bảo Hộ! Sẽ được miễn phí trả tiền thuê lần tới!`,
    ];

    set({
      players: state.players.map((p, idx) => (idx === state.activePlayerIndex ? activePlayer : p)),
      eventLogs: logs,
    });
  },

  useDoubleStep: () => {
    const state = get();
    const activePlayer = { ...state.players[state.activePlayerIndex] };
    if (!activePlayer.tacticalCards?.doubleStep || activePlayer.tacticalCards.doubleStep <= 0) return;

    activePlayer.tacticalCards.doubleStep -= 1;
    activePlayer.position = (activePlayer.position + 2) % 32;
    const dest = state.tiles[activePlayer.position];

    const logs = [
      ...state.eventLogs,
      `⚡ ${activePlayer.name} kích hoạt Thẻ Tăng Tốc, tiến thêm +2 bước tới ô [${activePlayer.position}] ${dest?.name || ''}!`,
    ];

    set({
      players: state.players.map((p, idx) => (idx === state.activePlayerIndex ? activePlayer : p)),
      eventLogs: logs,
    });
  },

  dismissMiniGame: () => {
    set({
      gamePhase: 'TURN_END',
      bauCuaResult: null,
      luckyWheelResult: null,
    });
  },
}));

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
  payJailBail: () => boolean;
  useJailFreeCard: () => boolean;
  drawCard: (deckType: 'CHANCE' | 'FATE', cardId?: string) => ChanceCard;
  applyCardEffect: (card: ChanceCard) => void;
  dismissCard: () => void;
  endTurn: () => void;
  resetGame: () => void;
  setGamePhase: (phase: GamePhase) => void;
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
  const houseCount = tile.houseCount || 0;
  let rent = 0;
  if (tile.rentMultiplier && tile.rentMultiplier.length > houseCount) {
    rent = tile.rentMultiplier[houseCount];
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
      return {
        ...p,
        money: p.money + cashRemaining,
      };
    }
    return p;
  });

  // Reclaim all properties owned by debtor
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

    const d1 = diceOverride !== undefined ? diceOverride[0] : Math.floor(Math.random() * 6) + 1;
    const d2 = diceOverride !== undefined ? diceOverride[1] : Math.floor(Math.random() * 6) + 1;
    const sum = d1 + d2;
    const isDouble = d1 === d2;

    let activePlayer = { ...state.players[state.activePlayerIndex] };
    let newDoubleStreak = isDouble ? state.doubleStreak + 1 : 0;
    const logs = [...state.eventLogs];

    logs.push(
      `${activePlayer.name} đổ xúc xắc: [${d1}, ${d2}] (Tổng: ${sum})${
        isDouble ? ' - ĐỔI ĐÔI!' : ''
      }`
    );

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
          // Max jail turns reached, must pay bail
          if (activePlayer.money >= state.settings.jailBailPrice) {
            activePlayer.money -= state.settings.jailBailPrice;
            activePlayer.inJail = false;
            activePlayer.jailTurns = 0;
            logs.push(
              `${activePlayer.name} hết thời hạn tạm giam, nộp phạt ${state.settings.jailBailPrice.toLocaleString(
                'vi-VN'
              )}đ để ra tù.`
            );
          } else {
            // Cannot pay bail
            logs.push(
              `${activePlayer.name} không đủ tiền nộp phạt tại trại giam và bị phá sản!`
            );
            const bk = processBankruptcy(
              state.players,
              state.tiles,
              state.activePlayerIndex,
              null
            );
            set({
              players: bk.players,
              tiles: bk.tiles,
              dice: [d1, d2],
              isDouble: false,
              doubleStreak: 0,
              consecutiveDoubles: 0,
              winner: bk.winner,
              gamePhase: bk.gameOver ? 'GAME_OVER' : 'TURN_END',
              eventLogs: logs,
            });
            return [d1, d2];
          }
        } else {
          // Stay in jail
          activePlayer.jailTurns = remainingTurns;
          logs.push(
            `${activePlayer.name} không đổ được đôi, tiếp tục ở lại trại giam (còn ${remainingTurns} lượt).`
          );
          const updatedPlayers = [...state.players];
          updatedPlayers[state.activePlayerIndex] = activePlayer;
          set({
            players: updatedPlayers,
            dice: [d1, d2],
            isDouble: false,
            doubleStreak: 0,
            consecutiveDoubles: 0,
            gamePhase: 'TURN_END',
            eventLogs: logs,
          });
          return [d1, d2];
        }
      }
    }

    // 2. Double bonus & speed check
    if (isDouble && !activePlayer.inJail) {
      activePlayer.money += 50000;
      logs.push(`${activePlayer.name} nhận thưởng đổ đôi +50.000đ!`);

      if (newDoubleStreak >= 3) {
        logs.push(
          `${activePlayer.name} đổ đôi 3 lần liên tiếp! Bị phạt đi bão và tống thẳng vào Trại Giam!`
        );
        activePlayer.position = 8;
        activePlayer.inJail = true;
        activePlayer.jailTurns = state.settings.maxJailTurns;

        const updatedPlayers = [...state.players];
        updatedPlayers[state.activePlayerIndex] = activePlayer;

        set({
          players: updatedPlayers,
          dice: [d1, d2],
          isDouble: false,
          doubleStreak: 0,
          consecutiveDoubles: 0,
          gamePhase: 'TURN_END',
          eventLogs: logs,
        });
        return [d1, d2];
      }
    }

    // 3. Movement & Passing Go
    const oldPos = activePlayer.position;
    const rawPos = oldPos + sum;
    const newPos = rawPos % 32;

    if (rawPos >= 32) {
      activePlayer.money += state.settings.passGoReward;
      logs.push(
        `${activePlayer.name} vượt qua hoặc dừng tại Xuất Phát (Cổng Làng), nhận ${state.settings.passGoReward.toLocaleString(
          'vi-VN'
        )}đ.`
      );
    }

    activePlayer.position = newPos;

    // 4. Tile Landing
    let currentJackpot = state.jackpotFund;
    let tiles = [...state.tiles];
    let currentCard: ChanceCard | null = null;
    let nextPhase: GamePhase = 'TURN_END';

    const landedTile = tiles[newPos];
    logs.push(`${activePlayer.name} dừng chân tại ô [${newPos}] ${landedTile.name}.`);

    if (landedTile.type === 'GO_TO_JAIL') {
      logs.push(`${activePlayer.name} bị bắt đi bão! Áp giải thẳng về Trại Giam!`);
      activePlayer.position = 8;
      activePlayer.inJail = true;
      activePlayer.jailTurns = state.settings.maxJailTurns;
      nextPhase = 'TURN_END';
    } else if (landedTile.type === 'FESTIVAL') {
      logs.push(
        `${activePlayer.name} tham gia Lễ Hội Dân Gian và ẵm trọn Quỹ Heo Đất ${currentJackpot.toLocaleString(
          'vi-VN'
        )}đ!`
      );
      activePlayer.money += currentJackpot;
      currentJackpot = 20000;
      nextPhase = 'TURN_END';
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

          set({
            players: updatedPlayers,
            tiles,
            dice: [d1, d2],
            isDouble,
            doubleStreak: newDoubleStreak,
            consecutiveDoubles: newDoubleStreak,
            jackpotFund: currentJackpot,
            currentCard,
            gamePhase: nextPhase,
            eventLogs: logs,
          });
          return [d1, d2];
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

          set({
            players: bk.players,
            tiles: bk.tiles,
            dice: [d1, d2],
            isDouble: false,
            doubleStreak: 0,
            consecutiveDoubles: 0,
            jackpotFund: currentJackpot,
            winner: bk.winner,
            gamePhase: bk.gameOver ? 'GAME_OVER' : 'TURN_END',
            eventLogs: logs,
          });
          return [d1, d2];
        }
      }
    }

    const updatedPlayers = [...state.players];
    updatedPlayers[state.activePlayerIndex] = activePlayer;

    set({
      players: updatedPlayers,
      tiles,
      dice: [d1, d2],
      isDouble,
      doubleStreak: newDoubleStreak,
      consecutiveDoubles: newDoubleStreak,
      jackpotFund: currentJackpot,
      currentCard,
      gamePhase: nextPhase,
      eventLogs: logs,
    });

    return [d1, d2];
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
      gamePhase: 'WAITING',
      eventLogs: [
        ...state.eventLogs,
        `${activePlayer.name} đã nộp tiền bảo lãnh ${bail.toLocaleString(
          'vi-VN'
        )}đ và được tự do!`,
      ],
    });

    return true;
  },

  useJailFreeCard: () => {
    const state = get();
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
            activePlayer.money -= card.amount;
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

  dismissCard: () => {
    set({ currentCard: null, gamePhase: 'TURN_END' });
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
}));

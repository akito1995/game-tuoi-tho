import {
  CharacterId,
  CHARACTERS,
  ColorGroup,
  DEFAULT_SETTINGS,
  GamePhase,
  GameSettings,
  GameState,
  Player,
  Tile,
  ChanceCard,
  VictoryType,
  VICTORY_NAMES,
  BUILDING_COSTS,
  RENT_RATES,
  SkillType,
  PendingDebt,
  PlayerRankingItem,
} from './types';
import { BOARD_40_TILES } from './boardData';
import { CHANCE_CARDS, FATE_CARDS } from './chanceCards';
import { GameEventBus } from './events';
import { GAME_CONFIG } from './gameConfig';

export const LINE_TILES = {
  SOUTH: [1, 3, 5, 6, 8, 9],
  WEST: [11, 12, 13, 14, 15, 16, 18, 19],
  NORTH: [21, 23, 24, 25, 26, 27, 28, 29],
  EAST: [31, 32, 34, 35, 37, 39],
};

export const TRANSPORT_TILES = [5, 15, 25, 35];
export const UTILITY_TILES = [12, 28];

/**
 * Tính tiền thuê của một ô bất kỳ (Dùng chung cho Engine, Canvas 2.5D và HUD)
 */
export function calculateTileRent(tile: Tile, allTiles: Tile[], diceSum: number = 7): number {
  if (tile.isMortgaged || !tile.ownerId) return 0;

  // 1. Ô Giao thông (4 ô): thuê 25 / 50 / 100 / 200K
  if (tile.type === 'TRANSPORT') {
    const ownedCount = allTiles.filter(
      (t) => t.type === 'TRANSPORT' && t.ownerId === tile.ownerId
    ).length;
    const rates = [25000, 50000, 100000, 200000];
    const tier = Math.max(0, Math.min(ownedCount - 1, rates.length - 1));
    return rates[tier];
  }

  // 2. Ô Tiện ích (2 ô): thuê = điểm xúc xắc × 10K (1 ô) hoặc × 25K (2 ô)
  if (tile.type === 'UTILITY') {
    const ownedCount = allTiles.filter(
      (t) => t.type === 'UTILITY' && t.ownerId === tile.ownerId
    ).length;
    const multiplier = ownedCount >= 2 ? 25000 : 10000;
    return diceSum * multiplier;
  }

  // 3. Đất thông thường (PROPERTY) theo tỷ lệ % giá đất P
  const P = tile.price || 100000;

  if (tile.hasLandmark) {
    return Math.round(P * RENT_RATES.LANDMARK); // 500% P
  }

  const houseCount = tile.houseCount || 0;
  if (houseCount === 4) return Math.round(P * RENT_RATES.HOUSE_4); // 350% P
  if (houseCount === 3) return Math.round(P * RENT_RATES.HOUSE_3); // 250% P
  if (houseCount === 2) return Math.round(P * RENT_RATES.HOUSE_2); // 130% P
  if (houseCount === 1) return Math.round(P * RENT_RATES.HOUSE_1); // 50% P

  // Đất trống (0 nhà): Kiểm tra Monopoly nhóm màu
  if (tile.colorGroup) {
    const groupTiles = allTiles.filter((t) => t.colorGroup === tile.colorGroup);
    const isMonopoly = groupTiles.length > 0 && groupTiles.every((t) => t.ownerId === tile.ownerId);
    if (isMonopoly) {
      return Math.round(P * RENT_RATES.EMPTY_MONOPOLY); // 20% P
    }
  }
  return Math.round(P * RENT_RATES.EMPTY); // 10% P
}

export class GameEngine {
  public state: GameState;
  public settings: GameSettings;
  public events: GameEventBus;
  private watchdogTimer: any = null;

  constructor(
    playersInput?: Array<{ id: string; name: string; character: CharacterId; isBot: boolean }>,
    customSettings?: Partial<GameSettings>,
    eventBus?: GameEventBus
  ) {
    this.settings = { ...DEFAULT_SETTINGS, ...customSettings };
    this.events = eventBus || new GameEventBus();

    const initialPlayers: Player[] = playersInput && playersInput.length > 0
      ? playersInput.map((p) => ({
          id: p.id,
          name: p.name,
          character: p.character,
          color: CHARACTERS[p.character]?.color || '#E5484D',
          money: this.settings.initialMoney,
          position: 0,
          inJail: false,
          jailTurns: 0,
          properties: [],
          bankrupt: false,
          isBot: p.isBot,
          botDifficulty: 'NORMAL',
          jailFreeCards: 0,
          lapsCompleted: 0,
          skillCards: [],
        }))
      : [
          {
            id: 'player-1',
            name: 'Bé Tí',
            character: 'be-ti',
            color: CHARACTERS['be-ti'].color,
            money: this.settings.initialMoney,
            position: 0,
            inJail: false,
            jailTurns: 0,
            properties: [],
            bankrupt: false,
            isBot: false,
            botDifficulty: 'NORMAL',
            jailFreeCards: 0,
            lapsCompleted: 0,
            skillCards: [],
          },
          {
            id: 'player-2',
            name: 'Cô Hoa 🤖',
            character: 'co-hoa',
            color: CHARACTERS['co-hoa'].color,
            money: this.settings.initialMoney,
            position: 0,
            inJail: false,
            jailTurns: 0,
            properties: [],
            bankrupt: false,
            isBot: true,
            botDifficulty: 'NORMAL',
            jailFreeCards: 0,
            lapsCompleted: 0,
            skillCards: [],
          },
          {
            id: 'player-3',
            name: 'Ông Bảy 🤖',
            character: 'ong-bay',
            color: CHARACTERS['ong-bay'].color,
            money: this.settings.initialMoney,
            position: 0,
            inJail: false,
            jailTurns: 0,
            properties: [],
            bankrupt: false,
            isBot: true,
            botDifficulty: 'NORMAL',
            jailFreeCards: 0,
            lapsCompleted: 0,
            skillCards: [],
          },
          {
            id: 'player-4',
            name: 'Chị Mây 🤖',
            character: 'chi-may',
            color: CHARACTERS['chi-may'].color,
            money: this.settings.initialMoney,
            position: 0,
            inJail: false,
            jailTurns: 0,
            properties: [],
            bankrupt: false,
            isBot: true,
            botDifficulty: 'NORMAL',
            jailFreeCards: 0,
            lapsCompleted: 0,
            skillCards: [],
          },
        ];

    // Khởi tạo các ô đất với chi phí xây dựng theo nhóm
    const initializedTiles: Tile[] = JSON.parse(JSON.stringify(BOARD_40_TILES)).map((t: Tile) => {
      const costs = t.colorGroup ? BUILDING_COSTS[t.colorGroup] : undefined;
      return {
        ...t,
        housePrice: costs?.houseCost || t.housePrice || 50000,
        landmarkPrice: costs?.landmarkCost || 100000,
        houseCount: 0,
        hasLandmark: false,
        isMortgaged: false,
        investmentCost: t.price || 0,
      };
    });

    const initialHistory: Record<string, number[]> = {};
    initialPlayers.forEach((p) => {
      initialHistory[p.id] = [p.money];
    });

    this.state = {
      players: initialPlayers,
      activePlayerIndex: 0,
      dice: [1, 1],
      isDouble: false,
      doubleStreak: 0,
      gamePhase: 'AWAIT_ROLL',
      tiles: initializedTiles,
      currentCard: null,
      piggyBank: 0,
      winner: null,
      victoryType: null,
      victoryReason: null,
      eventLogs: ['Trò chơi Cờ Tỷ Phú v2 - Hành trình xuyên Việt bắt đầu!'],
      turnCount: 1,
      roundCount: 1,
      pendingDebt: null,
      netWorthHistory: initialHistory,
    };
  }

  public getActivePlayer(): Player {
    return this.state.players[this.state.activePlayerIndex];
  }

  public getTile(id: number): Tile {
    return this.state.tiles[id];
  }

  public getBuildingCost(tile: Tile): { houseCost: number; landmarkCost: number } {
    if (!tile.colorGroup || !BUILDING_COSTS[tile.colorGroup]) {
      return { houseCost: 50000, landmarkCost: 100000 };
    }
    return BUILDING_COSTS[tile.colorGroup];
  }

  /**
   * Kiểm tra độc quyền toàn bộ nhóm màu
   */
  public checkColorMonopoly(colorGroup?: ColorGroup, ownerId?: string | null): boolean {
    if (!colorGroup || !ownerId) return false;
    if (colorGroup === 'TRANSPORT' || colorGroup === 'UTILITY') return false;

    const groupTiles = this.state.tiles.filter((t) => t.colorGroup === colorGroup);
    if (groupTiles.length === 0) return false;
    return groupTiles.every((t) => t.ownerId === ownerId);
  }

  /**
   * Tính tiền thuê theo docs/rules-v2.md
   * P = giá mua đất
   */
  public calculateRent(tile: Tile, diceSum: number = 7): number {
    return calculateTileRent(tile, this.state.tiles, diceSum);
  }

  /**
   * Tính thuế theo luật:
   * - Ô 4 (Thuế thu nhập): 10% tổng tài sản người chơi, tối đa 200.000₫.
   * - Ô 38 (Thuế xa xỉ): 10% tiền mặt, tối đa 150.000₫.
   */
  public calculateTax(tile: Tile, player?: Player): number {
    if (tile.id === 4) {
      if (!player) return GAME_CONFIG.INCOME_TAX_MAX;
      const netWorth = this.calculateNetWorth(player);
      const tax = Math.round(netWorth * GAME_CONFIG.INCOME_TAX_RATE);
      return Math.min(GAME_CONFIG.INCOME_TAX_MAX, Math.max(10000, tax));
    }
    if (tile.id === 38) {
      return tile.taxAmount || 100000;
    }
    return tile.taxAmount || 100000;
  }

  /**
   * Tính tổng vốn đầu tư trên ô đất (để tính giá mua lại 1.5 lần)
   */
  public getInvestmentCost(tile: Tile): number {
    const P = tile.price || 0;
    const { houseCost, landmarkCost } = this.getBuildingCost(tile);
    const houses = tile.houseCount || 0;
    const landmark = tile.hasLandmark ? landmarkCost : 0;
    return P + (houses * houseCost) + landmark;
  }

  /**
   * Đổ xúc xắc
   */
  public rollDice(
    overrideDice?: [number, number],
    options?: { isSkillRoll?: boolean }
  ): {
    dice: [number, number];
    sum: number;
    isDouble: boolean;
  } {
    const activePlayer = this.getActivePlayer();
    if (activePlayer.bankrupt || this.state.gamePhase === 'GAME_OVER') {
      throw new Error('Không thể đổ xúc xắc khi ván chơi đã kết thúc hoặc người chơi phá sản.');
    }
    if (
      this.state.gamePhase === 'AWAIT_DECISION' ||
      this.state.gamePhase === 'CARD_DRAWN' ||
      this.state.gamePhase === 'AWAIT_TAKEOVER' ||
      this.state.gamePhase === 'DEBT_RELIEF'
    ) {
      throw new Error(`Không thể đổ xúc xắc khi đang ở trạng thái ${this.state.gamePhase}.`);
    }

    const d1 = overrideDice ? overrideDice[0] : Math.floor(Math.random() * 6) + 1;
    const d2 = overrideDice ? overrideDice[1] : Math.floor(Math.random() * 6) + 1;
    const sum = d1 + d2;
    // 4. Kỹ năng nhảy 2~4 hoặc 10~12 không được tính là đổ đôi để thưởng lượt
    const isDouble = options?.isSkillRoll ? false : d1 === d2;

    this.state.dice = [d1, d2];
    this.state.isDouble = isDouble;
    this.state.doubleStreak = isDouble ? this.state.doubleStreak + 1 : 0;
    this.state.gamePhase = 'ROLLING';

    this.events.emit('dice-rolled', {
      playerId: activePlayer.id,
      dice: [d1, d2],
      sum,
      isDouble,
    });

    this.addLog(
      `${activePlayer.name} đổ xúc xắc [${d1}, ${d2}] (Tổng: ${sum})${
        isDouble ? ` - ĐỔ ĐÔI! (Lần ${this.state.doubleStreak})` : ''
      }`
    );

    // 1. Xử lý người chơi đang trong trại giam (ô 10)
    if (activePlayer.inJail) {
      if (isDouble) {
        activePlayer.inJail = false;
        activePlayer.jailTurns = 0;
        // 3. Ra tù nhờ đổ đôi: chỉ di chuyển theo số đã đổ, KHÔNG được đổ thêm lượt
        this.state.isDouble = false;
        this.state.doubleStreak = 0;
        this.addLog(`${activePlayer.name} đổ đôi thành công và được thả tự do (không được đổ thêm lượt)!`);
        this.events.emit('jail-exited', { playerId: activePlayer.id, method: 'DOUBLE' });
      } else {
        activePlayer.jailTurns -= 1;
        if (activePlayer.jailTurns <= 0) {
          // Hết hạn 3 lượt giam, nộp 50K tiền bảo lãnh
          if (activePlayer.money >= this.settings.jailBailPrice) {
            activePlayer.money -= this.settings.jailBailPrice;
            activePlayer.inJail = false;
            activePlayer.jailTurns = 0;
            this.addLog(
              `${activePlayer.name} hết thời hạn tạm giam, nộp ${this.settings.jailBailPrice.toLocaleString(
                'vi-VN'
              )}đ tiền bảo lãnh để ra tù.`
            );
            this.events.emit('jail-exited', { playerId: activePlayer.id, method: 'BAIL' });
          } else {
            // Không đủ tiền bảo lãnh -> Cứu vãn tài chính hoặc phá sản
            this.handleDebt(activePlayer, null, this.settings.jailBailPrice, 'BAIL');
            return { dice: [d1, d2], sum, isDouble: false };
          }
        } else {
          this.addLog(
            `${activePlayer.name} không đổ được đôi, tiếp tục ở lại trại giam (còn ${activePlayer.jailTurns} lượt).`
          );
          this.endTurn();
          return { dice: [d1, d2], sum, isDouble: false };
        }
      }
    }

    // 2. Đi bão 3 lần liên tiếp đổ đôi -> Tống thẳng vào tù (không di chuyển, kết thúc lượt)
    if (isDouble && this.state.doubleStreak >= 3) {
      this.addLog(`🚨 ${activePlayer.name} đổ đôi 3 lần liên tiếp! Bị phạt đi bão và tống thẳng vào Trại Giam!`);
      this.sendToJail(activePlayer.id, 'Đổ đôi 3 lần liên tiếp');
      this.endTurn();
      return { dice: [d1, d2], sum, isDouble: false };
    }

    // 3. Di chuyển người chơi
    this.movePlayer(activePlayer.id, sum);

    return { dice: [d1, d2], sum, isDouble: this.state.isDouble };
  }

  /**
   * Sử dụng thẻ kỹ năng (SHORT: Nhảy 2~4, LONG: Nhảy 10~12, DOUBLE: Đôi x6)
   */
  public useSkillCard(playerId: string, skill: SkillType): {
    dice: [number, number];
    sum: number;
    isDouble: boolean;
  } {
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player) throw new Error('Không tìm thấy người chơi.');
    const cardIdx = player.skillCards.indexOf(skill);
    if (cardIdx >= 0) {
      player.skillCards.splice(cardIdx, 1);
    }

    const skillNames: Record<SkillType, string> = {
      SHORT: 'Nhảy 2~4',
      LONG: 'Nhảy 10~12',
      DOUBLE: 'Đôi ×6',
    };
    this.addLog(`🎯 ${player.name} dùng kỹ năng ${skillNames[skill]}.`);

    if (skill === 'SHORT') {
      const sum = Math.floor(Math.random() * 3) + 2; // 2, 3, hoặc 4
      const d1 = Math.max(1, Math.min(3, Math.floor(sum / 2)));
      const d2 = sum - d1;
      return this.rollDice([d1, d2], { isSkillRoll: true });
    } else if (skill === 'LONG') {
      const sum = Math.floor(Math.random() * 3) + 10; // 10, 11, hoặc 12
      const d1 = Math.floor(sum / 2);
      const d2 = sum - d1;
      return this.rollDice([d1, d2], { isSkillRoll: true });
    } else {
      return this.rollDice([6, 6]);
    }
  }

  /**
   * Di chuyển quân cờ
   */
  public movePlayer(
    playerId: string,
    steps: number,
    isDirectTeleport = false,
    teleportTarget?: number
  ): void {
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player) return;

    const oldPos = player.position;
    let newPos = oldPos;
    let passedGo = false;
    let stoppedAtGo = false;

    if (isDirectTeleport && teleportTarget !== undefined) {
      newPos = teleportTarget;
      if (newPos < oldPos && newPos !== 10) {
        passedGo = true;
      }
      if (newPos === 0) {
        stoppedAtGo = true;
      }
    } else {
      const rawPos = oldPos + steps;
      newPos = rawPos % this.settings.boardTileCount;
      if (rawPos >= this.settings.boardTileCount) {
        passedGo = true;
      }
      if (newPos === 0) {
        stoppedAtGo = true;
      }
    }

    let reward = 0;
    if (stoppedAtGo) {
      reward = this.settings.exactGoReward; // 300K khi dừng đúng ô Xuất Phát
      player.money += reward;
      player.lapsCompleted += 1;
      this.grantSkillCard(player);
      this.addLog(
        `🎯 ${player.name} dừng trúng đích ô Xuất Phát, nhận phần thưởng lớn ${(reward / 1000).toLocaleString('vi-VN')}K₫!`
      );
    } else if (passedGo) {
      reward = this.settings.passGoReward; // 200K khi đi qua Xuất Phát
      player.money += reward;
      player.lapsCompleted += 1;
      this.grantSkillCard(player);
      this.addLog(
        `${player.name} đi qua ô Xuất Phát, nhận ${(reward / 1000).toLocaleString('vi-VN')}K₫ tiền lương vòng.`
      );
    }

    player.position = newPos;
    this.state.gamePhase = 'MOVING';

    this.events.emit('player-moved', {
      playerId: player.id,
      from: oldPos,
      to: newPos,
      passedGo: passedGo || stoppedAtGo,
      reward,
    });

    this.resolveTileLanding(player.id, newPos);
  }

  /**
   * Tặng 1 thẻ kỹ năng ngẫu nhiên khi qua hoặc dừng tại Xuất Phát (tối đa 3 thẻ)
   */
  public grantSkillCard(player: Player): void {
    if (player.skillCards.length >= 3) return;
    const pool: SkillType[] = ['SHORT', 'LONG', 'DOUBLE'];
    const chosen = pool[Math.floor(Math.random() * pool.length)];
    player.skillCards.push(chosen);
    const cardNames = { SHORT: 'NHẢY 2~4', LONG: 'NHẢY 10~12', DOUBLE: 'ĐÔI ×6' };
    this.addLog(`✨ ${player.name} nhận được thẻ kỹ năng "${cardNames[chosen]}"!`);
  }

  /**
   * Xử lý ô đất khi dừng chân
   */
  public resolveTileLanding(playerId: string, tileId: number): void {
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player) return;

    const tile = this.state.tiles[tileId];
    this.events.emit('tile-landed', { playerId: player.id, tile });

    switch (tile.type) {
      case 'START':
        this.completeAction();
        break;

      case 'REST':
        // Quán Trà Đá: Lĩnh trọn Quỹ Heo Đất nếu có!
        if (this.state.piggyBank > 0) {
          const jackpot = this.state.piggyBank;
          player.money += jackpot;
          this.state.piggyBank = 0;
          this.addLog(
            `🍵 ${player.name} dừng chân tại Quán Trà Đá và ẵm trọn Quỹ Heo Đất ${(jackpot / 1000).toLocaleString('vi-VN')}K₫!`
          );
          this.events.emit('piggy-bank-collected', { playerId: player.id, amount: jackpot });
        } else {
          this.addLog(`${player.name} nghỉ ngơi miễn phí và uống trà đá thảnh thơi.`);
        }
        this.completeAction();
        break;

      case 'JAIL':
        this.addLog(`${player.name} ghé thăm Trại Giam an toàn.`);
        this.completeAction();
        break;

      case 'GO_TO_JAIL':
        this.addLog(`👮 ${player.name} bước vào ô Vào Tù! Bị áp giải ngay về Trại Giam.`);
        this.sendToJail(player.id, 'Dừng chân tại ô Vào Tù');
        this.endTurn();
        break;

      case 'TAX': {
        const tax = this.calculateTax(tile, player);
        this.payTax(player.id, tax, tile);
        break;
      }

      case 'CHANCE':
      case 'FATE': {
        const deck = tile.type === 'CHANCE' ? CHANCE_CARDS : FATE_CARDS;
        const card = deck[Math.floor(Math.random() * deck.length)];
        this.state.currentCard = card;
        this.state.gamePhase = 'CARD_DRAWN';
        this.addLog(`${player.name} rút thẻ ${tile.type === 'CHANCE' ? 'Cơ Hội' : 'Khí Vận'}: "${card.title}"`);
        this.events.emit('card-drawn', { playerId: player.id, card, deck: tile.type });
        break;
      }

      case 'TRANSPORT':
      case 'UTILITY':
      case 'PROPERTY': {
        if (!tile.ownerId) {
          // Ô trống: Chờ quyết định mua
          this.state.gamePhase = 'AWAIT_DECISION';
        } else if (tile.ownerId === player.id) {
          // Đất của mình:
          if (tile.type === 'PROPERTY') {
            if (!tile.hasLandmark) {
              this.state.gamePhase = 'AWAIT_DECISION'; // Có thể nâng cấp thêm 1 cấp
            } else {
              this.addLog(`${player.name} ghé thăm Landmark của mình tại ${tile.name}.`);
              this.completeAction();
            }
          } else {
            this.addLog(`${player.name} ghé thăm ${tile.name} của mình.`);
            this.completeAction();
          }
        } else {
          // Đất của đối thủ: Phải trả tiền thuê!
          const diceSum = this.state.dice[0] + this.state.dice[1];
          const rent = this.calculateRent(tile, diceSum);
          this.payRent(player.id, tile.ownerId, rent, tile);
        }
        break;
      }
    }
  }

  /**
   * Mua đất trống (tự động theo nấc: Vòng 1 chỉ mua đất, từ vòng 2 mua kèm tối đa 1 nhà)
   */
  public buyProperty(playerId: string, tileId?: number, withHouse = true): boolean {
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player) return false;

    const targetId = tileId !== undefined ? tileId : player.position;
    const tile = this.state.tiles[targetId];

    if (!tile || tile.ownerId != null || !tile.price) {
      return false;
    }

    // Vòng 1: Chỉ mua đất trống theo luật
    let shouldBuyHouse = withHouse && this.state.roundCount >= 2 && tile.type === 'PROPERTY';
    const basePrice = tile.price;
    const { houseCost } = this.getBuildingCost(tile);
    const totalPrice = shouldBuyHouse ? basePrice + houseCost : basePrice;

    if (player.money < totalPrice) {
      // Nếu không đủ tiền mua kèm nhà, thử mua mỗi đất trống
      if (shouldBuyHouse && player.money >= basePrice) {
        shouldBuyHouse = false;
      } else {
        this.addLog(`${player.name} không đủ tiền mua ${tile.name} (cần ${(totalPrice / 1000).toLocaleString('vi-VN')}K₫).`);
        return false;
      }
    }

    const finalPrice = shouldBuyHouse ? basePrice + houseCost : basePrice;
    player.money -= finalPrice;
    tile.ownerId = player.id;
    tile.houseCount = shouldBuyHouse ? 1 : 0;
    tile.investmentCost = finalPrice;
    tile.isMortgaged = false;

    if (!player.properties.includes(tile.id)) {
      player.properties.push(tile.id);
    }

    this.addLog(
      `${player.name} mua thành công ${tile.name}${shouldBuyHouse ? ' (kèm 1 nhà)' : ''} với giá ${(finalPrice / 1000).toLocaleString('vi-VN')}K₫.`
    );

    if (tile.type === 'UTILITY') {
      const ownedUtilities = this.state.tiles.filter(
        (t) => t.type === 'UTILITY' && t.ownerId === player.id
      ).length;
      if (ownedUtilities === 2) {
        this.addLog(
          `⚡ ${player.name} đã sở hữu trọn bộ 2 trạm Tiện Ích Quốc Gia (Thủy điện & Nhiệt điện)! Tiền thuê tăng lên xúc xắc × 25.000₫.`
        );
      }
    } else if (tile.type === 'TRANSPORT') {
      const ownedStations = this.state.tiles.filter(
        (t) => t.type === 'TRANSPORT' && t.ownerId === player.id
      ).length;
      if (ownedStations === 4) {
        this.addLog(
          `🚂 ${player.name} đã sở hữu trọn bộ 4 nhà ga giao thông trên toàn quốc!`
        );
      }
    }

    this.events.emit('property-bought', {
      playerId: player.id,
      tile,
      price: finalPrice,
    });

    if (this.checkAndApplyVictory()) return true;

    this.completeAction();
    return true;
  }

  /**
   * Nâng cấp nhà (Mỗi lần dừng tối đa 1 cấp; Landmark cần đủ 4 nhà + đã qua Xuất Phát >= 2 lần)
   */
  public upgradeProperty(playerId: string, tileId: number): boolean {
    const player = this.state.players.find((p) => p.id === playerId);
    const tile = this.state.tiles[tileId];

    if (!player || !tile || tile.ownerId !== player.id || tile.type !== 'PROPERTY') {
      return false;
    }

    if (tile.hasLandmark || tile.isMortgaged) {
      return false;
    }

    const currentCount = tile.houseCount || 0;
    const { houseCost, landmarkCost } = this.getBuildingCost(tile);

    if (currentCount < 4) {
      // Nâng cấp thêm 1 nhà
      if (player.money < houseCost) {
        this.addLog(`${player.name} không đủ tiền xây nhà cấp ${currentCount + 1} tại ${tile.name}.`);
        return false;
      }

      player.money -= houseCost;
      tile.houseCount = currentCount + 1;
      tile.investmentCost = (tile.investmentCost || tile.price || 0) + houseCost;

      this.addLog(
        `${player.name} xây thêm nhà cấp ${tile.houseCount} tại ${tile.name} (chi phí: ${(houseCost / 1000).toLocaleString('vi-VN')}K₫).`
      );

      this.events.emit('property-upgraded', {
        playerId: player.id,
        tile,
        tier: tile.houseCount,
        cost: houseCost,
      });
    } else {
      // Xây Landmark: Điều kiện đủ 4 nhà + đã qua Xuất Phát >= 2 lần + đủ tiền landmark
      if (player.lapsCompleted < 2) {
        this.addLog(`⚠️ ${player.name} chưa đủ điều kiện xây Landmark (cần hoàn thành ít nhất 2 vòng bản đồ).`);
        this.completeAction();
        return false;
      }

      if (player.money < landmarkCost) {
        this.addLog(`${player.name} không đủ ${(landmarkCost / 1000).toLocaleString('vi-VN')}K₫ để khánh thành Landmark tại ${tile.name}.`);
        return false;
      }

      player.money -= landmarkCost;
      tile.hasLandmark = true;
      tile.investmentCost = (tile.investmentCost || tile.price || 0) + landmarkCost;

      this.addLog(
        `🏆 ${player.name} khánh thành Công trình biểu tượng Landmark "${tile.landmarkName || tile.name}" (chi phí: ${(landmarkCost / 1000).toLocaleString('vi-VN')}K₫)! Landmark không ai mua lại được.`
      );

      this.events.emit('property-upgraded', {
        playerId: player.id,
        tile,
        tier: 5,
        cost: landmarkCost,
      });
    }

    if (this.checkAndApplyVictory()) return true;

    this.completeAction();
    return true;
  }

  /**
   * Mua lại đất đối thủ giá 1.5 lần tổng vốn (Landmark không mua lại được)
   */
  public takeoverProperty(buyerId: string, tileId: number): boolean {
    const buyer = this.state.players.find((p) => p.id === buyerId);
    const tile = this.state.tiles[tileId];

    if (!buyer || !tile || !tile.ownerId || tile.ownerId === buyerId) return false;
    if (tile.hasLandmark) {
      this.addLog(`⚠️ Không thể mua lại ${tile.name} vì đã có Công trình biểu tượng Landmark.`);
      return false;
    }

    const seller = this.state.players.find((p) => p.id === tile.ownerId);
    if (!seller) return false;

    const totalInvestment = tile.investmentCost || this.getInvestmentCost(tile);
    const takeoverPrice = Math.round(1.5 * totalInvestment);

    if (buyer.money < takeoverPrice) {
      this.addLog(`${buyer.name} không đủ ${(takeoverPrice / 1000).toLocaleString('vi-VN')}K₫ để mua lại ${tile.name}.`);
      return false;
    }

    buyer.money -= takeoverPrice;
    seller.money += takeoverPrice;

    // Chuyển chủ quyền
    seller.properties = seller.properties.filter((id) => id !== tile.id);
    if (!buyer.properties.includes(tile.id)) {
      buyer.properties.push(tile.id);
    }
    tile.ownerId = buyer.id;
    tile.investmentCost = takeoverPrice; // Vốn mới của người mua lại

    this.addLog(
      `💥 CÚ LẬT KÈO! ${buyer.name} chi ${(takeoverPrice / 1000).toLocaleString('vi-VN')}K₫ mua đứt bất động sản ${tile.name} từ tay ${seller.name}!`
    );

    this.events.emit('property-takeover', {
      buyerId: buyer.id,
      sellerId: seller.id,
      tile,
      price: takeoverPrice,
    });

    if (this.checkAndApplyVictory()) return true;

    this.completeAction();
    return true;
  }

  /**
   * Bỏ qua mua đất (ô chưa có chủ)
   */
  public skipBuy(playerId?: string, tileId?: number): void {
    const active = this.getActivePlayer();
    const targetPlayer = playerId ? (this.state.players.find((p) => p.id === playerId) || active) : active;
    const targetTile = tileId !== undefined ? this.state.tiles[tileId] : this.state.tiles[targetPlayer.position];
    const tileName = targetTile?.name || 'ô đất';

    this.addLog(`${targetPlayer.name} bỏ qua không mua ${tileName}.`);
    this.events.emit('property-skipped', {
      playerId: targetPlayer.id,
      tile: targetTile,
      action: 'BUY',
    });
    this.completeAction();
  }

  /**
   * Bỏ qua nâng cấp công trình (ô của mình)
   */
  public skipUpgrade(playerId?: string, tileId?: number): void {
    const active = this.getActivePlayer();
    const targetPlayer = playerId ? (this.state.players.find((p) => p.id === playerId) || active) : active;
    const targetTile = tileId !== undefined ? this.state.tiles[tileId] : this.state.tiles[targetPlayer.position];
    const tileName = targetTile?.name || 'công trình';

    this.addLog(`${targetPlayer.name} bỏ qua không nâng cấp ${tileName}.`);
    this.events.emit('property-skipped', {
      playerId: targetPlayer.id,
      tile: targetTile,
      action: 'UPGRADE',
    });
    this.completeAction();
  }

  /**
   * Bỏ qua mua lại đất đối thủ
   */
  public skipTakeover(playerId?: string, tileId?: number): void {
    const active = this.getActivePlayer();
    const targetPlayer = playerId ? (this.state.players.find((p) => p.id === playerId) || active) : active;
    const targetTile = tileId !== undefined ? this.state.tiles[tileId] : this.state.tiles[targetPlayer.position];
    const tileName = targetTile?.name || 'ô đất';

    this.addLog(`${targetPlayer.name} bỏ qua không mua lại ${tileName}.`);
    this.events.emit('property-skipped', {
      playerId: targetPlayer.id,
      tile: targetTile,
      action: 'TAKEOVER',
    });
    this.completeAction();
  }

  /**
   * Trả tiền thuê đất
   */
  public payRent(debtorId: string, creditorId: string, amount: number, tile: Tile): void {
    const debtor = this.state.players.find((p) => p.id === debtorId);
    const creditor = this.state.players.find((p) => p.id === creditorId);
    if (!debtor || !creditor) return;

    if (debtor.money >= amount) {
      debtor.money -= amount;
      creditor.money += amount;

      let rentDetail = '';
      if (tile.type === 'UTILITY') {
        const ownedCount = this.state.tiles.filter(
          (t) => t.type === 'UTILITY' && t.ownerId === creditor.id
        ).length;
        const multiplier = ownedCount >= 2 ? 25000 : 10000;
        const diceSum = this.state.dice[0] + this.state.dice[1];
        rentDetail = ` (xúc xắc ${this.state.dice[0]}+${this.state.dice[1]}=${diceSum} × ${(multiplier / 1000).toLocaleString('vi-VN')}K₫)`;
      }

      this.addLog(
        `${debtor.name} trả ${(amount / 1000).toLocaleString('vi-VN')}K₫ tiền thuê tại ${tile.name} cho ${creditor.name}${rentDetail}.`
      );
      this.events.emit('rent-paid', {
        debtorId: debtor.id,
        creditorId: creditor.id,
        amount,
        tile,
      });

      // Nếu đất đối thủ chưa có Landmark, cho phép mua lại 1.5x
      const canTakeover = tile.type === 'PROPERTY' && !tile.hasLandmark;
      const takeoverPrice = Math.round(1.5 * (tile.investmentCost || this.getInvestmentCost(tile)));
      if (canTakeover && debtor.money >= takeoverPrice) {
        this.state.gamePhase = 'AWAIT_TAKEOVER';
      } else {
        this.completeAction();
      }
    } else {
      // Thiếu tiền: Kích hoạt chế độ Cứu vãn tài chính (bán nhà / cầm cố)
      this.handleDebt(debtor, creditor, amount, 'RENT', tile);
    }
  }

  /**
   * Nộp thuế:
   * - Thuế thu nhập (ô 4): 10% tổng tài sản, tối đa 200K₫
   * - Thuế xa xỉ (ô 38): 100K₫
   * Toàn bộ tiền thuế đổ vào Quỹ Heo Đất
   */
  public payTax(playerId: string, amount: number, tile: Tile): void {
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player) return;

    if (player.money >= amount) {
      player.money -= amount;
      this.state.piggyBank += amount;
      const taxDetail =
        tile.id === 4 ? ` (10% tổng tài sản, tối đa 200K₫)` : ``;
      this.addLog(
        `${player.name} nộp ${(amount / 1000).toLocaleString('vi-VN')}K₫ tiền ${tile.name}${taxDetail}. Toàn bộ tiền thuế được sung vào Quỹ Heo Đất (Hiện có: ${(this.state.piggyBank / 1000).toLocaleString('vi-VN')}K₫).`
      );
      this.events.emit('tax-paid', { playerId: player.id, amount, tile });
      this.completeAction();
    } else {
      this.handleDebt(player, null, amount, 'TAX', tile);
    }
  }

  /**
   * Xử lý nợ & Cứu vãn tài chính
   */
  public handleDebt(
    debtor: Player,
    creditor: Player | null,
    amount: number,
    reason: 'RENT' | 'TAX' | 'BAIL' | 'CARD',
    tile?: Tile
  ): void {
    this.state.pendingDebt = {
      debtorId: debtor.id,
      creditorId: creditor ? creditor.id : null,
      amountOwed: amount,
      tile,
      reason,
    };

    // Kiểm tra xem người chơi còn nhà để bán hoặc đất để cầm cố không
    const canSellOrMortgage = this.canPlayerRaiseFunds(debtor);

    if (canSellOrMortgage) {
      this.state.gamePhase = 'DEBT_RELIEF';
      this.addLog(
        `⚠️ ${debtor.name} thiếu tiền nợ ${(amount / 1000).toLocaleString('vi-VN')}K₫! Hãy bán bớt nhà hoặc cầm cố đất để gom tiền.`
      );
    } else {
      // Không còn tài sản nào cứu vãn được -> Phá sản ngay
      this.addLog(`${debtor.name} không còn bất kỳ tài sản nào để thế chấp và chính thức phá sản!`);
      this.processBankruptcy(debtor.id, creditor ? creditor.id : null);
    }
  }

  /**
   * Kiểm tra người chơi có thể bán nhà hoặc cầm cố đất để có tiền không
   */
  public canPlayerRaiseFunds(player: Player): boolean {
    const ownedTiles = this.state.tiles.filter((t) => t.ownerId === player.id);
    const hasHouses = ownedTiles.some((t) => (t.houseCount || 0) > 0);
    const hasUnmortgagedLands = ownedTiles.some((t) => !t.isMortgaged);
    return hasHouses || hasUnmortgagedLands;
  }

  /**
   * Bán bớt 1 nhà (hoàn 50% chi phí xây nhà)
   */
  public sellHouse(playerId: string, tileId: number): boolean {
    const player = this.state.players.find((p) => p.id === playerId);
    const tile = this.state.tiles[tileId];
    if (!player || !tile || tile.ownerId !== player.id || (tile.houseCount || 0) <= 0) {
      return false;
    }

    const { houseCost } = this.getBuildingCost(tile);
    const refund = Math.round(houseCost * 0.5); // 50% giá xây
    tile.houseCount = (tile.houseCount || 1) - 1;
    tile.investmentCost = Math.max(tile.price || 0, (tile.investmentCost || 0) - houseCost);
    player.money += refund;

    this.addLog(
      `${player.name} bán 1 nhà tại ${tile.name}, thu về ${(refund / 1000).toLocaleString('vi-VN')}K₫ (còn ${tile.houseCount} nhà).`
    );

    this.events.emit('house-sold', {
      playerId: player.id,
      tile,
      refund,
      remainingHouses: tile.houseCount,
    });

    this.checkPendingDebtResolved();
    return true;
  }

  /**
   * Cầm cố đất (nhận 50% giá đất P; ô chuyển sang màu xám, không thu tiền thuê)
   */
  public mortgageProperty(playerId: string, tileId: number): boolean {
    const player = this.state.players.find((p) => p.id === playerId);
    const tile = this.state.tiles[tileId];
    if (!player || !tile || tile.ownerId !== player.id || tile.isMortgaged) {
      return false;
    }

    // Nếu còn nhà, phải bán hết nhà trước khi cầm cố đất
    if ((tile.houseCount || 0) > 0 || tile.hasLandmark) {
      this.addLog(`⚠️ Cần bán toàn bộ nhà trên ô ${tile.name} trước khi cầm cố đất.`);
      return false;
    }

    const P = tile.price || 100000;
    const mortgageAmount = Math.round(P * 0.5); // 50% giá đất
    tile.isMortgaged = true;
    player.money += mortgageAmount;

    this.addLog(
      `🏛️ ${player.name} cầm cố ô đất ${tile.name}, nhận ${(mortgageAmount / 1000).toLocaleString('vi-VN')}K₫ (ô tạm ngưng thu tiền thuê).`
    );

    this.events.emit('property-mortgaged', {
      playerId: player.id,
      tile,
      amountReceived: mortgageAmount,
    });

    this.checkPendingDebtResolved();
    return true;
  }

  /**
   * Chuộc lại đất đã cầm cố (trả giá cầm cố + 10% tiền lãi: tức 55% giá đất)
   */
  public unmortgageProperty(playerId: string, tileId: number): boolean {
    const player = this.state.players.find((p) => p.id === playerId);
    const tile = this.state.tiles[tileId];
    if (!player || !tile || tile.ownerId !== player.id || !tile.isMortgaged) {
      return false;
    }

    const P = tile.price || 100000;
    const mortgageAmount = Math.round(P * 0.5); // Giá cầm cố gốc (50% giá đất)
    const unmortgageCost = Math.round(mortgageAmount * 1.1); // Giá cầm cố + 10% (55% giá đất)
    if (player.money < unmortgageCost) {
      this.addLog(`${player.name} không đủ ${(unmortgageCost / 1000).toLocaleString('vi-VN')}K₫ để chuộc lại ${tile.name}.`);
      return false;
    }

    player.money -= unmortgageCost;
    tile.isMortgaged = false;

    this.addLog(
      `✨ ${player.name} chuộc lại thành công ô đất ${tile.name} với chi phí ${(unmortgageCost / 1000).toLocaleString('vi-VN')}K₫!`
    );

    this.events.emit('property-unmortgaged', {
      playerId: player.id,
      tile,
      cost: unmortgageCost,
    });

    return true;
  }

  /**
   * Kiểm tra nợ đã gom đủ tiền trả chưa
   */
  public checkPendingDebtResolved(): boolean {
    if (!this.state.pendingDebt) return true;

    const debtor = this.state.players.find((p) => p.id === this.state.pendingDebt?.debtorId);
    if (!debtor) return false;

    const owed = this.state.pendingDebt.amountOwed;
    if (debtor.money >= owed) {
      // Đủ tiền rồi! Thanh toán nợ
      debtor.money -= owed;
      if (this.state.pendingDebt.creditorId) {
        const creditor = this.state.players.find((p) => p.id === this.state.pendingDebt?.creditorId);
        if (creditor) creditor.money += owed;
      } else if (this.state.pendingDebt.reason === 'TAX') {
        this.state.piggyBank += owed;
      }

      this.addLog(`✅ ${debtor.name} đã gom đủ tiền và thanh toán xong khoản nợ ${(owed / 1000).toLocaleString('vi-VN')}K₫!`);
      this.state.pendingDebt = null;
      this.completeAction();
      return true;
    }

    return false;
  }

  /**
   * Người chơi chấp nhận phá sản (khi không muốn bán thêm hoặc đã hết sạch cách)
   */
  public declareBankruptcy(playerId: string): void {
    const debt = this.state.pendingDebt;
    this.processBankruptcy(playerId, debt?.creditorId || null);
    this.state.pendingDebt = null;
  }

  /**
   * Tống vào trại giam (ô 10)
   */
  public sendToJail(playerId: string, reason: string): void {
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player) return;

    player.position = 10;
    player.inJail = true;
    player.jailTurns = this.settings.maxJailTurns;
    this.state.isDouble = false;
    this.state.doubleStreak = 0;

    this.events.emit('jail-entered', {
      playerId: player.id,
      turns: this.settings.maxJailTurns,
      reason,
    });
  }

  /**
   * Nộp tiền bảo lãnh ra tù (50K theo rules-v2)
   */
  public payJailBail(playerId: string): boolean {
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player || !player.inJail) return false;

    if (player.money < this.settings.jailBailPrice) {
      return false;
    }

    player.money -= this.settings.jailBailPrice;
    player.inJail = false;
    player.jailTurns = 0;

    this.addLog(`${player.name} nộp ${(this.settings.jailBailPrice / 1000).toLocaleString('vi-VN')}K₫ tiền bảo lãnh để ra tù.`);
    this.events.emit('jail-exited', { playerId: player.id, method: 'BAIL' });
    return true;
  }

  /**
   * Dùng thẻ miễn phạt tù
   */
  public useJailFreeCard(playerId: string): boolean {
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player || !player.inJail || player.jailFreeCards <= 0) return false;

    player.jailFreeCards -= 1;
    player.inJail = false;
    player.jailTurns = 0;

    this.addLog(`${player.name} dùng Thẻ Miễn Phạt Tù để ra khỏi trại giam tự do!`);
    this.events.emit('jail-exited', { playerId: player.id, method: 'CARD' });
    return true;
  }

  /**
   * Kích hoạt thẻ bài Cơ Hội / Khí Vận
   */
  public applyCardEffect(card: ChanceCard): void {
    const activePlayer = this.getActivePlayer();
    this.events.emit('card-applied', { playerId: activePlayer.id, card });

    switch (card.type) {
      case 'CASH_GAIN':
        if (card.amount) {
          activePlayer.money += card.amount;
          this.addLog(`${activePlayer.name} nhận được ${(card.amount / 1000).toLocaleString('vi-VN')}K₫ từ thẻ bài.`);
        }
        this.completeAction();
        break;

      case 'CASH_LOSS':
        if (card.amount) {
          if (activePlayer.money >= card.amount) {
            activePlayer.money -= card.amount;
            this.addLog(`${activePlayer.name} bị trừ ${(card.amount / 1000).toLocaleString('vi-VN')}K₫ do thẻ bài.`);
            this.completeAction();
          } else {
            this.handleDebt(activePlayer, null, card.amount, 'CARD');
          }
        }
        break;

      case 'TELEPORT':
        if (card.targetTileId !== undefined) {
          this.addLog(`${activePlayer.name} dịch chuyển tức thời tới ô [${card.targetTileId}].`);
          this.movePlayer(activePlayer.id, 0, true, card.targetTileId);
        }
        break;

      case 'JAIL_FREE':
        activePlayer.jailFreeCards += 1;
        this.addLog(`${activePlayer.name} cất Thẻ Miễn Phạt Tù vào hành trang.`);
        this.completeAction();
        break;

      case 'PAY_EACH_PLAYER':
        if (card.amount) {
          const others = this.state.players.filter((p) => p.id !== activePlayer.id && !p.bankrupt);
          const totalCost = card.amount * others.length;
          if (activePlayer.money >= totalCost) {
            activePlayer.money -= totalCost;
            others.forEach((o) => (o.money += card.amount!));
            this.addLog(`${activePlayer.name} chia quà mỗi người chơi ${(card.amount / 1000).toLocaleString('vi-VN')}K₫.`);
            this.completeAction();
          } else {
            this.handleDebt(activePlayer, null, totalCost, 'CARD');
          }
        }
        break;
    }

    this.state.currentCard = null;
  }

  /**
   * Xử lý phá sản: Toàn bộ đất trả về cho ngân hàng
   */
  public processBankruptcy(debtorId: string, creditorId: string | null): void {
    const debtor = this.state.players.find((p) => p.id === debtorId);
    if (!debtor) return;

    debtor.bankrupt = true;
    const debtorCash = debtor.money;
    debtor.money = 0;

    const creditor = creditorId ? this.state.players.find((p) => p.id === creditorId) : null;
    if (creditor && debtorCash > 0) {
      creditor.money += debtorCash;
    }

    // Luật rules-v2: Toàn bộ đất trả về cho Ngân Hàng (trở thành ô trống không chủ)
    this.state.tiles.forEach((t) => {
      if (t.ownerId === debtor.id) {
        t.ownerId = null;
        t.houseCount = 0;
        t.hasLandmark = false;
        t.isMortgaged = false;
        t.investmentCost = t.price || 0;
      }
    });

    debtor.properties = [];
    this.addLog(`❌ ${debtor.name} chính thức phá sản! Toàn bộ bất động sản được trả về cho Ngân Hàng.`);
    this.events.emit('player-bankrupt', { playerId: debtor.id, creditorId });

    if (this.checkAndApplyVictory()) return;

    this.completeAction();
  }

  /**
   * TÍNH TỔNG TÀI SẢN (Net Worth) CỦA NGƯỜI CHƠI
   */
  public calculateNetWorth(player: Player): number {
    let total = player.money;
    this.state.tiles.forEach((t) => {
      if (t.ownerId === player.id) {
        if (t.isMortgaged) {
          total += Math.round((t.price || 0) * 0.5);
        } else {
          total += t.investmentCost || this.getInvestmentCost(t);
        }
      }
    });
    return total;
  }

  /**
   * Lưu lại ảnh chụp tổng tài sản của từng người chơi theo vòng (để vẽ biểu đồ kết thúc ván)
   */
  public recordNetWorthSnapshot(): void {
    if (!this.state.netWorthHistory) {
      this.state.netWorthHistory = {};
    }
    this.state.players.forEach((p) => {
      const worth = this.calculateNetWorth(p);
      if (!this.state.netWorthHistory![p.id]) {
        this.state.netWorthHistory![p.id] = [];
      }
      this.state.netWorthHistory![p.id].push(worth);
    });
  }

  /**
   * KIỂM TRA 5 ĐIỀU KIỆN THẮNG THEO docs/rules-v2.md:
   * 1. Mọi đối thủ phá sản (BANKRUPTCY)
   * 2. Độc quyền 3 nhóm màu (TRIPLE_MONOPOLY)
   * 3. Độc quyền trọn 1 cạnh bàn cờ (LINE_MONOPOLY)
   * 4. Độc quyền 4 ga giao thông (TRANSPORT_MONOPOLY)
   * 5. Hết 25 vòng: ai có tổng tài sản cao nhất thì thắng (TIMEOUT_NET_WORTH)
   */
  public checkVictoryConditions(): {
    winner: Player;
    victoryType: VictoryType;
    reason: string;
  } | null {
    const activePlayers = this.state.players.filter((p) => !p.bankrupt);
    if (activePlayers.length === 0) return null;

    // 1. Phá sản: Chỉ còn 1 người duy nhất
    if (activePlayers.length === 1) {
      const winner = activePlayers[0];
      return {
        winner,
        victoryType: 'BANKRUPTCY',
        reason: 'Toàn bộ đối thủ đã phá sản!',
      };
    }

    // 1b. Người chơi thật phá sản: Trận đấu kết thúc ngay lập tức (không để bot chơi tiếp vô hạn)
    const humanPlayer = this.state.players.find((p) => !p.isBot);
    if (humanPlayer && humanPlayer.bankrupt) {
      const sortedActive = [...activePlayers].sort(
        (a, b) => this.calculateNetWorth(b) - this.calculateNetWorth(a)
      );
      const winner = sortedActive[0] || humanPlayer;
      return {
        winner,
        victoryType: 'BANKRUPTCY',
        reason: `${humanPlayer.name} đã phá sản! Trận đấu kết thúc.`,
      };
    }

    const colorGroupList: ColorGroup[] = [
      'BROWN',
      'LIGHT_BLUE',
      'PINK',
      'ORANGE',
      'RED',
      'YELLOW',
      'GREEN',
      'DARK_BLUE',
    ];

    for (const player of activePlayers) {
      // 2. Độc quyền 3 nhóm màu
      let ownedMonopolies = 0;
      for (const group of colorGroupList) {
        if (this.checkColorMonopoly(group, player.id)) {
          ownedMonopolies += 1;
        }
      }
      if (ownedMonopolies >= 3) {
        return {
          winner: player,
          victoryType: 'TRIPLE_MONOPOLY',
          reason: `${player.name} xuất sắc độc quyền 3 nhóm màu đất trên toàn quốc!`,
        };
      }

      // 3. Độc quyền trọn 1 cạnh bàn cờ
      const lines = [LINE_TILES.SOUTH, LINE_TILES.WEST, LINE_TILES.NORTH, LINE_TILES.EAST];
      const lineNames = ['Cạnh Nam (Miền Tây)', 'Cạnh Tây (Tây Nguyên)', 'Cạnh Bắc (Miền Trung & Miền Núi)', 'Cạnh Đông (Đồng Bằng & Hai Đô Thị)'];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const ownsWholeLine = line.every((tileId) => this.state.tiles[tileId].ownerId === player.id);
        if (ownsWholeLine) {
          return {
            winner: player,
            victoryType: 'LINE_MONOPOLY',
            reason: `${player.name} thâu tóm toàn bộ bất động sản trên ${lineNames[i]}!`,
          };
        }
      }

      // 4. Độc quyền 4 ga giao thông
      const ownsAllTransports = TRANSPORT_TILES.every(
        (tileId) => this.state.tiles[tileId].ownerId === player.id
      );
      if (ownsAllTransports) {
        return {
          winner: player,
          victoryType: 'TRANSPORT_MONOPOLY',
          reason: `${player.name} làm chủ trọn vẹn cả 4 tuyến giao thông huyết mạch Bắc - Nam!`,
        };
      }
    }

    // 5. Hết 25 vòng: ai có tổng tài sản cao nhất thì thắng
    if (this.state.roundCount > this.settings.maxRounds) {
      let bestPlayer = activePlayers[0];
      let maxWorth = this.calculateNetWorth(bestPlayer);

      for (let i = 1; i < activePlayers.length; i++) {
        const worth = this.calculateNetWorth(activePlayers[i]);
        if (worth > maxWorth) {
          maxWorth = worth;
          bestPlayer = activePlayers[i];
        }
      }

      return {
        winner: bestPlayer,
        victoryType: 'TIMEOUT_NET_WORTH',
        reason: `${bestPlayer.name} đứng đầu với tổng tài sản ${(maxWorth / 1000).toLocaleString('vi-VN')}K₫ sau 25 vòng đấu kịch tính!`,
      };
    }

    return null;
  }

  /**
   * Tính bảng xếp hạng 4 người chơi theo Tổng tài sản (tiền + giá đất + giá nhà)
   */
  public getPlayerRankings(): PlayerRankingItem[] {
    const list: PlayerRankingItem[] = this.state.players.map((p) => {
      const cash = p.money;
      let propertyValue = 0;
      let propertyCount = 0;
      this.state.tiles.forEach((t) => {
        if (t.ownerId === p.id) {
          propertyCount += 1;
          if (t.isMortgaged) {
            propertyValue += Math.round((t.price || 0) * 0.5);
          } else {
            propertyValue += t.investmentCost || this.getInvestmentCost(t);
          }
        }
      });
      const netWorth = p.bankrupt ? 0 : cash + propertyValue;
      return {
        player: p,
        rank: 1,
        netWorth,
        cash,
        propertyValue,
        propertyCount,
        isBankrupt: p.bankrupt,
      };
    });

    // Sắp xếp: người chưa phá sản có netWorth cao đứng trước, người phá sản xếp sau cùng
    list.sort((a, b) => {
      if (a.isBankrupt !== b.isBankrupt) return a.isBankrupt ? 1 : -1;
      return b.netWorth - a.netWorth;
    });

    // Gán thứ hạng
    list.forEach((item, idx) => {
      item.rank = idx + 1;
    });

    return list;
  }

  /**
   * Kiểm tra và công bố chiến thắng nếu có
   */
  public checkAndApplyVictory(): boolean {
    const vic = this.checkVictoryConditions();
    if (vic) {
      this.state.winner = vic.winner;
      this.state.victoryType = vic.victoryType;
      this.state.victoryReason = vic.reason;
      this.state.gamePhase = 'GAME_OVER';

      this.addLog(`👑 CHIẾN THẮNG: ${VICTORY_NAMES[vic.victoryType]}`);
      this.addLog(`🏆 ${vic.reason}`);

      this.events.emit('game-over', {
        winner: vic.winner,
        rounds: Math.min(this.settings.maxRounds, this.state.roundCount),
        victoryType: vic.victoryType,
        reason: vic.reason,
      });
      return true;
    }
    return false;
  }

  public completeAction(): void {
    this.cancelWatchdog();
    if (this.state.gamePhase === 'GAME_OVER') return;

    if (this.checkAndApplyVictory()) return;

    this.state.gamePhase = 'ACTION_COMPLETED';
    const activePlayer = this.getActivePlayer();

    if (activePlayer.bankrupt) {
      this.endTurn();
      return;
    }

    // Nếu vừa đổ đôi và không ở trong tù và chưa quá 3 lần:
    if (this.state.isDouble && !activePlayer.inJail && this.state.doubleStreak < 3) {
      this.addLog(`🎲 ${activePlayer.name} vừa đổ đôi [${this.state.dice[0]}, ${this.state.dice[1]}], được tiếp tục đổ thêm một lượt nữa!`);
      this.state.gamePhase = 'AWAIT_ROLL';
      this.events.emit('double-roll-bonus', { playerId: activePlayer.id });
      this.events.emit('turn-ended', {
        activePlayerId: activePlayer.id,
        nextPlayerId: activePlayer.id,
        round: this.state.roundCount,
      });
    } else {
      this.endTurn();
    }
  }

  public armWatchdog(): void {
    this.cancelWatchdog();
    const currentPhase = this.state.gamePhase as string;
    const isInteractive =
      currentPhase === 'AWAIT_ROLL' ||
      currentPhase === 'AWAIT_DECISION' ||
      currentPhase === 'AWAIT_TAKEOVER' ||
      currentPhase === 'DEBT_RELIEF' ||
      currentPhase === 'CARD_DRAWN' ||
      currentPhase === 'GAME_OVER';

    if (!isInteractive) {
      this.watchdogTimer = setTimeout(() => {
        if ((this.state.gamePhase as string) === currentPhase && this.state.gamePhase !== 'GAME_OVER') {
          console.warn(`[WATCHDOG AN TOÀN] Trạng thái ${currentPhase} đứng yên quá 8s! Tự động phục hồi và chuyển tiếp.`);
          this.addLog(`⚠️ [Cơ chế an toàn] Tự động phục hồi ván cờ sau trạng thái ${currentPhase}.`);
          this.completeAction();
        }
      }, 8000);
    }
  }

  public cancelWatchdog(): void {
    if (this.watchdogTimer) {
      clearTimeout(this.watchdogTimer);
      this.watchdogTimer = null;
    }
  }

  public endTurn(): void {
    this.cancelWatchdog();
    if (this.state.gamePhase === 'GAME_OVER') return;

    if (this.checkAndApplyVictory()) return;

    const prevPlayer = this.getActivePlayer();

    // 1. Nếu người chơi hiện tại vừa đổ đôi hợp lệ, chưa vào tù và streak < 3: giữ lượt đổ tiếp cho người này
    if (this.state.isDouble && !prevPlayer.inJail && this.state.doubleStreak < 3 && !prevPlayer.bankrupt) {
      this.state.gamePhase = 'AWAIT_ROLL';
      return;
    }

    let nextIndex = (this.state.activePlayerIndex + 1) % this.state.players.length;

    // Tìm người chơi tiếp theo chưa bị phá sản
    while (this.state.players[nextIndex].bankrupt) {
      nextIndex = (nextIndex + 1) % this.state.players.length;
    }

    if (nextIndex <= this.state.activePlayerIndex) {
      this.state.roundCount += 1;
      this.recordNetWorthSnapshot();
      // Kiểm tra hết vòng 25
      if (this.state.roundCount > this.settings.maxRounds) {
        this.checkAndApplyVictory();
        return;
      }
    }

    this.state.activePlayerIndex = nextIndex;
    this.state.turnCount += 1;
    this.state.isDouble = false;
    this.state.doubleStreak = 0;
    this.state.gamePhase = 'AWAIT_ROLL';
    this.state.currentCard = null;

    const nextPlayer = this.getActivePlayer();
    this.events.emit('turn-ended', {
      activePlayerId: prevPlayer.id,
      nextPlayerId: nextPlayer.id,
      round: this.state.roundCount,
    });
  }

  public addLog(msg: string): void {
    this.state.eventLogs.push(msg);
  }
}

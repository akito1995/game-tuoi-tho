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
  PlayerSlotConfig,
} from './types';
import { BOARD_40_TILES } from './boardData';
import { CHANCE_CARDS, FATE_CARDS } from './chanceCards';
import { GameEventBus } from './events';
import { calculateTileRent, getNextUpgradeCost } from './rulesV2Financials';

export class GameEngine {
  public state: GameState;
  public settings: GameSettings;
  public events: GameEventBus;

  constructor(
    playersInput?: PlayerSlotConfig[],
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
          botDifficulty: p.botDifficulty || 'MEDIUM',
          jailFreeCards: 0,
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
            jailFreeCards: 0,
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
            jailFreeCards: 0,
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
            jailFreeCards: 0,
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
            jailFreeCards: 0,
          },
        ];

    this.state = {
      players: initialPlayers,
      activePlayerIndex: 0,
      dice: [1, 1],
      isDouble: false,
      doubleStreak: 0,
      gamePhase: 'AWAIT_ROLL',
      tiles: JSON.parse(JSON.stringify(BOARD_40_TILES)),
      currentCard: null,
      winner: null,
      eventLogs: ['Trò chơi Cờ Tỷ Phú v2 - Hành trình xuyên Việt bắt đầu!'],
      turnCount: 1,
      roundCount: 1,
    };
  }

  public getActivePlayer(): Player {
    return this.state.players[this.state.activePlayerIndex];
  }

  public getTile(id: number): Tile {
    return this.state.tiles[id];
  }

  public checkColorMonopoly(colorGroup?: ColorGroup, ownerId?: string | null): boolean {
    if (!colorGroup || !ownerId) return false;
    const groupTiles = this.state.tiles.filter((t) => t.colorGroup === colorGroup);
    if (groupTiles.length === 0) return false;
    return groupTiles.every((t) => t.ownerId === ownerId);
  }

  public calculateRent(tile: Tile, diceSum?: number): number {
    return calculateTileRent(
      tile,
      this.state.tiles,
      diceSum || (this.state.dice ? this.state.dice[0] + this.state.dice[1] : 7)
    );
  }

  /**
   * Đổ xúc xắc và giải quyết bước đi
   */
  public rollDice(overrideDice?: [number, number]): {
    dice: [number, number];
    sum: number;
    isDouble: boolean;
  } {
    const activePlayer = this.getActivePlayer();
    if (activePlayer.bankrupt || this.state.gamePhase === 'GAME_OVER') {
      throw new Error('Không thể đổ xúc xắc khi ván chơi đã kết thúc hoặc người chơi phá sản.');
    }

    const d1 = overrideDice ? overrideDice[0] : Math.floor(Math.random() * 6) + 1;
    const d2 = overrideDice ? overrideDice[1] : Math.floor(Math.random() * 6) + 1;
    const sum = d1 + d2;
    const isDouble = d1 === d2;

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
        isDouble ? ' - ĐỔ ĐÔI!' : ''
      }`
    );

    // 1. Xử lý người chơi đang trong trại giam (ô 10)
    if (activePlayer.inJail) {
      if (isDouble) {
        activePlayer.inJail = false;
        activePlayer.jailTurns = 0;
        this.state.doubleStreak = 0;
        this.addLog(`${activePlayer.name} đổ đôi thành công và được thả tự do!`);
        this.events.emit('jail-exited', { playerId: activePlayer.id, method: 'DOUBLE' });
      } else {
        activePlayer.jailTurns -= 1;
        if (activePlayer.jailTurns <= 0) {
          // Hết hạn giam, phải nộp tiền phạt 100k
          if (activePlayer.money >= this.settings.jailBailPrice) {
            activePlayer.money -= this.settings.jailBailPrice;
            activePlayer.inJail = false;
            activePlayer.jailTurns = 0;
            this.addLog(
              `${activePlayer.name} hết thời hạn tạm giam, nộp phạt ${this.settings.jailBailPrice.toLocaleString(
                'vi-VN'
              )}đ để ra tù.`
            );
            this.events.emit('jail-exited', { playerId: activePlayer.id, method: 'BAIL' });
          } else {
            this.addLog(`${activePlayer.name} không đủ tiền nộp phạt tại trại giam và bị phá sản!`);
            this.processBankruptcy(activePlayer.id, null);
            return { dice: [d1, d2], sum, isDouble };
          }
        } else {
          this.addLog(
            `${activePlayer.name} không đổ được đôi, tiếp tục ở lại trại giam (còn ${activePlayer.jailTurns} lượt).`
          );
          this.endTurn();
          return { dice: [d1, d2], sum, isDouble };
        }
      }
    }

    // 2. Kiểm tra đi bão 3 lần liên tiếp đổ đôi
    if (isDouble && this.state.doubleStreak >= 3) {
      this.addLog(`${activePlayer.name} đổ đôi 3 lần liên tiếp! Bị phạt đi bão và tống thẳng vào Trại Giam!`);
      this.sendToJail(activePlayer.id, 'Đổ đôi 3 lần liên tiếp');
      this.endTurn();
      return { dice: [d1, d2], sum, isDouble };
    }

    // 3. Di chuyển người chơi trên bàn cờ 40 ô
    this.movePlayer(activePlayer.id, sum);

    return { dice: [d1, d2], sum, isDouble };
  }

  /**
   * Di chuyển quân cờ theo số bước (hoặc dịch chuyển tức thời)
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

    if (isDirectTeleport && teleportTarget !== undefined) {
      newPos = teleportTarget;
      // Nếu dịch chuyển vượt qua ô 0 (trừ trường hợp vào tù ô 10)
      if (newPos < oldPos && newPos !== 10) {
        passedGo = true;
      }
    } else {
      const rawPos = oldPos + steps;
      newPos = rawPos % this.settings.boardTileCount;
      if (rawPos >= this.settings.boardTileCount) {
        passedGo = true;
      }
    }

    if (passedGo) {
      player.money += this.settings.passGoReward;
      this.addLog(
        `${player.name} đi qua hoặc dừng tại Xuất Phát, nhận ${this.settings.passGoReward.toLocaleString(
          'vi-VN'
        )}đ tiền thưởng.`
      );
    }

    player.position = newPos;
    this.state.gamePhase = 'MOVING';

    this.events.emit('player-moved', {
      playerId: player.id,
      from: oldPos,
      to: newPos,
      passedGo,
      reward: passedGo ? this.settings.passGoReward : 0,
    });

    this.resolveTileLanding(player.id, newPos);
  }

  /**
   * Xử lý khi đáp chân xuống 1 trong 40 ô
   */
  public resolveTileLanding(playerId: string, tileId: number): void {
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player) return;

    const tile = this.state.tiles[tileId];
    this.addLog(`${player.name} dừng chân tại ô [${tileId}] ${tile.name}.`);
    this.events.emit('tile-landed', { playerId: player.id, tile });

    switch (tile.type) {
      case 'START':
      case 'REST':
        // Nghỉ ngơi an toàn
        this.completeAction();
        break;

      case 'JAIL':
        // Thăm tù bình thường
        this.addLog(`${player.name} ghé thăm Trại Giam an toàn.`);
        this.completeAction();
        break;

      case 'GO_TO_JAIL':
        // Ô 30: Bị bắt vào trại giam (ô 10)
        this.addLog(`${player.name} bước vào ô Vào Tù! Bị áp giải ngay về Trại Giam.`);
        this.sendToJail(player.id, 'Dừng chân tại ô Vào Tù');
        this.endTurn();
        break;

      case 'TAX':
        // Ô Thuế (ô 4: 200k, ô 38: 100k)
        const tax = tile.taxAmount || 100000;
        this.payTax(player.id, tax, tile);
        break;

      case 'CHANCE':
      case 'FATE':
        // Rút thẻ bài
        const deck = tile.type === 'CHANCE' ? CHANCE_CARDS : FATE_CARDS;
        const card = deck[Math.floor(Math.random() * deck.length)];
        this.state.currentCard = card;
        this.state.gamePhase = 'CARD_DRAWN';
        this.addLog(`${player.name} rút thẻ ${tile.type === 'CHANCE' ? 'Cơ Hội' : 'Khí Vận'}: "${card.title}"`);
        this.events.emit('card-drawn', { playerId: player.id, card, deck: tile.type });
        break;

      case 'PROPERTY':
      case 'TRANSPORT':
      case 'UTILITY':
        if (!tile.ownerId) {
          // Chưa có chủ, chờ quyết định mua
          this.state.gamePhase = 'AWAIT_DECISION';
        } else if (tile.ownerId === player.id) {
          // Đất của mình, có thể nâng cấp nếu là PROPERTY
          if (tile.type === 'PROPERTY' && !tile.hasLandmark) {
            this.state.gamePhase = 'AWAIT_DECISION';
          } else {
            this.completeAction();
          }
        } else {
          // Đất của đối thủ, phải trả tiền thuê!
          const rent = this.calculateRent(tile);
          this.payRent(player.id, tile.ownerId, rent, tile);
        }
        break;
    }
  }

  /**
   * Mua đất chưa có chủ
   */
  public buyProperty(playerId: string, tileId?: number): boolean {
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player) return false;

    const targetId = tileId !== undefined ? tileId : player.position;
    const tile = this.state.tiles[targetId];

    if (!tile || tile.ownerId != null || !tile.price) {
      return false;
    }

    if (player.money < tile.price) {
      this.addLog(`${player.name} không đủ tiền mua ${tile.name} (giá: ${tile.price.toLocaleString('vi-VN')}đ).`);
      return false;
    }

    player.money -= tile.price;
    tile.ownerId = player.id;
    if (!player.properties.includes(tile.id)) {
      player.properties.push(tile.id);
    }

    this.addLog(
      `${player.name} mua thành công bất động sản ${tile.name} với giá ${tile.price.toLocaleString('vi-VN')}đ.`
    );

    this.events.emit('property-bought', {
      playerId: player.id,
      tile,
      price: tile.price,
    });

    if (tile.colorGroup && this.checkColorMonopoly(tile.colorGroup, player.id)) {
      (this.events as any).emit('color-group-completed', {
        playerId: player.id,
        colorGroup: tile.colorGroup,
      });
      this.addLog(`🌟 ${player.name} đã thâu tóm TRỌN BỘ NHÓM MÀU ${tile.colorGroup}! Tiền thuê được nhân đôi!`);
    }

    this.completeAction();
    return true;
  }

  /**
   * Nâng cấp nhà (Cấp 1 -> Cấp 2 -> Cấp 3 -> Landmark)
   */
  public upgradeProperty(playerId: string, tileId: number): boolean {
    const player = this.state.players.find((p) => p.id === playerId);
    const tile = this.state.tiles[tileId];

    if (!player || !tile || tile.ownerId !== player.id || tile.type !== 'PROPERTY') {
      return false;
    }

    if (tile.hasLandmark) {
      return false; // Đã đạt cấp tối đa
    }

    const cost = getNextUpgradeCost(tile);
    if (player.money < cost) {
      this.addLog(`${player.name} không đủ tiền xây nâng cấp tại ${tile.name}.`);
      return false;
    }

    player.money -= cost;
    const currentCount = tile.houseCount || 0;

    if (currentCount < 4) {
      tile.houseCount = currentCount + 1;
      this.addLog(
        `${player.name} xây thêm nhà cấp ${tile.houseCount} tại ${tile.name} (chi phí: ${cost.toLocaleString('vi-VN')}đ).`
      );
      this.events.emit('property-upgraded', {
        playerId: player.id,
        tile,
        tier: tile.houseCount,
        cost,
      });
    } else {
      tile.hasLandmark = true;
      this.addLog(
        `🏆 ${player.name} khánh thành Công trình biểu tượng Landmark "${tile.landmarkName || tile.name}"!`
      );
      this.events.emit('property-upgraded', {
        playerId: player.id,
        tile,
        tier: 5,
        cost,
      });
    }

    this.completeAction();
    return true;
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
      this.addLog(
        `${debtor.name} trả ${amount.toLocaleString('vi-VN')}đ tiền thuê đất tại ${tile.name} cho ${creditor.name}.`
      );
      this.events.emit('rent-paid', {
        debtorId: debtor.id,
        creditorId: creditor.id,
        amount,
        tile,
      });
      this.completeAction();
    } else {
      // Phá sản do không đủ trả tiền thuê
      this.addLog(
        `${debtor.name} không đủ tiền trả ${amount.toLocaleString('vi-VN')}đ tiền thuê cho ${creditor.name} và bị phá sản!`
      );
      this.processBankruptcy(debtor.id, creditor.id);
    }
  }

  /**
   * Nộp tiền thuế
   */
  public payTax(playerId: string, amount: number, tile: Tile): void {
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player) return;

    if (player.money >= amount) {
      player.money -= amount;
      this.addLog(`${player.name} nộp ${amount.toLocaleString('vi-VN')}đ ${tile.name}.`);
      this.events.emit('tax-paid', { playerId: player.id, amount, tile });
      this.completeAction();
    } else {
      this.addLog(`${player.name} không đủ tiền nộp thuế và bị phá sản!`);
      this.processBankruptcy(player.id, null);
    }
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
   * Nộp tiền bảo lãnh ra tù chủ động
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

    this.addLog(`${player.name} chủ động nộp phạt ${this.settings.jailBailPrice.toLocaleString('vi-VN')}đ để ra tù.`);
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
   * Kích hoạt hiệu ứng thẻ bài Cơ Hội / Khí Vận
   */
  public applyCardEffect(card: ChanceCard): void {
    const activePlayer = this.getActivePlayer();
    this.events.emit('card-applied', { playerId: activePlayer.id, card });

    switch (card.type) {
      case 'CASH_GAIN':
        if (card.amount) {
          activePlayer.money += card.amount;
          this.addLog(`${activePlayer.name} nhận được ${card.amount.toLocaleString('vi-VN')}đ từ thẻ bài.`);
        }
        this.completeAction();
        break;

      case 'CASH_LOSS':
        if (card.amount) {
          if (activePlayer.money >= card.amount) {
            activePlayer.money -= card.amount;
            this.addLog(`${activePlayer.name} bị trừ ${card.amount.toLocaleString('vi-VN')}đ do thẻ bài.`);
            this.completeAction();
          } else {
            this.addLog(`${activePlayer.name} không đủ tiền chi trả theo thẻ bài và bị phá sản!`);
            this.processBankruptcy(activePlayer.id, null);
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
            this.addLog(`${activePlayer.name} chia quà mỗi người chơi ${card.amount.toLocaleString('vi-VN')}đ.`);
            this.completeAction();
          } else {
            this.addLog(`${activePlayer.name} không đủ tiền chia quà cho mọi người và bị phá sản!`);
            this.processBankruptcy(activePlayer.id, null);
          }
        }
        break;
    }

    this.state.currentCard = null;
  }

  /**
   * Xử lý khi một người chơi phá sản
   */
  public processBankruptcy(debtorId: string, creditorId: string | null): void {
    const debtor = this.state.players.find((p) => p.id === debtorId);
    if (!debtor) return;

    debtor.bankrupt = true;
    const debtorCash = debtor.money;
    debtor.money = 0;

    const creditor = creditorId ? this.state.players.find((p) => p.id === creditorId) : null;

    if (creditor) {
      creditor.money += debtorCash;
      creditor.properties.push(...debtor.properties);
      // Chuyển quyền sở hữu các ô đất cho chủ nợ
      this.state.tiles.forEach((t) => {
        if (t.ownerId === debtor.id) {
          t.ownerId = creditor.id;
        }
      });
    } else {
      // Trả lại toàn bộ đất cho Ngân hàng
      this.state.tiles.forEach((t) => {
        if (t.ownerId === debtor.id) {
          t.ownerId = null;
          t.houseCount = 0;
          t.hasLandmark = false;
          t.isMortgaged = false;
        }
      });
    }

    debtor.properties = [];
    this.addLog(`❌ ${debtor.name} chính thức phá sản và rời khỏi cuộc chơi!`);
    this.events.emit('player-bankrupt', { playerId: debtor.id, creditorId });

    // Kiểm tra kết thúc ván
    const activePlayers = this.state.players.filter((p) => !p.bankrupt);
    if (activePlayers.length <= 1) {
      this.state.winner = activePlayers[0] || null;
      this.state.gamePhase = 'GAME_OVER';
      this.addLog(`👑 Chúc mừng ${this.state.winner?.name} đã trở thành VUA ĐỊA ỐC Việt Nam!`);
      this.events.emit('game-over', {
        winner: this.state.winner!,
        rounds: this.state.roundCount,
      });
    } else {
      this.completeAction();
    }
  }

  /**
   * Kết thúc lượt hiện tại và chuyển sang người kế tiếp
   */
  /**
   * Máy trạng thái: Hoàn thành hành động trên ô và chuyển tiếp lượt.
   * Nếu vừa đổ đôi và không vào tù và streak < 3:
   *   Quay lại 'AWAIT_ROLL' (CHỜ_ĐỔ) cho chính người chơi đó tiếp tục tung xúc xắc!
   * Ngược lại:
   *   Chuyển lượt sang người kế tiếp (bỏ qua người phá sản).
   */
  public completeAction(): void {
    this.cancelWatchdog();
    if (this.state.gamePhase === 'GAME_OVER') return;

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

  private watchdogTimer: any = null;

  public armWatchdog(): void {
    this.cancelWatchdog();
    const active = this.getActivePlayer();
    // Tuyệt đối không can thiệp vào người chơi thật (Human) khi đang chờ quyết định
    if (!active.isBot) {
      return;
    }

    const currentPhase = this.state.gamePhase as string;
    // Chỉ giám sát khi đang ở các pha tự động của Bot/hệ thống (không chờ người chơi bấm nút)
    const isInteractive = currentPhase === 'AWAIT_ROLL' || currentPhase === 'AWAIT_DECISION' || currentPhase === 'CARD_DRAWN' || currentPhase === 'GAME_OVER';
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

    const prevPlayer = this.getActivePlayer();
    let nextIndex = (this.state.activePlayerIndex + 1) % this.state.players.length;

    // Tìm người chơi tiếp theo chưa bị phá sản
    while (this.state.players[nextIndex].bankrupt) {
      nextIndex = (nextIndex + 1) % this.state.players.length;
    }

    if (nextIndex <= this.state.activePlayerIndex) {
      this.state.roundCount += 1;
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

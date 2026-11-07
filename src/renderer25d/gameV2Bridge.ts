import { GameEngine } from '../game/engine';
import { GameEventBus, GameEventMap } from '../game/events';
import { Player, Tile, ChanceCard, CharacterId, VictoryType, PendingDebt, BotDifficulty, PlayerRankingItem } from '../game/types';
import { GAME_CONFIG } from '../game/gameConfig';
import {
  evaluateBotBuy,
  evaluateBotUpgrade,
  evaluateBotTakeover,
  executeBotDebtRelief,
  evaluateBotJailDecision,
} from '../game/botAI';
import { PlayerTokenData } from './characterRenderer';

export type GameSpeed = 1 | 2 | 4;

export interface AuctionState {
  tileId: number;
  tileName: string;
  tilePrice: number;
  currentBid: number;
  highestBidderId: string | null;
  highestBidderName: string | null;
  timeLeft: number;
}

export interface GameV2Listener {
  onStateChange: (state: GameV2State) => void;
  onDiceRollStart?: (payload: { playerId: string; dice: [number, number]; isDouble: boolean }) => void;
  onCardDrawn?: (card: ChanceCard) => void;
  onGameOver?: (winner: Player) => void;
}

export interface GameV2State {
  players: Player[];
  tiles: Tile[];
  activePlayer: Player;
  dice: [number, number];
  isDouble: boolean;
  gamePhase: string;
  currentCard: ChanceCard | null;
  piggyBank: number;
  winner: Player | null;
  victoryType: VictoryType | null;
  victoryReason: string | null;
  pendingDebt: PendingDebt | null;
  logs: string[];
  roundCount: number;
  turnCount: number;
  speed: GameSpeed;
  isAutoMatch: boolean;
  rankings: PlayerRankingItem[];
  netWorthHistory?: Record<string, number[]>;
  currentAuction?: AuctionState | null;
}

export class GameV2Bridge {
  public engine: GameEngine;
  public eventBus: GameEventBus;
  public speed: GameSpeed = 1;
  public isAutoMatch: boolean = false;
  public humanChar: CharacterId = 'be-ti';
  public botDifficulty: BotDifficulty = 'NORMAL';
  public initialMoney: number = 800_000;
  public auctionOnSkip: boolean = false;
  public currentAuction: AuctionState | null = null;
  public botActionsBuffer: string[] = [];

  private listeners: Set<(state: GameV2State) => void> = new Set();
  private botTimer: any = null;
  private auctionTimer: any = null;
  private isDestroyed: boolean = false;
  private isPausedByModal: boolean = false;

  constructor(
    playerCount: 2 | 3 | 4 = 4,
    allBots: boolean = false,
    speed: GameSpeed = 1,
    humanChar: CharacterId = 'be-ti',
    botDifficulty: BotDifficulty = 'NORMAL',
    initialMoney: number = 800_000,
    auctionOnSkip: boolean = false
  ) {
    this.speed = speed;
    this.isAutoMatch = allBots;
    this.humanChar = humanChar;
    this.botDifficulty = botDifficulty;
    this.initialMoney = initialMoney;
    this.auctionOnSkip = auctionOnSkip;
    this.eventBus = new GameEventBus();
    this.engine = this.createEngine(playerCount, allBots, humanChar, botDifficulty, initialMoney);
    this.setupInternalListeners();
  }

  private createEngine(
    playerCount: number,
    allBots: boolean,
    humanChar: CharacterId,
    botDifficulty: BotDifficulty,
    initialMoney: number = 800_000
  ): GameEngine {
    const allCharList: Array<{ name: string; character: CharacterId }> = [
      { name: 'Bé Tí', character: 'be-ti' },
      { name: 'Cô Hoa', character: 'co-hoa' },
      { name: 'Ông Bảy', character: 'ong-bay' },
      { name: 'Chị Mây', character: 'chi-may' },
    ];

    const chosen = allCharList.find((c) => c.character === humanChar) || allCharList[0];
    const others = allCharList.filter((c) => c.character !== chosen.character);
    const orderedChars = [chosen, ...others];

    const characters: Array<{
      id: string;
      name: string;
      character: CharacterId;
      isBot: boolean;
      botDifficulty?: BotDifficulty;
    }> = [
      {
        id: 'player-1',
        name: orderedChars[0].name,
        character: orderedChars[0].character,
        isBot: allBots ? true : false,
      },
      {
        id: 'player-2',
        name: `${orderedChars[1].name} 🤖`,
        character: orderedChars[1].character,
        isBot: true,
        botDifficulty,
      },
      {
        id: 'player-3',
        name: `${orderedChars[2].name} 🤖`,
        character: orderedChars[2].character,
        isBot: true,
        botDifficulty,
      },
      {
        id: 'player-4',
        name: `${orderedChars[3].name} 🤖`,
        character: orderedChars[3].character,
        isBot: true,
        botDifficulty,
      },
    ].slice(0, playerCount);

    return new GameEngine(characters, { initialMoney }, this.eventBus);
  }

  public resetGame(
    playerCount: 2 | 3 | 4 = 4,
    allBots: boolean = false,
    humanChar: CharacterId = this.humanChar,
    botDifficulty: BotDifficulty = this.botDifficulty,
    initialMoney: number = this.initialMoney,
    auctionOnSkip: boolean = this.auctionOnSkip
  ): void {
    if (this.botTimer) {
      clearTimeout(this.botTimer);
      this.botTimer = null;
    }
    if (this.auctionTimer) {
      clearInterval(this.auctionTimer);
      this.auctionTimer = null;
    }
    this.currentAuction = null;
    this.botActionsBuffer = [];
    this.isPausedByModal = false;
    this.isAutoMatch = allBots;
    this.humanChar = humanChar;
    this.botDifficulty = botDifficulty;
    this.initialMoney = initialMoney;
    this.auctionOnSkip = auctionOnSkip;
    this.engine = this.createEngine(playerCount, allBots, humanChar, botDifficulty, initialMoney);
    this.setupInternalListeners();
    this.notify();
    this.checkAutoBotTurn();
  }

  private setupInternalListeners(): void {
    this.eventBus.on('turn-ended', () => {
      this.notify();
      this.checkAutoBotTurn();
    });

    this.eventBus.on('double-roll-bonus', () => {
      this.notify();
      this.checkAutoBotTurn();
    });

    this.eventBus.on('player-bankrupt', () => {
      this.notify();
    });

    this.eventBus.on('game-over', () => {
      this.notify();
    });

    this.engine.events.on('rent-paid', (payload) => {
      const payer = this.engine.state.players.find((p) => p.id === payload.debtorId);
      const owner = this.engine.state.players.find((p) => p.id === payload.creditorId);
      const human = this.engine.state.players.find((p) => !p.isBot);
      if (payer && payer.isBot) {
        if (owner && human && owner.id === human.id) {
          this.botActionsBuffer.push(`${payer.name} trả bạn ${Math.round(payload.amount / 1000)}K tiền thuê`);
        } else if (owner) {
          this.botActionsBuffer.push(`${payer.name} trả ${owner.name} ${Math.round(payload.amount / 1000)}K`);
        }
      }
    });

    this.engine.events.on('jail-entered', (payload) => {
      const p = this.engine.state.players.find((x) => x.id === payload.playerId);
      if (p && p.isBot) {
        this.botActionsBuffer.push(`${p.name} vào tù`);
      }
    });
  }

  public pauseBot(): void {
    this.isPausedByModal = true;
    if (this.botTimer) {
      clearTimeout(this.botTimer);
      this.botTimer = null;
    }
  }

  public resumeBot(): void {
    this.isPausedByModal = false;
    if (!this.isDestroyed && !this.currentAuction) {
      this.checkAutoBotTurn();
    }
  }

  public getAndClearBotActions(): string[] {
    const actions = [...this.botActionsBuffer];
    this.botActionsBuffer = [];
    return actions;
  }

  public subscribe(cb: (state: GameV2State) => void): () => void {
    this.listeners.add(cb);
    cb(this.getSnapshot());
    return () => this.listeners.delete(cb);
  }

  public notify(): void {
    if (this.isDestroyed) return;
    const snap = this.getSnapshot();
    this.listeners.forEach((cb) => cb(snap));
  }

  public getSnapshot(): GameV2State {
    return {
      players: this.engine.state.players.map((p) => ({ ...p, properties: [...p.properties] })),
      tiles: this.engine.state.tiles.map((t) => ({ ...t })),
      activePlayer: { ...this.engine.getActivePlayer(), properties: [...this.engine.getActivePlayer().properties] },
      dice: [...this.engine.state.dice] as [number, number],
      isDouble: this.engine.state.isDouble,
      gamePhase: this.engine.state.gamePhase,
      currentCard: this.engine.state.currentCard ? { ...this.engine.state.currentCard } : null,
      piggyBank: this.engine.state.piggyBank,
      winner: this.engine.state.winner ? { ...this.engine.state.winner } : null,
      victoryType: this.engine.state.victoryType,
      victoryReason: this.engine.state.victoryReason,
      pendingDebt: this.engine.state.pendingDebt ? { ...this.engine.state.pendingDebt } : null,
      logs: [...this.engine.state.eventLogs],
      roundCount: this.engine.state.roundCount,
      turnCount: this.engine.state.turnCount,
      speed: this.speed,
      isAutoMatch: this.isAutoMatch,
      rankings: this.engine.getPlayerRankings(),
      netWorthHistory: this.engine.state.netWorthHistory
        ? JSON.parse(JSON.stringify(this.engine.state.netWorthHistory))
        : undefined,
      currentAuction: this.currentAuction ? { ...this.currentAuction } : null,
    };
  }

  public getPlayerTokenData(): PlayerTokenData[] {
    const active = this.engine.getActivePlayer();
    return this.engine.state.players.map((p) => {
      let colorHex = 0xe5484d;
      if (p.character === 'co-hoa') colorHex = 0x19b8a6;
      else if (p.character === 'ong-bay') colorHex = 0xf5b83d;
      else if (p.character === 'chi-may') colorHex = 0x8b6cf0;

      return {
        id: p.id,
        name: p.name,
        characterKey: p.character,
        colorHex,
        position: p.position,
        isCurrentTurn: p.id === active.id && !p.bankrupt,
      };
    });
  }

  public setSpeed(speed: GameSpeed): void {
    this.speed = speed;
    this.notify();
  }

  public setAutoMatch(auto: boolean): void {
    this.isAutoMatch = auto;
    this.notify();
    if (auto) {
      this.checkAutoBotTurn();
    }
  }

  public rollDice(): { dice: [number, number]; isDouble: boolean } {
    const phase = this.engine.state.gamePhase;
    if (
      phase === 'AWAIT_DECISION' ||
      phase === 'CARD_DRAWN' ||
      phase === 'AWAIT_TAKEOVER' ||
      phase === 'DEBT_RELIEF'
    ) {
      return { dice: this.engine.state.dice, isDouble: this.engine.state.isDouble };
    }
    const res = this.engine.rollDice();
    this.notify();
    return { dice: res.dice, isDouble: res.isDouble };
  }

  public rollWithSkill(skill: 'SHORT' | 'LONG' | 'DOUBLE'): { dice: [number, number]; isDouble: boolean } {
    const phase = this.engine.state.gamePhase;
    if (
      phase === 'AWAIT_DECISION' ||
      phase === 'CARD_DRAWN' ||
      phase === 'AWAIT_TAKEOVER' ||
      phase === 'DEBT_RELIEF'
    ) {
      return { dice: this.engine.state.dice, isDouble: this.engine.state.isDouble };
    }
    let dice: [number, number] = [1, 1];
    if (skill === 'SHORT') {
      const choices: Array<[number, number]> = [
        [1, 1], [1, 2], [2, 1], [1, 3], [3, 1], [2, 2]
      ];
      dice = choices[Math.floor(Math.random() * choices.length)];
    } else if (skill === 'LONG') {
      const choices: Array<[number, number]> = [
        [5, 5], [4, 6], [6, 4], [5, 6], [6, 5], [6, 6]
      ];
      dice = choices[Math.floor(Math.random() * choices.length)];
    } else if (skill === 'DOUBLE') {
      dice = [6, 6];
    }
    const skillNameMap = {
      SHORT: 'Nhảy 2~4',
      LONG: 'Nhảy 10~12',
      DOUBLE: 'Đôi ×6',
    };
    const active = this.engine.getActivePlayer();
    this.engine.addLog(`🎯 ${active.name} dùng kỹ năng ${skillNameMap[skill]}.`);
    const isSkillRoll = skill === 'SHORT' || skill === 'LONG';
    const res = this.engine.rollDice(dice, { isSkillRoll });
    this.notify();
    return { dice: res.dice, isDouble: res.isDouble };
  }

  public surrender(playerId: string = 'player-1'): void {
    this.engine.processBankruptcy(playerId, null);
    this.notify();
    this.checkAutoBotTurn();
  }

  public buyProperty(withHouse: boolean = true): boolean {
    const active = this.engine.getActivePlayer();
    const res = this.engine.buyProperty(active.id, undefined, withHouse);
    this.notify();
    this.checkAutoBotTurn();
    return res;
  }

  public skipBuy(): void {
    const active = this.engine.getActivePlayer();
    const tile = this.engine.getTile(active.position);

    if (this.auctionOnSkip && tile && tile.ownerId == null && tile.price && tile.price > 0) {
      this.engine.addLog(`${active.name} bỏ qua ${tile.name}. Mở đấu giá nhanh 10 giây!`);
      this.startAuction(tile.id);
      return;
    }

    this.engine.skipBuy();
    this.notify();
    this.checkAutoBotTurn();
  }

  public startAuction(tileId: number): void {
    if (this.currentAuction) return;
    const tile = this.engine.getTile(tileId);
    if (!tile) return;

    if (this.botTimer) {
      clearTimeout(this.botTimer);
      this.botTimer = null;
    }

    const startingBid = Math.round((tile.price || 100_000) * 0.5);
    this.currentAuction = {
      tileId,
      tileName: tile.name,
      tilePrice: tile.price || 100_000,
      currentBid: startingBid,
      highestBidderId: null,
      highestBidderName: null,
      timeLeft: GAME_CONFIG.AUCTION_DURATION_SECONDS || 10,
    };
    this.notify();

    if (this.auctionTimer) clearInterval(this.auctionTimer);
    this.auctionTimer = setInterval(() => {
      if (!this.currentAuction || this.isPausedByModal) return;

      // Bot bidding logic
      const bots = this.engine.state.players.filter((p) => p.isBot && !p.bankrupt);
      const maxBid = Math.floor(
        this.currentAuction.tilePrice * (GAME_CONFIG.AUCTION_BOT_MAX_BID_RATIO || 0.9)
      );

      const eligibleBots = bots.filter((b) => b.id !== this.currentAuction!.highestBidderId);
      if (eligibleBots.length > 0 && Math.random() < 0.65) {
        const bot = eligibleBots[Math.floor(Math.random() * eligibleBots.length)];
        const nextBid = this.currentAuction.highestBidderId
          ? this.currentAuction.currentBid + 10_000
          : this.currentAuction.currentBid;
        if (
          nextBid <= maxBid &&
          bot.money - nextBid >= (GAME_CONFIG.BOT_CASH_RESERVE || 150_000)
        ) {
          this.currentAuction.currentBid = nextBid;
          this.currentAuction.highestBidderId = bot.id;
          this.currentAuction.highestBidderName = bot.name;
          this.engine.addLog(`🔨 ${bot.name} đặt giá ${nextBid.toLocaleString('vi-VN')}đ.`);
          this.notify();
        }
      }

      this.currentAuction.timeLeft -= 1;
      this.notify();

      if (this.currentAuction.timeLeft <= 0) {
        this.finishAuction();
      }
    }, 1000);
  }

  public placeAuctionBid(bidderId: string, amount: number): boolean {
    if (!this.currentAuction) return false;
    const player = this.engine.state.players.find((p) => p.id === bidderId);
    if (!player || player.money < amount || amount <= this.currentAuction.currentBid) return false;

    this.currentAuction.currentBid = amount;
    this.currentAuction.highestBidderId = player.id;
    this.currentAuction.highestBidderName = player.name;
    this.engine.addLog(`🔨 ${player.name} đặt giá ${amount.toLocaleString('vi-VN')}đ!`);
    this.notify();
    return true;
  }

  public passAuction(): void {
    // Không làm gì, để người khác đấu giá hoặc đếm ngược kết thúc
  }

  public finishAuction(): void {
    if (this.auctionTimer) {
      clearInterval(this.auctionTimer);
      this.auctionTimer = null;
    }
    if (!this.currentAuction) return;

    const { tileId, tileName, currentBid, highestBidderId } = this.currentAuction;
    this.currentAuction = null;

    if (highestBidderId) {
      const winner = this.engine.state.players.find((p) => p.id === highestBidderId);
      const tile = this.engine.getTile(tileId);
      if (winner && tile) {
        winner.money = Math.max(0, winner.money - currentBid);
        tile.ownerId = winner.id;
        tile.houseCount = 0;
        if (!winner.properties.includes(tile.id)) {
          winner.properties.push(tile.id);
        }
        this.engine.addLog(
          `🏆 ${winner.name} thắng đấu giá ${tileName} với giá ${currentBid.toLocaleString('vi-VN')}đ!`
        );
      }
    } else {
      this.engine.addLog(`Không ai tham gia đấu giá, ${tileName} vẫn là đất trống.`);
    }

    this.engine.completeAction();
    this.notify();
    this.checkAutoBotTurn();
  }

  public upgradeProperty(tileId?: number): boolean {
    const active = this.engine.getActivePlayer();
    const target = tileId !== undefined ? tileId : active.position;
    const res = this.engine.upgradeProperty(active.id, target);
    this.notify();
    this.checkAutoBotTurn();
    return res;
  }

  public skipUpgrade(): void {
    this.engine.skipUpgrade();
    this.notify();
    this.checkAutoBotTurn();
  }

  public takeoverProperty(tileId?: number): boolean {
    const active = this.engine.getActivePlayer();
    const target = tileId !== undefined ? tileId : active.position;
    const res = this.engine.takeoverProperty(active.id, target);
    this.notify();
    this.checkAutoBotTurn();
    return res;
  }

  public skipTakeover(): void {
    this.engine.skipTakeover();
    this.notify();
    this.checkAutoBotTurn();
  }

  public sellHouse(tileId: number, playerId?: string): boolean {
    const tile = this.engine.getTile(tileId);
    const targetPlayerId = playerId || this.engine.state.pendingDebt?.debtorId || tile?.ownerId || this.engine.getActivePlayer().id;
    const res = this.engine.sellHouse(targetPlayerId, tileId);
    this.notify();
    return res;
  }

  public mortgageProperty(tileId: number, playerId?: string): boolean {
    const tile = this.engine.getTile(tileId);
    const targetPlayerId = playerId || this.engine.state.pendingDebt?.debtorId || tile?.ownerId || this.engine.getActivePlayer().id;
    const res = this.engine.mortgageProperty(targetPlayerId, tileId);
    this.notify();
    return res;
  }

  public unmortgageProperty(tileId: number, playerId?: string): boolean {
    const tile = this.engine.getTile(tileId);
    const targetPlayerId = playerId || this.engine.state.pendingDebt?.debtorId || tile?.ownerId || this.engine.getActivePlayer().id;
    const res = this.engine.unmortgageProperty(targetPlayerId, tileId);
    this.notify();
    return res;
  }

  public declareBankruptcy(): void {
    const active = this.engine.getActivePlayer();
    const debtorId = this.engine.state.pendingDebt?.debtorId || active.id;
    this.engine.declareBankruptcy(debtorId);
    this.notify();
    this.checkAutoBotTurn();
  }

  public getPlayerRankings(): PlayerRankingItem[] {
    return this.engine.getPlayerRankings();
  }

  public applyCard(): void {
    if (this.engine.state.currentCard) {
      this.engine.applyCardEffect(this.engine.state.currentCard);
      this.notify();
      this.checkAutoBotTurn();
    }
  }

  public endTurn(): void {
    this.engine.endTurn();
    this.notify();
  }

  public checkAutoBotTurn(): void {
    if (this.isDestroyed || this.isPausedByModal || this.currentAuction || this.engine.state.gamePhase === 'GAME_OVER') return;

    // 4. Khi người chơi thật phá sản hoặc chỉ còn 1 người, dừng bot ngay lập tức
    const human = this.engine.state.players.find((p) => !p.isBot);
    const alivePlayers = this.engine.state.players.filter((p) => !p.bankrupt);
    if ((human && human.bankrupt) || alivePlayers.length <= 1) {
      if (this.botTimer) clearTimeout(this.botTimer);
      this.engine.checkAndApplyVictory();
      this.notify();
      return;
    }

    const active = this.engine.getActivePlayer();
    const isBotTurn = active.isBot || this.isAutoMatch;

    if (!isBotTurn) return;

    if (this.botTimer) clearTimeout(this.botTimer);

    const randomMs = Math.floor(Math.random() * 700) + 800; // 800..1500ms
    const baseDelay = Math.max(100, Math.round(randomMs / this.speed));

    this.botTimer = setTimeout(() => {
      this.executeBotStep();
    }, baseDelay);
  }

  private executeBotStep(): void {
    if (this.isDestroyed || this.isPausedByModal || this.currentAuction || this.engine.state.gamePhase === 'GAME_OVER') return;

    // 4. Khi người chơi thật phá sản hoặc chỉ còn 1 người, dừng bot ngay lập tức
    const human = this.engine.state.players.find((p) => !p.isBot);
    const alivePlayers = this.engine.state.players.filter((p) => !p.bankrupt);
    if ((human && human.bankrupt) || alivePlayers.length <= 1) {
      if (this.botTimer) clearTimeout(this.botTimer);
      this.engine.checkAndApplyVictory();
      this.notify();
      return;
    }

    const active = this.engine.getActivePlayer();
    if (active.bankrupt) {
      this.engine.endTurn();
      this.notify();
      return;
    }

    const phase = this.engine.state.gamePhase;

    // 1. Cứu trợ nợ
    if (phase === 'DEBT_RELIEF') {
      executeBotDebtRelief(this.engine, active);
      this.notify();
      const delay = Math.max(150, Math.round(600 / this.speed));
      this.botTimer = setTimeout(() => this.executeBotStep(), delay);
      return;
    }

    // 2. Nếu đang trong tù
    if (active.inJail && phase === 'AWAIT_ROLL') {
      const decision = evaluateBotJailDecision(active);
      if (decision === 'USE_CARD') {
        this.engine.useJailFreeCard(active.id);
      } else if (decision === 'PAY_BAIL') {
        this.engine.payJailBail(active.id);
      }
    }

    // 3. Chờ đổ xúc xắc
    if (phase === 'AWAIT_ROLL') {
      this.engine.rollDice();
      this.notify();
      const hopDelay = Math.max(200, Math.round(900 / this.speed));
      this.botTimer = setTimeout(() => this.executeBotStep(), hopDelay);
      return;
    }

    // 4. Rút thẻ bài
    if (phase === 'CARD_DRAWN' && this.engine.state.currentCard) {
      this.engine.applyCardEffect(this.engine.state.currentCard);
      this.notify();
      const delay = Math.max(150, Math.round(600 / this.speed));
      this.botTimer = setTimeout(() => this.executeBotStep(), delay);
      return;
    }

    // 5. Quyết định mua hoặc nâng cấp
    if (phase === 'AWAIT_DECISION') {
      const tile = this.engine.getTile(active.position);
      if (tile && tile.ownerId == null) {
        if (evaluateBotBuy(active, tile, this.engine.state.tiles, this.engine.state.roundCount)) {
          const withHouse = this.engine.state.roundCount >= 2;
          this.engine.buyProperty(active.id, tile.id, withHouse);
          const cost = (tile.price || 100_000) + (withHouse ? (tile.housePrice || 50_000) : 0);
          this.botActionsBuffer.push(`${active.name} mua ${tile.name} (-${Math.round(cost / 1000)}K)`);
        } else {
          if (this.auctionOnSkip && tile.price && tile.price > 0) {
            this.engine.addLog(`${active.name} bỏ qua ${tile.name}. Mở đấu giá nhanh 10 giây!`);
            this.startAuction(tile.id);
            return;
          } else {
            this.engine.completeAction();
          }
        }
      } else if (tile && tile.ownerId === active.id) {
        const upgradeTileId = evaluateBotUpgrade(active, this.engine.state.tiles);
        if (upgradeTileId !== null) {
          this.engine.upgradeProperty(active.id, upgradeTileId);
          const houseCost = tile.housePrice || 50_000;
          this.botActionsBuffer.push(`${active.name} nâng cấp ${tile.name} (-${Math.round(houseCost / 1000)}K)`);
        } else {
          this.engine.completeAction();
        }
      } else {
        this.engine.completeAction();
      }
      this.notify();
      const delay = Math.max(150, Math.round(500 / this.speed));
      this.botTimer = setTimeout(() => this.executeBotStep(), delay);
      return;
    }

    // 6. Quyết định mua lại đất đối thủ (1.5x)
    if (phase === 'AWAIT_TAKEOVER') {
      const tile = this.engine.getTile(active.position);
      if (tile && evaluateBotTakeover(active, tile, this.engine.state.tiles)) {
        this.engine.takeoverProperty(active.id, tile.id);
      } else {
        this.engine.skipTakeover();
      }
      this.notify();
      const delay = Math.max(150, Math.round(500 / this.speed));
      this.botTimer = setTimeout(() => this.executeBotStep(), delay);
      return;
    }

    // 7. Kết thúc lượt
    if (phase === 'TURN_END') {
      this.engine.endTurn();
      this.notify();
      return;
    }
  }

  public destroy(): void {
    this.isDestroyed = true;
    if (this.botTimer) {
      clearTimeout(this.botTimer);
      this.botTimer = null;
    }
    if (this.auctionTimer) {
      clearInterval(this.auctionTimer);
      this.auctionTimer = null;
    }
    this.listeners.clear();
  }
}

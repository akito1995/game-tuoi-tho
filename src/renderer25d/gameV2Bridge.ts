import { GameEngine } from '../game/engine';
import { GameEventBus } from '../game/events';
import { Player, Tile, ChanceCard, CharacterId, PlayerSlotConfig } from '../game/types';
import { evaluateBotBuy, evaluateBotUpgrade, evaluateBotJailDecision } from '../game/botAI';
import { getNextUpgradeCost } from '../game/rulesV2Financials';
import { PlayerTokenData } from './characterRenderer';

export type GameSpeed = 1 | 2 | 4;

export interface TurnScenarioCallbacks {
  onShowBanner?: (player: Player) => Promise<void> | void;
  onHideBanner?: () => void;
  onCameraFocus?: (tileId: number, zoom?: number, durationMs?: number) => void;
  onCameraOverview?: (durationMs?: number) => void;
  onRollDiceAnimation?: (
    dice: [number, number],
    sum: number,
    isDouble: boolean,
    playerName: string,
    durationMs: number
  ) => Promise<void>;
  onMoveToken?: (playerId: string, targetTile: number, durationPerHopSec: number) => Promise<void>;
  onShowToast?: (message: string, type?: 'info' | 'success' | 'warn' | 'danger') => void;
  onShowReadOnlyCard?: (
    tile: Tile,
    action: 'BUY' | 'SKIP' | 'UPGRADE',
    botName: string,
    durationMs: number
  ) => Promise<void>;
  onHideReadOnlyCard?: () => void;
  onMoneyFly?: (
    fromPlayerId: string,
    toPlayerId: string | null,
    amount: number,
    durationMs: number
  ) => Promise<void>;
}

export interface GameV2State {
  players: Player[];
  tiles: Tile[];
  activePlayer: Player;
  dice: [number, number];
  isDouble: boolean;
  canRollAgain: boolean;
  gamePhase: string;
  currentCard: ChanceCard | null;
  winner: Player | null;
  logs: string[];
  roundCount: number;
  turnCount: number;
  speed: GameSpeed;
  isAutoMatch: boolean;
  isTurnExecuting: boolean;
  skipBotAnimations: boolean;
}

export class GameV2Bridge {
  public engine: GameEngine;
  public eventBus: GameEventBus;
  public speed: GameSpeed = 1;
  public isAutoMatch: boolean = false;
  public humanChar: CharacterId = 'be-ti';
  public isTurnExecuting: boolean = false;
  public currentTurnBot: Player | null = null;
  public skipBotAnimations: boolean = false;

  private listeners: Set<(state: GameV2State) => void> = new Set();
  private isDestroyed: boolean = false;
  private loopRunning: boolean = false;
  private humanTurnResolver: (() => void) | null = null;
  private callbacks: TurnScenarioCallbacks | null = null;

  constructor(
    playerCount: 2 | 3 | 4 = 4,
    allBots: boolean = false,
    speed: GameSpeed = 1,
    humanChar: CharacterId = 'be-ti',
    slotConfigs?: PlayerSlotConfig[]
  ) {
    this.speed = speed;
    this.isAutoMatch = allBots;
    this.humanChar = humanChar;
    this.eventBus = new GameEventBus();
    this.engine = this.createEngine(playerCount, allBots, humanChar, slotConfigs);
    this.setupInternalListeners();
  }

  public setCallbacks(cb: TurnScenarioCallbacks | null): void {
    this.callbacks = cb;
  }

  private createEngine(
    playerCount: number,
    allBots: boolean,
    humanChar: CharacterId,
    slotConfigs?: PlayerSlotConfig[]
  ): GameEngine {
    if (slotConfigs && slotConfigs.length > 0) {
      return new GameEngine(slotConfigs.slice(0, playerCount), {}, this.eventBus);
    }

    const allCharList: Array<{ name: string; character: CharacterId }> = [
      { name: 'Bé Tí', character: 'be-ti' },
      { name: 'Cô Hoa', character: 'co-hoa' },
      { name: 'Ông Bảy', character: 'ong-bay' },
      { name: 'Chị Mây', character: 'chi-may' },
    ];

    const chosen = allCharList.find((c) => c.character === humanChar) || allCharList[0];
    const others = allCharList.filter((c) => c.character !== chosen.character);
    const orderedChars = [chosen, ...others];

    const characters: PlayerSlotConfig[] = [
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
        botDifficulty: 'MEDIUM' as const,
      },
      {
        id: 'player-3',
        name: `${orderedChars[2].name} 🤖`,
        character: orderedChars[2].character,
        isBot: true,
        botDifficulty: 'MEDIUM' as const,
      },
      {
        id: 'player-4',
        name: `${orderedChars[3].name} 🤖`,
        character: orderedChars[3].character,
        isBot: true,
        botDifficulty: 'HARD' as const,
      },
    ].slice(0, playerCount);

    return new GameEngine(characters, {}, this.eventBus);
  }

  public resetGame(
    playerCount: 2 | 3 | 4 = 4,
    allBots: boolean = false,
    humanChar: CharacterId = this.humanChar,
    slotConfigs?: PlayerSlotConfig[]
  ): void {
    if (this.humanTurnResolver) {
      this.humanTurnResolver();
      this.humanTurnResolver = null;
    }
    this.isAutoMatch = allBots;
    this.humanChar = humanChar;
    this.isTurnExecuting = false;
    this.engine = this.createEngine(playerCount, allBots, humanChar, slotConfigs);
    this.setupInternalListeners();
    this.notify();
    this.startTurnLoop();
  }

  private setupInternalListeners(): void {
    this.eventBus.on('turn-ended', () => {
      this.notify();
      if (this.humanTurnResolver) {
        const r = this.humanTurnResolver;
        this.humanTurnResolver = null;
        r();
      }
    });

    this.eventBus.on('player-bankrupt', () => {
      this.notify();
      if (this.humanTurnResolver) {
        const r = this.humanTurnResolver;
        this.humanTurnResolver = null;
        r();
      }
    });

    this.eventBus.on('game-over', () => {
      this.notify();
      if (this.humanTurnResolver) {
        const r = this.humanTurnResolver;
        this.humanTurnResolver = null;
        r();
      }
    });
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
    const engineActive = this.engine.getActivePlayer();
    const effectiveActive = (this.isTurnExecuting && this.currentTurnBot) ? this.currentTurnBot : engineActive;
    return {
      players: [...this.engine.state.players],
      tiles: [...this.engine.state.tiles],
      activePlayer: { ...effectiveActive },
      dice: [...this.engine.state.dice] as [number, number],
      isDouble: this.engine.state.isDouble,
      canRollAgain: Boolean(
        this.engine.state.isDouble &&
        !this.engine.getActivePlayer().inJail &&
        this.engine.state.doubleStreak < 3
      ),
      gamePhase: this.engine.state.gamePhase,
      currentCard: this.engine.state.currentCard ? { ...this.engine.state.currentCard } : null,
      winner: this.engine.state.winner ? { ...this.engine.state.winner } : null,
      logs: [...this.engine.state.eventLogs],
      roundCount: this.engine.state.roundCount,
      turnCount: this.engine.state.turnCount,
      speed: this.speed,
      isAutoMatch: this.isAutoMatch,
      isTurnExecuting: this.isTurnExecuting,
      skipBotAnimations: this.skipBotAnimations,
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

  public setSkipBotAnimations(skip: boolean): void {
    this.skipBotAnimations = skip;
    this.notify();
  }

  public setAutoMatch(auto: boolean): void {
    this.isAutoMatch = auto;
    this.notify();
    if (auto && !this.isTurnExecuting) {
      if (this.humanTurnResolver) {
        this.humanTurnResolver();
        this.humanTurnResolver = null;
      }
      this.startTurnLoop();
    }
  }

  // =========================================================================
  // VÒNG LẶP LƯỢT ĐI TUẦN TỰ DUY NHẤT (ASYNC) CÓ KHOÁ (MUTEX)
  // =========================================================================
  public startTurnLoop(): void {
    if (this.loopRunning || this.isDestroyed) return;
    this.loopRunning = true;
    this.runLoopAsync().catch((err) => {
      console.error('[GameV2Bridge] Lỗi vòng lặp lượt:', err);
      this.loopRunning = false;
    });
  }

  private async runLoopAsync(): Promise<void> {
    while (!this.isDestroyed && this.engine.state.gamePhase !== 'GAME_OVER') {
      const active = this.engine.getActivePlayer();

      if (active.bankrupt) {
        this.engine.endTurn();
        this.notify();
        continue;
      }

      const isBot = active.isBot || this.isAutoMatch;

      if (isBot) {
        // MUTEX: Khoá lượt, chỉ có đúng một người chơi đang hành động
        this.currentTurnBot = active;
        this.isTurnExecuting = true;
        this.notify();

        try {
          await this.executeSequentialBotTurn(active);
        } catch (e) {
          console.error(`[GameV2Bridge] Lỗi trong lượt của ${active.name}:`, e);
        } finally {
          this.isTurnExecuting = false;
          this.currentTurnBot = null;
          this.notify();
        }
      } else {
        // LƯỢT CỦA NGƯỜI CHƠI THẬT:
        // Đợi người chơi thật hoàn tất đổ xúc xắc, mua/xây, và kết thúc lượt
        this.currentTurnBot = null;
        this.isTurnExecuting = false;
        this.notify();

        await new Promise<void>((resolve) => {
          this.humanTurnResolver = resolve;
        });
        this.humanTurnResolver = null;
      }
    }
    this.loopRunning = false;
  }

  /**
   * KỊCH BẢN LƯỢT BOT Ở TỐC ĐỘ 1X / 2X / 4X (Hoặc Bỏ qua hiệu ứng)
   */
  private async executeSequentialBotTurn(bot: Player): Promise<void> {
    if (this.isDestroyed || this.engine.state.gamePhase === 'GAME_OVER') return;

    const S = this.speed;
    const t = (ms: number) => Math.max(50, Math.round(ms / S));
    const cb = this.callbacks;

    // -------------------------------------------------------------
    // TUỲ CHỌN: BỎ QUA HIỆU ỨNG CỦA BOT
    // (Chỉ hiện kết quả cuối mỗi lượt bot trong 1 giây)
    // -------------------------------------------------------------
    if (this.skipBotAnimations) {
      if (bot.inJail) {
        const jailDecision = evaluateBotJailDecision(bot);
        if (jailDecision === 'USE_CARD') this.engine.useJailFreeCard(bot.id);
        else if (jailDecision === 'PAY_BAIL') this.engine.payJailBail(bot.id);
      }

      const rollRes = this.engine.rollDice();
      const d1 = rollRes.dice[0];
      const d2 = rollRes.dice[1];
      const sum = rollRes.sum;
      const isDouble = rollRes.isDouble;
      const tile = this.engine.getTile(bot.position);
      let actionText = 'dừng chân';

      if (this.engine.state.gamePhase === 'AWAIT_DECISION') {
        if (tile && tile.ownerId == null) {
          if (evaluateBotBuy(bot, tile, this.engine.state.tiles)) {
            this.engine.buyProperty(bot.id, tile.id);
            actionText = `mua ${tile.price?.toLocaleString('vi-VN')}đ`;
          } else {
            this.engine.completeAction();
            actionText = 'bỏ qua';
          }
        } else if (tile && tile.ownerId === bot.id) {
          const upgradeTileId = evaluateBotUpgrade(bot, this.engine.state.tiles);
          if (upgradeTileId !== null) {
            this.engine.upgradeProperty(bot.id, upgradeTileId);
            actionText = `nâng cấp ${getNextUpgradeCost(tile).toLocaleString('vi-VN')}đ`;
          } else {
            this.engine.completeAction();
            actionText = 'bỏ qua';
          }
        }
      } else if (this.engine.state.gamePhase === 'CARD_DRAWN' && this.engine.state.currentCard) {
        this.engine.applyCardEffect(this.engine.state.currentCard);
        actionText = `rút thẻ '${this.engine.state.currentCard.title}'`;
      }

      const summary = `${bot.name.replace(' 🤖', '')} đổ ${d1} + ${d2} = ${sum}${
        isDouble ? ' (Đôi)' : ''
      } → dừng ở ${tile?.shortName || tile?.name || 'ô'} → ${actionText}`;

      this.engine.addLog(summary);
      cb?.onShowToast?.(summary, 'info');
      this.notify();

      // Hiện kết quả cuối trong đúng 1 giây (1000ms)
      await new Promise((r) => setTimeout(r, 1000));

      if (this.isDestroyed) return;
      if (this.engine.getActivePlayer().id === bot.id) {
        this.engine.endTurn();
      }
      this.notify();
      return;
    }

    // -------------------------------------------------------------
    // BƯỚC 1: Camera chuyển tới bot + băng "Lượt của <tên>" giữa màn hình: 1.0 giây
    // -------------------------------------------------------------
    cb?.onCameraFocus?.(bot.position, 1.2, t(400));
    if (cb?.onShowBanner) {
      await cb.onShowBanner(bot);
    }
    await new Promise((r) => setTimeout(r, t(1000)));
    cb?.onHideBanner?.();

    if (this.isDestroyed) return;

    // Xử lý nếu đang trong tù
    if (bot.inJail) {
      const jailDecision = evaluateBotJailDecision(bot);
      if (jailDecision === 'USE_CARD') {
        this.engine.useJailFreeCard(bot.id);
        cb?.onShowToast?.(`${bot.name.replace(' 🤖', '')} dùng thẻ ra tù miễn phí 🕊️`, 'success');
      } else if (jailDecision === 'PAY_BAIL') {
        this.engine.payJailBail(bot.id);
        cb?.onShowToast?.(`${bot.name.replace(' 🤖', '')} nộp phạt 100.000đ để ra tù 💰`, 'info');
      }
    }

    // -------------------------------------------------------------
    // BƯỚC 2: Bot "suy nghĩ": 0.6 giây, rồi xúc xắc lăn 1.2 giây, hiện kết quả 0.6 giây
    // -------------------------------------------------------------
    cb?.onShowToast?.(`${bot.name.replace(' 🤖', '')} đang suy nghĩ... 🤔`, 'info');
    await new Promise((r) => setTimeout(r, t(600)));

    if (this.isDestroyed) return;

    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const sum = d1 + d2;
    const isDouble = d1 === d2;

    // Xúc xắc lăn 1.2 giây
    if (cb?.onRollDiceAnimation) {
      await cb.onRollDiceAnimation([d1, d2], sum, isDouble, bot.name, t(1200));
    } else {
      await new Promise((r) => setTimeout(r, t(1200)));
    }

    // Hiện kết quả 0.6 giây
    await new Promise((r) => setTimeout(r, t(600)));

    if (this.isDestroyed) return;

    // -------------------------------------------------------------
    // BƯỚC 3: Nhảy từng ô: 0.35 giây mỗi ô, camera bám theo
    // -------------------------------------------------------------
    const oldPos = bot.position;
    const targetPos = (oldPos + sum) % 40;
    const hopDurationSec = 0.35 / S;

    if (cb?.onMoveToken) {
      await cb.onMoveToken(bot.id, targetPos, hopDurationSec);
    } else {
      await new Promise((r) => setTimeout(r, Math.round(sum * hopDurationSec * 1000)));
    }

    if (this.isDestroyed) return;

    // Di chuyển chính thức trong engine
    this.engine.rollDice([d1, d2]);
    this.notify();

    // -------------------------------------------------------------
    // BƯỚC 4: Dừng chân: toast tên ô và sự kiện 1.5 giây.
    // Nếu bot mua/xây: hiện thẻ mua ở chế độ chỉ xem (không có nút) 1.5 giây
    // với dòng chữ "Cô Hoa quyết định MUA" hoặc "BỎ QUA", rồi mới chạy hiệu ứng mua
    // -------------------------------------------------------------
    const tile = this.engine.getTile(bot.position);
    let stepActionSummary = 'dừng chân';

    if (this.engine.state.gamePhase === 'AWAIT_DECISION') {
      const isBuy = tile.ownerId == null;
      let botDecisionText = '';
      let willAct = false;

      if (isBuy) {
        const willBuy = evaluateBotBuy(bot, tile, this.engine.state.tiles);
        const canAfford = bot.money >= (tile.price || 0);
        willAct = willBuy && canAfford;
        botDecisionText = willAct
          ? `${bot.name.replace(' 🤖', '')} quyết định MUA`
          : `${bot.name.replace(' 🤖', '')} quyết định BỎ QUA`;
      } else {
        const upgradeTileId = evaluateBotUpgrade(bot, this.engine.state.tiles);
        const cost = getNextUpgradeCost(tile);
        willAct = upgradeTileId !== null && bot.money >= cost;
        botDecisionText = willAct
          ? `${bot.name.replace(' 🤖', '')} quyết định NÂNG CẤP`
          : `${bot.name.replace(' 🤖', '')} quyết định BỎ QUA`;
      }

      // Hiện thẻ mua ở chế độ chỉ xem 1.5 giây
      if (cb?.onShowReadOnlyCard) {
        await cb.onShowReadOnlyCard(
          tile,
          isBuy ? (willAct ? 'BUY' : 'SKIP') : (willAct ? 'UPGRADE' : 'SKIP'),
          botDecisionText,
          t(1500)
        );
      } else {
        await new Promise((r) => setTimeout(r, t(1500)));
      }

      // Chạy hành động mua / xây thật sự
      if (isBuy) {
        if (willAct) {
          this.engine.buyProperty(bot.id, tile.id);
          stepActionSummary = `mua ${tile.price?.toLocaleString('vi-VN')}đ`;
        } else {
          this.engine.completeAction();
          stepActionSummary = 'bỏ qua';
        }
      } else {
        if (willAct) {
          this.engine.upgradeProperty(bot.id, tile.id);
          stepActionSummary = `nâng cấp ${getNextUpgradeCost(tile).toLocaleString('vi-VN')}đ`;
        } else {
          this.engine.completeAction();
          stepActionSummary = 'bỏ qua';
        }
      }
      this.notify();
    } else {
      cb?.onShowToast?.(`${bot.name.replace(' 🤖', '')} dừng chân tại ${tile.name} 🚩`, 'info');

      // -------------------------------------------------------------
      // BƯỚC 5: Trả tiền thuê/thuế: hiệu ứng tiền bay 1.0 giây,
      // số tiền trên thanh lượt chạy đúng lúc tiền tới
      // -------------------------------------------------------------
      if (tile.ownerId != null && tile.ownerId !== bot.id) {
        const owner = this.engine.state.players.find((p) => p.id === tile.ownerId);
        const rentAmount = this.engine.calculateRent(tile, sum);
        if (cb?.onMoneyFly) {
          await cb.onMoneyFly(bot.id, owner?.id || null, rentAmount, t(1000));
        } else {
          await new Promise((r) => setTimeout(r, t(1000)));
        }
        stepActionSummary = `trả ${rentAmount.toLocaleString('vi-VN')}đ tiền thuê cho ${
          owner ? owner.name.replace(' 🤖', '') : 'chủ đất'
        }`;
      } else if (tile.type === 'TAX') {
        const taxAmount = tile.id === 4 ? 100000 : 100000;
        if (cb?.onMoneyFly) {
          await cb.onMoneyFly(bot.id, null, taxAmount, t(1000));
        } else {
          await new Promise((r) => setTimeout(r, t(1000)));
        }
        stepActionSummary = `nộp phạt ${taxAmount.toLocaleString('vi-VN')}đ thuế`;
      } else if (tile.type === 'CHANCE' || tile.type === 'FATE') {
        await new Promise((r) => setTimeout(r, t(1500)));
        if (this.engine.state.currentCard) {
          stepActionSummary = `rút thẻ '${this.engine.state.currentCard.title}'`;
          this.engine.applyCardEffect(this.engine.state.currentCard);
          this.notify();
        }
      } else {
        await new Promise((r) => setTimeout(r, t(1500)));
      }
    }

    // -------------------------------------------------------------
    // Ghi nhật ký ván đấu một dòng theo thứ tự thời gian:
    // Ví dụ: "Cô Hoa đổ 3 + 4 = 7 → dừng ở Huế → mua 220.000đ"
    // -------------------------------------------------------------
    const stepLog = `${bot.name.replace(' 🤖', '')} đổ ${d1} + ${d2} = ${sum}${
      isDouble ? ' (Đôi)' : ''
    } → dừng ở ${tile.shortName || tile.name} → ${stepActionSummary}`;
    this.engine.addLog(stepLog);
    this.notify();

    // -------------------------------------------------------------
    // BƯỚC 6: Nghỉ 0.8 giây rồi mới chuyển lượt;
    // ô người chơi trên thanh lượt chuyển sáng sang người kế tiếp
    // -------------------------------------------------------------
    await new Promise((r) => setTimeout(r, t(800)));

    if (this.isDestroyed) return;

    if (this.engine.getActivePlayer().id === bot.id) {
      this.engine.endTurn();
    }
    this.notify();
  }

  // =========================================================================
  // THAO TÁC CỦA NGƯỜI CHƠI THẬT
  // =========================================================================
  public rollDice(): { dice: [number, number]; isDouble: boolean } {
    const res = this.engine.rollDice();
    this.notify();
    return { dice: res.dice, isDouble: res.isDouble };
  }

  public rollWithSkill(skill: 'SHORT' | 'LONG' | 'DOUBLE'): { dice: [number, number]; isDouble: boolean } {
    let dice: [number, number] = [1, 1];
    if (skill === 'SHORT') {
      const choices: Array<[number, number]> = [
        [1, 1],
        [1, 2],
        [2, 1],
        [1, 3],
        [3, 1],
        [2, 2],
      ];
      dice = choices[Math.floor(Math.random() * choices.length)];
    } else if (skill === 'LONG') {
      const choices: Array<[number, number]> = [
        [5, 5],
        [4, 6],
        [6, 4],
        [5, 6],
        [6, 5],
        [6, 6],
      ];
      dice = choices[Math.floor(Math.random() * choices.length)];
    } else if (skill === 'DOUBLE') {
      dice = [6, 6];
    }
    const res = this.engine.rollDice(dice);
    this.notify();
    return { dice: res.dice, isDouble: res.isDouble };
  }

  public surrender(playerId: string = 'player-1'): void {
    this.engine.processBankruptcy(playerId, null);
    this.notify();
    if (this.humanTurnResolver) {
      this.humanTurnResolver();
      this.humanTurnResolver = null;
    }
  }

  public buyProperty(): boolean {
    const active = this.engine.getActivePlayer();
    const res = this.engine.buyProperty(active.id);
    this.notify();
    this.endHumanTurnIfReady();
    return res;
  }

  public skipBuy(): void {
    this.engine.completeAction();
    this.notify();
    this.endHumanTurnIfReady();
  }

  public upgradeProperty(tileId?: number): boolean {
    const active = this.engine.getActivePlayer();
    const target = tileId !== undefined ? tileId : active.position;
    const res = this.engine.upgradeProperty(active.id, target);
    this.notify();
    this.endHumanTurnIfReady();
    return res;
  }

  public skipUpgrade(): void {
    this.engine.completeAction();
    this.notify();
    this.endHumanTurnIfReady();
  }

  public applyCard(): void {
    if (this.engine.state.currentCard) {
      this.engine.applyCardEffect(this.engine.state.currentCard);
      this.notify();
      this.endHumanTurnIfReady();
    }
  }

  public endTurn(): void {
    this.engine.endTurn();
    this.notify();
    if (this.humanTurnResolver) {
      this.humanTurnResolver();
      this.humanTurnResolver = null;
    }
  }

  private endHumanTurnIfReady(): void {
    if (this.engine.state.gamePhase === 'ACTION_COMPLETED' || this.engine.state.gamePhase === 'TURN_END') {
      // Nếu không đổ đôi để được đi tiếp, kết thúc lượt người chơi
      if (!this.engine.state.isDouble) {
        this.endTurn();
      }
    }
  }

  public destroy(): void {
    this.isDestroyed = true;
    if (this.humanTurnResolver) {
      this.humanTurnResolver();
      this.humanTurnResolver = null;
    }
    this.listeners.clear();
    this.callbacks = null;
  }
}

import { GameEngine } from '../game/engine';
import { GameEventBus, GameEventMap } from '../game/events';
import { Player, Tile, ChanceCard, CharacterId } from '../game/types';
import { evaluateBotBuy, evaluateBotUpgrade, evaluateBotJailDecision } from '../game/botAI';
import { PlayerTokenData } from './characterRenderer';

export type GameSpeed = 1 | 2 | 4;

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
  winner: Player | null;
  logs: string[];
  roundCount: number;
  turnCount: number;
  speed: GameSpeed;
  isAutoMatch: boolean;
}

export class GameV2Bridge {
  public engine: GameEngine;
  public eventBus: GameEventBus;
  public speed: GameSpeed = 1;
  public isAutoMatch: boolean = false;
  public humanChar: CharacterId = 'be-ti';
  private listeners: Set<(state: GameV2State) => void> = new Set();
  private botTimer: any = null;
  private isDestroyed: boolean = false;
  private isRollingAnimation: boolean = false;

  constructor(
    playerCount: 2 | 3 | 4 = 4,
    allBots: boolean = false,
    speed: GameSpeed = 1,
    humanChar: CharacterId = 'be-ti'
  ) {
    this.speed = speed;
    this.isAutoMatch = allBots;
    this.humanChar = humanChar;
    this.eventBus = new GameEventBus();
    this.engine = this.createEngine(playerCount, allBots, humanChar);
    this.setupInternalListeners();
  }

  private createEngine(playerCount: number, allBots: boolean, humanChar: CharacterId): GameEngine {
    const allCharList: Array<{ name: string; character: CharacterId }> = [
      { name: 'Bé Tí', character: 'be-ti' },
      { name: 'Cô Hoa', character: 'co-hoa' },
      { name: 'Ông Bảy', character: 'ong-bay' },
      { name: 'Chị Mây', character: 'chi-may' },
    ];

    // Nhân vật người chơi chọn đứng đầu
    const chosen = allCharList.find((c) => c.character === humanChar) || allCharList[0];
    const others = allCharList.filter((c) => c.character !== chosen.character);

    const orderedChars = [chosen, ...others];

    const characters: Array<{ id: string; name: string; character: CharacterId; isBot: boolean }> = [
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
      },
      {
        id: 'player-3',
        name: `${orderedChars[2].name} 🤖`,
        character: orderedChars[2].character,
        isBot: true,
      },
      {
        id: 'player-4',
        name: `${orderedChars[3].name} 🤖`,
        character: orderedChars[3].character,
        isBot: true,
      },
    ].slice(0, playerCount);

    return new GameEngine(characters, {}, this.eventBus);
  }

  public resetGame(
    playerCount: 2 | 3 | 4 = 4,
    allBots: boolean = false,
    humanChar: CharacterId = this.humanChar
  ): void {
    if (this.botTimer) {
      clearTimeout(this.botTimer);
      this.botTimer = null;
    }
    this.isAutoMatch = allBots;
    this.humanChar = humanChar;
    this.engine = this.createEngine(playerCount, allBots, humanChar);
    this.setupInternalListeners();
    this.notify();
    this.checkAutoBotTurn();
  }

  private setupInternalListeners(): void {
    this.eventBus.on('turn-ended', () => {
      this.notify();
      this.checkAutoBotTurn();
    });

    this.eventBus.on('player-bankrupt', () => {
      this.notify();
    });

    this.eventBus.on('game-over', () => {
      this.notify();
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
    return {
      players: [...this.engine.state.players],
      tiles: [...this.engine.state.tiles],
      activePlayer: { ...this.engine.getActivePlayer() },
      dice: [...this.engine.state.dice] as [number, number],
      isDouble: this.engine.state.isDouble,
      gamePhase: this.engine.state.gamePhase,
      currentCard: this.engine.state.currentCard ? { ...this.engine.state.currentCard } : null,
      winner: this.engine.state.winner ? { ...this.engine.state.winner } : null,
      logs: [...this.engine.state.eventLogs],
      roundCount: this.engine.state.roundCount,
      turnCount: this.engine.state.turnCount,
      speed: this.speed,
      isAutoMatch: this.isAutoMatch,
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
    const res = this.engine.rollDice();
    this.notify();
    return { dice: res.dice, isDouble: res.isDouble };
  }

  public rollWithSkill(skill: 'SHORT' | 'LONG' | 'DOUBLE'): { dice: [number, number]; isDouble: boolean } {
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
    const res = this.engine.rollDice(dice);
    this.notify();
    return { dice: res.dice, isDouble: res.isDouble };
  }

  public surrender(playerId: string = 'player-1'): void {
    this.engine.processBankruptcy(playerId, null);
    this.notify();
    this.checkAutoBotTurn();
  }

  public buyProperty(): boolean {
    const active = this.engine.getActivePlayer();
    const res = this.engine.buyProperty(active.id);
    this.notify();
    this.checkAutoBotTurn();
    return res;
  }

  public skipBuy(): void {
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
    this.engine.completeAction();
    this.notify();
    this.checkAutoBotTurn();
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
    if (this.isDestroyed || this.engine.state.gamePhase === 'GAME_OVER') return;

    const active = this.engine.getActivePlayer();
    const isBotTurn = active.isBot || this.isAutoMatch;

    if (!isBotTurn) return;

    if (this.botTimer) clearTimeout(this.botTimer);

    // Thời gian bot tự đổ/suy nghĩ: 0.8 - 1.5 giây theo quy chuẩn
    const randomMs = Math.floor(Math.random() * 700) + 800; // 800..1500ms
    const baseDelay = Math.max(100, Math.round(randomMs / this.speed));

    this.botTimer = setTimeout(() => {
      this.executeBotStep();
    }, baseDelay);
  }

  private executeBotStep(): void {
    if (this.isDestroyed || this.engine.state.gamePhase === 'GAME_OVER') return;

    const active = this.engine.getActivePlayer();
    if (active.bankrupt) {
      this.engine.endTurn();
      this.notify();
      return;
    }

    const phase = this.engine.state.gamePhase;

    // 1. Nếu đang trong tù
    if (active.inJail && phase === 'AWAIT_ROLL') {
      const decision = evaluateBotJailDecision(active);
      if (decision === 'USE_CARD') {
        this.engine.useJailFreeCard(active.id);
      } else if (decision === 'PAY_BAIL') {
        this.engine.payJailBail(active.id);
      }
    }

    // 2. Chờ đổ xúc xắc
    if (phase === 'AWAIT_ROLL') {
      this.engine.rollDice();
      this.notify();
      // Sau khi đổ xúc xắc, quân cờ nhảy ô xong rồi chuyển tiếp
      const hopDelay = Math.max(200, Math.round(900 / this.speed));
      this.botTimer = setTimeout(() => this.executeBotStep(), hopDelay);
      return;
    }

    // 3. Rút thẻ bài
    if (phase === 'CARD_DRAWN' && this.engine.state.currentCard) {
      this.engine.applyCardEffect(this.engine.state.currentCard);
      this.notify();
      const delay = Math.max(150, Math.round(600 / this.speed));
      this.botTimer = setTimeout(() => this.executeBotStep(), delay);
      return;
    }

    // 4. Quyết định mua hoặc nâng cấp
    if (phase === 'AWAIT_DECISION') {
      const tile = this.engine.getTile(active.position);
      if (tile && tile.ownerId == null) {
        if (evaluateBotBuy(active, tile, this.engine.state.tiles)) {
          this.engine.buyProperty(active.id, tile.id);
        } else {
          this.engine.completeAction();
        }
      } else if (tile && tile.ownerId === active.id) {
        const upgradeTileId = evaluateBotUpgrade(active, this.engine.state.tiles);
        if (upgradeTileId !== null) {
          this.engine.upgradeProperty(active.id, upgradeTileId);
        } else {
          this.engine.completeAction();
        }
      } else {
        this.engine.state.gamePhase = 'TURN_END';
      }
      this.notify();
      const delay = Math.max(150, Math.round(500 / this.speed));
      this.botTimer = setTimeout(() => this.executeBotStep(), delay);
      return;
    }

    // 5. Kết thúc lượt
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
    this.listeners.clear();
  }
}

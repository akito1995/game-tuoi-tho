import { ChanceCard, Player, Tile, VictoryType } from './types';

export type GameEventMap = {
  'dice-rolled': {
    playerId: string;
    dice: [number, number];
    sum: number;
    isDouble: boolean;
  };
  'player-moved': {
    playerId: string;
    from: number;
    to: number;
    passedGo: boolean;
    reward?: number;
  };
  'tile-landed': {
    playerId: string;
    tile: Tile;
  };
  'property-bought': {
    playerId: string;
    tile: Tile;
    price: number;
  };
  'property-upgraded': {
    playerId: string;
    tile: Tile;
    tier: number;
    cost: number;
  };
  'property-takeover': {
    buyerId: string;
    sellerId: string;
    tile: Tile;
    price: number;
  };
  'property-mortgaged': {
    playerId: string;
    tile: Tile;
    amountReceived: number;
  };
  'property-unmortgaged': {
    playerId: string;
    tile: Tile;
    cost: number;
  };
  'property-skipped': {
    playerId: string;
    tile?: Tile;
    action: 'BUY' | 'UPGRADE' | 'TAKEOVER';
  };
  'house-sold': {
    playerId: string;
    tile: Tile;
    refund: number;
    remainingHouses: number;
  };
  'rent-paid': {
    debtorId: string;
    creditorId: string;
    amount: number;
    tile: Tile;
  };
  'tax-paid': {
    playerId: string;
    amount: number;
    tile: Tile;
  };
  'piggy-bank-collected': {
    playerId: string;
    amount: number;
  };
  'jail-entered': {
    playerId: string;
    turns: number;
    reason: string;
  };
  'jail-exited': {
    playerId: string;
    method: 'BAIL' | 'DOUBLE' | 'CARD';
  };
  'card-drawn': {
    playerId: string;
    card: ChanceCard;
    deck: 'CHANCE' | 'FATE';
  };
  'card-applied': {
    playerId: string;
    card: ChanceCard;
  };
  'player-bankrupt': {
    playerId: string;
    creditorId: string | null;
  };
  'turn-ended': {
    activePlayerId: string;
    nextPlayerId: string;
    round: number;
  };
  'game-over': {
    winner: Player;
    rounds: number;
    victoryType: VictoryType;
    reason: string;
  };
  'double-roll-bonus': {
    playerId: string;
  };
};

export type GameEventCallback<K extends keyof GameEventMap> = (
  payload: GameEventMap[K]
) => void;

export class GameEventBus {
  private listeners: Map<keyof GameEventMap, Set<(payload: any) => void>> = new Map();

  on<K extends keyof GameEventMap>(event: K, cb: GameEventCallback<K>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(cb);
    return () => this.off(event, cb);
  }

  off<K extends keyof GameEventMap>(event: K, cb: GameEventCallback<K>): void {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(cb);
    }
  }

  emit<K extends keyof GameEventMap>(event: K, payload: GameEventMap[K]): void {
    const set = this.listeners.get(event);
    if (set) {
      set.forEach((cb) => {
        try {
          cb(payload);
        } catch (err) {
          console.error(`Error in event listener for ${event}:`, err);
        }
      });
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}

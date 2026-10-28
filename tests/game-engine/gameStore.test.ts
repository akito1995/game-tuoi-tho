import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '@/lib/game-engine/gameStore';
import { BOARD_TILES } from '@/lib/game-engine/boardData';
import { CHANCE_CARDS, FATE_CARDS } from '@/lib/game-engine/chanceCards';

describe('Game State Machine (Zustand Store) & Monopoly Rules', () => {
  beforeEach(() => {
    useGameStore.getState().initGame(4);
  });

  describe('1. Game Setup & Initialization', () => {
    it('should initialize a 2 to 4 player game with 2,000,000 VND starting cash', () => {
      useGameStore.getState().initGame(2);
      const state = useGameStore.getState();

      expect(state.players).toHaveLength(2);
      expect(state.activePlayerIndex).toBe(0);
      expect(state.jackpotFund).toBe(50000);
      expect(state.currentRound).toBe(1);
      expect(state.winner).toBeNull();

      state.players.forEach((player, idx) => {
        expect(player.id).toBe(`player_${idx + 1}`);
        expect(player.money).toBe(2000000);
        expect(player.position).toBe(0);
        expect(player.inJail).toBe(false);
        expect(player.jailTurns).toBe(0);
        expect(player.properties).toEqual([]);
        expect(player.bankrupt).toBe(false);
      });
    });

    it('should deep clone BOARD_TILES so store mutations do not alter template data', () => {
      const state = useGameStore.getState();
      expect(state.tiles).toHaveLength(32);
      expect(state.tiles).not.toBe(BOARD_TILES);

      // Mutate store tile
      state.tiles[1].ownerId = 'player_1';
      expect(BOARD_TILES[1].ownerId).toBeNull();
    });
  });

  describe('2. Movement & Passing Go (+200k salary)', () => {
    it('should award +200,000 VND when passing Go (Tile 0)', () => {
      // Manually set player 1 at tile 28
      useGameStore.setState((s) => ({
        players: s.players.map((p, idx) =>
          idx === 0 ? { ...p, position: 28 } : p
        ),
      }));

      const initialMoney = useGameStore.getState().players[0].money;
      // Roll [2, 3] -> sum 5, new position: (28 + 5) % 32 = 1 (Unowned Property)
      useGameStore.getState().rollDice([2, 3]);

      const updatedPlayer = useGameStore.getState().players[0];
      expect(updatedPlayer.position).toBe(1);
      expect(updatedPlayer.money).toBe(initialMoney + 200000);
      expect(useGameStore.getState().eventLogs.some((log) => log.includes('Xuất Phát'))).toBe(true);
    });

    it('should award +200,000 VND when landing directly on Go (Tile 0)', () => {
      useGameStore.setState((s) => ({
        players: s.players.map((p, idx) =>
          idx === 0 ? { ...p, position: 30 } : p
        ),
      }));

      const initialMoney = useGameStore.getState().players[0].money;
      // Roll [1, 1] is a double, which gives +50k double bonus AND +200k passing Go
      // Let's test with non-double [1, 1] vs non-double [1, 2] -> landing on 0 from 30 needs sum 2:
      // Wait, 30 + 2 = 32 % 32 = 0. Die cannot be [0, 2], so non-double cannot sum 2.
      // But from 29 + sum 3 = 32 % 32 = 0 with [1, 2]!
      useGameStore.setState((s) => ({
        players: s.players.map((p, idx) =>
          idx === 0 ? { ...p, position: 29 } : p
        ),
      }));

      useGameStore.getState().rollDice([1, 2]);
      const updatedPlayer = useGameStore.getState().players[0];
      expect(updatedPlayer.position).toBe(0);
      expect(updatedPlayer.money).toBe(initialMoney + 200000);
    });

    it('should not award passing Go when moving within the same lap', () => {
      const initialMoney = useGameStore.getState().players[0].money;
      useGameStore.getState().rollDice([1, 2]); // from 0 to 3

      const updatedPlayer = useGameStore.getState().players[0];
      expect(updatedPlayer.position).toBe(3);
      expect(updatedPlayer.money).toBe(initialMoney);
    });
  });

  describe('3. Dice Mechanics: Doubles & Speeding to Jail', () => {
    it('should award +50,000 VND bonus and an extra turn when rolling a double', () => {
      const initialMoney = useGameStore.getState().players[0].money;
      useGameStore.getState().rollDice([3, 3]);

      const state = useGameStore.getState();
      expect(state.isDouble).toBe(true);
      expect(state.doubleStreak).toBe(1);
      expect(state.players[0].money).toBe(initialMoney + 50000);

      // End turn should grant another roll to the same player
      useGameStore.getState().endTurn();
      expect(useGameStore.getState().activePlayerIndex).toBe(0);
    });

    it('should send player directly to jail on 3 consecutive doubles ("Đi bão")', () => {
      // 1st double
      useGameStore.getState().rollDice([2, 2]);
      useGameStore.getState().endTurn();
      expect(useGameStore.getState().doubleStreak).toBe(1);
      expect(useGameStore.getState().activePlayerIndex).toBe(0);

      // 2nd double
      useGameStore.getState().rollDice([4, 4]);
      useGameStore.getState().endTurn();
      expect(useGameStore.getState().doubleStreak).toBe(2);
      expect(useGameStore.getState().activePlayerIndex).toBe(0);

      // 3rd double -> Caught speeding!
      useGameStore.getState().rollDice([5, 5]);
      const state = useGameStore.getState();
      const p1 = state.players[0];

      expect(p1.inJail).toBe(true);
      expect(p1.position).toBe(8); // Tile 8 is Jail
      expect(p1.jailTurns).toBe(3);
      expect(state.doubleStreak).toBe(0);
      expect(state.isDouble).toBe(false);

      // Ending turn now advances to next player
      useGameStore.getState().endTurn();
      expect(useGameStore.getState().activePlayerIndex).toBe(1);
    });
  });

  describe('4. Tile Landing & Special Corner Tiles', () => {
    it('should send player to jail when landing on GO_TO_JAIL (Tile 24)', () => {
      useGameStore.setState((s) => ({
        players: s.players.map((p, idx) =>
          idx === 0 ? { ...p, position: 20 } : p
        ),
      }));

      useGameStore.getState().rollDice([1, 3]); // sum 4 -> lands on 24
      const p1 = useGameStore.getState().players[0];

      expect(p1.position).toBe(8); // Sent to Jail
      expect(p1.inJail).toBe(true);
      expect(p1.jailTurns).toBe(3);
    });

    it('should award entire jackpot fund and reset jackpot to 20k when landing on FESTIVAL (Tile 16)', () => {
      useGameStore.setState((s) => ({
        jackpotFund: 120000,
        players: s.players.map((p, idx) =>
          idx === 0 ? { ...p, position: 12 } : p
        ),
      }));

      const initialMoney = useGameStore.getState().players[0].money;
      useGameStore.getState().rollDice([1, 3]); // sum 4 -> lands on 16 (Lễ hội)

      const state = useGameStore.getState();
      expect(state.players[0].position).toBe(16);
      expect(state.players[0].money).toBe(initialMoney + 120000);
      expect(state.jackpotFund).toBe(20000);
    });
  });

  describe('5. Property Purchase & Upgrades (House -> Resort)', () => {
    it('should allow player to buy unowned property when landing on it', () => {
      // Tile 1: Đất Mũi Cà Mau (price: 60,000)
      useGameStore.getState().rollDice([0, 1] as any); // landing on Tile 1
      const p1MoneyBefore = useGameStore.getState().players[0].money;

      const success = useGameStore.getState().buyProperty(1);
      expect(success).toBe(true);

      const state = useGameStore.getState();
      expect(state.players[0].money).toBe(p1MoneyBefore - 60000);
      expect(state.players[0].properties).toContain(1);
      expect(state.tiles[1].ownerId).toBe('player_1');
    });

    it('should not allow buying property if player does not have enough money', () => {
      useGameStore.setState((s) => ({
        players: s.players.map((p, idx) =>
          idx === 0 ? { ...p, money: 10000 } : p
        ),
      }));

      const success = useGameStore.getState().buyProperty(1); // Tile 1 price is 60,000
      expect(success).toBe(false);
      expect(useGameStore.getState().tiles[1].ownerId).toBeNull();
    });

    it('should upgrade property progressively from house 1 to 4 (resort)', () => {
      // Setup player 1 owning Tile 1 (housePrice: 50,000)
      useGameStore.setState((s) => ({
        tiles: s.tiles.map((t) => (t.id === 1 ? { ...t, ownerId: 'player_1' } : t)),
        players: s.players.map((p, idx) =>
          idx === 0 ? { ...p, properties: [1] } : p
        ),
      }));

      const tile = useGameStore.getState().tiles[1];
      const housePrice = tile.housePrice!;
      expect(housePrice).toBe(50000);

      // Upgrade 1 (House 1)
      let moneyBefore = useGameStore.getState().players[0].money;
      expect(useGameStore.getState().upgradeProperty(1)).toBe(true);
      expect(useGameStore.getState().tiles[1].houseCount).toBe(1);
      expect(useGameStore.getState().tiles[1].hasResort).toBe(false);
      expect(useGameStore.getState().players[0].money).toBe(moneyBefore - housePrice);

      // Upgrade 2 (House 2)
      moneyBefore = useGameStore.getState().players[0].money;
      expect(useGameStore.getState().upgradeProperty(1)).toBe(true);
      expect(useGameStore.getState().tiles[1].houseCount).toBe(2);
      expect(useGameStore.getState().players[0].money).toBe(moneyBefore - housePrice);

      // Upgrade 3 (Villa)
      moneyBefore = useGameStore.getState().players[0].money;
      expect(useGameStore.getState().upgradeProperty(1)).toBe(true);
      expect(useGameStore.getState().tiles[1].houseCount).toBe(3);
      expect(useGameStore.getState().players[0].money).toBe(moneyBefore - housePrice);

      // Upgrade 4 (Resort)
      moneyBefore = useGameStore.getState().players[0].money;
      expect(useGameStore.getState().upgradeProperty(1)).toBe(true);
      expect(useGameStore.getState().tiles[1].houseCount).toBe(4);
      expect(useGameStore.getState().tiles[1].hasResort).toBe(true);
      expect(useGameStore.getState().players[0].money).toBe(moneyBefore - housePrice);

      // Upgrade 5 (Cannot exceed resort / 4 houses)
      expect(useGameStore.getState().upgradeProperty(1)).toBe(false);
      expect(useGameStore.getState().tiles[1].houseCount).toBe(4);
    });
  });

  describe('6. Rent Payment & Full Color Monopoly (2x multiplier)', () => {
    it('should charge base rent when landing on another player single property', () => {
      // Tile 1: baseRent = 6,000, owned by Player 1
      useGameStore.setState((s) => ({
        tiles: s.tiles.map((t) => (t.id === 1 ? { ...t, ownerId: 'player_1', houseCount: 0 } : t)),
        players: s.players.map((p, idx) =>
          idx === 0 ? { ...p, properties: [1] } : p
        ),
        activePlayerIndex: 1, // Player 2 turn
      }));

      const p1MoneyBefore = useGameStore.getState().players[0].money;
      const p2MoneyBefore = useGameStore.getState().players[1].money;

      // Player 2 rolls from 0 to 1
      useGameStore.getState().rollDice([0, 1] as any);

      const state = useGameStore.getState();
      expect(state.players[1].money).toBe(p2MoneyBefore - 6000);
      expect(state.players[0].money).toBe(p1MoneyBefore + 6000);
    });

    it('should charge double rent (x2) when owner has full color group monopoly', () => {
      // ME_KONG group consists of Tile 1 (baseRent: 6,000) and Tile 3 (baseRent: 8,000)
      useGameStore.setState((s) => ({
        tiles: s.tiles.map((t) =>
          t.id === 1 || t.id === 3 ? { ...t, ownerId: 'player_1', houseCount: 0 } : t
        ),
        players: s.players.map((p, idx) =>
          idx === 0 ? { ...p, properties: [1, 3] } : p
        ),
        activePlayerIndex: 1, // Player 2 turn
      }));

      const p1MoneyBefore = useGameStore.getState().players[0].money;
      const p2MoneyBefore = useGameStore.getState().players[1].money;

      // Player 2 lands on Tile 1
      useGameStore.getState().rollDice([0, 1] as any);

      const state = useGameStore.getState();
      // Rent should be 6000 * 2 = 12000
      expect(state.players[1].money).toBe(p2MoneyBefore - 12000);
      expect(state.players[0].money).toBe(p1MoneyBefore + 12000);
    });

    it('should charge doubled rent on upgraded property when monopoly is held', () => {
      // ME_KONG group: Player 1 owns both Tile 1 and 3.
      // Tile 1 has 2 houses: rentMultiplier[2] = 90,000
      useGameStore.setState((s) => ({
        tiles: s.tiles.map((t) => {
          if (t.id === 1) return { ...t, ownerId: 'player_1', houseCount: 2 };
          if (t.id === 3) return { ...t, ownerId: 'player_1', houseCount: 0 };
          return t;
        }),
        players: s.players.map((p, idx) =>
          idx === 0 ? { ...p, properties: [1, 3] } : p
        ),
        activePlayerIndex: 1, // Player 2 turn
      }));

      const p1MoneyBefore = useGameStore.getState().players[0].money;
      const p2MoneyBefore = useGameStore.getState().players[1].money;

      // Player 2 lands on Tile 1
      useGameStore.getState().rollDice([0, 1] as any);

      const state = useGameStore.getState();
      // Rent = 90,000 * 2 = 180,000
      expect(state.players[1].money).toBe(p2MoneyBefore - 180000);
      expect(state.players[0].money).toBe(p1MoneyBefore + 180000);
    });
  });

  describe('7. Jail Mechanics (Bail, Free Card, Roll to Escape)', () => {
    it('should allow player to pay 100k bail to escape jail and route bail fee to jackpot fund', () => {
      useGameStore.setState((s) => ({
        jackpotFund: 50000,
        players: s.players.map((p, idx) =>
          idx === 0 ? { ...p, inJail: true, jailTurns: 3, position: 8 } : p
        ),
      }));

      const moneyBefore = useGameStore.getState().players[0].money;
      const jackpotBefore = useGameStore.getState().jackpotFund;
      const success = useGameStore.getState().payJailBail();

      expect(success).toBe(true);
      const p1 = useGameStore.getState().players[0];
      expect(p1.inJail).toBe(false);
      expect(p1.jailTurns).toBe(0);
      expect(p1.money).toBe(moneyBefore - 100000);
      expect(useGameStore.getState().jackpotFund).toBe(jackpotBefore + 100000);
    });

    it('should reject payJailBail and useJailFreeCard when gamePhase is not WAITING', () => {
      useGameStore.setState((s) => ({
        gamePhase: 'ROLLING',
        players: s.players.map((p, idx) =>
          idx === 0 ? { ...p, inJail: true, jailTurns: 3, position: 8, jailFreeCards: 1 } : p
        ),
      }));

      expect(useGameStore.getState().payJailBail()).toBe(false);
      expect(useGameStore.getState().useJailFreeCard()).toBe(false);
    });

    it('should allow player to escape jail using a jail-free card', () => {
      useGameStore.setState((s) => ({
        players: s.players.map((p, idx) =>
          idx === 0
            ? { ...p, inJail: true, jailTurns: 3, position: 8, jailFreeCards: 1 }
            : p
        ),
      }));

      const moneyBefore = useGameStore.getState().players[0].money;
      const success = useGameStore.getState().useJailFreeCard();

      expect(success).toBe(true);
      const p1 = useGameStore.getState().players[0];
      expect(p1.inJail).toBe(false);
      expect(p1.jailTurns).toBe(0);
      expect(p1.jailFreeCards).toBe(0);
      expect(p1.money).toBe(moneyBefore);
    });

    it('should escape jail and move if rolling double while in jail', () => {
      useGameStore.setState((s) => ({
        players: s.players.map((p, idx) =>
          idx === 0 ? { ...p, inJail: true, jailTurns: 3, position: 8 } : p
        ),
      }));

      useGameStore.getState().rollDice([2, 2]); // double -> escapes and moves 4
      const p1 = useGameStore.getState().players[0];

      expect(p1.inJail).toBe(false);
      expect(p1.jailTurns).toBe(0);
      expect(p1.position).toBe(12); // 8 + 4
    });

    it('should stay in jail and decrement jailTurns if rolling non-double', () => {
      useGameStore.setState((s) => ({
        players: s.players.map((p, idx) =>
          idx === 0 ? { ...p, inJail: true, jailTurns: 3, position: 8 } : p
        ),
      }));

      useGameStore.getState().rollDice([1, 2]); // non-double
      const p1 = useGameStore.getState().players[0];

      expect(p1.inJail).toBe(true);
      expect(p1.jailTurns).toBe(2);
      expect(p1.position).toBe(8); // Did not move
    });
  });

  describe('8. Chance & Fate Cards', () => {
    it('should apply CASH_GAIN card effect correctly', () => {
      const moneyBefore = useGameStore.getState().players[0].money;
      const gainCard = CHANCE_CARDS.find((c) => c.type === 'CASH_GAIN')!;

      useGameStore.getState().applyCardEffect(gainCard);
      expect(useGameStore.getState().players[0].money).toBe(moneyBefore + gainCard.amount!);
    });

    it('should apply TELEPORT card effect and award passing Go if applicable', () => {
      useGameStore.setState((s) => ({
        players: s.players.map((p, idx) =>
          idx === 0 ? { ...p, position: 28 } : p
        ),
      }));

      const moneyBefore = useGameStore.getState().players[0].money;
      const teleportCard = {
        id: 'test_teleport',
        title: 'Teleport to Phu Quoc',
        description: 'Bay thẳng ra Đảo Ngọc',
        type: 'TELEPORT' as const,
        targetTileId: 10,
      };

      useGameStore.getState().applyCardEffect(teleportCard);
      const p1 = useGameStore.getState().players[0];
      expect(p1.position).toBe(10);
      // Passing 0 from 28 to 10 awards +200k
      expect(p1.money).toBe(moneyBefore + 200000);
    });

    it('should grant jail free card with JAIL_FREE card effect', () => {
      const jailFreeCard = CHANCE_CARDS.find((c) => c.type === 'JAIL_FREE')!;
      useGameStore.getState().applyCardEffect(jailFreeCard);

      expect(useGameStore.getState().players[0].jailFreeCards).toBe(1);
    });

    it('should route penalty money into jackpotFund when player incurs CASH_LOSS', () => {
      const lossCard = CHANCE_CARDS.find((c) => c.type === 'CASH_LOSS')!;
      const moneyBefore = useGameStore.getState().players[0].money;
      const jackpotBefore = useGameStore.getState().jackpotFund;

      useGameStore.getState().applyCardEffect(lossCard);

      const state = useGameStore.getState();
      expect(state.players[0].money).toBe(moneyBefore - lossCard.amount!);
      expect(state.jackpotFund).toBe(jackpotBefore + lossCard.amount!);
    });

    it('should draw and apply card effect immediately when landing on CHANCE tile during rollDice', () => {
      // Tile 7 is CHANCE
      useGameStore.setState((s) => ({
        players: s.players.map((p, idx) =>
          idx === 0 ? { ...p, position: 5 } : p
        ),
      }));

      // Roll [1, 1] is a double (+50k bonus), lands on Tile 7 (5 + 2 = 7)
      // To test non-double: from position 4 with [1, 2] -> sum 3 -> lands on 7
      useGameStore.setState((s) => ({
        players: s.players.map((p, idx) =>
          idx === 0 ? { ...p, position: 4 } : p
        ),
      }));

      useGameStore.getState().rollDice([1, 2]);

      const state = useGameStore.getState();
      expect(state.currentCard).not.toBeNull();
      if (state.currentCard?.type === 'TELEPORT') {
        expect(state.players[0].position).toBe(state.currentCard.targetTileId);
      } else {
        expect(state.players[0].position).toBe(7);
      }
      expect(state.gamePhase).toBe('CARD_DRAWN');

      // Dismiss card modal
      useGameStore.getState().applyAndDismissCurrentCard();
      expect(useGameStore.getState().currentCard).toBeNull();
      expect(useGameStore.getState().gamePhase).toBe('TURN_END');
    });
  });

  describe('9. Bankruptcy & Victory Condition', () => {
    it('should mark player bankrupt and forfeit properties when cannot afford rent', () => {
      // 2-player game
      useGameStore.getState().initGame(2);

      useGameStore.setState((s) => ({
        tiles: s.tiles.map((t) => {
          if (t.id === 1) return { ...t, ownerId: 'player_1', houseCount: 3 }; // rent: 270,000
          if (t.id === 5) return { ...t, ownerId: 'player_2' };
          return t;
        }),
        players: [
          { ...s.players[0], properties: [1] },
          { ...s.players[1], money: 50000, properties: [5], position: 0 },
        ],
        activePlayerIndex: 1, // Player 2 turn
      }));

      const p1MoneyBefore = useGameStore.getState().players[0].money;

      // Player 2 lands on Tile 1 (rent 270,000 > Player 2 money 50,000)
      useGameStore.getState().rollDice([0, 1] as any);

      const state = useGameStore.getState();
      const p2 = state.players[1];
      const p1 = state.players[0];

      // Player 2 is bankrupt
      expect(p2.bankrupt).toBe(true);
      expect(p2.money).toBe(0);
      expect(p2.properties).toEqual([]);

      // All remaining cash transferred to creditor
      expect(p1.money).toBe(p1MoneyBefore + 50000);

      // Player 2's previous property should be released
      expect(state.tiles[5].ownerId).toBeNull();

      // Only 1 non-bankrupt player remains -> Game Over, Player 1 wins!
      expect(state.gamePhase).toBe('GAME_OVER');
      expect(state.winner?.id).toBe('player_1');
    });

    it('should continue game if more than 1 non-bankrupt player remains after a bankruptcy', () => {
      // 3-player game
      useGameStore.getState().initGame(3);

      useGameStore.setState((s) => ({
        tiles: s.tiles.map((t) =>
          t.id === 1 ? { ...t, ownerId: 'player_1', houseCount: 3 } : t
        ),
        players: [
          { ...s.players[0], properties: [1] },
          { ...s.players[1], money: 2000000 },
          { ...s.players[2], money: 10000, position: 0 },
        ],
        activePlayerIndex: 2, // Player 3 turn
      }));

      // Player 3 lands on Tile 1 (rent 270,000 > 10,000)
      useGameStore.getState().rollDice([0, 1] as any);

      const state = useGameStore.getState();
      expect(state.players[2].bankrupt).toBe(true);
      // 2 players still alive
      expect(state.gamePhase).not.toBe('GAME_OVER');
      expect(state.winner).toBeNull();
    });
  });
});

import { describe, it, expect } from 'vitest';
import { GameV2Bridge } from '../../src/renderer25d/gameV2Bridge';
import { Player, Tile } from '../../src/game/types';
import { BOARD_40_TILES } from '../../src/game/boardData';

describe('HUD v2 Overhaul Components and Logic Suite', () => {
  it('creates GameV2Bridge with custom human character', () => {
    const bridge = new GameV2Bridge(4, false, 1, 'co-hoa');
    const snap = bridge.getSnapshot();

    expect(snap.players[0].character).toBe('co-hoa');
    expect(snap.players[0].isBot).toBe(false);
    expect(snap.players.length).toBe(4);
    expect(snap.roundCount).toBe(1);
    bridge.destroy();
  });

  it('supports 2-player mode scoreboard configuration', () => {
    const bridge = new GameV2Bridge(2, false, 1, 'be-ti');
    const snap = bridge.getSnapshot();

    expect(snap.players.length).toBe(2);
    expect(snap.players[0].character).toBe('be-ti');
    expect(snap.players[1].isBot).toBe(true);
    bridge.destroy();
  });

  it('handles surrender logic correctly', () => {
    const bridge = new GameV2Bridge(4, false, 1, 'be-ti');
    bridge.surrender('player-1');
    const snap = bridge.getSnapshot();

    const human = snap.players.find((p) => p.id === 'player-1');
    expect(human?.bankrupt).toBe(true);
    bridge.destroy();
  });

  it('executes skill rolls: SHORT (2-4), LONG (10-12), and DOUBLE (12)', () => {
    const bridge = new GameV2Bridge(4, false, 1, 'be-ti');

    // Test SHORT
    const shortRoll = bridge.rollWithSkill('SHORT');
    const shortSum = shortRoll.dice[0] + shortRoll.dice[1];
    expect(shortSum).toBeGreaterThanOrEqual(2);
    expect(shortSum).toBeLessThanOrEqual(4);

    // End turn to roll again
    bridge.endTurn();

    // Test LONG
    const longRoll = bridge.rollWithSkill('LONG');
    const longSum = longRoll.dice[0] + longRoll.dice[1];
    expect(longSum).toBeGreaterThanOrEqual(10);
    expect(longSum).toBeLessThanOrEqual(12);

    bridge.endTurn();

    // Test DOUBLE
    const doubleRoll = bridge.rollWithSkill('DOUBLE');
    expect(doubleRoll.dice).toEqual([6, 6]);
    expect(doubleRoll.isDouble).toBe(true);

    bridge.destroy();
  });

  it('verifies tile purchase calculation and rent values for bottom-center card', () => {
    const tile: Tile = BOARD_40_TILES[1]; // Cà Mau
    expect(tile.name).toBe('Cà Mau');
    expect(tile.price).toBe(60000);
    expect(tile.baseRent).toBe(6000);
    expect(tile.rentMultiplier).toBeDefined();
    expect(tile.rentMultiplier![5]).toBe(720000); // Landmark rent
  });
});

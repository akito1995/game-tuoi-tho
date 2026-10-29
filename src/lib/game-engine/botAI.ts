/**
 * Vietnamese Childhood Games Portal - Cờ Tỷ Phú 3D Bot AI Engine
 * Decision-making module for single-player or mixed multiplayer bot opponents.
 */

import { GameState, GameSettings, Player, Tile, GamePhase } from './types';
import { checkColorMonopoly, calculateRent, GameStore } from './gameStore';

export interface BotTurnStore {
  getState: () => GameState & { settings?: GameSettings };
  rollDice?: (diceOverride?: [number, number]) => [number, number];
  buyProperty?: (tileId?: number) => boolean;
  upgradeProperty?: (tileId: number) => boolean;
  payJailBail?: () => boolean;
  useJailFreeCard?: () => boolean;
  dismissCard?: () => void;
  applyAndDismissCurrentCard?: () => void;
  endTurn?: () => void;
  setGamePhase?: (phase: GamePhase) => void;
}

export interface ExecuteBotTurnOptions {
  skipDelay?: boolean;
  diceOverride?: [number, number];
}

export const BOT_BANTER: Record<
  'BUY' | 'UPGRADE' | 'RENT_COLLECT' | 'RENT_PAY' | 'JAIL' | 'BANKRUPT',
  string[]
> = {
  BUY: [
    'Khu này xịn rồi nha!',
    'Mảnh đất này thuộc về tui rồi nha!',
    'Khu này tiềm năng lắm, phải chốt đơn ngay!',
    'Đầu tư cho tương lai nào!',
  ],
  UPGRADE: [
    'Vào resort tui uống nước miễn phí nè!',
    'Xây thêm nhà cho xôm tụ nào!',
    'Khách sạn 5 sao sắp khai trương rồi đó!',
    'Nâng cấp nhẹ, ai đi qua nhớ ủng hộ nhé!',
  ],
  RENT_COLLECT: [
    'Cảm ơn quý khách đã ghé thăm tệ xá!',
    'Tiền thuê đất xin cảm ơn nha!',
    'Kinh doanh thuận buồm xuôi gió ghê!',
    'Lần sau ghé tiếp ủng hộ tui nha!',
  ],
  RENT_PAY: [
    'Úi dồi ôi cay thế nhờ!',
    'Ai cho xin tí tiền lẻ!',
    'Đắt đỏ quá vậy, xót ví ghê!',
    'Đi đâu cũng gặp đất nhà người ta, hu hu!',
  ],
  JAIL: [
    'Đi bão tí mà bị phạt 100k, hu hu',
    'Vào đây nghỉ mát vài hôm vậy!',
    'Bị mấy chú công an hỏi thăm rồi!',
    'Oan quá bao đại nhân ơi!',
  ],
  BANKRUPT: [
    'Hết tiền rồi, ra đê ở thật rồi anh em ơi!',
    'Một lần chơi lớn xem ai có trầm trồ, giờ cháy túi!',
    'Trắng tay rồi, hẹn phục thù ván sau!',
    'Phá sản rồi, tạm biệt thế giới triệu phú!',
  ],
};

/**
 * Checks if purchasing the given tile would complete a regional color group monopoly for the player.
 */
function isRegionalMonopolyCompletion(player: Player, tile: Tile, allTiles: Tile[]): boolean {
  if (!tile.colorGroup) return false;
  const groupTiles = allTiles.filter((t) => t.colorGroup === tile.colorGroup);
  if (groupTiles.length <= 1) return false;
  return groupTiles.every((t) => t.id === tile.id || t.ownerId === player.id);
}

/**
 * Evaluates whether a bot should purchase an unowned property.
 *
 * Rules:
 * - Always buy if purchasing completes a regional color group monopoly (if cash >= price).
 * - Buy if remaining cash after purchase >= 300k VND.
 * - Skip if remaining cash would drop below 200k (unless it completes a monopoly).
 * - Between 200k and 300k reserve: buy if player already has progress in that color group, else skip.
 */
export function evaluateBuyDecision(player: Player, tile: Tile, allTiles: Tile[]): boolean {
  if (!tile) return false;
  if (tile.type !== 'PROPERTY' && tile.type !== 'TRANSPORT' && tile.type !== 'UTILITY') {
    return false;
  }
  if (tile.ownerId != null) return false;
  if (!tile.price || tile.price <= 0) return false;
  if (player.money < tile.price) return false;

  // Monopoly completion takes highest priority
  if (isRegionalMonopolyCompletion(player, tile, allTiles)) {
    return true;
  }

  const remainingCash = player.money - tile.price;
  if (remainingCash < 200_000) {
    return false;
  }

  if (remainingCash >= 300_000) {
    return true;
  }

  // Between 200k and 300k: buy if already owning another property in the group
  const hasGroupProgress = Boolean(
    tile.colorGroup &&
      allTiles.some(
        (t) => t.colorGroup === tile.colorGroup && t.id !== tile.id && t.ownerId === player.id
      )
  );

  return hasGroupProgress;
}

/**
 * Helper to calculate rent gain upon upgrading a tile by 1 house/resort.
 */
function calculateUpgradeRentGain(tile: Tile, allTiles: Tile[], playerId: string): number {
  const houseCount = tile.houseCount || 0;
  const currentRent = calculateRent(tile, allTiles);

  let nextRent = 0;
  if (tile.rentMultiplier && tile.rentMultiplier.length > houseCount + 1) {
    nextRent = tile.rentMultiplier[houseCount + 1];
  } else {
    nextRent = (tile.baseRent || 0) * (houseCount + 2);
  }

  if (tile.colorGroup && checkColorMonopoly(allTiles, tile.colorGroup, playerId)) {
    nextRent *= 2;
  }

  return nextRent - currentRent;
}

/**
 * Evaluates which property to upgrade, returning the tileId or null.
 *
 * Rules:
 * - Prioritize upgrading properties in completed color groups where rent is doubled.
 * - Only upgrade if remaining cash after house/resort cost >= 400k VND safety buffer.
 * - Selects the best property within the prioritized group (highest rent gain, then highest base rent).
 */
export function evaluateUpgradeDecision(
  player: Player,
  ownedTiles: Tile[],
  allTiles: Tile[]
): number | null {
  if (!ownedTiles || ownedTiles.length === 0) return null;

  const validCandidates = ownedTiles.filter((t) => {
    if (t.type !== 'PROPERTY') return false;
    if (t.ownerId !== player.id) return false;
    const currentCount = t.houseCount || 0;
    if (currentCount >= 4) return false;
    const housePrice = t.housePrice || 0;
    if (housePrice <= 0) return false;
    if (player.money - housePrice < 400_000) return false;
    return true;
  });

  if (validCandidates.length === 0) return null;

  // Group by monopoly status
  const monopolyCandidates = validCandidates.filter((t) =>
    checkColorMonopoly(allTiles, t.colorGroup, player.id)
  );

  const pool = monopolyCandidates.length > 0 ? monopolyCandidates : validCandidates;

  pool.sort((a, b) => {
    const gainA = calculateUpgradeRentGain(a, allTiles, player.id);
    const gainB = calculateUpgradeRentGain(b, allTiles, player.id);
    if (gainB !== gainA) return gainB - gainA;

    const baseA = a.baseRent || 0;
    const baseB = b.baseRent || 0;
    if (baseB !== baseA) return baseB - baseA;

    return a.id - b.id;
  });

  return pool[0].id;
}

/**
 * Evaluates bot decision when in jail.
 *
 * Rules:
 * - If player has jail free card, use it.
 * - If player cash >= 800k and jailTurns <= 1, pay bail (100k) to stay competitive.
 * - Otherwise try rolling dice.
 */
export function evaluateJailDecision(player: Player): 'USE_CARD' | 'PAY_BAIL' | 'ROLL' {
  const cards =
    player.jailFreeCards ??
    (player as { jailCardsCount?: number }).jailCardsCount ??
    0;

  if (cards > 0) return 'USE_CARD';

  if (player.money >= 800_000 && player.jailTurns <= 1) {
    return 'PAY_BAIL';
  }

  return 'ROLL';
}

/**
 * Returns a friendly Vietnamese banter string for the specified game event.
 */
export function getBotChatMessage(
  event: 'BUY' | 'UPGRADE' | 'RENT_COLLECT' | 'RENT_PAY' | 'JAIL' | 'BANKRUPT'
): string {
  const list = BOT_BANTER[event] || BOT_BANTER.BUY;
  return list[Math.floor(Math.random() * list.length)];
}

/**
 * Executes a full bot turn from WAITING to completion.
 */
export async function executeBotTurn(
  store: BotTurnStore,
  options?: ExecuteBotTurnOptions
): Promise<{ actionSummary: string[] }> {
  const skipDelay = options?.skipDelay ?? false;
  const delay = (ms: number) =>
    skipDelay ? Promise.resolve() : new Promise((resolve) => setTimeout(resolve, ms));

  const actionSummary: string[] = [];
  const getState = () => store.getState();

  const getAction = <T extends (...args: any[]) => any>(
    name: keyof BotTurnStore
  ): T | undefined => {
    const storeObj = store as unknown as Record<string, unknown>;
    if (typeof storeObj[name] === 'function') {
      return storeObj[name] as T;
    }
    const s = getState() as unknown as Record<string, unknown>;
    if (typeof s[name] === 'function') {
      return s[name] as T;
    }
    return undefined;
  };

  const rollDice = getAction<GameStore['rollDice']>('rollDice');
  const buyProperty = getAction<GameStore['buyProperty']>('buyProperty');
  const upgradeProperty = getAction<GameStore['upgradeProperty']>('upgradeProperty');
  const payJailBail = getAction<GameStore['payJailBail']>('payJailBail');
  const useJailFreeCard = getAction<GameStore['useJailFreeCard']>('useJailFreeCard');
  const dismissCard =
    getAction<() => void>('dismissCard') ||
    getAction<() => void>('applyAndDismissCurrentCard');
  const endTurn = getAction<GameStore['endTurn']>('endTurn');
  const setGamePhase = getAction<GameStore['setGamePhase']>('setGamePhase');

  let rollCount = 0;
  const startingPlayerIndex = getState().activePlayerIndex;

  while (rollCount < 4) {
    let state = getState();
    if (state.gamePhase === 'GAME_OVER' || state.winner != null) {
      actionSummary.push('GAME_OVER');
      break;
    }

    const player = state.players[state.activePlayerIndex];
    if (!player || player.bankrupt) {
      actionSummary.push('PLAYER_BANKRUPT');
      break;
    }

    // If active player shifted to another player, turn sequence is complete
    if (state.activePlayerIndex !== startingPlayerIndex && rollCount > 0) {
      break;
    }

    // 1. Jail handling
    if (player.inJail && (state.gamePhase === 'WAITING' || state.gamePhase === 'AWAIT_ROLL')) {
      const jailDecision = evaluateJailDecision(player);
      if (jailDecision === 'USE_CARD' && useJailFreeCard) {
        useJailFreeCard();
        actionSummary.push(`${player.name}: USE_JAIL_CARD`);
        await delay(200);
      } else if (jailDecision === 'PAY_BAIL' && payJailBail) {
        payJailBail();
        actionSummary.push(`${player.name}: PAY_BAIL`);
        await delay(200);
      } else {
        actionSummary.push(`${player.name}: ATTEMPT_JAIL_ROLL`);
      }
      state = getState();
    }

    // 2. Rolling dice
    if ((state.gamePhase === 'WAITING' || state.gamePhase === 'AWAIT_ROLL') && rollDice) {
      await delay(800);
      const diceResult = rollDice(options?.diceOverride);
      actionSummary.push(
        `${state.players[state.activePlayerIndex].name}: ROLLED [${diceResult[0]}, ${diceResult[1]}]`
      );
      rollCount++;
      state = getState();
    }

    // 3. Post-roll Action handling (waits until sequential animation phases finish)
    const animPhases: GamePhase[] = [
      'DICE_ROLLING',
      'DICE_RESULT',
      'TOKEN_MOVING',
      'PASS_GO_BONUS',
      'LANDING_REVEAL',
      'RESOLVE_TILE',
    ];
    let waitTicks = 0;
    while (animPhases.includes(getState().gamePhase) && waitTicks < 40) {
      await delay(200);
      waitTicks++;
    }
    state = getState();

    if (state.gamePhase === 'ACTION_REQUIRED' || state.gamePhase === 'AWAIT_DECISION') {
      await delay(1200);
      const activeP = state.players[state.activePlayerIndex];
      const landedTile = state.tiles[activeP.position];
      if (landedTile) {
        const shouldBuy = evaluateBuyDecision(activeP, landedTile, state.tiles);
        if (shouldBuy && buyProperty) {
          const bought = buyProperty(landedTile.id);
          if (bought) {
            actionSummary.push(`${activeP.name}: BOUGHT ${landedTile.name}`);
          } else {
            actionSummary.push(`${activeP.name}: BUY_FAILED ${landedTile.name}`);
          }
        } else {
          actionSummary.push(`${activeP.name}: SKIPPED_BUY ${landedTile.name}`);
          if (setGamePhase) setGamePhase('TURN_END');
        }
      }
      state = getState();
    }

    if (state.gamePhase === 'CARD_DRAWN') {
      // Pause so human player has time to read the card drawn by the bot
      await delay(3000);
      if (dismissCard) {
        actionSummary.push(`${state.players[state.activePlayerIndex].name}: DISMISSED_CARD`);
        dismissCard();
      }
      state = getState();
    }

    // 4. Upgrade evaluation: Bot ONLY upgrades if it landed on its OWN property, max 1 level per turn
    if (state.gamePhase === 'ACTION' || state.gamePhase === 'ACTION_REQUIRED' || state.gamePhase === 'AWAIT_DECISION') {
      const activeP = state.players[state.activePlayerIndex];
      const landedTile = state.tiles[activeP.position];
      if (
        landedTile &&
        landedTile.ownerId === activeP.id &&
        landedTile.type === 'PROPERTY' &&
        (landedTile.houseCount || 0) < 4 &&
        upgradeProperty
      ) {
        const shouldUpgrade = evaluateUpgradeDecision(activeP, [landedTile], state.tiles);
        if (shouldUpgrade !== null) {
          const success = upgradeProperty(landedTile.id);
          if (success) {
            actionSummary.push(`${activeP.name}: UPGRADED ${landedTile.name}`);
          }
        }
      }
      if (setGamePhase) setGamePhase('TURN_END');
      state = getState();
    }

    // 5. End Turn
    state = getState();
    if (state.gamePhase !== 'GAME_OVER' && endTurn) {
      actionSummary.push(`${state.players[state.activePlayerIndex]?.name}: END_TURN`);
      endTurn();
    }

    state = getState();
    if (state.activePlayerIndex !== startingPlayerIndex || state.gamePhase === 'GAME_OVER') {
      break;
    }

    // In case of extra turn from doubles, state is WAITING and player is same
    if (state.gamePhase !== 'WAITING') {
      break;
    }
  }

  return { actionSummary };
}

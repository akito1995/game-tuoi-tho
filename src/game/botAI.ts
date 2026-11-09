import { GameEngine, LINE_TILES, TRANSPORT_TILES } from './engine';
import { Player, Tile, BotDifficulty, SkillType } from './types';
import { GAME_CONFIG } from './gameConfig';

export const BOT_BANTER: Record<
  'BUY' | 'UPGRADE' | 'TAKEOVER' | 'RENT_COLLECT' | 'RENT_PAY' | 'JAIL' | 'BANKRUPT',
  string[]
> = {
  BUY: [
    'Mảnh đất này thuộc về tui rồi nha!',
    'Vị trí đắc địa thế này không chốt thì phí!',
    'Khu này tiềm năng lắm, đầu tư cho tương lai!',
    'Đất lành chim đậu, tui gom thêm một ô nữa!',
  ],
  UPGRADE: [
    'Xây thêm nhà cho xôm tụ nào!',
    'Nâng cấp biệt thự đón khách du lịch thôi!',
    'Công trình biểu tượng sắp khai trương rồi đó!',
    'Lên thêm tầng mới, giá trị tăng vọt!',
  ],
  TAKEOVER: [
    'Cú lật kèo ngoạn mục! Mảnh đất này giờ là của tui!',
    'Cảm ơn bạn đã xây nhà giúp, tui xin phép mua lại nha!',
    'Chi đậm 1.5 lần nhưng đáng từng xu từng cắc!',
    'Thời tới cản không kịp, đất vàng về tay chủ mới!',
  ],
  RENT_COLLECT: [
    'Cảm ơn quý khách đã ghé thăm tệ xá!',
    'Xin chút tiền thuê đất uống trà đá nha!',
    'Kinh doanh thuận buồm xuôi gió ghê!',
    'Lần sau ghé tiếp ủng hộ tui nhé bạn hiền!',
  ],
  RENT_PAY: [
    'Úi dồi ôi cay thế nhờ, xót ví ghê!',
    'Ai cho tui xin miếng tiền lẻ với!',
    'Đi đâu cũng vấp phải đất nhà người ta, hu hu!',
    'Tạm ứng tí tiền thuê, lát tui lấy lại gấp đôi!',
  ],
  JAIL: [
    'Bị mấy chú công an hỏi thăm rồi, hu hu!',
    'Vào đây nghỉ mát uống chén trà vài hôm!',
    'Oan quá bao đại nhân ơi!',
    'Đi bão hơi nhiệt tình nên vào đây tạm trú!',
  ],
  BANKRUPT: [
    'Trắng tay rồi, ra đê hóng gió thôi anh em ơi!',
    'Một lần chơi lớn xem ai có trầm trồ, giờ cháy túi!',
    'Hết tiền rồi, hẹn phục thù ván sau!',
    'Tạm biệt thế giới triệu phú, hẹn ngày tái xuất!',
  ],
};

export function getBotChatMessage(
  event: 'BUY' | 'UPGRADE' | 'TAKEOVER' | 'RENT_COLLECT' | 'RENT_PAY' | 'JAIL' | 'BANKRUPT'
): string {
  const list = BOT_BANTER[event] || BOT_BANTER.BUY;
  return list[Math.floor(Math.random() * list.length)];
}

/**
 * Đánh giá quyết định Mua đất trống của Bot phù hợp với vốn thấp
 * Quy tắc cốt lõi: Giữ lại ít nhất GAME_CONFIG.BOT_CASH_RESERVE (150K)
 * Ưu tiên hoàn thành nhóm màu độc quyền và tuyến giao thông.
 */
export function evaluateBotBuy(
  player: Player,
  tile: Tile,
  allTiles: Tile[],
  roundCount: number = 1
): boolean {
  if (!tile || tile.ownerId != null || !tile.price) return false;

  const basePrice = tile.price;
  const houseCost = tile.housePrice || 50000;
  const totalPrice = roundCount >= 2 && tile.type === 'PROPERTY' ? basePrice + houseCost : basePrice;

  // Bắt buộc: Tiền mặt sau khi mua phải còn ít nhất CASH_RESERVE (150.000đ)
  const cashReserve = GAME_CONFIG.BOT_CASH_RESERVE;
  if (player.money - basePrice < cashReserve) {
    return false;
  }

  // 1. Ưu tiên số 1: Mua ô này giúp hoàn thành trọn bộ màu độc quyền (Monopoly) -> Mua ngay!
  if (tile.colorGroup && tile.colorGroup !== 'TRANSPORT' && tile.colorGroup !== 'UTILITY') {
    const groupTiles = allTiles.filter((t) => t.colorGroup === tile.colorGroup);
    const willMonopolize = groupTiles.every((t) => t.id === tile.id || t.ownerId === player.id);
    if (willMonopolize) return true;
  }

  // 2. Ưu tiên số 2: Tuyến giao thông hoặc Tiện ích quốc gia
  if (tile.type === 'TRANSPORT' || tile.type === 'UTILITY') {
    return true;
  }

  // 3. Ưu tiên số 3: Ô cùng màu với ô bot đã sở hữu trước đó (xây dựng cụm màu)
  if (tile.colorGroup) {
    const hasSibling = allTiles.some(
      (t) => t.colorGroup === tile.colorGroup && t.id !== tile.id && t.ownerId === player.id
    );
    if (hasSibling) return true;
  }

  // 4. Nếu là ô đất thường độc lập: mua nếu tiền mặt sau khi mua còn dồi dào (dư trên 180K)
  const remaining = player.money - totalPrice;
  return remaining >= cashReserve + 30000;
}

/**
 * Đánh giá quyết định Nâng cấp nhà của Bot
 * Ưu tiên xây nhà trên nhóm đã sở hữu đủ màu độc quyền
 * Chỉ xây khi sau nâng cấp vẫn còn quỹ dự phòng an toàn (150K)
 */
export function evaluateBotUpgrade(player: Player, allTiles: Tile[]): number | null {
  const minBuffer = GAME_CONFIG.BOT_CASH_RESERVE;

  const owned = allTiles.filter((t) => {
    if (t.ownerId !== player.id || t.type !== 'PROPERTY' || t.hasLandmark || t.isMortgaged) return false;
    const cost = (t.houseCount || 0) >= 4 ? (t.landmarkPrice || 100000) : (t.housePrice || 50000);
    // Điều kiện Landmark: Cần hoàn thành ít nhất 2 vòng bản đồ
    if ((t.houseCount || 0) >= 4 && player.lapsCompleted < 2) return false;
    return player.money - cost >= minBuffer;
  });

  if (owned.length === 0) return null;

  // Ưu tiên 1: Nâng cấp trên các ô thuộc cụm màu độc quyền (Monopoly)
  const monopolyOwned = owned.filter((t) => {
    if (!t.colorGroup) return false;
    const group = allTiles.filter((gt) => gt.colorGroup === t.colorGroup);
    return group.every((gt) => gt.ownerId === player.id);
  });

  const pool = monopolyOwned.length > 0 ? monopolyOwned : owned;

  // Ưu tiên 2: Ô sắp lên Landmark (cấp 4 lên Landmark thu tiền khủng)
  const nearLandmark = pool.filter((t) => (t.houseCount || 0) >= 4 && player.lapsCompleted >= 2);
  if (nearLandmark.length > 0) return nearLandmark[0].id;

  // Ưu tiên 3: Ô có ít nhà hơn trong nhóm để xây đều (cấp 0 -> 1 -> 2...)
  pool.sort((a, b) => {
    const houseDiff = (a.houseCount || 0) - (b.houseCount || 0);
    if (houseDiff !== 0) return houseDiff;
    return (b.price || 0) - (a.price || 0);
  });

  return pool[0]?.id ?? null;
}

/**
 * Đánh giá quyết định Mua lại đất đối thủ (1.5x)
 */
export function evaluateBotTakeover(player: Player, tile: Tile, allTiles: Tile[]): boolean {
  if (!tile || !tile.ownerId || tile.ownerId === player.id || tile.hasLandmark) return false;

  const difficulty: BotDifficulty = player.botDifficulty || 'NORMAL';
  const takeoverPrice = Math.round(1.5 * (tile.investmentCost || tile.price || 100000));
  if (player.money < takeoverPrice) return false;

  // DỄ: Rất ít khi mua lại (chỉ mua nếu quá giàu)
  if (difficulty === 'EASY') {
    return player.money - takeoverPrice >= 1200000 && Math.random() < 0.25;
  }

  // KHÓ: Tấn công chiến thuật
  if (difficulty === 'HARD') {
    // 1. Mua lại giúp bot hoàn thành độc quyền màu
    if (tile.colorGroup) {
      const group = allTiles.filter((t) => t.colorGroup === tile.colorGroup);
      const completesMonopoly = group.every((t) => t.id === tile.id || t.ownerId === player.id);
      if (completesMonopoly && player.money - takeoverPrice >= 200000) return true;
    }

    // 2. Chặn đối thủ sắp hoàn thành độc quyền màu
    const opponentId = tile.ownerId;
    if (tile.colorGroup) {
      const group = allTiles.filter((t) => t.colorGroup === tile.colorGroup);
      const opponentCount = group.filter((t) => t.ownerId === opponentId).length;
      if (opponentCount >= group.length - 1 && player.money - takeoverPrice >= 250000) {
        return true; // Phá cụm độc quyền của đối thủ!
      }
    }

    // 3. Đất đã có 3-4 nhà (thu tiền thuê khủng)
    if ((tile.houseCount || 0) >= 3 && player.money - takeoverPrice >= 300000) {
      return true;
    }
  }

  // THƯỜNG: Mua nếu hoàn thành cụm màu hoặc còn dư dả trên 400K
  if (tile.colorGroup) {
    const group = allTiles.filter((t) => t.colorGroup === tile.colorGroup);
    const completesMonopoly = group.every((t) => t.id === tile.id || t.ownerId === player.id);
    if (completesMonopoly) return true;
  }

  return player.money - takeoverPrice >= 400000;
}

/**
 * Bot tự giải cứu tài chính khi bị nợ tiền (Bán nhà -> Cầm cố đất -> Phá sản)
 */
export function executeBotDebtRelief(engine: GameEngine, player: Player): void {
  const debt = engine.state.pendingDebt;
  if (!debt || debt.debtorId !== player.id) return;

  const targetAmount = debt.amountOwed;

  // 1. Bán nhà trên đất không thuộc cụm màu độc quyền trước
  while (engine.state.pendingDebt && player.money < targetAmount) {
    const tilesWithHouses = engine.state.tiles.filter(
      (t) => t.ownerId === player.id && (t.houseCount || 0) > 0
    );
    if (tilesWithHouses.length === 0) break;

    // Sắp xếp: ô không có monopoly bán trước, giá thấp bán trước
    tilesWithHouses.sort((a, b) => {
      const aMono = a.colorGroup ? engine.checkColorMonopoly(a.colorGroup, player.id) : false;
      const bMono = b.colorGroup ? engine.checkColorMonopoly(b.colorGroup, player.id) : false;
      if (aMono !== bMono) return aMono ? 1 : -1;
      return (a.housePrice || 0) - (b.housePrice || 0);
    });

    engine.sellHouse(player.id, tilesWithHouses[0].id);
  }

  if (!engine.state.pendingDebt) {
    return;
  }

  // 2. Cầm cố đất chưa có nhà
  while (engine.state.pendingDebt && player.money < targetAmount) {
    const mortgageCandidates = engine.state.tiles.filter(
      (t) => t.ownerId === player.id && !t.isMortgaged && (t.houseCount || 0) === 0 && !t.hasLandmark
    );
    if (mortgageCandidates.length === 0) break;

    // Sắp xếp: ưu tiên ô không có monopoly, giá trị thấp trước
    mortgageCandidates.sort((a, b) => {
      const aMono = a.colorGroup ? engine.checkColorMonopoly(a.colorGroup, player.id) : false;
      const bMono = b.colorGroup ? engine.checkColorMonopoly(b.colorGroup, player.id) : false;
      if (aMono !== bMono) return aMono ? 1 : -1;
      return (a.price || 0) - (b.price || 0);
    });

    engine.mortgageProperty(player.id, mortgageCandidates[0].id);
  }

  if (!engine.state.pendingDebt) {
    return;
  }

  if (player.money >= targetAmount) {
    engine.checkPendingDebtResolved();
  } else {
    // Đã bán hết nhà và cầm cố toàn bộ đất mà vẫn không đủ tiền -> Phá sản!
    engine.declareBankruptcy(player.id);
  }
}

/**
 * Xử lý ra tù của Bot
 */
export function evaluateBotJailDecision(player: Player): 'USE_CARD' | 'PAY_BAIL' | 'ROLL' {
  if (player.jailFreeCards > 0) return 'USE_CARD';
  if (player.money >= 300000 && player.jailTurns <= 1) return 'PAY_BAIL';
  return 'ROLL';
}

/**
 * Thực thi một lượt chơi tự động hoàn chỉnh của Bot
 */
export async function executeBotTurn(engine: GameEngine): Promise<void> {
  let rollCount = 0;
  const startingPlayerIndex = engine.state.activePlayerIndex;

  while (rollCount < 4) {
    const activePlayer = engine.getActivePlayer();
    if (!activePlayer.isBot || activePlayer.bankrupt || engine.state.gamePhase === 'GAME_OVER') {
      return;
    }

    if (engine.state.activePlayerIndex !== startingPlayerIndex && rollCount > 0) {
      return;
    }

    // 1. Nếu đang trong trạng thái nợ tiền
    if (engine.state.gamePhase === 'DEBT_RELIEF') {
      executeBotDebtRelief(engine, activePlayer);
      return;
    }

    // 2. Nếu đang trong tù
    if (activePlayer.inJail && engine.state.gamePhase === 'AWAIT_ROLL') {
      const jailDecision = evaluateBotJailDecision(activePlayer);
      if (jailDecision === 'USE_CARD') {
        engine.useJailFreeCard(activePlayer.id);
      } else if (jailDecision === 'PAY_BAIL') {
        engine.payJailBail(activePlayer.id);
      }
    }

    // 3. Đổ xúc xắc (với AI sử dụng kỹ năng thông minh)
    if (engine.state.gamePhase === 'AWAIT_ROLL') {
      const active = activePlayer;
      let usedSkill: SkillType | null = null;
      let chosenDice: [number, number] | undefined = undefined;
      let isSkillRoll = false;

      if (engine.state.roundCount >= 2 && rollCount === 0 && !active.inJail && active.skillCards && active.skillCards.length > 0) {
        const curPos = active.position;
        // Kiểm tra xem 2~4 ô tiếp theo có ô đất trống tiềm năng không
        const shortIndex = active.skillCards.indexOf('SHORT');
        if (shortIndex !== -1) {
          for (let step = 2; step <= 4; step++) {
            const targetTile = engine.state.tiles[(curPos + step) % 40];
            if (targetTile && targetTile.ownerId == null && targetTile.price && active.money > targetTile.price + 150000) {
              usedSkill = 'SHORT';
              active.skillCards.splice(shortIndex, 1);
              const choices: Array<[number, number]> = [[1, 1], [1, 2], [2, 1], [1, 3], [3, 1], [2, 2]];
              chosenDice = choices[Math.floor(Math.random() * choices.length)];
              isSkillRoll = true;
              break;
            }
          }
        }

        // Nếu chưa dùng SHORT, kiểm tra LONG (10~12 ô tiếp theo)
        if (!usedSkill) {
          const longIndex = active.skillCards.indexOf('LONG');
          if (longIndex !== -1) {
            for (let step = 10; step <= 12; step++) {
              const targetTile = engine.state.tiles[(curPos + step) % 40];
              if (targetTile && targetTile.ownerId == null && targetTile.price && active.money > targetTile.price + 150000) {
                usedSkill = 'LONG';
                active.skillCards.splice(longIndex, 1);
                const choices: Array<[number, number]> = [[5, 5], [4, 6], [6, 4], [5, 6], [6, 5], [6, 6]];
                chosenDice = choices[Math.floor(Math.random() * choices.length)];
                isSkillRoll = true;
                break;
              }
            }
          }
        }

        // Nếu chưa dùng và có DOUBLE (chỉ dùng khi không ở tù): nếu bot có tiền dồi dào
        if (!usedSkill && !active.inJail) {
          const doubleIndex = active.skillCards.indexOf('DOUBLE');
          if (doubleIndex !== -1 && active.money >= 300000 && Math.random() < 0.25) {
            usedSkill = 'DOUBLE';
            active.skillCards.splice(doubleIndex, 1);
            chosenDice = [6, 6];
            isSkillRoll = false; // Đôi x6 vẫn được tính đổ đôi
          }
        }
      }

      if (usedSkill) {
        const skillNameMap: Record<SkillType, string> = { SHORT: 'Nhảy 2~4', LONG: 'Nhảy 10~12', DOUBLE: 'Đôi ×6' };
        engine.addLog(`🤖 ${active.name} dùng kỹ năng "${skillNameMap[usedSkill]}".`);
        engine.rollDice(chosenDice, { isSkillRoll });
      } else {
        engine.rollDice();
      }
      rollCount++;
    }

    // 4. Nếu đang chờ rút thẻ bài
    if (engine.state.gamePhase === 'CARD_DRAWN' && engine.state.currentCard) {
      engine.applyCardEffect(engine.state.currentCard);
    }

    // 5. Nếu đang chờ quyết định mua hoặc nâng cấp (kể cả sau khi đi xúc xắc hoặc sau khi bị thẻ dịch chuyển đến đất trống)
    if (engine.state.gamePhase === 'AWAIT_DECISION') {
      const tile = engine.getTile(activePlayer.position);
      if (tile && tile.ownerId == null) {
        if (evaluateBotBuy(activePlayer, tile, engine.state.tiles, engine.state.roundCount)) {
          engine.buyProperty(activePlayer.id, tile.id, engine.state.roundCount >= 2);
        } else {
          engine.skipBuy(activePlayer.id, tile.id);
        }
      } else if (tile && tile.ownerId === activePlayer.id) {
        const upgradeTileId = evaluateBotUpgrade(activePlayer, engine.state.tiles);
        if (upgradeTileId !== null) {
          engine.upgradeProperty(activePlayer.id, upgradeTileId);
        } else {
          engine.skipUpgrade(activePlayer.id, tile.id);
        }
      } else {
        engine.completeAction();
      }
    }

    // 6. Nếu đang chờ quyết định mua lại đất đối thủ (1.5x)
    if (engine.state.gamePhase === 'AWAIT_TAKEOVER') {
      const tile = engine.getTile(activePlayer.position);
      if (tile && evaluateBotTakeover(activePlayer, tile, engine.state.tiles)) {
        engine.takeoverProperty(activePlayer.id, tile.id);
      } else {
        engine.skipTakeover();
      }
    }

    // 7. Nếu vừa đổ đôi và được thưởng thêm lượt (gamePhase quay lại AWAIT_ROLL và activePlayerIndex giữ nguyên)
    if (
      engine.state.isDouble &&
      !activePlayer.inJail &&
      engine.state.doubleStreak < 3 &&
      engine.state.gamePhase === 'AWAIT_ROLL' &&
      engine.state.activePlayerIndex === startingPlayerIndex
    ) {
      // Tiếp tục vòng lặp để Bot tự đổ tiếp lượt thưởng
      continue;
    }

    break;
  }
}

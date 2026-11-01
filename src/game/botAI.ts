import { GameEngine } from './engine';
import { Player, Tile } from './types';

export const BOT_BANTER: Record<
  'BUY' | 'UPGRADE' | 'RENT_COLLECT' | 'RENT_PAY' | 'JAIL' | 'BANKRUPT',
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
  event: 'BUY' | 'UPGRADE' | 'RENT_COLLECT' | 'RENT_PAY' | 'JAIL' | 'BANKRUPT'
): string {
  const list = BOT_BANTER[event] || BOT_BANTER.BUY;
  return list[Math.floor(Math.random() * list.length)];
}

export function evaluateBotBuy(player: Player, tile: Tile, allTiles: Tile[]): boolean {
  if (!tile || tile.ownerId != null || !tile.price) return false;
  if (player.money < tile.price) return false;

  // Kiểm tra nếu mua ô này sẽ hoàn thành cụm màu độc quyền (Monopoly) -> ƯU TIÊN MUA NGAY
  if (tile.colorGroup) {
    const groupTiles = allTiles.filter((t) => t.colorGroup === tile.colorGroup);
    if (groupTiles.length > 1) {
      const willCompleteMonopoly = groupTiles.every(
        (t) => t.id === tile.id || t.ownerId === player.id
      );
      if (willCompleteMonopoly) return true;
    }
  }

  const remainingCash = player.money - tile.price;
  // Cần giữ ít nhất 200k an toàn
  if (remainingCash < 200000) return false;

  // Dư dả trên 300k thì mua thoải mái
  if (remainingCash >= 300000) return true;

  // Trong khoảng 200k - 300k: mua nếu đã sở hữu ít nhất 1 ô cùng màu
  const hasGroupProgress = Boolean(
    tile.colorGroup &&
      allTiles.some(
        (t) => t.colorGroup === tile.colorGroup && t.id !== tile.id && t.ownerId === player.id
      )
  );

  return hasGroupProgress;
}

export function evaluateBotUpgrade(player: Player, allTiles: Tile[]): number | null {
  const ownedCandidates = allTiles.filter((t) => {
    if (t.ownerId !== player.id || t.type !== 'PROPERTY') return false;
    if (t.hasLandmark) return false;
    const cost = t.housePrice || 50000;
    if (player.money - cost < 300000) return false; // Giữ quỹ an toàn 300k
    return true;
  });

  if (ownedCandidates.length === 0) return null;

  // Ưu tiên các ô trong cụm màu độc quyền
  const monopolyCandidates = ownedCandidates.filter((t) => {
    if (!t.colorGroup) return false;
    const groupTiles = allTiles.filter((gt) => gt.colorGroup === t.colorGroup);
    return groupTiles.every((gt) => gt.ownerId === player.id);
  });

  const pool = monopolyCandidates.length > 0 ? monopolyCandidates : ownedCandidates;

  // Sắp xếp ưu tiên ô có giá trị thuê tăng cao nhất
  pool.sort((a, b) => {
    const rentA = a.baseRent || 0;
    const rentB = b.baseRent || 0;
    return rentB - rentA;
  });

  return pool[0]?.id ?? null;
}

export function evaluateBotJailDecision(player: Player): 'USE_CARD' | 'PAY_BAIL' | 'ROLL' {
  if (player.jailFreeCards > 0) return 'USE_CARD';
  if (player.money >= 600000 && player.jailTurns <= 1) return 'PAY_BAIL';
  return 'ROLL';
}

/**
 * Thực thi một lượt chơi tự động hoàn chỉnh của Bot
 */
export async function executeBotTurn(engine: GameEngine): Promise<void> {
  const activePlayer = engine.getActivePlayer();
  if (!activePlayer.isBot || activePlayer.bankrupt || engine.state.gamePhase === 'GAME_OVER') {
    return;
  }

  // 1. Nếu đang trong tù
  if (activePlayer.inJail) {
    const jailDecision = evaluateBotJailDecision(activePlayer);
    if (jailDecision === 'USE_CARD') {
      engine.useJailFreeCard(activePlayer.id);
    } else if (jailDecision === 'PAY_BAIL') {
      engine.payJailBail(activePlayer.id);
    }
  }

  // 2. Đổ xúc xắc
  if (engine.state.gamePhase === 'AWAIT_ROLL') {
    engine.rollDice();
  }

  // 3. Nếu đang chờ rút thẻ bài
  if (engine.state.gamePhase === 'CARD_DRAWN' && engine.state.currentCard) {
    engine.applyCardEffect(engine.state.currentCard);
  }

  // 4. Nếu đang chờ quyết định mua hoặc nâng cấp
  if (engine.state.gamePhase === 'AWAIT_DECISION') {
    const tile = engine.getTile(activePlayer.position);
    if (tile && tile.ownerId == null) {
      if (evaluateBotBuy(activePlayer, tile, engine.state.tiles)) {
        engine.buyProperty(activePlayer.id, tile.id);
      } else {
        engine.state.gamePhase = 'TURN_END';
      }
    } else if (tile && tile.ownerId === activePlayer.id) {
      // Cân nhắc nâng cấp
      const upgradeTileId = evaluateBotUpgrade(activePlayer, engine.state.tiles);
      if (upgradeTileId !== null) {
        engine.upgradeProperty(activePlayer.id, upgradeTileId);
      } else {
        engine.state.gamePhase = 'TURN_END';
      }
    }
  }

  // 5. Kết thúc lượt
  if (engine.state.gamePhase === 'TURN_END') {
    engine.endTurn();
  }
}

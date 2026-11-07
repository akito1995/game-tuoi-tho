import { describe, it, expect, beforeEach } from 'vitest';
import { GameEngine } from '@/game/engine';
import { executeBotTurn } from '@/game/botAI';
import { canPlayerRoll, canPlayerEndTurn } from '@/components/games/co-ty-phu/hud/hudHelpers';
import { Tile } from '@/game/types';

describe('Kiểm thử Bộ 5 Quy tắc Xúc xắc & Bot Turn Engine', () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine({
      playerCount: 4,
      startingCash: 1500000,
      botDifficulty: 'NORMAL',
    });
  });

  describe('1. Bot đổ đôi: được đổ thêm lượt giống người chơi', () => {
    it('Bot đổ đôi ở lần 1 thì tiếp tục đổ lần 2, không chuyển lượt sang người khác giữa chừng', async () => {
      // Đặt người chơi 1 là Bot
      engine.state.activePlayerIndex = 1;
      const bot = engine.getActivePlayer();
      expect(bot.isBot).toBe(true);
      const startingPlayerId = bot.id;

      // Mock rollDice: lần 1 đổ [2, 2] (đôi), lần 2 đổ [1, 3] (không đôi)
      const originalRollDice = engine.rollDice.bind(engine);
      let rollCallCount = 0;
      engine.rollDice = (overrideDice?: [number, number], options?: { isSkillRoll?: boolean }) => {
        rollCallCount++;
        if (rollCallCount === 1) {
          return originalRollDice([2, 2], options);
        } else {
          return originalRollDice([1, 3], options);
        }
      };

      // Thực thi lượt tự động của Bot
      await executeBotTurn(engine);

      // Bot phải được đổ đúng 2 lần
      expect(rollCallCount).toBe(2);

      // Sau khi đổ lần 2 (không đôi), lượt mới kết thúc và chuyển sang người tiếp theo
      expect(engine.state.activePlayerIndex).not.toBe(1);
    });

    it('endTurn() không vô tình cướp lượt khi isDouble = true và doubleStreak < 3', () => {
      // Bé Tí (người chơi 0) đổ đôi [3, 3]
      engine.rollDice([3, 3]);
      expect(engine.state.isDouble).toBe(true);
      expect(engine.state.doubleStreak).toBe(1);

      // Nếu có sự kiện hoặc watchdog vô tình gọi endTurn()
      engine.endTurn();

      // Vẫn phải giữ nguyên lượt của người chơi 0 để đổ tiếp
      expect(engine.state.activePlayerIndex).toBe(0);
      expect(engine.state.gamePhase).toBe('AWAIT_ROLL');
    });
  });

  describe('2. Đổ đôi 3 lần liên tiếp bị tống vào tù (dùng doubleStreak)', () => {
    it('Lần 1 và 2 tăng streak, lần 3 đổ đôi tống thẳng vào tù và kết thúc lượt ngay lập tức', () => {
      const player = engine.getActivePlayer();
      expect(player.position).toBe(0);

      // Lần 1: Đổ đôi [1, 1]
      engine.rollDice([1, 1]);
      expect(engine.state.isDouble).toBe(true);
      expect(engine.state.doubleStreak).toBe(1);
      engine.completeAction();
      expect(engine.state.activePlayerIndex).toBe(0); // Vẫn là player 0

      // Lần 2: Đổ đôi [2, 2]
      engine.rollDice([2, 2]);
      expect(engine.state.isDouble).toBe(true);
      expect(engine.state.doubleStreak).toBe(2);
      engine.completeAction();
      expect(engine.state.activePlayerIndex).toBe(0); // Vẫn là player 0

      // Lần 3: Đổ đôi [4, 4] -> Đi bão 3 lần liên tiếp!
      const result3 = engine.rollDice([4, 4]);

      // Phải bị tống thẳng vào tù (ô 10)
      expect(player.inJail).toBe(true);
      expect(player.position).toBe(10);
      expect(player.jailTurns).toBe(3);

      // Chuỗi đôi reset về 0 và không còn cờ isDouble
      expect(engine.state.doubleStreak).toBe(0);
      expect(engine.state.isDouble).toBe(false);
      expect(result3.isDouble).toBe(false);

      // Lượt phải kết thúc ngay và chuyển sang người chơi tiếp theo (index 1)
      expect(engine.state.activePlayerIndex).toBe(1);
    });
  });

  describe('3. Ra tù nhờ đổ đôi: chỉ di chuyển, KHÔNG được đổ thêm lượt', () => {
    it('Đang ở trong tù đổ đôi -> thoát tù, đi số bước đổ được, nhưng isDouble = false và hết lượt', () => {
      const player = engine.getActivePlayer();
      player.inJail = true;
      player.jailTurns = 3;
      player.position = 10;

      // Đang trong tù đổ [5, 5] (đôi)
      const result = engine.rollDice([5, 5]);

      // Thoát tù thành công
      expect(player.inJail).toBe(false);
      expect(player.jailTurns).toBe(0);

      // isDouble bị reset thành false, không được thưởng thêm lượt
      expect(result.isDouble).toBe(false);
      expect(engine.state.isDouble).toBe(false);
      expect(engine.state.doubleStreak).toBe(0);

      // Khi kết thúc hành động tại ô mới (ô 20 REST tự động completeAction), lượt phải chuyển sang người kế tiếp
      expect(engine.state.activePlayerIndex).toBe(1);
    });
  });

  describe('4. Kỹ năng "Nhảy 2~4" và "Nhảy 10~12" không tính là đổ đôi', () => {
    it('Đổ bằng isSkillRoll = true dù có 2 mặt xúc xắc trùng nhau ([6, 6]) cũng không tính là đôi', () => {
      // Giả lập xúc xắc ra [6, 6] nhưng do dùng thẻ kỹ năng
      const result = engine.rollDice([6, 6], { isSkillRoll: true });

      // Không được xem là đổ đôi
      expect(result.isDouble).toBe(false);
      expect(engine.state.isDouble).toBe(false);
      expect(engine.state.doubleStreak).toBe(0);

      // Sau khi hoàn thành hành động, lượt phải kết thúc sang người tiếp theo
      engine.completeAction();
      expect(engine.state.activePlayerIndex).toBe(1);
    });

    it('Hàm useSkillCard SHORT tự động gán isSkillRoll: true', () => {
      const player = engine.getActivePlayer();
      player.skillCards = ['SHORT'];

      const result = engine.useSkillCard(player.id, 'SHORT');

      // Kết quả sum phải nằm trong [2, 4] và không bao giờ là isDouble
      expect(result.sum).toBeGreaterThanOrEqual(2);
      expect(result.sum).toBeLessThanOrEqual(4);
      expect(result.isDouble).toBe(false);
      expect(engine.state.isDouble).toBe(false);
    });
  });

  describe('5. Bot bị thẻ dịch chuyển tới ô đất chưa có chủ: tự động chạy lại logic mua đất', () => {
    it('Bot bốc thẻ TELEPORT tới ô đất trống -> tự động thẩm định và mua ô đất đó', async () => {
      // Đặt lượt của Bot Cô Hoa
      engine.state.activePlayerIndex = 1;
      const bot = engine.getActivePlayer();
      expect(bot.isBot).toBe(true);

      // Đảm bảo ô số 1 (Tràng Tiền) chưa có chủ và bot đủ tiền mua
      const targetTile = engine.getTile(1);
      expect(targetTile.ownerId).toBeNull();
      expect(bot.money).toBeGreaterThan(targetTile.price || 60000);

      // Giả lập Bot rút trúng thẻ TELEPORT tới ô 1
      engine.state.currentCard = {
        id: 'chance-teleport-test',
        title: 'Chuyến đi bất ngờ',
        description: 'Dịch chuyển tức thời tới Tràng Tiền',
        type: 'TELEPORT',
        targetTileId: 1,
      };
      engine.state.gamePhase = 'CARD_DRAWN';

      // Bot thực thi lượt của mình
      await executeBotTurn(engine);

      // Bot phải được dịch chuyển đến ô 1
      expect(bot.position).toBe(1);

      // Và Bot phải tự động quyết định mua thành công ô đất 1
      expect(targetTile.ownerId).toBe(bot.id);
    });
  });

  describe('6. Chặn đổ xúc xắc khi đang mở popup (AWAIT_DECISION, CARD_DRAWN) & Ghi log khi bỏ qua', () => {
    it('Chặn rollDice() khi gamePhase là AWAIT_DECISION hoặc CARD_DRAWN', () => {
      engine.state.gamePhase = 'AWAIT_DECISION';
      expect(() => engine.rollDice()).toThrow(/Không thể đổ xúc xắc khi đang ở trạng thái AWAIT_DECISION/);

      engine.state.gamePhase = 'CARD_DRAWN';
      expect(() => engine.rollDice()).toThrow(/Không thể đổ xúc xắc khi đang ở trạng thái CARD_DRAWN/);
    });

    it('canPlayerRoll và canPlayerEndTurn trả về false khi đang AWAIT_DECISION hoặc CARD_DRAWN', () => {
      const human = engine.state.players[0];
      expect(canPlayerRoll(human, 'AWAIT_DECISION')).toBe(false);
      expect(canPlayerEndTurn(human, 'AWAIT_DECISION')).toBe(false);

      expect(canPlayerRoll(human, 'CARD_DRAWN')).toBe(false);
      expect(canPlayerEndTurn(human, 'CARD_DRAWN')).toBe(false);

      // Nhưng khi AWAIT_ROLL thì canPlayerRoll là true
      expect(canPlayerRoll(human, 'AWAIT_ROLL')).toBe(true);
    });

    it('skipBuy() ghi rõ log "Bé Tí bỏ qua không mua X" và hoàn thành hành động', () => {
      const human = engine.state.players[0];
      human.position = 1; // Ô 1: Tràng Tiền / Cà Mau
      const tile = engine.getTile(1);

      engine.state.gamePhase = 'AWAIT_DECISION';
      engine.skipBuy();

      // Kiểm tra log ghi nhận việc bỏ qua
      const lastLog = engine.state.eventLogs[engine.state.eventLogs.length - 1];
      expect(lastLog).toContain(`${human.name} bỏ qua không mua ${tile.name}`);
      expect(tile.ownerId).toBeNull();
    });

    it('skipUpgrade() ghi rõ log "Bé Tí bỏ qua không nâng cấp X"', () => {
      const human = engine.state.players[0];
      human.position = 1;
      const tile = engine.getTile(1);
      tile.ownerId = human.id;

      engine.state.gamePhase = 'AWAIT_DECISION';
      engine.skipUpgrade();

      const lastLog = engine.state.eventLogs[engine.state.eventLogs.length - 1];
      expect(lastLog).toContain(`${human.name} bỏ qua không nâng cấp ${tile.name}`);
    });
  });

  describe('7. Đồng bộ số liệu Thuế & Tiện ích với Engine', () => {
    it('calculateTax tính 10% tổng tài sản (tối đa 200K) cho ô 4 và 100K cho ô 38', () => {
      const human = engine.state.players[0];
      const tileTaxIncome = engine.getTile(4);
      const tileTaxLuxury = engine.getTile(38);

      // 1. Tài sản 800.000đ -> Thuế thu nhập 10% = 80.000đ
      human.money = 800000;
      expect(engine.calculateNetWorth(human)).toBe(800000);
      expect(engine.calculateTax(tileTaxIncome, human)).toBe(80000);

      // 2. Tài sản 1.500.000đ -> Thuế thu nhập 10% = 150.000đ
      human.money = 1500000;
      expect(engine.calculateTax(tileTaxIncome, human)).toBe(150000);

      // 3. Tài sản 3.000.000đ -> Thuế thu nhập kịch trần 200.000đ
      human.money = 3000000;
      expect(engine.calculateTax(tileTaxIncome, human)).toBe(200000);

      // 4. Ô Thuế xa xỉ (ô 38) luôn thu cố định 100.000đ
      expect(engine.calculateTax(tileTaxLuxury, human)).toBe(100000);
    });

    it('Landing vào ô Thuế thu nhập (ô 4) nộp đúng 10% tài sản vào Quỹ Heo Đất và ghi log rõ ràng', () => {
      const human = engine.state.players[0];
      human.money = 1200000;
      human.position = 4;

      const initialPiggy = engine.state.piggyBank;
      engine.resolveTileLanding(human.id, 4);

      // Thuế là 10% của 1.200.000đ = 120.000đ
      expect(human.money).toBe(1200000 - 120000);
      expect(engine.state.piggyBank).toBe(initialPiggy + 120000);

      const lastLog = engine.state.eventLogs[engine.state.eventLogs.length - 1];
      expect(lastLog).toContain('120K₫ tiền Thuế thu nhập (10% tổng tài sản, tối đa 200K₫)');
      expect(lastLog).toContain('Quỹ Heo Đất');
    });

    it('Tiền thuê Tiện ích tính đúng công thức xúc xắc × 10K (1 trạm) hoặc × 25K (2 trạm)', () => {
      const p1 = engine.state.players[0];
      const p2 = engine.state.players[1];
      const util1 = engine.getTile(12); // Thủy điện Hòa Bình
      const util2 = engine.getTile(28); // Nhiệt điện Yên Phụ

      // p2 mua trạm 1 (Thủy điện)
      util1.ownerId = p2.id;
      // Tổng xúc xắc 7 điểm -> Thuê = 7 × 10.000đ = 70.000đ
      expect(engine.calculateRent(util1, 7)).toBe(70000);

      // p2 mua thêm trạm 2 (Nhiệt điện)
      util2.ownerId = p2.id;
      // Tổng xúc xắc 7 điểm -> Thuê = 7 × 25.000đ = 175.000đ
      expect(engine.calculateRent(util1, 7)).toBe(175000);
      expect(engine.calculateRent(util2, 7)).toBe(175000);
    });

    it('Mua đủ 2 trạm Tiện Ích ghi log tự nhiên tiếng Việt "Tiện Ích Quốc Gia"', () => {
      const human = engine.state.players[0];
      human.money = 1000000;

      // Mua trạm 1
      engine.buyProperty(human.id, 12, false);
      // Mua trạm 2
      engine.buyProperty(human.id, 28, false);

      const hasMonopolyLog = engine.state.eventLogs.some((log) =>
        log.includes('đã sở hữu trọn bộ 2 trạm Tiện Ích Quốc Gia (Thủy điện & Nhiệt điện)!')
      );
      expect(hasMonopolyLog).toBe(true);

      // Đảm bảo không còn câu tiếng Anh 'UTILITY'
      const hasEnglishUtility = engine.state.eventLogs.some((log) =>
        log.includes('nhóm màu UTILITY')
      );
      expect(hasEnglishUtility).toBe(false);
    });
  });
});

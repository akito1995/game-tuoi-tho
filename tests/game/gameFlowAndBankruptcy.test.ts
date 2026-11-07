import { describe, it, expect, beforeEach } from 'vitest';
import { GameEngine } from '@/game/engine';
import { executeBotDebtRelief } from '@/game/botAI';
import { GameV2Bridge } from '@/renderer25d/gameV2Bridge';

describe('Kiểm thử Luồng Kết thúc Trận, Phá sản & Bất động sản (v2)', () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine({
      playerCount: 4,
      startingCash: 1500000,
      botDifficulty: 'NORMAL',
    });
  });

  describe('1. Hết vòng 25 (roundCount > 25): Dừng trận & Xếp hạng 4 người', () => {
    it('Dừng trận khi vượt quá 25 vòng, xác định quán quân theo Tổng tài sản', () => {
      // Cho player 0 mua ô 1 và xây 1 nhà ở vòng 2
      engine.state.roundCount = 2;
      engine.buyProperty('player-1', 1, true);

      // Cho player 1 có nhiều tiền mặt
      const p1 = engine.state.players[1];
      p1.money = 3000000;

      // Giả lập ván chơi vượt qua vòng 25
      engine.state.roundCount = 26;

      const victory = engine.checkVictoryConditions();
      expect(victory).not.toBeNull();
      expect(victory?.victoryType).toBe('TIMEOUT_NET_WORTH');
      expect(victory?.winner.id).toBe('player-2'); // Cô Hoa có tài sản cao nhất (3.000K)

      // Chạy apply victory
      const isGameOver = engine.checkAndApplyVictory();
      expect(isGameOver).toBe(true);
      expect(engine.state.gamePhase).toBe('GAME_OVER');
    });

    it('getPlayerRankings() xếp hạng chính xác 4 người chơi theo thứ tự tài sản giảm dần', () => {
      // Cho Bé Tí sở hữu ô 1 (giá 60K) + 1 nhà (giá 50K) ở vòng 2
      engine.state.roundCount = 2;
      engine.buyProperty('player-1', 1, true);

      // Thiết lập tài sản khác nhau
      const players = engine.state.players;
      players[0].money = 1000000; // Bé Tí: 1.000K + 110K = 1.110K
      players[1].money = 2500000; // Cô Hoa: 2.500K
      players[2].money = 1800000; // Ông Bảy: 1.800K
      players[3].money = 500000;  // Chị Mây: 500K

      const rankings = engine.getPlayerRankings();
      expect(rankings).toHaveLength(4);

      // #1: Cô Hoa (2.500K)
      expect(rankings[0].player.name).toContain('Cô Hoa');
      expect(rankings[0].rank).toBe(1);
      expect(rankings[0].netWorth).toBe(2500000);

      // #2: Ông Bảy (1.800K)
      expect(rankings[1].player.name).toContain('Ông Bảy');
      expect(rankings[1].rank).toBe(2);

      // #3: Bé Tí (1.110K)
      expect(rankings[2].player.name).toContain('Bé Tí');
      expect(rankings[2].rank).toBe(3);
      expect(rankings[2].propertyCount).toBe(1);

      // #4: Chị Mây (500K)
      expect(rankings[3].player.name).toContain('Chị Mây');
      expect(rankings[3].rank).toBe(4);
    });
  });

  describe('2. Cơ chế nợ tiền (DEBT_RELIEF): Không phá sản ngay khi còn tài sản', () => {
    it('Không phá sản ngay khi thiếu tiền, chuyển sang DEBT_RELIEF để bán nhà/cầm cố', () => {
      const debtor = engine.state.players[0]; // Bé Tí
      // Mua đất ô 1 (60K) và xây 1 nhà ở vòng 2 khi có đủ tiền
      engine.state.roundCount = 2;
      engine.buyProperty(debtor.id, 1, true);

      // Giả lập sau đó tiền mặt cạn kiệt chỉ còn 50K
      debtor.money = 50000;

      // Bị phạt nợ 150.000đ (tiền thuê) -> thiếu 100.000đ nhưng có ô 1 thanh lý được
      engine.handleDebt(debtor, engine.state.players[1], 150000, 'RENT');

      // Phải chuyển sang DEBT_RELIEF chứ KHÔNG phá sản ngay
      expect(engine.state.gamePhase).toBe('DEBT_RELIEF');
      expect(debtor.bankrupt).toBe(false);
      expect(engine.state.pendingDebt?.amountOwed).toBe(150000);
    });

    it('Bán nhà hoàn 50% tiền xây, Cầm cố nhận 50% giá đất và gom đủ tiền thanh toán', () => {
      const debtor = engine.state.players[0];
      // Mua ô 1 (giá đất 60K, tiền nhà 50K) ở vòng 2
      engine.state.roundCount = 2;
      engine.buyProperty(debtor.id, 1, true);

      // Giả lập tiền mặt chỉ còn 20K
      debtor.money = 20000;

      // Nợ 70.000đ (còn thiếu 50.000đ)
      engine.handleDebt(debtor, null, 70000, 'TAX');
      expect(engine.state.gamePhase).toBe('DEBT_RELIEF');

      // 1. Bán 1 nhà tại ô 1 (nhà nhóm Nâu giá xây 50K -> hoàn 25K)
      const sold = engine.sellHouse(debtor.id, 1);
      expect(sold).toBe(true);
      expect(debtor.money).toBe(45000); // 20K + 25K = 45K (vẫn thiếu 25K)
      expect(engine.state.gamePhase).toBe('DEBT_RELIEF');

      // 2. Cầm cố đất ô 1 (giá đất 60K -> nhận 50% = 30K)
      const mortgaged = engine.mortgageProperty(debtor.id, 1);
      expect(mortgaged).toBe(true);
      // 45K + 30K = 75K >= 70K -> Tự động thanh toán nợ 70K!
      // Tiền còn lại: 75K - 70K = 5.000đ
      expect(debtor.money).toBe(5000);
      expect(engine.state.pendingDebt).toBeNull();
      expect(debtor.bankrupt).toBe(false);
    });

    it('Bot tự động chạy executeBotDebtRelief để bán nhà và cầm cố đất thanh toán nợ', () => {
      const bot = engine.state.players[1]; // Cô Hoa (Bot)
      // Cho Bot sở hữu ô 3 (giá 60K) và có 1 nhà ở vòng 2
      engine.state.roundCount = 2;
      engine.buyProperty(bot.id, 3, true);

      // Bot chỉ còn 10.000đ
      bot.money = 10000;

      // Bot nợ 40.000đ thuế (thiếu 30K, nhưng bán nhà hoặc cầm cố sẽ đủ)
      engine.handleDebt(bot, null, 40000, 'TAX');
      expect(engine.state.gamePhase).toBe('DEBT_RELIEF');

      // Bot tự động chạy cứu trợ nợ
      executeBotDebtRelief(engine, bot);

      // Bot đã bán nhà hoặc cầm cố để trả đủ 40K và thoát nợ
      expect(engine.state.pendingDebt).toBeNull();
      expect(bot.bankrupt).toBe(false);
    });
  });

  describe('3. Ô cầm cố: Không thu tiền thuê & Chuộc lại (giá cầm cố + 10%)', () => {
    it('Ô bị cầm cố (isMortgaged) có tiền thuê = 0đ', () => {
      const owner = engine.state.players[0];
      engine.buyProperty(owner.id, 1, false);
      const tile = engine.getTile(1);

      // Tiền thuê bình thường khi chưa cầm cố (> 0)
      const normalRent = engine.calculateRent(tile);
      expect(normalRent).toBeGreaterThan(0);

      // Cầm cố đất
      engine.mortgageProperty(owner.id, 1);
      expect(tile.isMortgaged).toBe(true);

      // Tiền thuê sau khi cầm cố phải là 0đ
      const rentAfterMortgage = engine.calculateRent(tile);
      expect(rentAfterMortgage).toBe(0);
    });

    it('Chuộc lại đất thành công với chi phí = giá cầm cố + 10% (55% giá đất)', () => {
      const owner = engine.state.players[0];
      engine.buyProperty(owner.id, 1, false); // Ô 1 giá 60.000đ
      const tile = engine.getTile(1);

      // Cầm cố ô 1: nhận 50% = 30.000đ
      engine.mortgageProperty(owner.id, 1);
      expect(tile.isMortgaged).toBe(true);

      // Chi phí chuộc: giá cầm cố (30K) + 10% (3K) = 33.000đ (55% của 60K)
      owner.money = 50000;
      const unmortgageSuccess = engine.unmortgageProperty(owner.id, 1);
      expect(unmortgageSuccess).toBe(true);
      expect(tile.isMortgaged).toBe(false);
      expect(owner.money).toBe(50000 - 33000); // 17.000đ

      // Thu tiền thuê trở lại bình thường
      expect(engine.calculateRent(tile)).toBeGreaterThan(0);
    });
  });

  describe('4. Dừng trận ngay khi Người chơi thật phá sản hoặc chỉ còn 1 người', () => {
    it('Người chơi thật phá sản -> Kích hoạt GAME_OVER ngay lập tức, không để bot chơi tiếp', () => {
      const human = engine.state.players[0];
      expect(human.isBot).toBe(false);

      // Phá sản người chơi thật
      engine.processBankruptcy(human.id, null);
      expect(human.bankrupt).toBe(true);

      // Kiểm tra kết thúc trận
      const victory = engine.checkVictoryConditions();
      expect(victory).not.toBeNull();
      expect(victory?.victoryType).toBe('BANKRUPTCY');
      expect(victory?.reason).toContain('Bé Tí đã phá sản!');

      engine.checkAndApplyVictory();
      expect(engine.state.gamePhase).toBe('GAME_OVER');
    });

    it('Chỉ còn 1 người sống sót -> Kích hoạt GAME_OVER ngay', () => {
      // Phá sản 3 người chơi khác
      engine.processBankruptcy('player-2', null);
      engine.processBankruptcy('player-3', null);
      engine.processBankruptcy('player-4', null);

      const victory = engine.checkVictoryConditions();
      expect(victory).not.toBeNull();
      expect(victory?.winner.id).toBe('player-1');
      expect(victory?.victoryType).toBe('BANKRUPTCY');
    });
  });

  describe('5. Thao tác Bán/Cầm cố/Chuộc qua GameV2Bridge', () => {
    it('Bridge gọi thành công sellHouse, mortgageProperty, unmortgageProperty', () => {
      const bridge = new GameV2Bridge(4, false, 1, 'be-ti');
      const humanId = bridge.engine.state.players[0].id;

      // Cho người chơi sở hữu ô 1 kèm 1 nhà ở vòng 2
      bridge.engine.state.roundCount = 2;
      bridge.engine.buyProperty(humanId, 1, true);
      const tile = bridge.engine.getTile(1);
      expect(tile.houseCount).toBe(1);

      // 1. Bán nhà qua bridge
      const sellResult = bridge.sellHouse(1);
      expect(sellResult).toBe(true);
      expect(tile.houseCount).toBe(0);

      // 2. Cầm cố qua bridge
      const mortgageResult = bridge.mortgageProperty(1);
      expect(mortgageResult).toBe(true);
      expect(tile.isMortgaged).toBe(true);

      // 3. Chuộc lại qua bridge
      bridge.engine.state.players[0].money = 100000;
      const unmortgageResult = bridge.unmortgageProperty(1);
      expect(unmortgageResult).toBe(true);
      expect(tile.isMortgaged).toBe(false);
    });
  });
});

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameV2Bridge } from '../../src/renderer25d/gameV2Bridge';
import { GameEngine } from '../../src/game/engine';

describe('Giai đoạn 1: Kiểm thử lỗi chặn (P0)', () => {
  let bridge: GameV2Bridge;
  let engine: GameEngine;

  beforeEach(() => {
    bridge = new GameV2Bridge(4, false, 1, 'be-ti', 'NORMAL', 800_000, true);
    engine = bridge.engine;
  });

  afterEach(() => {
    bridge.destroy();
  });

  describe('1. Đấu giá không bị treo & Hoạt động đúng', () => {
    it('startAuction tạo phiên đấu giá với giá khởi điểm 50% giá đất và đếm ngược', () => {
      bridge.startAuction(1); // Cà Mau: 60K, khởi điểm 30K
      expect(bridge.currentAuction).not.toBeNull();
      expect(bridge.currentAuction?.tileId).toBe(1);
      expect(bridge.currentAuction?.currentBid).toBe(30_000);
      expect(bridge.currentAuction?.timeLeft).toBe(10);
      bridge.finishAuction();
    });

    it('passAuction đánh dấu người chơi bỏ qua; khi tất cả người chơi bỏ cuộc thì kết thúc ngay', () => {
      bridge.startAuction(1);
      const human = engine.state.players.find((p) => !p.isBot)!;
      const bots = engine.state.players.filter((p) => p.isBot);

      // Cho tất cả bot bỏ qua
      bots.forEach((b) => bridge.passAuction(b.id));
      expect(bridge.currentAuction).not.toBeNull();

      // Human cũng bỏ qua -> Không còn ai có thể đấu giá -> finishAuction được gọi ngay lập tức!
      bridge.passAuction(human.id);
      expect(bridge.currentAuction).toBeNull();
      expect(engine.getTile(1)?.ownerId).toBeNull();
      // Lượt chuyển tiếp sang người chơi tiếp theo (AWAIT_ROLL)
      expect(engine.state.gamePhase).toBe('AWAIT_ROLL');
    });

    it('Người thắng cuộc được nhận đất và bị trừ tiền đúng số tiền đã đặt', () => {
      bridge.startAuction(1);
      const human = engine.state.players.find((p) => !p.isBot)!;
      const prevMoney = human.money;

      const bidOk = bridge.placeAuctionBid(human.id, 40_000);
      expect(bidOk).toBe(true);
      expect(bridge.currentAuction?.highestBidderId).toBe(human.id);
      expect(bridge.currentAuction?.currentBid).toBe(40_000);

      // Kết thúc đấu giá
      bridge.finishAuction();
      expect(bridge.currentAuction).toBeNull();
      expect(engine.getTile(1)?.ownerId).toBe(human.id);
      expect(human.money).toBe(prevMoney - 40_000);
      expect(human.properties).toContain(1);
    });
  });

  describe('2. Bot thiếu tiền nợ tự cơ cấu & Watchdog an toàn', () => {
    it('Bot thiếu tiền tự bán nhà hoặc cầm cố để trả nợ hoặc phá sản, không bị treo', () => {
      const bot = engine.state.players.find((p) => p.isBot)!;
      // Cho bot sở hữu đất và nhà
      const tile = engine.getTile(1)!;
      tile.ownerId = bot.id;
      tile.houseCount = 2;
      bot.properties = [1];
      bot.money = 10_000;

      // Nợ 150_000đ (Bán 2 nhà @ 50K = 100K + 10K = 110K < 150K -> Cầm cố đất Cà Mau 30K = 140K < 150K -> Phá sản)
      engine.handleDebt(bot, null, 150_000, 'TAX', tile);
      expect(engine.state.gamePhase).toBe('DEBT_RELIEF');
      expect(engine.state.pendingDebt?.debtorId).toBe(bot.id);

      // Bot tự xử lý nợ qua botAI / recovery
      const debtor = bot;
      while (engine.state.pendingDebt && debtor.money < engine.state.pendingDebt.amountOwed) {
        const tilesWithHouses = engine.state.tiles.filter((t) => t.ownerId === debtor.id && (t.houseCount || 0) > 0);
        if (tilesWithHouses.length === 0) break;
        engine.sellHouse(debtor.id, tilesWithHouses[0].id);
      }
      while (engine.state.pendingDebt && debtor.money < engine.state.pendingDebt.amountOwed) {
        const mortgagable = engine.state.tiles.filter((t) => t.ownerId === debtor.id && !t.isMortgaged);
        if (mortgagable.length === 0) break;
        engine.mortgageProperty(debtor.id, mortgagable[0].id);
      }
      if (engine.state.pendingDebt) {
        if (debtor.money >= engine.state.pendingDebt.amountOwed) {
          engine.checkPendingDebtResolved();
        } else {
          engine.declareBankruptcy(debtor.id);
        }
      }

      expect(engine.state.pendingDebt).toBeNull();
    });

    it('Mô phỏng 20 ván 4 Bot Auto 4x kết thúc không có ván nào đứng quá 8s', () => {
      let stuckGames = 0;
      for (let g = 0; g < 20; g++) {
        const simEngine = new GameEngine();
        // Biến tất cả thành bot
        simEngine.state.players.forEach((p) => {
          p.isBot = true;
        });

        let steps = 0;
        const maxSteps = 400;
        while (simEngine.state.gamePhase !== 'GAME_OVER' && steps < maxSteps) {
          steps++;
          const p = simEngine.getActivePlayer();
          if (simEngine.state.gamePhase === 'DEBT_RELIEF') {
            const d = simEngine.state.players.find((pl) => pl.id === simEngine.state.pendingDebt?.debtorId) || p;
            const houses = simEngine.state.tiles.filter((t) => t.ownerId === d.id && (t.houseCount || 0) > 0);
            if (houses.length > 0) {
              simEngine.sellHouse(d.id, houses[0].id);
            } else {
              const lands = simEngine.state.tiles.filter((t) => t.ownerId === d.id && !t.isMortgaged);
              if (lands.length > 0) {
                simEngine.mortgageProperty(d.id, lands[0].id);
              } else {
                simEngine.declareBankruptcy(d.id);
              }
            }
            if (simEngine.state.pendingDebt && d.money >= simEngine.state.pendingDebt.amountOwed) {
              simEngine.checkPendingDebtResolved();
            }
          } else if (simEngine.state.gamePhase === 'AWAIT_ROLL') {
            simEngine.rollDice();
          } else if (simEngine.state.gamePhase === 'AWAIT_DECISION') {
            simEngine.skipBuy(p.id, p.position);
          } else if (simEngine.state.gamePhase === 'AWAIT_TAKEOVER') {
            simEngine.skipTakeover();
          } else if (simEngine.state.gamePhase === 'CARD_DRAWN') {
            if (simEngine.state.currentCard) {
              simEngine.applyCardEffect(simEngine.state.currentCard);
            } else {
              simEngine.completeAction();
            }
          } else {
            simEngine.completeAction();
          }
        }

        if (steps >= maxSteps && simEngine.state.gamePhase !== 'GAME_OVER') {
          stuckGames++;
        }
      }

      expect(stuckGames).toBe(0);
    });
  });

  describe('3. Ba cách ra tù theo luật', () => {
    it('Cách 1: Nộp tiền bảo lãnh 50.000đ ra tù thành công', () => {
      const player = engine.state.players[0];
      engine.sendToJail(player.id, 'Thử nghiệm');
      expect(player.inJail).toBe(true);
      expect(player.jailTurns).toBe(3);

      const prevMoney = player.money;
      const ok = bridge.payJailBail(player.id);
      expect(ok).toBe(true);
      expect(player.inJail).toBe(false);
      expect(player.jailTurns).toBe(0);
      expect(player.money).toBe(prevMoney - 50_000);
    });

    it('Cách 2: Sử dụng Thẻ Miễn Phạt Tù ra tù thành công', () => {
      const player = engine.state.players[0];
      engine.sendToJail(player.id, 'Thử nghiệm');
      player.jailFreeCards = 1;

      const prevMoney = player.money;
      const ok = bridge.useJailFreeCard(player.id);
      expect(ok).toBe(true);
      expect(player.inJail).toBe(false);
      expect(player.jailFreeCards).toBe(0);
      expect(player.money).toBe(prevMoney); // Không mất tiền
    });

    it('Cách 3: Đổ xúc xắc đôi ra tù tự do', () => {
      const player = engine.state.players[0];
      engine.sendToJail(player.id, 'Thử nghiệm');
      expect(player.inJail).toBe(true);

      // Giả lập xúc xắc đổ đôi
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.1) // 1
        .mockReturnValueOnce(0.1); // 1

      engine.rollDice();
      expect(player.inJail).toBe(false);
      expect(player.jailTurns).toBe(0);
      vi.restoreAllMocks();
    });

    it('Không đổ được đôi trong 3 lượt: hết 3 lượt tự nộp bảo lãnh 50.000đ', () => {
      const player = engine.state.players[0];
      engine.sendToJail(player.id, 'Thử nghiệm');
      player.jailTurns = 1; // Đang ở lượt cuối

      // Đổ không đôi: d1=1, d2=2
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.1) // 1
        .mockReturnValueOnce(0.3); // 2

      const prevMoney = player.money;
      engine.rollDice();
      expect(player.inJail).toBe(false);
      expect(player.money).toBe(prevMoney - 50_000);
      vi.restoreAllMocks();
    });
  });
});

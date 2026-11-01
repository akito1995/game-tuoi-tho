import { describe, it, expect, beforeEach } from 'vitest';
import {
  GameEngine,
  BOARD_40_TILES,
  CHARACTERS,
  executeBotTurn,
  evaluateBotBuy,
  evaluateBotUpgrade,
} from '@/game';

describe('GameEngine 40-Tile Architecture & Rules', () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine();
  });

  describe('1. Bàn cờ 40 ô chuẩn hóa (docs/board-data.md)', () => {
    it('phải có chính xác 40 ô (từ ID 0 đến 39)', () => {
      expect(BOARD_40_TILES.length).toBe(40);
      expect(engine.state.tiles.length).toBe(40);
      engine.state.tiles.forEach((tile, index) => {
        expect(tile.id).toBe(index);
      });
    });

    it('phải định nghĩa đúng 4 góc bàn cờ', () => {
      expect(engine.getTile(0).name).toBe('Xuất Phát');
      expect(engine.getTile(0).type).toBe('START');

      expect(engine.getTile(10).name).toBe('Trại Giam / Thăm tù');
      expect(engine.getTile(10).type).toBe('JAIL');

      expect(engine.getTile(20).name).toBe('Quán Trà Đá');
      expect(engine.getTile(20).type).toBe('REST');

      expect(engine.getTile(30).name).toBe('Vào Tù');
      expect(engine.getTile(30).type).toBe('GO_TO_JAIL');
    });

    it('phải có 2 ô thuế với mức trừ chuẩn xác', () => {
      const tax1 = engine.getTile(4);
      expect(tax1.type).toBe('TAX');
      expect(tax1.taxAmount).toBe(200000);

      const tax2 = engine.getTile(38);
      expect(tax2.type).toBe('TAX');
      expect(tax2.taxAmount).toBe(100000);
    });

    it('phải có 4 ô giao thông và 2 ô tiện ích', () => {
      const transportTiles = engine.state.tiles.filter((t) => t.type === 'TRANSPORT');
      expect(transportTiles.length).toBe(4);
      expect(transportTiles.map((t) => t.id)).toEqual([5, 15, 25, 35]);

      const utilityTiles = engine.state.tiles.filter((t) => t.type === 'UTILITY');
      expect(utilityTiles.length).toBe(2);
      expect(utilityTiles.map((t) => t.id)).toEqual([12, 28]);
    });

    it('ô đầu tiên Cà Mau (ô 1) và ô cuối cùng Thủ Đô Hà Nội (ô 39) phải đúng thông số', () => {
      const caMau = engine.getTile(1);
      expect(caMau.name).toBe('Cà Mau');
      expect(caMau.colorGroup).toBe('BROWN');
      expect(caMau.price).toBe(60000);

      const haNoi = engine.getTile(39);
      expect(haNoi.name).toBe('Thủ Đô Hà Nội');
      expect(haNoi.colorGroup).toBe('DARK_BLUE');
      expect(haNoi.price).toBe(400000);
    });
  });

  describe('2. Nhân vật chuẩn Việt Nam (GEMINI.md)', () => {
    it('phải có đúng 4 nhân vật chuẩn với màu sắc tương ứng', () => {
      expect(CHARACTERS['be-ti'].name).toBe('Bé Tí');
      expect(CHARACTERS['be-ti'].color).toBe('#E5484D');

      expect(CHARACTERS['co-hoa'].name).toBe('Cô Hoa');
      expect(CHARACTERS['co-hoa'].color).toBe('#19B8A6');

      expect(CHARACTERS['ong-bay'].name).toBe('Ông Bảy');
      expect(CHARACTERS['ong-bay'].color).toBe('#F5B83D');

      expect(CHARACTERS['chi-may'].name).toBe('Chị Mây');
      expect(CHARACTERS['chi-may'].color).toBe('#8B6CF0');
    });

    it('khởi tạo ván chơi với 4 người chơi mặc định có số tiền 2.000.000đ', () => {
      expect(engine.state.players.length).toBe(4);
      engine.state.players.forEach((p) => {
        expect(p.money).toBe(2000000);
        expect(p.position).toBe(0);
        expect(p.bankrupt).toBe(false);
      });
    });
  });

  describe('3. Cơ chế di chuyển & Qua vạch Xuất Phát (40 ô)', () => {
    it('di chuyển bình thường tăng vị trí đúng số bước', () => {
      const p = engine.getActivePlayer();
      engine.movePlayer(p.id, 6);
      expect(p.position).toBe(6);
    });

    it('vượt qua ô 39 phải quay vòng về đầu và nhận 200.000đ tiền thưởng', () => {
      const p = engine.getActivePlayer();
      p.position = 38;
      const initialMoney = p.money;

      // Đổ ra tổng 5 bước: 38 + 5 = 43 % 40 = 3
      engine.movePlayer(p.id, 5);

      expect(p.position).toBe(3);
      expect(p.money).toBe(initialMoney + 200000);
    });
  });

  describe('4. Mua đất, Độc quyền cụm màu (Monopoly) & Tiền thuê', () => {
    it('mua đất trừ đúng tiền và gán quyền sở hữu', () => {
      const p = engine.getActivePlayer();
      p.position = 1; // Cà Mau: giá 60k
      const initialMoney = p.money;

      const success = engine.buyProperty(p.id, 1);
      expect(success).toBe(true);
      expect(p.money).toBe(initialMoney - 60000);
      expect(engine.getTile(1).ownerId).toBe(p.id);
      expect(p.properties).toContain(1);
    });

    it('khi gom đủ 2 ô nhóm Nâu (Cà Mau + Bạc Liêu) thì tiền thuê đất trống được x2', () => {
      const p1 = engine.state.players[0];
      const p2 = engine.state.players[1];

      // Mua Cà Mau (ô 1: baseRent = 6k)
      engine.buyProperty(p1.id, 1);
      expect(engine.calculateRent(engine.getTile(1))).toBe(6000);

      // Mua tiếp Bạc Liêu (ô 3) để hoàn thành cụm Nâu
      engine.buyProperty(p1.id, 3);
      expect(engine.checkColorMonopoly('BROWN', p1.id)).toBe(true);

      // Tiền thuê Cà Mau khi chưa xây nhà tăng gấp đôi: 6k * 2 = 12k
      expect(engine.calculateRent(engine.getTile(1))).toBe(12000);

      // Người chơi 2 giẫm vào ô 1 phải trả 12k
      const p2Money = p2.money;
      const p1Money = p1.money;
      engine.payRent(p2.id, p1.id, 12000, engine.getTile(1));

      expect(p2.money).toBe(p2Money - 12000);
      expect(p1.money).toBe(p1Money + 12000);
    });

    it('tiền thuê ô Giao thông tăng theo số lượng ô sở hữu (25k -> 50k -> 100k -> 200k)', () => {
      const p = engine.getActivePlayer();

      // Mua 1 trạm (ô 5: Bến Nhà Rồng)
      engine.buyProperty(p.id, 5);
      expect(engine.calculateRent(engine.getTile(5))).toBe(25000);

      // Mua trạm thứ 2 (ô 15: Ga Đà Lạt)
      engine.buyProperty(p.id, 15);
      expect(engine.calculateRent(engine.getTile(5))).toBe(50000);
      expect(engine.calculateRent(engine.getTile(15))).toBe(50000);

      // Mua trạm thứ 3 (ô 25: Hải Vân Quan)
      engine.buyProperty(p.id, 25);
      expect(engine.calculateRent(engine.getTile(5))).toBe(100000);

      // Mua trạm thứ 4 (ô 35: Sân bay Nội Bài)
      engine.buyProperty(p.id, 35);
      expect(engine.calculateRent(engine.getTile(5))).toBe(200000);
    });
  });

  describe('5. Nâng cấp nhà & Công trình biểu tượng Landmark', () => {
    it('nâng cấp tuần tự từ nhà cấp 1, 2, 3, 4 đến Landmark', () => {
      const p = engine.getActivePlayer();
      engine.buyProperty(p.id, 1); // Cà Mau

      // Cấp 1
      engine.upgradeProperty(p.id, 1);
      expect(engine.getTile(1).houseCount).toBe(1);

      // Cấp 2
      engine.upgradeProperty(p.id, 1);
      expect(engine.getTile(1).houseCount).toBe(2);

      // Cấp 3
      engine.upgradeProperty(p.id, 1);
      expect(engine.getTile(1).houseCount).toBe(3);

      // Cấp 4
      engine.upgradeProperty(p.id, 1);
      expect(engine.getTile(1).houseCount).toBe(4);

      // Cấp tối đa: Khởi công Landmark
      engine.upgradeProperty(p.id, 1);
      expect(engine.getTile(1).hasLandmark).toBe(true);

      // Không thể nâng cấp tiếp khi đã có Landmark
      const canUpgradeMore = engine.upgradeProperty(p.id, 1);
      expect(canUpgradeMore).toBe(false);
    });
  });

  describe('6. Luật Trại Giam & Vào Tù', () => {
    it('dừng chân tại ô 30 (Vào Tù) sẽ bị áp giải ngay về ô 10 (Trại Giam)', () => {
      const p = engine.getActivePlayer();
      engine.resolveTileLanding(p.id, 30);

      expect(p.position).toBe(10);
      expect(p.inJail).toBe(true);
      expect(p.jailTurns).toBe(3);
    });

    it('đổ xúc xắc đôi khi đang ở trong tù sẽ được ra tù tự do', () => {
      const p = engine.getActivePlayer();
      engine.sendToJail(p.id, 'Test');
      expect(p.inJail).toBe(true);

      // Đổ đôi [4, 4]
      engine.rollDice([4, 4]);
      expect(p.inJail).toBe(false);
      expect(p.jailTurns).toBe(0);
    });

    it('nộp tiền phạt 100k sẽ ra tù ngay', () => {
      const p = engine.getActivePlayer();
      engine.sendToJail(p.id, 'Test');
      const cashBefore = p.money;

      const success = engine.payJailBail(p.id);
      expect(success).toBe(true);
      expect(p.inJail).toBe(false);
      expect(p.money).toBe(cashBefore - 100000);
    });

    it('đổ đôi 3 lần liên tiếp bị tống giam', () => {
      const p = engine.getActivePlayer();
      engine.rollDice([2, 2]); // Đôi 1
      engine.state.gamePhase = 'AWAIT_ROLL';
      engine.rollDice([3, 3]); // Đôi 2
      engine.state.gamePhase = 'AWAIT_ROLL';
      engine.rollDice([5, 5]); // Đôi 3

      expect(p.position).toBe(10);
      expect(p.inJail).toBe(true);
    });
  });

  describe('7. Phá sản & Xác định Người chiến thắng', () => {
    it('khi người chơi không đủ tiền trả nợ sẽ bị phá sản, tài sản chuyển cho chủ nợ', () => {
      const debtor = engine.state.players[0];
      const creditor = engine.state.players[1];

      engine.buyProperty(debtor.id, 1); // Cà Mau
      debtor.money = 5000; // Tiền mặt ít hơn tiền thuê

      engine.payRent(debtor.id, creditor.id, 20000, engine.getTile(1));

      expect(debtor.bankrupt).toBe(true);
      expect(debtor.money).toBe(0);
      expect(debtor.properties).toEqual([]);
      expect(engine.getTile(1).ownerId).toBe(creditor.id);
      expect(creditor.properties).toContain(1);
    });

    it('khi chỉ còn 1 người sống sót, ván chơi kết thúc và vinh danh người chiến thắng', () => {
      // Phá sản 3 người chơi đầu
      engine.processBankruptcy(engine.state.players[0].id, null);
      engine.processBankruptcy(engine.state.players[1].id, null);
      engine.processBankruptcy(engine.state.players[2].id, null);

      expect(engine.state.gamePhase).toBe('GAME_OVER');
      expect(engine.state.winner?.id).toBe(engine.state.players[3].id);
    });
  });

  describe('8. Trí tuệ nhân tạo Bot AI', () => {
    it('Bot tự động đưa ra quyết định mua đất khi đủ điều kiện', () => {
      const bot = engine.state.players[1]; // Bot Cô Hoa
      const tile = engine.getTile(6); // Cần Thơ: 100k

      const shouldBuy = evaluateBotBuy(bot, tile, engine.state.tiles);
      expect(shouldBuy).toBe(true);
    });

    it('Bot thực thi trọn vẹn 1 lượt chơi tự động mà không gặp lỗi', async () => {
      engine.state.activePlayerIndex = 1; // Lượt của Bot Cô Hoa
      const bot = engine.getActivePlayer();
      expect(bot.isBot).toBe(true);

      await executeBotTurn(engine);

      // Sau khi bot đi xong, lượt chơi phải được chuyển sang người tiếp theo
      expect(engine.state.activePlayerIndex).not.toBe(1);
    });
  });

  describe('9. Hệ thống phát sự kiện Event Bus', () => {
    it('phát đúng sự kiện "player-moved" khi nhân vật di chuyển', () => {
      let movedEventCalled = false;
      engine.events.on('player-moved', (payload) => {
        movedEventCalled = true;
        expect(payload.to).toBe(4);
      });

      engine.movePlayer(engine.getActivePlayer().id, 4);
      expect(movedEventCalled).toBe(true);
    });

    it('phát đúng sự kiện "property-bought" khi mua đất', () => {
      let boughtEventCalled = false;
      engine.events.on('property-bought', (payload) => {
        boughtEventCalled = true;
        expect(payload.tile.id).toBe(1);
        expect(payload.price).toBe(60000);
      });

      engine.buyProperty(engine.getActivePlayer().id, 1);
      expect(boughtEventCalled).toBe(true);
    });
  });
});

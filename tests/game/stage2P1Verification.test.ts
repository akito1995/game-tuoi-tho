import { describe, it, expect, vi } from 'vitest';
import { GameEngine, calculateTileRent } from '../../src/game/engine';
import { GAME_CONFIG, RENT_RULES, CHARACTER_ABILITIES } from '../../src/game/gameConfig';
import { GameV2Bridge } from '../../src/renderer25d/gameV2Bridge';
import { RULES_GUIDE_SECTIONS } from '../../src/components/games/co-ty-phu/hud/hudHelpers';
import { Tile, Player } from '../../src/game/types';
import { BOARD_40_TILES } from '../../src/game/boardData';

describe('GIAI ĐOẠN 2 (P1) - KIỂM THỬ TÍNH NĂNG VÀ LOGIC MỚI', () => {
  // =========================================================================
  // MỤC 4: TIỀN THUÊ HIỂN THỊ & SINGLE SOURCE OF TRUTH
  // =========================================================================
  describe('Mục 4: Tiền thuê hiển thị chuẩn xác (Hà Nội Landmark = 2.000K)', () => {
    it('Hà Nội (id: 39, P: 400.000đ) có tiền thuê Landmark chính xác 2.000.000đ (2.000K), không phải 4.800K', () => {
      const haNoiTile: Tile = {
        ...BOARD_40_TILES[39],
        ownerId: 'player-1',
        hasLandmark: true,
      };
      const rent = calculateTileRent(haNoiTile, BOARD_40_TILES, 7);
      expect(haNoiTile.price).toBe(400_000);
      expect(rent).toBe(2_000_000); // 400.000 * 500% = 2.000.000đ = 2.000K
      expect(rent).not.toBe(4_800_000);
    });

    it('Tuân thủ chính xác toàn bộ bảng tỷ lệ thuê RENT_RULES (10% - 20% - 50% - 130% - 250% - 350% - 500% P)', () => {
      const P = 200_000;
      const testTile: Tile = {
        id: 13,
        name: 'Đà Nẵng',
        type: 'PROPERTY',
        colorGroup: 'ORANGE',
        price: P,
        ownerId: 'player-1',
        houseCount: 0,
      };

      // Đất trống đơn lẻ (10% P)
      expect(calculateTileRent(testTile, [testTile], 7)).toBe(Math.round(P * 0.10)); // 20.000đ

      // Đất trống có trọn bộ độc quyền nhóm màu (20% P)
      const orangeSet: Tile[] = [
        testTile,
        { id: 14, name: 'Hội An', type: 'PROPERTY', colorGroup: 'ORANGE', price: P, ownerId: 'player-1' },
      ];
      expect(calculateTileRent(testTile, orangeSet, 7)).toBe(Math.round(P * 0.20)); // 40.000đ

      // 1 nhà (50% P)
      testTile.houseCount = 1;
      expect(calculateTileRent(testTile, orangeSet, 7)).toBe(Math.round(P * 0.50)); // 100.000đ

      // 2 nhà (130% P)
      testTile.houseCount = 2;
      expect(calculateTileRent(testTile, orangeSet, 7)).toBe(Math.round(P * 1.30)); // 260.000đ

      // 3 nhà (250% P)
      testTile.houseCount = 3;
      expect(calculateTileRent(testTile, orangeSet, 7)).toBe(Math.round(P * 2.50)); // 500.000đ

      // 4 nhà (350% P)
      testTile.houseCount = 4;
      expect(calculateTileRent(testTile, orangeSet, 7)).toBe(Math.round(P * 3.50)); // 700.000đ

      // Landmark (500% P)
      testTile.hasLandmark = true;
      expect(calculateTileRent(testTile, orangeSet, 7)).toBe(Math.round(P * 5.00)); // 1.000.000đ
    });

    it('Tiền thuê 4 Ga giao thông và 2 Tiện ích đúng quy chuẩn', () => {
      const stationTile: Tile = {
        id: 5,
        name: 'Ga Bến Nhà Rồng',
        type: 'TRANSPORT',
        price: 200_000,
        ownerId: 'player-1',
      };
      // 1 ga
      expect(calculateTileRent(stationTile, [stationTile], 7)).toBe(25_000);
      // 2 ga
      const twoStations = [
        stationTile,
        { id: 15, name: 'Ga Đà Lạt', type: 'TRANSPORT', price: 200_000, ownerId: 'player-1' },
      ];
      expect(calculateTileRent(stationTile, twoStations, 7)).toBe(50_000);

      // Tiện ích (xúc xắc x 10K hoặc x 25K)
      const utilTile: Tile = {
        id: 12,
        name: 'Thủy Điện Hòa Bình',
        type: 'UTILITY',
        price: 150_000,
        ownerId: 'player-1',
      };
      expect(calculateTileRent(utilTile, [utilTile], 8)).toBe(8 * 10_000); // 80.000đ
      const twoUtils = [
        utilTile,
        { id: 28, name: 'Nhà Máy Nước', type: 'UTILITY', price: 150_000, ownerId: 'player-1' },
      ];
      expect(calculateTileRent(utilTile, twoUtils, 8)).toBe(8 * 25_000); // 200.000đ
    });
  });

  // =========================================================================
  // MỤC 5: NĂNG LỰC NHÂN VẬT ÁP DỤNG THẬT TRONG ENGINE
  // =========================================================================
  describe('Mục 5: Năng lực 4 nhân vật (Bé Tí, Cô Hoa, Ông Bảy, Chị Mây)', () => {
    it('Bé Tí: Giảm 20% các loại thuế (Thuế thu nhập ô 4 & Thuế xa xỉ ô 38)', () => {
      const engine = new GameEngine();
      const beTi = engine.state.players.find((p) => p.character === 'be-ti')!;
      const bot = engine.state.players.find((p) => p.character !== 'be-ti')!;

      const taxTile4 = engine.getTile(4); // Thuế thu nhập
      const taxTile38 = engine.getTile(38); // Thuế xa xỉ

      // Thuế ô 38 cho bot (mặc định 100K)
      const botTax = engine.calculateTax(taxTile38, bot);
      expect(botTax).toBe(100_000);

      // Thuế ô 38 cho Bé Tí (-20% = 80K)
      const beTiTax = engine.calculateTax(taxTile38, beTi);
      expect(beTiTax).toBe(80_000);
    });

    it('Cô Hoa: Giảm 10% chi phí xây nhà và Landmark', () => {
      const engine = new GameEngine();
      const coHoa = engine.state.players.find((p) => p.character === 'co-hoa')!;
      const other = engine.state.players.find((p) => p.character !== 'co-hoa')!;

      const tile = engine.getTile(1); // Cà Mau (BROWN: house 50K, landmark 100K)
      const standardCost = engine.getBuildingCost(tile, other);
      const coHoaCost = engine.getBuildingCost(tile, coHoa);

      expect(coHoaCost.houseCost).toBe(Math.round(standardCost.houseCost * 0.90));
      expect(coHoaCost.landmarkCost).toBe(Math.round(standardCost.landmarkCost * 0.90));
    });

    it('Ông Bảy: Tăng 15% tiền thuê thu về khi sở hữu độc quyền trọn bộ màu', () => {
      const engine = new GameEngine();
      const ongBay = engine.state.players.find((p) => p.character === 'ong-bay')!;
      const other = engine.state.players.find((p) => p.character !== 'ong-bay')!;

      // Cấp quyền sở hữu trọn bộ màu BROWN (ô 1 & ô 3) cho Ông Bảy
      engine.state.tiles[1].ownerId = ongBay.id;
      engine.state.tiles[3].ownerId = ongBay.id;

      const ongBayRent = engine.calculateRent(engine.state.tiles[1]);

      // So sánh nếu người sở hữu là nhân vật khác
      engine.state.tiles[1].ownerId = other.id;
      engine.state.tiles[3].ownerId = other.id;
      const otherRent = engine.calculateRent(engine.state.tiles[1]);

      expect(ongBayRent).toBe(Math.round(otherRent * 1.15));
    });

    it('Chị Mây: Nhận thêm 10% tiền lương khi qua Xuất Phát và di chuyển nhanh hơn', () => {
      const engine = new GameEngine();
      const chiMay = engine.state.players.find((p) => p.character === 'chi-may')!;
      const other = engine.state.players.find((p) => p.character !== 'chi-may')!;

      chiMay.position = 38;
      chiMay.money = 500_000;
      engine.movePlayer(chiMay.id, 4); // 38 + 4 = 2 (vượt qua Xuất Phát)

      // Lương cơ bản 200K, Chị Mây được +10% = 220K
      expect(chiMay.money).toBe(500_000 + 220_000);

      other.position = 38;
      other.money = 500_000;
      engine.movePlayer(other.id, 4);
      expect(other.money).toBe(500_000 + 200_000);

      // Tốc độ nhảy Chị Mây gấp 1.25x
      expect(CHARACTER_ABILITIES['chi-may'].moveSpeedMultiplier).toBe(1.25);
    });
  });

  // =========================================================================
  // MỤC 6: KỸ NĂNG (GỘP VỀ player.skillCards, BOT DÙNG ĐƯỢC, ĐÔI x6 CHẶN TRONG TÙ)
  // =========================================================================
  describe('Mục 6: Quản lý kỹ năng qua player.skillCards & luật sử dụng', () => {
    it('Mỗi người chơi khi vào ván có đủ 3 thẻ kỹ năng: SHORT, LONG, DOUBLE', () => {
      const bridge = new GameV2Bridge(4, false, 1, 'be-ti');
      const players = bridge.engine.state.players;
      players.forEach((p) => {
        expect(p.skillCards).toEqual(['SHORT', 'LONG', 'DOUBLE']);
      });
      bridge.destroy();
    });

    it('Sử dụng kỹ năng tiêu thụ thẻ tương ứng và xóa khỏi player.skillCards', () => {
      const bridge = new GameV2Bridge(4, false, 1, 'be-ti');
      const active = bridge.engine.getActivePlayer();
      expect(active.skillCards).toContain('SHORT');

      bridge.rollWithSkill('SHORT');
      expect(active.skillCards.filter((s) => s === 'SHORT').length).toBe(0);
      expect(active.skillCards.length).toBe(2);
      bridge.destroy();
    });

    it('ĐÔI ×6 KHÔNG được phép dùng khi đang ở trong tù', () => {
      const bridge = new GameV2Bridge(4, false, 1, 'be-ti');
      const active = bridge.engine.getActivePlayer();
      active.inJail = true;
      active.jailTurns = 1;

      const beforeCards = [...active.skillCards];
      // Gọi rollWithSkill DOUBLE khi ở trong tù không được tiêu thụ thẻ và không di chuyển
      bridge.rollWithSkill('DOUBLE');
      expect(active.skillCards).toEqual(beforeCards);
      expect(active.inJail).toBe(true);
      bridge.destroy();
    });

    it('Không được nhận quá 3 thẻ kỹ năng cùng lúc', () => {
      const engine = new GameEngine();
      const player = engine.state.players[0];
      expect(player.skillCards.length).toBe(3);

      // Thử tặng thêm thẻ khi đã đủ 3 thẻ
      engine.grantSkillCard(player);
      expect(player.skillCards.length).toBe(3);
    });
  });

  // =========================================================================
  // MỤC 7: CẬP NHẬT SÁCH LUẬT KHỚP ENGINE
  // =========================================================================
  describe('Mục 7: Bảng luật chơi đầy đủ và thống nhất', () => {
    it('Chứa 5 điều kiện thắng, Quỹ Heo Đất, không có từ "Villa" hay "Lễ Hội"', () => {
      const victorySection = RULES_GUIDE_SECTIONS.find((s) => s.id === 'victory');
      expect(victorySection).toBeDefined();
      expect(victorySection?.bullets.length).toBe(5);

      const allText = JSON.stringify(RULES_GUIDE_SECTIONS);
      expect(allText).not.toContain('Villa');
      expect(allText).not.toContain('Lễ Hội');
      expect(allText).toContain('Quán Trà Đá');
      expect(allText).toContain('Quỹ Heo Đất');
      expect(allText).toContain('Bé Tí');
      expect(allText).toContain('Cô Hoa');
      expect(allText).toContain('Ông Bảy');
      expect(allText).toContain('Chị Mây');
    });
  });

  // =========================================================================
  // MỤC 10: LƯU VÁN (SAVE & RESUME ENGINE STATE)
  // =========================================================================
  describe('Mục 10: Tự khôi phục ván chơi (loadState)', () => {
    it('Engine có thể tải lại state chính xác từ bản lưu', () => {
      const engine1 = new GameEngine();
      engine1.state.roundCount = 14;
      engine1.state.players[0].money = 1_850_000;
      engine1.state.players[0].properties = [1, 3, 5];

      const savedSnapshot = JSON.parse(JSON.stringify(engine1.state));

      const engine2 = new GameEngine();
      engine2.loadState(savedSnapshot);

      expect(engine2.state.roundCount).toBe(14);
      expect(engine2.state.players[0].money).toBe(1_850_000);
      expect(engine2.state.players[0].properties).toEqual([1, 3, 5]);
    });
  });
});

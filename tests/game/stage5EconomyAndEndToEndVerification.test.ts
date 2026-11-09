import { describe, it, expect } from 'vitest';
import { GameEngine } from '../../src/game/engine';
import { executeBotDebtRelief, evaluateBotBuy, evaluateBotUpgrade, evaluateBotJailDecision } from '../../src/game/botAI';
import { GAME_CONFIG, CHARACTER_ABILITIES } from '../../src/game/gameConfig';
import { calculateTileRent } from '../../src/game/engine';

describe('GIAI ĐOẠN 5: CÂN BẰNG KINH TẾ & TỔNG DUYỆT 20 VÁN ĐẤU', () => {
  it('1. Bảng hệ số tiền thuê chuẩn xác (10%, 50%, 130%, 250%, 350%, 500% P)', () => {
    const engine = new GameEngine();
    // Ô Hà Nội (id: 39, giá 400.000đ, giá nhà 200.000đ)
    const hanoi = engine.state.tiles[39];
    expect(hanoi.name).toContain('Hà Nội');
    expect(hanoi.price).toBe(400_000);

    const p0 = engine.state.players[0]; // Bé Tí
    hanoi.ownerId = p0.id;

    // Đất trống: 10% * 400K = 40K
    hanoi.houseCount = 0;
    hanoi.hasLandmark = false;
    expect(calculateTileRent(hanoi, engine.state.tiles, 7)).toBe(40_000);

    // Nhà cấp 1: 50% * 400K = 200K
    hanoi.houseCount = 1;
    expect(calculateTileRent(hanoi, engine.state.tiles, 7)).toBe(200_000);

    // Nhà cấp 2: 130% * 400K = 520K
    hanoi.houseCount = 2;
    expect(calculateTileRent(hanoi, engine.state.tiles, 7)).toBe(520_000);

    // Nhà cấp 3: 250% * 400K = 1.000K
    hanoi.houseCount = 3;
    expect(calculateTileRent(hanoi, engine.state.tiles, 7)).toBe(1_000_000);

    // Nhà cấp 4: 350% * 400K = 1.400K
    hanoi.houseCount = 4;
    expect(calculateTileRent(hanoi, engine.state.tiles, 7)).toBe(1_400_000);

    // Landmark: 500% * 400K = 2.000K (Đúng nguồn constants, không bị 4.800K sai lệch)
    hanoi.hasLandmark = true;
    expect(calculateTileRent(hanoi, engine.state.tiles, 7)).toBe(2_000_000);
  });

  it('2. Năng lực nhân vật hoạt động chính xác trong Engine', () => {
    // Bé Tí: Thuế giảm 20%
    const engine = new GameEngine();
    const beTi = engine.state.players.find((p) => p.character === 'be-ti')!;
    const coHoa = engine.state.players.find((p) => p.character === 'co-hoa')!;
    const ongBay = engine.state.players.find((p) => p.character === 'ong-bay')!;
    const chiMay = engine.state.players.find((p) => p.character === 'chi-may')!;

    beTi.money = 1_000_000;
    coHoa.money = 1_000_000;

    const taxTile = engine.state.tiles[4]; // Thuế thu nhập 10%
    const taxBeTi = engine.calculateTax(taxTile, beTi);
    const taxCoHoa = engine.calculateTax(taxTile, coHoa);
    expect(taxCoHoa).toBe(100_000); // 10% * 1.000K
    expect(taxBeTi).toBe(80_000);   // Giảm 20%: 100K * 0.8 = 80K

    // Cô Hoa: Giảm 10% giá xây nhà và Landmark
    const tile1 = engine.state.tiles[1]; // Vũng Tàu, giá nhà 50.000đ
    const buildCostCoHoa = engine.getBuildingCost(tile1, coHoa);
    const buildCostOther = engine.getBuildingCost(tile1, beTi);
    expect(buildCostOther.houseCost).toBe(50_000);
    expect(buildCostCoHoa.houseCost).toBe(45_000); // 50K - 10% = 45K

    // Ông Bảy: +15% tiền thuê khi có độc quyền nhóm màu (Nhóm Nâu: ô 1 & ô 3)
    const t1 = engine.state.tiles[1];
    const t3 = engine.state.tiles[3];
    t1.ownerId = ongBay.id;
    t3.ownerId = ongBay.id;
    t1.houseCount = 1; // 50% * 60K = 30K -> Ông Bảy +15% = 34.500đ
    const rentOngBay = calculateTileRent(t1, engine.state.tiles, 7, engine.state.players);
    expect(rentOngBay).toBe(34_500);

    // Chị Mây: +10% lương Xuất Phát (220K khi qua, 330K khi rơi đúng ô)
    chiMay.position = 38;
    const initialCash = chiMay.money;
    engine.movePlayer(chiMay.id, 2); // rơi đúng ô 0
    expect(chiMay.position).toBe(0);
    expect(chiMay.money).toBe(initialCash + 330_000); // 300K * 1.1 = 330K
  });

  it('3. Quán Trà Đá nhận toàn bộ Quỹ Heo Đất từ tiền phạt/thuế', () => {
    const engine = new GameEngine();
    const p1 = engine.state.players[0];

    // Thuế thu nhập nộp vào Quỹ Heo Đất
    engine.state.piggyBank = 150_000;
    p1.position = 18;
    const cashBefore = p1.money;

    // Di chuyển đến ô 20 (Quán Trà Đá)
    engine.movePlayer(p1.id, 2);
    expect(p1.position).toBe(20);
    // Nhận trọn Quỹ Heo Đất
    expect(p1.money).toBe(cashBefore + 150_000);
    expect(engine.state.piggyBank).toBe(0);
  });

  it('4. Chạy mô phỏng 20 ván 4 Bot đến 25 vòng: 0 ván bị kẹt, xử lý nợ hoàn hảo', () => {
    const TOTAL_GAMES = 20;
    const MAX_ROUNDS = 25;
    const MAX_STEPS = 600;

    let stuckGames = 0;
    let exceptionGames = 0;
    let finishedGames = 0;
    const victoryDistribution: Record<string, number> = {
      BANKRUPTCY: 0,
      TRIPLE_MONOPOLY: 0,
      EDGE_MONOPOLY: 0,
      MONOPOLY_STATIONS: 0,
      MAX_ROUNDS_ASSETS: 0,
    };

    const winners: Record<string, number> = {
      'Bé Tí': 0,
      'Cô Hoa': 0,
      'Ông Bảy': 0,
      'Chị Mây': 0,
    };

    const startSim = Date.now();

    for (let gameIdx = 0; gameIdx < TOTAL_GAMES; gameIdx++) {
      const engine = new GameEngine([
        { id: 'b1', name: 'Bé Tí', character: 'be-ti', isBot: true },
        { id: 'b2', name: 'Cô Hoa', character: 'co-hoa', isBot: true },
        { id: 'b3', name: 'Ông Bảy', character: 'ong-bay', isBot: true },
        { id: 'b4', name: 'Chị Mây', character: 'chi-may', isBot: true },
      ]);

      let steps = 0;

      try {
        while (engine.state.gamePhase !== 'GAME_OVER' && engine.state.roundCount <= MAX_ROUNDS && steps < MAX_STEPS) {
          steps++;
          const active = engine.getActivePlayer();
          const phase = engine.state.gamePhase;

          if (active.bankrupt) {
            engine.endTurn();
            continue;
          }

          // Xử lý nợ
          if (phase === 'DEBT_RELIEF') {
            executeBotDebtRelief(engine, active);
            if (engine.state.gamePhase === 'DEBT_RELIEF') {
              engine.declareBankruptcy(active.id);
            }
            continue;
          }

          // Nếu trong tù
          if (active.inJail && phase === 'AWAIT_ROLL') {
            const decision = evaluateBotJailDecision(active);
            if (decision === 'USE_CARD') {
              engine.useJailFreeCard(active.id);
            } else if (decision === 'PAY_BAIL') {
              engine.payJailBail(active.id);
            }
          }

          // Đổ xúc xắc
          if (engine.state.gamePhase === 'AWAIT_ROLL') {
            engine.rollDice();
            continue;
          }

          // Mua / Nâng cấp
          if (engine.state.gamePhase === 'AWAIT_DECISION') {
            const tile = engine.getTile(active.position);
            if (tile && tile.ownerId == null) {
              if (evaluateBotBuy(active, tile, engine.state.tiles, engine.state.roundCount)) {
                engine.buyProperty(active.id, tile.id);
              } else {
                engine.completeAction();
              }
            } else if (tile && tile.ownerId === active.id) {
              const upgradeId = evaluateBotUpgrade(active, engine.state.tiles);
              if (upgradeId !== null) {
                engine.upgradeProperty(active.id, upgradeId);
              } else {
                engine.completeAction();
              }
            } else {
              engine.completeAction();
            }
            continue;
          }

          if (engine.state.gamePhase === 'CARD_DRAWN' && engine.state.currentCard) {
            engine.applyCardEffect(engine.state.currentCard);
            continue;
          }

          if (engine.state.gamePhase === 'ACTION_COMPLETED' || engine.state.gamePhase === 'TURN_END') {
            engine.completeAction();
            continue;
          }

          engine.completeAction();
        }

        if (steps >= MAX_STEPS && engine.state.gamePhase !== 'GAME_OVER' && engine.state.roundCount <= MAX_ROUNDS) {
          stuckGames++;
        } else {
          finishedGames++;
          if (!engine.state.winner) {
            engine.checkAndApplyVictory();
          }

          const vType = engine.state.victoryType || 'MAX_ROUNDS_ASSETS';
          victoryDistribution[vType] = (victoryDistribution[vType] || 0) + 1;

          if (engine.state.winner) {
            winners[engine.state.winner.name] = (winners[engine.state.winner.name] || 0) + 1;
          }
        }
      } catch (err) {
        exceptionGames++;
        console.error(`Lỗi ngoại lệ ở ván ${gameIdx + 1}:`, err);
      }
    }

    const elapsed = ((Date.now() - startSim) / 1000).toFixed(2);
    console.log('\n======================================================');
    console.log('KẾT QUẢ MÔ PHỎNG 20 VÁN ĐẤU 4 BOT (GIAI ĐOẠN 5)');
    console.log('======================================================');
    console.log(`- Tổng số ván đã chạy: ${TOTAL_GAMES} ván`);
    console.log(`- Thời gian thực thi: ${elapsed} giây`);
    console.log(`- Số ván hoàn tất thành công: ${finishedGames} / ${TOTAL_GAMES}`);
    console.log(`- Số ván bị treo / kẹt lượt: ${stuckGames} ván (Mục tiêu: 0)`);
    console.log(`- Số ván phát sinh lỗi: ${exceptionGames} ván (Mục tiêu: 0)`);
    console.log('------------------------------------------------------');
    console.log('PHÂN BỐ 5 CÁCH THẮNG:');
    Object.entries(victoryDistribution).forEach(([k, v]) => {
      console.log(`  * ${k.padEnd(20)}: ${v} ván (${((v / TOTAL_GAMES) * 100).toFixed(1)}%)`);
    });
    console.log('------------------------------------------------------');
    console.log('THỐNG KÊ NGƯỜI CHIẾN THẮNG:');
    Object.entries(winners).forEach(([k, v]) => {
      console.log(`  * ${k.padEnd(12)}: ${v} lần thắng (${((v / TOTAL_GAMES) * 100).toFixed(1)}%)`);
    });
    console.log('======================================================\n');

    expect(stuckGames).toBe(0);
    expect(exceptionGames).toBe(0);
    expect(finishedGames).toBe(TOTAL_GAMES);
  });
});

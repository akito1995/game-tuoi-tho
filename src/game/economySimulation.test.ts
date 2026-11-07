import { GameEngine } from './engine';
import { executeBotDebtRelief, evaluateBotBuy, evaluateBotUpgrade } from './botAI';
import { GAME_CONFIG, getWealthTitle } from './gameConfig';

describe('Kiểm thử Cân bằng Kinh tế và Khắc phục Lỗi A1', () => {
  test('A1: Xây nhà cấp 1 trên ô Kon Tum (ô 11) cập nhật đúng cấp nhà và Bot dừng vào phải trả đúng 70.000đ', () => {
    const engine = new GameEngine();
    const human = engine.state.players[0]; // Bé Tí
    const bot = engine.state.players[1]; // Cô Hoa

    // 1. Cho Bé Tí mua ô Kon Tum (id: 11, giá đất 140.000đ)
    const konTumTile = engine.state.tiles[11];
    expect(konTumTile.name).toBe('Kon Tum');
    expect(konTumTile.price).toBe(140000);

    engine.buyProperty(human.id, 11, false);
    expect(konTumTile.ownerId).toBe(human.id);
    expect(konTumTile.houseCount).toBe(0);

    // Tiền thuê đất trống = 10% * 140.000đ = 14.000đ
    expect(engine.calculateRent(konTumTile, 7)).toBe(14000);

    // 2. Nâng cấp lên Nhà cấp 1 (chi phí nhóm Hồng: 100.000đ)
    const initialMoney = human.money;
    const upgradeOk = engine.upgradeProperty(human.id, 11);
    expect(upgradeOk).toBe(true);

    // Kiểm tra state: houseCount phải bằng 1 và tiền đã bị trừ
    expect(konTumTile.houseCount).toBe(1);
    expect(human.money).toBe(initialMoney - 100000);

    // 3. Tiền thuê Nhà cấp 1 = 50% * 140.000đ = 70.000đ
    const rentLevel1 = engine.calculateRent(konTumTile, 7);
    expect(rentLevel1).toBe(70000);

    // 4. Cho Bot dừng vào ô Kon Tum và thanh toán tiền thuê
    const botMoneyBefore = bot.money;
    const humanMoneyBefore = human.money;

    engine.payRent(bot.id, human.id, rentLevel1, konTumTile);

    // Bot phải bị trừ đúng 70.000đ và Bé Tí nhận đúng 70.000đ
    expect(bot.money).toBe(botMoneyBefore - 70000);
    expect(human.money).toBe(humanMoneyBefore + 70000);
  });

  test('Mô phỏng 1 ván 4 bot đến 25 vòng: ghi log tổng kết ra console', () => {
    const engine = new GameEngine([
      { id: 'b1', name: 'Bé Tí 🤖', character: 'be-ti', isBot: true },
      { id: 'b2', name: 'Cô Hoa 🤖', character: 'co-hoa', isBot: true },
      { id: 'b3', name: 'Ông Bảy 🤖', character: 'ong-bay', isBot: true },
      { id: 'b4', name: 'Chị Mây 🤖', character: 'chi-may', isBot: true },
    ]);

    let firstHouseRound: number | null = null;
    let mortgageCount = 0;
    let sellHouseCount = 0;

    engine.events.on('property-upgraded', (payload) => {
      if (firstHouseRound === null && payload.tier >= 1) {
        firstHouseRound = engine.state.roundCount;
      }
    });

    engine.events.on('property-mortgaged', () => {
      mortgageCount++;
    });

    engine.events.on('house-sold', () => {
      sellHouseCount++;
    });

    let turns = 0;
    const maxTurns = 600;

    while (turns < maxTurns && engine.state.roundCount <= GAME_CONFIG.MAX_ROUNDS && !engine.state.winner) {
      turns++;
      const active = engine.getActivePlayer();
      if (active.bankrupt) {
        engine.endTurn();
        continue;
      }

      // Xử lý nợ nếu đang trong pha DEBT_RELIEF
      if (engine.state.gamePhase === 'DEBT_RELIEF' && engine.state.pendingDebt?.debtorId === active.id) {
        executeBotDebtRelief(engine, active);
        if (engine.state.gamePhase === 'DEBT_RELIEF') {
          engine.declareBankruptcy(active.id);
        }
      }

      if (engine.state.gamePhase === 'AWAIT_ROLL') {
        const roll = engine.rollDice();
        engine.movePlayer(active.id, roll.sum);
      }

      // Xử lý quyết định mua / nâng cấp
      if (engine.state.gamePhase === 'AWAIT_DECISION') {
        const tile = engine.state.tiles[active.position];
        if (!tile.ownerId) {
          const shouldBuy = evaluateBotBuy(active, tile, engine.state.tiles, engine.state.roundCount);
          if (shouldBuy) {
            engine.buyProperty(active.id, tile.id, true);
          } else {
            engine.skipBuy(active.id, tile.id);
          }
        } else if (tile.ownerId === active.id) {
          const upgradeId = evaluateBotUpgrade(active, engine.state.tiles);
          if (upgradeId !== null) {
            engine.upgradeProperty(active.id, upgradeId);
          } else {
            engine.skipUpgrade(active.id, tile.id);
          }
        } else {
          engine.completeAction();
        }
      }

      if (engine.state.gamePhase === 'CARD_DRAWN' && engine.state.currentCard) {
        engine.applyCardEffect(engine.state.currentCard);
      }

      if (engine.state.gamePhase === 'AWAIT_TAKEOVER') {
        engine.skipTakeover(active.id);
      }

      if (engine.state.gamePhase === 'ACTION_COMPLETED') {
        engine.endTurn();
      }
    }

    const bankruptCount = engine.state.players.filter((p) => p.bankrupt).length;
    const rankings = engine.getPlayerRankings();

    console.log('\n======================================================');
    console.log('TỔNG KẾT VÁN ĐẤU 4 BOT (25 VÒNG - VỐN 800K)');
    console.log('======================================================');
    console.log(`- Vòng kết thúc: ${engine.state.roundCount - 1} / 25 vòng`);
    console.log(`- Vòng xây nhà đầu tiên: ${firstHouseRound !== null ? `Vòng ${firstHouseRound}` : 'Chưa xây'}`);
    console.log(`- Số lần cầm cố đất: ${mortgageCount} lần`);
    console.log(`- Số lần bán nhà: ${sellHouseCount} lần`);
    console.log(`- Số người chơi phá sản: ${bankruptCount} / 4 người`);
    console.log('------------------------------------------------------');
    console.log('BẢNG XẾP HẠNG TÀI SẢN CUỐI CÙNG:');
    rankings.forEach((r) => {
      const title = getWealthTitle(r.netWorth);
      const status = r.isBankrupt ? '[PHÁ SẢN]' : `${(r.netWorth / 1000).toLocaleString('vi-VN')}K₫`;
      console.log(
        `  #${r.rank} ${r.player.name.padEnd(14)} | ${status.padStart(10)} | Tiền mặt: ${(r.cash / 1000).toLocaleString('vi-VN')}K₫ | BĐS: ${r.propertyCount} ô | Danh hiệu: ${title.badge} ${title.title}`
      );
    });
    console.log('======================================================\n');

    expect(engine.state.players.length).toBe(4);
  });
});

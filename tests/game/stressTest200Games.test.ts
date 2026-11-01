import { describe, it, expect } from 'vitest';
import { GameEngine } from '../../src/game/engine';
import { evaluateBotBuy, evaluateBotUpgrade, evaluateBotJailDecision } from '../../src/game/botAI';
import { CharacterId } from '../../src/game/types';

describe('Stress Test 200 Games - 4 Bots Simulation (Headless)', () => {
  it('runs 200 4-bot games up to 25 rounds with 0 stuck turns and 0 errors', () => {
    const TOTAL_GAMES = 200;
    const MAX_ROUNDS = 25;
    const MAX_STEPS_PER_GAME = 400; // Phòng ngừa lặp vô hạn

    let stuckGames = 0;
    let errorGames = 0;
    let completedWithWinner = 0;
    let reachedRoundLimit = 0;
    let totalTurnsAcrossAllGames = 0;

    const winnerStats: Record<string, number> = {
      'Bé Tí': 0,
      'Cô Hoa': 0,
      'Ông Bảy': 0,
      'Chị Mây': 0,
    };

    const startTime = Date.now();

    for (let gameIdx = 0; gameIdx < TOTAL_GAMES; gameIdx++) {
      const playersInput: Array<{ id: string; name: string; character: CharacterId; isBot: boolean }> = [
        { id: 'player-1', name: 'Bé Tí', character: 'be-ti', isBot: true },
        { id: 'player-2', name: 'Cô Hoa', character: 'co-hoa', isBot: true },
        { id: 'player-3', name: 'Ông Bảy', character: 'ong-bay', isBot: true },
        { id: 'player-4', name: 'Chị Mây', character: 'chi-may', isBot: true },
      ];

      const engine = new GameEngine(playersInput);
      let steps = 0;
      let gameStuck = false;

      try {
        while (engine.state.gamePhase !== 'GAME_OVER' && engine.state.roundCount <= MAX_ROUNDS && steps < MAX_STEPS_PER_GAME) {
          steps++;
          const active = engine.getActivePlayer();
          const phase = engine.state.gamePhase;

          // 1. Kiểm tra nếu người chơi phá sản
          if (active.bankrupt) {
            engine.endTurn();
            continue;
          }

          // 2. Nếu đang trong tù
          if (active.inJail && phase === 'AWAIT_ROLL') {
            const decision = evaluateBotJailDecision(active);
            if (decision === 'USE_CARD') {
              engine.useJailFreeCard(active.id);
            } else if (decision === 'PAY_BAIL') {
              engine.payJailBail(active.id);
            }
          }

          // 3. Đổ xúc xắc
          if (engine.state.gamePhase === 'AWAIT_ROLL') {
            engine.rollDice();
            continue;
          }

          // 4. Quyết định mua hoặc nâng cấp đất
          if (engine.state.gamePhase === 'AWAIT_DECISION') {
            const tile = engine.getTile(active.position);
            if (tile && tile.ownerId == null) {
              if (evaluateBotBuy(active, tile, engine.state.tiles)) {
                engine.buyProperty(active.id, tile.id);
              } else {
                engine.completeAction();
              }
            } else if (tile && tile.ownerId === active.id) {
              const upgradeTileId = evaluateBotUpgrade(active, engine.state.tiles);
              if (upgradeTileId !== null) {
                engine.upgradeProperty(active.id, upgradeTileId);
              } else {
                engine.completeAction();
              }
            } else {
              engine.completeAction();
            }
            continue;
          }

          // 5. Rút thẻ bài
          if (engine.state.gamePhase === 'CARD_DRAWN' && engine.state.currentCard) {
            engine.applyCardEffect(engine.state.currentCard);
            continue;
          }

          // 6. Nếu ở trạng thái hoàn thành hành động
          if (engine.state.gamePhase === 'ACTION_COMPLETED' || engine.state.gamePhase === 'TURN_END') {
            engine.completeAction();
            continue;
          }

          // 7. Bất kỳ trạng thái nào khác không xác định
          engine.completeAction();
        }

        // Kiểm tra sau khi thoát vòng lặp
        if (steps >= MAX_STEPS_PER_GAME && engine.state.gamePhase !== 'GAME_OVER' && engine.state.roundCount <= MAX_ROUNDS) {
          gameStuck = true;
          stuckGames++;
        } else {
          totalTurnsAcrossAllGames += engine.state.turnCount;
          if (engine.state.winner) {
            completedWithWinner++;
            winnerStats[engine.state.winner.name] = (winnerStats[engine.state.winner.name] || 0) + 1;
          } else {
            reachedRoundLimit++;
          }
        }
      } catch (err) {
        errorGames++;
        console.error(`Lỗi tại ván ${gameIdx + 1}:`, err);
      }
    }

    const durationSeconds = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`\n======================================================`);
    console.log(`BÁO CÁO MÔ PHỎNG 200 VÁN BOT ĐẤU HEADLESS`);
    console.log(`======================================================`);
    console.log(`- Tổng số ván đã chạy: ${TOTAL_GAMES} ván`);
    console.log(`- Thời gian thực thi: ${durationSeconds} giây`);
    console.log(`- Ván bị kẹt lượt (Stuck): ${stuckGames} ván (Mục tiêu: 0)`);
    console.log(`- Ván phát sinh lỗi ngoại lệ: ${errorGames} ván (Mục tiêu: 0)`);
    console.log(`- Ván có người thắng phá sản đối thủ: ${completedWithWinner} ván`);
    console.log(`- Ván kết thúc do đạt giới hạn 25 vòng: ${reachedRoundLimit} ván`);
    console.log(`- Tổng số lượt đi toàn bộ giải đấu: ${totalTurnsAcrossAllGames.toLocaleString('vi-VN')} lượt`);
    console.log(`- Thống kê người chiến thắng:`, winnerStats);
    console.log(`======================================================\n`);

    expect(stuckGames).toBe(0);
    expect(errorGames).toBe(0);
  });
});

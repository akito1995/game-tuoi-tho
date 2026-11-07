import { describe, it, expect } from 'vitest';
import { GameEngine } from '../../src/game/engine';
import { executeBotTurn } from '../../src/game/botAI';
import { VictoryType } from '../../src/game/types';

describe('Mô phỏng 500 ván 4 Bot - Bộ luật rules-v2 (Hành trình xuyên Việt)', () => {
  it('chạy 500 ván 4 bot mức Thường, đo thời lượng, tỷ lệ cách thắng và tiền trung bình', async () => {
    const TOTAL_GAMES = 500;
    const MAX_TURNS_PER_GAME = 1500;

    let totalTurnsAllGames = 0;
    let completedGames = 0;
    let stuckGames = 0;

    const victoryCounts: Record<VictoryType, number> = {
      BANKRUPTCY: 0,
      TRIPLE_MONOPOLY: 0,
      LINE_MONOPOLY: 0,
      TRANSPORT_MONOPOLY: 0,
      TIMEOUT_NET_WORTH: 0,
    };

    // Theo dõi tiền trung bình theo mốc vòng (1, 5, 10, 15, 20, 25)
    const trackedRounds = [1, 5, 10, 15, 20, 25];
    const moneyByRoundSum: Record<number, number> = { 1: 0, 5: 0, 10: 0, 15: 0, 20: 0, 25: 0 };
    const moneyByRoundCount: Record<number, number> = { 1: 0, 5: 0, 10: 0, 15: 0, 20: 0, 25: 0 };

    const startTime = Date.now();

    for (let gameIdx = 0; gameIdx < TOTAL_GAMES; gameIdx++) {
      const engine = new GameEngine(
        [
          { id: 'bot-1', name: 'Bé Tí 🤖', character: 'be-ti', isBot: true },
          { id: 'bot-2', name: 'Cô Hoa 🤖', character: 'co-hoa', isBot: true },
          { id: 'bot-3', name: 'Ông Bảy 🤖', character: 'ong-bay', isBot: true },
          { id: 'bot-4', name: 'Chị Mây 🤖', character: 'chi-may', isBot: true },
        ],
        {
          initialMoney: 1500000,
          maxRounds: 25,
        }
      );

      // Gán độ khó NORMAL cho 4 bot
      engine.state.players.forEach((p) => (p.botDifficulty = 'NORMAL'));

      let turnsInGame = 0;
      const sampledRoundsForThisGame = new Set<number>();

      while (engine.state.gamePhase !== 'GAME_OVER' && turnsInGame < MAX_TURNS_PER_GAME) {
        turnsInGame++;

        // Ghi nhận tiền của người chơi khi qua các mốc vòng
        const currentRound = engine.state.roundCount;
        if (trackedRounds.includes(currentRound) && !sampledRoundsForThisGame.has(currentRound)) {
          sampledRoundsForThisGame.add(currentRound);
          const activeAlive = engine.state.players.filter((p) => !p.bankrupt);
          const avgCash = activeAlive.reduce((acc, p) => acc + p.money, 0) / (activeAlive.length || 1);
          moneyByRoundSum[currentRound] += avgCash;
          moneyByRoundCount[currentRound] += 1;
        }

        await executeBotTurn(engine);
      }

      if (turnsInGame >= MAX_TURNS_PER_GAME && engine.state.gamePhase !== 'GAME_OVER') {
        stuckGames++;
      } else {
        completedGames++;
        totalTurnsAllGames += turnsInGame;

        if (engine.state.victoryType) {
          victoryCounts[engine.state.victoryType] =
            (victoryCounts[engine.state.victoryType] || 0) + 1;
        }
      }
    }

    const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(2);
    const avgTurns = Math.round(totalTurnsAllGames / (completedGames || 1));

    // Tính tỷ lệ phần trăm từng cách thắng
    const bankruptcyRate = ((victoryCounts.BANKRUPTCY / completedGames) * 100).toFixed(1);
    const tripleMonoRate = ((victoryCounts.TRIPLE_MONOPOLY / completedGames) * 100).toFixed(1);
    const lineMonoRate = ((victoryCounts.LINE_MONOPOLY / completedGames) * 100).toFixed(1);
    const transportRate = ((victoryCounts.TRANSPORT_MONOPOLY / completedGames) * 100).toFixed(1);
    const timeoutRate = ((victoryCounts.TIMEOUT_NET_WORTH / completedGames) * 100).toFixed(1);

    // Bảng tiền trung bình theo vòng
    const roundCashStats: Record<string, string> = {};
    for (const r of trackedRounds) {
      const avg = Math.round((moneyByRoundSum[r] || 0) / (moneyByRoundCount[r] || 1));
      roundCashStats[`Vòng ${r}`] = `${Math.round(avg / 1000).toLocaleString('vi-VN')}K₫`;
    }

    console.log(`
========================================================================
BÁO CÁO MÔ PHỎNG 500 VÁN 4 BOT (BỘ LUẬT rules-v2 MỚI)
========================================================================
- Số ván đã chạy: ${TOTAL_GAMES} ván
- Thời gian chạy mô phỏng: ${elapsedSec} giây
- Ván bị kẹt / vượt quá ${MAX_TURNS_PER_GAME} lượt: ${stuckGames} ván (Mục tiêu: 0)
- Thời lượng trung bình: ${avgTurns} lượt / ván (Mục tiêu chuẩn: 120 - 200 lượt)

TỶ LỆ 5 CÁCH THẮNG:
1. Phá sản đối thủ (Bankruptcy):         ${victoryCounts.BANKRUPTCY} ván (${bankruptcyRate}%)
2. Độc quyền 3 nhóm màu:                 ${victoryCounts.TRIPLE_MONOPOLY} ván (${tripleMonoRate}%)
3. Độc quyền 1 cạnh bàn cờ:              ${victoryCounts.LINE_MONOPOLY} ván (${lineMonoRate}%)
4. Độc quyền 4 ga giao thông:            ${victoryCounts.TRANSPORT_MONOPOLY} ván (${transportRate}%)
5. Hết 25 vòng (So tài sản):             ${victoryCounts.TIMEOUT_NET_WORTH} ván (${timeoutRate}%)

TIỀN MẶT TRUNG BÌNH THEO TỪNG VÒNG:
${Object.entries(roundCashStats).map(([r, c]) => `  ${r}: ${c}`).join('\n')}
========================================================================
    `);

    expect(stuckGames).toBe(0);
    expect(completedGames).toBe(TOTAL_GAMES);
  }, 120000);
});

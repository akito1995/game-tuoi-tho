import { describe, it, expect } from 'vitest';
import { GameEngine } from '../../src/game/engine';

describe('Kiểm tra hàm tung xúc xắc độc lập & đồng đều (10.000 lần tung)', () => {
  it('Mỗi con xúc xắc độc lập từ 1–6, xác suất ra đôi đạt xấp xỉ 16,7% (1/6)', () => {
    const engine = new GameEngine();

    const TOTAL_TRIALS = 10_000;
    const die1Counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    const die2Counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    let doubleCount = 0;

    for (let i = 0; i < TOTAL_TRIALS; i++) {
      // Giả lập trạng thái sẵn sàng đổ xúc xắc
      engine.state.gamePhase = 'AWAIT_ROLL';
      engine.state.doubleStreak = 0;
      const active = engine.getActivePlayer();
      active.inJail = false;
      active.jailTurns = 0;
      active.bankrupt = false;
      active.position = 0; // Đặt tại ô Xuất Phát để tránh tự động kích hoạt logic vào tù ô 30

      // Tung xúc xắc thường
      const roll = engine.rollDice();
      const [d1, d2] = roll.dice;

      // Kiểm tra giá trị hợp lệ 1..6
      expect(d1).toBeGreaterThanOrEqual(1);
      expect(d1).toBeLessThanOrEqual(6);
      expect(d2).toBeGreaterThanOrEqual(1);
      expect(d2).toBeLessThanOrEqual(6);
      expect(roll.sum).toBe(d1 + d2);

      die1Counts[d1]++;
      die2Counts[d2]++;

      if (d1 === d2) {
        doubleCount++;
      }
    }

    const doubleRate = (doubleCount / TOTAL_TRIALS) * 100;
    console.log(`\n======================================================`);
    console.log(`KẾT QUẢ KIỂM THỬ XÚC XẮC 10.000 LẦN TUNG:`);
    console.log(`- Số lần ra đôi: ${doubleCount} / ${TOTAL_TRIALS} (${doubleRate.toFixed(2)}%)`);
    console.log(`- Phân bố Xúc xắc 1:`, die1Counts);
    console.log(`- Phân bố Xúc xắc 2:`, die2Counts);
    console.log(`======================================================\n`);

    // Tỉ lệ đôi chuẩn toán học là 1/6 ≈ 16.67%.
    // Với N = 10.000, sai số chuẩn σ = sqrt(p * (1-p) / N) ≈ 0.37%.
    // Khoảng tin cậy 99.9% là [15.2%, 18.2%].
    expect(doubleRate).toBeGreaterThanOrEqual(15.2);
    expect(doubleRate).toBeLessThanOrEqual(18.2);

    // Mỗi mặt từ 1-6 phải có tần suất xấp xỉ 1667 lần (cho phép sai số 15%)
    for (let face = 1; face <= 6; face++) {
      expect(die1Counts[face]).toBeGreaterThan(1400);
      expect(die1Counts[face]).toBeLessThan(1950);
      expect(die2Counts[face]).toBeGreaterThan(1400);
      expect(die2Counts[face]).toBeLessThan(1950);
    }
  });

  it('Thẻ tăng lực (SHORT, LONG, DOUBLE) và AI không làm ảnh hưởng đến lượt thường', () => {
    const engine = new GameEngine();

    const active = engine.getActivePlayer();
    active.skillCards = ['SHORT', 'LONG', 'DOUBLE'];

    // Lượt đổ thường không dùng skill
    engine.state.gamePhase = 'AWAIT_ROLL';
    const normalRoll = engine.rollDice();
    expect(normalRoll.dice[0]).toBeGreaterThanOrEqual(1);
    expect(normalRoll.dice[0]).toBeLessThanOrEqual(6);
    expect(active.skillCards).toHaveLength(3); // Skill cards không bị tiêu tốn

    // Lượt dùng skill SHORT: di chuyển 2..4
    engine.state.gamePhase = 'AWAIT_ROLL';
    const skillRollShort = engine.useSkillCard(active.id, 'SHORT');
    expect(skillRollShort.sum).toBeGreaterThanOrEqual(2);
    expect(skillRollShort.sum).toBeLessThanOrEqual(4);
    expect(skillRollShort.isDouble).toBe(false);
    expect(active.skillCards).toHaveLength(2); // Đã dùng 1 thẻ
  });
});

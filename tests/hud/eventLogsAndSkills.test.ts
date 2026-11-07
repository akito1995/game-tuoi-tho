import { describe, it, expect } from 'vitest';
import { GameEngine } from '../../src/game/engine';
import { GameV2Bridge } from '../../src/renderer25d/gameV2Bridge';

describe('Event Logs, Toasts and Tactical Skills Suite', () => {
  it('ghi log rõ ràng khi người chơi dùng thẻ kỹ năng (Short, Long, Double)', () => {
    const engine = new GameEngine();
    const p1 = engine.state.players[0];
    p1.skillCards = ['SHORT', 'LONG', 'DOUBLE'];

    // 1. Dùng SHORT
    engine.useSkillCard(p1.id, 'SHORT');
    expect(engine.state.eventLogs.some((l) => l.includes('dùng kỹ năng Nhảy 2~4'))).toBe(true);

    // 2. Dùng LONG
    engine.state.gamePhase = 'AWAIT_ROLL';
    engine.useSkillCard(p1.id, 'LONG');
    expect(engine.state.eventLogs.some((l) => l.includes('dùng kỹ năng Nhảy 10~12'))).toBe(true);

    // 3. Dùng DOUBLE
    engine.state.gamePhase = 'AWAIT_ROLL';
    engine.useSkillCard(p1.id, 'DOUBLE');
    expect(engine.state.eventLogs.some((l) => l.includes('dùng kỹ năng Đôi ×6'))).toBe(true);
  });

  it('GameV2Bridge ghi log khi gọi rollWithSkill', () => {
    const bridge = new GameV2Bridge(4, false, 1, 'be-ti');
    bridge.rollWithSkill('SHORT');

    const snap = bridge.getSnapshot();
    const hasSkillLog = snap.logs.some((l) => l.includes('Bé Tí dùng kỹ năng Nhảy 2~4'));
    expect(hasSkillLog).toBe(true);

    bridge.destroy();
  });

  it('không còn log tóm tắt trùng lặp "dừng chân tại ô" khi nộp thuế hoặc trả tiền thuê', () => {
    const engine = new GameEngine();
    const p1 = engine.state.players[0];
    const initialLogsCount = engine.state.eventLogs.length;

    // Cho p1 rơi vào ô Thuế thu nhập (ô 4)
    engine.resolveTileLanding(p1.id, 4);

    // Kiểm tra các log được sinh ra
    const newLogs = engine.state.eventLogs.slice(initialLogsCount);

    // Không được chứa dòng generic "dừng chân tại ô [4] Thuế thu nhập"
    const hasGenericStopLog = newLogs.some((l) => l.includes('dừng chân tại ô [4]'));
    expect(hasGenericStopLog).toBe(false);

    // Phải có log nộp thuế chính xác
    const hasTaxLog = newLogs.some((l) => l.includes('nộp') && l.includes('tiền Thuế thu nhập'));
    expect(hasTaxLog).toBe(true);
  });

  it('khi ghé thăm ô đã max nhà/landmark của chính mình, ghi log ghé thăm rõ ràng', () => {
    const engine = new GameEngine();
    const p1 = engine.state.players[0];
    const tile = engine.state.tiles[6];
    tile.ownerId = p1.id;
    tile.hasLandmark = true;

    const initialLogsCount = engine.state.eventLogs.length;
    engine.resolveTileLanding(p1.id, 6);

    const newLogs = engine.state.eventLogs.slice(initialLogsCount);
    expect(newLogs.some((l) => l.includes('ghé thăm Landmark của mình'))).toBe(true);
  });

  it('khi gamePhase là AWAIT_DECISION hoặc CARD_DRAWN, rollWithSkill bị chặn hoàn toàn', () => {
    const bridge = new GameV2Bridge(4, false, 1, 'be-ti');

    // Giả lập trạng thái AWAIT_DECISION
    (bridge as any).engine.state.gamePhase = 'AWAIT_DECISION';

    const prevLogsLen = bridge.getSnapshot().logs.length;
    bridge.rollWithSkill('SHORT');

    // Không được sinh thêm log gieo xúc xắc hoặc di chuyển
    expect(bridge.getSnapshot().logs.length).toBe(prevLogsLen);
    expect(bridge.getSnapshot().gamePhase).toBe('AWAIT_DECISION');

    bridge.destroy();
  });
});

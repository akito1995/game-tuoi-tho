import { describe, it, expect } from 'vitest';
import { GameV2Bridge } from '../../src/renderer25d/gameV2Bridge';
import { GameEngine } from '../../src/game/engine';

describe('Group 3 Features: Flow, Name & Content Integrity', () => {
  it('hỗ trợ tên người chơi tùy chỉnh kết hợp tên nhân vật, ví dụ: "Long (Bé Tí)"', () => {
    const bridge = new GameV2Bridge(4, false, 1, 'be-ti', 'NORMAL', 800_000, false, 'Long');
    const snap = bridge.getSnapshot();
    const humanPlayer = snap.players[0];

    expect(humanPlayer.name).toBe('Long (Bé Tí)');
    expect(humanPlayer.character).toBe('be-ti');

    // Nếu không nhập tên (để trống), dùng tên mặc định "Bé Tí"
    bridge.resetGame(4, false, 'be-ti', 'NORMAL', 800_000, false, '');
    const snap2 = bridge.getSnapshot();
    expect(snap2.players[0].name).toBe('Bé Tí');

    bridge.destroy();
  });

  it('chỉ báo xúc xắc có hasRolledOnce = false khi ván mới bắt đầu, chỉ chuyển true sau lần đổ đầu tiên', () => {
    const bridge = new GameV2Bridge(4, false, 1, 'be-ti', 'NORMAL', 800_000, false);
    let snap = bridge.getSnapshot();

    expect(snap.hasRolledOnce).toBe(false);

    // Người chơi thực hiện đổ lần đầu
    bridge.rollDice();
    snap = bridge.getSnapshot();
    expect(snap.hasRolledOnce).toBe(true);

    // Khi reset game, hasRolledOnce phải trở về false
    bridge.resetGame(4, false, 'be-ti');
    snap = bridge.getSnapshot();
    expect(snap.hasRolledOnce).toBe(false);

    bridge.destroy();
  });

  it('giới hạn tối đa 25 vòng không bị lệch thành 26/25', () => {
    const engine = new GameEngine(
      [
        { id: 'p1', name: 'Bé Tí', character: 'be-ti', isBot: true },
        { id: 'p2', name: 'Cô Hoa', character: 'co-hoa', isBot: true },
      ],
      { maxRounds: 25, initialMoney: 800_000 }
    );

    // Đặt roundCount = 25
    engine.state.roundCount = 25;
    engine.state.activePlayerIndex = 1; // Người cuối cùng trong vòng 25

    // Kết thúc lượt của người chơi cuối cùng trong vòng 25
    engine.endTurn();

    // Game phải kết thúc ở trạng thái GAME_OVER với roundCount đúng bằng 25 (không phải 26)
    expect(engine.state.gamePhase).toBe('GAME_OVER');
    expect(engine.state.roundCount).toBe(25);
    expect(engine.state.winner).toBeDefined();
  });
});

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { BottomRightPanel } from '../../src/renderer25d/hud/BottomRightPanel';
import { GameEngine } from '../../src/game/engine';

type Props = React.ComponentProps<typeof BottomRightPanel>;

function renderPanel(overrides: Partial<Props> = {}) {
  const props: Props = {
    activePlayer: new GameEngine().getActivePlayer(),
    isMyTurn: true,
    isRolling: false,
    gamePhase: 'AWAIT_ROLL',
    onRoll: vi.fn(),
    onUseSkill: vi.fn(),
    selectedSkill: null,
    skillCharges: { short: 2, long: 2, double: 1 },
    isAutoBotMatch: false,
    ...overrides,
  };
  const html = renderToStaticMarkup(React.createElement(BottomRightPanel, props));
  const rollButton = html.match(/<button\b[^>]*aria-busy=[^>]*>/)?.[0];
  expect(rollButton).toBeDefined();
  return { html, button: rollButton! };
}

describe('Phản hồi nút xúc xắc v2', () => {
  it('cho phép đổ ở lượt người chơi đang chờ; giữ nút vàng 96px', () => {
    const { button } = renderPanel();
    expect(button).toContain('aria-label="Đổ xúc xắc"');
    expect(button).toContain('aria-busy="false"');
    expect(button).toContain('min-h-[96px]');
    expect(button).toContain('from-amber-300');
    expect(button).not.toContain('disabled=');
  });

  it('hiện đang tung và khóa cả nút lẫn kỹ năng dù engine đã trả lượt đôi', () => {
    const { html, button } = renderPanel({ isRolling: true, canRollAgain: true });
    expect(button).toContain('aria-label="Đang tung..."');
    expect(button).toContain('aria-busy="true"');
    expect(button).toContain('disabled=""');
    expect(html.match(/disabled=""/g)).toHaveLength(4);
    expect(html).toContain('motion-reduce:animate-none');
  });

  it('phân biệt di chuyển với tung xúc xắc', () => {
    const { button } = renderPanel({ isMoving: true });
    expect(button).toContain('aria-label="Đang đi..."');
    expect(button).toContain('disabled=""');
    expect(button).toContain('aria-busy="false"');
  });

  it.each(['AWAIT_DECISION', 'CARD_DRAWN', 'MOVING', 'ROLLING', 'ACTION_COMPLETED', 'GAME_OVER'])(
    'không dùng cờ đôi để mở lại nút trong pha %s', (gamePhase) => {
      const { button } = renderPanel({ gamePhase, canRollAgain: true });
      expect(button).toContain('disabled=""');
      expect(button).not.toContain('aria-label="Đổ tiếp (đôi)"');
    },
  );

  it('mở lại lượt đôi khi hết hiệu ứng và engine đang chờ đổ', () => {
    const { button } = renderPanel({ canRollAgain: true });
    expect(button).toContain('aria-label="Đổ tiếp (đôi)"');
    expect(button).not.toContain('disabled=');
  });

  it.each([{ isMyTurn: false }, { isAutoBotMatch: true }])('khóa khi không phải lượt người: %j', (overrides) => {
    expect(renderPanel(overrides).button).toContain('disabled=""');
  });

  it.each(['isBot', 'bankrupt'] as const)('khóa người có %s kể cả khi isMyTurn bị cũ', (flag) => {
    const activePlayer = { ...new GameEngine().getActivePlayer(), [flag]: true };
    expect(renderPanel({ activePlayer }).button).toContain('disabled=""');
  });
});

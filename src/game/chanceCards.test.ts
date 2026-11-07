import { CHANCE_CARDS, FATE_CARDS, getCardCashImpact, formatCardCashDisplay } from './chanceCards';

describe('Kiểm tra tính nhất quán dấu tiền thẻ Cơ Hội & Khí Vận', () => {
  const allCards = [...CHANCE_CARDS, ...FATE_CARDS];

  test('Mọi thẻ có thay đổi tiền mặt đều phải có formatCardCashDisplay khớp với getCardCashImpact', () => {
    allCards.forEach((card) => {
      const impact = getCardCashImpact(card, 4);
      const display = formatCardCashDisplay(card);

      if (impact !== 0) {
        expect(display).not.toBeNull();
        if (impact < 0) {
          // Thẻ trừ tiền: phải hiển thị dấu trừ và màu đỏ
          expect(display!.isLoss).toBe(true);
          expect(display!.text.startsWith('−')).toBe(true);
          expect(display!.colorHex).toBe('#dc2626');
        } else {
          // Thẻ cộng tiền: phải hiển thị dấu cộng và màu xanh
          expect(display!.isLoss).toBe(false);
          expect(display!.text.startsWith('+')).toBe(true);
          expect(display!.colorHex).toBe('#16a34a');
        }
      } else {
        // Thẻ không ảnh hưởng tiền mặt (teleport, jail_free)
        expect(display).toBeNull();
      }
    });
  });

  test('Thẻ "Đi ăn cưới bạn thân" (fate_07) phải là thẻ mất tiền và hiển thị dấu trừ màu đỏ', () => {
    const weddingCard = FATE_CARDS.find((c) => c.id === 'fate_07');
    expect(weddingCard).toBeDefined();
    expect(weddingCard!.type).toBe('CASH_LOSS');

    const impact = getCardCashImpact(weddingCard!);
    expect(impact).toBeLessThan(0);

    const display = formatCardCashDisplay(weddingCard!);
    expect(display).not.toBeNull();
    expect(display!.isLoss).toBe(true);
    expect(display!.text.startsWith('−')).toBe(true);
    expect(display!.colorHex).toBe('#dc2626');
  });

  test('Biên độ tiền của mọi thẻ bài phải nằm trong giới hạn 30.000đ - 150.000đ', () => {
    allCards.forEach((card) => {
      if (card.amount) {
        expect(card.amount).toBeGreaterThanOrEqual(30000);
        expect(card.amount).toBeLessThanOrEqual(150000);
      }
    });
  });
});

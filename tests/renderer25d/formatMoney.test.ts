import { describe, it, expect } from 'vitest';
import { formatMoney } from '../../src/renderer25d/utils/formatMoney';

describe('formatMoney utility', () => {
  it('formats amounts under 1 million as K without decimals', () => {
    expect(formatMoney(0)).toBe('0K');
    expect(formatMoney(50000)).toBe('50K');
    expect(formatMoney(563000)).toBe('563K');
    expect(formatMoney(800000)).toBe('800K');
    // Critical test: 623961 should round to 624K, never "623,961K"
    expect(formatMoney(623961)).toBe('624K');
    expect(formatMoney(999499)).toBe('999K');
  });

  it('formats amounts 1 million and above as Tr with Vietnamese comma', () => {
    expect(formatMoney(1000000)).toBe('1 Tr');
    expect(formatMoney(1250000)).toBe('1,25 Tr');
    expect(formatMoney(1500000)).toBe('1,5 Tr');
    expect(formatMoney(2000000)).toBe('2 Tr');
    expect(formatMoney(2350000)).toBe('2,35 Tr');
    expect(formatMoney(10500000)).toBe('10,5 Tr');
  });

  it('handles negative amounts correctly', () => {
    expect(formatMoney(-100000)).toBe('-100K');
    expect(formatMoney(-1250000)).toBe('-1,25 Tr');
  });

  it('handles options withSign and withCurrencySymbol', () => {
    expect(formatMoney(200000, { withSign: true })).toBe('+200K');
    expect(formatMoney(563000, { withCurrencySymbol: true })).toBe('563K₫');
    expect(formatMoney(1250000, { withSign: true, withCurrencySymbol: true })).toBe('+1,25 Tr₫');
  });

  it('handles null, undefined and NaN gracefully', () => {
    expect(formatMoney(null as any)).toBe('0K');
    expect(formatMoney(undefined as any)).toBe('0K');
    expect(formatMoney(NaN)).toBe('0K');
  });
});

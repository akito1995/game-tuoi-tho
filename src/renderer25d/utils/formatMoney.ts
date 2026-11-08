/**
 * Hàm chuẩn hoá định dạng tiền tệ duy nhất cho toàn bộ game Cờ Tỷ Phú Việt Nam:
 * - Dưới 1.000.000đ: Hiển thị định dạng "563K", "800K" (làm tròn số nguyên K, triệt tiêu số lẻ kiểu 623,961K)
 * - Từ 1.000.000đ trở lên: Hiển thị định dạng "1 Tr", "1,25 Tr", "2,5 Tr" (dùng dấu phẩy theo chuẩn Việt Nam)
 */
export function formatMoney(
  amount: number | null | undefined,
  options?: { withSign?: boolean; withCurrencySymbol?: boolean }
): string {
  if (amount == null || isNaN(amount)) {
    return options?.withCurrencySymbol ? '0K₫' : '0K';
  }

  const isNegative = amount < 0;
  const abs = Math.abs(amount);
  const sign = isNegative ? '-' : options?.withSign ? '+' : '';
  const curr = options?.withCurrencySymbol ? '₫' : '';

  if (abs < 1_000_000) {
    const k = Math.round(abs / 1000);
    return `${sign}${k}K${curr}`;
  } else {
    const tr = abs / 1_000_000;
    // Làm tròn tối đa 2 chữ số thập phân, loại bỏ số 0 thừa ở đuôi (vd: 1.50 -> 1.5, 1.00 -> 1)
    const formattedTr = Number(tr.toFixed(2)).toString().replace('.', ',');
    return `${sign}${formattedTr} Tr${curr}`;
  }
}

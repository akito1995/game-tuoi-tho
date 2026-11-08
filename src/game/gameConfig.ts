/**
 * GAME CONFIGURATION - CỜ TỶ PHÚ VIỆT NAM (2.5D)
 * Toàn bộ thông số kinh tế, cân bằng tài chính và danh hiệu được quy tụ tại file này
 * để thuận tiện cho việc tinh chỉnh và mở rộng.
 */

export interface WealthTitleTier {
  id: string;
  minNetWorth: number; // Tổng tài sản tối thiểu (VNĐ)
  title: string;
  badge: string;
  color: string;
}

export const GAME_CONFIG = {
  // 1. VỐN BAN ĐẦU & LƯƠNG
  STARTING_MONEY: 800_000, // Vốn mặc định: 800.000đ (đi từ nghèo lên giàu)
  STARTING_MONEY_OPTIONS: [600_000, 800_000, 1_000_000] as const, // Tuỳ chọn tại màn hình tạo ván
  PASS_START_SALARY: 200_000, // Lương khi đi qua ô Xuất Phát (25% vốn ban đầu)
  EXACT_START_REWARD: 300_000, // Thưởng đặc biệt khi dừng đúng ô Xuất Phát

  // 2. GIỚI HẠN VÁN ĐẤU & NHÀ TÙ
  MAX_ROUNDS: 25, // Tối đa 25 vòng kết thúc ván
  MAX_JAIL_TURNS: 3, // Tối đa 3 lượt trong tù
  JAIL_BAIL_PRICE: 50_000, // Tiền bảo lãnh ra tù

  // 3. THUẾ VÀ ĐẦU TƯ
  INCOME_TAX_RATE: 0.10, // Thuế thu nhập ô 4: 10% tổng tài sản
  INCOME_TAX_MAX: 200_000, // Tối đa 200.000đ
  LUXURY_TAX_RATE: 0.10, // Thuế xa xỉ ô 38: 10% tiền mặt
  LUXURY_TAX_MAX: 150_000, // Tối đa 150.000đ
  LUXURY_TAX_DEFAULT: 100_000, // Mức cơ bản nếu tiền mặt thấp

  // 4. XOAY XỞ TÀI CHÍNH (CẦM CỐ & BÁN NHÀ)
  MORTGAGE_RATE: 0.50, // Nhận 50% giá đất khi cầm cố
  UNMORTGAGE_RATE: 0.55, // Chuộc lại bằng 55% giá đất (vốn cầm cố + 10% phí)
  SELL_HOUSE_RATE: 0.50, // Hoàn 50% chi phí xây nhà khi bán
  TAKEOVER_MULTIPLIER: 1.5, // Mua lại đất đối thủ bằng 1.5 lần tổng vốn

  // 5. TRÍ TUỆ NHÂN TẠO (BOT AI)
  BOT_CASH_RESERVE: 150_000, // Tiền mặt tối thiểu Bot phải giữ lại sau khi mua đất

  // 6. THẺ KHÍ VẬN / CƠ HỘI
  CARD_MIN_AMOUNT: 30_000,
  CARD_MAX_AMOUNT: 150_000,

  // 7. HỆ THỐNG DANH HIỆU THEO TỔNG TÀI SẢN (TIỀN MẶT + ĐẤT + NHÀ)
  WEALTH_TITLES: [
    { id: 'tay-trang', minNetWorth: 0, title: 'Tay trắng', badge: '🌱', color: '#94a3b8' },
    { id: 'tieu-thuong', minNetWorth: 1_000_000, title: 'Tiểu thương', badge: '🛒', color: '#38bdf8' },
    { id: 'chu-tro', minNetWorth: 2_000_000, title: 'Chủ trọ', badge: '🏘️', color: '#4ade80' },
    { id: 'dai-gia', minNetWorth: 4_000_000, title: 'Đại gia', badge: '💎', color: '#f59e0b' },
    { id: 'ty-phu', minNetWorth: 7_000_000, title: 'Tỷ phú', badge: '👑', color: '#ec4899' },
  ] as WealthTitleTier[],

  // 8. CÂU THOẠI CHÚC MỪNG KHI LÊN DANH HIỆU THEO TỪNG NHÂN VẬT
  CHARACTER_TITLE_VOICES: {
    'be-ti': {
      'tieu-thuong': 'Em buôn bán nhỏ mà vui, tích tiểu thành đại nè!',
      'chu-tro': 'A ha! Em đã có dãy phòng trọ cho thuê rồi nha!',
      'dai-gia': 'Bé Tí nay đã thành Đại gia nhí rồi anh chị ơi!',
      'ty-phu': 'Đỉnh chóp luôn! Em chính thức bước chân vào giới Tỷ phú!',
    },
    'co-hoa': {
      'tieu-thuong': 'Chắt chiu buôn gánh bán bưng, bước đầu có chút của ăn của để.',
      'chu-tro': 'Nhà đất khang trang, tháng nào cũng có tiền thuê vào túi đều đặn.',
      'dai-gia': 'Thương trường nở hoa, sản nghiệp của cô Hoa ngày càng đồ sộ!',
      'ty-phu': 'Bản lĩnh thương trường ngút ngàn, vinh quang Tỷ phú thuộc về tôi!',
    },
    'ong-bay': {
      'tieu-thuong': 'Làm ăn chịu khó là trời thương, bắt đầu có đồng ra đồng vào rồi!',
      'chu-tro': 'Đất đai màu mỡ sinh lời, bà con thuê đất nườm nượp!',
      'dai-gia': 'Hào sảng miền sông nước nay đã thành Đại gia thứ thiệt nghen!',
      'ty-phu': 'Trời phật đãi ngộ, Ông Bảy tui chạm đỉnh Tỷ phú vang danh lục tỉnh!',
    },
    'chi-may': {
      'tieu-thuong': 'Khởi nghiệp bước đầu thuận lợi, dòng tiền đang sinh sôi!',
      'chu-tro': 'Đầu tư thông minh, bất động sản sinh dòng tiền thụ động ổn định.',
      'dai-gia': 'Chiến lược chuẩn xác, danh xưng Nữ Đại Gia này hoàn toàn xứng đáng!',
      'ty-phu': 'Thống trị toàn bộ thương trường, Tỷ phú bất động sản là tôi!',
    },
  } as Record<string, Record<string, string>>,
  // 9. ĐẤU GIÁ KHI BỎ QUA
  AUCTION_ON_SKIP_DEFAULT: false, // Mặc định tắt
  AUCTION_DURATION_SECONDS: 10, // Đấu giá nhanh 10 giây
  AUCTION_BOT_MAX_BID_RATIO: 0.9, // Bot đặt giá tối đa 90% giá đất
};
/**
 * BẢNG QUY CHUẨN TIỀN THUÊ DUY NHẤT (Single Source of Truth)
 * Sách luật, Bảng mua đất (TilePurchaseCard) và Logic Game Engine đều đọc từ đây.
 */
export const RENT_RULES = {
  // Bất động sản thường (% so với giá mua đất gốc P)
  EMPTY_LAND_RATIO: 0.10, // Đất trống: 10% P
  EMPTY_LAND_MONOPOLY_RATIO: 0.20, // Đất trống khi sở hữu trọn bộ màu: 20% P
  HOUSE_1_RATIO: 0.50, // Nhà cấp 1: 50% P
  HOUSE_2_RATIO: 1.30, // Nhà cấp 2: 130% P
  HOUSE_3_RATIO: 2.50, // Nhà cấp 3: 250% P
  HOUSE_4_RATIO: 3.50, // Nhà cấp 4: 350% P
  LANDMARK_RATIO: 5.00, // Landmark: 500% P

  // 4 Ga Giao thông (25K, 50K, 100K, 200K tùy số ga sở hữu)
  TRANSPORT_RATES: [25_000, 50_000, 100_000, 200_000] as const,

  // 2 Ô Tiện ích (Thủy điện & Nhà máy nước): Xúc xắc x 10K (1 trạm) hoặc x 25K (2 trạm)
  UTILITY_MULTIPLIER_SINGLE: 10_000,
  UTILITY_MULTIPLIER_BOTH: 25_000,
};

/**
 * Lấy danh hiệu tương ứng với tổng tài sản
 */
export function getWealthTitle(netWorth: number): WealthTitleTier {
  const titles = [...GAME_CONFIG.WEALTH_TITLES].reverse();
  for (const t of titles) {
    if (netWorth >= t.minNetWorth) {
      return t;
    }
  }
  return GAME_CONFIG.WEALTH_TITLES[0];
}

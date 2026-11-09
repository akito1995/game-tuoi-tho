import { Player, Tile, ColorGroupType, MascotType, GamePhase } from '@/lib/game-engine/types';

/**
 * Format monetary amount with Vietnamese Dong currency formatting
 * Example: 1850000 -> "1.850.000đ"
 */
export function formatMoney(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '0đ';
  return `${amount.toLocaleString('vi-VN')}đ`;
}

/**
 * Format monetary amount in a compact tactile format for cards/chips
 * Example: 1850000 -> "1.850k", 200000 -> "200k", 500 -> "500đ"
 */
export function formatShortMoney(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '0đ';
  return `${amount.toLocaleString('vi-VN')}đ`;
}

/**
 * Format money in Meta World: My City arcade style (e.g. 76M740K, 165M836K)
 */
export function formatMetaWorldMoney(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '0đ';
  if (amount >= 1_000_000) {
    const m = Math.floor(amount / 1_000_000);
    const rem = amount % 1_000_000;
    const k = Math.floor(rem / 1_000);
    return `${m}M${k > 0 ? `${k}K` : ''}`;
  }
  if (amount >= 1_000) {
    return `${Math.floor(amount / 1_000)}K`;
  }
  return `${amount}đ`;
}

/**
 * Calculates a player's total net worth:
 * Cash on hand + purchase price of owned properties + house/villa/resort construction costs.
 */
export function calculatePlayerNetWorth(player: Player, tiles: Tile[]): number {
  if (!player || player.bankrupt) return 0;

  let total = player.money || 0;
  if (!player.properties || !Array.isArray(player.properties)) return total;

  for (const tileId of player.properties) {
    const tile = tiles[tileId];
    if (tile && tile.ownerId === player.id) {
      // Land purchase cost
      total += tile.price || 0;
      // Upgraded buildings cost
      const houses = tile.houseCount || 0;
      const houseCost = tile.housePrice || 0;
      total += houses * houseCost;
    }
  }

  return total;
}

export interface MascotInfo {
  name: string;
  emoji: string;
  avatarBg: string;
  badgeBg: string;
  borderActive: string;
  glow: string;
}

export const MASCOT_INFO: Record<MascotType, MascotInfo> = {
  PIG: {
    name: 'Bé Heo',
    emoji: '🐷',
    avatarBg: 'from-pink-400 to-rose-500',
    badgeBg: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
    borderActive: 'border-pink-400 ring-2 ring-pink-400',
    glow: 'shadow-pink-500/40',
  },
  FOX: {
    name: 'Bé Cáo',
    emoji: '🦊',
    avatarBg: 'from-amber-400 to-orange-500',
    badgeBg: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
    borderActive: 'border-amber-400 ring-2 ring-amber-400',
    glow: 'shadow-amber-500/40',
  },
  CAT: {
    name: 'Bé Mèo',
    emoji: '🐱',
    avatarBg: 'from-violet-400 to-indigo-600',
    badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    borderActive: 'border-indigo-400 ring-2 ring-indigo-400',
    glow: 'shadow-indigo-500/40',
  },
  BUFFALO: {
    name: 'Bé Trâu',
    emoji: '🐮',
    avatarBg: 'from-emerald-400 to-teal-600',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    borderActive: 'border-emerald-400 ring-2 ring-emerald-400',
    glow: 'shadow-emerald-500/40',
  },
};

export function getMascotInfo(mascot: MascotType): MascotInfo {
  return (
    MASCOT_INFO[mascot] || {
      name: 'Bé Heo',
      emoji: '🐷',
      avatarBg: 'from-pink-400 to-rose-500',
      badgeBg: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
      borderActive: 'border-pink-400 ring-2 ring-pink-400',
      glow: 'shadow-pink-500/40',
    }
  );
}

export interface ColorBadgeInfo {
  regionName: string;
  hex: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  dotClass: string;
}

export const COLOR_GROUP_BADGES: Record<ColorGroupType, ColorBadgeInfo> = {
  ME_KONG: {
    regionName: 'Mê Kông',
    hex: '#10b981',
    bgClass: 'bg-emerald-950/80',
    textClass: 'text-emerald-300',
    borderClass: 'border-emerald-500',
    dotClass: 'bg-emerald-400',
  },
  COASTAL: {
    regionName: 'Duyên Hải',
    hex: '#0ea5e9',
    bgClass: 'bg-sky-950/80',
    textClass: 'text-sky-300',
    borderClass: 'border-sky-500',
    dotClass: 'bg-sky-400',
  },
  HIGHLANDS: {
    regionName: 'Tây Nguyên',
    hex: '#84cc16',
    bgClass: 'bg-lime-950/80',
    textClass: 'text-lime-300',
    borderClass: 'border-lime-500',
    dotClass: 'bg-lime-400',
  },
  HERITAGE: {
    regionName: 'Di Sản',
    hex: '#f59e0b',
    bgClass: 'bg-amber-950/80',
    textClass: 'text-amber-300',
    borderClass: 'border-amber-500',
    dotClass: 'bg-amber-400',
  },
  WONDERS: {
    regionName: 'Kỳ Quan',
    hex: '#ec4899',
    bgClass: 'bg-pink-950/80',
    textClass: 'text-pink-300',
    borderClass: 'border-pink-500',
    dotClass: 'bg-pink-400',
  },
  METROPOLIS: {
    regionName: 'Đô Thị',
    hex: '#8b5cf6',
    bgClass: 'bg-purple-950/80',
    textClass: 'text-purple-300',
    borderClass: 'border-purple-500',
    dotClass: 'bg-purple-400',
  },
  TRANSPORT: {
    regionName: 'Bến Tàu Xe',
    hex: '#64748b',
    bgClass: 'bg-slate-900/80',
    textClass: 'text-slate-300',
    borderClass: 'border-slate-500',
    dotClass: 'bg-slate-400',
  },
  UTILITY: {
    regionName: 'Dịch Vụ',
    hex: '#06b6d4',
    bgClass: 'bg-cyan-950/80',
    textClass: 'text-cyan-300',
    borderClass: 'border-cyan-500',
    dotClass: 'bg-cyan-400',
  },
};

export function getColorBadgeInfo(colorGroup?: ColorGroupType): ColorBadgeInfo {
  if (!colorGroup || !COLOR_GROUP_BADGES[colorGroup]) {
    return {
      regionName: 'Đặc Biệt',
      hex: '#e2e8f0',
      bgClass: 'bg-slate-900/80',
      textClass: 'text-slate-200',
      borderClass: 'border-slate-500',
      dotClass: 'bg-slate-400',
    };
  }
  return COLOR_GROUP_BADGES[colorGroup];
}

export interface UpgradeTier {
  level: number;
  name: string;
  icon: string;
  nextTierName: string | null;
  badgeBg: string;
}

export function getUpgradeTier(houseCount: number = 0): UpgradeTier {
  switch (houseCount) {
    case 1:
      return {
        level: 1,
        name: 'Nhà cấp 1',
        icon: '🏠',
        nextTierName: 'Nhà cấp 2',
        badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      };
    case 2:
      return {
        level: 2,
        name: 'Nhà cấp 2',
        icon: '🏡',
        nextTierName: 'Biệt Thự (Villa)',
        badgeBg: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
      };
    case 3:
      return {
        level: 3,
        name: 'Biệt Thự (Villa)',
        icon: '🏰',
        nextTierName: 'Siêu Resort 5 Sao',
        badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      };
    case 4:
      return {
        level: 4,
        name: 'Siêu Resort 5 Sao',
        icon: '👑',
        nextTierName: null,
        badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      };
    default:
      return {
        level: 0,
        name: 'Đất trống',
        icon: '🌱',
        nextTierName: 'Nhà cấp 1',
        badgeBg: 'bg-slate-700/50 text-slate-300 border-slate-600',
      };
  }
}

export interface RankedPlayer {
  rank: number;
  player: Player;
  netWorth: number;
  propertyCount: number;
  isWinner: boolean;
}

/**
 * Returns players sorted by rank (Winner first, then by net worth descending)
 */
export function getLeaderboard(
  players: Player[],
  tiles: Tile[],
  winnerId?: string | null
): RankedPlayer[] {
  const list = players.map((p) => {
    const netWorth = calculatePlayerNetWorth(p, tiles);
    const propertyCount = p.properties ? p.properties.length : 0;
    const isWinner = winnerId ? p.id === winnerId : false;
    return {
      player: p,
      netWorth,
      propertyCount,
      isWinner,
    };
  });

  list.sort((a, b) => {
    // Bankrupt always at bottom
    if (a.player.bankrupt && !b.player.bankrupt) return 1;
    if (!a.player.bankrupt && b.player.bankrupt) return -1;
    // Declared winner on top
    if (a.isWinner && !b.isWinner) return -1;
    if (!a.isWinner && b.isWinner) return 1;
    // Otherwise by net worth descending
    return b.netWorth - a.netWorth;
  });

  return list.map((item, index) => ({
    ...item,
    rank: index + 1,
  }));
}

/**
 * Determines whether human active player can roll dice
 */
export function canPlayerRoll(activePlayer: Player | undefined, gamePhase: GamePhase | string): boolean {
  if (!activePlayer || activePlayer.isBot || activePlayer.bankrupt) return false;
  const phaseStr = gamePhase as string;
  if (
    phaseStr === 'AWAIT_DECISION' ||
    phaseStr === 'CARD_DRAWN' ||
    phaseStr === 'AWAIT_TAKEOVER' ||
    phaseStr === 'DEBT_RELIEF' ||
    phaseStr === 'ACTION_REQUIRED' ||
    phaseStr === 'ACTION'
  ) {
    return false;
  }
  return phaseStr === 'WAITING' || phaseStr === 'AWAIT_ROLL';
}

/**
 * Determines whether human active player can end turn
 */
export function canPlayerEndTurn(
  activePlayer: Player | undefined,
  gamePhase: GamePhase | string
): boolean {
  if (!activePlayer || activePlayer.isBot || activePlayer.bankrupt) return false;
  const phaseStr = gamePhase as string;
  if (
    phaseStr === 'AWAIT_DECISION' ||
    phaseStr === 'CARD_DRAWN' ||
    phaseStr === 'AWAIT_TAKEOVER' ||
    phaseStr === 'DEBT_RELIEF' ||
    phaseStr === 'ACTION_REQUIRED'
  ) {
    return false;
  }
  return phaseStr === 'TURN_END' || phaseStr === 'ACTION';
}

/**
 * Rich Illustrated Rules Guide Data for Vietnamese Childhood Monopoly
 */
export interface RuleSection {
  id: string;
  tabLabel: string;
  icon: string;
  title: string;
  subtitle: string;
  bullets: Array<{ title: string; desc: string; icon?: string }>;
}

export const RULES_GUIDE_SECTIONS: RuleSection[] = [
  {
    id: 'goal',
    tabLabel: 'Vốn & Dòng Tiền',
    icon: '💰',
    title: 'Vốn Khởi Đầu & Dòng Tiền 2.5D',
    subtitle: 'Hành trình làm giàu từ vốn 800.000đ dọc miền đất nước',
    bullets: [
      {
        icon: '💵',
        title: 'Vốn Khởi Điểm: 800.000đ',
        desc: 'Mỗi người chơi bắt đầu với 800.000đ (có thể chọn 600K / 800K / 1.000K ở màn hình tạo ván). Đầu ván nên tập trung gom các ô đất nền giá mềm để tích lũy tài sản.',
      },
      {
        icon: '🚩',
        title: 'Lương Vượt Qua Xuất Phát: +200.000đ',
        desc: 'Mỗi vòng vượt qua ô Xuất Phát, người chơi nhận 200.000đ tiền lương (chiếm 25% vốn ban đầu). Dừng đúng đích ô Xuất Phát nhận thưởng nóng 300.000đ.',
      },
      {
        icon: '🐷',
        title: 'Quỹ Heo Đất (Quán Trà Đá)',
        desc: 'Mọi khoản phạt thuế và tiền nộp phạt từ thẻ Khí Vận được dồn vào Quỹ Heo Đất. Người chơi dừng chân tại ô Quán Trà Đá (ô 20) sẽ nhận toàn bộ số tiền thưởng này!',
      },
      {
        icon: '🛡️',
        title: 'Dự Phòng Tiền Mặt An Toàn',
        desc: 'Luôn giữ ít nhất 150.000đ tiền mặt để sẵn sàng nộp thuế hoặc trả tiền thuê, tránh rơi vào thế nợ nần dẫn đến phải bán tháo tài sản.',
      },
    ],
  },
  {
    id: 'victory',
    tabLabel: '5 Điều Kiện Thắng',
    icon: '🏆',
    title: '5 Điều Kiện Chiến Thắng Tuyệt Đối',
    subtitle: 'Các con đường vinh quang để giành cúp Vô Địch',
    bullets: [
      {
        icon: '💥',
        title: '1. Đối Thủ Phá Sản (Bankruptcy)',
        desc: 'Người chơi duy nhất còn trụ lại sau khi tất cả đối thủ trên bàn cờ cạn kiệt tài chính và tuyên bố phá sản sẽ giành chiến thắng ngay lập tức.',
      },
      {
        icon: '🎨',
        title: '2. Thống Trị 3 Bộ Màu (Triple Monopoly)',
        desc: 'Người chơi đầu tiên sở hữu trọn vẹn toàn bộ các ô đất của 3 nhóm màu khác nhau sẽ thắng ngay lập tức theo luật Độc Quyền.',
      },
      {
        icon: '📐',
        title: '3. Chiếm Trọn 1 Cạnh Bàn Cờ (Edge Monopoly)',
        desc: 'Sở hữu toàn bộ các ô bất động sản trên cùng 1 cạnh của bàn cờ 40 ô (từ góc này đến góc kế tiếp) sẽ kích hoạt chiến thắng 1 Cạnh.',
      },
      {
        icon: '🚂',
        title: '4. Trọn Bộ 4 Nhà Ga Giao Thông (Station Monopoly)',
        desc: 'Sở hữu toàn bộ 4 đầu mối giao thông huyết mạch: Ga Bến Nhà Rồng, Ga Đà Lạt, Ga Hải Vân và Ga Nội Bài.',
      },
      {
        icon: '⏱️',
        title: '5. Tổng Tài Sản Cao Nhất Sau 25 Vòng',
        desc: 'Nếu ván chơi đạt mốc 25 vòng đấu, game sẽ kết thúc và vinh danh người có tổng tài sản ròng (tiền mặt + giá trị đất + nhà) cao nhất.',
      },
    ],
  },
  {
    id: 'properties',
    tabLabel: 'Đất & Hệ Số Thuê',
    icon: '🏘️',
    title: 'Quy Chuẩn Bất Động Sản & Bảng Tiền Thuê',
    subtitle: 'Đơn nguồn quy chuẩn: Đất trống 10%P, Nhà 1-4 50%–350%P, Landmark 500%P',
    bullets: [
      {
        icon: '🚩',
        title: 'Đất Trống: 10% P (Độc quyền: 20% P)',
        desc: 'Khi mua đất nền chưa xây nhà: tiền thuê cơ bản bằng đúng 10% giá đất gốc P. Khi sở hữu trọn bộ màu độc quyền, tiền thuê đất trống tăng gấp đôi (20% P).',
      },
      {
        icon: '🏠',
        title: 'Nhà Cấp 1 Đến Cấp 4 (50% – 350% P)',
        desc: 'Từ vòng 2 được phép xây nhà: Nhà cấp 1 thu 50% P, Nhà cấp 2 thu 130% P, Nhà cấp 3 thu 250% P, Nhà cấp 4 thu 350% P.',
      },
      {
        icon: '👑',
        title: 'Công Trình Biểu Tượng (Landmark): 500% P',
        desc: 'Đạt cấp 4 nhà + hoàn thành ít nhất 2 vòng bản đồ: được phép khánh thành Landmark với mức thu thuê đỉnh chóp 500% P. Landmark KHÔNG THỂ bị cướp!',
      },
      {
        icon: '🚂',
        title: '4 Ga Giao Thông: 25K / 50K / 100K / 200K',
        desc: 'Thuế thu theo số lượng ga sở hữu (1 ga: 25K, 2 ga: 50K, 3 ga: 100K, 4 ga: 200K). Dừng ở ga của mình có thể chi 50K bay thẳng tới ga khác.',
      },
      {
        icon: '⚡',
        title: 'Tiện Ích Quốc Gia (Thủy Điện & Nhà Máy Nước)',
        desc: 'Tiền thuê tính theo điểm xúc xắc người dẫm vào: Xúc xắc × 10.000đ (khi sở hữu 1 trạm) hoặc Xúc xắc × 25.000đ (khi sở hữu trọn bộ cả 2 trạm).',
      },
      {
        icon: '🤝',
        title: 'Mua Lại Đất Đối Thủ (Cướp Đất 1.5x)',
        desc: 'Dừng chân ở đất đối thủ (chưa phải Landmark), bạn có quyền chi trả 1.5 lần tổng vốn đầu tư (đất + nhà) của họ để mua lại quyền sở hữu.',
      },
    ],
  },
  {
    id: 'skills',
    tabLabel: 'Kỹ Năng & Nhân Vật',
    icon: '⚡',
    title: 'Bộ Thẻ Kỹ Năng & Năng Lực 4 Nhân Vật',
    subtitle: 'Năng lực riêng biệt và cách sử dụng chiến thuật',
    bullets: [
      {
        icon: '🎯',
        title: '3 Thẻ Kỹ Năng Xúc Xắc (Tối Đa 3 Thẻ)',
        desc: 'Mỗi người khởi đầu với 3 thẻ: "NHẢY 2~4", "NHẢY 10~12", và "ĐÔI ×6". Được tặng thêm thẻ khi qua ô Xuất Phát (tối đa 3 thẻ). ĐÔI ×6 KHÔNG dùng được khi ở trong tù.',
      },
      {
        icon: '🔴',
        title: 'Bé Tí - Thần May Mắn',
        desc: 'Tăng 5% tỷ lệ đổ xúc xắc ra đôi khi đổ tự do; đồng thời được giảm 20% các loại thuế (Thuế thu nhập ô 4 & Thuế xa xỉ ô 38).',
      },
      {
        icon: '🟢',
        title: 'Cô Hoa - Kinh Doanh Khéo Léo',
        desc: 'Được giảm 10% toàn bộ chi phí xây nhà (cấp 1 đến cấp 4) và chi phí khánh thành Landmark trên toàn bộ các ô đất.',
      },
      {
        icon: '🟡',
        title: 'Ông Bảy - Hào Sảng Miền Tây',
        desc: 'Tăng thêm 15% tổng tiền thuê thu về trên mọi ô đất khi sở hữu trọn bộ độc quyền nhóm màu.',
      },
      {
        icon: '🟣',
        title: 'Chị Mây - Nhanh Nhẹn Quyết Đoán',
        desc: 'Quân cờ di chuyển nhanh hơn 25% trên bàn cờ 2.5D; nhận thêm 10% tiền lương khi đi qua hoặc dừng đúng ô Xuất Phát.',
      },
    ],
  },
  {
    id: 'turn',
    tabLabel: 'Xúc Xắc & Trại Giam',
    icon: '🎲',
    title: 'Quy Luật Xúc Xắc & Trại Giam',
    subtitle: 'Đổ đôi thêm lượt, 3 lần đôi đi tù và cách thoát tù',
    bullets: [
      {
        icon: '🎲',
        title: 'Đổ 2 Xúc Xắc 3D',
        desc: 'Nhấn nút "ĐỔ XÚC XẮC" (hoặc phím Space) để di chuyển theo chiều kim đồng hồ theo tổng 2 viên xúc xắc độc lập từ 1 đến 6.',
      },
      {
        icon: '⚡',
        title: 'Đổ Đôi & Giới Hạn 3 Lần',
        desc: 'Đổ ra 2 viên giống nhau (Đôi) được đi thêm 1 lượt. Đổ đôi liên tiếp 3 lần sẽ bị áp giải ngay vào Trại Giam vì tội chạy quá tốc độ!',
      },
      {
        icon: '🔒',
        title: '3 Cách Ra Khỏi Trại Giam',
        desc: 'Ở trong tù tối đa 3 lượt. Khi tới lượt, có thể: (1) Đổ đôi miễn phí, (2) Nộp tiền bảo lãnh 50.000đ, hoặc (3) Sử dụng Thẻ Miễn Phạt Tù.',
      },
    ],
  },
  {
    id: 'finance',
    tabLabel: 'Cầm Cố & Đấu Giá',
    icon: '⚖️',
    title: 'Cơ Cấu Nợ & Đấu Giá Bất Động Sản',
    subtitle: 'Giải cứu dòng tiền: bán nhà 50%, cầm cố 50%, chuộc 55%',
    bullets: [
      {
        icon: '🏚️',
        title: 'Bán Nhà Hoàn 50%',
        desc: 'Khi cần tiền trả nợ, người chơi có thể bán bớt các cấp nhà với mức thu hồi 50% chi phí xây dựng ban đầu.',
      },
      {
        icon: '📜',
        title: 'Cầm Cố Đất Nhận 50%',
        desc: 'Cầm cố ô đất trống nhận ngay 50% giá đất. Trong thời gian bị cầm cố, ô đất sẽ tạm thời KHÔNG thu được tiền thuê từ đối thủ.',
      },
      {
        icon: '🔓',
        title: 'Chuộc Lại Đất: 55%',
        desc: 'Để gỡ cầm cố và thu tiền thuê trở lại, bạn chi trả 55% giá đất (gồm 50% tiền gốc đã nhận + 10% phí chuộc phát sinh).',
      },
      {
        icon: '🔨',
        title: 'Đấu Giá Nhanh 10 Giây',
        desc: 'Khi bật tính năng đấu giá: nếu người chơi chọn "Bỏ qua" không mua ô đất trống, phiên đấu giá 10s sẽ mở cho toàn bộ người chơi tranh quyền mua.',
      },
    ],
  },
  {
    id: 'tips',
    tabLabel: 'Chiến Thuật Tỷ Phú',
    icon: '💡',
    title: 'Bí Kíp Đỉnh Cao Của Tỷ Phú Việt',
    subtitle: 'Chiến lược thông minh từ các bậc thầy thương trường',
    bullets: [
      {
        icon: '⚡',
        title: 'Gom Trọn Bộ Màu Độc Quyền Sớm',
        desc: 'Ưu tiên mua gom nhóm đất cùng màu để nhân đôi tiền thuê đất trống và mở khóa quyền xây nhà từ vòng 2.',
      },
      {
        icon: '🏨',
        title: 'Nâng Lên Nhà Cấp 2 Càng Nhanh Càng Tốt',
        desc: 'Bước nhảy tiền thuê từ 50% lên 130% P ở cấp 2 mang lại lợi nhuận vượt trội, giúp thu hồi vốn nhanh chóng.',
      },
      {
        icon: '🐷',
        title: 'Săn Quỹ Heo Đất Tại Quán Trà Đá',
        desc: 'Khi nhiều người chơi nộp thuế hoặc nộp phạt vào quỹ, ô Quán Trà Đá sẽ là món hời lớn hàng trăm ngàn đồng.',
      },
      {
        icon: '🧠',
        title: 'Luôn Dự Phòng 150K Tiền Mặt',
        desc: 'Đừng dốc sạch tiền xây nhà khi phía trước là chuỗi bất động sản của đối thủ; giữ quỹ dự phòng để tránh phải bán tháo tài sản.',
      },
    ],
  },
];
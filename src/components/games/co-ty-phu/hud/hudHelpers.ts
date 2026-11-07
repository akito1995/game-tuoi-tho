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
    tabLabel: 'Vốn & Lương',
    icon: '💰',
    title: 'Vốn Khởi Đầu & Dòng Tiền',
    subtitle: 'Hành trình làm giàu từ vốn 800.000đ dọc miền đất nước',
    bullets: [
      {
        icon: '💵',
        title: 'Vốn Khởi Điểm: 800.000đ',
        desc: 'Mỗi người chơi bắt đầu với 800.000đ (có thể chọn 600K / 800K / 1.000K ở màn hình tạo ván). Đầu game cần chọn lọc mua 3–5 ô đất rẻ để tích lũy.',
      },
      {
        icon: '🚩',
        title: 'Lương Qua Xuất Phát: +200.000đ',
        desc: 'Mỗi vòng vượt qua ô Xuất Phát, ngân hàng trả lương 200.000đ (chiếm 25% vốn ban đầu). Dừng đúng ô Xuất Phát thưởng nóng 300.000đ.',
      },
      {
        icon: '🛡️',
        title: 'Dự Phòng Tiền Mặt An Toàn',
        desc: 'Luôn giữ ít nhất 150.000đ tiền mặt để sẵn sàng nộp thuế hoặc trả tiền thuê, tránh bị rơi vào thế nợ nần buộc phải bán tháo tài sản.',
      },
    ],
  },
  {
    id: 'turn',
    tabLabel: 'Xúc Xắc & Tù',
    icon: '🎲',
    title: 'Quy Luật Xúc Xắc & Trại Giam',
    subtitle: 'Đổ đôi thêm lượt, 3 lần đôi đi tù và cách thoát tù',
    bullets: [
      {
        icon: '🎲',
        title: 'Đổ 2 Xúc Xắc',
        desc: 'Nhấn nút "ĐỔ XÚC XẮC" để di chuyển theo chiều kim đồng hồ theo tổng 2 viên xúc xắc.',
      },
      {
        icon: '⚡',
        title: 'Đổ Đôi & Giới Hạn 3 Lần',
        desc: 'Đổ ra 2 viên giống nhau (Đôi) được đi thêm 1 lượt. Chú ý: Đổ đôi liên tiếp 3 lần sẽ bị áp giải ngay vào Trại Giam!',
      },
      {
        icon: '🔒',
        title: 'Cách Thoát Trại Giam',
        desc: 'Ở trong tù tối đa 3 lượt. Có 3 cách ra tù: (1) Đổ được Đôi khi tới lượt, (2) Nộp tiền bảo lãnh 50.000đ, hoặc (3) Dùng Thẻ Thoát Tù.',
      },
    ],
  },
  {
    id: 'properties',
    tabLabel: 'Đất & Nhà',
    icon: '🏘️',
    title: 'Xây Dựng, Cắm Cờ & Nâng Cấp BĐS',
    subtitle: 'Quy trình từ cắm cờ đất trống đến Landmark nguy nga',
    bullets: [
      {
        icon: '🚩',
        title: 'Đất Trống Đã Mua (Cắm Cờ)',
        desc: 'Khi mua đất chưa xây nhà: ô được cắm cờ và viền màu của chủ sở hữu. Đối thủ dẫm vào trả tiền thuê đất trống.',
      },
      {
        icon: '🏠',
        title: 'Nhà Cấp 1 Đến Cấp 4',
        desc: 'Xây nhà để nhân bội tiền thuê. Cấp 1 tăng ~5x, cấp 2 tăng ~15x, cấp 3 tăng ~40x, cấp 4 tăng ~70x tiền thuê đất.',
      },
      {
        icon: '🏰',
        title: 'Kỳ Quan (Landmark)',
        desc: 'Cấp độ cao nhất mang kiến trúc địa danh đặc trưng (Chợ Bến Thành, Cầu Rồng...). Kỳ quan KHÔNG THỂ bị đối thủ mua lại!',
      },
      {
        icon: '🤝',
        title: 'Mua Lại Đất Đối Thủ (1.5x)',
        desc: 'Khi dừng ở đất đối thủ (chưa phải Kỳ Quan), bạn có thể chi gấp 1.5 lần tổng tiền đất + nhà để cướp quyền sở hữu.',
      },
    ],
  },
  {
    id: 'finance',
    tabLabel: 'Cầm Cố & Bán Nhà',
    icon: '⚖️',
    title: 'Xoay Xở Tài Chính Khi Nợ Nần',
    subtitle: 'Giải cứu dòng tiền: bán nhà 50%, cầm cố 50%, chuộc lại 55%',
    bullets: [
      {
        icon: '🏚️',
        title: 'Bán Nhà Hoàn 50%',
        desc: 'Khi cần tiền trả nợ, bạn có thể bán bớt các cấp nhà với mức thu hồi 50% chi phí xây dựng ban đầu.',
      },
      {
        icon: '📜',
        title: 'Cầm Cố Đất Nhận 50%',
        desc: 'Cầm cố ô đất trống (hoặc đã bán hết nhà) nhận ngay 50% giá đất. Trong thời gian bị cầm cố, ô đất sẽ KHÔNG thu được tiền thuê!',
      },
      {
        icon: '🔓',
        title: 'Chuộc Lại Đất: 55%',
        desc: 'Để gỡ cầm cố và thu tiền thuê trở lại, bạn chi trả 55% giá đất (bao gồm 50% tiền gốc đã nhận + 10% tiền lãi phát sinh).',
      },
    ],
  },
  {
    id: 'auction_ranks',
    tabLabel: 'Đấu Giá & Danh Hiệu',
    icon: '🏆',
    title: 'Đấu Giá Nhanh 10s & Danh Hiệu Tài Sản',
    subtitle: 'Tranh mua đất khi bỏ qua và 5 mốc vinh danh người giàu',
    bullets: [
      {
        icon: '🔨',
        title: 'Đấu Giá Khi Bỏ Qua (Tùy Chọn)',
        desc: 'Khi bật tính năng này trong cài đặt: nếu người dẫm vào ô chọn "Bỏ qua", mở phiên đấu giá 10s giữa tất cả người chơi. Bot trả giá tối đa 90% nếu còn tiền dự phòng.',
      },
      {
        icon: '👑',
        title: '5 Cấp Bậc Danh Hiệu Tài Sản',
        desc: '🌱 Tay trắng (0đ) ➔ 🛒 Tiểu thương (1 triệu) ➔ 🏘️ Chủ trọ (2 triệu) ➔ 💎 Đại gia (4 triệu) ➔ 👑 Tỷ phú (7 triệu).',
      },
      {
        icon: '💥',
        title: 'Phá Sản & Thắng Cuộc',
        desc: 'Nếu không đủ tài sản giải cứu nợ, bạn sẽ phá sản. Người sống sót cuối cùng hoặc người có tổng tài sản cao nhất sau 25 vòng sẽ thắng!',
      },
    ],
  },
  {
    id: 'tips',
    tabLabel: 'Mẹo Chơi Thắng',
    icon: '💡',
    title: 'Bí Kíp Đỉnh Cao Của Tỷ Phú',
    subtitle: 'Chiến thuật thông minh từ các cao thủ Cờ Tỷ Phú',
    bullets: [
      {
        icon: '⚡',
        title: 'Đầu tư sớm gom bộ màu',
        desc: 'Ưu tiên mua đất ngay từ những vòng đầu. Cố gắng sở hữu trọn 1 bộ màu càng nhanh càng tốt để nhân đôi tiền thuê.',
      },
      {
        icon: '🏨',
        title: 'Nâng lên Nhà cấp 2 hoặc Villa sớm',
        desc: 'Bước nhảy tiền thuê từ Đất trống lên Nhà cấp 2 là rất lớn, giúp bạn nhanh chóng thu hồi vốn đầu tư.',
      },
      {
        icon: '🐷',
        title: 'Canh chừng Quỹ Heo Đất',
        desc: 'Khi các người chơi nộp phạt nhiều vào Quỹ Heo Đất, ô Lễ Hội sẽ trở thành kho báu béo bở hàng triệu đồng.',
      },
      {
        icon: '🧠',
        title: 'Giữ lại tối thiểu 100k-200k tiền mặt',
        desc: 'Đừng dốc sạch đồng xu cuối cùng để xây nhà nếu phía trước là chuỗi bất động sản của đối thủ!',
      },
    ],
  },
];

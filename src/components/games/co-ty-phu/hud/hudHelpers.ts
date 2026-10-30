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
export function canPlayerRoll(activePlayer: Player | undefined, gamePhase: GamePhase): boolean {
  if (!activePlayer || activePlayer.isBot || activePlayer.bankrupt) return false;
  return gamePhase === 'WAITING' || gamePhase === 'AWAIT_ROLL';
}

/**
 * Determines whether human active player can end turn
 */
export function canPlayerEndTurn(
  activePlayer: Player | undefined,
  gamePhase: GamePhase
): boolean {
  if (!activePlayer || activePlayer.isBot) return false;
  return gamePhase === 'TURN_END' || gamePhase === 'ACTION' || gamePhase === 'AWAIT_DECISION';
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
    tabLabel: 'Mục Tiêu',
    icon: '🎯',
    title: 'Mục Tiêu Trò Chơi',
    subtitle: 'Chinh phục Đảo Ngọc Việt Nam và trở thành Tỷ Phú độc tôn',
    bullets: [
      {
        icon: '🏆',
        title: 'Trở thành Tỷ Phú độc tôn',
        desc: 'Loại bỏ tất cả các đối thủ bằng cách khiến họ phá sản khi giẫm vào khu đất và resort sang trọng của bạn.',
      },
      {
        icon: '💰',
        title: 'Đạt Giá Trị Tài Sản Khủng Nhất',
        desc: 'Nếu ván chơi giới hạn số vòng, người chơi có tổng giá trị tài sản (tiền mặt + đất đai + nhà cửa) cao nhất sẽ giành cúp vô địch.',
      },
      {
        icon: '🛡️',
        title: 'Quản Lý Dòng Tiền Khôn Khéo',
        desc: 'Đừng tiêu sạch tiền mặt để mua đất! Luôn giữ lại một khoản dự phòng để trả tiền thuê hoặc nộp phạt khi gặp xui xẻo.',
      },
    ],
  },
  {
    id: 'turn',
    tabLabel: 'Cách Chơi 1 Lượt',
    icon: '🎲',
    title: 'Quy Trình 1 Lượt Đi',
    subtitle: 'Chuỗi hành động từng bước khi tới lượt của bạn',
    bullets: [
      {
        icon: '1️⃣',
        title: 'Đổ 2 Xúc Xắc',
        desc: 'Nhấn nút "ĐỔ XÚC XẮC". Tổng số nút 2 viên sẽ quyết định số bước bạn di chuyển theo chiều kim đồng hồ.',
      },
      {
        icon: '2️⃣',
        title: 'Thưởng Đổ Đôi & Thêm Lượt',
        desc: 'Nếu 2 viên xúc xắc cùng số nút (Đôi), bạn nhận thưởng ngay +50.000đ và được đi thêm 1 lượt! (Chú ý: Đổ đôi 3 lần liên tiếp sẽ bị bắt vào tù vì đi bão!).',
      },
      {
        icon: '3️⃣',
        title: 'Hành Động Tại Ô Dừng Chân',
        desc: 'Tùy ô bạn đáp xuống: mua đất chưa có chủ, nâng cấp nhà của mình, trả tiền thuê cho đối thủ, rút thẻ cơ hội, hoặc nhận thưởng quỹ heo đất.',
      },
      {
        icon: '4️⃣',
        title: 'Kết Thúc Lượt',
        desc: 'Nhấn nút "Kết Thúc Lượt" để chuyển quyền đi cho người chơi kế tiếp trong bàn.',
      },
    ],
  },
  {
    id: 'properties',
    tabLabel: 'Nhà & Độc Quyền',
    icon: '🏘️',
    title: 'Nâng Cấp Bất Động Sản & Độc Quyền Màu',
    subtitle: 'Xây dựng đế chế resort nghỉ dưỡng dọc miền đất nước',
    bullets: [
      {
        icon: '🌱',
        title: 'Đất Trống',
        desc: 'Mua ô đất đầu tiên để xác lập chủ quyền. Đối thủ đi vào sẽ phải trả tiền thuê đất cơ bản.',
      },
      {
        icon: '🏠',
        title: 'Nhà Cấp 1 & Nhà Cấp 2',
        desc: 'Khi quay lại ô đất của mình, chi trả phí xây dựng để nâng cấp nhà, tăng tiền thuê đất lên gấp nhiều lần.',
      },
      {
        icon: '🏰',
        title: 'Biệt Thự (Villa)',
        desc: 'Cấp độ 3 với kiến trúc nguy nga, biến ô đất thành nguồn thu lợi nhuận cực lớn.',
      },
      {
        icon: '👑',
        title: 'Siêu Resort 5 Sao (Cấp Tối Thượng)',
        desc: 'Đỉnh cao bất động sản nghỉ dưỡng! Bất kỳ ai vô tình dừng chân sẽ phải trả khoản tiền thuê khổng lồ, dễ dẫn tới phá sản.',
      },
      {
        icon: '🌈',
        title: 'Độc Quyền Trọn Bộ Màu (x2 Tiền Thuê)',
        desc: 'Nếu bạn gom đủ tất cả các ô trong cùng 1 miền địa lý (cùng màu), tiền thuê trên TOÀN BỘ các ô đó được nhân đôi tự động!',
      },
    ],
  },
  {
    id: 'special',
    tabLabel: 'Ô Đặc Biệt',
    icon: '🎪',
    title: 'Các Ô Sự Kiện & Thần Tài',
    subtitle: 'Những điểm dừng chân định đoạt vận mệnh ván đấu',
    bullets: [
      {
        icon: '🚩',
        title: 'Ô Xuất Phát (Cổng Làng)',
        desc: 'Mỗi lần hoàn thành 1 vòng tròn vượt qua Cổng Làng, ngân hàng thưởng nóng cho bạn +200.000đ tiền mặt.',
      },
      {
        icon: '🐖',
        title: 'Ô Lễ Hội (Ẵm Quỹ Heo Đất)',
        desc: 'Dừng chân tại đây, bạn sẽ ẵm trọn toàn bộ số tiền phạt tích lũy trong "Quỹ Heo Đất" Jackpot!',
      },
      {
        icon: '🚨',
        title: 'Ô Đi Bão Vào Tù & Trại Giam',
        desc: 'Bị bắt áp giải vào Trại Giam! Muốn ra tù bạn phải đổ được Đôi, hoặc nộp tiền phạt 100.000đ vào Quỹ Heo Đất, hoặc dùng Kim Bài Thoát Tù.',
      },
      {
        icon: '🃏',
        title: 'Ô Cơ Hội & Khí Vận',
        desc: 'Rút các lá bài bất ngờ mang phong cách Việt: nhận tiền trúng số, du lịch miễn phí, hoặc bị CSGT phạt vi phạm nồng độ cồn.',
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

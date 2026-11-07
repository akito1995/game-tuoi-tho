import { ChanceCard } from './types';

export const CHANCE_CARDS: ChanceCard[] = [
  {
    id: 'chance_01',
    title: 'Trúng số kiến thiết',
    description: 'Bạn trúng giải đặc biệt xổ số kiến thiết! Nhận ngay 150.000đ.',
    type: 'CASH_GAIN',
    amount: 150000,
    image: '/art/cards/events/event-trung-so.webp',
  },
  {
    id: 'chance_02',
    title: 'Bà ngoại cho tiền ăn bánh',
    description: 'Bà ngoại dưới quê lên thăm cho tiền ăn chè bánh lọt mát lành. Nhận 90.000đ.',
    type: 'CASH_GAIN',
    amount: 90000,
    image: '/art/cards/events/event-li-xi.webp',
  },
  {
    id: 'chance_03',
    title: 'Bay đến Sân bay Nội Bài',
    description: 'Bạn săn được vé máy bay 0 đồng hạ cánh thẳng xuống Sân bay Nội Bài!',
    type: 'TELEPORT',
    targetTileId: 35,
    image: '/art/cards/events/event-du-lich.webp',
  },
  {
    id: 'chance_04',
    title: 'Kim bài miễn phạt tù',
    description: 'Được bác tổ trưởng dân phố châm chước tha cho một lần. Giữ thẻ này để ra tù miễn phí.',
    type: 'JAIL_FREE',
    image: '/art/cards/events/event-thoat-tu.webp',
  },
  {
    id: 'chance_05',
    title: 'Vụ mùa lúa bội thu',
    description: 'Thời tiết mưa thuận gió hòa, ruộng đồng trúng lớn được mùa. Nhận 120.000đ.',
    type: 'CASH_GAIN',
    amount: 120000,
    image: '/art/cards/events/event-thuong-tet.webp',
  },
  {
    id: 'chance_06',
    title: 'Ghé thăm Thủ Đô Hà Nội',
    description: 'Chuyến hành trình dẫn bạn về thăm Khuê Văn Các tại Thủ Đô Hà Nội.',
    type: 'TELEPORT',
    targetTileId: 39,
    image: '/art/cards/events/event-ve-que.webp',
  },
  {
    id: 'chance_07',
    title: 'Khao bạn bè chè trà sữa',
    description: 'Hôm nay trời đẹp, bạn khao cả bàn mỗi người một ly chè mát lạnh! Trả mỗi người 35.000đ.',
    type: 'PAY_EACH_PLAYER',
    amount: 35000,
    image: '/art/cards/events/event-sinh-nhat.webp',
  },
  {
    id: 'chance_08',
    title: 'Bán hàng online đắt khách',
    description: 'Livestream đặc sản quê hương nổ đơn rào rào. Thu lời 140.000đ.',
    type: 'CASH_GAIN',
    amount: 140000,
    image: '/art/cards/events/event-dau-tu.webp',
  },
  {
    id: 'chance_09',
    title: 'Đánh rơi ví ở chợ',
    description: 'Mải ngắm gánh hoa chợ sớm làm rơi mất chiếc ví may mắn. Mất 60.000đ.',
    type: 'CASH_LOSS',
    amount: 60000,
    image: '/art/cards/events/event-ket-xe.webp',
  },
  {
    id: 'chance_10',
    title: 'Du lịch Sa Pa săn mây',
    description: 'Cuối tuần hứng khởi rủ bạn thân xách balo lên thẳng Sa Pa ngắm tuyết và săn mây.',
    type: 'TELEPORT',
    targetTileId: 27,
    image: '/art/cards/events/event-du-lich.webp',
  },
  {
    id: 'chance_11',
    title: 'Nhặt được của rơi',
    description: 'Nhặt được túi tiền trả người đánh mất, được gia đình cảm ơn hậu tạ 80.000đ.',
    type: 'CASH_GAIN',
    amount: 80000,
    image: '/art/cards/events/event-trung-so.webp',
  },
  {
    id: 'chance_12',
    title: 'Nghỉ mát tại Quán Trà Đá',
    description: 'Đi bộ mỏi gối, ghé ngay Quán Trà Đá nghỉ ngơi thưởng trà miễn phí!',
    type: 'TELEPORT',
    targetTileId: 20,
    image: '/art/cards/events/event-ve-que.webp',
  },
];

export const FATE_CARDS: ChanceCard[] = [
  {
    id: 'fate_01',
    title: 'Ủng hộ quỹ lụt miền Trung',
    description: 'Chung tay vì cộng đồng, gửi quà cứu trợ đồng bào lũ lụt. Đóng góp 100.000đ.',
    type: 'CASH_LOSS',
    amount: 100000,
    image: '/art/cards/events/event-cuu-tro-lu-lut.webp',
  },
  {
    id: 'fate_02',
    title: 'Bảo trì xe gắn máy',
    description: 'Xe chết máy giữa đường ngập nước, chi phí thay bugi và dầu nhớt mới. Trả 50.000đ.',
    type: 'CASH_LOSS',
    amount: 50000,
    image: '/art/cards/events/event-sua-nha.webp',
  },
  {
    id: 'fate_03',
    title: 'Xuôi ngược Bến Nhà Rồng',
    description: 'Di chuyển ngay đến Bến Nhà Rồng chiêm ngưỡng di tích lịch sử ven sông Sài Gòn.',
    type: 'TELEPORT',
    targetTileId: 5,
    image: '/art/cards/events/event-du-lich.webp',
  },
  {
    id: 'fate_04',
    title: 'Lì xì đầu xuân',
    description: 'Gia đình sum vầy chúc Tết nhận phong bao đỏ thắm may mắn. Nhận 100.000đ.',
    type: 'CASH_GAIN',
    amount: 100000,
    image: '/art/cards/events/event-li-xi.webp',
  },
  {
    id: 'fate_05',
    title: 'Vi phạm luật giao thông',
    description: 'Không đội mũ bảo hiểm khi đi xe máy, bị công an giao thông xử phạt 70.000đ.',
    type: 'CASH_LOSS',
    amount: 70000,
    image: '/art/cards/events/event-phat-nguoi.webp',
  },
  {
    id: 'fate_06',
    title: 'Đi bão bị bắt vào trại giam',
    description: 'Ăn mừng chiến thắng quá khích, bị áp giải thẳng vào Trại Giam!',
    type: 'TELEPORT',
    targetTileId: 10,
    image: '/art/cards/events/event-thoat-tu.webp',
  },
  {
    id: 'fate_07',
    title: 'Đi ăn cưới bạn thân',
    description: 'Mừng phong bì đám cưới người bạn nối khố. Mừng 120.000đ.',
    type: 'CASH_LOSS',
    amount: 120000,
    image: '/art/cards/events/event-sinh-nhat.webp',
  },
  {
    id: 'fate_08',
    title: 'Khen thưởng lao động giỏi',
    description: 'Cố gắng làm việc chăm chỉ suốt quý, được thưởng thi đua 90.000đ.',
    type: 'CASH_GAIN',
    amount: 90000,
    image: '/art/cards/events/event-thuong-tet.webp',
  },
  {
    id: 'fate_09',
    title: 'Trở về Xuất Phát',
    description: 'Hành trình một vòng trọn vẹn, quay trở về ô Xuất Phát nhận 200.000đ tiền lương.',
    type: 'TELEPORT',
    targetTileId: 0,
    image: '/art/cards/events/event-ve-que.webp',
  },
  {
    id: 'fate_10',
    title: 'Nghỉ dưỡng biển Nha Trang',
    description: 'Đi tàu hỏa ra biển Nha Trang ngắm tháp Trầm Hương và tắm biển.',
    type: 'TELEPORT',
    targetTileId: 18,
    image: '/art/cards/events/event-du-lich.webp',
  },
  {
    id: 'fate_11',
    title: 'Bảo lãnh tại ngoại',
    description: 'Được người quen đứng ra bảo lãnh khỏi trại giam. Nhận 1 thẻ miễn tù.',
    type: 'JAIL_FREE',
    image: '/art/cards/events/event-thoat-tu.webp',
  },
  {
    id: 'fate_12',
    title: 'Được mùa tôm Cà Mau',
    description: 'Trúng mẻ tôm sú Đất Mũi béo mẫm, thương lái mua hết sạch. Nhận 110.000đ.',
    type: 'CASH_GAIN',
    amount: 110000,
    image: '/art/cards/events/event-dau-tu.webp',
  },
];

/**
 * Lấy giá trị tiền thực thi của thẻ bài:
 * > 0: nhận tiền
 * < 0: mất tiền
 * = 0: dịch chuyển hoặc thẻ giữ lại
 */
export function getCardCashImpact(card: ChanceCard, activePlayersCount = 4): number {
  if (!card.amount) return 0;
  if (card.type === 'CASH_GAIN') return card.amount;
  if (card.type === 'CASH_LOSS') return -card.amount;
  if (card.type === 'PAY_EACH_PLAYER') {
    const others = Math.max(1, activePlayersCount - 1);
    return -(card.amount * others);
  }
  return 0;
}

export interface CardDisplayCash {
  text: string;
  isLoss: boolean;
  colorHex: string;
}

/**
 * Định dạng nhãn tiền hiển thị chuẩn theo logic thực thi
 */
export function formatCardCashDisplay(card: ChanceCard): CardDisplayCash | null {
  if (!card.amount) return null;
  const isLoss = card.type === 'CASH_LOSS' || card.type === 'PAY_EACH_PLAYER';
  const prefix = isLoss ? '−' : '+';
  const suffix = card.type === 'PAY_EACH_PLAYER' ? ' / người' : '';
  return {
    text: `${prefix}${card.amount.toLocaleString('vi-VN')}đ${suffix}`,
    isLoss,
    colorHex: isLoss ? '#dc2626' : '#16a34a',
  };
}

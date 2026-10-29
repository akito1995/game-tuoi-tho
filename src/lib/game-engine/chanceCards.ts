import { ChanceCard, FateCard } from './types';

/**
 * Humorous Vietnamese Folklore Chance Cards (Thẻ Cơ Hội)
 * Reflecting nostalgic Vietnamese childhood, folk tales, and cultural humor.
 */
export const CHANCE_CARDS: ChanceCard[] = [
  {
    id: 'chance_01',
    title: 'Trúng số độc đắc',
    description: 'Bạn trúng giải đặc biệt xổ số kiến thiết miền Tây! Nhận ngay 300.000đ.',
    type: 'CASH_GAIN',
    amount: 300000,
  },
  {
    id: 'chance_02',
    title: 'Bà ngoại cho tiền ăn bánh',
    description: 'Bà ngoại dưới quê lên thăm cho tiền ăn chè bánh lọt mát lành. Nhận 150.000đ.',
    type: 'CASH_GAIN',
    amount: 150000,
  },
  {
    id: 'chance_03',
    title: 'Vé bay khứ hồi Phú Quốc',
    description: 'Bạn săn được vé 0 đồng bay thẳng ra Đảo Ngọc Phú Quốc nghỉ mát tắm biển!',
    type: 'TELEPORT',
    targetTileId: 10,
  },
  {
    id: 'chance_04',
    title: 'Kim bài thoát tù',
    description: 'Được bác bảo vệ dân phố quen mặt châm chước tha cho một lần. Giữ thẻ này để thoát tù miễn phí.',
    type: 'JAIL_FREE',
  },
  {
    id: 'chance_05',
    title: 'Vụ mùa lúa bội thu',
    description: 'Thời tiết mưa thuận gió hòa, ruộng đồng trúng lớn được thương lái thu mua giá cao. Nhận 200.000đ.',
    type: 'CASH_GAIN',
    amount: 200000,
  },
  {
    id: 'chance_06',
    title: 'Đi dự Lễ Hội Dân Gian',
    description: 'Tiếng trống hội làng giòn giã rộn rã, di chuyển ngay đến ô Lễ Hội Dân Gian tham gia bắt vịt!',
    type: 'TELEPORT',
    targetTileId: 16,
  },
  {
    id: 'chance_07',
    title: 'Đãi bạn bè trà sữa',
    description: 'Hôm nay trời mát mẻ, bạn khao cả bàn mỗi người một ly trà sữa full thạch! Trả mỗi người 50.000đ.',
    type: 'PAY_EACH_PLAYER',
    amount: 50000,
  },
  {
    id: 'chance_08',
    title: 'Bán hàng online đắt khách',
    description: 'Livestream đặc sản quê nhà nổ đơn liên tục, shipper giao không kịp. Thu lời 250.000đ.',
    type: 'CASH_GAIN',
    amount: 250000,
  },
  {
    id: 'chance_09',
    title: 'Đánh rơi ví ở chợ',
    description: 'Mải ngắm gánh hoa chợ sớm làm rơi mất chiếc ví con heo may mắn. Mất 100.000đ.',
    type: 'CASH_LOSS',
    amount: 100000,
  },
  {
    id: 'chance_10',
    title: 'Chuyến tàu Thống Nhất',
    description: 'Bạn lên chuyến tàu Thống Nhất Bắc - Nam di chuyển thẳng tới Sân Bay Nội Bài.',
    type: 'TELEPORT',
    targetTileId: 27,
  },
  {
    id: 'chance_11',
    title: 'Nhặt được của rơi',
    description: 'Nhặt được túi tiền nhỏ trả người đánh mất, được gia đình cảm ơn hậu tạ 120.000đ.',
    type: 'CASH_GAIN',
    amount: 120000,
  },
  {
    id: 'chance_12',
    title: 'Du lịch Sa Pa săn mây',
    description: 'Cuối tuần hứng khởi rủ bạn thân xách balo lên thẳng Sa Pa ngắm tuyết và săn mây.',
    type: 'TELEPORT',
    targetTileId: 23,
  },
  {
    id: 'chance_13',
    title: 'Học bổng vượt khó',
    description: 'Đạt danh hiệu học sinh xuất sắc toàn diện trường làng, nhận học bổng khuyến học 180.000đ.',
    type: 'CASH_GAIN',
    amount: 180000,
  },
  {
    id: 'chance_14',
    title: 'Lì xì đỏ đầu năm',
    description: 'Đầu xuân đi chúc Tết ông bà họ hàng, nhận phong bao lì xì đỏ may mắn 220.000đ.',
    type: 'CASH_GAIN',
    amount: 220000,
  },
  {
    id: 'chance_wheel',
    title: 'Vé Vòng Quay May Mắn',
    description: 'Bốc được vé vàng tham gia Vòng Quay May Mắn Đảo Ngọc! Cơ hội ẵm trọn Heo Đất và thẻ bảo bối.',
    type: 'LUCKY_WHEEL',
  },
];

/**
 * Humorous Vietnamese Folklore Fate Cards (Thẻ Khí Vận)
 * Reflecting comedic day-to-day Vietnamese situations and unexpected destiny.
 */
export const FATE_CARDS: FateCard[] = [
  {
    id: 'fate_01',
    title: 'Đi bão quên đội mũ bảo hiểm',
    description: 'Hòa cùng dòng người ăn mừng cúp vàng nhưng quên đội mũ bảo hiểm! Nộp phạt 100.000đ vào Quỹ Lễ Hội.',
    type: 'CASH_LOSS',
    amount: 100000,
  },
  {
    id: 'fate_02',
    title: 'Bị bắt đi bão quá khích',
    description: 'Nẹt bô lạng lách trên phố bị các chú cảnh sát tuần tra túm gọn, áp giải ngay về Trại Giam!',
    type: 'TELEPORT',
    targetTileId: 8,
  },
  {
    id: 'fate_03',
    title: 'Tổ chức tiệc tân gia',
    description: 'Mời toàn thể anh em chòm xóm sang ăn cỗ tân gia rộn ràng. Tặng mỗi người chơi 50.000đ.',
    type: 'PAY_EACH_PLAYER',
    amount: 50000,
  },
  {
    id: 'fate_04',
    title: 'Thẻ ân xá đặc biệt',
    description: 'Được đặc xá nhân dịp đại lễ kỷ niệm toàn quốc. Giữ thẻ này để ra tù ngay lập tức khi gặp nạn.',
    type: 'JAIL_FREE',
  },
  {
    id: 'fate_05',
    title: 'Đóng tiền điện nước sinh hoạt',
    description: 'Tháng cao điểm nắng nóng quạt máy chạy hết công suất. Thanh toán hóa đơn 120.000đ.',
    type: 'CASH_LOSS',
    amount: 120000,
  },
  {
    id: 'fate_06',
    title: 'Về thăm Cố Đô Huế',
    description: 'Duyên số đưa bạn về thăm kinh thành Huế mộng mơ, thưởng thức bún bò và ca Huế trên sông Hương.',
    type: 'TELEPORT',
    targetTileId: 15,
  },
  {
    id: 'fate_07',
    title: 'Thủng lốp xe máy dọc đường',
    description: 'Cán phải đinh nhọn trên quốc lộ, tấp vào tiệm sửa xe ven đường thay săm lốp mới. Trả 80.000đ.',
    type: 'CASH_LOSS',
    amount: 80000,
  },
  {
    id: 'fate_08',
    title: 'Đập heo đất tiết kiệm',
    description: 'Sau cả năm kiên trì nhét tiền lẻ vào ống heo, hôm nay mổ heo gom được một khoản 200.000đ.',
    type: 'CASH_GAIN',
    amount: 200000,
  },
  {
    id: 'fate_09',
    title: 'Sửa mái nhà đón bão',
    description: 'Mùa mưa bão cận kề, chi tiền thuê thợ chằng chống gia cố mái ngói vững chãi. Chi phí 150.000đ.',
    type: 'CASH_LOSS',
    amount: 150000,
  },
  {
    id: 'fate_10',
    title: 'Về quê ăn giỗ tổ tiên',
    description: 'Cả gia đình tụ họp cúng giỗ truyền thống họ tộc, được các bác chia lộc may mắn 160.000đ.',
    type: 'CASH_GAIN',
    amount: 160000,
  },
  {
    id: 'fate_11',
    title: 'Tiến về Sài Gòn lập nghiệp',
    description: 'Nhận lời mời khởi nghiệp hấp dẫn, xách vali bay thẳng vào TP. Hồ Chí Minh!',
    type: 'TELEPORT',
    targetTileId: 31,
  },
  {
    id: 'fate_12',
    title: 'Phong bì mừng đám cưới bạn',
    description: 'Bạn thân hồi tiểu học gửi thiệp hồng báo hỷ, gửi phong bì mừng hạnh phúc 100.000đ.',
    type: 'CASH_LOSS',
    amount: 100000,
  },
  {
    id: 'fate_13',
    title: 'Chia cổ tức hợp tác xã',
    description: 'Hợp tác xã nông nghiệp chăn nuôi thủy sản đạt doanh thu kỷ lục. Nhận cổ tức 140.000đ.',
    type: 'CASH_GAIN',
    amount: 140000,
  },
  {
    id: 'fate_14',
    title: 'Quay về điểm Xuất Phát',
    description: 'Nghỉ ngơi lấy lại tinh thần, quay lại vạch Xuất Phát cổng làng và nhận 200.000đ!',
    type: 'TELEPORT',
    targetTileId: 0,
  },
  {
    id: 'fate_wheel',
    title: 'Vòng Quay Cơ Duyên',
    description: 'Thần May Mắn trao tặng bạn 1 lượt quay Vòng Quay May Mắn thử thách vận đỏ!',
    type: 'LUCKY_WHEEL',
  },
];

/**
 * Vietnamese Childhood Games Portal - Audio Asset Manifest & Voice Script Bank
 * Based on Section 6 & 11 of Audio Design Brief v1.0
 */

import { CharacterId, CharacterVoiceProfile, VoiceLineItem, SfxId, AudioPriority } from './types';

export const CHARACTER_PROFILES: Record<CharacterId, CharacterVoiceProfile> = {
  CHAR_01: {
    id: 'CHAR_01',
    name: 'Đại Ca Tự Tin',
    archetype: 'Đại ca tự tin (Heo Phượt)',
    voiceDesc: 'Nam trẻ, trung trầm, sáng rõ',
    actingStyle: 'Hào sảng, tự tin, phóng khoáng, phản ứng mạnh khi thắng hoặc có tiền',
    pitch: 1.0,
    rate: 1.05,
  },
  CHAR_02: {
    id: 'CHAR_02',
    name: 'Nữ Hoàng Cà Khịa',
    archetype: 'Nữ hoàng cà khịa (Cáo Quý Tộc)',
    voiceDesc: 'Nữ trẻ, sáng, hoạt bát, linh hoạt',
    actingStyle: 'Nhanh nhạy, tinh nghịch, châm chọc nhẹ, dí dỏm duyên dáng',
    pitch: 1.18,
    rate: 1.08,
  },
  CHAR_03: {
    id: 'CHAR_03',
    name: 'Thánh Nhọ Hài Hước',
    archetype: 'Thánh nhọ (Mèo May Mắn)',
    voiceDesc: 'Nam trẻ, hơi ngố, giàu biểu cảm',
    actingStyle: 'Bất ngờ, than thở hài hước, dễ hoảng khi mất tiền hoặc vào tù',
    pitch: 1.25,
    rate: 1.0,
  },
  CHAR_04: {
    id: 'CHAR_04',
    name: 'Cao Thủ Lạnh Lùng',
    archetype: 'Cao thủ lạnh lùng (Trâu Điềm Tĩnh)',
    voiceDesc: 'Nam trưởng thành, điềm tĩnh, trầm ấm',
    actingStyle: 'Bình thản, ít lời, khô hài, chốt câu sắc bén và chắc chắn',
    pitch: 0.85,
    rate: 0.92,
  },
};

/**
 * 14 Gameplay Triggers Sample Script Bank from Audio Design Brief
 */
export const VOICE_SCRIPT_BANK: VoiceLineItem[] = [
  // turn.start
  { id: 'v_c1_turn_start', characterId: 'CHAR_01', trigger: 'turn.start', textVi: 'Đến lượt tôi rồi!' },
  { id: 'v_c2_turn_start', characterId: 'CHAR_02', trigger: 'turn.start', textVi: 'Tới lượt nữ hoàng tỏa sáng.' },
  { id: 'v_c3_turn_start', characterId: 'CHAR_03', trigger: 'turn.start', textVi: 'Lạy trời, lượt này bình an nha!' },
  { id: 'v_c4_turn_start', characterId: 'CHAR_04', trigger: 'turn.start', textVi: 'Được. Đến lượt tôi.' },

  // dice.roll
  { id: 'v_c1_dice_roll', characterId: 'CHAR_01', trigger: 'dice.roll', textVi: 'Xúc xắc ơi, đừng làm anh thất vọng!' },
  { id: 'v_c2_dice_roll', characterId: 'CHAR_02', trigger: 'dice.roll', textVi: 'Nào, cho xem vận may của tôi đi!' },
  { id: 'v_c3_dice_roll', characterId: 'CHAR_03', trigger: 'dice.roll', textVi: 'Từ từ… xin đừng ra số xui!' },
  { id: 'v_c4_dice_roll', characterId: 'CHAR_04', trigger: 'dice.roll', textVi: 'Cứ để xác suất lên tiếng.' },

  // property.buy
  { id: 'v_c1_prop_buy', characterId: 'CHAR_01', trigger: 'property.buy', textVi: 'Mảnh đất này thuộc về tôi!' },
  { id: 'v_c2_prop_buy', characterId: 'CHAR_02', trigger: 'property.buy', textVi: 'Đầu tư khôn ngoan đấy chứ.' },
  { id: 'v_c3_prop_buy', characterId: 'CHAR_03', trigger: 'property.buy', textVi: 'Mua xong không biết còn tiền ăn không ta?' },
  { id: 'v_c4_prop_buy', characterId: 'CHAR_04', trigger: 'property.buy', textVi: 'Thêm một tài sản chiến lược. Rất tốt.' },

  // money.gain
  { id: 'v_c1_money_gain', characterId: 'CHAR_01', trigger: 'money.gain', textVi: 'Tiền về túi, quá đã!' },
  { id: 'v_c2_money_gain', characterId: 'CHAR_02', trigger: 'money.gain', textVi: 'Ví tiền vừa vui lên rồi đó nha!' },
  { id: 'v_c3_money_gain', characterId: 'CHAR_03', trigger: 'money.gain', textVi: 'Ủa, hôm nay được lộc thật hả?' },
  { id: 'v_c4_money_gain', characterId: 'CHAR_04', trigger: 'money.gain', textVi: 'Dòng tiền đã được ghi nhận.' },

  // money.loss
  { id: 'v_c1_money_loss', characterId: 'CHAR_01', trigger: 'money.loss', textVi: 'Ôi, đau ví quá chừng!' },
  { id: 'v_c2_money_loss', characterId: 'CHAR_02', trigger: 'money.loss', textVi: 'Tiền đi nhanh hơn cả lời hứa!' },
  { id: 'v_c3_money_loss', characterId: 'CHAR_03', trigger: 'money.loss', textVi: 'Khônggg, tiền mồ hôi nước mắt của tôi!' },
  { id: 'v_c4_money_loss', characterId: 'CHAR_04', trigger: 'money.loss', textVi: 'Một khoản chi ngoài dự kiến.' },

  // rent.pay
  { id: 'v_c1_rent_pay', characterId: 'CHAR_01', trigger: 'rent.pay', textVi: 'Rồi, tiền thuê đây, nhận đi!' },
  { id: 'v_c2_rent_pay', characterId: 'CHAR_02', trigger: 'rent.pay', textVi: 'Thuê nhà mà như bị thuế cảm xúc vậy đó.' },
  { id: 'v_c3_rent_pay', characterId: 'CHAR_03', trigger: 'rent.pay', textVi: 'Tôi chỉ đi ngang hóng gió thôi mà!' },
  { id: 'v_c4_rent_pay', characterId: 'CHAR_04', trigger: 'rent.pay', textVi: 'Nghĩa vụ thuê đã hoàn tất.' },

  // event.lucky
  { id: 'v_c1_evt_lucky', characterId: 'CHAR_01', trigger: 'event.lucky', textVi: 'Vận may luôn chọn đúng đại ca!' },
  { id: 'v_c2_evt_lucky', characterId: 'CHAR_02', trigger: 'event.lucky', textVi: 'Hôm nay cả vũ trụ đang đứng về phía tôi.' },
  { id: 'v_c3_evt_lucky', characterId: 'CHAR_03', trigger: 'event.lucky', textVi: 'Ủa? May mắn gõ cửa thật hả trời?' },
  { id: 'v_c4_evt_lucky', characterId: 'CHAR_04', trigger: 'event.lucky', textVi: 'Một biến số có lợi.' },

  // event.unlucky
  { id: 'v_c1_evt_unlucky', characterId: 'CHAR_01', trigger: 'event.unlucky', textVi: 'Không sao, anh vẫn kiểm soát được tình hình!' },
  { id: 'v_c2_evt_unlucky', characterId: 'CHAR_02', trigger: 'event.unlucky', textVi: 'Trời ơi, nghiệp quật nhanh vậy sao?' },
  { id: 'v_c3_evt_unlucky', characterId: 'CHAR_03', trigger: 'event.unlucky', textVi: 'Biết ngay mà! Số tui khổ quá mà!' },
  { id: 'v_c4_evt_unlucky', characterId: 'CHAR_04', trigger: 'event.unlucky', textVi: 'Một biến số bất lợi. Cần tái cơ cấu.' },

  // jail.enter
  { id: 'v_c1_jail_enter', characterId: 'CHAR_01', trigger: 'jail.enter', textVi: 'Tạm nghỉ dưỡng chiến thuật một chút thôi!' },
  { id: 'v_c2_jail_enter', characterId: 'CHAR_02', trigger: 'jail.enter', textVi: 'Ủa alo, ai gọi trật tự phường vậy?' },
  { id: 'v_c3_jail_enter', characterId: 'CHAR_03', trigger: 'jail.enter', textVi: 'Tôi bị oan! Tôi chỉ đứng xem thôi mà!' },
  { id: 'v_c4_jail_enter', characterId: 'CHAR_04', trigger: 'jail.enter', textVi: 'Tôi sẽ xem đây là thời gian tĩnh tâm suy nghĩ.' },

  // jail.escape
  { id: 'v_c1_jail_escape', characterId: 'CHAR_01', trigger: 'jail.escape', textVi: 'Tự do rồi! Trở lại đường đua thôi!' },
  { id: 'v_c2_jail_escape', characterId: 'CHAR_02', trigger: 'jail.escape', textVi: 'Thoát rồi nha, giờ ai cản nổi nữ hoàng?' },
  { id: 'v_c3_jail_escape', characterId: 'CHAR_03', trigger: 'jail.escape', textVi: 'Hú hồn! Cuối cùng cũng được thả ra rồi!' },
  { id: 'v_c4_jail_escape', characterId: 'CHAR_04', trigger: 'jail.escape', textVi: 'Trở lại đúng kế hoạch ban đầu.' },

  // jackpot
  { id: 'v_c1_jackpot', characterId: 'CHAR_01', trigger: 'jackpot', textVi: 'Đây mới là đẳng cấp của đại gia!' },
  { id: 'v_c2_jackpot', characterId: 'CHAR_02', trigger: 'jackpot', textVi: 'Ví tiền xin chân thành gửi lời cảm ơn hũ vàng!' },
  { id: 'v_c3_jackpot', characterId: 'CHAR_03', trigger: 'jackpot', textVi: 'Tôi giàu to rồi bà con ơi! Mơ hay thật vậy?!' },
  { id: 'v_c4_jackpot', characterId: 'CHAR_04', trigger: 'jackpot', textVi: 'Một kết quả đột phá đáng kể.' },

  // opponent.win
  { id: 'v_c1_opp_win', characterId: 'CHAR_01', trigger: 'opponent.win', textVi: 'Cứ ăn mừng đi, ván sau chưa chắc đâu nhé!' },
  { id: 'v_c2_opp_win', characterId: 'CHAR_02', trigger: 'opponent.win', textVi: 'Chúc mừng nha… tạm thời thôi đó!' },
  { id: 'v_c3_opp_win', characterId: 'CHAR_03', trigger: 'opponent.win', textVi: 'Sao người ta may mắn dữ vậy trời!' },
  { id: 'v_c4_opp_win', characterId: 'CHAR_04', trigger: 'opponent.win', textVi: 'Tôi đã ghi nhận kết quả này.' },

  // bankruptcy
  { id: 'v_c1_bankrupt', characterId: 'CHAR_01', trigger: 'bankruptcy', textVi: 'Ván này anh nhường các chú thôi!' },
  { id: 'v_c2_bankrupt', characterId: 'CHAR_02', trigger: 'bankruptcy', textVi: 'Phá sản nhưng thần thái của ta còn nguyên nhé!' },
  { id: 'v_c3_bankrupt', characterId: 'CHAR_03', trigger: 'bankruptcy', textVi: 'Tôi không còn gì ngoài một niềm tin sắt đá!' },
  { id: 'v_c4_bankrupt', characterId: 'CHAR_04', trigger: 'bankruptcy', textVi: 'Kế hoạch phá sản. Tôi rút lui khỏi ván chơi.' },

  // victory
  { id: 'v_c1_victory', characterId: 'CHAR_01', trigger: 'victory', textVi: 'Nhà vô địch Đảo Ngọc đã xuất hiện! Không ai khác ngoài tôi!' },
  { id: 'v_c2_victory', characterId: 'CHAR_02', trigger: 'victory', textVi: 'Thấy chưa? Đỉnh cao nhan sắc và trí tuệ là đây!' },
  { id: 'v_c3_victory', characterId: 'CHAR_03', trigger: 'victory', textVi: 'Trời đất ơi! Tui thắng thật hả mọi người?! Không thể tin được!' },
  { id: 'v_c4_victory', characterId: 'CHAR_04', trigger: 'victory', textVi: 'Kết quả hoàn toàn đúng như dự đoán từ đầu.' },
];

export const SFX_PRIORITY_MAP: Record<SfxId, AudioPriority> = {
  'bankruptcy': 'P0',
  'event.jackpot': 'P0',
  'game.victory': 'P0',

  'dice.roll': 'P1',
  'dice.land': 'P1',
  'property.buy': 'P1',
  'event.lucky': 'P1',
  'event.unlucky': 'P1',
  'jail.enter': 'P1',
  'cash.low': 'P1',
  'game.defeat': 'P1',
  'game.near_victory': 'P1',
  'player.eliminated': 'P1',

  'ui.confirm': 'P2',
  'dice.shake': 'P2',
  'dice.double': 'P2',
  'coin.gain': 'P2',
  'coin.loss': 'P2',
  'property.upgrade': 'P2',
  'card.draw': 'P2',
  'jail.escape': 'P2',
  'turn.start': 'P2',
  'event.surprise': 'P2',

  'ui.click': 'P3',
  'ui.hover': 'P3',
  'token.step': 'P3',
};

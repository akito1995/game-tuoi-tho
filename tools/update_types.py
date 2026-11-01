with open('src/game/types.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Add COLOR_GROUP_VIETNAMESE
old_color_map = """export const COLOR_GROUP_HEX: Record<ColorGroup, string> = {
  BROWN: '#A0673F',
  LIGHT_BLUE: '#4FB6E8',
  PINK: '#EE5FA0',
  ORANGE: '#F7923A',
  RED: '#E5484D',
  YELLOW: '#F2C230',
  GREEN: '#34B36E',
  DARK_BLUE: '#3D5AD6',
  TRANSPORT: '#718096',
  UTILITY: '#D69E2E',
};"""

new_color_map = """export const COLOR_GROUP_HEX: Record<ColorGroup, string> = {
  BROWN: '#A0673F',
  LIGHT_BLUE: '#4FB6E8',
  PINK: '#EE5FA0',
  ORANGE: '#F7923A',
  RED: '#E5484D',
  YELLOW: '#F2C230',
  GREEN: '#34B36E',
  DARK_BLUE: '#3D5AD6',
  TRANSPORT: '#718096',
  UTILITY: '#D69E2E',
};

export const COLOR_GROUP_VIETNAMESE: Record<ColorGroup, string> = {
  BROWN: 'Nâu Cà Mau',
  LIGHT_BLUE: 'Xanh Lam Nam Bộ',
  PINK: 'Hồng Tây Nguyên',
  ORANGE: 'Cam Duyên Hải',
  RED: 'Đỏ Cố Đô',
  YELLOW: 'Vàng Miền Trung',
  GREEN: 'Xanh Lá Đồng Bằng',
  DARK_BLUE: 'Xanh Đậm Thủ Đô',
  TRANSPORT: 'Giao Thông Xuyên Việt',
  UTILITY: 'Hạ Tầng Năng Lượng',
};"""

if old_color_map in content:
    content = content.replace(old_color_map, new_color_map, 1)
    print("Added COLOR_GROUP_VIETNAMESE")

# Update GamePhase with full states
old_phase = """export type GamePhase =
  | 'WAITING'
  | 'AWAIT_ROLL'
  | 'ROLLING'
  | 'MOVING'
  | 'RESOLVE_TILE'
  | 'AWAIT_DECISION'
  | 'CARD_DRAWN'
  | 'TURN_END'
  | 'GAME_OVER';"""

new_phase = """export type GamePhase =
  | 'WAITING'
  | 'AWAIT_ROLL'
  | 'ROLLING'
  | 'MOVING'
  | 'RESOLVE_TILE'
  | 'AWAIT_DECISION'
  | 'CARD_DRAWN'
  | 'ACTION_COMPLETED'
  | 'NEXT_TURN'
  | 'TURN_END'
  | 'GAME_OVER';"""

if old_phase in content:
    content = content.replace(old_phase, new_phase, 1)
    print("Updated GamePhase")

with open('src/game/types.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated src/game/types.ts successfully!")

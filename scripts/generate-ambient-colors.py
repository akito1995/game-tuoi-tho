import json
import io
import sys
import os
from PIL import Image
import numpy as np

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def main():
    board_path = 'public/art/board/board-plate.png'
    tiles_path = 'src/art/tiles-calibrated.json'
    out_path = 'src/art/tile-ambient-colors.json'

    if not os.path.exists(board_path) or not os.path.exists(tiles_path):
        print(f"Error: Missing files {board_path} or {tiles_path}")
        return

    im = Image.open(board_path).convert('RGB')
    w, h = im.size
    print(f"Loaded board plate: {w}x{h}")

    with open(tiles_path, 'r', encoding='utf-8') as f:
        tiles = json.load(f)

    # 1. Đo màu sương mù / trời xa (khu vực cầu Long Biên & hậu cảnh Bắc)
    # Tọa độ hậu cảnh xa phía bắc: x ~ 1300-1800, y ~ 150-250
    haze_box = im.crop((1300, 150, 1800, 260))
    haze_arr = np.array(haze_box)
    far_haze_rgb = haze_arr.mean(axis=(0, 1)).astype(int).tolist()
    far_haze_hex = '#{:02x}{:02x}{:02x}'.format(*far_haze_rgb)
    print(f"Far atmospheric haze color: {far_haze_rgb} ({far_haze_hex})")

    # 2. Đo màu môi trường lối đi/mặt đá cho 40 ô
    tile_colors = {}
    for t in tiles:
        t_id = t['id']
        u = t['center']['u']
        v = t['center']['v']
        cx = int(u * w)
        cy = int(v * h)

        # Lấy mẫu vùng 50x50 quanh tâm ô
        x0 = max(0, cx - 25)
        x1 = min(w, cx + 25)
        y0 = max(0, cy - 25)
        y1 = min(h, cy + 25)

        box = im.crop((x0, y0, x1, y1))
        arr = np.array(box)
        avg_rgb = arr.mean(axis=(0, 1)).astype(int).tolist()
        hex_val = '#{:02x}{:02x}{:02x}'.format(*avg_rgb)

        tile_colors[str(t_id)] = {
            'id': t_id,
            'name': t.get('name', f'Ô {t_id}'),
            'rgb': avg_rgb,
            'hex': hex_val,
            'r': avg_rgb[0] / 255.0,
            'g': avg_rgb[1] / 255.0,
            'b': avg_rgb[2] / 255.0,
        }

    data = {
        'farHaze': {
            'rgb': far_haze_rgb,
            'hex': far_haze_hex,
            'r': far_haze_rgb[0] / 255.0,
            'g': far_haze_rgb[1] / 255.0,
            'b': far_haze_rgb[2] / 255.0,
        },
        'tiles': tile_colors
    }

    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"Generated {out_path} for all {len(tile_colors)} tiles successfully!")

if __name__ == '__main__':
    main()

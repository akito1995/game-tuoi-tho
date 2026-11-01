import json
import os
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

BASE_W = 3344.0
BASE_H = 1880.0

tools_dir = os.path.join(os.getcwd(), 'tools')

# 1. Tạo tools/board-calibration.json
board_corners = {
    "referenceResolution": {"width": 3344, "height": 1880},
    "outer": [
        {"u": round(1625 / BASE_W, 6), "v": round(1800 / BASE_H, 6), "name": "Nam - Xuất Phát"},
        {"u": round(205 / BASE_W, 6),  "v": round(800 / BASE_H, 6),  "name": "Tây - Trại Giam"},
        {"u": round(1630 / BASE_W, 6), "v": round(215 / BASE_H, 6),  "name": "Bắc - Quán Trà Đá"},
        {"u": round(3080 / BASE_W, 6), "v": round(920 / BASE_H, 6),  "name": "Đông - Vào Tù"}
    ],
    "inner": [
        {"u": round(1625 / BASE_W, 6), "v": round(1618 / BASE_H, 6), "name": "Nam - Bờ hồ"},
        {"u": round(525 / BASE_W, 6),  "v": round(800 / BASE_H, 6),  "name": "Tây - Bờ hồ"},
        {"u": round(1630 / BASE_W, 6), "v": round(355 / BASE_H, 6),  "name": "Bắc - Bờ hồ"},
        {"u": round(2770 / BASE_W, 6), "v": round(920 / BASE_H, 6),  "name": "Đông - Bờ hồ"}
    ]
}

with open(os.path.join(tools_dir, 'board-calibration.json'), 'w', encoding='utf-8') as f:
    json.dump(board_corners, f, indent=2, ensure_ascii=False)
print("Đã tạo tools/board-calibration.json!")

# 2. Chuyển đổi tools/tiles.json sang toạ độ tương đối (u, v)
tiles_path = os.path.join(tools_dir, 'tiles.json')
if os.path.exists(tiles_path):
    with open(tiles_path, 'r', encoding='utf-8') as f:
        tiles = json.load(f)

    for t in tiles:
        # corners
        for c in t['corners']:
            if 'u' not in c or 'v' not in c:
                c['u'] = round(c['x'] / BASE_W, 6)
                c['v'] = round(c['y'] / BASE_H, 6)
        # center
        if 'u' not in t['center'] or 'v' not in t['center']:
            t['center']['u'] = round(t['center']['x'] / BASE_W, 6)
            t['center']['v'] = round(t['center']['y'] / BASE_H, 6)

    with open(tiles_path, 'w', encoding='utf-8') as f:
        json.dump(tiles, f, indent=2, ensure_ascii=False)
    print(f"Đã cập nhật toạ độ tương đối (u, v) cho {len(tiles)} ô trong tools/tiles.json!")

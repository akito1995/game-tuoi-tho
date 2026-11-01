import os
import sys
import io
import shutil
import numpy as np
from PIL import Image, ImageFilter
from collections import deque

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

ROOT_DIR = os.getcwd()
ART_DIR = os.path.join(ROOT_DIR, 'public', 'art')
CLEAN_DIR = os.path.join(ART_DIR, '_clean')

os.makedirs(os.path.join(CLEAN_DIR, 'tiles'), exist_ok=True)
os.makedirs(os.path.join(CLEAN_DIR, 'ui'), exist_ok=True)
os.makedirs(os.path.join(CLEAN_DIR, 'buildings'), exist_ok=True)
os.makedirs(os.path.join(CLEAN_DIR, 'corners'), exist_ok=True)

# -------------------------------------------------------------
# 1. CẮT BẰNG MẶT NẠ HÌNH TRÒN TỰ ĐỘNG CHO TILES
# -------------------------------------------------------------
def clean_tile_circular(filename):
    src_path = os.path.join(ART_DIR, 'tiles', filename)
    clean_path = os.path.join(CLEAN_DIR, 'tiles', filename)
    
    im = Image.open(src_path).convert('RGBA')
    arr = np.array(im, dtype=np.float32)
    h, w, _ = arr.shape
    
    # Tìm vùng chứa huy hiệu: pixel có ít nhất 1 kênh màu < 235
    rgb = arr[:, :, :3]
    non_white = np.any(rgb < 235, axis=2)
    ys, xs = np.where(non_white)
    
    if len(xs) == 0 or len(ys) == 0:
        print(f"[TILES] {filename}: Không tìm thấy vùng huy hiệu")
        return
        
    min_x, max_x = xs.min(), xs.max()
    min_y, max_y = ys.min(), ys.max()
    cx = (min_x + max_x) / 2.0
    cy = (min_y + max_y) / 2.0
    
    # Bán kính vòng tròn lớn nhất của huy hiệu
    rx = (max_x - min_x) / 2.0
    ry = (max_y - min_y) / 2.0
    r = max(rx, ry)
    
    # Tạo lưới toạ độ khoảng cách
    y_coords, x_coords = np.ogrid[:h, :w]
    dist_sq = (x_coords - cx) ** 2 + (y_coords - cy) ** 2
    dist = np.sqrt(dist_sq)
    
    # Mặt nạ alpha với viền mềm 1.2px
    alpha_mask = np.clip(((r + 0.5) - dist) / 1.5, 0.0, 1.0)
    
    res_arr = arr.copy()
    res_arr[:, :, 3] = arr[:, :, 3] * alpha_mask
    
    clean_im = Image.fromarray(np.uint8(np.round(res_arr)), mode='RGBA')
    # Tối ưu kích thước max 1024px để load cực nhanh trong game
    if max(w, h) > 1024:
        clean_im = clean_im.resize((1024, 1024), Image.Resampling.LANCZOS)
    clean_im.save(clean_path, format='PNG', optimize=True)
    
    filesize_kb = os.path.getsize(clean_path) / 1024
    print(f"[TILES] {filename}: tâm=({cx:.1f}, {cy:.1f}), r={r:.1f}px -> {filesize_kb:.1f} KB")

# -------------------------------------------------------------
# 2. TÁCH NỀN BẰNG FLOOD-FILL TỪ BIÊN CHO UI VÀ BUILDINGS
# -------------------------------------------------------------
def clean_by_floodfill(src_path, clean_path, max_dim=1024, bg_thresh=238):
    im = Image.open(src_path).convert('RGBA')
    w, h = im.size
    
    # Thu nhỏ nếu vượt max_dim
    if max_dim and (w > max_dim or h > max_dim):
        scale = max_dim / max(w, h)
        new_w = int(round(w * scale))
        new_h = int(round(h * scale))
        im = im.resize((new_w, new_h), Image.Resampling.LANCZOS)
        w, h = new_w, new_h
        
    arr = np.array(im, dtype=np.uint8)
    
    # Kiểm tra xem ảnh đã có alpha chưa
    if np.any(arr[:, :, 3] < 250):
        # Ảnh đã có nền trong suốt (như house-1..house-4)
        im.save(clean_path, format='PNG', optimize=True)
        filesize_kb = os.path.getsize(clean_path) / 1024
        print(f"  [Đã có Alpha] {os.path.basename(clean_path)}: ({w}x{h}), {filesize_kb:.1f} KB")
        return
        
    # Nhận diện điểm nền từ biên: pixel trắng hoặc gần trắng (R,G,B >= bg_thresh)
    rgb = arr[:, :, :3]
    is_candidate = np.all(rgb >= bg_thresh, axis=2)
    
    is_bg = np.zeros((h, w), dtype=bool)
    queue = deque()
    
    # Thêm 4 viền
    for x in range(w):
        if is_candidate[0, x]:
            is_bg[0, x] = True
            queue.append((0, x))
        if is_candidate[h - 1, x]:
            is_bg[h - 1, x] = True
            queue.append((h - 1, x))
            
    for y in range(h):
        if is_candidate[y, 0] and not is_bg[y, 0]:
            is_bg[y, 0] = True
            queue.append((y, 0))
        if is_candidate[y, w - 1] and not is_bg[y, w - 1]:
            is_bg[y, w - 1] = True
            queue.append((y, w - 1))
            
    # BFS loang màu
    while queue:
        cy, cx = queue.popleft()
        for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            ny, nx = cy + dy, cx + dx
            if 0 <= ny < h and 0 <= nx < w:
                if not is_bg[ny, nx] and is_candidate[ny, nx]:
                    is_bg[ny, nx] = True
                    queue.append((ny, nx))
                    
    # Tạo mặt nạ alpha mềm mại (feather 1px)
    mask = Image.fromarray(np.uint8(~is_bg * 255), mode='L')
    mask_blurred = mask.filter(ImageFilter.GaussianBlur(radius=0.7))
    mask_arr = np.array(mask_blurred, dtype=np.float32) / 255.0
    
    res_arr = arr.astype(np.float32)
    res_arr[:, :, 3] = res_arr[:, :, 3] * mask_arr
    
    # Defringe mép bán trong suốt
    edge_idx = (res_arr[:, :, 3] > 0) & (res_arr[:, :, 3] < 220)
    res_arr[edge_idx, :3] = res_arr[edge_idx, :3] * 0.88
    
    clean_im = Image.fromarray(np.uint8(np.round(res_arr)), mode='RGBA')
    clean_im.save(clean_path, format='PNG', optimize=True)
    
    filesize_kb = os.path.getsize(clean_path) / 1024
    print(f"  [Tách nền OK] {os.path.basename(clean_path)}: ({w}x{h}), {filesize_kb:.1f} KB")

# -------------------------------------------------------------
# 3. TÁCH NỀN ĐẶC BIỆT CHO QUÁN TRÀ ĐÁ (CORNER)
# -------------------------------------------------------------
def clean_quan_tra_da():
    src_path = os.path.join(ART_DIR, 'corners', 'corner-quan-tra-da.png')
    clean_path = os.path.join(CLEAN_DIR, 'corners', 'corner-quan-tra-da-transparent.png')
    target_orig_trans = os.path.join(ART_DIR, 'corners', 'corner-quan-tra-da-transparent.png')
    
    if not os.path.exists(src_path):
        print("[CORNER] Không tìm thấy corner-quan-tra-da.png")
        return
        
    im = Image.open(src_path).convert('RGB')
    w, h = im.size
    
    # Resize về 1200x1600 để tối ưu dung lượng và bộ nhớ
    max_dim = 1600
    if max(w, h) > max_dim:
        scale = max_dim / max(w, h)
        w, h = int(round(w * scale)), int(round(h * scale))
        im = im.resize((w, h), Image.Resampling.LANCZOS)
        
    arr = np.array(im, dtype=np.uint8)
    r = arr[:, :, 0].astype(int)
    g = arr[:, :, 1].astype(int)
    b = arr[:, :, 2].astype(int)
    brightness = (r + g + b) / 3.0
    diff = np.maximum(np.maximum(np.abs(r - g), np.abs(r - b)), np.abs(g - b))
    
    # Điểm nền màu trắng sáng và ít bão hòa màu
    is_bg_candidate = (brightness >= 235) & (diff <= 20)
    
    is_bg = np.zeros((h, w), dtype=bool)
    queue = deque()
    for x in range(w):
        if is_bg_candidate[0, x]: is_bg[0, x] = True; queue.append((0, x))
        if is_bg_candidate[h-1, x]: is_bg[h-1, x] = True; queue.append((h-1, x))
    for y in range(h):
        if is_bg_candidate[y, 0] and not is_bg[y, 0]: is_bg[y, 0] = True; queue.append((y, 0))
        if is_bg_candidate[y, w-1] and not is_bg[y, w-1]: is_bg[y, w-1] = True; queue.append((y, w-1))
        
    while queue:
        cy, cx = queue.popleft()
        for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            ny, nx = cy + dy, cx + dx
            if 0 <= ny < h and 0 <= nx < w:
                if not is_bg[ny, nx] and is_bg_candidate[ny, nx]:
                    is_bg[ny, nx] = True
                    queue.append((ny, nx))
                    
    # Lỗ hổng trắng giữa các tán cây ở 75% chiều cao phía trên
    enclosed_holes = (brightness >= 244) & (diff <= 10)
    enclosed_holes[int(h * 0.75):, :] = False
    is_bg = is_bg | enclosed_holes
    
    mask = Image.fromarray(np.uint8(~is_bg * 255), mode='L')
    mask_blurred = mask.filter(ImageFilter.GaussianBlur(radius=0.7))
    mask_arr = np.array(mask_blurred, dtype=np.float32) / 255.0
    
    res_arr = np.zeros((h, w, 4), dtype=np.float32)
    res_arr[:, :, :3] = arr.astype(np.float32)
    res_arr[:, :, 3] = mask_arr * 255.0
    
    # Khử quầng trắng viền
    edge_idx = (res_arr[:, :, 3] > 0) & (res_arr[:, :, 3] < 225)
    res_arr[edge_idx, :3] = res_arr[edge_idx, :3] * 0.88
    
    clean_im = Image.fromarray(np.uint8(np.round(res_arr)), mode='RGBA')
    clean_im.save(clean_path, format='PNG', optimize=True)
    clean_im.save(target_orig_trans, format='PNG', optimize=True)
    
    filesize_kb = os.path.getsize(clean_path) / 1024
    print(f"[CORNER] corner-quan-tra-da.png đã tách nền sạch sâu: ({w}x{h}), {filesize_kb:.1f} KB")

# -------------------------------------------------------------
# THỰC THI TOÀN BỘ
# -------------------------------------------------------------
def run():
    print("=== 1. TÁCH NỀN HUY HIỆU TRÒN (TILES) ===")
    tiles = ['tile-co-hoi.png', 'tile-khi-van.png', 'tile-thue-thu-nhap.png', 'tile-thue-xa-xi.png']
    for t in tiles:
        clean_tile_circular(t)
        
    print("\n=== 2. TÁCH NỀN CÁC BIỂU TƯỢNG UI ===")
    ui_files = ['skill-doi.png', 'skill-nhay-ngan.png', 'skill-nhay-xa.png', 'ui-dong-xu.png', 'ui-logo.png', 'ui-tien-giay.png']
    for u in ui_files:
        src = os.path.join(ART_DIR, 'ui', u)
        dst = os.path.join(CLEAN_DIR, 'ui', u)
        if os.path.exists(src):
            clean_by_floodfill(src, dst, max_dim=1024, bg_thresh=240)
            
    print("\n=== 3. TÁCH NỀN QUÁN TRÀ ĐÁ ===")
    clean_quan_tra_da()
            
    print("\n=== 3. TÁCH NỀN & TỐI ƯU TOÀN BỘ CÔNG TRÌNH (BUILDINGS) ===")
    b_dir = os.path.join(ART_DIR, 'buildings')
    buildings = [f for f in sorted(os.listdir(b_dir)) if f.endswith('.png')]
    for b in buildings:
        src = os.path.join(b_dir, b)
        dst = os.path.join(CLEAN_DIR, 'buildings', b)
        clean_by_floodfill(src, dst, max_dim=1024, bg_thresh=238)
        
    print("\n=== HOÀN TẤT QUY TRÌNH TÁCH NỀN VÀ TỐI ƯU ẢNH VÀO _CLEAN/ ===")

if __name__ == '__main__':
    run()

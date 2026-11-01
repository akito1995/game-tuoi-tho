import os
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
from PIL import Image, ImageFilter

def optimize_board():
    board_dir = os.path.join(os.getcwd(), 'public', 'art', 'board')
    source_plate = os.path.join(board_dir, 'board-plate.png')

    if not os.path.exists(source_plate):
        print(f"Error: Không tìm thấy {source_plate}")
        sys.exit(1)

    src_img = Image.open(source_plate)
    src_w, src_h = src_img.size
    print(f"1. Ảnh nguồn board-plate.png: {src_w} x {src_h} ({src_img.format})")

    # A. Bản máy tính: Cạnh dài tối đa 4096px
    # Nếu ảnh nguồn nhỏ hơn 4096px thì giữ nguyên kích thước nguồn (KHÔNG phóng to)
    if max(src_w, src_h) > 4096:
        scale_desktop = 4096.0 / max(src_w, src_h)
        desk_w = int(round(src_w * scale_desktop))
        desk_h = int(round(src_h * scale_desktop))
        desktop_img = src_img.resize((desk_w, desk_h), Image.Resampling.LANCZOS)
        # Làm nét nhẹ (unsharp mask) sau khi thu nhỏ
        desktop_img = desktop_img.filter(ImageFilter.UnsharpMask(radius=1.0, percent=50, threshold=3))
        print(f"2. Thu nhỏ bản máy tính về {desk_w} x {desk_h} + unsharp mask")
    else:
        desk_w, desk_h = src_w, src_h
        desktop_img = src_img
        print(f"2. Ảnh nguồn <= 4096px -> Giữ nguyên kích thước máy tính: {desk_w} x {desk_h}")

    desktop_webp_path = os.path.join(board_dir, 'board-plate.webp')
    desktop_img.save(desktop_webp_path, 'WEBP', quality=92, method=6)
    print(f"   -> Đã lưu WebP 92 máy tính: {desktop_webp_path} ({os.path.getsize(desktop_webp_path) / 1024 / 1024:.2f} MB)")

    # B. Bản điện thoại: Cạnh dài tối đa 2048px (thay cho 1920px)
    if max(src_w, src_h) > 2048:
        scale_mobile = 2048.0 / max(src_w, src_h)
        mob_w = int(round(src_w * scale_mobile))
        mob_h = int(round(src_h * scale_mobile))
        mobile_img = src_img.resize((mob_w, mob_h), Image.Resampling.LANCZOS)
        mobile_img = mobile_img.filter(ImageFilter.UnsharpMask(radius=0.8, percent=45, threshold=3))
        print(f"3. Thu nhỏ bản điện thoại về {mob_w} x {mob_h} + unsharp mask")
    else:
        mob_w, mob_h = src_w, src_h
        mobile_img = src_img
        print(f"3. Ảnh nguồn <= 2048px -> Giữ nguyên kích thước điện thoại: {mob_w} x {mob_h}")

    mobile_webp_path = os.path.join(board_dir, 'board-plate-small.webp')
    mobile_img.save(mobile_webp_path, 'WEBP', quality=92, method=6)
    print(f"   -> Đã lưu WebP 92 điện thoại: {mobile_webp_path} ({os.path.getsize(mobile_webp_path) / 1024 / 1024:.2f} MB)")

    # C. Đồng bộ lake-mask.png và foreground.png về đúng kích thước ảnh nền mới
    lake_mask_path = os.path.join(board_dir, 'lake-mask.png')
    if os.path.exists(lake_mask_path):
        mask_img = Image.open(lake_mask_path)
        if mask_img.size != (desk_w, desk_h):
            print(f"4. Co giãn lake-mask.png từ {mask_img.size} về {desk_w} x {desk_h}...")
            resized_mask = mask_img.resize((desk_w, desk_h), Image.Resampling.LANCZOS)
            resized_mask.save(lake_mask_path, 'PNG', optimize=True)
            print(f"   -> Đã đồng bộ lake-mask.png thành công!")
        else:
            print(f"4. lake-mask.png đã đúng kích thước {desk_w} x {desk_h}")

    # Đồng bộ foreground.png nếu có
    foreground_path = os.path.join(board_dir, 'foreground.png')
    if os.path.exists(foreground_path):
        fore_img = Image.open(foreground_path)
        if fore_img.size != (desk_w, desk_h):
            print(f"5. Co giãn foreground.png từ {fore_img.size} về {desk_w} x {desk_h}...")
            resized_fore = fore_img.resize((desk_w, desk_h), Image.Resampling.LANCZOS)
            resized_fore.save(foreground_path, 'PNG', optimize=True)
            print(f"   -> Đã đồng bộ foreground.png thành công!")

    print("Hoàn tất tối ưu ảnh bàn cờ!")

if __name__ == '__main__':
    optimize_board()

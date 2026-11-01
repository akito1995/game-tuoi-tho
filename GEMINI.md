# LUẬT DỰ ÁN – CỜ TỶ PHÚ v2 (2.5D)

## Định hướng
- Game cờ tỷ phú chủ đề "Hành trình xuyên Việt", đồ hoạ 2.5D dùng ảnh dựng sẵn, phong cách Meta World: My City, đậm chất Việt Nam.
- Ảnh tham chiếu: public/art/_ref/concept-board.png (bố cục, ánh sáng, giao diện), public/art/_ref/ref-lineup.png (nhân vật).
- Dữ liệu 40 ô: docs/board-data.md là nguồn duy nhất.

## Kỹ thuật
- Lớp hình ảnh dùng Pixi.js v8. Three.js chỉ dùng cho xúc xắc 3D. Giao diện (HUD) bằng HTML/CSS đè lên canvas.
- Camera cố định: chỉ phóng to 0.8–1.6x và kéo, không xoay.
- Chỉ vẽ lại khi có chuyển động (render on demand). Mục tiêu 60 FPS trên laptop thường và điện thoại tầm trung.
- Toàn bộ chữ do code vẽ (font Be Vietnam Pro cho chữ thường, Baloo 2 cho tiêu đề/số tiền), không dùng chữ trong ảnh.
- Không dùng backdrop-filter. Không dùng HTML để gắn nhãn lên bàn cờ.
- Ảnh tài nguyên chỉ đọc từ public/art/ qua src/art/manifest.json. Thiếu ảnh thì dùng hình tạm, không làm game dừng.

## Màu sắc
- Nhóm đất: Nâu #A0673F, Xanh nhạt #4FB6E8, Hồng #EE5FA0, Cam #F7923A, Đỏ #E5484D, Vàng #F2C230, Xanh lá #34B36E, Xanh đậm #3D5AD6.
- Người chơi: Bé Tí #E5484D (đỏ), Cô Hoa #19B8A6 (xanh ngọc), Ông Bảy #F5B83D (vàng), Chị Mây #8B6CF0 (tím).
- Chữ trên ô #3A2A1A. Nút chính vàng/cam.

## Cách làm việc
- Luôn trình bày kế hoạch và danh sách file sẽ sửa trước khi code; chờ tôi duyệt.
- Không sửa luật chơi/tính tiền nếu tôi không yêu cầu rõ.
- Mỗi bước xong phải tự chạy thử, chụp màn hình bằng trình duyệt và báo FPS.
- Không bao giờ đẩy code lên nhánh main hoặc deploy nếu tôi không yêu cầu.
- Trả lời tôi bằng tiếng Việt, đơn giản, vì tôi không biết lập trình.

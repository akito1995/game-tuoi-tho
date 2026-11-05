# UI/UX Designer

## Trách nhiệm

- Giữ phong cách Việt Nam, camera/nhãn/màu và asset hiện có; đọc `GEMINI.md`.
- Thiết kế luồng, thứ bậc thông tin, touch, bàn phím và trạng thái chờ/lỗi/khóa thao tác.
- Bảo đảm HUD không che ô quan trọng hoặc cắt nút trên màn hình nhỏ/thấp.
- Không tự đổi giá, lợi thế nhân vật hoặc quy tắc lượt để làm UI thuận tiện hơn.

## Đầu vào

Brief; luật/luồng từ Designer; giao diện hiện tại trong `src/renderer25d/hud`,
`src/app/play-v2/page.tsx`; bố cục/asset hiện có; lỗi responsive và tiêu chí QA.

## Đầu ra

Mô tả luồng và trạng thái, bố cục theo kích thước, nội dung tiếng Việt, focus/Tab/Escape,
vùng chạm và điều kiện nút bật/tắt. Dẫn file/module cụ thể, nêu phần có thể tái sử dụng.
Mockup mới chỉ tạo khi nhiệm vụ cho phép; không tự mua/tạo lại asset.

## Điều kiện bàn giao

- Developer nhận mô tả đủ để thực hiện mà không tự suy ra gameplay.
- QA nhận tiêu chí cho 360×800, 390×844, 844×390, 1440×900 khi liên quan responsive.
- Thay đổi hình ảnh có ảnh trước/sau và môi trường đo FPS nếu đã triển khai, hoặc ghi chưa kiểm chứng.
- Nội dung UI không hứa tính năng/luật chưa có; mọi thay đổi có tác động gameplay trả Designer/Director.
- Với nhiệm vụ chỉ tài liệu, không mở game/chạy công cụ ghi asset chỉ để tạo minh chứng.

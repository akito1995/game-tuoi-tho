# Game Designer

## Trách nhiệm

- Đặc tả luật và luồng người chơi trên nền game hiện có; đối chiếu `src/game` và tài liệu.
- Đưa ví dụ tiền/vị trí/lượt cụ thể; nêu tình huống biên và quan hệ với UI/bot.
- Đánh dấu rõ “hiện trạng”, “lỗi”, “đề xuất” và “đã được người dùng duyệt”.
- Không tự cân bằng lại giá, xác suất, bot hoặc biến `docs/rules-v2.md` thành yêu cầu triển khai.

## Đầu vào

Brief Director; quyết định người dùng; `docs/game-design.md`, `docs/rules-v2.md`;
`src/game/{types,engine,boardData,rulesV2Financials,chanceCards}.ts`; test liên quan.

## Đầu ra

Đặc tả nhỏ: điều kiện kích hoạt, người được thao tác, đầu vào hợp lệ, thay đổi trạng thái,
tiền/vị trí trước–sau, kết thúc lượt, tình huống lỗi và thông tin cần hiện.
Nêu ảnh hưởng đến legacy, save/online nếu có. Đề xuất thay đổi luật để riêng, không trộn với hiện trạng.

## Điều kiện bàn giao

- Developer/QA nhận cùng bộ ví dụ có thể kiểm chứng và không còn công thức mơ hồ.
- Mọi khác biệt gameplay so với code hiện tại có quyết định người dùng hoặc được đánh dấu chưa triển khai.
- UI/UX nhận nội dung và trạng thái cần thể hiện, không phải tự suy ra luật.
- Nếu đặc tả mâu thuẫn nguồn, trả Director để chốt; không chọn âm thầm một luật thuận tiện.

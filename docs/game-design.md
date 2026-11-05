# Thiết kế game — hiện trạng đã đối chiếu

Ngày đối chiếu: 2026-11-05. Mốc mã nguồn: `4acf072056560f97f8d1cea79115de74217f8f6a`.
Tài liệu này mô tả code đã đọc, không phê duyệt luật mới và không biến lỗi thành thiết kế mong muốn.
Phạm vi chính là bản 40 ô tại `/play-v2`; không áp dụng bảng giá này cho engine legacy.

## Trải nghiệm và bàn cờ

- Chủ đề Hành trình xuyên Việt; bốn nhân vật Bé Tí, Cô Hoa, Ông Bảy, Chị Mây.
- Bridge hỗ trợ cấu hình 2–4 người; mặc định một người và các bot. Có chế độ tự động toàn bot.
- Bàn cờ 40 ô, ID 0–39: Xuất Phát 0, Trại Giam 10, Quán Trà Đá 20, Vào Tù 30.
- Giao thông tại 5/15/25/35; tiện ích tại 12/28; thuế tại 4/38.

Nguồn: [types](../src/game/types.ts), [boardData](../src/game/boardData.ts),
[bridge/createEngine](../src/renderer25d/gameV2Bridge.ts), [lobby](../src/renderer25d/hud/LobbyModal.tsx).
Lobby có mô tả lợi thế riêng của nhân vật, nhưng chưa thấy engine áp dụng các lợi thế đó;
không coi nội dung quảng bá này là cơ chế đã xác minh.

## Tiền, xúc xắc và di chuyển

| Quy tắc hiện tại | Giá trị/hành vi | Nguồn |
| --- | --- | --- |
| Tiền đầu ván mặc định | 2.000.000đ/người | `DEFAULT_SETTINGS`, `src/game/types.ts` |
| Đi qua hoặc về Xuất Phát bằng bước đi | +200.000đ; chưa có thưởng riêng 300K khi dừng đúng ô | `movePlayer`, `src/game/engine.ts` |
| Xúc xắc thường | Hai số nguyên 1–6 bằng `Math.random()` | `rollDice`, `src/game/engine.ts` |
| Đổ đôi | Engine cho đổ tiếp sau khi xử lý xong ô, nếu không ở tù và chưa ba đôi liên tiếp | `completeAction`, `src/game/engine.ts` |
| Ba đôi liên tiếp | Vào tù, kết thúc lượt | `rollDice`, `src/game/engine.ts` |
| Di chuyển | Cộng số bước, lấy phần dư số ô; engine mặc định 40 | `movePlayer`, `src/game/engine.ts` |
| Dịch chuyển | Đến đích và xử lý ô; nếu đích nhỏ hơn vị trí cũ và khác 10 thì tính qua Xuất Phát | `movePlayer`, `src/game/engine.ts` |

Các API nhận xúc xắc ép sẵn phục vụ kiểm thử/kỹ năng; chưa kiểm tra đầy đủ giá trị và pha.
Lượt thưởng bot ở bridge đang khác engine; xem danh sách sai lệch phía dưới.

## Mua, xây, thuê và phá sản

Nguồn chính: [engine](../src/game/engine.ts), [tài chính dùng chung](../src/game/rulesV2Financials.ts).

- Ô mua được chưa có chủ: giao diện chờ quyết định; đủ tiền thì trừ giá, gán chủ và thêm vào danh sách tài sản.
- Đất của mình chưa có Landmark: có thể chọn nâng cấp. Mỗi lần gọi thành công tăng một cấp:
  nhà 1 → 2 → 3 → 4 → Landmark. Engine chưa yêu cầu độc quyền màu hoặc đã qua Xuất Phát hai lần để xây.
- Đất đối thủ: trả thuê; thiếu tiền mặt thì phá sản ngay. Chưa có bán nhà, mua lại đất đối thủ,
  giao dịch hay hành động thế chấp trong engine v2, dù kiểu dữ liệu có `isMortgaged`.
- Phá sản vì thuê: chuyển tiền còn lại và tài sản cho chủ nợ. Nợ ngân hàng: trả đất về ngân hàng,
  xóa nhà/Landmark/thế chấp. Chỉ còn một người chưa phá sản thì người đó thắng.

Với `P` là giá mua đất:

| Trạng thái đất | Thuê |
| --- | --- |
| Đất trống | 10% P; gấp đôi nếu sở hữu trọn nhóm màu |
| Nhà 1 / 2 / 3 / 4 | 50% / 130% / 250% / 350% P |
| Landmark | 500% P |
| Đang thế chấp | Hàm tính thuê trả 0; chưa có luồng thế chấp hoàn chỉnh |

| Nhóm | Mỗi cấp nhà | Bước lên Landmark |
| --- | --- | --- |
| Nâu, xanh nhạt | 50.000đ | 100.000đ |
| Hồng, cam | 100.000đ | 200.000đ |
| Đỏ, vàng | 150.000đ | 300.000đ |
| Xanh lá, xanh đậm | 200.000đ | 400.000đ |

- Giao thông: thuê 25K/50K/100K/200K khi sở hữu 1/2/3/4 ga; không xây nhà.
- Tiện ích: tổng xúc xắc ×10K với một ô, ×25K với hai ô; không xây nhà.
- Ví dụ từ hàm tài chính: Cà Mau giá 60K → thuê trống 6K, Landmark 300K;
  Hà Nội giá 400K → thuê trống 40K, Landmark 2.000K.
- `boardData` còn có bảng `rentMultiplier` không hoàn toàn trùng công thức trên;
  không lấy bảng đó thay cho kết quả `calculateTileRent` của v2.

## Ô đặc biệt, thẻ và kỹ năng

- Thuế ô 4: 200K; ô 38: 100K. V2 chưa có quỹ thuế; Quán Trà Đá là ô nghỉ.
- Nhà tù: tối đa ba lượt; ra bằng đôi, trả 100K hoặc thẻ miễn tù. Hết hạn không đủ bảo lãnh thì phá sản.
- Có 12 thẻ Cơ Hội, 12 thẻ Khí Vận; chọn ngẫu nhiên từ bộ, có thể lặp, chưa có chồng rút bỏ.
  Hiệu ứng: nhận tiền, mất tiền, dịch chuyển, miễn tù, trả tiền cho từng người còn chơi.
- Kỹ năng UI khởi tạo 2 ngắn, 2 dài, 1 đôi: ngắn tổng 2–4, dài 10–12, đôi luôn [6,6].
  Số lượt dùng nằm ở React state; chưa có kho thẻ ngẫu nhiên khi qua Xuất Phát trong engine.

Nguồn: [boardData](../src/game/boardData.ts), [chanceCards](../src/game/chanceCards.ts),
[engine](../src/game/engine.ts), [rollWithSkill](../src/renderer25d/gameV2Bridge.ts),
[skillCharges/handleHumanRoll](../src/app/play-v2/page.tsx).

## Hiện trạng lưu và các chế độ chơi

V2 chưa có lưu/tiếp tục ván đang chơi. Trang lưu chất lượng, nhãn và tàu qua localStorage;
âm thanh có cài đặt riêng. Hồ sơ/bảng thành tích dùng localStorage ở
[hubHelpers](../src/components/hub/hubHelpers.ts); ghi kết quả đang được nối tại
[play-classic](../src/app/play-classic/page.tsx), chưa thấy tương ứng ở v2.
Không quảng bá v2 đã hỗ trợ online hoặc chơi chung theo cấu hình hub cho đến khi sửa và kiểm chứng đường nối.

## Sai lệch cần quyết định hoặc sửa riêng

Không sửa các mục này trong nhiệm vụ tài liệu. Việc ghi nhận không yêu cầu giữ lỗi mãi mãi.

| Mã | Sai lệch hiện tại | Nguồn và hướng xác minh |
| --- | --- | --- |
| K01 | Hub/phòng khởi tạo legacy nhưng chuyển `/play` sang engine v2 độc lập | `GameModeSelectModal`, `app/room/[roomId]`, `app/play`, `app/play-v2` |
| K02 | Bật/tắt auto có thể tạo lại bridge/ván; cấu hình slot có thể mất | Effect tạo bridge phụ thuộc `isAutoBotMatch` trong `app/play-v2` |
| K03 | Bot bị gọi `endTurn` dù engine vừa cấp lượt đôi | Hai nhánh `executeSequentialBotTurn` trong `gameV2Bridge` |
| K04 | Nhánh bỏ animation đọc `currentCard.title` sau khi engine xóa thẻ | `gameV2Bridge` và `engine.applyCardEffect`; kiểm tra thêm đích dịch chuyển |
| K05 | Thẻ `fate_06` mô tả bắt giam nhưng chỉ TELEPORT đến ô thăm tù | `chanceCards`, `engine.resolveTileLanding` |
| K06 | HUD/hướng dẫn ghi 25 vòng; engine chưa kết thúc theo số vòng | `TopScoreboard`, `app/play-v2`, `engine.processBankruptcy/endTurn` |
| K07 | Reset có thể thêm listener và để kịch bản async cũ tiếp tục | `gameV2Bridge.resetGame/setupInternalListeners` |
| K08 | Bot chọn/nâng ô khác nhau giữa bật và tắt animation | Hai nhánh nâng cấp trong `gameV2Bridge`, `game/botAI` |

[rules-v2.md](rules-v2.md) vẫn là **đề xuất**: 1,5 triệu ban đầu; dừng Xuất Phát 300K;
bảo lãnh 50K; mua kèm nhà từ vòng 2; điều kiện Landmark; mua lại đất; dịch chuyển giữa ga;
quỹ thuế; nhận thẻ khi qua Xuất Phát; năm cách thắng. Các điểm khác code cần người dùng chốt
từng mục trước khi triển khai. Không dùng tài liệu này hoặc tài liệu đề xuất làm quyền tự thay đổi luật.

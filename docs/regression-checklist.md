# Checklist hồi quy

Mục đích: bảo vệ chức năng hiện có, phát hiện sai lệch và kiểm chứng sửa lỗi.
Mỗi lần dùng phải ghi branch/commit, người kiểm tra, môi trường, lệnh/thao tác, kết quả và bằng chứng.
Trạng thái: **Đạt / Lỗi mới / Lỗi có sẵn / Chưa chạy / Không áp dụng (kèm lý do)**.
Checkbox chưa đánh dấu không phải bằng chứng chức năng đã đạt. Không ép giữ lỗi được liệt kê trong
[game-design](game-design.md); chỉ sửa chúng khi nhiệm vụ cho phép rõ.

## Chọn phạm vi

- Chỉ tài liệu: kiểm tra diff, link nội bộ, nguồn và file ngoài phạm vi; không bắt buộc build/browser/FPS.
- Luật/tiền/bot: test engine/tài chính liên quan và vòng bridge; chạy bộ test đầy đủ khi ảnh hưởng lõi.
- Route/phòng: đi từ hub đến game bằng thao tác thật; không chỉ mở trực tiếp `/play-v2`.
- UI/renderer/audio: kiểm tra trình duyệt và các kích thước/thiết bị liên quan.
- Mọi kiểm tra chưa thực hiện phải ghi rõ. Chạy test đúng hệ v2 hoặc legacy, không dùng thay thế nhau.

## Chức năng cần bảo vệ

| ID | Kiểm tra | Kết quả cần kiểm chứng | Nguồn/test liên quan |
| --- | --- | --- | --- |
| R01 | Vào ván v2 mới | 40 ô, vị trí và số người hợp lệ, 2 triệu/người theo mặc định hiện tại | `src/game/types.ts`, `boardData.ts`, `tests/game/gameEngine40.test.ts` |
| R02 | Xúc xắc thường/kỹ năng | Mặt 1–6; tổng ngắn 2–4, dài 10–12, đôi [6,6]; không trừ lượt dùng hai lần | `engine.rollDice`, `gameV2Bridge.rollWithSkill`, `play-v2.handleHumanRoll` |
| R03 | Đi qua Xuất Phát | Quay vòng đúng, thưởng 200K đúng một lần theo hành vi hiện tại | `engine.movePlayer`, `gameEngine40.test.ts` |
| R04 | Đổ đôi/ba đôi | Lượt thưởng giữ người chơi; ba đôi vào tù; đối chiếu người và bot, bật/tắt animation | `engine.completeAction`, `gameV2Bridge`; K03 chưa được sửa |
| R05 | Mua/bỏ qua | Tiền, ownerId, danh sách tài sản đồng nhất; không mua khi thiếu tiền; một xác nhận chỉ một giao dịch | `engine.buyProperty`, `PropertyDecisionCard`, `gameEngine40.test.ts` |
| R06 | Thuê và xây | Kiểm tra mọi cấp nhà, Landmark, độc quyền đất trống, phí xây theo nhóm | `rulesV2Financials.ts`, `tests/game/rulesV2Financials.test.ts` |
| R07 | Giao thông/tiện ích | Thuê theo số sở hữu/điểm xúc xắc, không xây nhà | `rulesV2Financials.ts`, `gameEngine40.test.ts` |
| R08 | Thuế và phá sản | Thuế 200K/100K; đủ tiền trừ đúng; thiếu tiền chuyển tài sản đúng chủ nợ/ngân hàng | `engine.payTax/payRent/processBankruptcy` |
| R09 | Nhà tù | Vào ô 30, tối đa ba lượt, đôi/bảo lãnh 100K/thẻ; hoạt ảnh không tạo bước đi trái engine | `engine.rollDice/sendToJail`, `gameV2Bridge` |
| R10 | Từng loại thẻ | Tiền, người nhận, đích dịch chuyển và trạng thái sau thẻ đúng; không đọc thẻ đã xóa | `chanceCards`, `engine.applyCardEffect`; K04/K05 |
| R11 | Lượt người/bot | Không đổ hai lần, không thao tác hộ bot, không chạy hai bot đồng thời; khóa input đúng pha | `gameV2Bridge`, `play-v2`, `BottomRightPanel` |
| R12 | Restart/auto/tốc độ | Không nhân listener; restart không để lượt cũ sửa ván mới; đổi tốc độ/auto không xóa ván ngoài yêu cầu | `play-v2`, `gameV2Bridge`; K02/K07 |
| R13 | Kết thúc | Một người còn chơi được tuyên bố thắng đúng; không phát hành động sau GAME_OVER | `engine.processBankruptcy`, `GameOverV2Modal` |
| R14 | Route và cấu hình | Từ hub/lobby giữ đúng người, nhân vật, mode/phòng; so cả legacy và v2 | `GameModeSelectModal`, `app/room`, `app/play`; K01 |
| R15 | Responsive | Thử 360×800, 390×844, 844×390 và 1440×900; mở mua/xây/cài đặt; nút không bị cắt, không đè input | `TopScoreboard`, `PropertyDecisionCard.module.css`, `SettingsModal` |
| R16 | Input và khả năng tiếp cận | Touch/kéo/zoom hoạt động; kiểm tra Tab, Escape, focus và Space khi nhập chữ | `play-v2`, `cameraController`, HUD; thiếu sót có sẵn ghi riêng |
| R17 | Asset và animation | Không mất sprite/nhân đôi quân; đích khớp engine; fallback khi thiếu ảnh; nhãn tiếng Việt rõ | `characterRenderer`, `boardRenderer`, `fontLoader` |
| R18 | Âm thanh | Kiểm tra trước/sau tương tác mở khóa; mute/volume và tùy chọn khôi phục; không phát trùng | `src/lib/audio`, `Dice3DV2Overlay`, `tests/audio/soundManager.test.ts` |
| R19 | Hồ sơ và localStorage | Không xóa tùy chọn/hồ sơ; dữ liệu lỗi không làm crash; phân biệt thống kê legacy với v2 | `hubHelpers`, `audioSettings`, `play-v2`; v2 chưa lưu ván |
| R20 | Online và editor khi có thay đổi liên quan | Hai trình duyệt; lượt, sync, gói không hợp lệ, mất kết nối; editor không ghi ngoài phạm vi được phép | `peerService`, `protocol`, `app/api`; chỉ dùng dữ liệu thử được phép |

## Lỗi có sẵn và phần chưa được coi là đạt

Theo [game-design](game-design.md): K01–K08 là danh sách cần kiểm chứng/sửa riêng.
Chưa có kết thúc 25 vòng, các cách thắng bổ sung, save/restore v2, giao dịch tài sản và quỹ thuế.
Không ghi “hồi quy thất bại do thay đổi mới” cho tính năng chưa tồn tại; cũng không ghi “đạt” chỉ vì chưa thử.
Quyền guest/payload online và quyền ghi API editor là rủi ro cần đánh giá trước khi công bố chức năng đó.

## Cách chạy và giới hạn bằng chứng

- Root repository: `npm test -- --maxWorkers=4 --minWorkers=1`; sau khi dừng dev: `npm run build`.
- `npm run dev` để kiểm tra trình duyệt; đọc script trước khi chạy vì một số script trong `scripts/`
  có đường dẫn Windows hoặc ghi ảnh ra đĩa. Không chạy API editor trong audit chỉ đọc.
- Test 200 ván ở `tests/game/stressTest200Games.test.ts` chạy engine, tự dừng ở giới hạn vòng;
  không chứng minh bridge/animation hoặc luật kết thúc 25 vòng đúng.
- Test HUD/3D helper không thay thế click UI và kiểm tra pixel/khung nhìn thật.
- Khi đo hiệu năng ghi trình duyệt, thiết bị, render GPU/phần mềm, viewport, mức chất lượng,
  trạng thái đứng yên/di chuyển, thời gian tải và số đo FPS. Không dùng tổng dung lượng `public/art`
  làm số byte tải mỗi ván. Không suy ra mục tiêu 60 FPS đã đạt từ build/test.
- Không thay dependency hoặc cài framework kiểm thử chỉ để hoàn tất một thay đổi tài liệu.

## Mẫu kết quả bàn giao

```text
Nhiệm vụ / branch / commit:
Phạm vi file:
Checklist áp dụng và lý do:
Kiểm tra đã chạy + kết quả + bằng chứng:
Lỗi mới / lỗi có sẵn (Kxx):
Chưa chạy / không áp dụng + lý do:
Rủi ro còn lại / người cần quyết định:
Đề nghị bàn giao cho:
```

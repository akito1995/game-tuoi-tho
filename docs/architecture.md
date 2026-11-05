# Kiến trúc thực tế và nền tảng AI Game Studio

Đối chiếu ngày 2026-11-05, mã nguồn nền `4acf072`. Mô tả hiện trạng khác với định hướng cải tiến.

## Công nghệ và thư mục

Nguồn phiên bản và lệnh: [package.json](../package.json), [package-lock.json](../package-lock.json).
Next.js 14 App Router, React 18, TypeScript, Tailwind; Pixi.js 8 cho bàn 2.5D;
Three.js/React Three Fiber cho xúc xắc; Zustand cho hệ cũ; PeerJS cho WebRTC; Vitest cho test.

| Đường dẫn | Trách nhiệm hiện tại |
| --- | --- |
| `src/app` | Route, trang chơi, hub, phòng và công cụ hiệu chỉnh |
| `src/game` | Engine 40 ô, dữ liệu bàn, công thức tiền, bot, thẻ, event bus |
| `src/renderer25d` | Pixi canvas, nhân vật, công trình, camera, bridge và HUD v2 |
| `src/lib/game-engine` | Engine/store Zustand cũ, luật và dữ liệu riêng |
| `src/lib/multiplayer` | Phòng, chat, giao thức và PeerJS nối với store cũ |
| `src/lib/audio` | SFX, nhạc, voice, cài đặt và adapter `soundManager` |
| `src/components/hub` | Chọn chế độ, hồ sơ và bảng thành tích cục bộ |
| `src/components/games/co-ty-phu` | HUD/3D cũ; một số helper và mesh vẫn được xúc xắc v2 dùng |
| `src/art`, `public/art`, `tools` | Manifest/dữ liệu hiệu chỉnh, asset phục vụ web, dữ liệu công cụ |
| `tests`, `src/sanity.test.ts` | Test tự động; không đồng nghĩa có bao phủ trình duyệt |
| `scripts` | Kiểm tra hình ảnh và công cụ tài nguyên; có script dùng đường dẫn Windows cố định |

## Đường chạy chính

```text
/play và /games/co-ty-phu/play
  -> xuất trang /play-v2
  -> GameV2Bridge -> GameEngine (40 ô)
                    -> rulesV2Financials / boardData / chanceCards / botAI
                    -> GameEventBus
  -> React state + HUD + callbacks camera/nhân vật/xúc xắc/VFX
  -> Board25DCanvas (Pixi) và Dice3DV2Overlay (Three.js)
```

Nguồn: [alias play](../src/app/play/page.tsx), [alias game](../src/app/games/co-ty-phu/play/page.tsx),
[trang v2](../src/app/play-v2/page.tsx), [bridge](../src/renderer25d/gameV2Bridge.ts),
[engine](../src/game/engine.ts), [events](../src/game/events.ts).
Trang v2 tạo bridge bằng effect, subscribe snapshot và gắn callback trình bày.
Engine thay đổi trạng thái đồng bộ; bridge phối hợp các bước bot bất đồng bộ.
Snapshot hiện sao chép nông một số danh sách; không giả định đây là trạng thái bất biến hay định dạng save ổn định.

## Hệ legacy và điểm chưa nối

[play-classic](../src/app/play-classic/page.tsx) dùng `useGameStore`, `useRoomStore`,
`peerService`; store cũ có bàn 32 ô và luật riêng. PeerJS host nhận lệnh và phát trạng thái legacy.
Hub và phòng chuyển đến `/play`, nhưng alias này mở v2 không đọc trạng thái legacy đó.
Vì vậy các module online có mặt trong repository không chứng minh v2 online đã hoạt động.
Không xóa legacy hoặc đổi route để che vấn đề trong nhiệm vụ khác; cần nhiệm vụ tương thích riêng.

## Hình ảnh, âm thanh và dữ liệu

- [Board25DCanvas](../src/renderer25d/Board25DCanvas.tsx) nạp tài nguyên, tạo renderer,
  đăng ký input/resize và ticker; có cleanup khi tháo component.
- [boardRenderer](../src/renderer25d/boardRenderer.ts) vẽ bàn/nhãn, thử ảnh `_clean` rồi fallback.
  [characterRenderer](../src/renderer25d/characterRenderer.ts) điều khiển sprite và bước nhảy;
  [cameraController](../src/renderer25d/cameraController.ts) quản lý khung nhìn.
- Hiện có ticker liên tục; render-on-demand và mục tiêu 60 FPS trong `GEMINI.md` là định hướng,
  không phải bằng chứng hành vi/hiệu năng hiện tại. Asset không phải tất cả đều nạp qua manifest.
- [audioManager](../src/lib/audio/audioManager.ts) điều phối SFX/nhạc/voice/cài đặt;
  [soundManager](../src/lib/audio/soundManager.ts) giữ API tương thích. V2 mới nối một phần sự kiện âm thanh.
- [layout](../src/app/layout.tsx) tham chiếu Google Fonts;
  [fontLoader](../src/renderer25d/fontLoader.ts) có fallback font hệ thống.
- Ván v2 ở bộ nhớ; localStorage chủ yếu giữ tùy chọn/hồ sơ, chưa phải save game.

## API công cụ và ranh giới tin cậy

`src/app/api/{corners,tiles,markers,buildings-layout,mask,sprites}` đọc/ghi file trên máy chủ.
Một số GET có thể tạo dữ liệu mặc định nếu thiếu file; POST có thể sửa asset hoặc dữ liệu tracked.
Ví dụ [corners](../src/app/api/corners/route.ts), [sprites](../src/app/api/sprites/route.ts),
[mask](../src/app/api/mask/route.ts). Không gọi API editor khi đang audit chỉ đọc.
Chưa thấy kiểm soát truy cập production ngay tại các route này; cần nhiệm vụ bảo vệ riêng.
Triển khai trên filesystem chỉ đọc/không lưu bền cũng không bảo đảm các công cụ này hoạt động.

[protocol](../src/lib/multiplayer/protocol.ts) mới kiểm tra vỏ gói;
[peerService](../src/lib/multiplayer/peerService.ts) chưa ràng buộc đầy đủ người gửi với quyền hành động,
có nhận `diceOverride`. Không coi dữ liệu từ guest là đáng tin chỉ vì có kiểu TypeScript.

## Kiến trúc AI Game Studio đề xuất — chưa triển khai runtime

Sáu vai trò được mô tả trong [.ai-studio/roles](../.ai-studio/roles/README.md).
Đây là quy trình tài liệu dùng với Codex hiện có, không có framework điều phối mới hay dịch vụ trả phí.
Một phiên có thể lần lượt đảm nhiệm nhiều vai trò, phải nêu rõ vai trò và đầu ra; không gọi đó là review độc lập.
Người dùng chốt gameplay, merge và phát hành. Không cần LLM quyết định tiền/xúc xắc trong runtime game.

Hướng cải tiến từng bước khi có nhiệm vụ được duyệt:

1. Giữ `src/game` là nơi kiểm tra lệnh và tính luật 40 ô; tăng kiểm tra pha/người chơi ở đây.
2. Dùng `src/game/events.ts` để đưa kết quả cho HUD, renderer và audio; hình ảnh không tự tạo luật.
3. Đặt adapter UI/online/lưu game quanh engine hiện có; chuyển từng luồng, không thay toàn bộ hệ cũ cùng lúc.
4. Bảo vệ hợp đồng bằng test engine, test bridge bật/tắt animation và smoke trình duyệt.
5. Tách trang lớn theo nhiệm vụ nhỏ khi thực sự cần; không refactor ngoài phạm vi để chuẩn bị cho giả định tương lai.

## Lệnh kiểm chứng có sẵn

Từ root repository: `npm test -- --maxWorkers=4 --minWorkers=1`, `npm run build`, `npm run dev`.
Không chạy build và dev đồng thời vì dùng chung `.next`; không cài lại dependency khi server đang chạy.
Test Vitest dùng môi trường Node trong [vitest.config.ts](../vitest.config.ts), chưa cấu hình coverage.
Mốc onboarding trước đó có 249 test/17 file đạt và build đạt; không coi đó là kết quả của các thay đổi tương lai.
Nhiệm vụ chỉ tài liệu không cần cài thư viện hay chạy lại ứng dụng.

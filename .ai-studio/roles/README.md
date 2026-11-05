# Sáu vai trò AI Game Studio

Đọc [AGENTS.md](../../AGENTS.md) trước khi dùng bất kỳ vai trò nào.
Đây là hướng dẫn cho Codex và người vận hành, không phải framework hay dịch vụ chạy nhiều agent.
Không tự tạo agent song song. Một người/phiên có thể đảm nhiệm lần lượt các vai trò;
phải ghi rõ review tự kiểm tra hay review độc lập.

| Vai trò | Hướng dẫn | Bàn giao chính |
| --- | --- | --- |
| Game Director | [game-director.md](game-director.md) | Mục tiêu, phạm vi, thứ tự ưu tiên và quyết định cần người dùng duyệt |
| Game Designer | [game-designer.md](game-designer.md) | Đặc tả luật/luồng và ví dụ nghiệm thu |
| Developer | [developer.md](developer.md) | Diff tối thiểu và bằng chứng kỹ thuật |
| UI/UX Designer | [ui-ux-designer.md](ui-ux-designer.md) | Luồng, bố cục, tương tác và tiêu chí hình ảnh |
| QA Engineer | [qa-engineer.md](qa-engineer.md) | Kết quả độc lập với tuyên bố của người triển khai, khi có người review riêng |
| Release Manager | [release-manager.md](release-manager.md) | PR và báo cáo sẵn sàng; không tự merge/deploy |

## Quy trình bàn giao

Người dùng → Director → Designer/UI (nếu cần) → Developer → QA → Release Manager → người dùng.
Nhiệm vụ tài liệu nhỏ có thể bỏ bước không liên quan, ghi lý do; không tạo đủ nghi thức cho mọi thay đổi.
Luật/kinh tế mới phải có quyết định rõ của người dùng trước triển khai. QA trả nhiệm vụ về Developer
khi có lỗi mới; Director xử lý phạm vi hoặc yêu cầu mâu thuẫn. Release Manager không được tự bỏ qua lỗi.

Mỗi bàn giao chứa: mục tiêu; file/module; đầu vào và nguồn; giả định; quyết định đã duyệt;
đầu ra; điều kiện nghiệm thu; kết quả kiểm chứng; giới hạn/blocker; vai trò nhận tiếp.
Nếu bị chặn, hoàn tất phần độc lập rồi nêu đúng quyết định/quyền còn thiếu. Không suy diễn im lặng là đồng ý.

## Nguồn chung

- [Luật hiện tại và sai lệch](../../docs/game-design.md).
- [Kiến trúc thực tế](../../docs/architecture.md).
- [Checklist hồi quy](../../docs/regression-checklist.md).
- [Luật đề xuất chưa mặc định được duyệt](../../docs/rules-v2.md).

Trong nhiệm vụ tạo nền tảng này chỉ thêm tài liệu; chưa sửa bất kỳ lỗi game, API hay multiplayer nào.

# Quy tắc Codex — AI Game Studio

## Phạm vi và nguồn tham chiếu

Áp dụng cho toàn repository. Trả lời bằng tiếng Việt, giải thích ngắn gọn cho người không chuyên.
Đọc [thiết kế đã đối chiếu](docs/game-design.md), [kiến trúc thực tế](docs/architecture.md),
[checklist hồi quy](docs/regression-checklist.md) và hướng dẫn vai trò liên quan trong [.ai-studio/roles](.ai-studio/roles/README.md).
Đọc cả [GEMINI.md](GEMINI.md) khi công việc liên quan quy ước hình ảnh và gameplay.
Chỉ dẫn trực tiếp của người dùng có ưu tiên cao hơn tài liệu repository.

## Những giới hạn bắt buộc

- Giữ codebase, gameplay, phong cách Việt Nam và asset hiện có. Sửa nhỏ theo phạm vi nhiệm vụ;
  không viết lại toàn game, thay engine, đổi framework hoặc dọn hệ cũ ngoài yêu cầu.
- Không tự đổi luật, giá đất, tiền thuê, xác suất, kỹ năng, điều kiện thắng hoặc cân bằng bot.
  Code đang chạy là bằng chứng hiện trạng, không phải sự phê duyệt mọi hành vi.
  `docs/rules-v2.md` là luật đề xuất; không tự thực thi các khác biệt.
- Phát hiện lỗi hoặc mâu thuẫn: mô tả nguồn, tác động, đề xuất và tiêu chí kiểm chứng.
  Chỉ sửa khi nằm trong yêu cầu đã được người dùng cho phép; không mở rộng phạm vi ngầm.
- Không sửa/xóa/đổi tên asset, dữ liệu hiệu chỉnh, dependency hoặc lockfile trừ khi nhiệm vụ cho phép rõ.
- Không thêm framework multi-agent, dịch vụ trả phí hoặc gửi dữ liệu/mã nguồn sang dịch vụ ngoài.
  Sáu vai trò là hướng dẫn công việc; không tự khởi chạy nhiều agent. Chỉ giao việc song song khi người dùng yêu cầu rõ.
- Không tự merge, bật auto-merge, push trực tiếp `main`, deploy production hoặc phát hành.
  Người dùng là người quyết định merge và phát hành; nhiệm vụ tạo PR chỉ cho phép tạo PR.
- Không in token/secret, ghi chúng vào file hoặc yêu cầu gửi secret trong chat.
  Dùng xác thực sẵn có; quyền đọc Git không chứng minh quyền GitHub API hoặc push.

## Cách thực hiện một nhiệm vụ

1. Kiểm tra branch, `git status --short`, chỉ dẫn và các file liên quan. Giữ nguyên thay đổi của người dùng.
   Dùng checkout đang có trong môi trường cô lập; không tạo worktree trừ khi được yêu cầu.
2. Nêu mục tiêu, file dự kiến sửa, giới hạn gameplay và điều kiện nghiệm thu trước khi chỉnh sửa.
   Thực hiện trong phạm vi đã được duyệt; chỉ xin quyết định mới nếu còn thiếu yêu cầu hoặc vượt phạm vi.
3. Làm trên branch riêng; không chuyển/reset branch khi còn thay đổi chưa hiểu rõ.
4. Xác định đường chạy v2 hay legacy trước khi sửa. Không coi test của hệ này là bằng chứng cho hệ kia.
5. Giữ phép tính tiền/quyết định lượt ở engine. HUD, animation và âm thanh trình bày cùng một kết quả;
   không thêm phép tính luật riêng vào chúng. Đây là định hướng cho thay đổi mới, không phải lệnh refactor toàn bộ.
6. Kiểm tra phù hợp với thay đổi; xem checklist hồi quy. Tài liệu thuần túy: kiểm tra link,
   nội dung, diff và phạm vi file; không cần build hoặc chạy trình duyệt chỉ để có kết quả xanh.
   Thay đổi hành vi: chạy test liên quan và kiểm tra luồng thực tế; thay đổi hình ảnh: có ảnh và số đo
   FPS kèm thiết bị/chế độ render. Không cam kết 60 FPS từ máy headless render bằng phần mềm.
7. Báo rõ đã đạt, thất bại, chưa chạy, lỗi có sẵn và blocker. Không hạ assertion, bỏ test hoặc
   ghi đè kết quả cũ để làm kiểm tra đạt. Không tuyên bố mọi lỗi đã được sửa chỉ vì build thành công.
8. Khi được yêu cầu commit/push/PR: chỉ stage file thuộc nhiệm vụ, kiểm tra diff trước commit;
   PR nêu thay đổi, kiểm chứng, giới hạn và người cần duyệt. Không tự merge.

## Mẫu bàn giao chung

Mỗi vai trò bàn giao: mục tiêu; phạm vi/file; dữ kiện và nguồn; quyết định được duyệt;
đầu ra; tiêu chí nghiệm thu; kiểm chứng thực tế; rủi ro/blocker; vai trò nhận tiếp.
Không truyền một giả định thành luật đã duyệt. Xem [quy trình vai trò](.ai-studio/roles/README.md).

# Cờ Tỷ Phú 3D - Giai Đoạn 5: Giao Diện HUD Thương Mại, Thẻ Cơ Hội / Khí Vận 3D & Tiền Bay Parabol

> **Goal:** Nâng cấp toàn diện giao diện HUD theo phong cách Arcade Glassmorphism thương mại, thiết kế lại modal hiển thị Thẻ Cơ Hội & Khí Vận ở chính giữa màn hình với nẹp viền vàng kim, nội dung tiếng Việt chuẩn chỉnh và hiệu ứng hạt nổ tiền vàng; đồng thời bổ sung hiệu ứng tiền bay parabol khi trả tiền thuê/nhận lương và tối ưu hóa 60 FPS.

---

### Task 1: Đại Tu Thẻ Cơ Hội & Khí Vận Trung Tâm Màn Hình (`ChanceCardModal.tsx`)
**Files:**
- Modify: `src/components/games/co-ty-phu/hud/ChanceCardModal.tsx`
- Modify: `tests/hud/hudComponents.test.ts`

**Chi tiết:**
1. Trình diễn thẻ bài sang trọng ở giữa màn hình:
   - Khung thẻ bài viền nẹp vàng 24k dát lá vàng dập nổi (`border-2 border-amber-400 shadow-[0_0_50px_rgba(245,158,11,0.4)]`).
   - Phân biệt rõ rệt hai trường phái bài:
     - **THẺ CƠ HỘI**: Tone màu vàng cam hoàng kim, huy hiệu "CƠ HỘI MAY MẮN", biểu tượng rương báu / ngôi sao phát sáng, mưa tiền vàng rơi lấp lánh.
     - **THẺ KHÍ VẬN**: Tone màu tím thạch anh huyền bí, huy hiệu "KHÍ VẬN ĐỊNH MỆNH", biểu tượng bánh xe định mệnh / vòng hào quang tím huyền ảo.
2. Trình bày nội dung tiếng Việt rõ ràng, cỡ chữ lớn, dễ đọc trên mobile và desktop:
   - Tiêu đề thẻ dập nổi.
   - Nội dung hiệu lực (ví dụ: "Nhận tiền mừng sinh nhật +200.000đ", "Nộp phạt vi phạm tốc độ -100.000đ", "Kim bài miễn phạt tù").
   - Nút xác nhận to bản, viền vàng kim, âm thanh vang nhẹ khi bấm.

- [x] Step 1.1: Bổ sung unit tests cho `ChanceCardModal` và các phân loại thẻ trong `tests/hud/hudComponents.test.ts`.
- [x] Step 1.2: Thiết kế lại `ChanceCardModal.tsx` với hiệu ứng bài 3D cao cấp và mưa vàng.
- [x] Step 1.3: Chạy vitest xác nhận test pass.

---

### Task 2: Hiệu Ứng Tiền Bay Parabol & Xu Vàng (`FlyingMoneyVFX.tsx`)
**Files:**
- Create: `src/components/games/co-ty-phu/hud/FlyingMoneyVFX.tsx`
- Modify: `src/components/games/co-ty-phu/hud/CoTyPhuHUD.tsx`
- Modify: `src/components/games/co-ty-phu/hud/index.ts`
- Modify: `tests/hud/hudComponents.test.ts`

**Chi tiết:**
1. Tạo component `FlyingMoneyVFX.tsx`:
   - Lắng nghe biến động tiền bạc của người chơi (trả tiền thuê, qua ô Xuất Phát nhận 200k, rút thẻ tiền thưởng).
   - Bắn ra luồng 6-10 đồng tiền vàng 3D và tờ tiền Polymer bay theo đường cong parabol từ điểm gửi đến điểm nhận.
   - Hiệu ứng bung nổ xu vàng kèm âm thanh leng keng vui tai.

- [x] Step 2.1: Hiện thực hóa `FlyingMoneyVFX.tsx`.
- [x] Step 2.2: Tích hợp vào `CoTyPhuHUD.tsx` và export trong `hud/index.ts`.
- [x] Step 2.3: Viết unit tests kiểm tra rendering và kích hoạt hiệu ứng.

---

### Task 3: Đánh Bóng Arcade Glassmorphic HUD & Đồng Hồ Lượt 60s
**Files:**
- Modify: `src/components/games/co-ty-phu/hud/GameHeader.tsx`
- Modify: `src/components/games/co-ty-phu/hud/PlayerListBar.tsx`
- Modify: `src/components/games/co-ty-phu/hud/TurnTimerBar.tsx`

**Chi tiết:**
1. **GameHeader & PlayerListBar**:
   - Chất liệu kính mờ cao cấp (`backdrop-blur-xl bg-slate-950/80 border border-white/10`).
   - Avatar người chơi với vòng hào quang neon phát sáng rực rỡ theo lượt đi.
   - Hiển thị tiền mặt và tổng tài sản kèm hiệu ứng số nhảy mượt mà.
2. **TurnTimerBar (Đồng hồ đếm ngược lượt 60s)**:
   - Hiển thị thanh đếm thời gian với màu chuyển biến: Xanh lục (>30s) -> Vàng hổ phách (15-30s) -> Đỏ nhấp nháy khẩn cấp (<15s).

- [x] Step 3.1: Hoàn thiện `TurnTimerBar.tsx`, `PlayerListBar.tsx`, `GameHeader.tsx`.
- [x] Step 3.2: Chạy toàn bộ vitest suite và `npm run build`.
- [x] Step 3.3: Commit: `feat(art-stage-5): upgrade commercial arcade glassmorphic hud, 3d fortune cards and parabolic flying money vfx`.

---

### Task 4: Kiểm Thử Toàn Diện, Nghiệm Thu & Đóng Giai Đoạn 5
**Files:**
- Test: Full Vitest suite & Next.js production build

- [x] Step 4.1: Chạy toàn bộ vitest (>210 tests 100% pass).
- [x] Step 4.2: Chạy Next.js production build kiểm tra TypeScript và bundling.
- [x] Step 4.3: Review bởi Task Reviewer subagent và phê duyệt hoàn thành toàn bộ 5 giai đoạn.

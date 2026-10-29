# Cờ Tỷ Phú 3D - Giai Đoạn 2: Chuẩn Hóa 32 Ô Đất & Nâng Cấp Đảo Ngọc Bàn Cờ

> **Goal:** Nhân rộng chất liệu men sứ bóng cao cấp ra toàn bộ 32 ô đất trên bàn cờ, nâng cấp chi tiết 4 ô góc đặc biệt (Xuất Phát, Thăm Tù, Lễ Hội, Vào Tù) và đại tu Đảo Ngọc trung tâm với Đại Ngọc Trai xà cừ, hồ nước lagoon xanh ngọc và khung bàn cờ gỗ nẹp vàng.

---

### Task 1: Chuẩn Hóa Toàn Diện 32 Ô Đất & 8 Dải Màu Vùng Miền
**Files:**
- Modify: `src/components/games/co-ty-phu/board-3d/BoardTiles3D.tsx`
- Modify: `tests/board-3d/tilePositions.test.ts`

**Chi tiết:**
1. Áp dụng chất liệu gạch men sứ bóng (`meshPhysicalMaterial clearcoat={1.0} roughness={0.12}`) cho TẤT CẢ các ô đất (không chỉ riêng Metropolis).
2. Tinh chỉnh nẹp dải màu acrylic bóng cho 8 vùng miền:
   - `ME_KONG` (Xanh ngọc bích `#10b981`)
   - `COASTAL` (Xanh biển ngọc `#0284c7`)
   - `HIGHLANDS` (Vàng hổ phách `#d97706`)
   - `HERITAGE` (Tím di sản `#8b5cf6`)
   - `WONDERS` (Hồng san hô kỳ quan `#f43f5e`)
   - `METROPOLIS` (Xanh hoàng gia `#2563eb`)
   - `TRANSPORT` (Xám than chì `#475569`)
   - `UTILITY` (Xanh lam tiện ích `#0891b2`)
3. Hiển thị huân chương giá tiền vàng 3D (`TilePriceBadge`) trên tất cả các ô tài sản có thể mua bán (Property, Transport, Utility).
4. Thiết kế các ô sự kiện đặc biệt:
   - Ô Cơ Hội (CHANCE - Ô 7, 18, 29): Nẹp màu vàng cam `#f59e0b`, biểu tượng rương kho báu vàng 3D và hoa văn lá bài may mắn.
   - Ô Khí Vận (FATE - Ô 2, 14, 26): Nẹp màu tím huyền bí `#8b5cf6`, biểu tượng bánh xe định mệnh/ngôi sao bí ẩn.
   - Ô Tiện ích & Thuế (Ô 4, 10, 20): Nẹp xanh lam tiện ích với biểu tượng nhà máy điện/trạm cấp nước.

- [x] Step 1.1: Bổ sung unit tests kiểm tra thông số 8 vùng miền và các loại ô đặc biệt trong `tests/board-3d/tilePositions.test.ts`.
- [x] Step 1.2: Cập nhật `BoardTiles3D.tsx` để render men sứ bóng, nẹp màu, huy hiệu giá và biểu tượng dập nổi trên tất cả 32 ô.
- [x] Step 1.3: Chạy vitest và `npm run build` xác nhận không có lỗi.
- [x] Step 1.4: Commit: `feat(art-stage-2): upgrade all 32 porcelain tiles and regional color bands`.

---

### Task 2: Đại Tu Mỹ Thuật 4 Ô Góc Đặc Biệt (Corners)
**Files:**
- Modify: `src/components/games/co-ty-phu/board-3d/BoardTiles3D.tsx`
- Modify: `tests/board-3d/tilePositions.test.ts`

**Chi tiết:**
1. **Ô 0 (Xuất Phát / START)**:
   - Cổng chào Khải Hoàn Môn đỏ son nẹp vàng kim sang trọng.
   - Thảm đỏ nhung dẫn lối có mũi tên vàng hướng đi phát sáng.
   - Chữ "XUẤT PHÁT" và bảng nhận lương "+200.000đ" rõ nét.
2. **Ô 8 (Vào Tù / Thăm Tù - JAIL)**:
   - Góc trong phòng giam có song sắt mạ chrome, ổ khoá đồng thau và đèn lồng đỏ.
   - Góc ngoài khu vực "THĂM TÙ" an toàn với vạch sơn vàng đen cách điệu.
3. **Ô 16 (Lễ Hội / Bến Du Thuyền - FESTIVAL)**:
   - Khán đài lễ hội rực rỡ với cờ đuôi nheo đa sắc.
   - 2 cột pháo hoa giấy mạ vàng sẵn sàng chúc mừng.
   - Vòng hào quang tổ chức sự kiện nhân đôi tiền thuê.
4. **Ô 24 (Vào Tù Ngay / Cảnh Sát - GO_TO_JAIL)**:
   - Chốt kiểm soát cảnh sát với đèn còi xoay nhấp nháy xanh - đỏ.
   - Thanh rào chắn barie sọc đỏ trắng cảnh báo.
   - Mũi tên đỏ chỉ hướng giam giữ về ô số 8.

- [x] Step 2.1: Viết unit tests kiểm tra 4 ô góc đặc biệt.
- [x] Step 2.2: Hiện thực hoá các khối 3D chi tiết cho 4 ô góc trong `BoardTiles3D.tsx`.
- [x] Step 2.3: Chạy vitest và `npm run build`.
- [x] Step 2.4: Commit: `feat(art-stage-2): craft 4 bespoke 3d corner tiles start jail festival police`.

---

### Task 3: Nâng Cấp Đảo Ngọc Trung Tâm & Khung Bàn Cờ Hoàng Gia
**Files:**
- Modify: `src/components/games/co-ty-phu/board-3d/MiniWorldDiorama3D.tsx`
- Modify: `src/components/games/co-ty-phu/board-3d/BoardTableFrame.tsx`

**Chi tiết:**
1. **Viên Đại Ngọc Trai (Giant Floating Pearl)**:
   - Ánh xà cừ ngọc trai biển sâu huyền ảo (`color="#f8fafc"`, hiệu ứng phản quang xanh ngọc xà cừ).
   - Đài sen đá mạ vàng nâng ngọc với vòng hào quang phát sáng nhẹ nhàng nhịp thở (breathing glow).
2. **Hồ Nước Trung Tâm (Emerald Lagoon)**:
   - Mặt nước màu xanh ngọc lục bảo trong vắt, gợn sóng lăn tăn phản chiếu ánh nắng.
   - Rặng núi đá vôi karst rêu phong Hạ Long và Chùa Một Cột mini giữa hồ nước.
3. **Khung Bàn Cờ Hoàng Gia (`BoardTableFrame.tsx`)**:
   - Bệ gỗ mun chạm khắc viền nẹp vàng 24k bo tròn 4 góc.
   - Đáy biển đại dương xanh thẳm bao quanh đảo ngọc với hiệu ứng sóng biển nhấp nhô nhẹ.

- [x] Step 3.1: Nâng cấp mô hình diorama trong `MiniWorldDiorama3D.tsx`.
- [x] Step 3.2: Tinh chỉnh khung bàn cờ và hiệu ứng đại dương trong `BoardTableFrame.tsx`.
- [x] Step 3.3: Chạy toàn bộ vitest suite và `npm run build`.
- [x] Step 3.4: Commit: `feat(art-stage-2): polish central pearl island diorama and royal wooden frame`.

---

### Task 4: Kiểm Thử Toàn Diện & Nghiệm Thu Giai Đoạn 2
**Files:**
- Test: Full Vitest suite & Next.js production build

- [x] Step 4.1: Chạy toàn bộ vitest (đảm bảo 100% test pass).
- [x] Step 4.2: Chạy Next.js production build kiểm tra TypeScript và bundling.
- [x] Step 4.3: Review bởi Task Reviewer subagent và phê duyệt.

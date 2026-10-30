# Cờ Tỷ Phú 3D - Giai Đoạn 3: Bộ 4 Linh Vật Chibi & Xúc Xắc Vật Lý Cao Cấp

> **Goal:** Nâng cấp toàn diện 4 linh vật đại diện người chơi (Heo Phượt, Cáo Lém Lỉnh, Mèo Quý Tộc, Trâu Đại Gia) thành các figure Chibi Vinyl 3D cao cấp với mắt anime 2 đốm sáng phản quang, phụ kiện đặc trưng và đế trụ màu người chơi; đồng thời nâng cấp bộ đôi xúc xắc ngà voi đỏ son truyền thống với hiệu ứng hạt bụi vàng và sóng xung kích tiếp đất.

---

### Task 1: Đại Tu 4 Quân Cờ Linh Vật Chibi Chuyên Nghiệp (`MascotPawns3D.tsx`)
**Files:**
- Modify: `src/components/games/co-ty-phu/board-3d/MascotPawns3D.tsx`
- Modify: `tests/board-3d/mascotsAndBuildings.test.ts`

**Chi tiết:**
1. **Heo Phượt (Pig Mesh)**:
   - Thân heo hồng chibi vinyl bóng nhẹ (`#f472b6`).
   - Mũ phượt vành cứng xanh dương, kính bảo hộ phi công nẹp đồng thau, ba lô du lịch có cuộn túi ngủ dã ngoại trên lưng, đuôi xoăn tít.
   - Mắt anime 2 đốm phản quang long lanh (primary & secondary specular gleams).
2. **Cáo Lém Lỉnh (Fox Mesh)**:
   - Thân cáo cam ấm vinyl cao cấp (`#ea580c` / `#f97316`), yếm ngực trắng sữa, mõm thon gọn với đầu mũi đen bóng.
   - Mắt anime 2 đốm sáng, kính râm đen ngầu nẹp cầu vàng 24k (`#fbbf24`), mũ lưỡi trai năng động.
   - Đuôi cáo xù nhiều tầng uốn cong vuốt nhọn với chóp đuôi trắng tinh khôi.
3. **Mèo Quý Tộc / Mèo Chiêu Tài (Cat Mesh)**:
   - Lớp men sứ trắng kem mềm mại phong cách Maneki-Neko (`#fdfbf7`), tai hồng có lông tơ, má hồng phúng phính.
   - Mắt ngọc lục bảo long lanh 2 đốm sáng, ria mép thanh thoát, vòng cổ lụa đỏ son gắn chuông vàng / đồng xu may mắn dập nổi (`#fbbf24`).
   - Tư thế giơ một bàn chân vẫy tài lộc đặc trưng của mèo chiêu tài Nhật Bản / Á Đông.
4. **Trâu Đại Gia (Buffalo Mesh)**:
   - Thân trâu mập mạp màu vàng đồng hổ phách (`#b45309` / `#d97706`, metalness 0.22), cặp sừng cong đặc trưng có chóp bọc vàng kim (`#fbbf24`).
   - Mõm trâu thân thiện có khuyên mũi vàng óng, mắt anime hiền từ với catchlight trắng.
   - Nơ đỏ quý ông / vòng cổ chuông vàng đại gia sang trọng, 4 móng đen chắc chắn.
5. **Đế Trụ Người Chơi & Squash-and-Stretch**:
   - Đế trụ tròn men sứ bóng có viền kim loại vàng và dải hào quang neon theo màu người chơi (P1: Xanh dương, P2: Đỏ, P3: Xanh ngọc, P4: Vàng cam).
   - Vòng bụi đất tiếp đất (`LandingDustRing`) bung ra khi đáp xuống ô đất.

- [x] Step 1.1: Bổ sung unit tests cho 4 linh vật chibi trong `tests/board-3d/mascotsAndBuildings.test.ts`.
- [x] Step 1.2: Cập nhật `MascotPawns3D.tsx` hoàn thiện tạo hình sắc sảo, mắt anime 2 đốm sáng cho cả 4 linh vật.
- [x] Step 1.3: Chạy vitest và `npm run build` xác nhận không có lỗi.
- [x] Step 1.4: Commit: `feat(art-stage-3): overhaul 4 chibi mascot pawns with anime specular eyes and bespoke accessories`.

---

### Task 2: Nâng Cấp Xúc Xắc Ngà Voi Đỏ Son & Hạt Bụi Vàng Tiếp Đất (`Dice3D.tsx`)
**Files:**
- Modify: `src/components/games/co-ty-phu/board-3d/Dice3D.tsx`
- Modify: `tests/board-3d/boardDioramaAndFrame.test.ts` (hoặc test xúc xắc)

**Chi tiết:**
1. **Chất Liệu Xúc Xắc Ngà Voi Cao Cấp**:
   - Viên xúc xắc bo góc mềm mại chất liệu nhựa ngà voi (`#fffbeb`, clearcoat 0.6, roughness 0.16).
   - Lõm chấm tròn 3D dập chìm tinh tế:
     - Chấm số 1 và số 4 màu đỏ son vermilion rực rỡ (`#dc2626`) theo chuẩn cờ truyền thống Á Đông / Việt Nam.
     - Chấm số 2, 3, 5, 6 màu xanh thẫm slate nhã nhặn (`#0f172a`).
     - Viền nẹp nhũ vàng kim siêu mảnh quanh các hốc chấm.
2. **Hiệu Ứng Bụi Vàng & Sóng Chấn Động**:
   - Vệt bụi vàng phát sáng (`Sparkles`) bay theo cung nhảy parabol của xúc xắc khi đang lắc.
   - Hiệu ứng vòng sóng xung kích bụi mờ khi xúc xắc va chạm xuống mặt khay nỉ.
3. **Khay Nỉ Lắc Xúc Xắc Gỗ Gõ Đỏ**:
   - Viền gỗ gõ đỏ đánh véc-ni bóng bẩy với ngôi sao vàng 5 cánh dập nổi giữa nền nỉ nhung xanh ngọc lục bảo.

- [x] Step 2.1: Bổ sung unit test kiểm tra thuộc tính xúc xắc và khay lắc.
- [x] Step 2.2: Nâng cấp `Dice3D.tsx` với chất liệu ngà voi, viền pips vàng, hạt bụi vàng và sóng chấn động.
- [x] Step 2.3: Chạy vitest và `npm run build`.
- [x] Step 2.4: Commit: `feat(art-stage-3): upgrade ivory vermilion physics dice with gold dust particles and landing shockwave`.

---

### Task 3: Kiểm Thử Toàn Diện & Nghiệm Thu Giai Đoạn 3
**Files:**
- Test: Full Vitest suite & Next.js production build

- [x] Step 3.1: Chạy toàn bộ vitest (đảm bảo 100% test pass).
- [x] Step 3.2: Chạy Next.js production build kiểm tra TypeScript và bundling.
- [x] Step 3.3: Review bởi Task Reviewer subagent và phê duyệt.

# Cờ Tỷ Phú 3D - Giai Đoạn 4: Hoàn Thiện 16+ Landmark Biểu Tượng Việt Nam & Hệ Thống 4 Cấp Nhà

> **Goal:** Hoàn thiện và chuẩn hóa toàn bộ 16+ công trình biểu tượng danh lam thắng cảnh Việt Nam trong `CityLandmarks3D.tsx`, bảo đảm ăn khớp với hệ thống 4 cấp nhà và cờ xác lập chủ quyền trong `Buildings3D.tsx`. Khi người chơi nâng cấp đất lên cấp tối đa (Tier 4 / Resort / Landmark), biểu tượng đặc trưng của thành phố đó sẽ xuất hiện hoành tráng với hiệu ứng nảy lò xo và bụi vàng lấp lánh.

---

### Task 1: Mở Rộng Unit Tests Kiểm Thử Toàn Diện 16+ Landmarks & 4 Cấp Nhà
**Files:**
- Modify: `tests/board-3d/mascotsAndBuildings.test.ts`

**Chi tiết:**
1. Import toàn bộ 20 component biểu tượng từ `CityLandmarks3D.tsx`:
   - `CaMauMonument`, `CanThoFloatingMarket`, `PowerPlant`, `BusStation`, `VungTauLighthouse`, `NhaTrangTramHuongTower`, `PhuQuocIsland`, `BuonMaThuotNhaRong`, `AirportLandmark`, `DaLatStation`, `HueNgoMonGate`, `HoiAnChuaCau`, `DaNangDragonBridge`, `WaterPlant`, `NinhBinhTrangAn`, `SaPaStoneChurch`, `HaLongTrongMai`, `HaiPhongPort`, `HaNoiTurtleTower`, `HCMCBenThanhLandmark`, `CityLandmark3D`.
2. Kiểm tra `CityLandmark3D` trả về component hợp lệ trên tất cả 22 ô bất động sản, tiện ích và bến xe/sân bay:
   - Các ô: `[1, 3, 4, 5, 6, 9, 10, 11, 12, 13, 15, 17, 19, 20, 21, 22, 23, 25, 27, 28, 30, 31]`.
   - Các ô đặc biệt hoặc unmapped trả về `null`.
3. Kiểm tra logic 5 tier nhà trong `Buildings3D.tsx`:
   - Tier 0: Claim Flag
   - Tier 1: Nhà ngói 3 gian
   - Tier 2: Lầu 2 tầng phố cổ
   - Tier 3: Biệt thự nghỉ dưỡng
   - Tier 4: Landmark biểu tượng tỉnh thành (hoặc Grand Golden Resort nếu unmapped).

- [x] Step 1.1: Bổ sung test suites trong `tests/board-3d/mascotsAndBuildings.test.ts`.
- [x] Step 1.2: Chạy vitest xác nhận test chạy trơn tru.

---

### Task 2: Tinh Chỉnh Mỹ Thuật & Độ Sắc Nét Cho Toàn Bộ 16+ Landmark
**Files:**
- Modify: `src/components/games/co-ty-phu/board-3d/CityLandmarks3D.tsx`
- Modify: `src/components/games/co-ty-phu/board-3d/Buildings3D.tsx`

**Chi tiết:**
1. Thêm ánh sáng điểm phát quang dịu nhẹ (subtle point lights / emissive) cho các công trình có đèn:
   - Hải Đăng Vũng Tàu (đèn hiệu xoay vàng).
   - Chùa Cầu Hội An (đèn lồng đỏ son phát sáng lung linh).
   - Tháp Trầm Hương Nha Trang (quả cầu ngọc sáng).
   - Chợ Bến Thành (mặt đồng hồ dạ quang ban đêm).
   - Tháp Rùa Hà Nội (đèn lồng mái ấm áp).
2. Tinh chỉnh tỷ lệ scale của các landmark để vừa vặn hoàn hảo trên ô đất isometric không che khuất nhãn tên hoặc quân cờ.
3. Đảm bảo 0 memory allocation bên trong render loops.

- [x] Step 2.1: Cập nhật `CityLandmarks3D.tsx` với ánh sáng điểm và vật liệu bóng bẩy.
- [x] Step 2.2: Chạy vitest và `npm run build` xác nhận không có lỗi.
- [x] Step 2.3: Commit: `feat(art-stage-4): polish 16+ vietnamese city landmarks with emissive beacons and lanterns`.

---

### Task 3: Kiểm Thử Toàn Diện & Nghiệm Thu Giai Đoạn 4
**Files:**
- Test: Full Vitest suite & Next.js production build

- [x] Step 3.1: Chạy toàn bộ vitest (đảm bảo 100% test pass).
- [x] Step 3.2: Chạy Next.js production build kiểm tra TypeScript và bundling.
- [x] Step 3.3: Review bởi Task Reviewer subagent và phê duyệt.

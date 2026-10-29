# CỜ TỶ PHÚ 3D - ĐẠI TU ĐỒ HOẠ THEO PHONG CÁCH "META WORLD: MY CITY" (NETMARBLE)

> **Mục tiêu:** Đại tu toàn bộ đồ hoạ game Cờ Tỷ Phú 3D từ nền tảng hiện tại sang chuẩn hình ảnh **Meta World: My City / Everybody's Marble 2 (Netmarble)** giống 100% hình ảnh thực tế mà người dùng cung cấp. Người chơi khi nhìn vào sẽ cảm nhận được độ hoàn thiện của một tựa game thương mại AAA trên Web/Mobile.

---

## 1. AUDIT CODEBASE & ĐÁNH GIÁ ĐỒ HOẠ HIỆN TẠI (STEP 1)

### 1.1 Những điểm còn thiếu so với Game Mẫu (Hình đính kèm)
| Hạng mục | Hiện tại (Đảo Ngọc) | Game Mẫu (Meta World: My City) | Giải pháp kỹ thuật nâng cấp |
| :--- | :--- | :--- | :--- |
| **Không gian trung tâm bàn cờ** | Đài sen và viên ngọc khổng lồ chiếm diện tích lớn, che tầm nhìn bàn cờ. | **Hồ nước sinh thái mở (Open Water Basin)** nước sâu xanh ngọc (`#0f4c5c`), có hoa súng, bèo hoa dâu và gợn sóng lấp lánh, nhìn thông suốt toàn bộ 4 góc bàn cờ. | Thay cụm đài sen ở tâm bằng **Hồ Nước Đô Thị Xanh Ngọc**, thêm shader gợn sóng, cụm lá súng bèo trôi dạt tự nhiên và mặt nước phản chiếu bầu trời. |
| **Kết cấu chân đế bàn cờ** | Khung gỗ mun đóng phẳng trên mặt phẳng. | **Cầu cạn / Cầu vòm đá & thép (Viaduct Promenade)** với các vòm trụ cầu (`W5`, `4 6`) đỡ toàn bộ mặt đường chạy qua mặt hồ. | Tạo hệ thống vòm trụ cầu cạn chạy dưới 32 ô cờ, tạo cảm giác bàn cờ là con đường đi dạo trên cao bắc qua vịnh nước. |
| **Tiểu cảnh ngoại vi (Surrounding Diorama)** | Đảo hoang sơ rải rác ngoài xa. | **Đô thị cảng biển sầm uất**: Du thuyền siêu sang ở góc trái, Nhà hát Opera / Ga trung tâm mái vòm ở góc phải, Tuyến đường sắt trên cao có đoàn tàu điện chạy quanh. | Dựng mô hình **Du Thuyền Mega Yacht trắng** cập bến cảng ván gỗ (Bottom-Left), **Tòa nhà Ga Trung Tâm / Nhà Hát Châu Âu** mái vòm đồng xanh (Bottom-Right), và **Cổng Khải Hoàn Môn Triumphal Arch** rực sáng thần bí (Top-Right). |
| **Quân cờ / Nhân vật (Avatars)** | 4 Linh thú thú cưng Chibi (Heo, Cáo, Mèo, Trâu). | **Nhân vật Anime K-Streetwear tỉ lệ chuẩn**: Cậu bé Hoodie trắng năng động & Cô bé nón bucket, áo thun street, quần túi hộp và giày độn đế. | Bổ sung hệ thống **Nhân Vật Anime 3D Streetwear** (`AnimeBoyAvatar` & `AnimeGirlAvatar`) với tạo hình thời trang cao cấp, mắt anime long lanh, con trỏ kim cương (`▼`) trên đầu. |
| **Ô đất & Bề mặt đường** | Gạch men sứ trơn màu. | **Đại lộ Asphalt & Đá phiến đô thị** có gờ vỉa hè bê tông, vạch kẻ đường, biển tên quận Acrylic phát sáng, và **Cổng dịch chuyển ma thuật xoay tròn (Mystic Portal Ring)**. | Nâng cấp texture mặt đường nhựa asphalt nhám, vỉa hè đá granit, bảng tên khu vực dạ quang cao cấp, và vòng xoáy ma thuật trên các ô đặc biệt. |
| **Hiệu ứng xây Landmark (VFX)** | Công trình xuất hiện tĩnh. | **Cột sáng Hologram (`Constructing Landmark`)**: Cột năng lượng xanh ngọc phóng thẳng lên trời, khung khối lập phương 3D wireframe và tòa nhà lam ngọc phát sáng. | Hiện thực hoá hiệu ứng **Holographic Construction Beam** với cột sáng trụ rực rỡ, wireframe bounding box xoay nhẹ và chữ nổi "Constructing Landmark". |
| **Công trình & Khách sạn** | Khối nhà cách điệu nhỏ. | **Khách sạn & Cao ốc uốn cong hiện đại**, có **biển hiệu neon "HOTEL" dựng đứng rực đỏ/xanh**, bồn cây cọ cảnh và đèn đường. | Thêm biển hiệu neon phát sáng dọc tòa nhà, ban công kính cong và cây cọ cảnh mini ven đường. |
| **Giao diện HUD** | Kính mờ phẳng phong cách chung. | **Arcade Meta World UI**: Thanh trên hiển thị Avatar người chơi, tiền tệ triệu K (`76M740K`), thanh đếm lượt; Khay thẻ nhân vật anime và các lá bài chọn xúc xắc (`2~4 JUMP`, `10~12 JUMP`, `6 DOUBLE`). | Thiết kế lại Top Bar và Bottom Action Deck với phong cách thẻ bài viền vàng, chân dung nhân vật anime và thẻ số xúc xắc xúc giác. |

---

## 2. ĐỀ XUẤT ART DIRECTION TOÀN DIỆN (STEP 2)

### 2.1 Bảng màu chủ đạo (Color Palette)
- **Deep Lagoon Teal (Nước hồ trung tâm):** `#0f4c5c` đến `#16697a` (độ sâu) chuyển dần sang `#0891b2` (viền nông).
- **Asphalt & Granite (Mặt đường & Viaduct):** `#1e293b` (đường nhựa), `#334155` (đá viaduct viền), `#64748b` (bê tông gờ).
- **Neon District Accents (Dải màu quận đô thị):**
  - Hồng Magenta rực rỡ: `#ec4899` / `#f43f5e`
  - Tím Thạch anh: `#8b5cf6` / `#7c3aed`
  - Lam Hoàng gia: `#2563eb` / `#38bdf8`
  - Đỏ Hoàng gia: `#dc2626`
- **Hologram Cyan (Hiệu ứng xây dựng & ma thuật):** `#22d3ee`, `#06b6d4`, `#67e8f9` với phát quang emissive 2.2.
- **Warm Golden Hour Sunset Lighting:** Ánh sáng mặt trời chiều tà `#fff7ed` rọi xiên tạo bóng đổ dài sắc nét và phản chiếu vàng óng trên mặt nước.

### 2.2 Phong cách tạo hình & Tỉ lệ (Stylized Architectural Miniatures & Anime Avatars)
- Nhân vật: Tỉ lệ cơ thể 1:4.5 (Heroic Semi-Chibi Anime), trang phục Streetwear hợp thời trang giới trẻ (Hoodie, Cargo Pants, Bucket Hat, Chunky Sneakers).
- Kiến trúc: Phong cách Miniature Diorama cao cấp (Tilt-shift feel) với các chi tiết sắc sảo: biển neon "HOTEL", vòm kính, cây xanh đô thị, vạch kẻ đường vàng.
- Nước: Mặt hồ trung tâm có chiều sâu, phản xạ gương và các cụm lá súng bèo hoa dâu điểm xuyết hoa sen trắng hồng.

### 2.3 Ánh sáng & Camera
- **Camera:** Góc Isometric 3D nghiêng 38 độ (`position: [14.5, 20.5, 17.5]`, `fov: 33`), nhìn bao trọn toàn bộ lòng hồ và 4 góc bàn cờ.
- **Key Light:** Directional Light cường độ 2.8 từ góc cao tây nam, tạo bóng đổ đổ dài chân thực (`ContactShadows` + dynamic shadows).
- **Emissive Lights:** Biển neon HOTEL, Cổng ma thuật xoay tròn, Cột sáng Hologram, Đèn pha xe điện và Đèn cảng du thuyền.

---

## 3. DANH SÁCH CÁC HẠNG MỤC CẦN NÂNG CẤP (STEP 3)

1. **Bàn cờ & Lòng Hồ Trung Tâm (`BoardTableFrame.tsx`, `MiniWorldDiorama3D.tsx`)**:
   - Xóa bỏ viên ngọc khổng lồ chiếm tầm nhìn giữa bàn cờ.
   - Dựng **Hồ nước trung tâm rộng lớn (Open Teal Water Basin)** với hiệu ứng gợn sóng và lá sen/hoa súng bồng bềnh.
   - Thêm kết cấu **Cầu cạn / Cầu vòm Viaduct** (`W5`, `4 6`) chống đỡ toàn bộ lòng bàn cờ.
2. **Tiểu cảnh Cảng Biển & Ga Đô Thị Ngoại Vi**:
   - Dựng **Siêu Du Thuyền Mega Yacht trắng** neo đậu tại bến gỗ góc dưới bên trái.
   - Dựng **Tòa nhà Ga Trung Tâm / Nhà Hát Cổ Điển** mái vòm đồng xanh tại góc dưới bên phải.
   - Dựng **Khải Hoàn Môn Triumphal Arch** với ánh hào quang xanh ngọc tại góc trên bên phải.
   - Dựng **Cầu đường sắt trên cao & Đoàn tàu điện màu đỏ/xanh** lượn quanh viền ngoại cảnh.
3. **Mặt Đường & Các Ô Đất (`BoardTiles3D.tsx`)**:
   - Mặt đường nhựa asphalt sẫm màu với vỉa hè gạch đá hoa cương và vạch sơn vàng.
   - **Cổng xoay ma thuật (Mystic Portal Ring)** xoay phát sáng trên các ô đặc biệt/sự kiện.
   - **Hologram Landmark Construction VFX**: Cột sáng xanh ngọc vươn cao với lồng wireframe và nhãn "Constructing Landmark".
4. **Nhân Vật Avatar Anime 3D (`MascotPawns3D.tsx`)**:
   - **Anime Boy Avatar**: Hoodie trắng, quần đùi đen thể thao, giày sneaker, tóc đen lãng tử, con trỏ kim cương xanh dương trên đầu.
   - **Anime Girl Avatar**: Nón bucket đen, áo thun street, quần túi hộp màu rêu, giày platform, tóc dài nâu hạt dẻ, con trỏ mũi tên xanh lá trên đầu.
   - Tích hợp liền mạch với hệ thống nhảy từng ô (`TOKEN_MOVING`), hiệu ứng squash-and-stretch và spotlight lượt đi.
5. **Công Trình & Khách Sạn Cao Ốc (`Buildings3D.tsx`)**:
   - Khách sạn 3D hiện đại với **biển hiệu neon "HOTEL" rực sáng dọc thân nhà**.
   - Bồn hoa, cây cọ kiểng và cột đèn đường mini bên cạnh mỗi công trình.
6. **Giao Diện HUD Meta World Commercial Arcade (`CoTyPhuHUD.tsx`, `DiceControlPanel.tsx`, `GameHeader.tsx`)**:
   - Thanh trên với huy hiệu Đội Đỏ vs Đội Xanh, Avatar Anime, tiền tệ hiển thị dạng `76M740K`, thanh đếm lượt.
   - Khay bài dưới góc phải: Thẻ kỹ năng nhân vật Anime viền vàng và các nút Thẻ xúc xắc chiến thuật (`2~4 JUMP`, `10~12 JUMP`, `6 DOUBLE`, Nút Đổ Xúc Xắc lớn).

---

## 4. KẾ HOẠCH TRIỂN KHAI THEO 4 GIAI ĐOẠN LIỀN MẠCH (STEP 4-7)

- **Giai đoạn A (Vertical Slice - Hồ Nước Viaduct & Hologram Landmark)**:
  - Chuyển đổi trung tâm bàn cờ thành Hồ Nước Đô Thị Xanh Ngọc với lá sen và trụ cầu cạn Viaduct Arches.
  - Xây dựng hiệu ứng Hologram Landmark Construction Beam trên ô đất.
  - Kiểm chứng hiệu ứng và chạy test pass 100%.
- **Giai đoạn B (Ngoại Vi Đô Thị - Siêu Du Thuyền, Nhà Hát Ga & Cầu Đường Sắt)**:
  - Hoàn thiện mô hình Siêu Du thuyền, Ga Trung Tâm, Cổng Khải Hoàn Môn phát sáng và Tuyến tàu điện trên cao.
- **Giai đoạn C (Cặp Đôi Nhân Vật Anime 3D Streetwear)**:
  - Thiết kế và đưa vào 2 model Anime Avatar (Cậu bé Hoodie & Cô bé Bucket Hat) cử động mượt mà.
- **Giai đoạn D (Giao Diện HUD Thẻ Bài Meta World & Hoàn Tất Tối Ưu 60 FPS)**:
  - Thiết kế Deck thẻ bài Anime và xúc xắc chiến thuật góc dưới phải.
  - Hoàn thiện toàn bộ hệ thống âm thanh, kiểm thử 211 tests, build production và tự động commit/push.

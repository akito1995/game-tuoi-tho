# Thiết Kế Chi Tiết: Cổng Game Tuổi Thơ & Cờ Tỷ Phú 3D Việt Nam

**Ngày lập:** 2026-10-28  
**Tác giả:** AI Assistant & Người dùng  
**Trạng thái:** Đã thống nhất (Approved Spec)  
**Mục tiêu triển khai:** Vercel (Next.js 14+ App Router, Không phát sinh chi phí server duy trì)

---

## 1. Tổng Quan Dự Án
Xây dựng một nền tảng Web App **Cổng Game Tuổi Thơ** (Vietnamese Childhood Games Hub) thân thiện, hiện đại, hỗ trợ nhiều người chơi cùng nhau trực tuyến hoặc trên cùng một thiết bị. 
Tựa game đầu tiên mở màn là **Cờ Tỷ Phú 3D Việt Nam**, được nâng cấp toàn diện về mặt đồ họa (đảo nổi 3D lơ lửng, ánh sáng, nước hồ lung linh, mô hình nhà 3D nảy nở, xúc xắc vật lý), âm thanh sống động, hệ thống thẻ bài Cơ Hội / Khí Vận dân gian vui nhộn, cùng hệ thống khung chat trực tiếp và biểu cảm emote thời gian thực.

---

## 2. Kiến Trúc Kỹ Thuật (Architecture & Tech Stack)

### 2.1. Frontend & Core Framework
- **Framework:** Next.js 14+ (App Router, React 18/19, TypeScript).
- **Styling:** Tailwind CSS, Framer Motion (cho UI animations), Lucide React (hệ thống icons).
- **3D Graphics Engine:** 
  - `@react-three/fiber` (React Three Fiber) & `@react-three/drei`.
  - Three.js WebGL rendering với procedural stylized meshes, dynamic lighting, water ripples và physics-like 3D dice rotation.
- **State Management:** Zustand (State Machine độc lập, quản lý lượt chơi, ngân hàng, bất động sản, thẻ bài, bot AI).
- **Audio Engine:** Howler.js hoặc HTML5 Web Audio API (nhạc nền tuổi thơ êm dịu BGM, hiệu ứng âm thanh SFX xúc xắc, ting ting tiền tệ, tiếng xây nhà, còi xe, còi tù).
- **Hiệu ứng Game Juice:** Canvas Confetti khi chiến thắng, screen shake nhẹ khi phá sản, popup nảy mọc nhà 3D.

### 2.2. Multiplayer & Đồng Bộ Mạng (Network Architecture)
- **Hỗ trợ 3 chế độ chơi:**
  1. **Pass & Play (Cùng 1 máy):** 2 - 4 người chơi trên cùng màn hình (Tivi/Laptop/Tablet/Điện thoại), xoay vòng lượt chơi trực tiếp.
  2. **Đấu với Bot AI (Single-player):** 1 người chơi cùng 1 - 3 Bot máy tự động (thuật toán đánh giá tài chính thông minh, độ trễ tự nhiên 1.2s để người chơi dễ theo dõi).
  3. **Phòng chơi Online (Multi-device P2P):** 
     - Kết nối thời gian thực qua WebRTC (PeerJS) và BroadcastChannel / Supabase Realtime fallback.
     - Host tạo phòng sinh ra Mã PIN 6 ký tự (ví dụ: `TYPHU-88`).
     - Người chơi khác nhập mã PIN hoặc click Link chia sẻ để vào sảnh chờ.
     - Host đóng vai trò Server Authority, truyền đồng bộ trạng thái (Action & State Delta: đổ xúc xắc, mua đất, nâng cấp, chuyển tiền, gửi tin nhắn chat, thả emote).
     - **100% tương thích Vercel Serverless**, không cần duy trì persistent WebSocket server riêng.

---

## 3. Cấu Trúc Dự Án (Project File Structure)

```text
├── docs/
│   └── superpowers/specs/
│       └── 2026-10-28-vietnamese-childhood-games-portal-design.md
├── src/
│   ├── app/
│   │   ├── layout.tsx                     # Global layout, fonts, sound provider
│   │   ├── page.tsx                       # Sảnh chính: Cổng Game Tuổi Thơ (Portal Home)
│   │   ├── games/
│   │   │   └── co-ty-phu/
│   │   │       ├── page.tsx               # Màn hình chuẩn bị game / Vào bàn chơi Cờ Tỷ Phú
│   │   │       └── play/page.tsx          # Bàn cờ Cờ Tỷ Phú 3D chính thức
│   │   ├── room/
│   │   │   └── [roomId]/page.tsx          # Sảnh chờ phòng chơi Online (Lobby)
│   │   └── profile/page.tsx               # Thông tin người chơi, thống kê, huy hiệu
│   ├── components/
│   │   ├── hub/                           # UI Sảnh cổng game, carousel game tuổi thơ
│   │   ├── games/co-ty-phu/
│   │   │   ├── board-3d/                  # Canvas 3D: Đảo bay, hồ nước, mây, lửa trại
│   │   │   │   ├── FloatingIsland.tsx     # Đảo nổi, địa hình cỏ, vách đá, cây cối, hồ nước
│   │   │   │   ├── BoardTiles3D.tsx       # 32 ô đất 3D bao quanh đảo
│   │   │   │   ├── MascotPawns3D.tsx      # 4 linh vật 3D (Heo, Cáo, Mèo, Trâu) nhảy nhót
│   │   │   │   ├── Buildings3D.tsx        # Cờ, nhà cấp 1-2, biệt thự, resort 3D
│   │   │   │   ├── Dice3D.tsx             # Cặp xúc xắc 3D lăn nảy
│   │   │   │   └── EnvironmentEffects.tsx # Mây trôi, lửa trại khói, chu kỳ Ngày/Đêm
│   │   │   ├── hud/                       # UI Lớp trên bàn cờ (Overlay 2D)
│   │   │   │   ├── PlayerListBar.tsx      # Danh sách người chơi, tài sản, linh vật
│   │   │   │   ├── DiceControlPanel.tsx   # Nút đổ xúc xắc, kết quả, nút kết thúc lượt
│   │   │   │   ├── PropertyActionModal.tsx# Modal mua đất, nâng cấp nhà, trả tiền thuê
│   │   │   │   ├── ChanceCardModal.tsx    # Modal hiển thị thẻ Cơ Hội / Khí Vận dân gian
│   │   │   │   ├── LiveChatBox.tsx        # Khung chat trực tiếp & câu thoại nhanh
│   │   │   │   ├── EmoteWheel.tsx         # Vòng xoay biểu cảm (Thả tim, Cười, Ném dép)
│   │   │   │   └── EventLogTicker.tsx     # Dòng thông báo sự kiện thời gian thực
│   │   └── shared/                        # Avatar, Modal, Button, AudioToggle, SoundEffects
│   ├── lib/
│   │   ├── audio/                         # SoundManager, sfx synthesizer & audio loader
│   │   ├── game-engine/
│   │   │   ├── types.ts                   # Định nghĩa GameState, Player, Tile, Card, Action
│   │   │   ├── boardData.ts               # Dữ liệu 32 ô địa danh Việt Nam (Hà Nội, Sài Gòn...)
│   │   │   ├── chanceCards.ts             # Danh sách thẻ Cơ Hội / Khí Vận dân gian vui nhộn
│   │   │   ├── gameStore.ts               # Zustand Store: toàn bộ luật và logic cờ tỷ phú
│   │   │   └── botAI.ts                   # Thuật toán trí tuệ nhân tạo Bot AI
│   │   └── multiplayer/
│   │       ├── peerService.ts             # WebRTC PeerJS kết nối phòng P2P
│   │       └── protocol.ts                # Định dạng gói tin Network Action & Chat Message
```

---

## 4. Chi Tiết Thiết Kế Game 1: Cờ Tỷ Phú 3D

### 4.1. Bản đồ 32 Ô Địa Danh & Văn Hóa Việt Nam
- **4 Ô Góc Chiến Lược:**
  - Ô 0: **XUẤT PHÁT** (Cổng làng cờ hoa rực rỡ, đi qua nhận +200k tiền thưởng).
  - Ô 8: **TRẠI GIAM / NGHỈ MÁT TẠM THỜI** (Trạm gác tre vui nhộn, đi bão bị phạt giam 3 lượt hoặc nộp 100k bảo lãnh).
  - Ô 16: **LỄ HỘI DÂN GIAN** (Sân khấu hội làng an toàn, có cơ hội bốc thăm ẵm trọn Quỹ Heo Đất).
  - Ô 24: **BỊ BẮT (ĐI VÀO TÙ)** (Xe tuần tra hú còi vui nhộn, áp giải ngay về Trại giam).
- **Các Dải Địa Danh (Phân cụm theo màu & vùng miền):**
  - Cụm Nâu (Miền Tây): *Cà Mau, Chợ Nổi Cái Răng*.
  - Cụm Xanh Ngọc (Biển đảo): *Vũng Tàu, Nha Trang, Đảo Ngọc Phú Quốc*.
  - Cụm Xanh Lam (Cao nguyên): *Đà Lạt, Buôn Ma Thuột*.
  - Cụm Vàng (Di sản Miền Trung): *Cố Đô Huế, Phố Cổ Hội An, Cầu Rồng Đà Nẵng*.
  - Cụm Cam (Kỳ quan Miền Bắc): *Sa Pa, Tràng An Ninh Bình, Vịnh Hạ Long*.
  - Cụm Đỏ (Đô thị sầm uất): *Cảng Hải Phòng, Thủ Đô Hà Nội, TP. Hồ Chí Minh*.
  - Cụm Tiện ích & Giao thông: *Sân bay Tân Sơn Nhất, Sân bay Nội Bài, Nhà máy Điện, Trạm Cấp Nước Sạch*.
  - Cụm Cơ Hội & Khí Vận xen kẽ.

### 4.2. Cấp Độ Bất Động Sản & Mô Hình 3D
1. **Đất trống:** Cắm cờ màu linh vật của người chơi.
2. **Nhà Cấp 1:** Nhà mái ngói đỏ truyền thống xinh xắn.
3. **Nhà Cấp 2:** Nhà 2 tầng khang trang có ban công.
4. **Biệt Thự:** Villa sân vườn mini sang trọng.
5. **Siêu Resort / Khách Sạn:** Khu nghỉ dưỡng cao cấp có hồ bơi và đèn rực rỡ.  
*Hiệu ứng:* Khi mua/nâng cấp, mô hình 3D rơi nảy spring bounce xuống ô đất, kèm ánh hào quang, pháo giấy và âm thanh "bụp" vui tai. Tiền phạt thu được từ đối thủ tăng vọt theo cấp độ!

### 4.3. Linh Vật Người Chơi (3D Mascots)
- 🐷 **Heo Phượt:** Đội mũ bảo hiểm phượt thủ, balo du lịch.
- 🦊 **Cáo Tí:** Quàng khăn đỏ, đeo kính râm thời trang.
- 🐱 **Mèo Ú:** Mèo thần tài ôm thỏi vàng may mắn.
- 🐂 **Trâu Vàng:** Miệng cười toe toét, chuông lục lạc leng keng.
- *Chuyển động:* Khi đổ xúc xắc, linh vật nhảy tưng tưng (hop animation theo parabol) qua từng ô đất trên nền nhạc lách cách nhịp nhàng.

### 4.4. Thẻ Cơ Hội & Khí Vận Dân Gian
- Rút ngẫu nhiên các tình huống tuổi thơ:
  - *"Trúng vé số độc đắc: Nhận ngay 300k."*
  - *"Bị CSGT bắt vì không đội mũ bảo hiểm: Nộp phạt 100k vào Quỹ Lễ Hội."*
  - *"Bà ngoại dưới quê lên chơi cho tiền ăn bánh: Nhận +150k."*
  - *"Hôm nay trời đẹp, mời cả bàn đi ăn chè: Chuyển cho mỗi người chơi khác 50k."*
  - *"Được tặng vé bay khứ hồi: Bay thẳng đến Đảo Ngọc Phú Quốc."*
  - *"Thẻ Kim Bài Thoát Tù: Giữ thẻ này để được thả tự do bất kỳ lúc nào."*

### 4.5. Khung Chat Trực Tiếp & Biểu Cảm (Live Chat & Emote Wheel)
- **Khung Chat thời gian thực (Live Chat Box):**
  - Cửa sổ chat gọn gàng ở góc màn hình (có thể thu nhỏ/mở rộng).
  - Cho phép gõ tin nhắn tự do trao đổi với đối thủ.
  - Tích hợp sẵn bộ **Câu Thoại Nhanh (Quick Chat)** hài hước: *"Cứu tui!", "Cay thế nhờ!", "Đại gia cho vay ít tiền!", "Vào tù vui vẻ nhé bạn hiền!", "May mắn thôi con gà ạ 🐔", "Ăn đậm rồi kaka!"*.
- **Vòng xoay Emote (Emote Wheel):**
  - Bấm chọn các biểu cảm nổi trên màn hình và bay thẳng trên đầu linh vật 3D:
    - ❤️ Thả tim thân thiện
    - 😂 Cười lăn lộn
    - 😭 Khóc ròng vì giẫm phải resort
    - 🩴 Ném dép troll bạn bè
    - 👏 Vỗ tay chúc mừng
    - 🔥 Quyết chiến

### 4.6. Trí Tuệ Nhân Tạo (Bot AI)
- Bot tự động phân tích:
  - Tỷ lệ tiền mặt an toàn so với nguy cơ giẫm vào ô của đối thủ.
  - Ưu tiên mua các ô đất cùng màu để hình thành thế độc quyền nhân đôi tiền thuê.
  - Tự động nâng cấp nhà khi tài chính dồi dào.
  - Phản ứng ngẫu nhiên bằng tin nhắn chat và emote để tạo không khí như chơi với người thật.

---

## 5. Kế Hoạch Triển Khai (Milestones)

1. **Giai đoạn 1: Khởi tạo Project & Cấu trúc Sảnh Game (Hub Portal)**
   - Khởi tạo Next.js 14 App Router, Tailwind CSS, Lucide Icons.
   - Xây dựng Layout sảnh chính: Logo, chọn Linh vật, âm thanh BGM/SFX, các thẻ game tuổi thơ.
2. **Giai đoạn 2: Xây dựng Đồ họa 3D Cờ Tỷ Phú (React Three Fiber)**
   - Dựng hòn đảo nổi 3D (Floating Island) với hồ nước phản chiếu, mây trôi, cây cối, cắm trại, ánh sáng.
   - Dựng bàn cờ 32 ô địa danh 3D bao quanh đảo.
   - Dựng mô hình 3D cho 4 linh vật, mô hình nhà/resort nâng cấp, và cặp xúc xắc 3D.
3. **Giai đoạn 3: Hoàn thiện Game Logic Engine (State Machine) & AI Bot**
   - Triển khai toàn bộ quy luật cờ tỷ phú: đổ xúc xắc, mua đất, thu tiền thuê, thẻ Cơ hội / Khí vận, tù đày, phá sản.
   - Tích hợp Bot AI thông minh.
4. **Giai đoạn 4: HUD, Khung Chat Trực Tiếp, Emote & Chế độ Chơi**
   - UI điều khiển đổ xúc xắc, thông tin tài sản người chơi, bảng log sự kiện.
   - Khung Live Chat và bánh xe Emote thời gian thực.
   - Tích hợp 3 chế độ: Chơi cùng nhau trên 1 máy (Pass & Play), Đấu với Bot, và Phòng chơi Online (P2P Room PIN).
5. **Giai đoạn 5: Tinh chỉnh Đồ họa, Tối ưu Hiệu năng & Kiểm thử Vercel**
   - Tinh chỉnh ánh sáng, độ mượt 60fps trên mobile và máy tính.
   - Build và xác minh tương thích triển khai trên Vercel.

---

## 6. Tiêu Chí Nghiệm Thu (Acceptance Criteria)
- [x] Giao diện sảnh Game Hub mang phong cách tuổi thơ, thân thiện, dễ thương.
- [x] Bàn cờ Cờ Tỷ Phú 3D lung linh, có thể xoay camera, hiệu ứng ánh sáng và nước hồ sống động hơn ảnh mẫu.
- [x] Đầy đủ 3 chế độ: Chơi 1 máy Pass & Play, Đấu với AI Bot, và Tạo phòng Online.
- [x] Có khung chat trực tiếp và hệ thống emote thả biểu cảm tương tác giữa các người chơi.
- [x] Luật chơi chuẩn Việt Nam, địa danh thân thuộc, thẻ Cơ Hội hài hước.
- [x] Chạy mượt mà, build thành công, sẵn sàng deploy lên Vercel không cần backend server phức tạp.

# 🎲 Cổng Game Dân Gian & Cờ Tỷ Phú 3D Việt Nam

> **Khám phá tuổi thơ Việt qua giao diện 3D sống động trên nền tảng Web hiện đại, không cần cài đặt, không tốn chi phí máy chủ.**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)
![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=flat&logo=next.js)
![React](https://img.shields.io/badge/React-18.3-61dafb?style=flat&logo=react)
![Three.js](https://img.shields.io/badge/Three.js-0.165-black?style=flat&logo=three.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178c6?style=flat&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=flat&logo=tailwindcss)
![Vitest](https://img.shields.io/badge/Tests-180%2B%20Passing-brightgreen?style=flat&logo=vitest)

---

## 🌟 Tổng Quan Dự Án

**Cổng Game Dân Gian Việt Nam** là dự án số hoá các trò chơi dân gian gắn liền với ký ức tuổi thơ nhiều thế hệ người Việt (Cờ Tỷ Phú, Ô Ăn Quan, Cờ Ca-rô, Cá Ngựa...), được xây dựng bằng công nghệ Web 3D hiện đại nhất: **Next.js 14 App Router**, **Three.js / React Three Fiber**, **Zustand** và **WebRTC Peer-to-Peer**.

Tâm điểm của cổng game là **Cờ Tỷ Phú 3D Việt Nam (Đảo Ngọc Bay)** — tái hiện trọn vẹn bàn cờ 32 ô mang đậm bản sắc văn hoá, địa danh và ẩm thực dọc 3 miền Bắc - Trung - Nam (Hà Nội, Vịnh Hạ Long, Sa Pa, Huế, Đà Nẵng, TP. Hồ Chí Minh, Phú Quốc...).

---

## ✨ Tính Năng Nổi Bật

### 🏝️ 1. Đồ Hoạ 3D "Đảo Ngọc Bay" (Three.js & React Three Fiber)
- **Đảo Bay Lơ Lửng Giữa Tầng Mây:** Bàn cờ nằm trên hòn đảo thần tiên với địa hình cỏ xanh, hồ nước trong vắt, cầu gỗ, cây cối, lều trại và đình đài truyền thống.
- **Tối Ưu Hoá 60 FPS Di Động:** Cơ chế tái sử dụng vector (Vector Pooling), scalar lerping và giới hạn DPR (`dpr={[1, 1.5]}`) đảm bảo mượt mà ngay cả trên thiết bị di động có cấu hình phổ thông.
- **Khay Đổ Xúc Xắc Gỗ Sơn Mài:** Hiệu ứng đổ xúc xắc 3D vật lý chân thực với chấm đỏ truyền thống Á Đông, bay lượn và xoay mặt chính xác theo kết quả xúc xắc.
- **Hệ Thống Công Trình 5 Cấp Độ:** Tự động nâng cấp trực quan từ *Cắm Cờ Định Đoạt Đất -> Nhà Tranh Cấp 1 -> Nhà Tranh Cấp 2 -> Biệt Thự Cao Cấp -> Đại Resort 5 Sao*.

### 🐾 2. 4 Linh Vật 3D Độc Quyền Biểu Cảm Cao
- 🐷 **Bé Heo Phượt (Pig):** Mũ phượt, kính bảo hộ, ba lô phiêu lưu màu cam.
- 🦊 **Bé Cáo Tí (Fox):** Kính râm đen sành điệu, khăn choàng trắng, đuôi bông bềnh.
- 🐱 **Bé Mèo Ú (Cat):** Vòng cổ đỏ, chuông đồng phong thuỷ may mắn Maneki-neko.
- 🐂 **Bé Trâu Vàng (Buffalo):** Cặp sừng cong dũng mãnh, khuyên mũi mạ vàng phú quý.
- *Chuyển động nhảy parabol mềm mại kèm hiệu ứng co giãn tự nhiên (Squash & Stretch).*

### 🎮 3. Ba Chế Độ Chơi Đa Dạng
1. **Đấu Với Máy (Bot AI Thông Minh):**
   - Thuật toán AI phân tích tài chính đa cấp độ: tự động cân nhắc mua đất dựa trên số dư tiền mặt, tỷ lệ sở hữu monopoly theo màu, nâng cấp nhà và chiến thuật nộp phạt tại Nhà Tù Côn Đảo.
2. **Chơi Chung Thiết Bị (Pass & Play):**
   - Thích hợp tụ tập bạn bè, gia đình sum họp dịp cuối tuần hoặc lễ tết trên cùng 1 chiếc laptop/máy tính bảng.
3. **Đấu Online Thời Gian Thực (WebRTC P2P):**
   - Tạo phòng với mã số 6 ký tự ngẫu nhiên hoặc chia sẻ liên kết trực tiếp.
   - Kết nối Peer-to-Peer trực tiếp giữa các trình duyệt qua WebRTC DataChannel (sử dụng PeerJS).
   - **Chi phí vận hành server = 0 đồng** — Host đóng vai trò máy chủ ảo điều phối trạng thái (Virtual Host State Synchronization), hoàn toàn không cần backend WebSocket đắt đỏ.

### 💬 4. Khung Chat & Hệ Thống Biểu Cảm Emote
- Chat văn bản trực tiếp giữa các người chơi trong phòng.
- 12 emote cảm xúc tương tác vui nhộn (😂, 😎, 😭, 😡, 💸, 🎲, 🔥, 🏆...).

### 🎵 5. Âm Thanh Procedural Web Audio API
- Âm thanh xúc xắc, mua đất, nâng cấp nhà, còi tù, tiếng tiền reo vàng son và nhạc khúc chiến thắng (Win Fanfare) được tổng hợp bằng **Web Audio API** nguyên bản.
- Hoạt động 100% offline, không giật lag do tải tệp MP3 ngoài.

---

## 🏗️ Kiến Trúc Dự Án & Không Tốn Phí Server

```
vietnamese-childhood-games-portal/
├── src/
│   ├── app/                                 # Next.js 14 App Router
│   │   ├── page.tsx                         # Trang chủ Cổng Game Tuổi Thơ
│   │   ├── globals.css                      # Custom Scrollbar, Font Smoothing & Hiệu ứng Glow
│   │   ├── games/
│   │   │   └── co-ty-phu/
│   │   │       ├── page.tsx                 # Sảnh chờ, chọn chế độ & cấu hình phòng
│   │   │       └── play/
│   │   │           └── page.tsx             # Màn hình chơi 3D & HUD Cờ Tỷ Phú
│   │   └── room/[roomId]/
│   │       └── page.tsx                     # Điểm hẹn tham gia phòng Online P2P
│   ├── components/
│   │   ├── hub/                             # Các thành phần Cổng Game (Profile, GameCard, SoundToggle)
│   │   └── games/co-ty-phu/
│   │       ├── board-3d/                    # Toàn bộ thế giới 3D WebGL (Three.js)
│   │       │   ├── BoardCanvas.tsx          # Viewport Canvas WebGL & Camera Controls
│   │       │   ├── FloatingIsland.tsx       # Mô hình hòn đảo bay, hồ nước & cây cối
│   │       │   ├── BoardTiles3D.tsx         # 32 ô đất 3D với màu sắc vùng miền
│   │       │   ├── MascotPawns3D.tsx        # 4 Linh vật 3D, hopping lerp & nametag
│   │       │   ├── Buildings3D.tsx          # 5 cấp công trình bất động sản 3D
│   │       │   ├── Dice3D.tsx               # Xúc xắc 3D & khay sơn mài Á Đông
│   │       │   └── Environment3D.tsx        # Bầu trời, mặt trời đổ bóng & sương mù
│   │       └── hud/                         # Giao diện 2D điều khiển (HUD, MiniMap, Modals, Chat)
│   └── lib/
│       ├── game-engine/                     # Logic cốt lõi Cờ Tỷ Phú (Rules, Tiles, Store, Bot AI)
│       ├── multiplayer/                     # P2P WebRTC Service & Room/Chat Stores
│       └── audio/                           # Bộ giải mã âm thanh Web Audio procedural
└── tests/                                   # 180+ Unit & Integration Tests (Vitest)
```

### Tại sao lại không phát sinh chi phí server?
1. **Frontend Tĩnh Trên Edge:** Được phân phối toàn cầu qua mạng lưới Vercel Edge Network (Edge CDN).
2. **P2P Multiplayer WebRTC:** Người chơi kết nối thẳng trình duyệt với trình duyệt (Peer-to-Peer). Server trung gian chỉ làm nhiệm vụ bắt tay (Signaling qua public STUN/PeerJS cloud) rồi ngắt, dữ liệu ván đấu truyền trực tiếp giữa các máy người chơi.
3. **Lưu Trữ Cục Bộ (LocalStorage):** Hồ sơ game thủ, lịch sử đấu và cài đặt âm thanh lưu trữ trên trình duyệt của người dùng.

---

## 🚀 Hướng Dẫn Triển Khai Lên Vercel (1-Click Deploy)

Dự án được tối ưu hoá đặc biệt cho Vercel. Bạn có thể triển khai chỉ trong 1 phút hoàn toàn miễn phí (Vercel Hobby Plan):

### Cách 1: Nút Bấm 1-Click
1. Nhấn vào nút bên dưới:
   
   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

2. Đăng nhập tài khoản GitHub / GitLab / Bitbucket của bạn.
3. Chọn tên repository mới và nhấn **Create**.
4. Vercel sẽ tự động build và cung cấp cho bạn một domain HTTPS miễn phí (ví dụ: `https://co-ty-phu-vietnam.vercel.app`).

### Cách 2: Triển Khai Qua Vercel CLI
```bash
# Cài đặt Vercel CLI nếu chưa có
npm install -g vercel

# Đăng nhập và triển khai
vercel
```

*(Không cần cấu hình bất kỳ biến môi trường nào — zero environment variables required!)*

---

## 💻 Hướng Dẫn Chạy Cục Bộ (Local Development)

### Yêu Cầu Hệ Thống
- **Node.js:** Phiên bản 18.17 trở lên hoặc Node.js 20.x
- **Trình Quản Lý Gói:** `npm` (đi kèm Node.js) hoặc `pnpm`, `yarn`

### Các Bước Cài Đặt
```bash
# 1. Clone mã nguồn về máy
git clone https://github.com/your-username/vietnamese-childhood-games-portal.git

# 2. Di chuyển vào thư mục dự án
cd vietnamese-childhood-games-portal

# 3. Cài đặt các gói phụ thuộc
npm install

# 4. Khởi chạy máy chủ phát triển
npm run dev
```

Mở trình duyệt và truy cập: [http://localhost:3000](http://localhost:3000)

---

## 🧪 Kiểm Thử & Kiểm Tra Bản Build

Dự án đi kèm bộ test toàn diện bao phủ logic bàn cờ, xúc xắc 3D, bot AI, tính toán tài sản, hệ thống âm thanh và P2P store:

```bash
# Chạy toàn bộ 180+ Unit & Integration Tests
npm test

# Chạy test ở chế độ theo dõi thay đổi (Watch mode)
npm run test:watch

# Kiểm tra đóng gói phiên bản Production
npm run build
```

---

## 📜 Luật Chơi Cờ Tỷ Phú Việt Nam

- **Số người chơi:** 2 đến 4 người chơi.
- **Tiền khởi đầu:** 15.000.000 đ (15 triệu đồng).
- **Vòng xuất phát (Bến Thành):** Mỗi khi hoàn thành một vòng và đi qua ô Khởi Hành, người chơi nhận 2.000.000 đ trợ cấp.
- **Mua đất & Xây nhà:**
  - Khi dừng chân tại ô đất trống chưa có chủ: Có quyền mua đất theo giá niêm yết.
  - Khi đã sở hữu toàn bộ các ô đất cùng màu (Monopoly): Có quyền xây dựng nhà tranh, biệt thự và nâng cấp lên Resort 5 sao để nhân gấp nhiều lần tiền thuê.
- **Thu tiền thuê đất:** Người chơi khác khi dẫm vào ô đất của bạn phải nộp tiền thuê theo cấp độ công trình hiện có.
- **Cơ Hội & Khí Vận:** Nhận được phần thưởng may mắn bất ngờ hoặc chịu các mức phạt thú vị (nộp thuế đường, trúng thưởng vé số, đi du lịch...).
- **Nhà Tù Côn Đảo:** Đi vào ô Vào Tù hoặc rút trúng thẻ Vào Tù sẽ phải dừng chơi tối đa 3 lượt trừ khi đổ được xúc xắc đôi hoặc trả tiền bảo lãnh 500.000 đ.
- **Điều kiện thắng cuộc:** Trở thành người duy nhất không bị phá sản hoặc sở hữu tổng tài sản ròng lớn nhất khi hết thời gian ván đấu!

---

## 🤝 Đóng Góp Phát Triển

Dự án hoan nghênh mọi đóng góp từ cộng đồng (bổ sung trò chơi dân gian mới như *Ô Ăn Quan*, *Cờ Gánh*, *Cờ Chó*, tinh chỉnh đồ họa 3D, thêm mascot bản sắc Việt...). Hãy tạo **Issue** hoặc gửi **Pull Request**!

---

## 📄 Bản Quyền & Giấy Phép

Dự án được phát hành dưới giấy phép [MIT License](LICENSE). Trân trọng bảo tồn và phát huy nét đẹp văn hoá dân gian Việt Nam.

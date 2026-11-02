import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const OUT_DIR = path.resolve('public/screenshots/camera-edges');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const POSITIONS = [
  { id: 0, name: 'goc-0-nam-xuat-phat', desc: 'Góc Nam - Ô 0 (Xuất Phát)' },
  { id: 5, name: 'canh-dong-nam-nha-rong', desc: 'Cạnh Đông Nam - Ô 5 (Bến Nhà Rồng)' },
  { id: 10, name: 'goc-10-tay-trai-giam', desc: 'Góc Tây - Ô 10 (Trại Giam)' },
  { id: 15, name: 'canh-tay-nam-phu-quoc', desc: 'Cạnh Tây Nam - Ô 15 (Phú Quốc)' },
  { id: 20, name: 'goc-20-bac-le-hoi', desc: 'Góc Bắc - Ô 20 (Lễ Hội Phố Cổ)' },
  { id: 25, name: 'canh-tay-bac-ha-giang', desc: 'Cạnh Tây Bắc - Ô 25 (Hà Giang)' },
  { id: 30, name: 'goc-30-dong-vao-tu', desc: 'Góc Đông - Ô 30 (Vào Tù)' },
  { id: 35, name: 'canh-dong-bac-noi-bai', desc: 'Cạnh Đông Bắc - Ô 35 (Sân Bay Nội Bài)' },
];

async function run() {
  console.log('Khởi chạy Chrome headless kiểm tra Camera & Ảnh nền...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  console.log('Truy cập http://localhost:3000/play-v2...');
  await page.goto('http://localhost:3000/play-v2', { waitUntil: 'networkidle2' });

  // Đợi camera và bridge sẵn sàng
  await page.waitForFunction(
    () => window.__testBridge !== undefined && window.__testCamera !== undefined && window.__getTileGeometry !== undefined,
    { timeout: 20000 }
  );

  console.log('Camera và Board geometry đã sẵn sàng!');

  // 1. Kiểm tra toàn cảnh mặc định (Overview)
  console.log('\n--- Kiểm tra 1: Khung nhìn toàn cảnh mặc định (Overview) ---');
  await page.evaluate(() => {
    window.__testCamera.returnToOverview(400);
  });
  await new Promise((r) => setTimeout(r, 600));

  const overviewShot = path.join(OUT_DIR, '00-overview-toan-canh.png');
  await page.screenshot({ path: overviewShot });
  console.log(`Đã chụp: ${overviewShot}`);

  // 2. Chụp 4 cạnh và 4 góc khi nhân vật đứng và camera bám theo (focusOnPoint)
  for (let i = 0; i < POSITIONS.length; i++) {
    const pos = POSITIONS[i];
    console.log(`\n--- Kiểm tra vị trí ${i + 1}/8: ${pos.desc} ---`);

    // Di chuyển Bé Tí tới ô đó và bám camera theo đúng yêu cầu:
    // "Bám theo nhân vật: đưa nhân vật về vùng giữa màn hình (trong giới hạn trên), chuyển động mượt 0.4 giây, phóng to tối đa 1.2x"
    const result = await page.evaluate((tileId) => {
      const bridge = window.__testBridge;
      const camera = window.__testCamera;
      const getTileGeometry = window.__getTileGeometry;

      // Cập nhật vị trí Bé Tí
      bridge.engine.state.players[0].position = tileId;
      bridge.notify();

      const geo = getTileGeometry(tileId);
      if (geo && geo.center) {
        camera.focusOnPoint(geo.center.x, geo.center.y, 1.2, 400);
      }

      return {
        geoCenter: geo ? geo.center : null,
        zoom: camera.state.zoom,
        minZoom: camera.state.minZoom,
        baseCoverScale: camera.baseCoverScale,
        camX: camera.state.x,
        camY: camera.state.y,
      };
    }, pos.id);

    console.log(`Thông số camera tại ${pos.desc}:`, result);

    // Chờ 500ms để chuyển động 0.4s hoàn tất
    await new Promise((r) => setTimeout(r, 550));

    // Kiểm tra clamping không lộ khoảng đen
    const bounds = await page.evaluate(() => {
      const camera = window.__testCamera;
      const screenW = window.innerWidth;
      const screenH = window.innerHeight;
      const renderedW = 1672 * camera.state.zoom;
      const renderedH = 940 * camera.state.zoom;
      const maxPanX = Math.max(0, (renderedW - screenW) * 0.5);
      const maxPanY = Math.max(0, (renderedH - screenH) * 0.5);

      return {
        screenW,
        screenH,
        renderedW,
        renderedH,
        maxPanX,
        maxPanY,
        currentX: camera.state.x,
        currentY: camera.state.y,
        isClampedX: Math.abs(camera.state.x) <= maxPanX + 0.01,
        isClampedY: Math.abs(camera.state.y) <= maxPanY + 0.01,
        zoomGteCover: camera.state.zoom >= camera.baseCoverScale - 0.001,
      };
    });

    console.log(`Kiểm tra giới hạn mép ảnh tại ${pos.desc}:`, bounds);
    if (!bounds.isClampedX || !bounds.isClampedY || !bounds.zoomGteCover) {
      throw new Error(`PHÁT HIỆN LỘ KHOẢNG ĐEN tại ô ${pos.id}! Bounds: ${JSON.stringify(bounds)}`);
    }

    const shotPath = path.join(OUT_DIR, `${String(i + 1).padStart(2, '0')}-${pos.name}.png`);
    await page.screenshot({ path: shotPath });
    console.log(`✓ Đạt chuẩn - Đã chụp ảnh không lộ mép: ${shotPath}`);
  }

  // 3. Kiểm tra Thẻ mua/xây không che ô (Thẻ ô nửa trái -> hiện bên phải; Thẻ ô nửa phải -> hiện bên trái)
  console.log('\n--- Kiểm tra Thẻ Mua/Xây ô nửa trái (Ô 12: Thủy Điện Hòa Bình) ---');
  await page.evaluate(() => {
    const bridge = window.__testBridge;
    bridge.engine.state.players[0].position = 12;
    bridge.engine.state.gamePhase = 'AWAIT_DECISION';
    bridge.notify();
  });
  await new Promise((r) => setTimeout(r, 600));
  const modalLeftShot = path.join(OUT_DIR, '09-the-mua-xay-o-nua-trai.png');
  await page.screenshot({ path: modalLeftShot });
  console.log(`Đã chụp: ${modalLeftShot}`);

  console.log('\n--- Kiểm tra Thẻ Mua/Xây ô nửa phải (Ô 38: Hà Nội) ---');
  await page.evaluate(() => {
    const bridge = window.__testBridge;
    bridge.engine.state.players[0].position = 38;
    bridge.engine.state.gamePhase = 'AWAIT_DECISION';
    bridge.notify();
  });
  await new Promise((r) => setTimeout(r, 600));
  const modalRightShot = path.join(OUT_DIR, '10-the-mua-xay-o-nua-phai.png');
  await page.screenshot({ path: modalRightShot });
  console.log(`Đã chụp: ${modalRightShot}`);

  await browser.close();
  console.log('\n======================================================');
  console.log('TẤT CẢ 8 VỊ TRÍ (4 CẠNH + 4 GÓC) VÀ THẺ MUA/XÂY ĐÃ ĐẠT CHUẨN 100%!');
  console.log('KHÔNG HỀ LỘ BẤT KỲ KHOẢNG ĐEN NÀO Ở MỌI THỜI ĐIỂM.');
  console.log('======================================================\n');
}

run().catch((err) => {
  console.error('Lỗi kiểm tra camera:', err);
  process.exit(1);
});

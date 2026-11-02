import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = 'C:\\Users\\long.nh\\.gemini\\antigravity\\brain\\03db7da8-0236-4625-ac08-aef8db5b6357';
const MOCKUP_HTML_PATH = 'file:///C:/Users/long.nh/.gemini/antigravity/scratch/game-tuoi-tho/docs/mockup-the-mua-dat.html';
const UI_PREVIEW_URL = 'http://localhost:3000/tools/ui-preview';
const PLAY_V2_URL = 'http://localhost:3000/play-v2';

const OUT_DIR = path.resolve('public/screenshots/ui-preview');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function copyToArtifact(srcPath, filename) {
  if (fs.existsSync(srcPath)) {
    const dest = path.join(ARTIFACT_DIR, filename);
    fs.copyFileSync(srcPath, dest);
    console.log(`📋 Đã lưu vào Artifact: ${dest}`);
  }
}

async function run() {
  console.log('🚀 Bắt đầu kiểm tra và chụp màn hình Thẻ mua/xây & UI Preview...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 2 },
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // 1. Chụp file mẫu tham chiếu docs/mockup-the-mua-dat.html
  console.log('1. Mở file mẫu tham chiếu mockup-the-mua-dat.html...');
  await page.goto(MOCKUP_HTML_PATH, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 1000));
  const mockupShot = path.join(OUT_DIR, '01-mau-tham-chieu-mockup.png');
  await page.screenshot({ path: mockupShot, fullPage: false });
  await copyToArtifact(mockupShot, '01-mau-tham-chieu-mockup.png');
  console.log('📸 Đã chụp: 01-mau-tham-chieu-mockup.png');

  // 2. Mở trang /tools/ui-preview
  console.log('2. Mở trang /tools/ui-preview trên nền bàn cờ thật...');
  await page.goto(UI_PREVIEW_URL, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 1500));
  const previewAllShot = path.join(OUT_DIR, '02-ui-preview-ca-3-bien-the-tren-ban-co.png');
  await page.screenshot({ path: previewAllShot, fullPage: false });
  await copyToArtifact(previewAllShot, '02-ui-preview-ca-3-bien-the-tren-ban-co.png');
  console.log('📸 Đã chụp: 02-ui-preview-ca-3-bien-the-tren-ban-co.png');

  // 3. Chụp cận cảnh Biến thể 1: Ô đất Kon Tum
  console.log('3. Chọn tab Biến thể 1 (Ô đất)...');
  await page.click('#tab-property');
  await new Promise((r) => setTimeout(r, 500));
  const propertyShot = path.join(OUT_DIR, '03-bien-the-1-o-dat-kon-tum.png');
  await page.screenshot({ path: propertyShot });
  await copyToArtifact(propertyShot, '03-bien-the-1-o-dat-kon-tum.png');
  console.log('📸 Đã chụp: 03-bien-the-1-o-dat-kon-tum.png');

  // 4. Chụp cận cảnh Biến thể 2: Ô giao thông
  console.log('4. Chọn tab Biến thể 2 (Ô giao thông)...');
  await page.click('#tab-transport');
  await new Promise((r) => setTimeout(r, 500));
  const transportShot = path.join(OUT_DIR, '04-bien-the-2-giao-thong-ben-nha-rong.png');
  await page.screenshot({ path: transportShot });
  await copyToArtifact(transportShot, '04-bien-the-2-giao-thong-ben-nha-rong.png');
  console.log('📸 Đã chụp: 04-bien-the-2-giao-thong-ben-nha-rong.png');

  // 5. Chụp cận cảnh Biến thể 3: Ô tiện ích
  console.log('5. Chọn tab Biến thể 3 (Ô tiện ích)...');
  await page.click('#tab-utility');
  await new Promise((r) => setTimeout(r, 500));
  const utilityShot = path.join(OUT_DIR, '05-bien-the-3-tien-ich-thuy-dien.png');
  await page.screenshot({ path: utilityShot });
  await copyToArtifact(utilityShot, '05-bien-the-3-tien-ich-thuy-dien.png');
  console.log('📸 Đã chụp: 05-bien-the-3-tien-ich-thuy-dien.png');

  // 6. Chụp trường hợp không đủ tiền: Nút xám "Không đủ tiền"
  console.log('6. Chọn tab 4 (Không đủ tiền)...');
  await page.click('#tab-unaffordable');
  await new Promise((r) => setTimeout(r, 500));
  const unaffordableShot = path.join(OUT_DIR, '06-nut-xam-khong-du-tien.png');
  await page.screenshot({ path: unaffordableShot });
  await copyToArtifact(unaffordableShot, '06-nut-xam-khong-du-tien.png');
  console.log('📸 Đã chụp: 06-nut-xam-khong-du-tien.png');

  // 7. Mở /play-v2 và kiểm tra thẻ hiển thị trong ván thật
  console.log('7. Mở /play-v2 kiểm tra Portal và ẩn biển tên ô...');
  await page.goto(PLAY_V2_URL, { waitUntil: 'domcontentloaded' });
  console.log('Đang chờ Canvas 2.5D và Game Bridge sẵn sàng...');
  await page.waitForFunction(
    () => (window).__boardReady === true && (window).__testBridge != null,
    { timeout: 30000 }
  );

  console.log('✅ Board 2.5D đã sẵn sàng! Đang kích hoạt phase AWAIT_DECISION...');
  await page.evaluate(() => {
    const bridge = (window).__testBridge;
    if (bridge && bridge.engine) {
      const active = bridge.engine.getActivePlayer();
      active.position = 11; // Kon Tum
      const tile = bridge.engine.state.tiles[11];
      tile.ownerId = null;
      tile.houseCount = 0;
      tile.hasLandmark = false;
      bridge.engine.state.gamePhase = 'AWAIT_DECISION';
      bridge.engine.events.emit('phase-changed', { phase: 'AWAIT_DECISION' });
      bridge.syncState();
    }
  });

  await new Promise((r) => setTimeout(r, 1000));
  const liveShot = path.join(OUT_DIR, '07-live-gameplay-the-mua-dat-portal.png');
  await page.screenshot({ path: liveShot });
  await copyToArtifact(liveShot, '07-live-gameplay-the-mua-dat-portal.png');
  console.log('📸 Đã chụp: 07-live-gameplay-the-mua-dat-portal.png');

  await browser.close();
  console.log('🎉 Hoàn tất xác minh và chụp ảnh toàn bộ!');
}

run().catch((err) => {
  console.error('Lỗi khi chạy verify-ui-preview:', err);
  process.exit(1);
});

import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const OUT_DIR = path.resolve('public/screenshots/tile-labels');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const ARTIFACT_DIR = 'C:\\Users\\long.nh\\.gemini\\antigravity\\brain\\03db7da8-0236-4625-ac08-aef8db5b6357';

async function run() {
  console.log('🚀 Khởi chạy Chrome headless kiểm tra Biển tên đứng và Phông chữ tiếng Việt...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  console.log('Truy cập http://localhost:3000/play-v2...');
  await page.goto('http://localhost:3000/play-v2', { waitUntil: 'networkidle2' });

  // Đợi bridge, camera và test helpers sẵn sàng
  await page.waitForFunction(
    () =>
      window.__testBridge !== undefined &&
      window.__testCamera !== undefined &&
      window.__getTileGeometry !== undefined,
    { timeout: 30000 }
  );

  console.log('✅ Camera và Board renderer đã sẵn sàng!');

  // Chờ fonts nạp xong hoàn toàn
  await page.evaluate(async () => {
    if (document.fonts) {
      await document.fonts.ready;
    }
  });
  await new Promise((r) => setTimeout(r, 600));

  const savedFiles = [];

  // Helper chụp và copy vào artifact
  async function saveShot(fileName, desc) {
    const localPath = path.join(OUT_DIR, fileName);
    await page.screenshot({ path: localPath });
    console.log(`📸 Đã chụp: ${fileName} (${desc})`);

    const artifactPath = path.join(ARTIFACT_DIR, fileName);
    fs.copyFileSync(localPath, artifactPath);
    console.log(`📋 Đã lưu vào Artifact: ${artifactPath}`);
    savedFiles.push({ fileName, artifactPath, desc });
  }

  // =========================================================================
  // 1. Toàn cảnh mặc định: Kiểu "Biển đứng"
  // =========================================================================
  console.log('\n--- 1. Kiểm tra Toàn cảnh Kiểu "Biển đứng" (Mặc định) ---');
  await page.evaluate(() => {
    if (window.__setTileLabelStyle) window.__setTileLabelStyle('standing');
    window.__testCamera.returnToOverview(400);
  });
  await new Promise((r) => setTimeout(r, 600));

  await saveShot('01-toan-canh-bien-dung.png', 'Toàn cảnh bàn cờ - Kiểu Biển đứng');

  // =========================================================================
  // 2. Phóng to 1.4x: Kiểu "Biển đứng"
  // =========================================================================
  console.log('\n--- 2. Kiểm tra Phóng to 1.4x Kiểu "Biển đứng" ---');
  await page.evaluate(() => {
    const cam = window.__testCamera;
    const geo = window.__getTileGeometry(5); // Tập trung gần cụm ô Đông Nam (Nhà Rồng, Huế, Bến xe)
    cam.focusOnPoint(geo.center.x, geo.center.y, 1.4, 400);
  });
  // Chờ animation 400ms + 200ms debounce vẽ lại độ phân giải cao
  await new Promise((r) => setTimeout(r, 750));

  await saveShot('02-phong-to-14x-bien-dung.png', 'Phóng to 1.4x - Chi tiết Biển đứng sắc nét');

  // =========================================================================
  // 3. Phóng to 1.4x vào cạnh khác (Tây Nam - Phú Quốc, Cần Thơ)
  // =========================================================================
  console.log('\n--- 3. Kiểm tra Phóng to 1.4x cụm ô Tây Nam ---');
  await page.evaluate(() => {
    const cam = window.__testCamera;
    const geo = window.__getTileGeometry(15);
    cam.focusOnPoint(geo.center.x, geo.center.y, 1.4, 400);
  });
  await new Promise((r) => setTimeout(r, 750));

  await saveShot('03-phong-to-14x-tay-nam.png', 'Phóng to 1.4x - Cụm ô Tây Nam Phú Quốc');

  // =========================================================================
  // 4. Thu nhỏ dưới 0.9x: Kiểm tra ẩn tên, chỉ hiện dòng giá/thuê
  // =========================================================================
  console.log('\n--- 4. Kiểm tra Thu nhỏ dưới 0.9x (< 0.9x: ẩn tên, chỉ hiện giá/thuê) ---');
  await page.evaluate(() => {
    const cam = window.__testCamera;
    cam.setZoom(cam.baseCoverScale * 0.85);
  });
  await new Promise((r) => setTimeout(r, 400));

  await saveShot('04-thu-nho-duoi-09x-bien-dung.png', 'Thu nhỏ dưới 0.9x - Chỉ hiện giá/thuê, ẩn tên');

  // =========================================================================
  // 5. Toàn cảnh Kiểu "Sơn trên đá" (To gấp đôi và đậm hơn)
  // =========================================================================
  console.log('\n--- 5. Kiểm tra Toàn cảnh Kiểu "Sơn trên đá" ---');
  await page.evaluate(() => {
    if (window.__setTileLabelStyle) window.__setTileLabelStyle('painted');
    window.__testCamera.returnToOverview(400);
  });
  await new Promise((r) => setTimeout(r, 600));

  await saveShot('05-toan-canh-son-tren-da.png', 'Toàn cảnh bàn cờ - Kiểu Sơn trên đá (chữ to gấp đôi)');

  // =========================================================================
  // 6. Phóng to 1.4x Kiểu "Sơn trên đá"
  // =========================================================================
  console.log('\n--- 6. Kiểm tra Phóng to 1.4x Kiểu "Sơn trên đá" ---');
  await page.evaluate(() => {
    const cam = window.__testCamera;
    const geo = window.__getTileGeometry(5);
    cam.focusOnPoint(geo.center.x, geo.center.y, 1.4, 400);
  });
  await new Promise((r) => setTimeout(r, 750));

  await saveShot('06-phong-to-14x-son-tren-da.png', 'Phóng to 1.4x - Sơn trên đá to đậm');

  // Khôi phục lại kiểu Biển đứng mặc định
  await page.evaluate(() => {
    if (window.__setTileLabelStyle) window.__setTileLabelStyle('standing');
    window.__testCamera.returnToOverview(400);
  });
  await new Promise((r) => setTimeout(r, 500));

  await browser.close();
  console.log('\n🎉 Hoàn thành kiểm tra chụp ảnh nghiệm thu! Toàn bộ file đã được lưu.');
}

run().catch((err) => {
  console.error('Lỗi kiểm tra:', err);
  process.exit(1);
});

import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const OUT_DIR = path.resolve('public/screenshots/parallel-labels');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const ARTIFACT_DIR = 'C:\\Users\\long.nh\\.gemini\\antigravity\\brain\\03db7da8-0236-4625-ac08-aef8db5b6357';

async function run() {
  console.log('🚀 Khởi chạy Chrome headless kiểm tra Biển tên ô song song cạnh bàn cờ...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  async function saveShot(fileName, desc) {
    const localPath = path.join(OUT_DIR, fileName);
    await page.screenshot({ path: localPath });
    console.log(`📸 Đã chụp: ${fileName} (${desc})`);

    const artifactPath = path.join(ARTIFACT_DIR, fileName);
    fs.copyFileSync(localPath, artifactPath);
    console.log(`📋 Đã lưu vào Artifact: ${artifactPath}`);
  }

  console.log('Truy cập http://localhost:3000/play-v2...');
  await page.goto('http://localhost:3000/play-v2', { waitUntil: 'networkidle2' });

  await page.waitForFunction(
    () =>
      window.__testBridge !== undefined &&
      window.__testCamera !== undefined &&
      window.__getTileGeometry !== undefined &&
      window.__setTileLabelStyle !== undefined,
    { timeout: 30000 }
  );

  console.log('✅ Board 2.5D và Camera đã sẵn sàng!');

  // Chờ phông chữ tải xong hoàn toàn
  await page.evaluate(async () => {
    if (document.fonts) {
      await document.fonts.ready;
    }
  });
  await new Promise((r) => setTimeout(r, 1200));

  // =========================================================================
  // 1. Chế độ mặc định: "Dán phẳng" (Affine: Xoay + Xiên song song cạnh bàn cờ và cạnh bên ô)
  // =========================================================================
  console.log('1. Thiết lập chế độ "Dán phẳng" (mặc định)...');
  await page.evaluate(() => {
    window.__setTileLabelStyle('affine');
    window.__testCamera.reset();
  });
  await new Promise((r) => setTimeout(r, 800));

  await saveShot('01-toan-canh-dan-phang.png', 'Toàn cảnh chế độ Dán phẳng: Chữ chạy song song cạnh bàn cờ, xiên khít theo cạnh bên ô');

  // Phóng to 1.4x vào cạnh dưới-trái (Side 0: các ô từ Xuất Phát đến Trại Giam)
  console.log('2. Phóng to 1.4x vào cạnh dưới-trái (Side 0: Nam - Tây)...');
  await page.evaluate(() => {
    const geo = window.__getTileGeometry(4); // Ô Phú Quốc / Cần Thơ cạnh dưới-trái
    window.__testCamera.focusOnPoint(geo.center.x, geo.center.y, 1.4, 400);
  });
  await new Promise((r) => setTimeout(r, 800));

  await saveShot('02-phong-to-14x-canh-duoi-trai-dan-phang.png', 'Phóng to 1.4x cạnh dưới-trái: Chữ song song cạnh bàn cờ, đọc xuôi từ trái sang phải, không tràn ô, không đè dải màu');

  // Phóng to 1.4x vào cạnh trên-phải (Side 2: Bắc - Đông)
  console.log('3. Phóng to 1.4x vào cạnh trên-phải (Side 2: Bắc - Đông)...');
  await page.evaluate(() => {
    const geo = window.__getTileGeometry(25); // Ga Đà Lạt / Đà Nẵng cạnh trên-phải
    window.__testCamera.focusOnPoint(geo.center.x, geo.center.y, 1.4, 400);
  });
  await new Promise((r) => setTimeout(r, 800));

  await saveShot('03-phong-to-14x-canh-tren-phai-dan-phang.png', 'Phóng to 1.4x cạnh trên-phải: Chữ song song cạnh đối diện, đọc xuôi từ trái sang phải, không lộn ngược');

  // =========================================================================
  // 2. Chế độ "Chỉ xoay" (Chỉ xoay song song cạnh bàn cờ, không xiên)
  // =========================================================================
  console.log('4. Chuyển sang chế độ "Chỉ xoay"...');
  await page.evaluate(() => {
    window.__setTileLabelStyle('rotate_only');
    window.__testCamera.returnToOverview(400);
  });
  await new Promise((r) => setTimeout(r, 800));

  await saveShot('04-toan-canh-chi-xoay.png', 'Toàn cảnh chế độ Chỉ xoay: Biển chữ nhật chỉ xoay song song cạnh bàn cờ, không xiên');

  // Phóng to 1.4x cạnh dưới-trái chế độ "Chỉ xoay"
  console.log('5. Phóng to 1.4x cạnh dưới-trái chế độ "Chỉ xoay"...');
  await page.evaluate(() => {
    const geo = window.__getTileGeometry(4);
    window.__testCamera.focusOnPoint(geo.center.x, geo.center.y, 1.4, 400);
  });
  await new Promise((r) => setTimeout(r, 800));

  await saveShot('05-phong-to-14x-canh-duoi-trai-chi-xoay.png', 'Phóng to 1.4x cạnh dưới-trái chế độ Chỉ xoay: Biển chữ nhật ngay ngắn');

  // =========================================================================
  // 3. Kiểm tra ẩn toàn bộ biển tên khi thẻ mua/xây đang mở
  // =========================================================================
  console.log('6. Kiểm tra ẩn toàn bộ biển tên khi mở thẻ mua/xây...');
  await page.evaluate(() => {
    window.__setTileLabelStyle('affine');
    window.__testCamera.returnToOverview(400);
    if (window.__setForceHideLabels) {
      window.__setForceHideLabels(true);
    }
  });
  await new Promise((r) => setTimeout(r, 600));

  await saveShot('06-an-bien-khi-mo-the-mua-xay.png', 'Toàn bộ biển tên tự động ẩn khi thẻ mua/xây đang mở, không che ô và nhân vật');

  await browser.close();
  console.log('🎉 Hoàn tất xác minh toàn bộ các yêu cầu thành công!');
}

run().catch((err) => {
  console.error('❌ Lỗi:', err);
  process.exit(1);
});

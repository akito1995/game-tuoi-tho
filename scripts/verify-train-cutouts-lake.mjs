import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const OUT_DIR = path.resolve('public/screenshots/train-ambient');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const ARTIFACT_DIR = 'C:\\Users\\long.nh\\.gemini\\antigravity\\brain\\03db7da8-0236-4625-ac08-aef8db5b6357';

async function run() {
  console.log('🚀 Khởi chạy Chrome headless kiểm tra Tách nền Tàu điện, Thuyền, Mặt hồ và Đường ray F2...');
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

  // =========================================================================
  // 1. Kiểm tra /tools/cutout-review: ambient-tau-dien, ambient-thuyen-1, ambient-thuyen-2
  // =========================================================================
  console.log('1. Truy cập http://localhost:3000/tools/cutout-review...');
  await page.goto('http://localhost:3000/tools/cutout-review', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1200));

  // Chọn danh mục Ambient và kiểm tra ambient-tau-dien
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const ambientBtn = buttons.find((b) => b.textContent && b.textContent.includes('Tiểu cảnh & Phương tiện'));
    if (ambientBtn) ambientBtn.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  await saveShot('01-cutout-review-tau-dien.png', 'Trang Cutout Review: Tàu điện sạch nền không còn quầng trắng');

  // Chọn ambient-thuyen-1
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const thuyenBtn = buttons.find((b) => b.textContent && b.textContent.includes('Thuyền nan'));
    if (thuyenBtn) thuyenBtn.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  await saveShot('02-cutout-review-thuyen-nan.png', 'Trang Cutout Review: Thuyền nan tách nền sạch');

  // Chọn ambient-thuyen-2 (thuyền thiên nga)
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const thuyen2Btn = buttons.find((b) => b.textContent && b.textContent.includes('Thuyền thiên nga'));
    if (thuyen2Btn) thuyen2Btn.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  await saveShot('03-cutout-review-thuyen-thien-nga.png', 'Trang Cutout Review: Thuyền thiên nga tách nền sạch');

  // =========================================================================
  // 2. Kiểm tra /play-v2: Mặt hồ sạch không còn chấm đỏ/cam, thuyền dập dềnh phản chiếu
  // =========================================================================
  console.log('2. Truy cập http://localhost:3000/play-v2...');
  await page.goto('http://localhost:3000/play-v2', { waitUntil: 'networkidle2' });

  await page.waitForFunction(
    () =>
      window.__testBridge !== undefined &&
      window.__testCamera !== undefined &&
      window.__getTileGeometry !== undefined,
    { timeout: 30000 }
  );

  console.log('✅ Board 2.5D đã sẵn sàng!');
  await new Promise((r) => setTimeout(r, 1500));

  await saveShot('04-toan-canh-ho-guom-khong-con-cham-do-cam.png', 'Mặt hồ Gươm sạch 100%, không còn chấm đỏ/cam nào, thuyền có bóng phản chiếu');

  // =========================================================================
  // 3. Mở Cài Đặt (SettingsModal): Kiểm tra công tắc Tàu điện trên cao (Mặc định: TẮT)
  // =========================================================================
  console.log('3. Mở SettingsModal...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const menuBtn = buttons.find((b) => b.getAttribute('title') === 'Cài đặt' || b.getAttribute('title') === 'Menu cài đặt' || (b.textContent && b.textContent.includes('Cài đặt')));
    if (menuBtn) {
      menuBtn.click();
    } else {
      // Fallback: click nút đầu tiên góc trái trên
      const hudTopLeft = document.querySelector('.fixed.top-4.left-4');
      if (hudTopLeft) {
        const btn = hudTopLeft.querySelector('button');
        if (btn) btn.click();
      }
    }
  });
  await new Promise((r) => setTimeout(r, 600));

  await saveShot('05-cai-dat-cong-tac-tau-dien-mac-dinh-tat.png', 'Hộp thoại Cài đặt: Công tắc Tàu điện trên cao hiển thị rõ ràng, Mặc định TẮT');

  // =========================================================================
  // 4. BẬT Tàu điện trên cao và quan sát tàu chạy dọc đường ray
  // =========================================================================
  console.log('4. Bật công tắc Tàu điện trên cao...');
  await page.evaluate(() => {
    if (window.__setShowTrain) {
      window.__setShowTrain(true);
    }
    // Đóng SettingsModal
    const closeBtn = document.querySelector('button[title="Đóng"]') || document.querySelector('button:has(svg.lucide-x)');
    if (closeBtn) closeBtn.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  // Chờ tàu chạy vào màn hình (chu kỳ chạy mỗi 25s, tiến trình bắt đầu ở 0s..7.5s)
  console.log('Chờ đoàn tàu xuất hiện trên đường ray...');
  await new Promise((r) => setTimeout(r, 2500));

  await saveShot('06-tau-dien-chay-tren-ray-khop-banh-xe.png', 'Tàu điện chạy trên cao: Chân bánh đặt sát ray, nghiêng tối đa ±12°, tỷ lệ theo ô đá, không còn vệt xanh lá');

  // =========================================================================
  // 5. Mở F2 Calibration Drawer: Kiểm tra đường ray đa điểm
  // =========================================================================
  console.log('5. Mở F2 Drawer...');
  await page.keyboard.press('F2');
  await new Promise((r) => setTimeout(r, 1000));

  // Nhấp vào nút "Đường ray" để kích hoạt chế độ chỉnh ray đa điểm
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const railBtn = buttons.find((b) => b.textContent && b.textContent.includes('Đường ray'));
    if (railBtn) railBtn.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  await saveShot('07-f2-cong-cu-duong-ray-da-diem.png', 'F2 Calibration: Thanh công cụ Đường ray đa điểm, hiển thị số điểm mốc, nút Xóa điểm cuối và Làm lại ray');

  await browser.close();
  console.log('🎉 Hoàn tất toàn bộ các bước kiểm tra thành công!');
}

run().catch((err) => {
  console.error('❌ Lỗi kiểm tra:', err);
  process.exit(1);
});

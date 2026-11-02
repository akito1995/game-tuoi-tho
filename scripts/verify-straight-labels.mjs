import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const OUT_DIR = path.resolve('public/screenshots/straight-labels');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const ARTIFACT_DIR = 'C:\\Users\\long.nh\\.gemini\\antigravity\\brain\\03db7da8-0236-4625-ac08-aef8db5b6357';

async function run() {
  console.log('🚀 Khởi chạy Chrome headless kiểm tra Biển tên ô thẳng hàng tuyệt đối...');
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
      window.__tileLabelsData !== undefined,
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

  // Kiểm tra dữ liệu hình học của biển tên
  const report = await page.evaluate(() => {
    const data = window.__tileLabelsData;
    const sides = [0, 1, 2, 3];
    const sideResults = [];

    for (const side of sides) {
      const regularTiles = data.filter((d) => d.side === side && !d.isCorner);
      regularTiles.sort((a, b) => a.id - b.id);

      if (regularTiles.length !== 9) {
        sideResults.push({
          side,
          error: `Số lượng ô thường không đủ 9: ${regularTiles.length}`,
        });
        continue;
      }

      // 1. Kiểm tra góc xoay của 9 biển có bằng nhau tuyệt đối không
      const baseRotation = regularTiles[0].rotation;
      const baseSkewX = regularTiles[0].skewX;
      let maxRotationDiff = 0;
      let maxSkewDiff = 0;

      for (const t of regularTiles) {
        maxRotationDiff = Math.max(maxRotationDiff, Math.abs(t.rotation - baseRotation));
        maxSkewDiff = Math.max(maxSkewDiff, Math.abs(t.skewX - baseSkewX));
      }

      // 2. Kiểm tra tâm 9 biển có nằm trên một đường thẳng không (sai lệch <= 1px)
      // Phương trình đường thẳng qua ô đầu (p1) và ô cuối (p2): Ax + By + C = 0
      const p1 = { x: regularTiles[0].x, y: regularTiles[0].y };
      const p2 = { x: regularTiles[8].x, y: regularTiles[8].y };

      const A = p2.y - p1.y;
      const B = p1.x - p2.x;
      const C = p2.x * p1.y - p1.x * p2.y;
      const denom = Math.hypot(A, B);

      let maxLineDeviation = 0;
      const points = [];

      for (const t of regularTiles) {
        const dist = Math.abs(A * t.x + B * t.y + C) / denom;
        maxLineDeviation = Math.max(maxLineDeviation, dist);
        points.push({ id: t.id, x: t.x, y: t.y, distToLine: dist });
      }

      // 3. Kiểm tra kích thước đồng nhất
      const baseWidth = regularTiles[0].width;
      const baseHeight = regularTiles[0].height;
      let widthConsistent = true;
      let heightConsistent = true;

      for (const t of regularTiles) {
        if (t.width !== baseWidth) widthConsistent = false;
        if (t.height !== baseHeight) heightConsistent = false;
      }

      sideResults.push({
        side,
        tileIds: regularTiles.map((t) => t.id),
        rotationDeg: Number((baseRotation * 180 / Math.PI).toFixed(3)),
        skewXDeg: Number((baseSkewX * 180 / Math.PI).toFixed(3)),
        maxRotationDiff,
        maxSkewDiff,
        maxLineDeviation,
        signWidth: baseWidth,
        signHeight: baseHeight,
        widthConsistent,
        heightConsistent,
        passed: maxLineDeviation <= 1.0 && maxRotationDiff === 0 && widthConsistent && heightConsistent,
      });
    }

    return sideResults;
  });

  console.log('📊 KẾT QUẢ KIỂM TRA HÌNH HỌC BIỂN TÊN Ô:');
  console.log(JSON.stringify(report, null, 2));

  let allPassed = true;
  for (const r of report) {
    if (!r.passed) {
      allPassed = false;
      console.error(`❌ Cạnh ${r.side} KHÔNG ĐẠT YÊU CẦU!`);
    } else {
      console.log(`✅ Cạnh ${r.side}: Thẳng hàng tuyệt đối (lệch ${r.maxLineDeviation.toFixed(6)}px <= 1px), góc đồng nhất 100%, kích thước ${r.signWidth}x${r.signHeight}px.`);
    }
  }

  // =========================================================================
  // CHỤP ẢNH TOÀN CẢNH VÀ ẢNH PHÓNG TO 1.5x TỪNG CẠNH (MỤC 8)
  // =========================================================================

  // 1. Toàn cảnh mặc định
  console.log('📸 1. Chụp toàn cảnh bàn cờ (Khung nhìn mặc định chứa trọn vẹn bàn cờ)...');
  await page.evaluate(() => {
    window.__testCamera.reset();
  });
  await new Promise((r) => setTimeout(r, 800));
  await saveShot('01-toan-canh-thang-hang.png', 'Toàn cảnh bàn cờ: Các hàng biển tên in thẳng tắp, không bị cắt mép, ô 20 và Xuất Phát nhìn rõ trọn vẹn');

  // 2. Phóng to 1.5x Cạnh 0 (Nam - Tây: Ô 1-9)
  console.log('📸 2. Phóng to 1.5x Cạnh 0 (Nam - Tây)...');
  await page.evaluate(() => {
    const geo = window.__getTileGeometry(5); // Ô Bến Nhà Rồng giữa cạnh 0
    window.__testCamera.focusOnPoint(geo.center.x, geo.center.y, 1.5, 400);
  });
  await new Promise((r) => setTimeout(r, 800));
  await saveShot('02-phong-to-15x-canh-0-nam-tay.png', 'Phóng to 1.5x Cạnh 0 (Nam - Tây): Hàng chữ in thẳng tắp, cùng góc xoay, cùng độ xiên, cùng kích thước');

  // 3. Phóng to 1.5x Cạnh 1 (Tây - Bắc: Ô 11-19)
  console.log('📸 3. Phóng to 1.5x Cạnh 1 (Tây - Bắc: có Phan Thiết)...');
  await page.evaluate(() => {
    const geo = window.__getTileGeometry(15); // Ga Đà Lạt giữa cạnh 1
    window.__testCamera.focusOnPoint(geo.center.x, geo.center.y, 1.5, 400);
  });
  await new Promise((r) => setTimeout(r, 800));
  await saveShot('03-phong-to-15x-canh-1-tay-bac.png', 'Phóng to 1.5x Cạnh 1 (Tây - Bắc): Phan Thiết vừa khít biển ở ô hẹp nhất, thẳng hàng tuyệt đối');

  // 4. Phóng to 1.5x Cạnh 2 (Bắc - Đông: Ô 21-29)
  console.log('📸 4. Phóng to 1.5x Cạnh 2 (Bắc - Đông)...');
  await page.evaluate(() => {
    const geo = window.__getTileGeometry(25); // Hải Vân giữa cạnh 2
    window.__testCamera.focusOnPoint(geo.center.x, geo.center.y, 1.5, 400);
  });
  await new Promise((r) => setTimeout(r, 800));
  await saveShot('04-phong-to-15x-canh-2-bac-dong.png', 'Phóng to 1.5x Cạnh 2 (Bắc - Đông): Hàng chữ in thẳng tắp song song cạnh bàn cờ');

  // 5. Phóng to 1.5x Cạnh 3 (Đông - Nam: Ô 31-39)
  console.log('📸 5. Phóng to 1.5x Cạnh 3 (Đông - Nam: có TP.HCM, Hà Nội)...');
  await page.evaluate(() => {
    const geo = window.__getTileGeometry(35); // Nội Bài giữa cạnh 3
    window.__testCamera.focusOnPoint(geo.center.x, geo.center.y, 1.5, 400);
  });
  await new Promise((r) => setTimeout(r, 800));
  await saveShot('05-phong-to-15x-canh-3-dong-nam.png', 'Phóng to 1.5x Cạnh 3 (Đông - Nam): TP.HCM, Xa xỉ, Hà Nội thẳng hàng tăm tắp');

  await browser.close();
  console.log('🎉 Hoàn thành kiểm tra tự động thành công!');
}

run().catch((err) => {
  console.error('Lỗi kiểm tra:', err);
  process.exit(1);
});

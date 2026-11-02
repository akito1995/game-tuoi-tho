import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\long.nh\\.gemini\\antigravity\\brain\\03db7da8-0236-4625-ac08-aef8db5b6357';

async function verifyBoats() {
  console.log('Launching Chrome via puppeteer-core...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 960 });

  // 1. Visit /tools/cutout-review to audit the ambient boat assets
  console.log('Navigating to http://localhost:3000/tools/cutout-review...');
  await page.goto('http://localhost:3000/tools/cutout-review', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));

  // Switch category to ambient (Thuyền Hồ Nước)
  const clicked = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent && b.textContent.includes('Thuyền Hồ Nước'));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  console.log('Clicked Thuyền Hồ Nước tab:', clicked);
  await new Promise(r => setTimeout(r, 1000));

  const cutoutReviewPath = path.join(ARTIFACT_DIR, '01-thuyen-cutout-review.png');
  await page.screenshot({ path: cutoutReviewPath });
  console.log(`Saved screenshot: ${cutoutReviewPath}`);

  // 2. Visit /play-v2 to verify boats floating on lake
  console.log('Navigating to http://localhost:3000/play-v2...');
  await page.goto('http://localhost:3000/play-v2', { waitUntil: 'networkidle2' });

  // Wait for bridge and canvas to be ready
  await page.waitForFunction(
    () => window.__testBridge !== undefined && window.__testCamera !== undefined,
    { timeout: 30000 }
  );

  // Remove loading overlay if still present
  await page.evaluate(() => {
    const splash = document.querySelector('div.fixed.inset-0.z-50');
    if (splash) splash.remove();
  });

  await new Promise(r => setTimeout(r, 2000));

  // Capture full board overview showing both boats on lake
  const boardOverviewPath = path.join(ARTIFACT_DIR, '02-thuyen-noi-ho-toan-canh.png');
  await page.screenshot({ path: boardOverviewPath });
  console.log(`Saved screenshot: ${boardOverviewPath}`);

  // Wait 1.5s to capture bobbing and wake ripple expansion
  await new Promise(r => setTimeout(r, 1500));
  const boardT2Path = path.join(ARTIFACT_DIR, '03-thuyen-noi-ho-bap-benh.png');
  await page.screenshot({ path: boardT2Path });
  console.log(`Saved screenshot: ${boardT2Path}`);

  // Zoom in on lake center showing Boat 1 and Boat 2
  await page.evaluate(() => {
    if (window.__testCamera) {
      // Zoom into lake center (0, 40)
      window.__testCamera.focusOnPoint(80, 50, 2.4, 0);
    }
  });
  await new Promise(r => setTimeout(r, 1200));
  const lakeZoomPath = path.join(ARTIFACT_DIR, '04-thuyen-phong-to-2x.png');
  await page.screenshot({ path: lakeZoomPath });
  console.log(`Saved screenshot: ${lakeZoomPath}`);

  await browser.close();
  console.log('Browser audit completed successfully!');
}

verifyBoats().catch(err => {
  console.error('Error during browser verification:', err);
  process.exit(1);
});

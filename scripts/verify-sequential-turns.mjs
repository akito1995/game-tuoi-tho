import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/long.nh/.gemini/antigravity/brain/03db7da8-0236-4625-ac08-aef8db5b6357';
const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

async function main() {
  console.log('--- KHỞI ĐỘNG KIỂM TRA ĐIỀU KHIỂN LƯỢT TUẦN TỰ & GIAO DIỆN KHUNG NHÌN ---');

  if (!fs.existsSync(ARTIFACT_DIR)) {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: CHROME_PATH,
    args: ['--window-size=1600,900', '--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1600, height: 900 },
  });

  const page = await browser.newPage();

  const consoleLogs = [];
  page.on('console', (msg) => {
    const text = msg.text();
    consoleLogs.push(text);
    if (text.includes('[INVARIANT_VIOLATION]') || text.includes('MUTEX_VIOLATION')) {
      console.error('CONSOLE INVARIANT ERROR:', text);
    }
  });

  page.on('pageerror', (err) => {
    console.error('PAGE ERROR:', err.message);
  });

  console.log('Đang truy cập http://localhost:3000/play-v2 ...');
  await page.goto('http://localhost:3000/play-v2', { waitUntil: 'networkidle0', timeout: 30000 });

  // Đợi bridge, canvas và font sẵn sàng
  await page.waitForFunction(
    () =>
      (window).__testBridge !== undefined &&
      (window).__charManager !== undefined &&
      (window).__testCamera !== undefined,
    { timeout: 20000 }
  );

  await page.evaluate(() => new Promise((r) => setTimeout(r, 1200)));

  console.log('Canvas 2.5D và Bridge đã sẵn sàng.');

  // Ảnh 1: Toàn cảnh mặc định - Kiểm tra (a) Ô 20, Phú Yên, Hội An dưới thanh lượt; (b) Biển góc; (c) Ví & Nhật ký góc trái
  const shot1Path = path.join(ARTIFACT_DIR, '01-toan-canh-chua-du-cho-duoi-thanh-luot.png');
  await page.screenshot({ path: shot1Path, fullPage: false });
  console.log(`Đã lưu ảnh 1: ${shot1Path}`);

  // Thông tin giao diện ban đầu
  const initialInfo = await page.evaluate(() => {
    const w = window;
    const scoreboard = document.querySelector('.fixed.top-4') || document.querySelector('[class*="TopScoreboard"]');
    const scoreRect = scoreboard ? scoreboard.getBoundingClientRect() : { bottom: 60 };
    return {
      scoreboardBottom: scoreRect.bottom,
      activePlayer: w.__testBridge.engine.getActivePlayer().name,
      isTurnExecuting: w.__testBridge.isTurnExecuting,
    };
  });
  console.log('Khung nhìn ban đầu:', initialInfo);

  // Người chơi thật (Bé Tí) thực hiện lượt đi: Đổ xúc xắc
  console.log('--- BẮT ĐẦU VÒNG 1: LƯỢT NGƯỜI CHƠI THẬT (Bé Tí) ---');
  await page.evaluate(() => {
    const bridge = (window).__testBridge;
    bridge.rollDice();
  });

  // Chờ người thật hoàn tất di chuyển
  await page.evaluate(() => new Promise((r) => setTimeout(r, 3000)));

  // Nếu người thật dừng ở ô AWAIT_DECISION, xác nhận mua
  await page.evaluate(() => {
    const bridge = (window).__testBridge;
    if (bridge.engine.state.gamePhase === 'AWAIT_DECISION') {
      bridge.buyProperty();
    }
  });

  console.log('Đã kích hoạt kết thúc lượt người thật. Theo dõi chuỗi 3 lượt bot tiếp theo...');

  // Theo dõi lượt của 3 bot: Cô Hoa -> Ông Bảy -> Chị Mây
  const botTurnRecords = [];
  let currentBotName = '';
  let botStartTime = 0;
  let secondCounter = 0;
  const sampledSeconds = [];
  const maxWaitSeconds = 60; // Tối đa 60 giây

  while (secondCounter < maxWaitSeconds) {
    await page.evaluate(() => new Promise((r) => setTimeout(r, 1000)));
    secondCounter++;

    const status = await page.evaluate(() => {
      const w = window;
      const bridge = w.__testBridge;
      const active = bridge.engine.getActivePlayer();
      const movingCount = w.__movingTokensCount || 0;
      const violations = w.__invariantViolations || [];
      const isExecuting = bridge.isTurnExecuting;
      const effectiveActiveName = (bridge.currentTurnBot ? bridge.currentTurnBot.name : active.name).replace(' 🤖', '');
      const logs = bridge.engine.state.eventLogs || [];
      const latestLog = logs.length > 0 ? logs[logs.length - 1] : '';

      return {
        activeId: active.id,
        effectiveActiveName,
        isBot: active.isBot,
        movingCount,
        violationsCount: violations.length,
        isExecuting,
        latestLog,
      };
    });

    sampledSeconds.push({
      sec: secondCounter,
      name: status.effectiveActiveName,
      movingCount: status.movingCount,
      violations: status.violationsCount,
      isExecuting: status.isExecuting,
      latestLog: status.latestLog,
    });

    // Chụp ảnh từng giây
    const padSec = String(secondCounter).padStart(2, '0');
    const shotPath = path.join(ARTIFACT_DIR, `bot-sec-${padSec}.png`);
    await page.screenshot({ path: shotPath, fullPage: false });

    // Đánh dấu thời gian chuyển lượt giữa các bot
    if (status.effectiveActiveName !== currentBotName) {
      if (currentBotName !== '' && currentBotName !== 'Bé Tí' && botStartTime > 0) {
        const durationSec = Number(((Date.now() - botStartTime) / 1000).toFixed(2));
        botTurnRecords.push({
          bot: currentBotName,
          durationSec,
        });
        console.log(`[Giây ${secondCounter}] Lượt của [${currentBotName}] kết thúc (${durationSec}s). Bắt đầu lượt [${status.effectiveActiveName}]`);
      }
      currentBotName = status.effectiveActiveName;
      botStartTime = Date.now();
    }

    // Nếu đã hoàn thành đủ 3 bot và lượt trở lại Bé Tí
    if (botTurnRecords.length >= 3 && status.effectiveActiveName === 'Bé Tí') {
      console.log(`Đã hoàn tất trọn vẹn 3 lượt bot tại giây thứ ${secondCounter}.`);
      break;
    }
  }

  // Kết thúc lượt cuối nếu chưa tính
  if (currentBotName !== '' && currentBotName !== 'Bé Tí' && botStartTime > 0) {
    const durationSec = Number(((Date.now() - botStartTime) / 1000).toFixed(2));
    botTurnRecords.push({
      bot: currentBotName,
      durationSec,
    });
    console.log(`Lượt của [${currentBotName}] kết thúc (${durationSec}s).`);
  }

  // Chụp ảnh kết thúc vòng
  const finalShotPath = path.join(ARTIFACT_DIR, '08-hoan-tat-vong-tro-lai-nguoi-choi-that.png');
  await page.screenshot({ path: finalShotPath, fullPage: false });
  console.log(`Đã lưu ảnh kết thúc vòng: ${finalShotPath}`);

  // Đọc dữ liệu nhật ký ván đấu và bất biến
  const finalReport = await page.evaluate(() => {
    const w = window;
    const bridge = w.__testBridge;
    return {
      eventLogs: bridge.engine.state.eventLogs.slice(-12),
      invariantViolations: w.__invariantViolations || [],
    };
  });

  await browser.close();

  console.log('\n======================================================');
  console.log('KẾT QUẢ KIỂM TRA ĐIỀU KHIỂN LƯỢT TUẦN TỰ (1 VÒNG 4 NGƯỜI)');
  console.log('======================================================');
  const maxMoving = Math.max(...sampledSeconds.map((s) => s.movingCount), 0);
  console.log(`1. Bất biến số lượng nhân vật di chuyển cùng lúc:`);
  console.log(`   - Số nhân vật di chuyển đồng thời tối đa: ${maxMoving} (Yêu cầu: <= 1) -> ${maxMoving <= 1 ? 'ĐẠT ✅' : 'THẤT BẠI ❌'}`);
  console.log(`   - Số vi phạm bất biến: ${finalReport.invariantViolations.length} (Yêu cầu: 0) -> ${finalReport.invariantViolations.length === 0 ? 'ĐẠT ✅' : 'THẤT BẠI ❌'}`);

  console.log(`\n2. Thời gian thực tế của từng lượt bot:`);
  let totalBotTime = 0;
  botTurnRecords.forEach((r, idx) => {
    console.log(`   - Bot ${idx + 1} (${r.bot}): ${r.durationSec} giây`);
    totalBotTime += r.durationSec;
  });
  const avgBotTime = botTurnRecords.length > 0 ? (totalBotTime / botTurnRecords.length).toFixed(2) : '0';
  console.log(`   ==> THỜI GIAN TRUNG BÌNH MỖI LƯỢT BOT: ${avgBotTime} GIÂY`);

  console.log(`\n3. Nhật ký ván đấu (Mỗi bước một dòng theo thứ tự thời gian):`);
  finalReport.eventLogs.forEach((log) => console.log(`   • ${log}`));
  console.log('======================================================\n');
}

main().catch((err) => {
  console.error('Lỗi khi chạy verify-sequential-turns:', err);
  process.exit(1);
});

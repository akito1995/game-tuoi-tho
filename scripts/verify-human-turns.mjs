import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const SCREENSHOTS_DIR = path.resolve('public/screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function run() {
  console.log('Khởi động Chrome browser...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  console.log('Mở trang http://localhost:3000/play-v2...');
  await page.goto('http://localhost:3000/play-v2', { waitUntil: 'networkidle2' });

  // Đợi game canvas và bridge khởi tạo
  await page.waitForFunction(() => window.__testBridge !== undefined, { timeout: 15000 });
  console.log('Game bridge đã sẵn sàng!');

  // Tăng tốc game lên 2x để chạy test nhanh gọn nhưng bot vẫn có nhịp 0.5 - 0.75s
  await page.evaluate(() => {
    window.__testBridge.setSpeed(2);
  });

  const humanTurns = [];
  let turnNumber = 0;

  // Lặp để thực hiện 5 lượt của người chơi Bé Tí
  while (turnNumber < 5) {
    console.log(`\n--- Đang chờ đến lượt của Bé Tí (Lượt ${turnNumber + 1}/5) ---`);

    // Chờ cho đến khi activePlayer là Bé Tí và phase là AWAIT_ROLL hoặc canRollAgain
    await page.waitForFunction(
      () => {
        const bridge = window.__testBridge;
        if (!bridge) return false;
        const snap = bridge.getSnapshot();
        const active = snap.activePlayer;
        return (
          !active.isBot &&
          (snap.gamePhase === 'AWAIT_ROLL' || snap.canRollAgain)
        );
      },
      { timeout: 35000 }
    );

    turnNumber++;
    console.log(`===> [LƯỢT ${turnNumber}] ĐÃ ĐẾN LƯỢT BÉ TÍ!`);

    // KIỂM TRA ĐỘC LẬP: Chờ 2.5 giây xem game có tự đổ xúc xắc không!
    console.log('Chờ 2.5s xác minh hệ thống KHÔNG tự động đổ xúc xắc...');
    await new Promise((r) => setTimeout(r, 2500));

    // Lấy thông tin trạng thái
    const stateBefore = await page.evaluate(() => {
      const bridge = window.__testBridge;
      const snap = bridge.getSnapshot();
      return {
        activeName: snap.activePlayer.name,
        isBot: snap.activePlayer.isBot,
        phase: snap.gamePhase,
        position: snap.activePlayer.position,
        money: snap.activePlayer.money,
        canRollAgain: snap.canRollAgain,
      };
    });

    console.log(`Trạng thái sau 2.5s chờ:`, stateBefore);
    if (stateBefore.phase !== 'AWAIT_ROLL' && !stateBefore.canRollAgain) {
      throw new Error(`THẤT BẠI: Game đã tự động đổ xúc xắc thay vì chờ người chơi! Phase: ${stateBefore.phase}`);
    }
    console.log(`✓ CHỨNG MINH THÀNH CÔNG: Game kiên nhẫn chờ Bé Tí bấm nút, không hề tự động đổ.`);

    // Chụp ảnh màn hình chứng minh nút chờ bấm
    const shotPath = path.join(SCREENSHOTS_DIR, `be-ti-turn-${turnNumber}.png`);
    await page.screenshot({ path: shotPath });
    console.log(`Đã chụp ảnh màn hình lượt ${turnNumber}: ${shotPath}`);

    humanTurns.push({
      turn: turnNumber,
      state: stateBefore,
      screenshot: shotPath,
    });

    // Bấm nút ĐỔ XÚC XẮC hoặc dùng phím Space
    if (turnNumber % 2 === 1) {
      console.log('Thao tác: Bấm phím SPACE để đổ xúc xắc...');
      await page.keyboard.press('Space');
    } else {
      console.log('Thao tác: Click nút ĐỔ XÚC XẮC tròn ở góc phải dưới...');
      // Tìm nút roll button qua aria-label hoặc label
      await page.evaluate(() => {
        const btn = document.querySelector('button[title*="Đổ xúc xắc"], button[title*="Đổ tiếp"]');
        if (btn) btn.click();
      });
    }

    // Chờ xúc xắc lăn và quân cờ di chuyển
    await new Promise((r) => setTimeout(r, 1200));

    // Kiểm tra nếu rơi vào ô AWAIT_DECISION (Mua hoặc nâng cấp đất)
    const decisionCheck = await page.evaluate(() => {
      const bridge = window.__testBridge;
      const snap = bridge.getSnapshot();
      return {
        phase: snap.gamePhase,
        position: snap.activePlayer.position,
        tileName: snap.tiles[snap.activePlayer.position]?.name,
        tileOwner: snap.tiles[snap.activePlayer.position]?.ownerId,
      };
    });

    if (decisionCheck.phase === 'AWAIT_DECISION') {
      console.log(`Bé Tí dừng tại ô [${decisionCheck.tileName}]. Chờ quyết định Mua/Xây...`);
      // Chờ 1.5s chứng minh modal không tự đóng
      await new Promise((r) => setTimeout(r, 1500));

      if (turnNumber === 1 || turnNumber === 3) {
        console.log(`Lượt ${turnNumber}: Quyết định MUA ĐẤT`);
        await page.evaluate(() => {
          window.__testBridge.buyProperty();
        });
      } else {
        console.log(`Lượt ${turnNumber}: Quyết định BỎ QUA`);
        await page.evaluate(() => {
          window.__testBridge.skipBuy();
        });
      }
      await new Promise((r) => setTimeout(r, 800));
    } else if (decisionCheck.phase === 'CARD_DRAWN') {
      console.log('Rút thẻ Cơ Hội / Khí Vận. Đóng thẻ bài...');
      await page.evaluate(() => {
        window.__testBridge.dismissCard();
      });
      await new Promise((r) => setTimeout(r, 800));
    }

    // Chờ các bot đi xong lượt của họ
    console.log('Chờ các đối thủ máy (Cô Hoa, Ông Bảy, Chị Mây) hoàn thành lượt...');
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log('\n======================================================');
  console.log('KẾT QUẢ KIỂM THỬ TỰ ĐỘNG BẰNG TRÌNH DUYỆT THÀNH CÔNG RỰC RỠ:');
  console.log(`- Đã hoàn thành ${humanTurns.length} lượt liên tiếp của Bé Tí.`);
  humanTurns.forEach((t) => {
    console.log(`  + Lượt ${t.turn}: Vị trí ô ${t.state.position}, Tiền: ${t.state.money.toLocaleString()}đ -> Chụp: ${t.screenshot}`);
  });
  console.log('======================================================\n');

  await browser.close();
  return humanTurns;
}

run().catch((err) => {
  console.error('Lỗi kiểm thử:', err);
  process.exit(1);
});

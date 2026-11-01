import asyncio
import io
import sys
import os
from playwright.async_api import async_playwright

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

ARTIFACT_DIR = r"C:\Users\Admin\.gemini\antigravity\brain\03e47441-15e9-47bc-9b15-9ff9ac20003c"

async def run_verification():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        # Desktop viewport: 1440x900
        context = await browser.new_context(viewport={'width': 1440, 'height': 900})
        page = await context.new_page()

        print("Đang mở http://localhost:3000/play-v2...")
        await page.goto("http://localhost:3000/play-v2", wait_until="networkidle")

        # Chờ nạp xong tài nguyên và màn hình loading mờ đi
        await asyncio.sleep(4.0)

        # 1. Chụp ảnh toàn cảnh giao diện mới (Desktop)
        shot_main = os.path.join(ARTIFACT_DIR, "screen_hud_overhaul_main.png")
        await page.screenshot(path=shot_main)
        print(f"1. Đã chụp màn hình chính HUD mới: {shot_main}")

        # Đo FPS trong lúc có hoạt họa (kéo nhẹ camera để kích hoạt render loop)
        fps_data = await page.evaluate("""() => {
            return new Promise((resolve) => {
                let frameCount = 0;
                const canvas = document.querySelector('canvas');
                if (canvas) {
                    canvas.dispatchEvent(new MouseEvent('mousemove', { clientX: 500, clientY: 500 }));
                }
                const start = performance.now();
                function count() {
                    frameCount++;
                    if (performance.now() - start < 1000) {
                        requestAnimationFrame(count);
                    } else {
                        const elapsed = performance.now() - start;
                        const fps = Math.round((frameCount * 1000) / elapsed);
                        resolve(fps);
                    }
                }
                requestAnimationFrame(count);
            });
        }""")
        print(f"FPS khi hoạt họa trên Canvas: {fps_data} FPS")

        # 2. Bấm vào nút Cài đặt (Bánh răng góc phải trên)
        settings_btn = page.locator("button[aria-label='Cài đặt']")
        if await settings_btn.count() > 0:
            await settings_btn.first.click(force=True)
            await asyncio.sleep(0.6)
            shot_settings = os.path.join(ARTIFACT_DIR, "screen_hud_settings_modal.png")
            await page.screenshot(path=shot_settings)
            print(f"2. Đã chụp hộp thoại Cài đặt: {shot_settings}")

            # Từ Cài đặt, bấm "Mở Sảnh Trận Mới"
            open_lobby_btn = page.locator("button:has-text('Mở Sảnh Trận Mới')")
            if await open_lobby_btn.count() > 0:
                await open_lobby_btn.first.click(force=True)
                await asyncio.sleep(0.6)
                shot_lobby = os.path.join(ARTIFACT_DIR, "screen_hud_lobby_modal.png")
                await page.screenshot(path=shot_lobby)
                print(f"3. Đã chụp Màn hình Sảnh Chọn Nhân Vật: {shot_lobby}")

                # Chọn chế độ 2 Người chơi trong Sảnh và bắt đầu
                btn_2p = page.locator("button:has-text('2 Người')")
                if await btn_2p.count() > 0:
                    await btn_2p.first.click(force=True)
                    await asyncio.sleep(0.2)

                btn_start = page.locator("button:has-text('BẮT ĐẦU VÁN ĐẤU')")
                if await btn_start.count() > 0:
                    await btn_start.first.click(force=True)
                    await asyncio.sleep(1.2)
                    shot_2p = os.path.join(ARTIFACT_DIR, "screen_hud_2players_scoreboard.png")
                    await page.screenshot(path=shot_2p)
                    print(f"4. Đã chụp Bảng điểm chế độ 2 người chơi (Khối đỏ | LƯỢT n | Khối xanh): {shot_2p}")

        # 5. Thử nghiệm thẻ mua đất ở giữa dưới (TilePurchaseCard)
        # Giả lập cho người chơi đến ô số 1 (Cà Mau) và chuyển gamePhase thành AWAIT_DECISION
        await page.evaluate("""() => {
            const bridge = window.__testBridge;
            if (bridge) {
                const active = bridge.getActivePlayer ? bridge.getActivePlayer() : bridge.engine.getActivePlayer();
                active.position = 1; // Ô Cà Mau
                bridge.engine.state.gamePhase = 'AWAIT_DECISION';
                bridge.notify();
            }
        }""")
        await asyncio.sleep(0.8)
        shot_tile = os.path.join(ARTIFACT_DIR, "screen_hud_tile_purchase_card.png")
        await page.screenshot(path=shot_tile)
        print(f"5. Đã chụp Thẻ mua đất giữa dưới: {shot_tile}")

        # 6. Bấm nút Đầu hàng (Cờ đỏ góc phải trên) -> Xác nhận
        flag_btn = page.locator("button[aria-label='Đầu hàng']")
        if await flag_btn.count() > 0:
            await flag_btn.first.click(force=True)
            await asyncio.sleep(0.5)

            # Bấm nút ĐẦU HÀNG trong modal xác nhận
            confirm_surrender = page.locator("button:has-text('ĐẦU HÀNG')")
            if await confirm_surrender.count() > 0:
                await confirm_surrender.first.click(force=True)
                await asyncio.sleep(1.2)
                shot_gameover = os.path.join(ARTIFACT_DIR, "screen_hud_gameover_modal.png")
                await page.screenshot(path=shot_gameover)
                print(f"6. Đã chụp Màn hình kết thúc/Phá sản: {shot_gameover}")

        # 7. Thử nghiệm giao diện di động dọc (Mobile Portrait 390x844 - iPhone 14)
        mobile_context = await browser.new_context(viewport={'width': 390, 'height': 844})
        mobile_page = await mobile_context.new_page()
        await mobile_page.goto("http://localhost:3000/play-v2", wait_until="networkidle")
        await asyncio.sleep(3.5)
        shot_mobile = os.path.join(ARTIFACT_DIR, "screen_hud_mobile_portrait.png")
        await mobile_page.screenshot(path=shot_mobile)
        print(f"7. Đã chụp giao diện điện thoại dọc: {shot_mobile}")

        await browser.close()
        print("HOÀN THÀNH TẤT CẢ KIỂM THỬ TRÌNH DUYỆT!")

if __name__ == '__main__':
    asyncio.run(run_verification())

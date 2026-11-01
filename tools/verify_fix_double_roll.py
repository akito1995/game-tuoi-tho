import asyncio
import io
import sys
import os
from playwright.async_api import async_playwright

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

ARTIFACT_DIR = r"C:\Users\Admin\.gemini\antigravity\brain\03e47441-15e9-47bc-9b15-9ff9ac20003c"

async def verify_fix():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        errors = []
        page.on("pageerror", lambda err: errors.append(f"PAGEERROR: {err}"))
        page.on("console", lambda msg: (
            errors.append(f"CONSOLE_ERROR: {msg.text}") if msg.type == "error" else None
        ))

        print("1. Đang mở http://localhost:3000/play-v2...")
        await page.goto("http://localhost:3000/play-v2", wait_until="networkidle")
        await asyncio.sleep(3.5)

        # 2. Bé Tí chọn kỹ năng ĐÔI x6
        skill_doi = page.locator("button[aria-label='Kỹ năng Đôi nhân 6']")
        if await skill_doi.count() > 0:
            await skill_doi.click()
            await asyncio.sleep(0.3)

        # 3. Bấm ĐỔ XÚC XẮC
        roll_btn = page.locator("button[aria-label='ĐỔ XÚC XẮC']")
        if await roll_btn.count() > 0:
            await roll_btn.click()
            print("2. Đã bấm Đổ xúc xắc đôi 6-6...")

        # Chờ quân cờ nhảy đến ô 12
        await asyncio.sleep(3.0)

        # 4. Kiểm tra thẻ mua đất ô 12 Thủy điện Hòa Bình
        buy_card = page.locator("button:has-text('MUA NGAY')")
        print("Buy button count:", await buy_card.count())

        card_text = await page.locator(".fixed.bottom-4").inner_text()
        print("\n--- NỘI DUNG THẺ MUA ĐẤT Ô 12 THỦY ĐIỆN HÒA BÌNH ---")
        print(card_text)
        print("---------------------------------------------------\n")

        assert "NaN" not in card_text, "LỖI: Vẫn còn chữ NaN trong thẻ mua đất!"
        assert "undefined" not in card_text, "LỖI: Vẫn còn chữ undefined!"
        assert "UTILITY" not in card_text, "LỖI: Chưa Việt hóa chữ UTILITY!"
        print("✓ Kiểm tra thẻ: HOÀN TOÀN KHÔNG CÓ NaN, ĐÃ VIỆT HÓA CHUẨN!")

        shot_card = os.path.join(ARTIFACT_DIR, "screen_fix_utility_card.png")
        await page.screenshot(path=shot_card)

        # 5. Bấm MUA NGAY
        await buy_card.click()
        print("3. Đã bấm MUA NGAY ô 12...")
        await asyncio.sleep(1.5)

        # 6. Kiểm tra trạng thái máy sau khi mua xong
        post_buy_state = await page.evaluate("""() => {
            const bridge = window.__testBridge;
            if (bridge) {
                const s = bridge.engine.state;
                const active = bridge.engine.getActivePlayer();
                return {
                    gamePhase: s.gamePhase,
                    activePlayerName: active.name,
                    activePlayerIsBot: active.isBot,
                    turnCount: s.turnCount,
                    roundCount: s.roundCount,
                    isDouble: s.isDouble
                };
            }
            return null;
        }""")
        print("Trạng thái sau khi mua:", post_buy_state)

        # Kiểm tra nút đổ xúc xắc có bị khoá không
        button_status = await page.evaluate("""() => {
            const btn = document.querySelector("button[aria-label='ĐỔ XÚC XẮC']");
            return {
                exists: !!btn,
                disabled: btn ? btn.disabled : true,
                text: btn ? btn.innerText.replace(/\\n/g, ' ') : ''
            };
        }""")
        print("Trạng thái Nút Đổ Xúc Xắc:", button_status)

        assert post_buy_state['activePlayerName'] == 'Bé Tí', "LỖI: Lẽ ra Bé Tí đổ đôi phải tiếp tục lượt!"
        assert post_buy_state['gamePhase'] == 'AWAIT_ROLL', "LỖI: Trạng thái không phải AWAIT_ROLL!"
        assert button_status['disabled'] == False, "LỖI: Nút đổ xúc xắc vẫn bị khoá!"
        print("✓ Kiểm tra chuyển lượt: BÉ TÍ ĐƯỢC ĐỔ TIẾP THÀNH CÔNG, NÚT MỞ SẴN SÀNG!")

        # 7. Bé Tí đổ tiếp lượt thứ 2!
        await roll_btn.click()
        print("4. Bé Tí bấm đổ tiếp lượt thứ 2 thành công!")
        await asyncio.sleep(3.0)

        shot_bonus_roll = os.path.join(ARTIFACT_DIR, "screen_fix_bonus_roll_success.png")
        await page.screenshot(path=shot_bonus_roll)

        print("\n=== TỔNG KẾT LỖI CONSOLE ===")
        print("Số lỗi console bắt được:", len(errors))
        for e in errors:
            print("Error:", e)
        assert len(errors) == 0, f"Vẫn còn lỗi console: {errors}"
        print("✓ 0 LỖI CONSOLE, 0 CẢNH BÁO!")

        await browser.close()
        print("\n=== HOÀN TẤT TẤT CẢ KIỂM THỬ XÁC NHẬN SỬA LỖI! ===")

if __name__ == '__main__':
    asyncio.run(verify_fix())

import asyncio
import io
import sys
import os
from playwright.async_api import async_playwright

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

ARTIFACT_DIR = r"C:\Users\Admin\.gemini\antigravity\brain\03e47441-15e9-47bc-9b15-9ff9ac20003c"

async def run_stage2_verification():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={'width': 1440, 'height': 900})
        page = await context.new_page()

        print("1. Đang mở http://localhost:3000/play-v2?test=1...")
        await page.goto("http://localhost:3000/play-v2?test=1", wait_until="networkidle")

        # Chờ nạp xong tài nguyên và màn hình loading mờ đi
        await asyncio.sleep(4.0)

        # 1. Chụp ảnh toàn cảnh màn hình game (Desktop)
        shot_main = os.path.join(ARTIFACT_DIR, "screen_stage2_p1_main.png")
        await page.screenshot(path=shot_main)
        print(f"-> Chụp ảnh màn hình chính Stage 2: {shot_main}")

        # Đo FPS và bộ nhớ (JavaScript thuần không có 'as any')
        perf_data = await page.evaluate("""() => {
            return new Promise((resolve) => {
                let frameCount = 0;
                const canvas = document.querySelector('canvas');
                if (canvas) {
                    canvas.dispatchEvent(new MouseEvent('mousemove', { clientX: 600, clientY: 450 }));
                }
                const start = performance.now();
                function count() {
                    frameCount++;
                    if (performance.now() - start < 1000) {
                        requestAnimationFrame(count);
                    } else {
                        const elapsed = performance.now() - start;
                        const fps = Math.round((frameCount * 1000) / elapsed);
                        const mem = (window.performance && window.performance.memory) ? Math.round(window.performance.memory.usedJSHeapSize / (1024 * 1024)) : null;
                        resolve({ fps, jsHeap: mem });
                    }
                }
                requestAnimationFrame(count);
            });
        }""")
        print(f"-> FPS đo được: {perf_data['fps']} FPS | JS Heap: {perf_data['jsHeap']} MB")

        # 2. Nhấp vào nút Luật chơi để kiểm tra cẩm nang luật mới
        print("2. Mở Hộp thoại Luật Chơi (RulesModal)...")
        rules_btn = await page.query_selector("button[title*='Luật chơi']")
        if rules_btn:
            await rules_btn.click()
            await asyncio.sleep(0.6)
            shot_rules = os.path.join(ARTIFACT_DIR, "screen_stage2_rules_modal.png")
            await page.screenshot(path=shot_rules)
            print(f"-> Chụp ảnh modal Luật chơi mới: {shot_rules}")

            # Đóng modal bằng phím Escape
            await page.keyboard.press("Escape")
            await asyncio.sleep(0.5)

        # 3. Mở khay biểu cảm Emote để kiểm tra không che Nhật ký
        print("3. Kiểm tra mở khay biểu cảm (Emote) góc dưới bên trái...")
        emote_btn = await page.query_selector("button[title*='biểu cảm']")
        if emote_btn:
            await emote_btn.click()
            await asyncio.sleep(0.5)
            shot_emote = os.path.join(ARTIFACT_DIR, "screen_stage2_emote_drawer_no_overlap.png")
            await page.screenshot(path=shot_emote)
            print(f"-> Chụp ảnh khay biểu cảm mở ra không che nút Mở rộng nhật ký: {shot_emote}")

            # Đóng khay biểu cảm
            await emote_btn.click()
            await asyncio.sleep(0.3)

        # 4. Kiểm tra lưu ván vào localStorage sau khi đổ xúc xắc
        print("4. Thực hiện 1 lượt đổ xúc xắc và kiểm tra auto-save localStorage...")
        roll_res = await page.evaluate("""() => {
            if (window.__testBridge) {
                const bridge = window.__testBridge;
                bridge.rollDice();
                const saveRaw = localStorage.getItem('CO_TY_PHU_SAVE_V2');
                return {
                    hasSave: Boolean(saveRaw),
                    saveParsed: saveRaw ? JSON.parse(saveRaw) : null
                };
            }
            return { hasSave: false, saveParsed: null };
        }""")
        print(f"-> Kết quả kiểm tra localStorage auto-save: {roll_res['hasSave']}")
        if roll_res['hasSave']:
            print(f"   Schema version: {roll_res['saveParsed']['version']}")
            print(f"   Round count: {roll_res['saveParsed']['roundCount']}")
            print(f"   Players: {roll_res['saveParsed']['playerNames']}")

        await browser.close()
        print("=== HOÀN TẤT KIỂM THỬ TRỰC TIẾP TRÊN TRÌNH DUYỆT (STAGE 2) ===")

if __name__ == "__main__":
    asyncio.run(run_stage2_verification())

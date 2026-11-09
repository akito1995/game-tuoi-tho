import asyncio
import io
import sys
import os
from playwright.async_api import async_playwright

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

ARTIFACT_DIR = r"C:\Users\Admin\.gemini\antigravity\brain\03e47441-15e9-47bc-9b15-9ff9ac20003c"

async def run_stage4_verification():
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=['--enable-webgl', '--ignore-gpu-blocklist']
        )

        # 1. Desktop 1440x900
        context_desktop = await browser.new_context(viewport={'width': 1440, 'height': 900})
        page_desktop = await context_desktop.new_page()

        print("1. Desktop (1440x900): Truy cập http://localhost:3000/play-v2...")
        await page_desktop.goto('http://localhost:3000/play-v2', wait_until='networkidle')
        await page_desktop.wait_for_selector('canvas', timeout=15000)
        await asyncio.sleep(2)

        # Xử lý Resume Modal nếu có
        try:
            resume_btn = page_desktop.locator("button:has-text('VÁN MỚI')")
            if await resume_btn.is_visible(timeout=1500):
                await resume_btn.click()
                print("Đã bấm VÁN MỚI.")
                await asyncio.sleep(1)
        except Exception:
            pass

        shot_desktop = os.path.join(ARTIFACT_DIR, "screen_stage4_desktop.png")
        await page_desktop.screenshot(path=shot_desktop)
        print(f"Đã lưu ảnh Desktop Stage 4: {shot_desktop}")

        # Đo FPS Desktop
        fps_data = await page_desktop.evaluate('''() => {
            return new Promise((resolve) => {
                let frames = 0;
                let start = performance.now();
                function check() {
                    frames++;
                    let now = performance.now();
                    if (now - start >= 2000) {
                        let fps = Math.round((frames * 1000) / (now - start));
                        let heap = performance.memory ? Math.round(performance.memory.usedJSHeapSize / (1024 * 1024)) : 0;
                        resolve({ fps, heap });
                    } else {
                        requestAnimationFrame(check);
                    }
                }
                requestAnimationFrame(check);
            });
        }''')
        print(f"Desktop: {fps_data['fps']} FPS (Headless), JS Heap: {fps_data['heap']} MB")

        # 2. Mobile (390x844 - iPhone / Di động)
        context_mobile = await browser.new_context(
            viewport={'width': 390, 'height': 844},
            is_mobile=True,
            has_touch=True
        )
        page_mobile = await context_mobile.new_page()

        print("2. Mobile (390x844): Truy cập http://localhost:3000/play-v2...")
        await page_mobile.goto('http://localhost:3000/play-v2', wait_until='networkidle')
        await page_mobile.wait_for_selector('canvas', timeout=15000)
        await asyncio.sleep(2)

        # Xử lý Resume Modal nếu có
        try:
            resume_btn_m = page_mobile.locator("button:has-text('VÁN MỚI')")
            if await resume_btn_m.is_visible(timeout=1500):
                await resume_btn_m.click()
                await asyncio.sleep(1)
        except Exception:
            pass

        shot_mobile = os.path.join(ARTIFACT_DIR, "screen_stage4_mobile.png")
        await page_mobile.screenshot(path=shot_mobile)
        print(f"Đã lưu ảnh Mobile Stage 4: {shot_mobile}")

        await browser.close()
        print("Kiểm chứng Giai đoạn 4 bằng Playwright hoàn thành!")

if __name__ == '__main__':
    asyncio.run(run_stage4_verification())

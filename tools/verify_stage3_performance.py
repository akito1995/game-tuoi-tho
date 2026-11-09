import asyncio
import io
import sys
import os
import time
from playwright.async_api import async_playwright

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

ARTIFACT_DIR = r"C:\Users\Admin\.gemini\antigravity\brain\03e47441-15e9-47bc-9b15-9ff9ac20003c"

async def run_stage3_verification():
    console_logs = []
    error_logs = []
    webp_requests = []
    png_requests = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=['--enable-webgl', '--ignore-gpu-blocklist']
        )
        context = await browser.new_context(viewport={'width': 1440, 'height': 900})
        page = await context.new_page()

        def handle_console(msg):
            text = msg.text
            console_logs.append(text)
            if 'Context Lost' in text or 'context lost' in text.lower():
                print(f"[CONSOLE CONTEXT LOST]: {text}")
            if msg.type in ['error']:
                error_logs.append(text)

        page.on('console', handle_console)

        def handle_response(resp):
            url = resp.url
            if '/art/' in url:
                if url.endswith('.webp'):
                    webp_requests.append(url)
                elif url.endswith('.png'):
                    png_requests.append(url)

        page.on('response', handle_response)

        print("1. Đang truy cập http://localhost:3000/play-v2...")
        await page.goto('http://localhost:3000/play-v2', wait_until='networkidle')

        # Chờ loading screen hoàn tất (hoặc canvas xuất hiện)
        await page.wait_for_selector('canvas', timeout=15000)
        await asyncio.sleep(2)

        # Nếu có modal resume, bấm ván mới hoặc tiếp tục
        try:
            resume_btn = page.locator("button:has-text('VÁN MỚI')")
            if await resume_btn.is_visible(timeout=1500):
                await resume_btn.click()
                print("Đã bấm VÁN MỚI trên ResumeGameModal.")
                await asyncio.sleep(1)
        except Exception:
            pass

        # Chụp ảnh toàn cảnh Stage 3
        shot1 = os.path.join(ARTIFACT_DIR, "screen_stage3_performance_main.png")
        await page.screenshot(path=shot1)
        print(f"Đã lưu ảnh màn hình chính Stage 3: {shot1}")

        # Đo FPS và Render loop bằng requestAnimationFrame
        fps_data = await page.evaluate('''() => {
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
        print(f"Chỉ số FPS đo được: {fps_data['fps']} FPS (Headless Chromium), JS Heap: {fps_data['heap']} MB")

        # Kiểm tra xúc xắc 3D Three.js và sự hiện diện của một Canvas duy nhất
        canvas_count = await page.evaluate('''() => {
            return document.querySelectorAll('canvas').length;
        }''')
        print(f"Tổng số phần tử Canvas trên trang: {canvas_count} (Pixi Canvas + Three.js Dice Canvas)")

        # Bấm Đổ Xúc Xắc 3 lần để kiểm tra vòng lặp hoạt ảnh xúc xắc
        roll_btn = page.locator("button:has-text('ĐỔ XÚC XẮC')")
        if await roll_btn.is_visible():
            print("Đang bấm ĐỔ XÚC XẮC...")
            await roll_btn.click()
            await asyncio.sleep(1.5)

            shot_dice = os.path.join(ARTIFACT_DIR, "screen_stage3_dice_roll.png")
            await page.screenshot(path=shot_dice)
            print(f"Đã lưu ảnh xúc xắc 3D: {shot_dice}")
            await asyncio.sleep(2.5)

        # Kiểm tra tài nguyên đã nạp
        print(f"Tổng số ảnh WebP đã tải qua mạng: {len(webp_requests)}")
        print(f"Tổng số ảnh PNG đã tải qua mạng: {len(png_requests)}")
        sample_webp = [os.path.basename(u) for u in webp_requests[:8]]
        print(f"Mẫu file WebP tải thành công: {sample_webp}")

        # Kiểm tra xem có lỗi Context Lost nào không
        context_lost_found = any('Context Lost' in log or 'context lost' in log.lower() for log in console_logs)
        if context_lost_found:
            print("CẢNH BÁO: Phát hiện log context lost!")
        else:
            print("XÁC NHẬN: Hoàn toàn KHÔNG có lỗi THREE.WebGLRenderer: Context Lost!")

        await browser.close()

if __name__ == '__main__':
    asyncio.run(run_stage3_verification())

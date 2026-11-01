import asyncio
import io
import sys
from playwright.async_api import async_playwright

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

async def check_console_errors():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        console_logs = []
        page.on("console", lambda msg: console_logs.append(f"[{msg.type}] {msg.text}"))
        page.on("pageerror", lambda err: console_logs.append(f"[PAGE_ERROR] {err}"))

        await page.goto("http://localhost:3000/play-v2", wait_until="networkidle")
        await asyncio.sleep(3.5)

        # Trigger rolling double [6,6] and landing on tile 12 (Thủy điện Hòa Bình)
        await page.evaluate("""() => {
            const bridge = window.__testBridge;
            if (bridge) {
                const active = bridge.engine.getActivePlayer();
                console.log('Active player before roll:', active.name, 'pos:', active.position);
                // Roll double [6, 6]
                bridge.rollWithSkill('DOUBLE');
                console.log('Rolled double, new pos:', active.position, 'phase:', bridge.engine.state.gamePhase);
            }
        }""")
        await asyncio.sleep(1.0)

        # Click Buy
        await page.evaluate("""() => {
            const bridge = window.__testBridge;
            if (bridge) {
                console.log('Calling buyProperty...');
                bridge.buyProperty();
                console.log('After buyProperty, phase:', bridge.engine.state.gamePhase, 'isDouble:', bridge.engine.state.isDouble);
            }
        }""")
        await asyncio.sleep(1.5)

        for log in console_logs:
            print(log)

        await browser.close()

if __name__ == '__main__':
    asyncio.run(check_console_errors())

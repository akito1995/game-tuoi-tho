import asyncio
import io
import sys
from playwright.async_api import async_playwright

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

async def test_full_flow():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        errors = []
        warnings = []
        logs = []

        page.on("pageerror", lambda err: errors.append(f"PAGEERROR: {err}"))
        page.on("console", lambda msg: (
            errors.append(f"CONSOLE_ERROR: {msg.text}") if msg.type == "error"
            else warnings.append(f"WARN: {msg.text}") if msg.type == "warning"
            else logs.append(f"LOG: {msg.text}")
        ))

        await page.goto("http://localhost:3000/play-v2", wait_until="networkidle")
        await asyncio.sleep(3.5)

        # 1. Human player uses skill 'DOUBLE' (or rolls double [6,6])
        # Click skill 3: 'ĐÔI x6'
        skill_doi_btn = page.locator("button[aria-label='Kỹ năng Đôi nhân 6']")
        if await skill_doi_btn.count() > 0:
            await skill_doi_btn.click()
            await asyncio.sleep(0.3)

        # Click large roll button "ĐỔ XÚC XẮC"
        roll_btn = page.locator("button[aria-label='ĐỔ XÚC XẮC']")
        if await roll_btn.count() > 0:
            await roll_btn.click()
            print("Clicked Roll Dice button!")

        # Wait for dice animation & token movement
        await asyncio.sleep(3.0)

        # Check tile purchase card appears
        buy_card = page.locator("button:has-text('MUA NGAY')")
        print("Buy button count:", await buy_card.count())

        if await buy_card.count() > 0:
            # Check text in card (whether it has NaNK)
            card_text = await page.locator(".fixed.bottom-4").inner_text()
            print("--- Tile Purchase Card Text ---")
            print(card_text)
            print("-------------------------------")

            # Click MUA NGAY
            await buy_card.click()
            print("Clicked MUA NGAY!")

        await asyncio.sleep(2.0)

        # Inspect the state after buying
        state_after = await page.evaluate("""() => {
            const bridge = window.__testBridge;
            if (bridge) {
                const s = bridge.engine.state;
                return {
                    gamePhase: s.gamePhase,
                    activePlayerIndex: s.activePlayerIndex,
                    activePlayerName: bridge.engine.getActivePlayer().name,
                    activePlayerIsBot: bridge.engine.getActivePlayer().isBot,
                    isDouble: s.isDouble,
                    dice: s.dice
                };
            }
            return null;
        }""")
        print("State after buy:", state_after)

        print("\n=== ERRORS CAPTURED ===")
        for e in errors:
            print(e)
        if not errors:
            print("(No console errors captured)")

        print("\n=== WARNINGS CAPTURED ===")
        for w in warnings[:10]:
            print(w)

        await browser.close()

if __name__ == '__main__':
    asyncio.run(test_full_flow())

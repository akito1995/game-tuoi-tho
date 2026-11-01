import asyncio
import io
import sys
import os
from playwright.async_api import async_playwright

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

ARTIFACT_DIR = r"C:\Users\Admin\.gemini\antigravity\brain\03e47441-15e9-47bc-9b15-9ff9ac20003c"

async def run_modals():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={'width': 1440, 'height': 900})
        page = await context.new_page()

        await page.goto("http://localhost:3000/play-v2", wait_until="networkidle")
        await asyncio.sleep(3.5)

        # 1. Chụp màn hình Sảnh Chọn Nhân Vật (LobbyModal)
        await page.evaluate("""() => {
            // Mở modal sảnh
            const btn = document.querySelector("button[aria-label='Cài đặt']");
            if (btn) btn.click();
        }""")
        await asyncio.sleep(0.5)

        # Bấm nút Mở Sảnh Trận Mới
        lobby_clicked = await page.evaluate("""() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const b = btns.find(x => x.textContent && x.textContent.includes('Mở Sảnh Trận Mới'));
            if (b) {
                b.click();
                return true;
            }
            return false;
        }""")
        print("Lobby button clicked:", lobby_clicked)
        await asyncio.sleep(0.6)
        shot_lobby = os.path.join(ARTIFACT_DIR, "screen_hud_lobby_modal.png")
        await page.screenshot(path=shot_lobby)
        print("1. Đã chụp màn hình Sảnh:", shot_lobby)

        # 2. Chọn 2 Người trong Sảnh và Bắt Đầu
        await page.evaluate("""() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const b2p = btns.find(x => x.textContent && x.textContent.includes('2 Người'));
            if (b2p) b2p.click();
        }""")
        await asyncio.sleep(0.3)

        await page.evaluate("""() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const bStart = btns.find(x => x.textContent && x.textContent.includes('BẮT ĐẦU VÁN ĐẤU'));
            if (bStart) bStart.click();
        }""")
        await asyncio.sleep(1.0)
        shot_2p = os.path.join(ARTIFACT_DIR, "screen_hud_2players_scoreboard.png")
        await page.screenshot(path=shot_2p)
        print("2. Đã chụp Bảng điểm 2 Người chơi:", shot_2p)

        # 3. Chụp màn hình Chiến thắng (GameOverModal với ui-chien-thang.png và nhân vật wave lên bục)
        await page.evaluate("""() => {
            const bridge = window.__testBridge;
            if (bridge) {
                const winner = bridge.engine.state.players[0]; // Bé Tí thắng
                bridge.engine.state.winner = winner;
                bridge.engine.state.gamePhase = 'GAME_OVER';
                bridge.notify();
            }
        }""")
        await asyncio.sleep(0.8)
        shot_win = os.path.join(ARTIFACT_DIR, "screen_hud_victory_modal.png")
        await page.screenshot(path=shot_win)
        print("3. Đã chụp Màn hình Chiến Thắng:", shot_win)

        # 4. Chụp màn hình Phá sản (GameOverModal với ui-pha-san.png)
        await page.evaluate("""() => {
            const bridge = window.__testBridge;
            if (bridge) {
                const human = bridge.engine.state.players[0];
                human.bankrupt = true;
                const winner = bridge.engine.state.players[1]; // Bot thắng, human thua phá sản
                bridge.engine.state.winner = winner;
                bridge.engine.state.gamePhase = 'GAME_OVER';
                bridge.notify();
            }
        }""")
        await asyncio.sleep(0.8)
        shot_bankrupt = os.path.join(ARTIFACT_DIR, "screen_hud_bankruptcy_modal.png")
        await page.screenshot(path=shot_bankrupt)
        print("4. Đã chụp Màn hình Phá Sản:", shot_bankrupt)

        await browser.close()
        print("HOÀN TẤT TẤT CẢ ẢNH CHỤP KIỂM TRA!")

if __name__ == '__main__':
    asyncio.run(run_modals())

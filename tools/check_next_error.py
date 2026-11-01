import asyncio
import io
import sys
from playwright.async_api import async_playwright

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

async def check_next_error():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        await page.goto("http://localhost:3000/play-v2", wait_until="networkidle")
        await asyncio.sleep(2.0)

        # Check for any nextjs error toast / dialog
        err_info = await page.evaluate("""() => {
            const portal = document.querySelector('nextjs-portal');
            if (portal && portal.shadowRoot) {
                const toast = portal.shadowRoot.querySelector('[data-nextjs-toast]');
                const dialog = portal.shadowRoot.querySelector('[data-nextjs-dialog]');
                return {
                    toast: toast ? toast.innerText : null,
                    dialog: dialog ? dialog.innerText : null,
                    html: portal.shadowRoot.innerHTML.slice(0, 1000)
                };
            }
            // Also check for any element mentioning error
            const el = document.querySelector('#nextjs__container_errors_desc, [data-nextjs-error]');
            return el ? el.innerText : null;
        }""")
        print("Next.js Error info:", err_info)

        await browser.close()

if __name__ == '__main__':
    asyncio.run(check_next_error())

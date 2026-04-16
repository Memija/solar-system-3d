import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto('http://localhost:5173/solar-system-3d/')
        await asyncio.sleep(5)
        await page.screenshot(path='labels-gone.png')
        await browser.close()

asyncio.run(main())

import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True, args=["--no-sandbox", "--disable-dev-shm-usage"])
        context = await browser.new_context(user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36")
        page = await context.new_page()
        print("Navigating...")
        await page.goto("https://www.google.co.in/search?q=buy+leggings+online+india&tbm=shop", wait_until="domcontentloaded")
        print("Waiting...")
        await asyncio.sleep(5)
        
        # Save screenshot
        await page.screenshot(path="/Users/manishd/.gemini/antigravity-ide/brain/5e698b21-9318-4985-99ab-6f3870c6bfbc/scratch/shopping_serp.png", full_page=True)
        
        # Save HTML
        html = await page.content()
        with open("/Users/manishd/.gemini/antigravity-ide/brain/5e698b21-9318-4985-99ab-6f3870c6bfbc/scratch/shopping_serp.html", "w", encoding="utf-8") as f:
            f.write(html)
            
        print("Done. Saved screenshot and HTML.")
        await browser.close()

asyncio.run(run())

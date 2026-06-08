import asyncio
from playwright.async_api import async_playwright
import os

ARTIFACTS_DIR = "/Users/manishd/.gemini/antigravity-ide/brain/5e698b21-9318-4985-99ab-6f3870c6bfbc"

async def run():
    print("Starting verification script...")
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True, args=["--no-sandbox", "--disable-dev-shm-usage"])
        context = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await context.new_page()
        
        url = "http://localhost:5174/brand-vs-competitor"
        print(f"Navigating to {url}...")
        
        try:
            await page.goto(url, wait_until="networkidle")
            await asyncio.sleep(2) # Extra wait for React state
            
            # 1. Keyword Priorities (Default Tab)
            print("Taking screenshot of Keyword Priorities...")
            await page.screenshot(path=f"{ARTIFACTS_DIR}/keyword_priorities.png", full_page=True)
            
            # 2. Informational Keywords
            print("Clicking Informational Keywords...")
            await page.click("text='Informational Keywords'")
            await asyncio.sleep(2)
            await page.screenshot(path=f"{ARTIFACTS_DIR}/informational_keywords.png", full_page=True)
            
            # 3. Buying Keywords
            print("Clicking Buying Keywords...")
            await page.click("text='Buying Keywords'")
            await asyncio.sleep(2)
            await page.screenshot(path=f"{ARTIFACTS_DIR}/buying_keywords.png", full_page=True)
            
            # 4. Google Shopping Rank
            print("Clicking Google Shopping Rank...")
            await page.click("text='Google Shopping Rank'")
            await asyncio.sleep(2)
            
            # Click a keyword to fetch rank (e.g. "buy leggings online india")
            try:
                print("Clicking keyword pill 'buy leggings online india'...")
                await page.click("text='buy leggings online india'")
                await asyncio.sleep(4) # Wait for API call
                await page.screenshot(path=f"{ARTIFACTS_DIR}/shopping_rank.png", full_page=True)
            except Exception as e:
                print(f"Could not click keyword pill: {e}")
                await page.screenshot(path=f"{ARTIFACTS_DIR}/shopping_rank.png", full_page=True)
                
            print("All screenshots taken successfully!")
            
        except Exception as e:
            print(f"Error during execution: {e}")
            await page.screenshot(path=f"{ARTIFACTS_DIR}/error_state.png")
            
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(run())

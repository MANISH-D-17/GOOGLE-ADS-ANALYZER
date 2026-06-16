import asyncio
from scraper.playwright_engine import PlaywrightScraper

async def main():
    scraper = PlaywrightScraper()
    store = {}
    await scraper.scrape("test1", "gocolors.com", "IN", store)
    print(store)

asyncio.run(main())

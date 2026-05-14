import asyncio
import hashlib
import uuid
from datetime import datetime
from playwright.async_api import async_playwright, Browser, Page
from extractors.ad_extractor import AdExtractor
from parsers.validation import AdValidator
from parsers.snapshot_manager import SnapshotManager

class PlaywrightScraper:
    def __init__(self):
        self.extractor = AdExtractor()
        self.validator = AdValidator()
        self.snapshot_mgr = SnapshotManager()
        self.seen_hashes: set = set()

    async def scrape(self, session_id: str, domain: str, region: str, session_store: dict, max_ads: int = 50):
        """Main async scraping entry point."""
        session_store[session_id]["status"] = "running"

        try:
            async with async_playwright() as pw:
                browser: Browser = await pw.chromium.launch(headless=True)
                context = await browser.new_context(
                    locale="en-IN",
                    viewport={"width": 1440, "height": 900},
                    user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
                )
                page: Page = await context.new_page()

                url = f"https://adstransparency.google.com/?region={region}&domain={domain}"
                print(f"[Scraper] Navigating to {url}")
                await page.goto(url, wait_until="networkidle", timeout=30000)
                await asyncio.sleep(3)

                ads = []
                scroll_attempts = 0
                max_scrolls = 20

                while len(ads) < max_ads and scroll_attempts < max_scrolls:
                    # Extract currently visible ad cards
                    new_ads = await self.extractor.extract_ads(page, domain, session_id)
                    for ad in new_ads:
                        if ad["contentHash"] not in self.seen_hashes:
                            self.seen_hashes.add(ad["contentHash"])
                            validated = self.validator.validate(ad)
                            if validated:
                                ads.append(validated)
                                progress = min(int(len(ads) / max_ads * 95), 95)
                                session_store[session_id].update({
                                    "adsExtracted": len(ads),
                                    "progress": progress,
                                    "currentAd": {"headline": ad.get("headline", ""), "ctaText": ad.get("ctaText", "")},
                                })

                    # Scroll down to trigger lazy-load
                    await page.evaluate("window.scrollBy(0, 1200)")
                    await asyncio.sleep(2)
                    scroll_attempts += 1

                await browser.close()

                # Save snapshot
                self.snapshot_mgr.save(session_id, domain, ads)

                session_store[session_id].update({
                    "status": "complete",
                    "progress": 100,
                    "completedAt": datetime.utcnow().isoformat(),
                    "ads": ads,
                })
                print(f"[Scraper] Session {session_id} complete. {len(ads)} ads extracted.")

        except Exception as e:
            print(f"[Scraper] Error in session {session_id}: {e}")
            session_store[session_id].update({"status": "error", "errorsCount": session_store[session_id].get("errorsCount", 0) + 1})

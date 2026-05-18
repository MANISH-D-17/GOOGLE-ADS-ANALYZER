"""
Playwright Engine — Google Ads Transparency Center Scraper
v3: Extract ALL data directly from the advertiser listing page
    instead of opening individual creative detail pages (which require auth)

Key facts from DOM inspection:
- Advertiser page: /advertiser/AR00413450328055218177?region=IN
- Shows creative-preview tiles with images from tpc.googlesyndication.com
- Each tile has: brand name, image, and link to detail page
- Page shows ~700 ads for gocolors.com, 40+ load on initial scroll
- We extract images from the listing page directly
"""
import asyncio
import hashlib
import json
import uuid
import re
import os
from datetime import datetime
from playwright.async_api import async_playwright, Page, BrowserContext


class PlaywrightScraper:
    def __init__(self):
        self.seen_hashes: set = set()

    async def scrape(
        self, session_id: str, domain: str, region: str,
        session_store: dict, max_ads: int = 50
    ):
        session_store[session_id]["status"] = "running"
        session_store[session_id]["progress"] = 2

        try:
            async with async_playwright() as pw:
                browser = await pw.chromium.launch(
                    headless=True,
                    args=["--no-sandbox", "--disable-dev-shm-usage"]
                )
                context = await browser.new_context(
                    locale="en-IN",
                    viewport={"width": 1440, "height": 900},
                    user_agent=(
                        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                        "AppleWebKit/537.36 (KHTML, like Gecko) "
                        "Chrome/120.0.0.0 Safari/537.36"
                    )
                )

                # ── Phase 1: Load domain search page → get advertiser ID ──
                page = await context.new_page()
                domain_url = f"https://adstransparency.google.com/?region={region}&domain={domain}"
                print(f"[Scraper] Loading domain page: {domain_url}")
                await page.goto(domain_url, wait_until="domcontentloaded", timeout=60000)

                try:
                    await page.wait_for_selector("creative-preview", timeout=20000)
                except Exception:
                    print("[Scraper] No creative-preview on domain page")

                # Click "See all ads" if present to expand results/show more accounts
                try:
                    expand_btn = await page.query_selector("material-button.grid-expansion-button")
                    if expand_btn and await expand_btn.is_visible():
                        print("[Scraper] Clicking 'See all ads' expansion button")
                        await expand_btn.click()
                        await asyncio.sleep(3)
                except Exception as e:
                    print(f"[Scraper] No expansion button or click failed: {e}")

                await asyncio.sleep(2)
                session_store[session_id]["progress"] = 10

                # Grab advertiser ID from creative links
                initial_links = await page.evaluate("""() =>
                    Array.from(document.querySelectorAll('creative-preview a[href*="/creative/"]'))
                        .map(a => a.href)
                """)

                advertiser_id = None
                if initial_links:
                    m = re.search(r'/advertiser/(AR\w+)/', initial_links[0])
                    if m:
                        advertiser_id = m.group(1)
                        print(f"[Scraper] Advertiser ID: {advertiser_id}")

                # ── Phase 2: Navigate to the full advertiser listing page ──
                if advertiser_id:
                    adv_url = f"https://adstransparency.google.com/advertiser/{advertiser_id}?region={region}"
                else:
                    adv_url = domain_url
                    print("[Scraper] No advertiser ID, using domain page")

                print(f"[Scraper] Navigating to advertiser page: {adv_url}")
                await page.goto(adv_url, wait_until="domcontentloaded", timeout=60000)

                try:
                    await page.wait_for_selector("creative-preview", timeout=20000)
                except Exception:
                    print("[Scraper] No creative-preview on advertiser page")

                await asyncio.sleep(5)
                session_store[session_id]["progress"] = 20

                # ── Phase 3: Scroll to collect creative-preview tiles ──
                # Each tile has: image, creative link, brand name
                collected_ads = {}  # creative_id → ad dict
                no_new_streak = 0
                scroll_round = 0
                max_scrolls = 25

                while len(collected_ads) < max_ads and scroll_round < max_scrolls:
                    tiles = await page.evaluate("""() => {
                        const previews = document.querySelectorAll('creative-preview');
                        const results = [];
                        previews.forEach(el => {
                            const link = el.querySelector('a[href*="/creative/"]');
                            const href = link ? link.href : '';
                            const creativeId = href.match(/creative\\/(CR\\w+)/)?.[1] || '';
                            const imgs = Array.from(el.querySelectorAll('img'))
                                .map(i => i.src)
                                .filter(s => s && s.includes('googlesyndication'));
                            
                            // Target specific text elements within the creative preview
                            const textNodes = Array.from(el.querySelectorAll('div, span, p, [role="heading"]'))
                                .map(e => (e.innerText || '').trim())
                                .filter(t => t.length > 5 && t.length < 500)
                                // Remove duplicates within the same tile
                                .filter((t, i, arr) => arr.indexOf(t) === i);

                            if (creativeId) {
                                results.push({ creativeId, href, images: imgs, textNodes });
                            }
                        });
                        return results;
                    }""")

                    prev_count = len(collected_ads)
                    for tile in tiles:
                        cid = tile["creativeId"]
                        if cid and cid not in collected_ads:
                            collected_ads[cid] = tile

                    new_count = len(collected_ads)
                    print(f"[Scraper] Scroll {scroll_round+1}: {new_count} ads collected")
                    progress = 20 + int(min(new_count, max_ads) / max_ads * 40)
                    session_store[session_id].update({
                        "progress": min(progress, 60),
                        "adsExtracted": new_count,
                    })

                    if new_count == prev_count:
                        no_new_streak += 1
                        if no_new_streak >= 3:
                            print("[Scraper] No new ads after 3 scrolls, stopping")
                            break
                    else:
                        no_new_streak = 0

                    if new_count >= max_ads:
                        break

                    await page.evaluate("window.scrollBy(0, 1400)")
                    await asyncio.sleep(2.5)
                    scroll_round += 1

                await browser.close()

                # ── Phase 4: Convert tiles to structured ads ──
                ads = []
                tile_list = list(collected_ads.values())[:max_ads]
                brand_name = domain.split(".")[0].replace("-", " ").title()

                for i, tile in enumerate(tile_list):
                    content_hash = hashlib.sha256(tile["creativeId"].encode()).hexdigest()[:16]
                    if content_hash in self.seen_hashes:
                        continue
                    self.seen_hashes.add(content_hash)

                    ad = self._build_ad_from_tile(tile, domain, session_id, brand_name, i)
                    ads.append(ad)

                    session_store[session_id].update({
                        "adsExtracted": len(ads),
                        "imagesFound": sum(1 for a in ads if a.get("imageUrls")),
                        "progress": min(60 + int((i + 1) / len(tile_list) * 38), 98),
                        "currentAd": {
                            "headline": ad["headline"],
                            "ctaText": ad["ctaText"],
                        },
                    })
                    print(f"[Scraper] Ad {len(ads)}: {tile['creativeId']} | {len(tile['images'])} images")

                # ── Save snapshot & complete ──
                await self._save_snapshot(session_id, domain, ads)

                # ── Persist to PostgreSQL ──
                try:
                    from database.connection import get_db
                    from database.services.storage_pipeline import StoragePipelineService
                    
                    # Use a fresh DB session for persistence
                    async for db in get_db():
                        pipeline = StoragePipelineService(db)
                        await pipeline.store(session_id, domain, region, ads)
                        print(f"[Scraper] Data persisted to PostgreSQL for session {session_id}")
                        break
                except Exception as db_err:
                    print(f"[Scraper] DB persistence failed: {db_err}")

                session_store[session_id].update({
                    "status": "complete",
                    "progress": 100,
                    "completedAt": datetime.utcnow().isoformat(),
                    "ads": ads,
                    "adsExtracted": len(ads),
                    "imagesFound": sum(1 for a in ads if a.get("imageUrls")),
                })
                print(f"[Scraper] ✓ Session {session_id} complete. {len(ads)} ads extracted.")

        except Exception as e:
            import traceback
            print(f"[Scraper] Fatal error in session {session_id}: {e}")
            traceback.print_exc()
            session_store[session_id].update({
                "status": "error", "progress": 100,
                "errorsCount": session_store[session_id].get("errorsCount", 0) + 1,
            })

    def _build_ad_from_tile(
        self, tile: dict, domain: str, session_id: str, brand_name: str, index: int
    ) -> dict:
        """Build a structured ad object from a creative-preview tile."""
        creative_id = tile["creativeId"]
        images = tile["images"]
        
        # Priority 1: Use extracted text nodes
        # Filter out obvious boilerplate but keep brand-related content
        text_nodes = [
            t for t in tile.get("textNodes", [])
            if not any(skip in t.lower() for skip in ["verified", "private limited", "limited"])
            and len(t) > 5
        ]

        # Standard GADS card layout usually has Headline followed by Description
        headline = text_nodes[0] if text_nodes else f"{brand_name} Ad {index + 1}"
        description = text_nodes[1] if len(text_nodes) > 1 else ""
        
        # If we have many nodes, description might be the rest joined
        if len(text_nodes) > 2:
            description = " ".join(text_nodes[1:])

        # Clean up description (remove display URL if it leaked in)
        if domain.lower() in description.lower():
            description = re.sub(rf"https?://(www\.)?{re.escape(domain)}[^\s]*", "", description, flags=re.IGNORECASE).strip()

        return {
            "id": f"ad_{uuid.uuid4().hex[:8]}",
            "sessionId": session_id,
            "brand": brand_name,
            "domain": domain,
            "headline": headline[:150],
            "description": description[:300],
            "ctaText": "Visit Site", # Usually hard to scrape from tile, "Visit Site" is standard
            "landingUrl": f"https://{domain}",
            "adFormat": "image" if images else "text",
            "firstSeen": datetime.utcnow().strftime("%Y-%m-%d"),
            "lastSeen": datetime.utcnow().strftime("%Y-%m-%d"),
            "imageUrls": images,
            "videoUrls": [],
            "offerText": self._extract_offer(headline + " " + description),
            "emotionalTriggers": self._detect_triggers(headline + " " + description),
            "dominantColors": ["#f3f4f6", "#111827"],
            "productMentions": [],
            "fashionCategory": "General",
            "creativeType": "Display" if images else "Text",
            "adPreviewAsset": images[0] if images else "",
            "contentHash": hashlib.sha256(creative_id.encode()).hexdigest()[:16],
            "extractedAt": datetime.utcnow().isoformat(),
            "sourceUrl": tile.get("href", ""),
        }

    def _extract_offer(self, text: str) -> str:
        patterns = [r'\d+%\s*off', r'₹\s*\d+', r'free shipping', r'buy \d+ get \d+', r'limited time']
        for p in patterns:
            m = re.search(p, text, re.IGNORECASE)
            if m:
                return m.group(0)
        return ""

    def _detect_triggers(self, text: str) -> list:
        text_lower = text.lower()
        triggers = {
            'urgency': ['now', 'today', 'hurry', 'limited'],
            'trust': ['guarantee', 'certified', 'verified', 'trusted'],
            'savings': ['save', 'off', 'discount', 'deal'],
        }
        return [k for k, words in triggers.items() if any(w in text_lower for w in words)]

    async def _save_snapshot(self, session_id: str, domain: str, ads: list):
        snapshot_dir = os.path.join(os.path.dirname(__file__), "..", "datasets", "snapshots")
        os.makedirs(snapshot_dir, exist_ok=True)
        path = os.path.join(snapshot_dir, f"{session_id}.json")
        with open(path, "w") as f:
            json.dump({
                "sessionId": session_id, "domain": domain,
                "capturedAt": datetime.utcnow().isoformat(),
                "adsCount": len(ads), "ads": ads,
            }, f, indent=2)
        print(f"[Scraper] Snapshot saved: {path}")

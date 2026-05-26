"""
Playwright Engine — Google Ads Transparency Center Full Scraper
v4: Complete extraction — opens detail pages, downloads media, rate-limit safe
"""
import asyncio
import hashlib
import json
import uuid
import re
import os
import random
import aiohttp
from datetime import datetime
from playwright.async_api import async_playwright, Page, BrowserContext

# ── User agent rotation pool ──────────────────────────────────────────────
USER_AGENTS = [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_4) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0",
]

# ── Fashion category keyword map ──────────────────────────────────────────
FASHION_CATEGORIES = {
    "Leggings": ["legging", "churidar", "ankle pant", "jegging"],
    "Saree Shaper": ["saree shaper", "shapewear", "shaper"],
    "Kurti": ["kurti", "kurti pant", "salwar", "anarkali"],
    "Loungewear": ["pyjama", "lounge", "nightwear", "co-ord", "palazzo"],
    "Ethnic Wear": ["ethnic", "festive", "traditional", "dupatta"],
    "Activewear": ["gym", "yoga", "sports", "workout", "compression"],
    "Bottomwear": ["legging", "pant", "trouser", "bottom"],
}

# ── Product mention keywords ───────────────────────────────────────────────
PRODUCT_KEYWORDS = [
    "leggings", "saree", "kurti", "palazzo", "pyjama", "churidar",
    "top", "dress", "kurta", "dupatta", "ethnic", "lounge", "shapewear",
]

# ── Delay helpers ─────────────────────────────────────────────────────────
async def human_delay(min_s: float = 1.5, max_s: float = 4.0):
    """Random delay to avoid bot detection."""
    await asyncio.sleep(random.uniform(min_s, max_s))

async def scroll_delay():
    """Delay between scroll events — longer to mimic human reading."""
    await asyncio.sleep(random.uniform(2.0, 5.0))

async def page_load_delay():
    """Delay after page navigation."""
    await asyncio.sleep(random.uniform(3.0, 7.0))


class PlaywrightScraper:
    def __init__(self):
        self.seen_hashes: set = set()

    async def _goto_with_retry(self, page: Page, url: str, retries: int = 4, base_timeout: int = 60000):
        for i in range(retries):
            try:
                print(f"[Scraper] → {url} (attempt {i+1}/{retries})")
                await page.goto(url, wait_until="domcontentloaded", timeout=base_timeout)
                await page_load_delay()
                return
            except Exception as e:
                wait = (2 ** i) * 5 + random.uniform(0, 3)  # Exponential backoff
                print(f"[Scraper] Navigation failed (attempt {i+1}): {e}. Retrying in {wait:.1f}s…")
                if i < retries - 1:
                    await asyncio.sleep(wait)
                else:
                    raise e

    async def scrape(
        self, session_id: str, domain: str, region: str,
        session_store: dict, max_ads: int = 200, download_media: bool = True
    ):
        session_store[session_id]["status"] = "running"
        session_store[session_id]["progress"] = 2

        # Create media output directory for this session
        snapshot_dir = os.path.join(os.path.dirname(__file__), "..", "datasets", "snapshots")
        media_dir = os.path.join(snapshot_dir, session_id, "media")
        os.makedirs(os.path.join(media_dir, "images"), exist_ok=True)
        os.makedirs(os.path.join(media_dir, "videos"), exist_ok=True)

        browser = None
        try:
            async with async_playwright() as pw:
                # ── Random user agent ────────────────────────────────────
                ua = random.choice(USER_AGENTS)
                browser = await pw.chromium.launch(
                    headless=True,
                    args=["--no-sandbox", "--disable-dev-shm-usage",
                          "--disable-blink-features=AutomationControlled"]
                )
                context = await browser.new_context(
                    locale="en-IN",
                    viewport={"width": random.randint(1280, 1920), "height": random.randint(800, 1080)},
                    user_agent=ua,
                    extra_http_headers={
                        "Accept-Language": "en-IN,en;q=0.9",
                        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                    }
                )

                # ── Phase 1: Find advertiser ID ───────────────────────────
                page = await context.new_page()
                domain_url = f"https://adstransparency.google.com/?region={region}&domain={domain}"
                await self._goto_with_retry(page, domain_url)
                await human_delay(2, 5)

                try:
                    await page.wait_for_selector("creative-preview", timeout=25000)
                except Exception:
                    print("[Scraper] No creative-preview elements found on domain page")

                # Expand "See all ads" if present
                try:
                    expand_btn = await page.query_selector("material-button.grid-expansion-button")
                    if expand_btn and await expand_btn.is_visible():
                        await expand_btn.click()
                        await human_delay(2, 4)
                except Exception:
                    pass

                # Extract advertiser ID
                initial_links = await page.evaluate("""() =>
                    Array.from(document.querySelectorAll('creative-preview a[href*="/creative/"]'))
                        .map(a => a.href)
                """)

                advertiser_id = None
                for link in initial_links:
                    m = re.search(r'/advertiser/(AR\w+)/', link)
                    if m:
                        advertiser_id = m.group(1)
                        print(f"[Scraper] Advertiser ID: {advertiser_id}")
                        break

                # ── Phase 2: Navigate to advertiser listing page ──────────
                adv_url = (
                    f"https://adstransparency.google.com/advertiser/{advertiser_id}?region={region}"
                    if advertiser_id else domain_url
                )
                await self._goto_with_retry(page, adv_url)
                await human_delay(3, 6)
                session_store[session_id]["progress"] = 15

                # ── Phase 3: Scroll to collect ALL creative tile hrefs ─────
                collected_hrefs: dict[str, dict] = {}
                no_new_streak = 0
                scroll_round = 0
                MAX_NO_NEW_STREAK = 5  # Stop only after 5 consecutive empty scroll rounds
                SCROLL_PIXELS = random.randint(1200, 1800)

                while len(collected_hrefs) < max_ads and no_new_streak < MAX_NO_NEW_STREAK:
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
                            const textNodes = Array.from(el.querySelectorAll('div, span, p, [role="heading"]'))
                                .map(e => (e.innerText || '').trim())
                                .filter(t => t.length > 5 && t.length < 500)
                                .filter((t, i, arr) => arr.indexOf(t) === i);
                            if (creativeId) {
                                results.push({ creativeId, href, images: imgs, textNodes });
                            }
                        });
                        return results;
                    }""")

                    prev_count = len(collected_hrefs)
                    for tile in tiles:
                        cid = tile["creativeId"]
                        if cid and cid not in collected_hrefs:
                            collected_hrefs[cid] = tile

                    new_count = len(collected_hrefs)
                    print(f"[Scraper] Scroll {scroll_round + 1}: {new_count} tiles ({new_count - prev_count} new)")

                    progress = 15 + int(min(new_count, max_ads) / max_ads * 30)
                    session_store[session_id].update({
                        "progress": min(progress, 45),
                        "adsExtracted": new_count,
                    })

                    if new_count == prev_count:
                        no_new_streak += 1
                        print(f"[Scraper] No new ads streak: {no_new_streak}/{MAX_NO_NEW_STREAK}")
                        await human_delay(3, 7)  # Extra wait when stalled
                    else:
                        no_new_streak = 0

                    if new_count >= max_ads:
                        print(f"[Scraper] Reached max_ads={max_ads}")
                        break

                    # Human-like scroll with random pixel amount
                    scroll_px = random.randint(1000, 2000)
                    await page.evaluate(f"window.scrollBy(0, {scroll_px})")
                    await scroll_delay()
                    scroll_round += 1

                print(f"[Scraper] Collected {len(collected_hrefs)} creative tiles — proceeding to detail extraction")

                # ── Phase 4: Open each detail page for full data ──────────
                ads = []
                tile_list = list(collected_hrefs.values())[:max_ads]
                brand_name = domain.split(".")[0].replace("-", " ").title()

                detail_page = await context.new_page()

                for i, tile in enumerate(tile_list):
                    content_hash = hashlib.sha256(tile["creativeId"].encode()).hexdigest()[:16]
                    if content_hash in self.seen_hashes:
                        continue
                    self.seen_hashes.add(content_hash)

                    try:
                        ad = await self._extract_detail_page(
                            detail_page, tile, domain, session_id, brand_name, i,
                            media_dir, download_media
                        )
                        ads.append(ad)
                    except Exception as e:
                        print(f"[Scraper] Detail page failed for {tile['creativeId']}: {e}")
                        # Fall back to tile-only data without crashing
                        ad = self._build_ad_from_tile(tile, domain, session_id, brand_name, i)
                        ads.append(ad)

                    session_store[session_id].update({
                        "adsExtracted": len(ads),
                        "imagesFound": sum(len(a.get("imageUrls", [])) for a in ads),
                        "videosFound": sum(len(a.get("videoUrls", [])) for a in ads),
                        "progress": min(45 + int((i + 1) / len(tile_list) * 53), 98),
                        "currentAd": {
                            "headline": ad.get("headline", ""),
                            "ctaText": ad.get("ctaText", ""),
                        },
                    })

                    # Rate-limit protection: pause between every detail page
                    await human_delay(1.5, 4.0)
                    # Extra long pause every 20 ads
                    if (i + 1) % 20 == 0:
                        pause = random.uniform(8, 15)
                        print(f"[Scraper] Rate-limit pause: {pause:.1f}s after {i+1} ads")
                        await asyncio.sleep(pause)

                await detail_page.close()

                # ── Phase 5: Save snapshot + persist ─────────────────────
                await self._save_snapshot(session_id, domain, ads)

                try:
                    from database.connection import get_db
                    from database.services.storage_pipeline import StoragePipelineService
                    async for db in get_db():
                        pipeline = StoragePipelineService(db)
                        await pipeline.store(session_id, domain, region, ads)
                        print(f"[Scraper] Persisted {len(ads)} ads to PostgreSQL")
                        break
                except Exception as db_err:
                    print(f"[Scraper] DB persistence failed (non-fatal): {db_err}")

                session_store[session_id].update({
                    "status": "complete", "progress": 100,
                    "completedAt": datetime.utcnow().isoformat(),
                    "ads": ads, "adsExtracted": len(ads),
                    "imagesFound": sum(len(a.get("imageUrls", [])) for a in ads),
                    "videosFound": sum(len(a.get("videoUrls", [])) for a in ads),
                })
                print(f"[Scraper] ✓ Session {session_id}: {len(ads)} ads extracted")

        except Exception as e:
            import traceback
            print(f"[Scraper] Fatal error: {e}")
            traceback.print_exc()
            session_store[session_id].update({
                "status": "error", "progress": 100,
                "errorsCount": session_store[session_id].get("errorsCount", 0) + 1,
            })
        finally:
            if browser:
                try:
                    await browser.close()
                except Exception:
                    pass

    async def _extract_detail_page(
        self, page: Page, tile: dict, domain: str, session_id: str,
        brand_name: str, index: int, media_dir: str, download_media: bool
    ) -> dict:
        """Open the creative detail URL and extract full title, description, CTA, video."""
        detail_url = tile.get("href", "")
        
        headline = ""
        description = ""
        cta_text = "Shop Now"
        video_urls = []
        local_image_paths = []
        local_video_paths = []

        if detail_url:
            try:
                await page.goto(detail_url, wait_until="domcontentloaded", timeout=45000)
                await human_delay(1.5, 3.5)

                # Extract headline (h1 or largest heading)
                headline = await page.evaluate("""() => {
                    const h = document.querySelector('h1, [class*="headline"], [class*="title"], [role="heading"]');
                    return h ? h.innerText.trim() : '';
                }""")

                # Extract description
                description = await page.evaluate("""() => {
                    const d = document.querySelector('[class*="description"], [class*="body"], p');
                    return d ? d.innerText.trim().slice(0, 400) : '';
                }""")

                # Extract CTA
                cta_text = await page.evaluate("""() => {
                    const btn = document.querySelector('button, a[class*="cta"], [class*="call-to-action"], [class*="button"]');
                    if (btn) return btn.innerText.trim().slice(0, 60) || 'Shop Now';
                    return 'Shop Now';
                }""")

                # Extract video sources
                video_srcs = await page.evaluate("""() =>
                    Array.from(document.querySelectorAll('video source, video'))
                        .map(v => v.src || v.getAttribute('src') || '')
                        .filter(s => s && s.startsWith('http'))
                """)
                video_urls = video_srcs[:3]

            except Exception as e:
                print(f"[Detail] Failed to load {detail_url}: {e}")

        # If headline still empty, fall back to tile text
        if not headline:
            text_nodes = [
                t for t in tile.get("textNodes", [])
                if not any(skip in t.lower() for skip in ["verified", "private limited", "limited"])
            ]
            headline = text_nodes[0] if text_nodes else f"{brand_name} Ad {index + 1}"
            description = " ".join(text_nodes[1:])[:300] if len(text_nodes) > 1 else ""

        # ── Download media ────────────────────────────────────────────────
        tile_images = tile.get("images", [])
        if download_media and tile_images:
            local_image_paths = await self._download_images(
                tile_images, media_dir, tile["creativeId"]
            )

        if download_media and video_urls:
            local_video_paths = await self._download_videos(
                video_urls, media_dir, tile["creativeId"]
            )

        full_text = f"{headline} {description} {cta_text}"
        return {
            "id": f"ad_{uuid.uuid4().hex[:8]}",
            "sessionId": session_id,
            "brand": brand_name,
            "domain": domain,
            "headline": headline[:150],
            "description": description[:400],
            "ctaText": cta_text[:80] if cta_text else "Shop Now",
            "landingUrl": f"https://{domain}",
            "adFormat": "video" if video_urls else ("image" if tile_images else "text"),
            "firstSeen": datetime.utcnow().strftime("%Y-%m-%d"),
            "lastSeen": datetime.utcnow().strftime("%Y-%m-%d"),
            "imageUrls": tile_images,
            "videoUrls": video_urls,
            "localImagePaths": local_image_paths,
            "localVideoPaths": local_video_paths,
            "offerText": self._extract_offer(full_text),
            "emotionalTriggers": self._detect_triggers(full_text),
            "dominantColors": ["#f3f4f6", "#111827"],
            "productMentions": self._extract_products(full_text),
            "fashionCategory": self._classify_fashion(full_text),
            "creativeType": "Video" if video_urls else ("Display" if tile_images else "Text"),
            "adPreviewAsset": local_image_paths[0] if local_image_paths else (tile_images[0] if tile_images else ""),
            "contentHash": hashlib.sha256(tile["creativeId"].encode()).hexdigest()[:16],
            "extractedAt": datetime.utcnow().isoformat(),
            "sourceUrl": tile.get("href", ""),
            "detailUrl": detail_url,
        }

    async def _download_images(self, urls: list, media_dir: str, creative_id: str) -> list:
        """Download images and return local file paths."""
        saved_paths = []
        images_dir = os.path.join(media_dir, "images")
        os.makedirs(images_dir, exist_ok=True)

        try:
            async with aiohttp.ClientSession(
                headers={"User-Agent": random.choice(USER_AGENTS)},
                timeout=aiohttp.ClientTimeout(total=20)
            ) as session:
                for i, url in enumerate(urls[:5]):  # Max 5 images per ad
                    try:
                        ext = "jpg" if "jpg" in url.lower() or "jpeg" in url.lower() else "png"
                        filename = f"{creative_id}_{i}.{ext}"
                        filepath = os.path.join(images_dir, filename)

                        async with session.get(url) as resp:
                            if resp.status == 200:
                                content = await resp.read()
                                with open(filepath, "wb") as f:
                                    f.write(content)
                                saved_paths.append(filepath)
                                await asyncio.sleep(random.uniform(0.3, 0.8))
                    except Exception as img_err:
                        print(f"[Download] Image failed ({url[:60]}): {img_err}")
        except Exception as e:
            print(f"[Download] Image session failed: {e}")

        return saved_paths

    async def _download_videos(self, urls: list, media_dir: str, creative_id: str) -> list:
        """Download videos and return local file paths."""
        saved_paths = []
        videos_dir = os.path.join(media_dir, "videos")
        os.makedirs(videos_dir, exist_ok=True)

        try:
            async with aiohttp.ClientSession(
                headers={"User-Agent": random.choice(USER_AGENTS)},
                timeout=aiohttp.ClientTimeout(total=60)
            ) as session:
                for i, url in enumerate(urls[:2]):  # Max 2 videos per ad
                    try:
                        ext = "mp4"
                        filename = f"{creative_id}_{i}.{ext}"
                        filepath = os.path.join(videos_dir, filename)

                        async with session.get(url) as resp:
                            if resp.status == 200:
                                content = await resp.read()
                                with open(filepath, "wb") as f:
                                    f.write(content)
                                saved_paths.append(filepath)
                    except Exception as vid_err:
                        print(f"[Download] Video failed ({url[:60]}): {vid_err}")
        except Exception as e:
            print(f"[Download] Video session failed: {e}")

        return saved_paths

    def _build_ad_from_tile(self, tile, domain, session_id, brand_name, index) -> dict:
        """Tile-only fallback (no detail page open)."""
        text_nodes = [
            t for t in tile.get("textNodes", [])
            if not any(skip in t.lower() for skip in ["verified", "private limited", "limited"])
        ]
        headline = text_nodes[0] if text_nodes else f"{brand_name} Ad {index + 1}"
        description = " ".join(text_nodes[1:])[:300] if len(text_nodes) > 1 else ""
        images = tile.get("images", [])
        full_text = f"{headline} {description}"

        return {
            "id": f"ad_{uuid.uuid4().hex[:8]}",
            "sessionId": session_id, "brand": brand_name, "domain": domain,
            "headline": headline[:150], "description": description,
            "ctaText": "Shop Now", "landingUrl": f"https://{domain}",
            "adFormat": "image" if images else "text",
            "firstSeen": datetime.utcnow().strftime("%Y-%m-%d"),
            "lastSeen": datetime.utcnow().strftime("%Y-%m-%d"),
            "imageUrls": images, "videoUrls": [],
            "localImagePaths": [], "localVideoPaths": [],
            "offerText": self._extract_offer(full_text),
            "emotionalTriggers": self._detect_triggers(full_text),
            "dominantColors": ["#f3f4f6", "#111827"],
            "productMentions": self._extract_products(full_text),
            "fashionCategory": self._classify_fashion(full_text),
            "creativeType": "Display" if images else "Text",
            "adPreviewAsset": images[0] if images else "",
            "contentHash": hashlib.sha256(tile["creativeId"].encode()).hexdigest()[:16],
            "extractedAt": datetime.utcnow().isoformat(),
            "sourceUrl": tile.get("href", ""),
        }

    def _classify_fashion(self, text: str) -> str:
        text_lower = text.lower()
        for category, keywords in FASHION_CATEGORIES.items():
            if any(kw in text_lower for kw in keywords):
                return category
        return "General"

    def _extract_products(self, text: str) -> list:
        text_lower = text.lower()
        return [kw for kw in PRODUCT_KEYWORDS if kw in text_lower]

    def _extract_offer(self, text: str) -> str:
        import re
        patterns = [r'\d+%\s*off', r'₹\s*\d+[\d,]*', r'free shipping', r'buy \d+ get \d+', r'limited time', r'flat \d+']
        for p in patterns:
            m = re.search(p, text, re.IGNORECASE)
            if m:
                return m.group(0)
        return ""

    def _detect_triggers(self, text: str) -> list:
        text_lower = text.lower()
        triggers = {
            "urgency": ["now", "today", "hurry", "limited", "last chance"],
            "trust": ["guarantee", "certified", "verified", "trusted", "authentic"],
            "savings": ["save", "off", "discount", "deal", "offer", "free"],
            "exclusivity": ["exclusive", "limited edition", "only", "special"],
            "comfort": ["comfort", "soft", "cozy", "relax", "breathable"],
            "festive": ["festive", "celebration", "occasion", "party"],
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

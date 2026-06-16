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
import aiofiles

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
async def human_delay(min_s: float = 0.3, max_s: float = 0.8):
    """Optimized random delay for speed while remaining stable."""
    await asyncio.sleep(random.uniform(min_s, max_s))

async def scroll_delay():
    """Optimized delay between scroll events."""
    await asyncio.sleep(random.uniform(0.4, 0.8))

async def page_load_delay():
    """Optimized delay after page navigation."""
    await asyncio.sleep(random.uniform(0.5, 1.2))


class PlaywrightScraper:
    def __init__(self):
        self.seen_hashes: set = set()
        self.downloaded_media_urls: set = set()

        # Initialize checkpoint/state components
        import os
        from state.checkpoint_manager import CheckpointManager
        from state.csv_writer import IncrementalCSVWriter
        from state.resume_engine import ResumeEngine
        from state.recovery import RecoveryManager
        
        datasets_dir = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "datasets"))
        self.checkpoint_mgr = CheckpointManager(datasets_dir)
        self.csv_writer = IncrementalCSVWriter(datasets_dir)
        self.resume_engine = ResumeEngine(self.checkpoint_mgr)
        self.recovery_mgr = RecoveryManager(datasets_dir)

    async def _goto_with_retry(self, page: Page, url: str, retries: int = 4, base_timeout: int = 15000):
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
        session_store: dict, max_ads: int = 2000, download_media: bool = True
    ):
        # 1. Recover memory state from CSV fail-safes
        csv_hashes = self.recovery_mgr.reconstruct_seen_hashes()
        csv_downloads = self.recovery_mgr.reconstruct_downloaded_urls()
        self.seen_hashes = set(csv_hashes)
        self.downloaded_media_urls = set(csv_downloads)

        # 2. Check for resumable session checkpoint
        resumed_state = await self.resume_engine.get_resumable_session(domain, region)
        
        if resumed_state:
            current_state = resumed_state
            # Map checkpoint ID to active polling session ID so progress matches
            current_state.session_id = session_id
            current_state.status = "running"
            
            # Populate scraper memory sets
            self.resume_engine.restore_scraper_memory(self, current_state)
            
            # Restore state metrics in the memory-store map
            session_store[session_id].update({
                "status": "running",
                "progress": current_state.progress,
                "adsExtracted": current_state.ads_extracted,
                "imagesFound": current_state.images_found,
                "videosFound": current_state.videos_found,
                "errorsCount": current_state.errors_count,
                "ads": current_state.processed_ads,
            })
            print(f"[Scraper] Resuming session {session_id} for {domain} at phase: {current_state.current_phase}")
        else:
            from state.state_models import ScraperState
            current_state = ScraperState(
                session_id=session_id,
                domain=domain,
                region=region,
                status="running",
                started_at=datetime.utcnow().isoformat(),
                last_activity=datetime.utcnow().isoformat(),
                current_phase="init"
            )
            
            # Reset memory for a fresh session so it doesn't skip ads from previous runs
            self.seen_hashes = set()
            self.downloaded_media_urls = set()
            
            session_store[session_id]["status"] = "running"
            session_store[session_id]["progress"] = 2
            
            # Start session tracking in sessions.csv
            await self.csv_writer.append_session(current_state.model_dump())

        # Create media output directory for this session
        snapshot_dir = os.path.join(os.path.dirname(__file__), "..", "datasets", "snapshots")
        media_dir = os.path.join(snapshot_dir, session_id, "media")
        os.makedirs(os.path.join(media_dir, "images"), exist_ok=True)
        os.makedirs(os.path.join(media_dir, "videos"), exist_ok=True)

        browser = None
        context = None
        try:
            # Skip scrolling if: (a) checkpoint says extracting, OR (b) resumed session already has tiles collected
            has_tiles = resumed_state is not None and len(current_state.collected_hrefs) > 0
            skip_scrolling = (current_state.current_phase == "extracting") or has_tiles
            collected_hrefs = {}
            if has_tiles and current_state.current_phase != "extracting":
                print(f"[Scraper] Skipping Phase 3 — checkpoint already has {len(current_state.collected_hrefs)} tiles (phase was '{current_state.current_phase}').")
                current_state.current_phase = "extracting"
                await self.checkpoint_mgr.save_checkpoint(current_state)


            async with async_playwright() as pw:
                # ── Random user agent ────────────────────────────────────
                ua = random.choice(USER_AGENTS)
                browser = await pw.chromium.launch(
                    headless=True,
                    args=[
                        "--no-sandbox",
                        "--disable-setuid-sandbox",
                        "--disable-dev-shm-usage",
                        "--disable-gpu",
                        "--disable-software-rasterizer",
                        "--disable-blink-features=AutomationControlled",
                        "--js-flags='--max-old-space-size=150'",
                        "--disable-extensions",
                        "--no-zygote",
                        "--single-process"
                    ]
                )
                context_args = {
                    "locale": "en-IN",
                    "viewport": {"width": random.randint(1280, 1920), "height": random.randint(800, 1080)},
                    "user_agent": ua,
                    "extra_http_headers": {
                        "Accept-Language": "en-IN,en;q=0.9",
                        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                    }
                }
                
                state_path = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "datasets", f"browser_state_{session_id}.json"))
                if os.path.exists(state_path):
                    context = await browser.new_context(storage_state=state_path, **context_args)
                else:
                    context = await browser.new_context(**context_args)

                if not skip_scrolling:
                    # ── Phase 1: Find advertiser ID ───────────────────────────
                    page = await context.new_page()
                    advertiser_id = current_state.advertiser_id
                    
                    if not advertiser_id:
                        domain_url = f"https://adstransparency.google.com/?region={region}&domain={domain}"
                        print(f"[Scraper] Navigating to domain URL: {domain_url}")
                        session_store[session_id]["progress"] = 5
                        await self._goto_with_retry(page, domain_url)
                        await human_delay(2, 5)

                        try:
                            print(f"[Scraper] Waiting for creative-preview for domain {domain}...")
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

                        for link in initial_links:
                            m = re.search(r'/advertiser/(AR\w+)/', link)
                            if m:
                                advertiser_id = m.group(1)
                                print(f"[Scraper] Advertiser ID: {advertiser_id}")
                                current_state.advertiser_id = advertiser_id
                                current_state.current_phase = "advertiser_found"
                                await self.checkpoint_mgr.save_checkpoint(current_state)
                                break

                    # ── Phase 2: Navigate to advertiser listing page ──────────
                    adv_url = (
                        f"https://adstransparency.google.com/advertiser/{advertiser_id}?region={region}"
                        if advertiser_id else f"https://adstransparency.google.com/?region={region}&domain={domain}"
                    )
                    await self._goto_with_retry(page, adv_url)
                    await human_delay(2, 4)

                    # Wait for Google to render the first batch of ads (typically 20-40)
                    try:
                        await page.wait_for_function(
                            "document.querySelectorAll('creative-preview').length >= 20",
                            timeout=30000
                        )
                        initial_count = await page.evaluate("document.querySelectorAll('creative-preview').length")
                        print(f"[Scraper] Initial batch loaded: {initial_count} creative-preview elements visible")
                    except Exception:
                        # If fewer than 20 loaded, check if any loaded at all
                        initial_count = await page.evaluate("document.querySelectorAll('creative-preview').length")
                        print(f"[Scraper] Initial batch timeout — {initial_count} elements visible, proceeding anyway")

                    session_store[session_id]["progress"] = 15
                    current_state.progress = 15
                    current_state.current_phase = "scrolling"
                    await self.checkpoint_mgr.save_checkpoint(current_state)

                    # ── Phase 3: Scroll to collect ALL creative tile hrefs ─────
                    print(f"[Scraper] Phase 3: Collecting up to {max_ads} tiles (Google shows 800+ for gocolors)")
                    session_store[session_id]["currentPhase"] = "scrolling"
                    
                    # Restore scroll parameters from checkpoint
                    collected_hrefs = current_state.collected_hrefs
                    no_new_streak = current_state.no_new_streak
                    scroll_round = current_state.scroll_round
                    MAX_NO_NEW_STREAK = 15

                    while len(collected_hrefs) < max_ads and no_new_streak < MAX_NO_NEW_STREAK:
                        if session_store.get(session_id, {}).get("status") in ("paused", "stopped"):
                            print(f"[Scraper] Stopped/Paused by user during Phase 3 (scrolling). Halted.")
                            break
                        tiles = await page.evaluate("""() => {
                            const previews = document.querySelectorAll('creative-preview');
                            const results = [];
                            previews.forEach(el => {
                                const link = el.querySelector('a[href*="/creative/"]');
                                const href = link ? link.href : '';
                                // Secondary extraction: use data attributes if href-based ID is empty
                                let creativeId = href.match(/creative\/(CR[\w-]+)/)?.[1] || '';
                                if (!creativeId) {
                                    const dataId = el.getAttribute('data-creative-id') ||
                                                   el.querySelector('[data-creative-id]')?.getAttribute('data-creative-id') ||
                                                   el.getAttribute('data-id') || '';
                                    if (dataId) creativeId = dataId;
                                }
                                // Last resort: generate ID from href to avoid losing the tile
                                if (!creativeId && href) {
                                    creativeId = 'href_' + btoa(href).slice(0, 16).replace(/[^a-zA-Z0-9]/g, '');
                                }
                                const imgs = Array.from(el.querySelectorAll('img'))
                                    .map(i => i.src || i.getAttribute('src') || i.getAttribute('data-src') || '')
                                    .filter(s => {
                                        if (!s || !s.startsWith('http')) return false;
                                        if (s.includes('data:image')) return false;
                                        if (s.endsWith('.svg') && s.includes('icon')) return false;
                                        // Accept all Google-served and external creative images
                                        return (
                                            s.includes('googlesyndication') ||
                                            s.includes('googleusercontent') ||
                                            s.includes('googleapis.com') ||
                                            s.includes('gstatic.com') ||
                                            s.includes('ggpht.com') ||
                                            s.includes('doubleclick') ||
                                            s.includes('adwords-creative') ||
                                            s.includes('google.com/ads') ||
                                            (s.startsWith('https') && el.closest('creative-preview') !== null)
                                        );
                                    });

                                // Also capture background-image CSS from any child element
                                const bgImgs = Array.from(el.querySelectorAll('[style*="background-image"]'))
                                    .map(bgEl => {
                                        const m = bgEl.style.backgroundImage.match(/url\(["']?([^"')]+)["']?\)/);
                                        return m ? m[1] : '';
                                    })
                                    .filter(s => s && s.startsWith('http'));

                                const allImgs = [...new Set([...imgs, ...bgImgs])];
                                const textNodes = Array.from(el.querySelectorAll('div, span, p, [role="heading"]'))
                                    .filter(e => {
                                        const c = e.className || '';
                                        return typeof c === 'string' && 
                                               !c.includes('material-icons') && 
                                               !c.includes('google-symbols') && 
                                               !c.includes('mat-icon') &&
                                               !c.includes('icon');
                                    })
                                    .map(e => (e.innerText || '').trim())
                                    .filter(t => {
                                        const low = t.toLowerCase();
                                        return t.length > 5 && t.length < 500 &&
                                               low !== 'videocam' &&
                                               low !== 'keyboard_arrow_right' &&
                                               low !== 'play_arrow' &&
                                               low !== 'volume_up' &&
                                               low !== 'volume_off' &&
                                               !low.includes('material-icons') &&
                                               !low.includes('google-symbols');
                                    })
                                    .filter((t, i, arr) => arr.indexOf(t) === i);
                                
                                // Check if the ad contains a video element or play indicators on the tile itself
                                const hasVideo = el.querySelector('video') !== null || 
                                                 el.querySelector('[class*="video"]') !== null ||
                                                 el.querySelector('svg') !== null ||
                                                 el.querySelector('button') !== null ||
                                                 el.querySelector('[class*="play"]') !== null;
                                
                                if (creativeId) {
                                    results.push({ creativeId, href, images: allImgs, textNodes, hasVideo });
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
                            "currentPhase": "scrolling",
                            "currentAd": {
                                "headline": f"Scanning Google Ads Transparency... ({new_count} tiles found)",
                                "ctaText": f"Scroll round {scroll_round + 1}",
                                "adFormat": "image",
                            },
                        })

                        current_state.collected_hrefs = collected_hrefs
                        current_state.scroll_round = scroll_round
                        current_state.no_new_streak = no_new_streak
                        current_state.progress = min(progress, 45)

                        # Write state & sessions.csv incrementally
                        if scroll_round % 10 == 0:
                            await self.checkpoint_mgr.save_checkpoint(current_state)
                            await self.csv_writer.append_session(current_state.model_dump())

                        if new_count == prev_count:
                            no_new_streak += 1
                            print(f"[Scraper] No new ads streak: {no_new_streak}/{MAX_NO_NEW_STREAK}")

                            # Record DOM node count BEFORE recovery attempt
                            nodes_before = await page.evaluate("document.querySelectorAll('creative-preview').length")

                            # Recovery: scroll to absolute bottom to trigger Google's IntersectionObserver
                            await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                            await asyncio.sleep(1.5)

                            # Scroll back up 800px and back down — triggers the scroll listener mid-page
                            await page.evaluate("window.scrollBy(0, -800)")
                            await asyncio.sleep(0.8)
                            await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                            await asyncio.sleep(1.5)

                            # Wait up to 6 seconds for Google to inject new creative-preview nodes
                            try:
                                await page.wait_for_function(
                                    f"document.querySelectorAll('creative-preview').length > {nodes_before}",
                                    timeout=6000
                                )
                                print(f"[Scraper] Recovery succeeded — new nodes appeared after streak {no_new_streak}")
                                no_new_streak = 0  # Reset streak because DOM grew
                            except Exception:
                                print(f"[Scraper] Recovery timeout — DOM still at {nodes_before} nodes")
                                await asyncio.sleep(random.uniform(2.0, 4.0))
                        else:
                            no_new_streak = 0

                        if new_count >= max_ads:
                            print(f"[Scraper] Reached max_ads={max_ads}")
                            break

                        # Scroll in 3 overlapping steps of 800px each
                        # This keeps the viewport in the IntersectionObserver trigger zone
                        for _ in range(3):
                            if session_store.get(session_id, {}).get("status") in ("paused", "stopped"):
                                break
                            step_px = random.randint(700, 900)
                            await page.evaluate(f"window.scrollBy(0, {step_px})")
                            await asyncio.sleep(random.uniform(0.3, 0.6))

                        scroll_round += 1

                    print(f"[Scraper] Collected {len(collected_hrefs)} creative tiles — proceeding to detail extraction")
                    await page.close()

                    # Save final Phase 3 completed checkpoint
                    current_state.current_phase = "extracting"
                    current_state.collected_hrefs = collected_hrefs
                    await self.checkpoint_mgr.save_checkpoint(current_state)
                    await self.csv_writer.append_session(current_state.model_dump())
                else:
                    # Restore complete Phase 3 scroll state
                    collected_hrefs = current_state.collected_hrefs
                    print(f"[Scraper] Resuming Phase 4 directly. Loaded {len(collected_hrefs)} creative tiles.")

                session_store[session_id]["currentPhase"] = "extracting"


                # If Playwright yielded no results or was blocked, set status to blocked (strict real-data policy)
                if len(collected_hrefs) == 0:
                    print(f"[Scraper] Google returned 0 ads for domain '{domain}'. Anti-bot controls triggered or no active campaigns. Setting session status to blocked.")
                    session_store[session_id].update({
                        "status": "blocked",
                        "progress": 100,
                        "blockReason": (
                            f"Google returned 0 ads for '{domain}'. The scraping session was likely blocked by rate limits or security controls. "
                            "Please check the domain spelling, ensure you are using standard region codes, or consider integrating a commercial API service (such as SerpApi) for large-scale production scraping."
                        )
                    })
                    current_state.status = "blocked"
                    current_state.progress = 100
                    await self.checkpoint_mgr.save_checkpoint(current_state)
                    await self.csv_writer.append_session(current_state.model_dump())
                    return

                # ── Phase 4: Open each detail page for full data ──────────
                ads = list(current_state.processed_ads)
                tile_list = list(collected_hrefs.values())[:max_ads]
                brand_name = domain.split(".")[0].replace("-", " ").title()

                is_stopped = session_store.get(session_id, {}).get("status") in ("paused", "stopped")

                if is_stopped:
                    print(f"[Scraper] Session stopped before Phase 4. Building partial ads from collected tiles.")
                    processed_hashes = {a["contentHash"] for a in ads}
                    for idx, tile in enumerate(tile_list):
                        content_hash = hashlib.sha256(tile["creativeId"].encode()).hexdigest()[:16]
                        if content_hash in processed_hashes:
                            continue
                        ad = self._build_ad_from_tile(tile, domain, session_id, brand_name, idx)
                        ads.append(ad)
                else:

                    for i, tile in enumerate(tile_list):
                        if session_store.get(session_id, {}).get("status") in ("paused", "stopped"):
                            print(f"[Scraper] Stopped/Paused by user during Phase 4 (extraction). Halted.")
                            is_stopped = True
                            # Convert remaining tiles to basic ads so user gets all ads collected so far
                            processed_hashes = {a["contentHash"] for a in ads}
                            for j, t in enumerate(tile_list[i:]):
                                content_hash = hashlib.sha256(t["creativeId"].encode()).hexdigest()[:16]
                                if content_hash in processed_hashes:
                                    continue
                                ad = self._build_ad_from_tile(t, domain, session_id, brand_name, i + j)
                                ads.append(ad)
                            break

                        content_hash = hashlib.sha256(tile["creativeId"].encode()).hexdigest()[:16]
                        if content_hash in self.seen_hashes:
                            continue
                        self.seen_hashes.add(content_hash)

                        # Tiered extraction: only deep extract video ads, ads missing key metadata, or 20% sample
                        should_deep_extract = (
                            tile.get("hasVideo") or
                            len(tile.get("textNodes", [])) < 2 or
                            (i % 5 == 0)
                        )

                        try:
                            if should_deep_extract:
                                detail_context = await browser.new_context(**context_args)
                                detail_page = await detail_context.new_page()
                                try:
                                    ad = await self._extract_detail_page(
                                        detail_page, tile, domain, session_id, brand_name, i,
                                        media_dir, download_media
                                    )
                                finally:
                                    await detail_page.close()
                                    await detail_context.close()
                            else:
                                ad = self._build_ad_from_tile(tile, domain, session_id, brand_name, i)
                            ads.append(ad)
                        except Exception as e:
                            print(f"[Scraper] Detail page failed for {tile['creativeId']}: {e}")
                            # Fall back to tile-only data without crashing
                            ad = self._build_ad_from_tile(tile, domain, session_id, brand_name, i)
                            ads.append(ad)

                        # Update in-memory session store incrementally (including ads list)
                        prog = min(45 + int((i + 1) / len(tile_list) * 53), 98)
                        session_store[session_id].update({
                            "ads": ads,
                            "adsExtracted": len(ads),
                            "imagesFound": sum(len(a.get("imageUrls", [])) for a in ads),
                            "videosFound": sum(len(a.get("videoUrls", [])) for a in ads),
                            "progress": prog,
                            "currentAd": {
                                "headline": ad.get("headline", ""),
                                "ctaText": ad.get("ctaText", ""),
                                "adFormat": ad.get("adFormat", "image"),
                            },
                        })

                        # Update checkpoint state & save
                        current_state.processed_ads = ads
                        current_state.seen_hashes = list(self.seen_hashes)
                        current_state.downloaded_media_urls = list(self.downloaded_media_urls)
                        current_state.ads_extracted = len(ads)
                        current_state.images_found = sum(len(a.get("imageUrls", [])) for a in ads)
                        current_state.videos_found = sum(len(a.get("videoUrls", [])) for a in ads)
                        current_state.progress = prog
                        
                        await self.checkpoint_mgr.save_checkpoint(current_state)

                        # Incremental CSV logs
                        await self.csv_writer.append_processed_ad(session_id, tile["creativeId"], content_hash, success=True)
                        await self.csv_writer.append_ad_data(ad)
                        await self.csv_writer.append_session(current_state.model_dump())

                        # Rate-limit protection: optimized delay between detail pages
                        await human_delay(0.4, 0.8)
                        # Extra pause every 50 ads instead of 20
                        if (i + 1) % 50 == 0:
                            pause = random.uniform(1.5, 3.0)
                            print(f"[Scraper] Brief rate-limit pause: {pause:.1f}s after {i+1} ads")
                            await asyncio.sleep(pause)



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

                status_to_set = "paused" if session_store[session_id].get("status") in ("paused", "stopped") else "complete"
                session_store[session_id].update({
                    "status": status_to_set, 
                    "progress": 100 if status_to_set == "complete" else session_store[session_id].get("progress", 100),
                    "completedAt": datetime.utcnow().isoformat(),
                    "ads": ads, "adsExtracted": len(ads),
                    "imagesFound": sum(len(a.get("imageUrls", [])) for a in ads),
                    "videosFound": sum(len(a.get("videoUrls", [])) for a in ads),
                })
                
                # Update final session complete checkpoint
                current_state.status = status_to_set
                current_state.progress = 100 if status_to_set == "complete" else current_state.progress
                current_state.completed_at = datetime.utcnow().isoformat()
                await self.checkpoint_mgr.save_checkpoint(current_state)
                await self.csv_writer.append_session(current_state.model_dump())
                
                print(f"[Scraper] ✓ Session {session_id}: {len(ads)} ads extracted (status: {status_to_set})")

        except Exception as e:
            import traceback
            print(f"[Scraper] Fatal error: {e}")
            traceback.print_exc()
            errors = session_store[session_id].get("errorsCount", 0) + 1
            session_store[session_id].update({
                "status": "error", "progress": 100,
                "errorsCount": errors,
            })
            
            # Save fatal error state checkpoint
            current_state.status = "error"
            current_state.errors_count = errors
            await self.checkpoint_mgr.save_checkpoint(current_state)
            await self.csv_writer.append_session(current_state.model_dump())
        finally:
            if context:
                try:
                    state_path = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "datasets", f"browser_state_{session_id}.json"))
                    await context.storage_state(path=state_path)
                except Exception as e:
                    print(f"[Scraper] Could not save browser state: {e}")
            
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
                await page.goto(detail_url, wait_until="domcontentloaded", timeout=15000)
                await human_delay(0.5, 1.2)

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

                # Extract video sources across all frames (including nested iframes)
                video_srcs = []
                for frame in page.frames:
                    try:
                        srcs = await frame.evaluate("""() => {
                            const found = [];
                            document.querySelectorAll('video source, video').forEach(v => {
                                const s = v.src || v.getAttribute('src');
                                if (s && s.startsWith('http')) found.push(s);
                            });
                            document.querySelectorAll('iframe').forEach(f => {
                                const s = f.src || f.getAttribute('src');
                                if (s && (s.includes('googleusercontent') || s.includes('youtube') || s.includes('googlesyndication') || s.includes('play-creative') || s.includes('doubleclick'))) {
                                    found.push(s);
                                }
                            });
                            return [...new Set(found)];
                        }""")
                        if srcs:
                            for s in srcs:
                                if s not in video_srcs:
                                    video_srcs.append(s)
                    except Exception:
                        pass
                video_urls = video_srcs[:3]

                # Extract image elements across all frames on detail page
                detail_images = []
                for frame in page.frames:
                    try:
                        imgs = await frame.evaluate("""() => {
                            const found = [];
                            document.querySelectorAll('img').forEach(i => {
                                const s = i.src || i.getAttribute('src');
                                if (s && s.startsWith('http') && s.includes('googlesyndication')) found.push(s);
                            });
                            return [...new Set(found)];
                        }""")
                        if imgs:
                            for img in imgs:
                                if img not in detail_images:
                                    detail_images.append(img)
                    except Exception:
                        pass
                
                # Merge tile images with detail page images
                all_images = list(tile.get("images", []))
                for img in detail_images:
                    if img not in all_images:
                        all_images.append(img)
                tile["images"] = all_images

            except Exception as e:
                print(f"[Detail] Failed to load {detail_url}: {e}")

        # Ensure tile_images uses the merged list
        tile_images = tile.get("images", [])

        # If headline still empty, fall back to tile text
        if not headline:
            text_nodes = [
                t for t in tile.get("textNodes", [])
                if not any(skip in t.lower() for skip in ["verified", "private limited", "limited"])
            ]
            headline = text_nodes[0] if text_nodes else f"{brand_name} Ad {index + 1}"
            description = " ".join(text_nodes[1:])[:300] if len(text_nodes) > 1 else ""

        # ── Download media ────────────────────────────────────────────────
        if download_media and tile_images:
            local_image_paths = await self._download_images(
                tile_images, media_dir, tile["creativeId"]
            )

        if download_media and video_urls:
            local_video_paths = await self._download_videos(
                video_urls, media_dir, tile["creativeId"]
            )

        # Convert local absolute paths to served web URLs
        web_image_paths = [self._map_local_path_to_web_url(p) for p in local_image_paths]
        web_video_paths = [self._map_local_path_to_web_url(p) for p in local_video_paths]

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
            "localImagePaths": web_image_paths,
            "localVideoPaths": web_video_paths,
            "offerText": self._extract_offer(full_text),
            "emotionalTriggers": self._detect_triggers(full_text),
            "dominantColors": ["#f3f4f6", "#111827"],
            "productMentions": self._extract_products(full_text),
            "fashionCategory": self._classify_fashion(full_text),
            "creativeType": "Video" if video_urls else ("Display" if tile_images else "Text"),
            "adPreviewAsset": web_image_paths[0] if web_image_paths else (tile_images[0] if tile_images else ""),
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
                for i, url in enumerate(urls[:3]):  # Capped at 3 images per ad for performance
                    if url in self.downloaded_media_urls:
                        print(f"[Download] Skipping duplicate image URL: {url[:60]}")
                        continue
                    
                    try:
                        ext = "jpg" if "jpg" in url.lower() or "jpeg" in url.lower() else "png"
                        filename = f"{creative_id}_{i}.{ext}"
                        filepath = os.path.join(images_dir, filename)

                        async with session.get(url) as resp:
                            if resp.status == 200:
                                async with aiofiles.open(filepath, "wb") as f:
                                    async for chunk in resp.content.iter_chunked(65536):
                                        await f.write(chunk)
                                saved_paths.append(filepath)
                                self.downloaded_media_urls.add(url)
                                await self.csv_writer.append_download(url, "image", filepath, "success", creative_id)
                                await asyncio.sleep(random.uniform(0.3, 0.8))
                            else:
                                await self.csv_writer.append_download(url, "image", "", f"status_{resp.status}", creative_id)
                    except Exception as img_err:
                        print(f"[Download] Image failed ({url[:60]}): {img_err}")
                        await self.csv_writer.append_download(url, "image", "", "failed", creative_id)
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
                for i, url in enumerate(urls[:1]):  # Capped at 1 video per ad for performance
                    if "youtube" in url or "youtu.be" in url:
                        continue  # Skip YouTube iframe embeds
                    if url in self.downloaded_media_urls:
                        print(f"[Download] Skipping duplicate video URL: {url[:60]}")
                        continue

                    try:
                        ext = "mp4"
                        filename = f"{creative_id}_{i}.{ext}"
                        filepath = os.path.join(videos_dir, filename)

                        async with session.get(url) as resp:
                            if resp.status == 200:
                                async with aiofiles.open(filepath, "wb") as f:
                                    async for chunk in resp.content.iter_chunked(65536):
                                        await f.write(chunk)
                                saved_paths.append(filepath)
                                self.downloaded_media_urls.add(url)
                                await self.csv_writer.append_download(url, "video", filepath, "success", creative_id)
                            else:
                                await self.csv_writer.append_download(url, "video", "", f"status_{resp.status}", creative_id)
                    except Exception as vid_err:
                        print(f"[Download] Video failed ({url[:60]}): {vid_err}")
                        await self.csv_writer.append_download(url, "video", "", "failed", creative_id)
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
        async with aiofiles.open(path, "w") as f:
            data = {
                "sessionId": session_id, "domain": domain,
                "capturedAt": datetime.utcnow().isoformat(),
                "adsCount": len(ads), "ads": ads,
            }
            await f.write(json.dumps(data, indent=2))
        print(f"[Scraper] Snapshot saved: {path}")

    def _map_local_path_to_web_url(self, local_path: str) -> str:
        """Convert a local absolute filesystem path to a served FastAPI static web URL."""
        if not local_path:
            return ""
        # Find where "datasets" is in the path
        marker = os.path.join("competitor_scraper", "datasets")
        if marker in local_path:
            parts = local_path.split(marker)
            relative_url = "/datasets" + parts[-1].replace("\\", "/")
            return f"http://localhost:8001{relative_url}"
        elif "datasets" in local_path:
            parts = local_path.split("datasets")
            relative_url = "/datasets" + parts[-1].replace("\\", "/")
            return f"http://localhost:8001{relative_url}"
        return local_path

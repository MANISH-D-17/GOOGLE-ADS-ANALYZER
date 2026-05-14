import uuid
import hashlib
from datetime import datetime
from playwright.async_api import Page

class AdExtractor:
    """Extracts ad data from Google Ads Transparency Center page."""

    async def extract_ads(self, page: Page, domain: str, session_id: str) -> list:
        ads = []
        try:
            # Try to find ad card containers (selectors may vary with Google's DOM)
            cards = await page.query_selector_all('[data-creative-id], .creative-card, [class*="ad-card"]')
            if not cards:
                # Fallback: look for any visible card-like containers
                cards = await page.query_selector_all('section, article, [role="listitem"]')

            for card in cards:
                try:
                    ad = await self._extract_single_ad(card, domain, session_id)
                    if ad:
                        ads.append(ad)
                except Exception:
                    continue
        except Exception as e:
            print(f"[Extractor] Error: {e}")
        return ads

    async def _extract_single_ad(self, card, domain: str, session_id: str) -> dict | None:
        try:
            # Extract text content
            headline = await self._safe_text(card, 'h1, h2, h3, [class*="headline"], [class*="title"]')
            description = await self._safe_text(card, 'p, [class*="description"], [class*="body"]')
            cta = await self._safe_text(card, 'button, a[class*="cta"], [class*="call-to-action"]')
            landing_url = await self._safe_attr(card, 'a', 'href') or f"https://{domain}"

            # Extract media
            images = await card.evaluate("""el => Array.from(el.querySelectorAll('img')).map(i => i.src).filter(s => s && !s.startsWith('data:'))""")
            videos = await card.evaluate("""el => Array.from(el.querySelectorAll('video source, video')).map(v => v.src || v.getAttribute('src')).filter(Boolean)""")

            # Date info
            date_text = await self._safe_text(card, '[class*="date"], time')

            if not headline and not description:
                return None

            content_str = f"{headline}{description}{cta}{landing_url}"
            content_hash = hashlib.sha256(content_str.encode()).hexdigest()[:16]

            return {
                "id": f"ad_{uuid.uuid4().hex[:8]}",
                "sessionId": session_id,
                "brand": domain.split('.')[0].title(),
                "domain": domain,
                "headline": headline or "",
                "description": description or "",
                "ctaText": cta or "Learn More",
                "landingUrl": landing_url,
                "adFormat": "video" if videos else ("image" if images else "text"),
                "firstSeen": date_text or datetime.utcnow().strftime('%Y-%m-%d'),
                "lastSeen": datetime.utcnow().strftime('%Y-%m-%d'),
                "imageUrls": images[:3],
                "videoUrls": videos[:2],
                "offerText": self._extract_offer(headline + " " + description),
                "emotionalTriggers": self._detect_triggers(headline + " " + description),
                "dominantColors": [],
                "productMentions": [],
                "fashionCategory": "General",
                "creativeType": "Standard",
                "adPreviewAsset": images[0] if images else "",
                "contentHash": content_hash,
                "extractedAt": datetime.utcnow().isoformat(),
            }
        except Exception:
            return None

    async def _safe_text(self, el, selector: str) -> str:
        try:
            node = await el.query_selector(selector)
            return (await node.inner_text()).strip() if node else ""
        except Exception:
            return ""

    async def _safe_attr(self, el, selector: str, attr: str) -> str:
        try:
            node = await el.query_selector(selector)
            return (await node.get_attribute(attr) or "").strip() if node else ""
        except Exception:
            return ""

    def _extract_offer(self, text: str) -> str:
        import re
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
            'exclusivity': ['exclusive', 'limited edition', 'only'],
            'comfort': ['comfort', 'soft', 'cozy', 'relax'],
        }
        found = [k for k, words in triggers.items() if any(w in text_lower for w in words)]
        return found

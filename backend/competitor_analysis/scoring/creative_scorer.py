"""
Creative Scorer — AI scoring engine for competitor ads
Returns 0–100 scores across 6 dimensions
"""
import re


class CreativeScorer:

    def score(self, ad: dict) -> dict:
        """Score a single ad across all dimensions."""
        headline = ad.get("headline", "")
        description = ad.get("description", "")
        cta = ad.get("ctaText", "")
        triggers = ad.get("emotionalTriggers", [])
        images = ad.get("imageUrls", [])
        offer = ad.get("offerText", "")

        creative_score = self._score_creative(headline, description, images)
        emotional_score = self._score_emotional(triggers, headline)
        cta_score = self._score_cta(cta)
        visual_score = self._score_visual(images)
        keyword_strength = self._score_keywords(headline, description)

        composite = round(
            (creative_score * 0.25 + emotional_score * 0.2 +
             cta_score * 0.2 + visual_score * 0.2 + keyword_strength * 0.15), 1
        )

        return {
            "creative_score": creative_score,
            "emotional_score": emotional_score,
            "cta_score": cta_score,
            "visual_score": visual_score,
            "keyword_strength": keyword_strength,
            "composite_score": composite,
        }

    def _score_creative(self, headline: str, desc: str, images: list) -> float:
        score = 40.0
        if len(headline) > 20: score += 15
        if len(headline) > 40: score += 10
        if desc and len(desc) > 30: score += 10
        if images: score += 20
        if len(images) > 1: score += 5
        return min(round(score, 1), 100.0)

    def _score_emotional(self, triggers: list, headline: str) -> float:
        score = 30.0
        score += min(len(triggers) * 12, 40)
        power_words = ["exclusive", "limited", "now", "free", "save", "best", "premium"]
        matches = sum(1 for w in power_words if w in headline.lower())
        score += matches * 6
        return min(round(score, 1), 100.0)

    def _score_cta(self, cta: str) -> float:
        if not cta:
            return 20.0
        score = 50.0
        strong_ctas = ["shop now", "buy now", "order now", "get now", "explore"]
        if any(c in cta.lower() for c in strong_ctas): score += 30
        if len(cta.split()) <= 3: score += 10
        urgency = ["now", "today", "limited", "hurry"]
        if any(u in cta.lower() for u in urgency): score += 10
        return min(round(score, 1), 100.0)

    def _score_visual(self, images: list) -> float:
        if not images:
            return 20.0
        score = 60.0
        score += min(len(images) * 15, 30)
        google_cdn = sum(1 for img in images if "googlesyndication" in img)
        if google_cdn: score += 10
        return min(round(score, 1), 100.0)

    def _score_keywords(self, headline: str, desc: str) -> float:
        text = f"{headline} {desc}".lower()
        fashion_kws = [
            "collection", "style", "fashion", "color", "wear", "comfort",
            "latest", "new", "exclusive", "premium", "affordable"
        ]
        matches = sum(1 for k in fashion_kws if k in text)
        return min(round(30 + matches * 7, 1), 100.0)

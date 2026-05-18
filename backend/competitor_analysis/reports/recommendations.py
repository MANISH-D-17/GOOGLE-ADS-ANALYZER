"""
AI Recommendations Engine
Generates actionable intelligence from competitor data analysis
"""
from collections import Counter


RECOMMENDATION_TEMPLATES = {
    "cta": {
        "type": "cta",
        "priority": "high",
        "title": "Upgrade Your CTA Strategy",
        "description": "Competitor uses action-oriented CTAs with urgency triggers. Your CTAs lack specificity.",
        "actionItems": [
            "Replace generic 'Learn More' with 'Shop the Collection Now'",
            "Add social proof: 'Join 1M+ Happy Customers'",
            "Test urgency: 'Today Only — 40% OFF'",
            "Use benefit-first CTAs: 'Get Free Delivery Today'",
        ],
        "impactScore": 0.85,
    },
    "creative": {
        "type": "creative",
        "priority": "high",
        "title": "Improve Visual Creative Quality",
        "description": "Competitor runs 70%+ image ads with vibrant product photography. Increase visual ad volume.",
        "actionItems": [
            "Increase image ad ratio to 70%+ of total ads",
            "Use lifestyle imagery showing product in real use",
            "Test bright, high-contrast color palettes",
            "Add offer overlays directly on creative",
        ],
        "impactScore": 0.82,
    },
    "keyword": {
        "type": "keyword",
        "priority": "medium",
        "title": "Exploit Keyword Gaps",
        "description": "Competitor targets high-volume fashion intent keywords you're missing.",
        "actionItems": [
            "Add long-tail: 'affordable women leggings India'",
            "Target competitor brand + style keywords",
            "Expand into 'plus size fashion India' segment",
            "Test RLSA campaigns for competitor site visitors",
        ],
        "impactScore": 0.75,
    },
    "offer": {
        "type": "offer",
        "priority": "medium",
        "title": "Strengthen Promotional Offers",
        "description": "Competitor uses structured discount patterns in 30%+ of ads. Align promotional calendar.",
        "actionItems": [
            "Launch 'Free Shipping on First Order' campaign",
            "Test flat discount messaging: 'Flat ₹200 Off'",
            "Create bundle offers: 'Buy 3 Get 1 Free'",
            "Align promos with festive calendar (Dussehra, Diwali)",
        ],
        "impactScore": 0.72,
    },
    "positioning": {
        "type": "positioning",
        "priority": "low",
        "title": "Differentiate Product Positioning",
        "description": "Competitor focuses on color variety. Differentiate on comfort, size inclusivity, and quality.",
        "actionItems": [
            "Lead with 'Sizes XS to 5XL' inclusivity message",
            "Highlight premium fabric sourcing",
            "Test 'comfort first' messaging in headlines",
            "Create separate campaigns for different body types",
        ],
        "impactScore": 0.65,
    },
}


class RecommendationEngine:

    def generate(self, ads: list[dict], benchmark: dict, keywords: list[dict]) -> list[dict]:
        recs = []

        # Always include CTA and creative recs
        recs.append(RECOMMENDATION_TEMPLATES["cta"])
        recs.append(RECOMMENDATION_TEMPLATES["creative"])

        # Keyword gap if competitor has more keywords
        if benchmark.get("competitor_keyword_count", 0) > benchmark.get("my_keyword_count", 0):
            recs.append(RECOMMENDATION_TEMPLATES["keyword"])

        # Offer rec if competitor uses offers
        offers = [a for a in ads if a.get("offerText")]
        if len(offers) > len(ads) * 0.2:
            recs.append(RECOMMENDATION_TEMPLATES["offer"])

        # Positioning rec if my score is behind
        if benchmark.get("competitor_creative_score", 0) > benchmark.get("my_creative_score", 0):
            recs.append(RECOMMENDATION_TEMPLATES["positioning"])

        # Dynamic headline recommendations
        if ads:
            top_headline_words = self._top_words([a.get("headline", "") for a in ads])
            recs.append({
                "type": "headline",
                "priority": "medium",
                "title": "Adopt Competitor's Winning Headline Patterns",
                "description": f"Competitor's top-performing headline themes: {', '.join(top_headline_words[:4])}",
                "actionItems": [
                    f"Test headlines using: '{top_headline_words[0]}' if available",
                    "Use 'New Arrival' framing for seasonal pushes",
                    "Lead with product benefit, not brand name",
                    "Keep headlines under 50 characters for mobile",
                ],
                "impactScore": 0.70,
            })

        return recs

    def _top_words(self, headlines: list[str]) -> list[str]:
        stop = {"the", "a", "an", "and", "or", "in", "on", "at", "your", "our", "my", "we"}
        all_words = []
        for h in headlines:
            all_words.extend([w.lower() for w in h.split() if w.lower() not in stop and len(w) > 3])
        counter = Counter(all_words)
        return [w for w, _ in counter.most_common(10)]

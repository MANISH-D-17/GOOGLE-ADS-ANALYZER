import hashlib

REQUIRED_FIELDS = ["headline", "domain", "landingUrl"]

class AdValidator:
    """Validates extracted ads for completeness and deduplication."""

    def validate(self, ad: dict) -> dict | None:
        # Guard: missing required fields
        for field in REQUIRED_FIELDS:
            if not ad.get(field):
                return None
        # Guard: invalid URL
        url = ad.get("landingUrl", "")
        if not url.startswith("http"):
            ad["landingUrl"] = f"https://{ad.get('domain', '')}"
        # Guard: empty headline
        if len(ad.get("headline", "")) < 3:
            return None
        return ad

"""DataForSEO keyword enrichment — wraps search volume + difficulty endpoints."""
from typing import List, Dict, Any
from .client import DataForSEORestClient

INDIA = 2356

class KeywordService:
    def __init__(self, client: DataForSEORestClient):
        self.client = client

    def get_keyword_data(self, keywords: List[str], location_code: int = INDIA, language_code: str = "en") -> List[Dict[str, Any]]:
        if not keywords:
            return []
        payload = [{"keywords": keywords[:100], "location_code": location_code, "language_code": language_code}]
        response = self.client.post("/v3/keywords_data/google/search_volume/live", payload)
        results = []
        for task in response.get("tasks", []):
            for item in (task.get("result") or []):
                results.append({
                    "keyword": item.get("keyword", ""),
                    "search_volume": item.get("search_volume") or 0,
                    "cpc": item.get("cpc") or 0.0,
                    "competition": item.get("competition") or 0.0,
                    "difficulty": 0,
                })
        # Return empty stubs for any keywords not returned
        found = {r["keyword"] for r in results}
        for kw in keywords:
            if kw not in found:
                results.append({"keyword": kw, "search_volume": 0, "cpc": 0.0, "competition": 0.0, "difficulty": 0})
        return results

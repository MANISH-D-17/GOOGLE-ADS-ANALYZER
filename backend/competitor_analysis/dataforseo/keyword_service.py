from typing import List, Dict, Any
from .client import DataForSEORestClient

class KeywordService:
    def __init__(self, client: DataForSEORestClient):
        self.client = client

    async def get_keyword_data(self, keywords: List[str], location_code: int = 2840, language_code: str = "en") -> List[Dict[str, Any]]:
        """
        Fetch search volume, CPC, and competition for a list of keywords.
        Using Google Ads -> Keyword Data -> Live
        """
        path = "/v3/keywords_data/google/ad_words/status" # Example path, actually we need /v3/keywords_data/google/search_volume/live
        # The correct path for search volume is: /v3/keywords_data/google/search_volume/live
        path = "/v3/keywords_data/google/search_volume/live"
        
        post_data = []
        for kw in keywords:
            post_data.append({
                "keywords": [kw],
                "location_code": location_code,
                "language_code": language_code
            })
        
        response = await self.client.post(path, post_data)
        
        results = []
        if response.get("status_code") == 20000:
            for task in response.get("tasks", []):
                for result in task.get("result", []):
                    results.append({
                        "keyword": result.get("keyword"),
                        "search_volume": result.get("search_volume"),
                        "cpc": result.get("cpc"),
                        "competition": result.get("competition"),
                        "difficulty": result.get("keyword_difficulty"),
                        "monthly_searches": result.get("monthly_searches", [])
                    })
        return results

    async def get_related_keywords(self, keyword: str, location_code: int = 2840) -> List[Dict[str, Any]]:
        """
        Fetch related keywords using DataForSEO Labs API.
        """
        path = "/v3/dataforseo_labs/google/related_keywords/live"
        post_data = [{
            "keyword": keyword,
            "location_code": location_code,
            "limit": 20
        }]
        
        response = await self.client.post(path, post_data)
        
        results = []
        if response.get("status_code") == 20000:
            for task in response.get("tasks", []):
                for result in task.get("result", []):
                    for item in result.get("items", []):
                        results.append({
                            "keyword": item.get("keyword"),
                            "search_volume": item.get("keyword_info", {}).get("search_volume"),
                            "cpc": item.get("keyword_info", {}).get("cpc"),
                            "relevance": item.get("relevance")
                        })
        return results

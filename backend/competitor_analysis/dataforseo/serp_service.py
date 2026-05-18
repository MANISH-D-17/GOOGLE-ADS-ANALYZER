from typing import List, Dict, Any
from .client import DataForSEORestClient

class SERPService:
    def __init__(self, client: DataForSEORestClient):
        self.client = client

    async def get_serp_results(self, keyword: str, location_code: int = 2840, language_code: str = "en") -> List[Dict[str, Any]]:
        """
        Fetch SERP results for a keyword.
        """
        path = "/v3/serp/google/organic/live/advanced"
        post_data = [{
            "keyword": keyword,
            "location_code": location_code,
            "language_code": language_code,
            "limit": 50
        }]
        
        response = await self.client.post(path, post_data)
        
        results = []
        if response.get("status_code") == 20000:
            for task in response.get("tasks", []):
                for result in task.get("result", []):
                    for item in result.get("items", []):
                        if item.get("type") == "organic":
                            results.append({
                                "keyword": keyword,
                                "position": item.get("rank_group"),
                                "url": item.get("url"),
                                "domain": item.get("domain"),
                                "title": item.get("title"),
                                "snippet": item.get("description"),
                                "is_featured": item.get("is_featured_snippet", False)
                            })
        return results

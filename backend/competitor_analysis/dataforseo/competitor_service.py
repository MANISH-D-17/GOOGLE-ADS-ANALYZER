from typing import List, Dict, Any
from .client import DataForSEORestClient

class CompetitorService:
    def __init__(self, client: DataForSEORestClient):
        self.client = client

    async def get_competitor_keywords(self, domain: str, location_code: int = 2840) -> List[Dict[str, Any]]:
        """
        Fetch all keywords a competitor is ranking for.
        """
        path = "/v3/dataforseo_labs/google/ranked_keywords/live"
        post_data = [{
            "target": domain,
            "location_code": location_code,
            "limit": 100
        }]
        
        response = await self.client.post(path, post_data)
        
        results = []
        if response.get("status_code") == 20000:
            for task in response.get("tasks", []):
                for result in task.get("result", []):
                    for item in result.get("items", []):
                        results.append({
                            "keyword": item.get("keyword_data", {}).get("keyword"),
                            "search_volume": item.get("keyword_data", {}).get("keyword_info", {}).get("search_volume"),
                            "rank": item.get("ranked_serp_element", {}).get("serp_item", {}).get("rank_group"),
                            "is_paid": item.get("ranked_serp_element", {}).get("serp_item", {}).get("type") == "paid"
                        })
        return results

    async def get_keyword_gap(self, my_domain: str, competitor_domain: str, location_code: int = 2840) -> List[Dict[str, Any]]:
        """
        Identify keywords where the competitor ranks but I don't.
        """
        # This can be achieved by comparing two ranked_keywords results or using a specialized endpoint if available.
        # DataForSEO Labs has a 'keyword_gap' endpoint.
        path = "/v3/dataforseo_labs/google/keyword_gap/live"
        post_data = [{
            "targets": {
                "1": my_domain,
                "2": competitor_domain
            },
            "location_code": location_code,
            "limit": 100
        }]
        
        response = await self.client.post(path, post_data)
        
        results = []
        if response.get("status_code") == 20000:
            for task in response.get("tasks", []):
                for result in task.get("result", []):
                    for item in result.get("items", []):
                        # Filter for keywords where target 2 (competitor) ranks better or target 1 (me) doesn't rank.
                        results.append({
                            "keyword": item.get("keyword_data", {}).get("keyword"),
                            "search_volume": item.get("keyword_data", {}).get("keyword_info", {}).get("search_volume"),
                            "my_rank": item.get("keyword_data", {}).get("ranks", {}).get("1"),
                            "competitor_rank": item.get("keyword_data", {}).get("ranks", {}).get("2")
                        })
        return results

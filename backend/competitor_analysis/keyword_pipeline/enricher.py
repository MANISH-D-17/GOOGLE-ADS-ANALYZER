from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from ..dataforseo.client import DataForSEORestClient
from ..dataforseo.keyword_service import KeywordService
from ..dataforseo.serp_service import SERPService
from ..dataforseo.competitor_service import CompetitorService
from ..dataforseo.cache import seo_cache
from database.models import KeywordMetric, SearchIntent, RelatedKeyword
from sqlalchemy import select

class KeywordEnricher:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.client = DataForSEORestClient()
        self.keyword_service = KeywordService(self.client)
        self.serp_service = SERPService(self.client)
        self.comp_service = CompetitorService(self.client)

    async def enrich_keywords(self, keywords: List[str]) -> List[Dict[str, Any]]:
        """
        Takes a list of keywords (from NLP) and enriches them with DataForSEO metrics.
        """
        if not keywords:
            return []

        # Check cache first
        cache_key = f"enrich_{'_'.join(sorted(keywords))[:100]}"
        cached = seo_cache.get(cache_key)
        if cached:
            return cached

        # 1. Fetch metrics (volume, CPC, competition)
        metrics = await self.keyword_service.get_keyword_data(keywords)
        
        # 2. Store in DB for persistence
        for m in metrics:
            kw_term = m.get("keyword")
            if not kw_term: continue
            
            # Upsert into keyword_metrics
            existing = await self.db.execute(select(KeywordMetric).where(KeywordMetric.keyword == kw_term))
            metric_obj = existing.scalar_one_or_none()
            
            if metric_obj:
                metric_obj.search_volume = m.get("search_volume")
                metric_obj.cpc = m.get("cpc")
                metric_obj.competition = m.get("competition")
                metric_obj.difficulty = m.get("difficulty")
            else:
                new_m = KeywordMetric(
                    keyword=kw_term,
                    search_volume=m.get("search_volume"),
                    cpc=m.get("cpc"),
                    competition=m.get("competition"),
                    difficulty=m.get("difficulty")
                )
                self.db.add(new_m)

        await self.db.flush()
        seo_cache.set(cache_key, metrics)
        return metrics

    async def run_full_intelligence(self, domain: str, keywords: List[str]):
        """
        Deep enrichment: volume + SERP + gaps + related
        """
        # 1. Enrich existing NLP keywords
        enriched = await self.enrich_keywords(keywords)
        
        # 2. SERP results for top keywords
        for kw in keywords[:5]:
            serp = await self.serp_service.get_serp_results(kw)
            # Store SERP in DB (logic to be implemented in repository or here)
            # ...
        
        # 3. Keyword Gaps
        # ...
        
        await self.db.commit()
        return enriched

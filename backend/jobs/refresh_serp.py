import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from database.connection import AsyncSessionLocal
from database.models import InferredKeyword
from sqlalchemy import select, func, desc
from competitor_analysis.keyword_pipeline.enricher import KeywordEnricher

async def refresh_serp_data():
    """
    Job to refresh SERP rankings for the top keywords in the system.
    """
    print("[Job] Starting SERP data refresh...")
    async with AsyncSessionLocal() as db:
        # Get top 20 keywords across all competitors
        result = await db.execute(
            select(InferredKeyword.keyword)
            .group_by(InferredKeyword.keyword)
            .order_by(desc(func.sum(InferredKeyword.frequency)))
            .limit(20)
        )
        keywords = [r[0] for r in result.all()]
        
        if not keywords:
            print("[Job] No keywords found for SERP refresh.")
            return

        enricher = KeywordEnricher(db)
        for kw in keywords:
            print(f"[Job] Refreshing SERP for: {kw}...")
            await enricher.serp_service.get_serp_results(kw)
            # In a real scenario, we'd store these results in the SERPResult table
            # ...
        
        await db.commit()
            
    print("[Job] SERP data refresh complete.")

if __name__ == "__main__":
    asyncio.run(refresh_serp_data())

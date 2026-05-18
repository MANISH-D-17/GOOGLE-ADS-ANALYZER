import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from database.connection import AsyncSessionLocal
from database.models import KeywordMetric
from sqlalchemy import select
from competitor_analysis.keyword_pipeline.enricher import KeywordEnricher

async def sync_all_keyword_metrics():
    """
    Job to refresh metrics for all stored keywords.
    """
    print("[Job] Starting keyword metrics sync...")
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(KeywordMetric.keyword))
        keywords = [r[0] for r in result.all()]
        
        if not keywords:
            print("[Job] No keywords found to sync.")
            return

        enricher = KeywordEnricher(db)
        # Process in batches of 20 to avoid API limits/timeouts
        for i in range(0, len(keywords), 20):
            batch = keywords[i:i+20]
            print(f"[Job] Syncing batch {i//20 + 1} ({len(batch)} keywords)...")
            await enricher.enrich_keywords(batch)
            await db.commit()
            
    print("[Job] Keyword metrics sync complete.")

if __name__ == "__main__":
    asyncio.run(sync_all_keyword_metrics())

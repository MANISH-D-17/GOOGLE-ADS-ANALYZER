import asyncio
import uuid
from datetime import datetime, timedelta
from database.connection import AsyncSessionLocal, init_db
from database.models.competitor_models import SERPCacheSnapshot

async def seed():
    # Make sure tables exist
    await init_db()

    async with AsyncSessionLocal() as db:
        # Check if already seeded
        result = await db.execute(__import__("sqlalchemy").select(SERPCacheSnapshot))
        existing = result.scalars().all()
        if len(existing) >= 2:
            print("Database already has at least 2 snapshots.")
            return

        print("Seeding two mock snapshots into Supabase database...")

        # Mock results for Snapshot A (Older)
        results_a = {
            "tasks": [
                {
                    "data": {"keyword": "twin birds leggings buy online"},
                    "result": [{"items": [{"rank_group": 5, "domain": "twinbirds.co.in", "url": "https://twinbirds.co.in/leggings"}]}]
                },
                {
                    "data": {"keyword": "twin birds kurti pant"},
                    "result": [{"items": [{"rank_group": 12, "domain": "twinbirds.co.in", "url": "https://twinbirds.co.in/kurti-pants"}]}]
                },
                {
                    "data": {"keyword": "cotton ankle legging women"},
                    "result": [{"items": [{"rank_group": 8, "domain": "twinbirds.co.in", "url": "https://twinbirds.co.in/ankle-leggings"}]}]
                }
            ]
        }

        # Mock results for Snapshot B (Newer) - positions improved/declined
        results_b = {
            "tasks": [
                {
                    "data": {"keyword": "twin birds leggings buy online"},
                    "result": [{"items": [{"rank_group": 3, "domain": "twinbirds.co.in", "url": "https://twinbirds.co.in/leggings"}]}]
                },
                {
                    "data": {"keyword": "twin birds kurti pant"},
                    "result": [{"items": [{"rank_group": 6, "domain": "twinbirds.co.in", "url": "https://twinbirds.co.in/kurti-pants"}]}]
                },
                {
                    "data": {"keyword": "cotton ankle legging women"},
                    "result": [{"items": [{"rank_group": 15, "domain": "twinbirds.co.in", "url": "https://twinbirds.co.in/ankle-leggings"}]}]
                },
                {
                    "data": {"keyword": "saree shaper buy online india"}, # New keyword
                    "result": [{"items": [{"rank_group": 2, "domain": "twinbirds.co.in", "url": "https://twinbirds.co.in/saree-shapers"}]}]
                }
            ]
        }

        snapshot_a = SERPCacheSnapshot(
            id=str(uuid.uuid4()),
            keywords=["twin birds leggings buy online", "twin birds kurti pant", "cotton ankle legging women"],
            results=results_a,
            keyword_count=3,
            fetched_at=datetime.utcnow() - timedelta(days=7), # 7 days ago
            triggered_by="seed_script"
        )

        snapshot_b = SERPCacheSnapshot(
            id=str(uuid.uuid4()),
            keywords=["twin birds leggings buy online", "twin birds kurti pant", "cotton ankle legging women", "saree shaper buy online india"],
            results=results_b,
            keyword_count=4,
            fetched_at=datetime.utcnow(), # Now
            triggered_by="seed_script"
        )

        db.add(snapshot_a)
        db.add(snapshot_b)
        await db.commit()
        print("Successfully seeded two snapshots for SERP Comparison.")

if __name__ == "__main__":
    asyncio.run(seed())

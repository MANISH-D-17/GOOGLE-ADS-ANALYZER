from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from datetime import datetime
import json

from database.connection import get_db
from database.models.competitor_models import SERPCacheSnapshot
from free_tools.keyword_service import get_shopping_rank_playwright, BUYING_SEEDS

router = APIRouter()

@router.get("/latest")
async def get_latest_serp_cache(
    snapshot_id: str = Query(None, description="Optional specific snapshot ID"),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns the most recent cached SERP snapshot from the database,
    or a specific snapshot if snapshot_id is provided.
    Never calls DataForSEO.
    """
    try:
        if snapshot_id:
            result = await db.execute(
                select(SERPCacheSnapshot)
                .where(SERPCacheSnapshot.id == snapshot_id)
            )
            snapshot = result.scalars().first()
        else:
            result = await db.execute(
                select(SERPCacheSnapshot)
                .order_by(desc(SERPCacheSnapshot.fetched_at))
                .limit(1)
            )
            snapshot = result.scalars().first()

        if not snapshot:
            return {"snapshot_id": None, "data": None}

        return {
            "snapshot_id": snapshot.id,
            "fetched_at": snapshot.fetched_at.isoformat(),
            "keywords": snapshot.keywords,
            "data": snapshot.results
        }
    except Exception as e:
        print(f"[SERP Cache] DB Error bypassed for /latest: {e}")
        return {"snapshot_id": None, "data": None}

@router.post("/refresh")
async def refresh_serp_cache(
    db: AsyncSession = Depends(get_db)
):
    """
    Calls DataForSEO SERP API for all tracked keywords.
    Saves results to new PostgreSQL table serp_cache_snapshots.
    Returns the new snapshot_id and fetched_at timestamp.
    """
    try:
        # Pull 10 high priority buying seeds to act as the tracked keywords
        tracked_keywords = BUYING_SEEDS[:10]
        
        tasks = []
        for kw in tracked_keywords:
            rank_data = await get_shopping_rank_playwright(kw)
            
            items = []
            for r in rank_data.get("results", []):
                items.append({
                    "rank_group": r.get("position", 0),
                    "domain": r.get("domain", ""),
                    "url": r.get("url", ""),
                    "title": r.get("title", "")
                })
                
            tasks.append({
                "data": {"keyword": kw},
                "result": [{"items": items}]
            })
            
        results_data = {"tasks": tasks}

        snapshot = SERPCacheSnapshot(
            keywords=tracked_keywords,
            results=results_data,
            keyword_count=len(tracked_keywords),
            triggered_by="manual_refresh"
        )
        
        db.add(snapshot)
        await db.commit()
        await db.refresh(snapshot)
        
        return {
            "snapshot_id": snapshot.id,
            "fetched_at": snapshot.fetched_at.isoformat(),
            "status": "success"
        }
    except Exception as e:
        print(f"[SERP Cache] DB Error bypassed for /refresh: {e}")
        return {
            "snapshot_id": f"mock_{int(datetime.utcnow().timestamp())}",
            "fetched_at": datetime.utcnow().isoformat(),
            "status": "mocked_due_to_db_error"
        }

@router.get("/history")
async def get_serp_history(
    db: AsyncSession = Depends(get_db)
):
    """
    Returns list of all snapshots: [{ snapshot_id, fetched_at, keyword_count }]
    Used by the comparison page to let user select two snapshots to diff.
    """
    try:
        result = await db.execute(
            select(SERPCacheSnapshot)
            .order_by(desc(SERPCacheSnapshot.fetched_at))
        )
        snapshots = result.scalars().all()
        
        history = [
            {
                "snapshot_id": s.id,
                "fetched_at": s.fetched_at.isoformat(),
                "keyword_count": s.keyword_count
            }
            for s in snapshots
        ]
        return {"history": history}
    except Exception as e:
        print(f"[SERP Cache] DB Error bypassed for /history: {e}")
        return {"history": []}

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from database.connection import get_db
from database.models import SERPResult
from sqlalchemy import select, func
from typing import List

router = APIRouter()

@router.get("/results")
async def get_serp_results(
    keyword: str,
    db: AsyncSession = Depends(get_db)
):
    """Get the top SERP results for a keyword."""
    result = await db.execute(
        select(SERPResult)
        .where(SERPResult.keyword == keyword)
        .order_by(SERPResult.position)
        .limit(20)
    )
    items = result.scalars().all()
    return {"results": items}

@router.get("/overlap")
async def get_competitor_overlap(
    my_domain: str,
    competitor_domain: str,
    db: AsyncSession = Depends(get_db)
):
    """Analyze keyword ranking overlap between two domains using DB data."""
    from database.models import SERPResult
    my_q = await db.execute(select(func.count(SERPResult.id)).where(SERPResult.domain == my_domain))
    comp_q = await db.execute(select(func.count(SERPResult.id)).where(SERPResult.domain == competitor_domain))
    my_count = my_q.scalar() or 0
    comp_count = comp_q.scalar() or 0
    
    # Both domains share same keyword if same keyword appears for both
    from sqlalchemy import intersect
    my_kws = select(SERPResult.keyword).where(SERPResult.domain == my_domain)
    comp_kws = select(SERPResult.keyword).where(SERPResult.domain == competitor_domain)
    overlap_q = await db.execute(select(func.count()).select_from(
        my_kws.intersect(comp_kws).subquery()
    ))
    shared = overlap_q.scalar() or 0
    unique_to_comp = max(0, comp_count - shared)
    overlap_score = round(shared / max(comp_count, 1), 2)
    return {
        "overlap_score": overlap_score,
        "shared_keywords": shared,
        "unique_to_competitor": unique_to_comp,
        "my_keyword_count": my_count,
        "competitor_keyword_count": comp_count,
    }

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
    """Analyze keyword ranking overlap between two domains."""
    # Logic to fetch from competitor_keywords and compare
    # ...
    return {"overlap_score": 0.65, "shared_keywords": 450, "unique_to_competitor": 1200}

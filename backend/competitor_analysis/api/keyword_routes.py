from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from database.connection import get_db
from database.models import KeywordMetric, KeywordGap, KeywordTrend, RelatedKeyword
from sqlalchemy import select, desc
from typing import List, Optional

router = APIRouter()

@router.get("/volume")
async def get_keyword_volume(
    keywords: List[str] = Query(...),
    db: AsyncSession = Depends(get_db)
):
    """Get search volume and CPC for specific keywords."""
    result = await db.execute(select(KeywordMetric).where(KeywordMetric.keyword.in_(keywords)))
    metrics = result.scalars().all()
    
    return {
        "metrics": [
            {
                "keyword": m.keyword,
                "volume": m.search_volume,
                "cpc": m.cpc,
                "competition": m.competition,
                "difficulty": m.difficulty
            } for m in metrics
        ]
    }

@router.get("/gaps")
async def get_keyword_gaps(
    competitor_id: str,
    limit: int = 20,
    db: AsyncSession = Depends(get_db)
):
    """Get keywords where the competitor ranks but we don't."""
    result = await db.execute(
        select(KeywordGap)
        .where(KeywordGap.competitor_id == competitor_id)
        .order_by(desc(KeywordGap.gap_score))
        .limit(limit)
    )
    gaps = result.scalars().all()
    return {"gaps": gaps}

@router.get("/trends")
async def get_keyword_trends(
    keyword: str,
    db: AsyncSession = Depends(get_db)
):
    """Get search volume trends for a keyword."""
    result = await db.execute(
        select(KeywordTrend)
        .where(KeywordTrend.keyword == keyword)
        .order_by(KeywordTrend.year.desc(), KeywordTrend.month.desc())
        .limit(12)
    )
    trends = result.scalars().all()
    return {"trends": trends}

@router.get("/related")
async def get_related_keywords(
    keyword: str,
    limit: int = 20,
    db: AsyncSession = Depends(get_db)
):
    """Get related keyword suggestions."""
    result = await db.execute(
        select(RelatedKeyword)
        .where(RelatedKeyword.seed_keyword == keyword)
        .order_by(desc(RelatedKeyword.relevance_score))
        .limit(limit)
    )
    related = result.scalars().all()
    return {"related": related}

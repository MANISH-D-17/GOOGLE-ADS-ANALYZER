"""
Competitor Analysis API Routes
All endpoints isolated under /api/competitor-analysis/*
"""
import json
import csv
import io
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel
from sqlalchemy import select, func, desc
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from database.connection import get_db, ping_db
from database.models import (
    Competitor, ScrapedAd, InferredKeyword, BenchmarkReport,
    AIRecommendation, ScrapeSession, ScrapedImage, CompetitorSnapshot,
    CreativeAnalysis, EmotionalAnalysis, ColorAnalysis, CTAAnalysis
)
from database.repositories.repositories import (
    CompetitorRepository, AdRepository, KeywordRepository,
    BenchmarkRepository, RecommendationRepository, SessionRepository
)
from database.services.storage_pipeline import StoragePipelineService

router = APIRouter()


# ── Request Models ────────────────────────────────────────────────────────────

class TriggerScrapeRequest(BaseModel):
    domain: str
    region: str = "IN"
    maxAds: int = 30
    sessionId: str | None = None


# ── Helpers ───────────────────────────────────────────────────────────────────

def _ad_to_dict(ad: ScrapedAd) -> dict:
    print("[API] Overview end"); return {
        "id": ad.id,
        "externalId": ad.external_ad_id,
        "brand": ad.brand,
        "domain": ad.domain,
        "headline": ad.headline,
        "description": ad.description,
        "ctaText": ad.cta_text,
        "landingUrl": ad.landing_url,
        "adFormat": ad.ad_format,
        "fashionCategory": ad.fashion_category,
        "offerText": ad.offer_text,
        "emotionalTriggers": ad.emotional_triggers or [],
        "dominantColors": ad.dominant_colors or [],
        "imageUrls": [img.image_url for img in ad.images] if hasattr(ad, "images") and ad.images else [],
        "firstSeen": ad.first_seen,
        "lastSeen": ad.last_seen,
        "scores": {
            "creative": ad.creative_score,
            "emotional": ad.emotional_score,
            "cta": ad.cta_score,
            "visual": ad.visual_score,
            "keyword": ad.keyword_strength,
            "composite": ad.composite_score,
        },
        "extractedAt": ad.extracted_at.isoformat() if ad.extracted_at else None,
    }


# ── Health ────────────────────────────────────────────────────────────────────

@router.get("/health")
async def health():
    db_ok = await ping_db()
    print("[API] Overview end"); return {"status": "ok", "database": "connected" if db_ok else "error"}


# ── 1. Trigger Scrape + Store ─────────────────────────────────────────────────

@router.post("/trigger-scrape")
async def trigger_scrape(
    req: TriggerScrapeRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """
    Triggers scraping via the existing scraper and stores results in PostgreSQL.
    Uses session data if sessionId is provided (from a completed scraper session).
    """
    import sys
    sys.path.insert(0, "/Users/manishd/MANISH-PROJECT/GADS/backend/competitor_scraper")

    # If sessionId provided, pipe that session's data into PostgreSQL immediately
    if req.sessionId:
        from api.routes import SESSION_STORE
        session_data = SESSION_STORE.get(req.sessionId)
        if session_data and session_data.get("ads"):
            ads = session_data["ads"]
            pipeline = StoragePipelineService(db)
            result = await pipeline.store(req.sessionId, req.domain, req.region, ads)
            print("[API] Overview end"); return {"status": "stored", "result": result}
        raise HTTPException(404, "Session not found or has no ads")

    print("[API] Overview end"); return {"status": "use_sessionId", "message": "Provide a completed sessionId to store data"}


# ── 2. Overview ───────────────────────────────────────────────────────────────

@router.get("/overview")
async def get_overview(
    domain: str | None = None,
    db: AsyncSession = Depends(get_db)
):
    """Aggregated competitor overview stats."""
    competitors = await CompetitorRepository(db).list_all()
    if not competitors:
        return {"competitors": [], "totalAds": 0, "totalKeywords": 0, "totalSessions": 0}

    overview_list = []
    for comp in competitors:
        if domain and comp.domain != domain:
            continue
        stats = await AdRepository(db).get_stats(comp.id)
        kws = await KeywordRepository(db).get_top_by_competitor(comp.id, 5)
        benchmark = await BenchmarkRepository(db).get_latest(comp.id)
        sessions = await SessionRepository(db).list_by_competitor(comp.id, 3)

        overview_list.append({
            "id": comp.id,
            "domain": comp.domain,
            "brand": comp.brand_name,
            "region": comp.region,
            "totalAds": stats["total_ads"],
            "imageAds": stats["image_ads"],
            "avgScore": stats["avg_score"],
            "keywordCount": len(kws),
            "topKeywords": [k["keyword"] for k in kws],
            "lastScraped": comp.last_scraped.isoformat() if comp.last_scraped else None,
            "totalAdsSeen": comp.total_ads_seen,
            "sessionCount": len(sessions),
            "benchmarkScore": benchmark.overall_score if benchmark else None,
            "competitorCreativeScore": benchmark.competitor_creative_score if benchmark else None,
        })

    total_ads = await db.scalar(select(func.count(ScrapedAd.id))) or 0
    total_kws = await db.scalar(select(func.count(InferredKeyword.id))) or 0
    total_sessions = await db.scalar(select(func.count(ScrapeSession.id))) or 0

    return {
        "competitors": overview_list,
        "totalAds": total_ads,
        "totalKeywords": total_kws,
        "totalSessions": total_sessions,
        "lastUpdated": datetime.utcnow().isoformat(),
    }


# ── 3. Keywords ───────────────────────────────────────────────────────────────

@router.get("/keywords")
async def get_keywords(
    domain: str | None = None,
    limit: int = 30,
    db: AsyncSession = Depends(get_db)
):
    comp_repo = CompetitorRepository(db)
    kw_repo = KeywordRepository(db)

    if domain:
        comp = await comp_repo.get_by_domain(domain)
        if not comp:
            raise HTTPException(404, f"No data for {domain}")
        keywords = await kw_repo.get_top_by_competitor(comp.id, limit)
    else:
        # All competitors
        all_comps = await comp_repo.list_all()
        keywords = []
        for c in all_comps:
            kws = await kw_repo.get_top_by_competitor(c.id, limit // len(all_comps) if all_comps else limit)
            for k in kws:
                k["competitor"] = c.brand_name
            keywords.extend(kws)
        keywords.sort(key=lambda x: x["frequency"], reverse=True)

    print("[API] Overview end"); return {"keywords": keywords, "total": len(keywords)}


# ── 4. Creatives ──────────────────────────────────────────────────────────────

@router.get("/creatives")
async def get_creatives(
    domain: str | None = None,
    format: str | None = None,
    category: str | None = None,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db)
):
    query = select(ScrapedAd).options(selectinload(ScrapedAd.images)).order_by(desc(ScrapedAd.composite_score))

    if domain:
        comp = await CompetitorRepository(db).get_by_domain(domain)
        if comp:
            query = query.where(ScrapedAd.competitor_id == comp.id)

    if format:
        query = query.where(ScrapedAd.ad_format == format)
    if category:
        query = query.where(ScrapedAd.fashion_category == category)

    query = query.limit(limit).offset(offset)
    result = await db.execute(query)
    ads = list(result.scalars().all())

    total = await db.scalar(select(func.count(ScrapedAd.id)))

    print("[API] Overview end"); return {
        "ads": [_ad_to_dict(ad) for ad in ads],
        "total": total or 0,
        "limit": limit,
        "offset": offset,
    }


# ── 5. Comparison / Benchmark ─────────────────────────────────────────────────

@router.get("/comparison")
async def get_comparison(
    domain: str | None = None,
    db: AsyncSession = Depends(get_db)
):
    comp_repo = CompetitorRepository(db)
    bench_repo = BenchmarkRepository(db)

    if domain:
        comp = await comp_repo.get_by_domain(domain)
        if not comp:
            raise HTTPException(404, f"No data for {domain}")
        report = await bench_repo.get_latest(comp.id)
        if not report:
            raise HTTPException(404, "No benchmark report yet — run a scrape first")
        print("[API] Overview end"); return {
            "competitor": {"id": comp.id, "domain": comp.domain, "brand": comp.brand_name},
            "benchmark": {
                "myCTR": report.my_ctr,
                "competitorCTR": report.competitor_estimated_ctr,
                "myCPC": report.my_cpc,
                "competitorCPC": report.competitor_estimated_cpc,
                "myROAS": report.my_roas,
                "myCreativeScore": report.my_creative_score,
                "competitorCreativeScore": report.competitor_creative_score,
                "myKeywordCount": report.my_keyword_count,
                "competitorKeywordCount": report.competitor_keyword_count,
                "overallScore": report.overall_score,
                "strengths": report.strengths or [],
                "weaknesses": report.weaknesses or [],
                "opportunities": report.opportunities or [],
                "threats": report.threats or [],
            }
        }

    # Return all benchmarks
    all_comps = await comp_repo.list_all()
    reports = []
    for c in all_comps:
        r = await bench_repo.get_latest(c.id)
        if r:
            reports.append({
                "competitor": c.brand_name, "domain": c.domain,
                "overallScore": r.overall_score,
                "competitorCreativeScore": r.competitor_creative_score,
                "myCreativeScore": r.my_creative_score,
            })
    print("[API] Overview end"); return {"reports": reports}


# ── 6. AI Recommendations ─────────────────────────────────────────────────────

@router.get("/recommendations")
async def get_recommendations(
    domain: str | None = None,
    db: AsyncSession = Depends(get_db)
):
    comp_repo = CompetitorRepository(db)
    rec_repo = RecommendationRepository(db)

    if domain:
        comp = await comp_repo.get_by_domain(domain)
        if not comp:
            raise HTTPException(404, f"No data for {domain}")
        recs = await rec_repo.get_by_competitor(comp.id, 10)
    else:
        all_comps = await comp_repo.list_all()
        recs = []
        for c in all_comps:
            recs.extend(await rec_repo.get_by_competitor(c.id, 5))

    print("[API] Overview end"); return {
        "recommendations": [
            {
                "id": r.id,
                "type": r.recommendation_type,
                "title": r.title,
                "description": r.description,
                "actionItems": r.action_items or [],
                "priority": r.priority,
                "impactScore": r.impact_score,
                "isActioned": r.is_actioned,
                "createdAt": r.created_at.isoformat(),
            }
            for r in recs
        ]
    }


# ── 7. Snapshots ──────────────────────────────────────────────────────────────

@router.get("/snapshots")
async def get_snapshots(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ScrapeSession)
        .order_by(desc(ScrapeSession.started_at))
        .limit(20)
    )
    sessions = list(result.scalars().all())
    print("[API] Overview end"); return {
        "snapshots": [
            {
                "id": s.id,
                "sessionKey": s.session_key,
                "status": s.status,
                "adsExtracted": s.ads_extracted,
                "startedAt": s.started_at.isoformat() if s.started_at else None,
                "completedAt": s.completed_at.isoformat() if s.completed_at else None,
            }
            for s in sessions
        ]
    }


# ── 8. Export ─────────────────────────────────────────────────────────────────

@router.get("/export")
async def export_data(
    format: str = Query("json", enum=["json", "csv"]),
    domain: str | None = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(ScrapedAd).order_by(desc(ScrapedAd.created_at)).limit(500)
    if domain:
        comp = await CompetitorRepository(db).get_by_domain(domain)
        if comp:
            query = query.where(ScrapedAd.competitor_id == comp.id)
    result = await db.execute(query)
    ads = list(result.scalars().all())

    if format == "json":
        data = json.dumps([_ad_to_dict(a) for a in ads], indent=2, default=str)
        return StreamingResponse(
            iter([data]), media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename=competitor_intel_{datetime.utcnow().date()}.json"}
        )

    # CSV
    output = io.StringIO()
    fieldnames = ["id", "brand", "headline", "description", "ctaText", "adFormat",
                  "fashionCategory", "offerText", "firstSeen", "lastSeen", "composite_score"]
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    for ad in ads:
        writer.writerow({
            "id": ad.id, "brand": ad.brand, "headline": ad.headline,
            "description": ad.description or "", "ctaText": ad.cta_text or "",
            "adFormat": ad.ad_format, "fashionCategory": ad.fashion_category or "",
            "offerText": ad.offer_text or "", "firstSeen": ad.first_seen or "",
            "lastSeen": ad.last_seen or "", "composite_score": ad.composite_score or 0,
        })
    return StreamingResponse(
        iter([output.getvalue()]), media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=competitor_intel_{datetime.utcnow().date()}.csv"}
    )

# ── 9. Delete Session ─────────────────────────────────────────────────────────

@router.delete("/session/{session_id}")
async def delete_session(session_id: str, db: AsyncSession = Depends(get_db)):
    """Delete a scrape session and all its associated data."""
    from sqlalchemy import text
    
    # Find the session
    result = await db.execute(select(ScrapeSession).where(ScrapeSession.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        # Also check by session_key
        result = await db.execute(select(ScrapeSession).where(ScrapeSession.session_key == session_id))
        session = result.scalar_one_or_none()
    
    if not session:
        raise HTTPException(404, "Session not found")

    # 1. Delete analysis records
    ads_result = await db.execute(select(ScrapedAd.id).where(ScrapedAd.session_id == session.id))
    ad_ids = [r[0] for r in ads_result.all()]
    
    if ad_ids:
        # Use tuple conversion for SQLAlchemy 'IN' clause
        ids_tuple = tuple(ad_ids)
        await db.execute(text("DELETE FROM creative_analysis WHERE ad_id IN :ids"), {"ids": ids_tuple})
        await db.execute(text("DELETE FROM emotional_analysis WHERE ad_id IN :ids"), {"ids": ids_tuple})
        await db.execute(text("DELETE FROM color_analysis WHERE ad_id IN :ids"), {"ids": ids_tuple})
        await db.execute(text("DELETE FROM cta_analysis WHERE ad_id IN :ids"), {"ids": ids_tuple})
        await db.execute(text("DELETE FROM scraped_images WHERE ad_id IN :ids"), {"ids": ids_tuple})
        await db.execute(text("DELETE FROM inferred_keywords WHERE ad_id IN :ids"), {"ids": ids_tuple})
        await db.execute(text("DELETE FROM scraped_ads WHERE session_id = :sid"), {"sid": session.id})

    # 2. Delete snapshots and session
    await db.execute(text("DELETE FROM competitor_snapshots WHERE session_id = :sid"), {"sid": session.id})
    await db.execute(text("DELETE FROM ai_recommendations WHERE session_id = :sid"), {"sid": session.id})
    await db.execute(text("DELETE FROM scrape_sessions WHERE id = :sid"), {"sid": session.id})
    
    await db.commit()
    print("[API] Overview end"); return {"status": "deleted", "sessionId": session_id}

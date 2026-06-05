"""
Competitor Analysis API Routes
All endpoints isolated under /api/competitor-analysis/*
"""
from __future__ import annotations

import json
import csv
import io
import os
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query, UploadFile, File
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
    BenchmarkRepository, RecommendationRepository, SessionRepository,
    AnalysisRepository
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
    return {
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

# ── Fallback Helpers (for when PostgreSQL is unreachable) ──────────────────────

def _load_snapshots_fallback() -> list:
    snapshots_dir = "/Users/manishd/MANISH-PROJECT/GADS/backend/competitor_scraper/datasets/snapshots"
    index_path = os.path.join(snapshots_dir, "index.json")
    if not os.path.exists(index_path):
        return []
    try:
        with open(index_path, 'r') as f:
            return json.load(f)
    except Exception:
        return []

def _load_snapshot_ads_fallback(session_id: str) -> list:
    snapshots_dir = "/Users/manishd/MANISH-PROJECT/GADS/backend/competitor_scraper/datasets/snapshots"
    path = os.path.join(snapshots_dir, f"{session_id}.json")
    if not os.path.exists(path):
        return []
    try:
        with open(path, 'r') as f:
            data = json.load(f)
            # Support both format {"session": ..., "ads": ads} and old format
            return data.get("ads", []) if "ads" in data else data.get("adsCount", [])
    except Exception:
        return []


# ── 2. Overview ───────────────────────────────────────────────────────────────

@router.get("/overview")
async def get_overview(
    domain: str | None = None,
    db: AsyncSession = Depends(get_db)
):
    """Aggregated competitor overview stats with local snapshot fallback."""
    try:
        competitors = await CompetitorRepository(db).list_all()
        
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
    except Exception as db_err:
        print(f"[API fallback] DB error in get_overview, using snapshots: {db_err}")
        snaps = _load_snapshots_fallback()
        if not snaps:
            return {"competitors": [], "totalAds": 0, "totalKeywords": 0, "totalSessions": 0}
            
        domains = set(s["domain"] for s in snaps)
        overview_list = []
        total_ads = 0
        
        for dom in domains:
            if domain and dom != domain:
                continue
            dom_snaps = [s for s in snaps if s["domain"] == dom]
            latest_snap = max(dom_snaps, key=lambda x: x.get("capturedAt", ""))
            
            ads = _load_snapshot_ads_fallback(latest_snap["id"])
            total_ads += len(ads)
            
            # Dynamic keywords
            import sys
            scraper_path = "/Users/manishd/MANISH-PROJECT/GADS/backend/competitor_scraper"
            if scraper_path not in sys.path: sys.path.insert(0, scraper_path)
            from ai.keyword_inference import KeywordInferenceEngine
            nlp = KeywordInferenceEngine()
            kws = nlp.infer_keywords(ads)[:5]
            
            avg_score = sum(ad.get("scores", {}).get("composite", ad.get("compositeScore", 7.5)) for ad in ads) / len(ads) if ads else 7.5
            
            overview_list.append({
                "id": latest_snap["id"],
                "domain": dom,
                "brand": dom.split(".")[0].replace("-", " ").title(),
                "region": "IN",
                "totalAds": len(ads),
                "imageAds": sum(1 for ad in ads if ad.get("adFormat") == "image"),
                "avgScore": round(avg_score, 1),
                "keywordCount": len(kws),
                "topKeywords": [k["keyword"] for k in kws],
                "lastScraped": latest_snap.get("capturedAt"),
                "totalAdsSeen": len(ads),
                "sessionCount": len(dom_snaps),
                "benchmarkScore": 82.5,
                "competitorCreativeScore": round(avg_score, 1),
            })
            
        return {
            "competitors": overview_list,
            "totalAds": total_ads,
            "totalKeywords": sum(c["keywordCount"] for c in overview_list),
            "totalSessions": len(snaps),
            "lastUpdated": datetime.utcnow().isoformat(),
        }


# ── 3. Keywords ───────────────────────────────────────────────────────────────

@router.get("/keywords")
async def get_keywords(
    domain: str | None = None,
    limit: int = 30,
    db: AsyncSession = Depends(get_db)
):
    try:
        comp_repo = CompetitorRepository(db)
        kw_repo = KeywordRepository(db)

        if domain:
            comp = await comp_repo.get_by_domain(domain)
            if not comp:
                raise HTTPException(404, f"No data for {domain}")
            keywords = await kw_repo.get_top_by_competitor(comp.id, limit)
        else:
            all_comps = await comp_repo.list_all()
            keywords = []
            for c in all_comps:
                kws = await kw_repo.get_top_by_competitor(c.id, limit // len(all_comps) if all_comps else limit)
                for k in kws:
                    k["competitor"] = c.brand_name
                keywords.extend(kws)
            keywords.sort(key=lambda x: x["frequency"], reverse=True)

        print("[API] Overview end"); return {"keywords": keywords, "total": len(keywords)}
    except Exception as db_err:
        print(f"[API fallback] DB error in get_keywords, using snapshots: {db_err}")
        snaps = _load_snapshots_fallback()
        if domain:
            snaps = [s for s in snaps if s["domain"] == domain]
            
        all_ads = []
        for s in snaps:
            all_ads.extend(_load_snapshot_ads_fallback(s["id"]))
            
        import sys
        scraper_path = "/Users/manishd/MANISH-PROJECT/GADS/backend/competitor_scraper"
        if scraper_path not in sys.path: sys.path.insert(0, scraper_path)
        from ai.keyword_inference import KeywordInferenceEngine
        nlp = KeywordInferenceEngine()
        keywords = nlp.infer_keywords(all_ads)
        return {"keywords": keywords[:limit], "total": len(keywords)}


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
    try:
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
    except Exception as db_err:
        print(f"[API fallback] DB error in get_creatives, using snapshots: {db_err}")
        snaps = _load_snapshots_fallback()
        if domain:
            snaps = [s for s in snaps if s["domain"] == domain]
            
        all_ads = []
        for s in snaps:
            all_ads.extend(_load_snapshot_ads_fallback(s["id"]))
            
        if format:
            all_ads = [a for a in all_ads if a.get("adFormat") == format]
        if category:
            all_ads = [a for a in all_ads if a.get("fashionCategory") == category]
            
        all_ads.sort(key=lambda x: x.get("scores", {}).get("composite", x.get("compositeScore", 7.5)), reverse=True)
        
        sliced_ads = all_ads[offset:offset+limit]
        
        formatted_ads = []
        for ad in sliced_ads:
            formatted_ads.append({
                "id": ad.get("id"),
                "externalId": ad.get("creativeId", ad.get("id")),
                "brand": ad.get("brand"),
                "domain": ad.get("domain"),
                "headline": ad.get("headline"),
                "description": ad.get("description"),
                "ctaText": ad.get("ctaText"),
                "landingUrl": ad.get("landingUrl"),
                "adFormat": ad.get("adFormat"),
                "fashionCategory": ad.get("fashionCategory", "General"),
                "offerText": ad.get("offerText", ""),
                "emotionalTriggers": ad.get("emotionalTriggers", []),
                "dominantColors": ad.get("dominantColors", []),
                "imageUrls": ad.get("imageUrls", []),
                "firstSeen": ad.get("firstSeen"),
                "lastSeen": ad.get("lastSeen"),
                "scores": ad.get("scores", {
                    "creative": 7.0, "emotional": 7.0, "cta": 7.0, "visual": 7.0, "keyword": 7.0, "composite": 7.0
                }),
                "extractedAt": ad.get("extractedAt"),
            })
            
        return {
            "ads": formatted_ads,
            "total": len(all_ads),
            "limit": limit,
            "offset": offset
        }


# ── 5. Comparison / Benchmark ─────────────────────────────────────────────────

@router.get("/comparison")
async def get_comparison(
    domain: str | None = None,
    db: AsyncSession = Depends(get_db)
):
    try:
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
    except Exception as db_err:
        print(f"[API fallback] DB error in get_comparison, using snapshots: {db_err}")
        snaps = _load_snapshots_fallback()
        if domain:
            snaps = [s for s in snaps if s["domain"] == domain]
            
        if not snaps:
            raise HTTPException(404, "No snapshot datasets found")
            
        latest_snap = snaps[0]
        ads = _load_snapshot_ads_fallback(latest_snap["id"])
        
        from competitor_import.comparison_engine import run_competitor_comparison
        comparison_res = run_competitor_comparison({"ads": ads, "keywords": []})
        benchmark = comparison_res.get("benchmark", {})
        
        return {
            "competitor": {"id": latest_snap["id"], "domain": latest_snap["domain"], "brand": latest_snap["domain"].split(".")[0].title()},
            "benchmark": benchmark
        }


# ── 6. AI Recommendations ─────────────────────────────────────────────────────

@router.get("/recommendations")
async def get_recommendations(
    domain: str | None = None,
    db: AsyncSession = Depends(get_db)
):
    try:
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
    except Exception as db_err:
        print(f"[API fallback] DB error in get_recommendations, using snapshots: {db_err}")
        snaps = _load_snapshots_fallback()
        if domain:
            snaps = [s for s in snaps if s["domain"] == domain]
            
        all_ads = []
        for s in snaps:
            all_ads.extend(_load_snapshot_ads_fallback(s["id"]))
            
        import sys
        scraper_path = "/Users/manishd/MANISH-PROJECT/GADS/backend/competitor_scraper"
        if scraper_path not in sys.path: sys.path.insert(0, scraper_path)
        from competitor_analysis.reports.recommendations import RecommendationEngine
        rec_engine = RecommendationEngine()
        from competitor_import.comparison_engine import run_competitor_comparison
        comp_res = run_competitor_comparison({"ads": all_ads})
        benchmark_data = comp_res.get("benchmark", {})
        
        from ai.keyword_inference import KeywordInferenceEngine
        nlp = KeywordInferenceEngine()
        keywords = nlp.infer_keywords(all_ads)
        
        recs = rec_engine.generate(all_ads, benchmark_data, keywords)
        
        import uuid
        return {
            "recommendations": [
                {
                    "id": str(uuid.uuid4())[:8],
                    "type": r.get("type", "general"),
                    "title": r.get("title"),
                    "description": r.get("description"),
                    "actionItems": r.get("actionItems", []),
                    "priority": r.get("priority", "medium"),
                    "impactScore": r.get("impactScore", 0.7),
                    "isActioned": False,
                    "createdAt": datetime.utcnow().isoformat(),
                }
                for r in recs
            ]
        }


# ── 7. Snapshots ──────────────────────────────────────────────────────────────

@router.get("/snapshots")
async def get_snapshots(db: AsyncSession = Depends(get_db)):
    try:
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
    except Exception as db_err:
        print(f"[API fallback] DB error in get_snapshots, using snapshots: {db_err}")
        snaps = _load_snapshots_fallback()
        return {
            "snapshots": [
                {
                    "id": s["id"],
                    "sessionKey": s["id"],
                    "status": "complete",
                    "adsExtracted": s.get("adsCount", 0),
                    "startedAt": s.get("capturedAt"),
                    "completedAt": s.get("capturedAt"),
                }
                for s in snaps
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


@router.post("/import-zip")
async def import_zip_data(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload and extract competitor ZIP bundle.
    Validates structure and schema, stores competitor, session, ads, keywords,
    creative analysis and benchmarking directly in PostgreSQL.
    """
    import shutil
    import uuid
    from competitor_import.extractor import safe_extract_zip
    from competitor_import.validators import validate_extracted_package
    from competitor_import.parsers import parse_competitor_package
    from competitor_import.comparison_engine import run_competitor_comparison
    
    session_key = str(uuid.uuid4())[:8]
    base_dir = os.path.join(os.path.dirname(__file__), "..", "..")
    processing_dir = os.path.join(base_dir, "processing", session_key)
    zip_path = os.path.join(base_dir, "processing", f"{session_key}.zip")
    
    os.makedirs(os.path.join(base_dir, "processing"), exist_ok=True)
    
    # 1. Save uploaded zip file temporarily
    try:
        with open(zip_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to write uploaded file: {str(e)}")
        
    # 2. Extract zip safely
    success, msg = safe_extract_zip(zip_path, processing_dir)
    # Remove temporary zip file
    if os.path.exists(zip_path):
        os.remove(zip_path)
        
    if not success:
        if os.path.exists(processing_dir):
            shutil.rmtree(processing_dir)
        raise HTTPException(status_code=400, detail=msg)
        
    # 3. Validate extracted package structure & metadata
    is_valid, validation_msg = validate_extracted_package(processing_dir)
    if not is_valid:
        if os.path.exists(processing_dir):
            shutil.rmtree(processing_dir)
        raise HTTPException(status_code=400, detail=validation_msg)
        
    # 4. Parse elements
    try:
        parsed_data = parse_competitor_package(processing_dir)
    except Exception as parse_err:
        if os.path.exists(processing_dir):
            shutil.rmtree(processing_dir)
        raise HTTPException(status_code=400, detail=f"Failed parsing ZIP files: {str(parse_err)}")
        
    # 5. Get details from metadata
    website_meta = parsed_data.get("website", {})
    domain = website_meta.get("domain", "")
    brand = website_meta.get("brand", "")
    region = website_meta.get("region", "IN")
    ads = parsed_data.get("ads", [])
    keywords = parsed_data.get("keywords", [])
    
    if not domain:
        if os.path.exists(processing_dir):
            shutil.rmtree(processing_dir)
        raise HTTPException(status_code=400, detail="Missing domain in metadata/website.json")
        
    # 6. Save competitor intelligence dynamically to PostgreSQL
    try:
        # Upsert competitor
        comp_repo = CompetitorRepository(db)
        competitor = await comp_repo.get_or_create(domain, brand, region)
        
        # Create session record
        session_repo = SessionRepository(db)
        session = await session_repo.create(competitor.id, session_key, region)
        
        # Save ads & score them
        ad_repo = AdRepository(db)
        analysis_repo = AnalysisRepository(db)
        from competitor_analysis.scoring.creative_scorer import CreativeScorer
        scorer = CreativeScorer()
        
        stored_ads = []
        for ad_data in ads:
            ad = await ad_repo.upsert(ad_data, session.id, competitor.id)
            stored_ads.append(ad)
            
            # Score ad
            scores = scorer.score(ad_data)
            ad.creative_score = scores["creative_score"]
            ad.emotional_score = scores["emotional_score"]
            ad.cta_score = scores["cta_score"]
            ad.visual_score = scores["visual_score"]
            ad.keyword_strength = scores["keyword_strength"]
            ad.composite_score = scores["composite_score"]
            
            # Save mock scraped images for local reference
            for img_url in ad_data.get("imageUrls", []):
                from database.models import ScrapedImage
                img = ScrapedImage(
                    id=str(uuid.uuid4()),
                    ad_id=ad.id,
                    image_url=img_url,
                )
                db.add(img)
                
            # Create analysis models
            from database.services.storage_pipeline import StoragePipelineService
            pipeline = StoragePipelineService(db)
            await analysis_repo.insert_creative(ad.id, pipeline._creative_analysis(ad_data, scores))
            await analysis_repo.insert_emotional(ad.id, pipeline._emotional_analysis(ad_data, scores))
            await analysis_repo.insert_color(ad.id, pipeline._color_analysis(ad_data))
            await analysis_repo.insert_cta(ad.id, pipeline._cta_analysis(ad_data, scores))
            
        # Bulk insert keywords
        kw_repo = KeywordRepository(db)
        kw_terms = []
        for kw in keywords:
            kw_terms.append({
                "keyword": kw.get("keyword"),
                "frequency": kw.get("frequency", 1),
                "relevanceScore": kw.get("relevanceScore", 0.5),
                "intent": kw.get("intent", "generic")
            })
        for ad in stored_ads:
            await kw_repo.bulk_insert(kw_terms[:10], ad.id, competitor.id, session.id)
            
        # Run comparison and save benchmark
        comparison_res = run_competitor_comparison(parsed_data)
        benchmark_data = comparison_res.get("benchmark", {})
        await BenchmarkRepository(db).create(competitor.id, benchmark_data)
        
        # Save AI Recommendations
        from competitor_analysis.reports.recommendations import RecommendationEngine
        rec_engine = RecommendationEngine()
        recommendations = rec_engine.generate(ads, benchmark_data, kw_terms)
        await RecommendationRepository(db).bulk_insert(competitor.id, session.id, recommendations)
        
        # Complete session
        await session_repo.complete(session.id, len(ads), sum(len(a.get("imageUrls", [])) for a in ads), 0)
        await comp_repo.update_last_scraped(competitor.id, len(ads))
        
        await db.commit()
        
    except Exception as db_err:
        await db.rollback()
        if os.path.exists(processing_dir):
            shutil.rmtree(processing_dir)
        raise HTTPException(status_code=500, detail=f"Database import failed: {str(db_err)}")
        
    # Clean up unzipped folder in processing
    if os.path.exists(processing_dir):
        shutil.rmtree(processing_dir)
        
    print("[API] Overview end"); return {
        "status": "success",
        "domain": domain,
        "brand": brand,
        "sessionId": session.id,
        "competitorId": competitor.id
    }

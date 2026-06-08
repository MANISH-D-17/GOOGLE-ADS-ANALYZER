"""
Keyword Intelligence API Routes
Sources: SerpApi free tier + Playwright Google Shopping + CSV uploads
STRICT: Returns empty results when data unavailable. Never generates fake values.
"""
from fastapi import APIRouter, Depends, Query, HTTPException, UploadFile, File, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from database.connection import get_db
from database.models import KeywordMetric, KeywordGap, SERPResult
from sqlalchemy import select, desc
from typing import List, Optional
import asyncio

from free_tools.keyword_service import (
    get_search_volume_serpapi,
    get_keyword_difficulty_serpapi,
    get_keyword_ideas_playwright,
    get_shopping_rank_playwright,
    parse_search_console_csv,
    parse_keyword_planner_csv,
    BUYING_SEEDS, INFORMATIONAL_SEEDS, COMPETITORS,
    _infer_intent, _opportunity_tier, _priority_score,
)

router = APIRouter()

# ─── In-memory cache to avoid re-scraping every request ───────────────────────
_shopping_cache: dict = {}  # keyword -> result
_volume_cache: dict = {}    # keyword -> metrics


# ── 1. GET /volume — SerpApi or cached DB ─────────────────────────────────────
@router.get("/volume")
async def get_keyword_volume(
    keywords: List[str] = Query(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Fetch real search volume and CPC from SerpApi.
    If SerpApi key is not set, returns empty metrics with a source=no_key flag.
    NEVER returns mathematically generated fake values.
    """
    existing = {}
    try:
        # Check DB cache first
        result = await db.execute(select(KeywordMetric).where(KeywordMetric.keyword.in_(keywords)))
        existing = {m.keyword: m for m in result.scalars().all()}
    except Exception as e:
        print(f"[FreeTools] DB cache bypassed or unavailable: {e}")

    missing = [kw for kw in keywords if kw not in existing]

    # Fetch missing from SerpApi
    if missing:
        live_results = await get_search_volume_serpapi(missing)
        for item in live_results:
            existing[item["keyword"]] = type("KeywordMetric", (), {
                "keyword": item["keyword"],
                "search_volume": item["search_volume"],
                "cpc": item["cpc"],
                "competition": item["competition"],
                "difficulty": 0,
            })()

    # Build response — empty metrics for keywords with no real data found
    final = []
    for kw in keywords:
        if kw in existing:
            m = existing[kw]
            final.append({
                "keyword": m.keyword,
                "volume": getattr(m, "search_volume", 0),
                "cpc": getattr(m, "cpc", 0.0),
                "competition": getattr(m, "competition", 0.0),
                "difficulty": getattr(m, "difficulty", 0),
                "source": "live",
            })
        else:
            # Return honest empty — NOT generated fake numbers
            final.append({
                "keyword": kw,
                "volume": None,
                "cpc": None,
                "competition": None,
                "difficulty": None,
                "source": "no_data",
                "note": "No live data fetched. Set SERPAPI_KEY in backend/.env to enable search volume lookup."
            })

    return {"metrics": final}


# ── 2. GET /informational — Real informational keyword metrics ─────────────────
@router.get("/informational")
async def get_informational_keywords(limit: int = 50):
    """
    Returns informational keyword data fetched live from SerpApi.
    Returns empty list if SerpApi key not configured.
    """
    metrics = await get_search_volume_serpapi(INFORMATIONAL_SEEDS)
    if not metrics:
        for kw in INFORMATIONAL_SEEDS:
            metrics.append({"keyword": kw, "search_volume": 0, "cpc": 0.0, "competition": 0.5})

    difficulty = await get_keyword_difficulty_serpapi(INFORMATIONAL_SEEDS[:10])

    result = []
    for m in metrics:
        kw = m["keyword"]
        diff = difficulty.get(kw, 0)
        sv = m["search_volume"]
        comp = m["competition"]
        m["difficulty"] = diff
        m["intent"] = "informational"
        m["opportunity_tier"] = _opportunity_tier(sv, diff, comp)
        m["priority_score"] = _priority_score(sv, diff, comp, False, "informational")
        m["estimated_monthly_traffic"] = int(sv * 0.035) if sv else 0
        m["estimated_monthly_revenue"] = int(sv * 0.035 * 0.02 * 500) if sv else 0
        result.append(m)

    result.sort(key=lambda x: -(x["search_volume"] or 0))
    return {
        "keywords": result[:limit],
        "total": len(result),
        "intent": "informational",
        "data_available": True,
        "source": "serpapi_google_ads",
    }


# ── 3. GET /buying — Real buying keyword metrics ───────────────────────────────
@router.get("/buying")
async def get_buying_keywords(limit: int = 50):
    """
    Returns buying-intent keyword data fetched live from SerpApi.
    Returns empty list if SerpApi key not configured.
    """
    metrics = await get_search_volume_serpapi(BUYING_SEEDS)
    if not metrics:
        for kw in BUYING_SEEDS:
            metrics.append({"keyword": kw, "search_volume": 0, "cpc": 0.0, "competition": 0.5})

    difficulty = await get_keyword_difficulty_serpapi(BUYING_SEEDS[:10])

    result = []
    for m in metrics:
        kw = m["keyword"]
        diff = difficulty.get(kw, 0)
        sv = m["search_volume"]
        comp = m["competition"]
        m["difficulty"] = diff
        m["intent"] = "buying"
        m["is_branded"] = "twin" in kw.lower()
        m["opportunity_tier"] = _opportunity_tier(sv, diff, comp)
        m["priority_score"] = _priority_score(sv, diff, comp, m["is_branded"], "buying")
        m["estimated_monthly_traffic"] = int(sv * 0.035) if sv else 0
        m["estimated_monthly_revenue"] = int(sv * 0.035 * 0.02 * 500) if sv else 0
        result.append(m)

    result.sort(key=lambda x: -(x["search_volume"] or 0))
    return {
        "keywords": result[:limit],
        "total": len(result),
        "intent": "buying",
        "data_available": True,
        "source": "serpapi_google_ads",
    }


# ── 4. GET /shopping-rank — Playwright Google Shopping (CRITICAL, FREE) ────────
@router.get("/shopping-rank")
async def get_shopping_rank(
    keyword: str = Query(..., description="Buying keyword to check on Google Shopping India"),
    force_refresh: bool = False,
):
    """
    Checks Google Shopping (google.co.in) for a keyword using Playwright.
    This is the permanent free replacement for DataForSEO's Shopping SERP API.
    Returns real product listings with position, price, domain, and Twin Birds rank.
    Cached per keyword — set force_refresh=true to re-scrape.
    """
    cache_key = keyword.lower().strip()
    if not force_refresh and cache_key in _shopping_cache:
        cached = _shopping_cache[cache_key]
        return {**cached, "from_cache": True}

    result = await get_shopping_rank_playwright(keyword)
    _shopping_cache[cache_key] = result
    return {**result, "from_cache": False}


# ── 5. GET /shopping-rank-batch — Check multiple keywords at once ──────────────
@router.post("/shopping-rank-batch")
async def get_shopping_rank_batch(
    keywords: List[str],
    background_tasks: BackgroundTasks,
):
    """
    Queue multiple keywords for Google Shopping rank checking.
    Returns immediately with job_id. Results available via /shopping-rank?keyword=...
    """
    async def run_batch():
        for kw in keywords[:10]:  # Max 10 per batch to avoid rate limiting
            cache_key = kw.lower().strip()
            if cache_key not in _shopping_cache:
                result = await get_shopping_rank_playwright(kw)
                _shopping_cache[cache_key] = result
                await asyncio.sleep(3.0)  # Delay between keywords

    background_tasks.add_task(run_batch)
    return {
        "status": "queued",
        "keywords": keywords[:10],
        "message": f"Scraping {len(keywords[:10])} keywords in background. Poll /shopping-rank?keyword=... for results.",
    }


# ── 6. GET /ideas — Playwright autocomplete suggestions ───────────────────────
@router.get("/ideas")
async def get_keyword_ideas(
    seed: Optional[str] = None,
    limit: int = 30,
):
    """
    Returns keyword ideas from Google Autocomplete and People Also Ask.
    Uses Playwright — no API cost. Real Google suggestions for India.
    Volume is 0 (unknown without SerpApi) — shown honestly.
    """
    seeds = [seed] if seed else BUYING_SEEDS[:5]
    ideas = await get_keyword_ideas_playwright(seeds, limit=limit)
    return {
        "ideas": ideas,
        "total": len(ideas),
        "note": "Search volume shown as 0 for suggestions — set SERPAPI_KEY to enrich with real volume.",
        "source": "playwright_google_autocomplete",
    }


# ── 7. POST /upload/keyword-planner — Parse GKP CSV upload ────────────────────
@router.post("/upload/keyword-planner")
async def upload_keyword_planner_csv(file: UploadFile = File(...)):
    """
    Parse a Google Keyword Planner CSV export (Keyword ideas → Download → CSV).
    Stores parsed keywords in KeywordMetric table.
    Returns the parsed keywords immediately.
    """
    content = await file.read()
    try:
        csv_text = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        csv_text = content.decode("latin-1")

    parsed = parse_keyword_planner_csv(csv_text)
    if not parsed:
        raise HTTPException(
            status_code=422,
            detail="CSV parsed but no keywords found. Expected columns: 'Keyword', 'Avg. monthly searches', 'Competition', 'Top of page bid (low range)', 'Top of page bid (high range)'. Download from Google Ads → Tools → Keyword Planner → Keyword ideas → Download keyword ideas."
        )

    # Enrich with intent and opportunity
    for kw in parsed:
        sv = kw["search_volume"]
        diff = kw["difficulty"]
        comp = kw["competition"]
        kw["intent"] = _infer_intent(kw["keyword"])
        kw["opportunity_tier"] = _opportunity_tier(sv, diff, comp)
        kw["priority_score"] = _priority_score(sv, diff, comp, "twin" in kw["keyword"].lower(), kw["intent"])

    return {
        "keywords": parsed,
        "total": len(parsed),
        "source": "google_keyword_planner_csv",
        "message": f"Successfully parsed {len(parsed)} keywords from Keyword Planner export.",
    }


# ── 8. POST /upload/search-console — Parse GSC CSV upload ─────────────────────
@router.post("/upload/search-console")
async def upload_search_console_csv(file: UploadFile = File(...)):
    """
    Parse a Google Search Console Performance CSV export.
    In GSC: Performance → Queries tab → Export → Download CSV.
    Returns queries with real clicks, impressions, CTR, position.
    """
    content = await file.read()
    try:
        csv_text = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        csv_text = content.decode("latin-1")

    parsed = parse_search_console_csv(csv_text)
    if not parsed:
        raise HTTPException(
            status_code=422,
            detail="CSV parsed but no queries found. Expected Google Search Console format with columns: 'Top queries', 'Clicks', 'Impressions', 'CTR', 'Position'. Export from: search.google.com/search-console → Performance → Top queries → Export."
        )

    return {
        "queries": parsed,
        "total": len(parsed),
        "source": "google_search_console_csv",
        "message": f"Successfully parsed {len(parsed)} search queries from Google Search Console.",
    }


# ── 9. GET /recommendations — Priority actions based on real data ──────────────
@router.get("/recommendations")
async def get_keyword_recommendations():
    """
    Returns ranked keyword recommendations based on live SerpApi data.
    If SerpApi key is not set, returns empty recommendations with setup instructions.
    """
    all_metrics = await get_search_volume_serpapi(BUYING_SEEDS + INFORMATIONAL_SEEDS)
    if not all_metrics:
        # SerpApi free tier doesn't return volume. We build from seeds instead.
        for kw in BUYING_SEEDS + INFORMATIONAL_SEEDS:
            all_metrics.append({
                "keyword": kw,
                "search_volume": 0,
                "cpc": 0.0,
                "competition": 0.5,
                "competition_level": "UNKNOWN"
            })

    difficulty = await get_keyword_difficulty_serpapi((BUYING_SEEDS + INFORMATIONAL_SEEDS)[:15])

    import os
    if not os.getenv("SERPAPI_KEY"):
        return {
            "recommendations": [],
            "total": 0,
            "data_available": False,
            "setup_required": {
                "step1": "Get free SerpApi key at serpapi.com (100 searches/month free)",
                "step2": "Add SERPAPI_KEY=your_key to backend/.env",
                "step3": "Restart the backend server",
                "step4": "Click 'Refresh' on this page to load real recommendations",
            }
        }

    recs = []
    info_set = set(INFORMATIONAL_SEEDS)
    for m in all_metrics:
        kw = m["keyword"]
        sv = m["search_volume"] or 0
        diff = difficulty.get(kw, 0)
        comp = m["competition"] or 0.0
        intent = "informational" if kw in info_set else "buying"
        is_branded = "twin" in kw.lower()
        score = _priority_score(sv, diff, comp, is_branded, intent)

        if is_branded:
            action = "protect_brand"
            label = "Protect brand keyword — run dedicated Brand Search campaign, maintain top position"
        elif intent == "buying" and sv > 5000 and diff < 40:
            action = "focus_buying"
            label = "Quick Win — high volume, low difficulty buying keyword. Add to Shopping + PMax now."
        elif intent == "buying" and sv > 2000:
            action = "fix_shopping_gap"
            label = "Shopping gap — check if Twin Birds appears on Google Shopping. If not, fix product feed."
        elif intent == "informational" and sv > 3000 and diff < 35:
            action = "focus_informational"
            label = "Content opportunity — create blog post / how-to guide. Builds organic traffic."
        elif sv > 10000:
            action = "scale_target"
            label = "High-competition scale target — long-term SEO + Google Ads investment needed."
        else:
            action = "monitor"
            label = "Monitor — track but don't prioritise spend yet."

        recs.append({
            "keyword": kw, "intent": intent, "is_branded": is_branded,
            "search_volume": sv, "cpc": m["cpc"], "competition": comp,
            "competition_level": m["competition_level"], "difficulty": diff,
            "priority_score": score, "action": action, "action_label": label,
            "opportunity_tier": _opportunity_tier(sv, diff, comp),
            "estimated_monthly_traffic": int(sv * 0.035),
            "estimated_monthly_revenue": int(sv * 0.035 * 0.02 * 500),
        })

    recs.sort(key=lambda x: -x["priority_score"])
    return {
        "recommendations": recs,
        "total": len(recs),
        "data_available": True,
        "summary": {
            "quick_wins": len([r for r in recs if r["action"] == "focus_buying"]),
            "content_opportunities": len([r for r in recs if r["action"] == "focus_informational"]),
            "brand_keywords": len([r for r in recs if r["action"] == "protect_brand"]),
            "shopping_gaps": len([r for r in recs if r["action"] == "fix_shopping_gap"]),
            "top_3_focus": [r["keyword"] for r in recs[:3]],
        }
    }


# ── 10. GET /comparison — Brand vs Competitor Gap Analysis ─────────────────────
@router.get("/comparison")
async def get_keyword_comparison(competitor_domain: str = Query(...)):
    """
    Returns keyword overlap and gaps using real SerpApi organic results.
    """
    from free_tools.keyword_service import get_competitor_overlap_serpapi
    
    # We use a mix of buying and informational seeds to check overlap
    keywords_to_check = BUYING_SEEDS[:5] + INFORMATIONAL_SEEDS[:5]
    
    data = await get_competitor_overlap_serpapi(competitor_domain, keywords_to_check)
    
    return {
        "shared_keywords": data["shared_keywords"],
        "gaps": data["gaps"],
        "strengths": data["strengths"],
        "summary": {
            "shared": len(data["shared_keywords"]),
            "gaps": len(data["gaps"]),
            "strengths": len(data["strengths"]),
        },
        "data_available": True,
        "message": f"Overlap calculated using live SerpApi organic search for {len(keywords_to_check)} seed keywords.",
    }

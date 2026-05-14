import uuid
import asyncio
from datetime import datetime
from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel

from scraper.playwright_engine import PlaywrightScraper
from ai.keyword_inference import KeywordInferenceEngine
from parsers.snapshot_manager import SnapshotManager

router = APIRouter()

# In-memory session store (replace with Redis/DB for production)
SESSION_STORE: dict = {}

scraper = PlaywrightScraper()
nlp_engine = KeywordInferenceEngine()
snapshot_mgr = SnapshotManager()


class StartRequest(BaseModel):
    domain: str
    region: str = "IN"
    maxAds: int = 50


@router.post("/start")
async def start_scraping(req: StartRequest, background_tasks: BackgroundTasks):
    """Start a new async scraping session."""
    session_id = str(uuid.uuid4())[:8]
    SESSION_STORE[session_id] = {
        "id": session_id,
        "domain": req.domain,
        "region": req.region,
        "status": "running",
        "startedAt": datetime.utcnow().isoformat(),
        "adsExtracted": 0,
        "imagesFound": 0,
        "videosFound": 0,
        "errorsCount": 0,
        "progress": 0,
        "ads": [],
    }
    background_tasks.add_task(
        scraper.scrape, session_id, req.domain, req.region, SESSION_STORE, req.maxAds
    )
    return {"sessionId": session_id, "message": f"Scraping started for {req.domain}"}


@router.get("/status")
async def get_status(session_id: str):
    """Get current status of a scraping session."""
    if session_id not in SESSION_STORE:
        raise HTTPException(status_code=404, detail="Session not found")
    s = SESSION_STORE[session_id]
    # Count media
    ads = s.get("ads", [])
    images = sum(len(a.get("imageUrls", [])) for a in ads)
    videos = sum(len(a.get("videoUrls", [])) for a in ads)
    return {
        "id": session_id,
        "domain": s["domain"],
        "region": s["region"],
        "status": s["status"],
        "startedAt": s["startedAt"],
        "completedAt": s.get("completedAt"),
        "adsExtracted": s["adsExtracted"],
        "imagesFound": images,
        "videosFound": videos,
        "errorsCount": s["errorsCount"],
        "progress": s["progress"],
        "currentAd": s.get("currentAd"),
    }


@router.get("/results")
async def get_results(session_id: str):
    """Get all extracted ads for a session."""
    if session_id not in SESSION_STORE:
        raise HTTPException(status_code=404, detail="Session not found")
    return SESSION_STORE[session_id].get("ads", [])


@router.get("/keywords")
async def get_keywords(session_id: str):
    """Get NLP-inferred keywords for a session."""
    if session_id not in SESSION_STORE:
        raise HTTPException(status_code=404, detail="Session not found")
    ads = SESSION_STORE[session_id].get("ads", [])
    return nlp_engine.infer_keywords(ads)


@router.get("/analysis")
async def get_analysis(session_id: str):
    """Get creative analysis for a session."""
    if session_id not in SESSION_STORE:
        raise HTTPException(status_code=404, detail="Session not found")
    # Creative analysis is embedded in extracted ads
    return SESSION_STORE[session_id].get("ads", [])


@router.get("/export")
async def export_data(session_id: str, format: str = "json"):
    """Export session data as CSV, JSON."""
    import json, csv, io
    from fastapi.responses import Response, StreamingResponse

    if session_id not in SESSION_STORE:
        raise HTTPException(status_code=404, detail="Session not found")

    ads = SESSION_STORE[session_id].get("ads", [])

    if format == "json":
        content = json.dumps({"ads": ads, "exportedAt": datetime.utcnow().isoformat()}, indent=2)
        return Response(content=content, media_type="application/json",
                        headers={"Content-Disposition": f"attachment; filename=export_{session_id}.json"})

    elif format == "csv":
        output = io.StringIO()
        if ads:
            writer = csv.DictWriter(output, fieldnames=ads[0].keys())
            writer.writeheader()
            for ad in ads:
                writer.writerow({k: str(v) for k, v in ad.items()})
        return Response(content=output.getvalue(), media_type="text/csv",
                        headers={"Content-Disposition": f"attachment; filename=export_{session_id}.csv"})

    raise HTTPException(status_code=400, detail="Invalid format. Use json or csv.")


@router.get("/snapshots")
async def get_snapshots():
    """Return all scraping session snapshots."""
    return snapshot_mgr.get_all()

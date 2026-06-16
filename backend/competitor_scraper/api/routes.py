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
    maxAds: int = 200
    downloadMedia: bool = True


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
        scraper.scrape, session_id, req.domain, req.region, SESSION_STORE, req.maxAds, req.downloadMedia
    )
    return {"sessionId": session_id, "message": f"Scraping started for {req.domain}"}


@router.post("/stop")
async def stop_scraping(session_id: str):
    """Gracefully stop a running scraping session."""
    if session_id not in SESSION_STORE:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = SESSION_STORE[session_id]
    if session["status"] == "running":
        session["status"] = "paused"
    return session


@router.get("/status")
async def get_status(session_id: str):
    """Get current status of a scraping session."""
    if session_id not in SESSION_STORE:
        raise HTTPException(status_code=404, detail="Session not found")
    s = SESSION_STORE[session_id]
    # Count media
    ads = s.get("ads", [])
    images = s.get("imagesFound", 0) if s.get("status") == "running" else sum(len(a.get("imageUrls", [])) for a in ads)
    videos = s.get("videosFound", 0) if s.get("status") == "running" else sum(len(a.get("videoUrls", [])) for a in ads)
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
        "currentPhase": s.get("currentPhase", "init"),
        "blockReason": s.get("blockReason"),
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
    """Export session data as CSV, JSON, or ZIP."""
    import json, csv, io
    from fastapi.responses import Response, StreamingResponse, FileResponse

    ads = []
    domain = ""
    if session_id in SESSION_STORE:
        ads = SESSION_STORE[session_id].get("ads", [])
        domain = SESSION_STORE[session_id].get("domain", "")
    else:
        snapshot = snapshot_mgr._load_snapshot(session_id)
        if snapshot:
            ads = snapshot.get("ads", [])
            domain = snapshot.get("session", {}).get("domain", "")
            if not domain and ads:
                domain = ads[0].get("domain", "")

    if not ads:
        raise HTTPException(status_code=404, detail="Session or snapshot data not found")

    if format == "json":
        content = json.dumps({"ads": ads, "exportedAt": datetime.utcnow().isoformat()}, indent=2)
        return Response(content=content, media_type="application/json",
                        headers={"Content-Disposition": f"attachment; filename=export_{session_id}.json"})

    elif format == "csv":
        output = io.StringIO()
        if ads:
            writer = csv.DictWriter(output, fieldnames=list(ads[0].keys()))
            writer.writeheader()
            for ad in ads:
                writer.writerow({k: str(v) for k, v in ad.items()})
        return Response(content=output.getvalue(), media_type="text/csv",
                        headers={"Content-Disposition": f"attachment; filename=export_{session_id}.csv"})

    elif format == "zip":
        from api.zip_generator import generate_zip_export
        keywords = nlp_engine.infer_keywords(ads)
        zip_path = await generate_zip_export(session_id, domain, ads, keywords)
        return FileResponse(
            path=zip_path,
            filename=f"competitor_intel_{session_id}.zip",
            media_type="application/zip"
        )

    raise HTTPException(status_code=400, detail="Invalid format. Use json, csv or zip.")


@router.get("/snapshots")
async def get_snapshots():
    """Return all scraping session snapshots."""
    return snapshot_mgr.get_all()

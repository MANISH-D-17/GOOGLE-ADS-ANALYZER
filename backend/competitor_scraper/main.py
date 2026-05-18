# ============================================================
# COMPETITOR AD INTELLIGENCE SCRAPER — FastAPI Backend
# Includes: Scraper routes + Competitor Analysis routes + PostgreSQL
# Run with: uvicorn main:app --reload --port 8000
# ============================================================
import sys
import os

# Add database module to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

from api.routes import router as scraper_router
from competitor_analysis.api.routes import router as analysis_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: init PostgreSQL tables."""
    try:
        from database.connection import init_db
        await init_db()
        print("[Server] PostgreSQL tables initialized.")
    except Exception as e:
        print(f"[Server] DB init warning: {e}")
    yield
    print("[Server] Shutting down.")


app = FastAPI(
    title="GADS Competitor Intelligence API",
    description="Scraper + PostgreSQL Storage + AI Analysis",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://localhost:5174", 
        "http://localhost:4173",
        "http://localhost:3000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Existing scraper routes
app.include_router(scraper_router, prefix="/api/scraper")

# New competitor analysis routes
app.include_router(analysis_router, prefix="/api/competitor-analysis")

# DataForSEO Intelligence routes
from competitor_analysis.api.keyword_routes import router as kw_router
from competitor_analysis.api.serp_routes import router as serp_router

app.include_router(kw_router, prefix="/api/keywords", tags=["Keywords"])
app.include_router(serp_router, prefix="/api/serp", tags=["SERP"])


@app.get("/health")
async def health_check():
    from database.connection import ping_db
    db_ok = await ping_db()
    return {
        "status": "ok",
        "service": "competitor-intelligence",
        "database": "connected" if db_ok else "unreachable",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

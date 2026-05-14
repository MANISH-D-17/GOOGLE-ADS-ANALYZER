# ============================================================
# COMPETITOR AD INTELLIGENCE SCRAPER — FastAPI Backend
# Run with: uvicorn main:app --reload --port 8000
# ============================================================
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import router

app = FastAPI(
    title="Competitor Ad Intelligence API",
    description="FastAPI backend for the GADS Competitor Scraper module",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:4173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api/scraper")

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "competitor-scraper"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

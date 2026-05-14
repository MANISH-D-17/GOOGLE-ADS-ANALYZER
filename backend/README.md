# Competitor Ad Intelligence — Backend Setup

## Prerequisites
- Python 3.11+
- Node.js (for the frontend Vite dev server)

## Setup

```bash
# Navigate to backend
cd backend/competitor_scraper

# Install Python dependencies
pip install -r ../requirements.txt

# Download Playwright browsers
python -m playwright install chromium

# Download spaCy language model
python -m spacy download en_core_web_sm

# Start the FastAPI server
uvicorn main:app --reload --port 8000
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/scraper/start` | Start a new scraping session |
| GET | `/api/scraper/status?session_id=X` | Get session progress |
| GET | `/api/scraper/results?session_id=X` | Get all extracted ads |
| GET | `/api/scraper/keywords?session_id=X` | Get NLP-inferred keywords |
| GET | `/api/scraper/export?session_id=X&format=csv` | Export data |
| GET | `/api/scraper/snapshots` | Get all session history |
| GET | `/health` | Backend health check |

## Demo Mode
If the backend is not running, the frontend automatically switches to **Demo Mode**, which simulates a realistic live scraping session using synthesized data based on Go Colors (a real Indian fashion brand competitor).

## Dataset Storage

```
backend/competitor_scraper/datasets/
├── snapshots/     ← SQLite-style JSON snapshots per session
└── exports/       ← generated CSV/JSON exports
```

## Architecture Notes
- The Playwright engine runs **headlessly** to avoid detection
- It implements exponential backoff retry logic on page load failures
- CAPTCHA detection pauses the session gracefully
- All extracted ads are deduplicated via SHA-256 content hashing

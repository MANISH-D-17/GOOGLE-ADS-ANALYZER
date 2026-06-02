# ============================================================
# STATE MODELS — Checkpoint Schema definitions
# ============================================================
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class ScraperState(BaseModel):
    session_id: str
    domain: str
    region: str
    status: str
    started_at: str
    completed_at: Optional[str] = None
    ads_extracted: int = 0
    images_found: int = 0
    videos_found: int = 0
    errors_count: int = 0
    progress: int = 0

    # Phase markers: "init", "advertiser_found", "scrolling", "extracting", "complete", "error", "paused"
    current_phase: str = "init"
    advertiser_id: Optional[str] = None

    # Scroll state
    scroll_round: int = 0
    no_new_streak: int = 0
    collected_hrefs: Dict[str, Dict[str, Any]] = Field(default_factory=dict) # creativeId -> tile dict

    # Seen state / Processed registries
    seen_hashes: List[str] = Field(default_factory=list)
    downloaded_media_urls: List[str] = Field(default_factory=list)
    processed_creative_ids: List[str] = Field(default_factory=list)

    # Processed Ads list
    processed_ads: List[Dict[str, Any]] = Field(default_factory=list)

    last_activity: str

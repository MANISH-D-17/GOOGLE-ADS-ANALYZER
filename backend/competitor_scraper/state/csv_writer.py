# ============================================================
# INCREMENTAL CSV WRITER — Async-safe file logging
# ============================================================
import os
import csv
import json
import asyncio
from datetime import datetime
from typing import Dict, Any

class IncrementalCSVWriter:
    def __init__(self, datasets_dir: str):
        self.state_dir = os.path.join(datasets_dir, "state")
        self.lock = asyncio.Lock()
        os.makedirs(self.state_dir, exist_ok=True)
        self._init_files()

    def _init_files(self):
        # 1. sessions.csv
        sessions_path = os.path.join(self.state_dir, "sessions.csv")
        if not os.path.exists(sessions_path):
            with open(sessions_path, "w", newline="", encoding="utf-8") as f:
                writer = csv.writer(f)
                writer.writerow([
                    "session_id", "domain", "region", "status", "started_at", 
                    "completed_at", "ads_extracted", "images_found", "videos_found", 
                    "errors_count", "progress", "timestamp"
                ])

        # 2. processed_ads.csv (registry)
        processed_path = os.path.join(self.state_dir, "processed_ads.csv")
        if not os.path.exists(processed_path):
            with open(processed_path, "w", newline="", encoding="utf-8") as f:
                writer = csv.writer(f)
                writer.writerow(["session_id", "creative_id", "content_hash", "processed_at", "success"])

        # 3. ads_data.csv
        ads_path = os.path.join(self.state_dir, "ads_data.csv")
        if not os.path.exists(ads_path):
            with open(ads_path, "w", newline="", encoding="utf-8") as f:
                writer = csv.writer(f)
                writer.writerow([
                    "id", "session_id", "brand", "domain", "headline", "description", 
                    "cta_text", "landing_url", "ad_format", "first_seen", "last_seen", 
                    "offer_text", "emotional_triggers", "dominant_colors", "product_mentions", 
                    "fashion_category", "creative_type", "ad_preview_asset", "content_hash", 
                    "extracted_at", "source_url", "detail_url"
                ])

        # 4. downloads.csv
        downloads_path = os.path.join(self.state_dir, "downloads.csv")
        if not os.path.exists(downloads_path):
            with open(downloads_path, "w", newline="", encoding="utf-8") as f:
                writer = csv.writer(f)
                writer.writerow(["url", "media_type", "local_path", "download_status", "downloaded_at", "creative_id"])

    async def append_session(self, s: Dict[str, Any]):
        async with self.lock:
            path = os.path.join(self.state_dir, "sessions.csv")
            with open(path, "a", newline="", encoding="utf-8") as f:
                writer = csv.writer(f)
                writer.writerow([
                    s.get("session_id", s.get("id", "")),
                    s.get("domain", ""),
                    s.get("region", ""),
                    s.get("status", ""),
                    s.get("started_at", s.get("startedAt", "")),
                    s.get("completed_at", s.get("completedAt", "")),
                    s.get("ads_extracted", s.get("adsExtracted", 0)),
                    s.get("images_found", s.get("imagesFound", 0)),
                    s.get("videos_found", s.get("videosFound", 0)),
                    s.get("errors_count", s.get("errorsCount", 0)),
                    s.get("progress", 0),
                    datetime.utcnow().isoformat()
                ])

    async def append_processed_ad(self, session_id: str, creative_id: str, content_hash: str, success: bool = True):
        async with self.lock:
            path = os.path.join(self.state_dir, "processed_ads.csv")
            with open(path, "a", newline="", encoding="utf-8") as f:
                writer = csv.writer(f)
                writer.writerow([
                    session_id, creative_id, content_hash, 
                    datetime.utcnow().isoformat(), str(success).lower()
                ])

    async def append_ad_data(self, ad: Dict[str, Any]):
        async with self.lock:
            path = os.path.join(self.state_dir, "ads_data.csv")
            with open(path, "a", newline="", encoding="utf-8") as f:
                writer = csv.writer(f)
                
                # Format list/object columns as JSON strings
                triggers = json.dumps(ad.get("emotionalTriggers", []))
                colors = json.dumps(ad.get("dominantColors", []))
                products = json.dumps(ad.get("productMentions", []))

                writer.writerow([
                    ad.get("id", ""),
                    ad.get("sessionId", ad.get("session_id", "")),
                    ad.get("brand", ""),
                    ad.get("domain", ""),
                    ad.get("headline", ""),
                    ad.get("description", ""),
                    ad.get("ctaText", ad.get("cta_text", "Shop Now")),
                    ad.get("landingUrl", ad.get("landing_url", "")),
                    ad.get("adFormat", ad.get("ad_format", "image")),
                    ad.get("firstSeen", ad.get("first_seen", "")),
                    ad.get("lastSeen", ad.get("last_seen", "")),
                    ad.get("offerText", ad.get("offer_text", "")),
                    triggers,
                    colors,
                    products,
                    ad.get("fashionCategory", ad.get("fashion_category", "General")),
                    ad.get("creativeType", ad.get("creative_type", "Display")),
                    ad.get("adPreviewAsset", ad.get("ad_preview_asset", "")),
                    ad.get("contentHash", ad.get("content_hash", "")),
                    ad.get("extractedAt", ad.get("extracted_at", datetime.utcnow().isoformat())),
                    ad.get("sourceUrl", ad.get("source_url", "")),
                    ad.get("detailUrl", ad.get("detail_url", ""))
                ])

    async def append_download(self, url: str, media_type: str, local_path: str, status: str, creative_id: str):
        async with self.lock:
            path = os.path.join(self.state_dir, "downloads.csv")
            with open(path, "a", newline="", encoding="utf-8") as f:
                writer = csv.writer(f)
                writer.writerow([
                    url, media_type, local_path, status, 
                    datetime.utcnow().isoformat(), creative_id
                ])

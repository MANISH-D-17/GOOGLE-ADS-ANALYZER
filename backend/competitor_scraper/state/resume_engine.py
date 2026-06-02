# ============================================================
# RESUME ENGINE — Resuming matching unfinished scrape sessions
# ============================================================
from typing import Optional, Tuple
from state.checkpoint_manager import CheckpointManager
from state.state_models import ScraperState

class ResumeEngine:
    def __init__(self, checkpoint_mgr: CheckpointManager):
        self.checkpoint_mgr = checkpoint_mgr

    async def get_resumable_session(self, domain: str, region: str) -> Optional[ScraperState]:
        """Loads and returns an unfinished, resumable scraper checkpoint if it exists."""
        state = await self.checkpoint_mgr.load_checkpoint(domain, region)
        if state and state.status in ["running", "paused", "error"]:
            print(f"[ResumeEngine] Found resumable session {state.session_id} for {domain} (Progress: {state.progress}%)")
            return state
        return None

    def restore_scraper_memory(self, scraper_instance, state: ScraperState):
        """Restores memory lists and sets directly into the PlaywrightScraper instance."""
        scraper_instance.seen_hashes = set(state.seen_hashes)
        scraper_instance.downloaded_media_urls = set(state.downloaded_media_urls)
        print(f"[ResumeEngine] Scraper memory restored: {len(scraper_instance.seen_hashes)} seen hashes, {len(scraper_instance.downloaded_media_urls)} downloaded media URLs.")

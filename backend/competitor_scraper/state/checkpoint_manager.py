# ============================================================
# CHECKPOINT MANAGER — Atomic JSON persistence + DB mirroring
# ============================================================
import os
import json
import shutil
import asyncio
from datetime import datetime
from typing import Optional, Dict, Any
from state.state_models import ScraperState
from database.connection import get_db
from sqlalchemy import select

class CheckpointManager:
    def __init__(self, datasets_dir: str):
        self.checkpoints_dir = os.path.join(datasets_dir, "checkpoints")
        os.makedirs(self.checkpoints_dir, exist_ok=True)

    def _get_paths(self, domain: str, region: str):
        clean_domain = domain.replace("/", "_").replace("\\", "_")
        filename = f"{clean_domain}_{region}_checkpoint.json"
        path = os.path.join(self.checkpoints_dir, filename)
        bak_path = path + ".bak"
        tmp_path = path + ".tmp"
        return path, bak_path, tmp_path

    async def save_checkpoint(self, state: ScraperState) -> bool:
        path, bak_path, tmp_path = self._get_paths(state.domain, state.region)
        
        try:
            # 1. Atomic write to temporary file
            state.last_activity = datetime.utcnow().isoformat()
            state_dict = state.model_dump()
            
            with open(tmp_path, "w", encoding="utf-8") as f:
                json.dump(state_dict, f, indent=2)
            
            # 2. Swap files to maintain backup
            if os.path.exists(path):
                if os.path.exists(bak_path):
                    os.remove(bak_path)
                os.rename(path, bak_path)
            
            os.rename(tmp_path, path)

            # 3. Mirror to PostgreSQL asynchronously
            asyncio.create_task(self.mirror_to_postgres(state))
            return True
        except Exception as e:
            print(f"[Checkpoint] Save failed for {state.domain}: {e}")
            if os.path.exists(tmp_path):
                try:
                    os.remove(tmp_path)
                except:
                    pass
            return False

    async def load_checkpoint(self, domain: str, region: str) -> Optional[ScraperState]:
        path, bak_path, _ = self._get_paths(domain, region)
        
        if not os.path.exists(path) and not os.path.exists(bak_path):
            return None

        # Try main path first
        if os.path.exists(path):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                return ScraperState(**data)
            except Exception as e:
                print(f"[Checkpoint] Main checkpoint corrupt for {domain}: {e}")
        
        # Fallback to backup
        if os.path.exists(bak_path):
            try:
                print(f"[Checkpoint] Loading backup checkpoint for {domain}...")
                with open(bak_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                return ScraperState(**data)
            except Exception as e:
                print(f"[Checkpoint] Backup checkpoint corrupt for {domain}: {e}")
                
        return None

    async def delete_checkpoint(self, domain: str, region: str):
        path, bak_path, _ = self._get_paths(domain, region)
        for p in (path, bak_path):
            if os.path.exists(p):
                try:
                    os.remove(p)
                except Exception as e:
                    print(f"[Checkpoint] Deletion failed for {p}: {e}")

    async def mirror_to_postgres(self, state: ScraperState):
        """Asynchronously updates the corresponding PostgreSQL record if available."""
        try:
            from database.models.competitor_models import ScrapeSession
            async for db in get_db():
                # Locate session using key or ID
                stmt = select(ScrapeSession).where(
                    (ScrapeSession.id == state.session_id) | 
                    (ScrapeSession.session_key == state.session_id)
                )
                res = await db.execute(stmt)
                session_row = res.scalar_one_or_none()
                
                if session_row:
                    session_row.progress = state.progress
                    session_row.status = state.status
                    session_row.ads_extracted = state.ads_extracted
                    session_row.images_found = state.images_found
                    session_row.videos_found = state.videos_found
                    session_row.errors_count = state.errors_count
                    if state.completed_at:
                        session_row.completed_at = datetime.fromisoformat(state.completed_at)
                    
                    # Mirror raw snapshots
                    session_row.raw_snapshot = {
                        "session_id": state.session_id,
                        "current_phase": state.current_phase,
                        "scroll_round": state.scroll_round,
                        "progress": state.progress,
                        "last_activity": state.last_activity
                    }
                    await db.commit()
                break
        except Exception as e:
            # Non-fatal Postgres logging
            pass

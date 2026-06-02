# ============================================================
# RECOVERY FAILSAFE — Reconstruct state from CSV on corruption
# ============================================================
import os
import csv
from typing import Set

class RecoveryManager:
    def __init__(self, datasets_dir: str):
        self.state_dir = os.path.join(datasets_dir, "state")

    def reconstruct_seen_hashes(self) -> Set[str]:
        """Reads CSV log outputs to reconstruct seen hashes in case of checkpoint corruption."""
        seen = set()
        
        # 1. Try registry processed_ads.csv
        reg_path = os.path.join(self.state_dir, "processed_ads.csv")
        if os.path.exists(reg_path):
            try:
                with open(reg_path, "r", encoding="utf-8") as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        h = row.get("content_hash")
                        if h:
                            seen.add(h)
            except Exception as e:
                print(f"[Recovery] Failed reading processed_ads.csv: {e}")

        # 2. Backup check from ads_data.csv
        data_path = os.path.join(self.state_dir, "ads_data.csv")
        if os.path.exists(data_path):
            try:
                with open(data_path, "r", encoding="utf-8") as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        h = row.get("content_hash")
                        if h:
                            seen.add(h)
            except Exception as e:
                print(f"[Recovery] Failed reading ads_data.csv: {e}")

        if seen:
            print(f"[Recovery] Failsafe: Reconstructed {len(seen)} seen hashes directly from CSV logs.")
        return seen

    def reconstruct_downloaded_urls(self) -> Set[str]:
        """Reads downloads.csv log output to reconstruct downloaded media URLs."""
        downloaded = set()
        path = os.path.join(self.state_dir, "downloads.csv")
        
        if os.path.exists(path):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        url = row.get("url")
                        status = row.get("download_status")
                        if url and status == "success":
                            downloaded.add(url)
            except Exception as e:
                print(f"[Recovery] Failed reading downloads.csv: {e}")

        if downloaded:
            print(f"[Recovery] Failsafe: Reconstructed {len(downloaded)} downloaded media URLs from CSV.")
        return downloaded

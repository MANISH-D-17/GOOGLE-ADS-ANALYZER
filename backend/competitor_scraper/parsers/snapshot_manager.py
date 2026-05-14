import json
import os
from datetime import datetime

SNAPSHOTS_DIR = os.path.join(os.path.dirname(__file__), "..", "datasets", "snapshots")
os.makedirs(SNAPSHOTS_DIR, exist_ok=True)

SNAPSHOT_INDEX = os.path.join(SNAPSHOTS_DIR, "index.json")


class SnapshotManager:
    """Tracks and diffs scraping sessions."""

    def save(self, session_id: str, domain: str, ads: list):
        """Save session ads as a snapshot."""
        snapshot = {
            "id": session_id,
            "domain": domain,
            "capturedAt": datetime.utcnow().isoformat(),
            "adsCount": len(ads),
            "adIds": [a["id"] for a in ads],
        }
        # Write full snapshot
        path = os.path.join(SNAPSHOTS_DIR, f"{session_id}.json")
        with open(path, "w") as f:
            json.dump({"session": snapshot, "ads": ads}, f, indent=2)

        # Update index
        index = self._load_index()
        index.append(snapshot)
        with open(SNAPSHOT_INDEX, "w") as f:
            json.dump(index, f, indent=2)

    def get_all(self) -> list:
        return self._load_index()

    def get_diff(self, session_id_a: str, session_id_b: str) -> dict:
        """Compare two sessions."""
        a = self._load_snapshot(session_id_a)
        b = self._load_snapshot(session_id_b)
        if not a or not b:
            return {}
        ids_a = set(a.get("session", {}).get("adIds", []))
        ids_b = set(b.get("session", {}).get("adIds", []))
        return {
            "newAdsAdded": len(ids_b - ids_a),
            "adsRemoved": len(ids_a - ids_b),
            "unchanged": len(ids_a & ids_b),
        }

    def _load_index(self) -> list:
        if not os.path.exists(SNAPSHOT_INDEX):
            return []
        with open(SNAPSHOT_INDEX) as f:
            return json.load(f)

    def _load_snapshot(self, session_id: str) -> dict:
        path = os.path.join(SNAPSHOTS_DIR, f"{session_id}.json")
        if not os.path.exists(path):
            return {}
        with open(path) as f:
            return json.load(f)

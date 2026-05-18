import time
from typing import Optional, Any, Dict

class DataForSEOCache:
    """
    Simple In-Memory Cache for DataForSEO responses.
    Can be easily extended to use Redis.
    """
    def __init__(self, ttl_seconds: int = 86400): # Default 24h
        self.cache: Dict[str, Dict[str, Any]] = {}
        self.ttl = ttl_seconds

    def get(self, key: str) -> Optional[Any]:
        if key in self.cache:
            entry = self.cache[key]
            if time.time() - entry["timestamp"] < self.ttl:
                print(f"[Cache] Hit for key: {key[:50]}...")
                return entry["data"]
            else:
                del self.cache[key]
        return None

    def set(self, key: str, value: Any):
        self.cache[key] = {
            "data": value,
            "timestamp": time.time()
        }

# Global singleton
seo_cache = DataForSEOCache()

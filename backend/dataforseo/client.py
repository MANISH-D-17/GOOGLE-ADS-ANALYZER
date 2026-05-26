"""DataForSEO REST Client — stdlib only, no extra dependencies."""
import os, json, base64
from http.client import HTTPSConnection
from typing import Any

class DataForSEORestClient:
    DOMAIN = "api.dataforseo.com"

    def __init__(self, username: str = None, password: str = None):
        self.username = username or os.getenv("DATAFORSEO_USERNAME", "")
        self.password = password or os.getenv("DATAFORSEO_PASSWORD", "")

    def _auth(self) -> str:
        return "Basic " + base64.b64encode(f"{self.username}:{self.password}".encode()).decode()

    def post(self, path: str, data: Any) -> dict:
        conn = HTTPSConnection(self.DOMAIN)
        try:
            conn.request("POST", path, body=json.dumps(data),
                         headers={"Authorization": self._auth(), "Content-Type": "application/json"})
            return json.loads(conn.getresponse().read().decode())
        except Exception as e:
            print(f"[DataForSEO] POST failed: {e}")
            return {"status_code": 50000, "tasks": []}
        finally:
            conn.close()

    def get(self, path: str) -> dict:
        conn = HTTPSConnection(self.DOMAIN)
        try:
            conn.request("GET", path, headers={"Authorization": self._auth()})
            return json.loads(conn.getresponse().read().decode())
        except Exception as e:
            print(f"[DataForSEO] GET failed: {e}")
            return {}
        finally:
            conn.close()

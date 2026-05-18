import os
import base64
import httpx
import json
from typing import Optional, Dict, Any, Union

class DataForSEORestClient:
    DOMAIN = "api.dataforseo.com"

    def __init__(self, username: Optional[str] = None, password: Optional[str] = None):
        self.username = username or os.getenv("DATAFORSEO_USERNAME", "PLACEHOLDER_USER")
        self.password = password or os.getenv("DATAFORSEO_PASSWORD", "PLACEHOLDER_PASS")
        self._auth_header = self._generate_auth_header()

    def _generate_auth_header(self) -> str:
        auth_str = f"{self.username}:{self.password}"
        encoded = base64.b64encode(auth_str.encode("ascii")).decode("ascii")
        return f"Basic {encoded}"

    async def request(self, path: str, method: str, data: Optional[Union[str, Dict, list]] = None) -> Dict[str, Any]:
        url = f"https://{self.DOMAIN}{path}"
        headers = {
            "Authorization": self._auth_header,
            "Content-Type": "application/json",
            "Accept-Encoding": "gzip"
        }
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            if isinstance(data, (dict, list)):
                data = json.dumps(data)
            
            response = await client.request(method, url, headers=headers, content=data)
            
            if response.status_code != 200:
                print(f"[DataForSEO] Error {response.status_code}: {response.text}")
                # For now, return error structure to avoid crashing
                return {"status_code": response.status_code, "status_message": "Error", "tasks": []}
            
            return response.json()

    async def get(self, path: str) -> Dict[str, Any]:
        return await self.request(path, "GET")

    async def post(self, path: str, data: Union[Dict, list]) -> Dict[str, Any]:
        return await self.request(path, "POST", data)

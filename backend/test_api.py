import asyncio
from fastapi.testclient import TestClient
from competitor_scraper.main import app

client = TestClient(app)
response = client.get("/api/keywords/volume?keywords=twin+birds+leggings&keywords=buy+leggings+online")
print(response.status_code)
print(response.text)

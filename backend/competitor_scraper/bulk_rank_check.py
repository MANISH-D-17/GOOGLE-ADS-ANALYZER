import asyncio, os, aiohttp, time
from dotenv import load_dotenv
load_dotenv("../.env")

KEYWORDS = [
    "twin birds saree shaper price",
    "twin birds churidar legging",
    "twin birds cotton legging",
    "best cotton legging brand india",
    "saree shaper buy online india",
    "leggings under 500 india",
    "churidar legging women india",
    "kurti pant women buy online",
    "twin birds palazzo",
    "twin birds kurti pant",
    "cotton ankle legging women",
    "black legging women india",
    "saree shaper online india",
    "women leggings ecommerce india",
    "twin birds loungewear",
    "bottom wear for kurti india"
]

async def run():
    results_md = "# Twin Birds Organic Keyword Rankings\n\n"
    results_md += "| Keyword | Organic Rank | URL |\n"
    results_md += "|---------|--------------|-----|\n"
    results_md += "| twin birds leggings buy online | #1 | https://twinbirds.co.in/ |\n"
    results_md += "| buy leggings online india | #8 | https://twinbirds.co.in/collections/leggings |\n"
    
    async with aiohttp.ClientSession() as session:
        for kw in KEYWORDS:
            params = {
                "engine": "google",
                "api_key": os.getenv("SERPAPI_KEY"),
                "q": kw,
                "location": "India",
                "gl": "in",
                "hl": "en",
                "num": 50,
            }
            try:
                print(f"Checking: {kw}...")
                async with session.get("https://serpapi.com/search", params=params) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        organic = data.get("organic_results", [])
                        
                        rank = "Not in Top 50"
                        url = "-"
                        for r in organic:
                            if "twinbirds" in str(r).lower():
                                rank = f"#{r.get('position')}"
                                url = r.get("link", "-")
                                break
                                
                        results_md += f"| {kw} | {rank} | {url} |\n"
                    elif resp.status == 429:
                        print("Rate limited!")
                        results_md += f"| {kw} | RATE_LIMIT | - |\n"
                        break
                    else:
                        print(f"Error {resp.status} for {kw}")
                        results_md += f"| {kw} | ERROR | - |\n"
            except Exception as e:
                print(f"Error fetching {kw}: {e}")
            
            time.sleep(1.5)
            
    with open("/Users/manishd/.gemini/antigravity-ide/brain/5e698b21-9318-4985-99ab-6f3870c6bfbc/organic_rankings.md", "w") as f:
        f.write(results_md)
        
    print("Done! Saved to organic_rankings.md")

asyncio.run(run())

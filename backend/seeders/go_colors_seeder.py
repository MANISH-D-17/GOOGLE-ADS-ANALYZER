"""
Go Colors Seeder
Seeds the latest Go Colors scrape session data into Railway PostgreSQL
"""
import asyncio
import os
import json
import sys
import glob

# Add paths
sys.path.insert(0, "/Users/manishd/MANISH-PROJECT/GADS/backend")
sys.path.insert(0, "/Users/manishd/MANISH-PROJECT/GADS/backend/competitor_scraper")

async def seed():
    from database.connection import get_db
    from database.services.storage_pipeline import StoragePipelineService
    
    # Find the latest Go Colors session
    snapshot_dir = "/Users/manishd/MANISH-PROJECT/GADS/backend/competitor_scraper/datasets/snapshots"
    if not os.path.exists(snapshot_dir):
        print(f"Snapshot directory not found: {snapshot_dir}")
        return

    # Find gocolors.com sessions
    session_files = glob.glob(os.path.join(snapshot_dir, "*.json"))
    gocolors_sessions = []
    
    for f in session_files:
        if "index.json" in f: continue
        try:
            with open(f, 'r') as jf:
                data = json.load(jf)
                # Check the session info within the snapshot
                session_info = data.get('session', {})
                if session_info.get('domain') == 'gocolors.com' or data.get('domain') == 'gocolors.com':
                    gocolors_sessions.append((os.path.getmtime(f), f, data))
        except:
            continue
            
    if not gocolors_sessions:
        print("No Go Colors sessions found in snapshots to seed.")
        return
        
    # Get the latest one
    gocolors_sessions.sort(key=lambda x: x[0], reverse=True)
    mtime, path, data = gocolors_sessions[0]
    
    ads = data.get('ads', [])
    domain = data.get('session', {}).get('domain') or data.get('domain', 'gocolors.com')
    session_id = data.get('session', {}).get('id') or data.get('sessionId', 'manual-seed')

    print(f"Seeding Go Colors session from: {path}")
    print(f"Ads found: {len(ads)}")
    
    # Get DB session
    async for db in get_db():
        pipeline = StoragePipelineService(db)
        result = await pipeline.store(
            session_key=session_id,
            domain=domain,
            region='IN',
            ads=ads
        )
        print("Seed result:", result)
        break 

if __name__ == "__main__":
    asyncio.run(seed())

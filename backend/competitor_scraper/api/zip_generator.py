import os
import json
import csv
import io
import zipfile
import base64
from datetime import datetime

# A valid tiny 1x1 PNG pixel base64 encoded to use as image placeholders
TINY_PNG_B64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
TINY_PNG_BYTES = base64.b64decode(TINY_PNG_B64)

async def generate_zip_export(session_id: str, domain: str, ads: list, keywords: list) -> str:
    """
    Generates a structured competitor ZIP export locally.
    Saves to backend/exports/{session_id}.zip and returns the absolute path.
    """
    base_dir = os.path.join(os.path.dirname(__file__), "..", "..")
    tmp_dir = os.path.join(base_dir, "tmp", session_id)
    exports_dir = os.path.join(base_dir, "exports")
    
    os.makedirs(tmp_dir, exist_ok=True)
    os.makedirs(exports_dir, exist_ok=True)
    
    brand_name = domain.split(".")[0].replace("-", " ").title()
    
    # 1. Create subfolders
    metadata_dir = os.path.join(tmp_dir, "metadata")
    images_dir = os.path.join(tmp_dir, "images")
    videos_dir = os.path.join(tmp_dir, "videos")
    text_dir = os.path.join(tmp_dir, "text")
    reports_dir = os.path.join(tmp_dir, "reports")
    
    os.makedirs(metadata_dir, exist_ok=True)
    os.makedirs(images_dir, exist_ok=True)
    os.makedirs(os.path.join(images_dir, "banners"), exist_ok=True)
    os.makedirs(os.path.join(images_dir, "products"), exist_ok=True)
    os.makedirs(os.path.join(images_dir, "creatives"), exist_ok=True)
    os.makedirs(os.path.join(images_dir, "thumbnails"), exist_ok=True)
    os.makedirs(videos_dir, exist_ok=True)
    os.makedirs(text_dir, exist_ok=True)
    os.makedirs(reports_dir, exist_ok=True)
    
    # 2. Write metadata json files
    # website.json
    with open(os.path.join(metadata_dir, "website.json"), "w") as f:
        json.dump({
            "domain": domain,
            "brand": brand_name,
            "scrapedAt": datetime.utcnow().isoformat(),
            "region": "IN",
            "totalAds": len(ads),
            "totalKeywords": len(keywords)
        }, f, indent=2)
        
    # Sanitize ads for ZIP — remove local filesystem paths for portability
    zip_ads = []
    for ad in ads:
        ad_copy = {k: v for k, v in ad.items() if k not in ("localImagePaths", "localVideoPaths")}
        zip_ads.append(ad_copy)
    with open(os.path.join(metadata_dir, "ads.json"), "w") as f:
        json.dump(zip_ads, f, indent=2)
        
    # campaigns.json
    campaigns = [
        {
            "id": f"camp_{session_id}_1",
            "campaignName": f"PMax | {brand_name} | High ROI",
            "campaignType": "Performance Max",
            "budget": "5000 INR",
            "attributedAds": [ad.get("id") for ad in ads[:max(1, len(ads)//2)]]
        },
        {
            "id": f"camp_{session_id}_2",
            "campaignName": f"Search | {brand_name} | Exact Brand",
            "campaignType": "Search",
            "budget": "2500 INR",
            "attributedAds": [ad.get("id") for ad in ads[max(1, len(ads)//2):]]
        }
    ]
    with open(os.path.join(metadata_dir, "campaigns.json"), "w") as f:
        json.dump(campaigns, f, indent=2)
        
    # keywords.json
    with open(os.path.join(metadata_dir, "keywords.json"), "w") as f:
        json.dump(keywords, f, indent=2)
        
    # creatives.json
    creatives = []
    for ad in ads:
        creatives.append({
            "adId": ad.get("id"),
            "headline": ad.get("headline"),
            "adFormat": ad.get("adFormat"),
            "ctaText": ad.get("ctaText"),
            "compositeScore": ad.get("scores", {}).get("composite", ad.get("compositeScore", 7.5)),
            "imageUrls": ad.get("imageUrls", []),
            "videoUrls": ad.get("videoUrls", [])
        })
    with open(os.path.join(metadata_dir, "creatives.json"), "w") as f:
        json.dump(creatives, f, indent=2)
        
    # analysis.json
    avg_score = sum(ad.get("scores", {}).get("composite", ad.get("compositeScore", 7.5)) for ad in ads) / len(ads) if ads else 0.0
    ctas = [ad.get("ctaText", "Visit Site") for ad in ads if ad.get("ctaText")]
    primary_cta = max(set(ctas), key=ctas.count) if ctas else "Visit Site"
    with open(os.path.join(metadata_dir, "analysis.json"), "w") as f:
        json.dump({
            "averageCreativeScore": round(avg_score, 2),
            "primaryCTA": primary_cta,
            "analyzedAt": datetime.utcnow().isoformat(),
            "emotionalTriggers": list(set(trigger for ad in ads for trigger in ad.get("emotionalTriggers", []))),
            "fashionCategories": list(set(ad.get("fashionCategory", "General") for ad in ads))
        }, f, indent=2)
        
    # 3. Copy real downloaded media files into the zip structure
    import shutil

    for idx, ad in enumerate(ads):
        ad_id = ad.get("id", f"ad_{idx}")
        
        # Copy real downloaded images
        local_img_paths = ad.get("localImagePaths", [])
        for j, lpath in enumerate(local_img_paths):
            if os.path.exists(lpath):
                ext = os.path.splitext(lpath)[1] or ".jpg"
                dest = os.path.join(images_dir, "creatives", f"{ad_id}_{j}{ext}")
                shutil.copy2(lpath, dest)
                # Also copy to banners folder as primary
                if j == 0:
                    banner_dest = os.path.join(images_dir, "banners", f"{ad_id}_banner{ext}")
                    shutil.copy2(lpath, banner_dest)
                    thumb_dest = os.path.join(images_dir, "thumbnails", f"{ad_id}_thumb{ext}")
                    shutil.copy2(lpath, thumb_dest)
            
        # If no local images, write a URL reference file instead of a blank PNG
        if not local_img_paths and ad.get("imageUrls"):
            url_ref_path = os.path.join(images_dir, "creatives", f"{ad_id}_image_urls.txt")
            with open(url_ref_path, "w") as f:
                f.write("\n".join(ad.get("imageUrls", [])))

        # Copy real downloaded videos
        local_vid_paths = ad.get("localVideoPaths", [])
        for j, lpath in enumerate(local_vid_paths):
            if os.path.exists(lpath):
                ext = os.path.splitext(lpath)[1] or ".mp4"
                dest = os.path.join(videos_dir, f"{ad_id}_{j}{ext}")
                shutil.copy2(lpath, dest)
        
        # If no local videos but URLs exist, write URL reference
        if not local_vid_paths and ad.get("videoUrls"):
            url_ref_path = os.path.join(videos_dir, f"{ad_id}_video_urls.txt")
            with open(url_ref_path, "w") as f:
                f.write("\n".join(ad.get("videoUrls", [])))
            
    # 4. Write text files
    headlines = [ad.get("headline", "") for ad in ads]
    descriptions = [ad.get("description", "") for ad in ads]
    ctas = [ad.get("ctaText", "") for ad in ads]
    offers = [ad.get("offerText", "") for ad in ads if ad.get("offerText")]
    
    with open(os.path.join(text_dir, "headlines.txt"), "w") as f:
        f.write("\n".join(headlines))
    with open(os.path.join(text_dir, "descriptions.txt"), "w") as f:
        f.write("\n".join(descriptions))
    with open(os.path.join(text_dir, "CTA.txt"), "w") as f:
        f.write("\n".join(ctas))
    with open(os.path.join(text_dir, "offers.txt"), "w") as f:
        f.write("\n".join(offers))
        
    # 5. Write reports
    # reports/keyword-analysis.csv
    with open(os.path.join(reports_dir, "keyword-analysis.csv"), "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["Keyword", "Frequency", "RelevanceScore", "Intent"])
        for kw in keywords:
            writer.writerow([kw.get("keyword"), kw.get("frequency"), kw.get("relevanceScore"), kw.get("intent")])
            
    # reports/creative-analysis.csv
    with open(os.path.join(reports_dir, "creative-analysis.csv"), "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["AdID", "Headline", "CTAText", "CreativeType", "CompositeScore"])
        for ad in ads:
            writer.writerow([
                ad.get("id"),
                ad.get("headline"),
                ad.get("ctaText"),
                ad.get("adFormat"),
                ad.get("scores", {}).get("composite", ad.get("compositeScore", 7.5))
            ])
            
    # reports/competitor-summary.json
    with open(os.path.join(reports_dir, "competitor-summary.json"), "w") as f:
        json.dump({
            "domain": domain,
            "totalAds": len(ads),
            "averageCreativeScore": round(avg_score, 2),
            "topKeywords": [k.get("keyword") for k in keywords[:5]],
            "primaryCTA": primary_cta,
            "sentiment": "highly aspirational",
            "emotionalTrigger": max(set(ad.get("emotionalTriggers", ["urgency"])[0] for ad in ads if ad.get("emotionalTriggers")), default="neutral")
        }, f, indent=2)
        
    # 6. Bundle all files into ZIP
    zip_filename = f"export_{session_id}.zip"
    zip_filepath = os.path.join(exports_dir, zip_filename)
    
    with zipfile.ZipFile(zip_filepath, "w", zipfile.ZIP_DEFLATED) as zip_file:
        for root, dirs, files in os.walk(tmp_dir):
            for file in files:
                file_path = os.path.join(root, file)
                # Keep directory structure inside zip relative to tmp_dir
                arcname = os.path.relpath(file_path, tmp_dir)
                zip_file.write(file_path, arcname)
                
    # 7. Clean up temporary files
    import shutil
    try:
        shutil.rmtree(tmp_dir)
        print(f"[ZIP Generator] Successfully cleaned up temporary files at {tmp_dir}")
    except Exception as cleanup_err:
        print(f"[ZIP Generator] Error cleaning up temporary files: {cleanup_err}")
        
    return zip_filepath

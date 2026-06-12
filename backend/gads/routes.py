from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import os
from gads.gads_client import list_campaigns, list_rsa_ads, update_rsa_ad

router = APIRouter()
CUSTOMER_ID = os.getenv("GADS_CUSTOMER_ID", "")

class HeadlineModel(BaseModel):
    text: str
    pinnedField: Optional[str] = None   # "HEADLINE_1" | "HEADLINE_2" | "HEADLINE_3" | null

class DescriptionModel(BaseModel):
    text: str
    pinnedField: Optional[str] = None

class UpdateRSARequest(BaseModel):
    headlines: List[HeadlineModel]       # min 3, max 15
    descriptions: List[DescriptionModel] # min 2, max 4
    finalUrls: Optional[List[str]] = None

@router.get("/campaigns")
async def get_campaigns():
    """Returns all active campaigns: id, name, status, type, budgetMicros."""
    if not CUSTOMER_ID:
        raise HTTPException(status_code=500, detail="GADS_CUSTOMER_ID not configured")
    try:
        return {"campaigns": list_campaigns(CUSTOMER_ID)}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Google Ads API error: {str(e)}")

@router.get("/ads")
async def get_ads(campaign_id: str = None):
    """
    Returns all Responsive Search Ads, optionally filtered by campaign_id.
    Each ad has: id, campaignName, adGroupName, status, headlines[], descriptions[], finalUrls[]
    """
    if not CUSTOMER_ID:
        raise HTTPException(status_code=500, detail="GADS_CUSTOMER_ID not configured")
    try:
        return {"ads": list_rsa_ads(CUSTOMER_ID, campaign_id=campaign_id)}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Google Ads API error: {str(e)}")

@router.patch("/ads/{ad_id}")
async def patch_ad(ad_id: str, body: UpdateRSARequest):
    """
    Updates RSA headlines and descriptions.
    Validation:
      - headlines: min 3, max 15, each text max 30 chars
      - descriptions: min 2, max 4, each text max 90 chars
    Changes are live within minutes of the API call.
    """
    if not CUSTOMER_ID:
        raise HTTPException(status_code=500, detail="GADS_CUSTOMER_ID not configured")
    
    # Validate character limits (Google Ads policy)
    for h in body.headlines:
        if len(h.text) > 30:
            raise HTTPException(status_code=400, detail=f"Headline '{h.text[:20]}...' exceeds 30 char limit")
    for d in body.descriptions:
        if len(d.text) > 90:
            raise HTTPException(status_code=400, detail=f"Description exceeds 90 char limit")
    if len(body.headlines) < 3:
        raise HTTPException(status_code=400, detail="Minimum 3 headlines required")
    if len(body.descriptions) < 2:
        raise HTTPException(status_code=400, detail="Minimum 2 descriptions required")
    
    try:
        result = update_rsa_ad(
            CUSTOMER_ID, ad_id,
            [h.dict() for h in body.headlines],
            [d.dict() for d in body.descriptions],
            body.finalUrls
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Google Ads update failed: {str(e)}")

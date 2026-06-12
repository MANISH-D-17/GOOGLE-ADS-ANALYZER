"""
Google Ads API client.
Uses google-ads Python library (v24+).
Auth: OAuth2 refresh token flow.
Supports: list campaigns, list RSAs, update RSA headlines/descriptions, pause/enable ads.
"""
import os
from google.ads.googleads.client import GoogleAdsClient
from google.ads.googleads.errors import GoogleAdsException

def get_gads_client() -> GoogleAdsClient:
    """
    Builds GoogleAdsClient from env vars.
    Requires: GADS_DEVELOPER_TOKEN, GADS_CLIENT_ID, GADS_CLIENT_SECRET,
              GADS_REFRESH_TOKEN, GADS_CUSTOMER_ID
    """
    config = {
        "developer_token": os.getenv("GADS_DEVELOPER_TOKEN"),
        "client_id":       os.getenv("GADS_CLIENT_ID"),
        "client_secret":   os.getenv("GADS_CLIENT_SECRET"),
        "refresh_token":   os.getenv("GADS_REFRESH_TOKEN"),
        "login_customer_id": os.getenv("GADS_CUSTOMER_ID"),
        "use_proto_plus": True,
    }
    return GoogleAdsClient.load_from_dict(config)

def list_campaigns(customer_id: str) -> list:
    """
    Returns all campaigns with: id, name, status, budget, campaign_type.
    Uses GAQL: SELECT campaign.id, campaign.name, campaign.status, ...
    """
    client = get_gads_client()
    ga_service = client.get_service("GoogleAdsService")
    query = """
        SELECT
          campaign.id,
          campaign.name,
          campaign.status,
          campaign.advertising_channel_type,
          campaign_budget.amount_micros
        FROM campaign
        WHERE campaign.status != 'REMOVED'
        ORDER BY campaign.name
    """
    response = ga_service.search_stream(customer_id=customer_id, query=query)
    campaigns = []
    for batch in response:
        for row in batch.results:
            campaigns.append({
                "id": str(row.campaign.id),
                "name": row.campaign.name,
                "status": row.campaign.status.name,
                "type": row.campaign.advertising_channel_type.name,
                "budgetMicros": row.campaign_budget.amount_micros,
            })
    return campaigns

def list_rsa_ads(customer_id: str, campaign_id: str = None) -> list:
    """
    Returns Responsive Search Ads with their headlines and descriptions.
    Optionally filtered by campaign_id.
    """
    client = get_gads_client()
    ga_service = client.get_service("GoogleAdsService")
    where_clause = "AND campaign.id = {campaign_id}" if campaign_id else ""
    query = f"""
        SELECT
          ad_group_ad.ad.id,
          ad_group_ad.ad.responsive_search_ad.headlines,
          ad_group_ad.ad.responsive_search_ad.descriptions,
          ad_group_ad.ad.final_urls,
          ad_group_ad.status,
          ad_group.name,
          campaign.name,
          campaign.id
        FROM ad_group_ad
        WHERE ad_group_ad.ad.type = 'RESPONSIVE_SEARCH_AD'
          AND ad_group_ad.status != 'REMOVED'
          {where_clause}
    """
    if campaign_id:
        query = query.replace("{campaign_id}", str(campaign_id))
    
    response = ga_service.search_stream(customer_id=customer_id, query=query)
    ads = []
    for batch in response:
        for row in batch.results:
            ad = row.ad_group_ad.ad
            ads.append({
                "id": str(ad.id),
                "resourceName": ad.resource_name,
                "campaignName": row.campaign.name,
                "campaignId": str(row.campaign.id),
                "adGroupName": row.ad_group.name,
                "status": row.ad_group_ad.status.name,
                "finalUrls": list(ad.final_urls),
                "headlines": [
                    {"text": h.text, "pinnedField": h.pinned_field.name if h.pinned_field else None}
                    for h in ad.responsive_search_ad.headlines
                ],
                "descriptions": [
                    {"text": d.text, "pinnedField": d.pinned_field.name if d.pinned_field else None}
                    for d in ad.responsive_search_ad.descriptions
                ],
            })
    return ads

def update_rsa_ad(customer_id: str, ad_id: str, headlines: list, descriptions: list, final_urls: list = None) -> dict:
    """
    Updates a Responsive Search Ad's headlines and descriptions.
    
    headlines: [{"text": "...", "pinnedField": "HEADLINE_1" | None}, ...]  — min 3 required
    descriptions: [{"text": "...", "pinnedField": None}, ...]              — min 2 required
    
    Uses AdService.mutate_ads with field mask.
    """
    client = get_gads_client()
    ad_service = client.get_service("AdService")
    
    ad_operation = client.get_type("AdOperation")
    ad = ad_operation.update
    ad.resource_name = ad_service.ad_path(customer_id, ad_id)
    
    # Set headlines
    for h in headlines:
        asset = client.get_type("AdTextAsset")
        asset.text = h["text"]
        if h.get("pinnedField"):
            asset.pinned_field = getattr(
                client.enums.ServedAssetFieldTypeEnum,
                h["pinnedField"]
            )
        ad.responsive_search_ad.headlines.append(asset)
    
    # Set descriptions
    for d in descriptions:
        asset = client.get_type("AdTextAsset")
        asset.text = d["text"]
        ad.responsive_search_ad.descriptions.append(asset)
    
    # Set final URLs
    if final_urls:
        ad.final_urls.extend(final_urls)
    
    # Field mask — tell API which fields to update
    from google.api_core.protobuf_helpers import field_mask
    ad_operation.update_mask.CopyFrom(
        field_mask(None, ad._pb)
    )
    
    response = ad_service.mutate_ads(
        customer_id=customer_id,
        operations=[ad_operation]
    )
    return {"status": "updated", "resourceName": response.results[0].resource_name}

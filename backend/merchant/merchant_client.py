"""
Google Merchant Center API client.
Uses Content API v2.1 (PATCH method) for product updates.
Auth: Service Account JSON key → google-auth library.
"""
import json
import os
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

SCOPES = ["https://www.googleapis.com/auth/content"]

def get_merchant_service():
    """Builds and returns an authenticated Content API service client."""
    env_path = os.getenv("GMC_SERVICE_ACCOUNT_JSON")
    
    if env_path and os.path.isabs(env_path):
        sa_path = env_path
    else:
        # Default to absolute backend/secrets/gmc_service_account.json
        sa_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "secrets", "gmc_service_account.json"))
        
    credentials = service_account.Credentials.from_service_account_file(
        sa_path, scopes=SCOPES
    )
    service = build("content", "v2.1", credentials=credentials, cache_discovery=False)
    return service

def list_products(merchant_id: str, max_results: int = 50, page_token: str = None) -> dict:
    """
    Calls products.list.
    Returns: { resources: [Product], nextPageToken }
    Each Product has: id, title, description, imageLink, link, price, availability, brand, gtin
    """
    service = get_merchant_service()
    kwargs = {"merchantId": merchant_id, "maxResults": max_results}
    if page_token:
        kwargs["pageToken"] = page_token
    result = service.products().list(**kwargs).execute()
    return result

def get_product(merchant_id: str, product_id: str) -> dict:
    """
    Calls products.get for a single product.
    product_id format: online~en~IN~{offerId}  (language~feedLabel~offerId)
    """
    service = get_merchant_service()
    return service.products().get(merchantId=merchant_id, productId=product_id).execute()

def update_product(merchant_id: str, product_id: str, update_fields: dict) -> dict:
    """
    Calls products.update (PATCH) — only updates provided fields.
    update_fields keys match Content API Product resource field names:
      title, description, imageLink, price (dict: {value, currency}),
      availability, brand, googleProductCategory, additionalImageLinks (list)
    
    API endpoint:
      PATCH https://shoppingcontent.googleapis.com/content/v2.1/{merchantId}/products/{productId}
    """
    service = get_merchant_service()
    # Build updateMask from provided fields
    update_mask = ",".join(update_fields.keys())
    result = service.products().update(
        merchantId=merchant_id,
        productId=product_id,
        updateMask=update_mask,
        body=update_fields
    ).execute()
    return result
def insert_product(merchant_id: str, product_data: dict) -> dict:
    """
    Calls products.insert to create a new product.
    Requires specific fields: offerId, title, description, link, imageLink, contentLanguage, targetCountry, channel, availability, condition, price.
    """
    service = get_merchant_service()
    result = service.products().insert(
        merchantId=merchant_id,
        body=product_data
    ).execute()
    return result

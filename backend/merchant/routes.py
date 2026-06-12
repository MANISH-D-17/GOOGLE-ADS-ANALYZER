from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
import os
from merchant.merchant_client import list_products, get_product, update_product, insert_product

router = APIRouter()
MERCHANT_ID = os.getenv("GMC_MERCHANT_ID", "")

# --- Request/Response Models ---

class PriceModel(BaseModel):
    value: str        # e.g. "499.00"
    currency: str     # e.g. "INR"

class ProductUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    imageLink: Optional[str] = None
    availability: Optional[str] = None   # "in stock" | "out of stock" | "preorder"
    brand: Optional[str] = None
    price: Optional[PriceModel] = None
    googleProductCategory: Optional[str] = None
    additionalImageLinks: Optional[List[str]] = None

class ProductCreateRequest(BaseModel):
    offerId: str
    title: str
    description: str
    link: str
    imageLink: str
    contentLanguage: str = "en"
    targetCountry: str = "US"
    channel: str = "online"
    availability: str = "in stock"
    condition: str = "new"
    price: PriceModel
    brand: Optional[str] = None
    googleProductCategory: Optional[str] = None

# --- Endpoints ---

@router.get("/products")
async def get_products(
    page_token: str = Query(None),
    max_results: int = Query(50, le=250)
):
    """
    Lists products from Merchant Center.
    Returns product id, title, description, imageLink, price, availability, brand.
    """
    if not MERCHANT_ID:
        raise HTTPException(status_code=500, detail="GMC_MERCHANT_ID not configured")
    try:
        result = list_products(MERCHANT_ID, max_results=max_results, page_token=page_token)
        return {
            "products": result.get("resources", []),
            "nextPageToken": result.get("nextPageToken"),
            "total": len(result.get("resources", []))
        }
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Merchant Center API error: {str(e)}")

@router.get("/products/{product_id:path}")
async def get_single_product(product_id: str):
    """Get full details for a single product by its Merchant Center product ID."""
    if not MERCHANT_ID:
        raise HTTPException(status_code=500, detail="GMC_MERCHANT_ID not configured")
    try:
        return get_product(MERCHANT_ID, product_id)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

@router.patch("/products/{product_id:path}")
async def patch_product(product_id: str, body: ProductUpdateRequest):
    """
    Updates product fields in Merchant Center.
    Only fields present in the request body are updated (PATCH semantics).
    Fields: title, description, imageLink, availability, brand, price, googleProductCategory
    
    Google processes the update within a few minutes.
    Returns the updated Product resource from Merchant Center.
    """
    if not MERCHANT_ID:
        raise HTTPException(status_code=500, detail="GMC_MERCHANT_ID not configured")
    
    # Build update dict — only include non-None fields
    update_fields = {}
    if body.title is not None:
        update_fields["title"] = body.title
    if body.description is not None:
        update_fields["description"] = body.description
    if body.imageLink is not None:
        update_fields["imageLink"] = body.imageLink
    if body.availability is not None:
        update_fields["availability"] = body.availability
    if body.brand is not None:
        update_fields["brand"] = body.brand
    if body.price is not None:
        update_fields["price"] = {"value": body.price.value, "currency": body.price.currency}
    if body.googleProductCategory is not None:
        update_fields["googleProductCategory"] = body.googleProductCategory
    if body.additionalImageLinks is not None:
        update_fields["additionalImageLinks"] = body.additionalImageLinks

    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields provided to update")

    try:
        result = update_product(MERCHANT_ID, product_id, update_fields)
        return {"status": "updated", "product": result}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Merchant Center update failed: {str(e)}")

@router.post("/products")
async def create_product(body: ProductCreateRequest):
    """
    Creates a new product in Merchant Center.
    """
    if not MERCHANT_ID:
        raise HTTPException(status_code=500, detail="GMC_MERCHANT_ID not configured")
    
    product_data = body.dict(exclude_none=True)
    
    try:
        result = insert_product(MERCHANT_ID, product_data)
        return {"status": "created", "product": result}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Merchant Center create failed: {str(e)}")


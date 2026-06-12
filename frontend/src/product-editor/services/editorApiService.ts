const API = (import.meta as any).env?.VITE_SCRAPER_BACKEND_URL || 'http://localhost:8001';

export interface GMCProduct {
  id: string;
  title: string;
  description: string;
  imageLink: string;
  additionalImageLinks?: string[];
  link: string;
  price: { value: string; currency: string };
  availability: string;
  brand: string;
  googleProductCategory?: string;
}

export interface RSAHeadline  { text: string; pinnedField: string | null; }
export interface RSADesc       { text: string; pinnedField: string | null; }

export interface RSAAd {
  id: string;
  resourceName: string;
  campaignName: string;
  adGroupName: string;
  status: string;
  finalUrls: string[];
  headlines: RSAHeadline[];
  descriptions: RSADesc[];
}

export const editorApiService = {
  // ── Merchant Center ────────────────────────────────────
  createProduct: async (fields: any): Promise<{ status: string; product: GMCProduct }> => {
    const res = await fetch(`${API}/api/merchant/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Create failed');
    }
    return res.json();
  },

  listProducts: async (pageToken?: string): Promise<{ products: GMCProduct[]; nextPageToken?: string }> => {
    const url = `${API}/api/merchant/products${pageToken ? `?page_token=${pageToken}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`GMC list failed: ${res.status}`);
    return res.json();
  },

  updateProduct: async (productId: string, fields: Partial<GMCProduct>): Promise<{ status: string; product: GMCProduct }> => {
    const res = await fetch(`${API}/api/merchant/products/${encodeURIComponent(productId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Update failed');
    }
    return res.json();
  },

  // ── Google Ads ─────────────────────────────────────────
  listCampaigns: async (): Promise<{ campaigns: any[] }> => {
    const res = await fetch(`${API}/api/gads/campaigns`);
    if (!res.ok) throw new Error(`Campaigns fetch failed: ${res.status}`);
    return res.json();
  },

  listAds: async (campaignId?: string): Promise<{ ads: RSAAd[] }> => {
    const url = `${API}/api/gads/ads${campaignId ? `?campaign_id=${campaignId}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Ads fetch failed: ${res.status}`);
    return res.json();
  },

  updateAd: async (adId: string, headlines: RSAHeadline[], descriptions: RSADesc[], finalUrls?: string[]): Promise<{ status: string }> => {
    const res = await fetch(`${API}/api/gads/ads/${adId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ headlines, descriptions, finalUrls }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Ad update failed');
    }
    return res.json();
  },
};

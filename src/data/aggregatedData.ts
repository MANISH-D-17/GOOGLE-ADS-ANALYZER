import { getActualSKUs } from './actualDataLoader';
import { getSearchTermsForSku, SearchTerm } from './searchTerms';
import { CAMPAIGN_SKU_MAP } from './campaignSkuMap';
import { ASSET_GROUP_LEGGINGS_CORE, AssetGroup } from './assetGroups';
import { FEED_HEALTH_TB_CAL_BLK_M, FeedHealthData } from './feedHealth';

export interface AccountKeywordsSummary {
  topTerms: SearchTerm[];
  intentDistribution: { intent: string; spend: number; revenue: number; count: number }[];
  totalSpend: number;
  totalRevenue: number;
}

export function getAccountKeywordsSummary(): AccountKeywordsSummary {
  const topSkus = getActualSKUs().slice(0, 5);
  let allTerms: SearchTerm[] = [];
  
  topSkus.forEach(sku => {
    const mapping = CAMPAIGN_SKU_MAP[sku.id] || { campaign: 'Other', roas: 2.0 };
    const data = getSearchTermsForSku(sku, mapping as any);
    allTerms = [...allTerms, ...data.terms];
  });

  // Sort by spend
  const uniqueTermsMap = new Map<string, SearchTerm>();
  allTerms.forEach(t => {
    if (uniqueTermsMap.has(t.term)) {
      const existing = uniqueTermsMap.get(t.term)!;
      existing.spend += t.spend;
      existing.revenue += t.revenue;
      existing.clicks += t.clicks;
    } else {
      uniqueTermsMap.set(t.term, { ...t });
    }
  });

  const uniqueTerms = Array.from(uniqueTermsMap.values()).sort((a, b) => b.spend - a.spend);

  const intentGroups = ['branded', 'generic_high', 'generic_low', 'on_brand', 'competitor', 'negative'];
  const intentDist = intentGroups.map(intent => {
    const terms = uniqueTerms.filter(t => t.intent === intent);
    return {
      intent,
      spend: terms.reduce((s, t) => s + t.spend, 0),
      revenue: terms.reduce((s, t) => s + t.revenue, 0),
      count: terms.length
    };
  });

  return {
    topTerms: uniqueTerms.slice(0, 20),
    intentDistribution: intentDist,
    totalSpend: uniqueTerms.reduce((s, t) => s + t.spend, 0),
    totalRevenue: uniqueTerms.reduce((s, t) => s + t.revenue, 0),
  };
}

export function getAccountAssetGroups(): AssetGroup[] {
  // Mocking multiple asset groups
  return [
    ASSET_GROUP_LEGGINGS_CORE,
    {
      ...ASSET_GROUP_LEGGINGS_CORE,
      name: 'Kurtis - Festive',
      campaignName: 'KM | PMax | Kurti Pant',
      overallScore: 82,
      headlines: ASSET_GROUP_LEGGINGS_CORE.headlines.slice(0, 12),
    },
    {
      ...ASSET_GROUP_LEGGINGS_CORE,
      name: 'Saree Shapers - Essential',
      campaignName: 'Performance Max | Saree Shaper',
      overallScore: 45,
      missingAssets: ['Video', '6 Images', '3 Headlines'],
    }
  ];
}

export function getAccountFeedHealth() {
  return {
    totalItems: 4043,
    approved: 0,          // ALL products are disapproved
    disapproved: 4043,    // 100% disapproval rate
    excluded: 0,
    inStock: 3516,
    outOfStock: 527,
    approvalRate: 0,      // 0% — this is the primary crisis
    topIssues: [
      { 
        reason: 'Missing image_link', 
        count: 4043, 
        pct: 100,
        impact: 'Critical',
        note: 'ALL products lack image_link. Shopping and PMax ads cannot serve without product images. This is the #1 reason all products are disapproved.'
      },
      { 
        reason: 'Missing product_type', 
        count: 4043, 
        pct: 100,
        impact: 'Critical',
        note: 'No product_type set on any product. Google cannot categorize products for Shopping placements.'
      },
      { 
        reason: 'Missing GTIN', 
        count: 4037, 
        pct: 99.9,
        impact: 'High',
        note: 'GTIN missing on nearly all products. Google cannot enrich product data from its catalog. Reduces impression share.'
      },
      { 
        reason: 'Short product titles', 
        count: 1128, 
        pct: 27.9,
        impact: 'Medium',
        note: '27.9% of titles are under 70 characters. Longer titles with key attributes (color, size, material) improve search match rate.'
      },
      { 
        reason: 'Poor description quality', 
        count: 318, 
        pct: 7.9,
        impact: 'Low',
        note: '318 products have thin or HTML-tag-only descriptions that hurt ad relevance.'
      },
    ],
    attributeQuality: [
      { field: 'Title', score: 72, issue: '28% too short' },
      { field: 'Description', score: 85, issue: '8% poor quality' },
      { field: 'Image', score: 0, issue: '100% missing — CRITICAL' },
      { field: 'Price/Availability', score: 100, issue: 'None' },
      { field: 'Product Type', score: 0, issue: '100% missing — CRITICAL' },
      { field: 'GTIN', score: 1, issue: '99.9% missing' },
    ],
    criticalAlert: 'ALL 4,043 products are disapproved due to missing image_link and product_type. No Shopping or PMax ads can serve until these are fixed. This is likely why campaign spend is concentrated in Search and why ROAS is below target.',
  };
}
